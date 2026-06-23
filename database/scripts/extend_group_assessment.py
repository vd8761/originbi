#!/usr/bin/env python3
"""
Extend (re-open) one or more *group assessments* whose window expired.

Why this exists
---------------
A group assessment is gated in three tiers, each with its own deadline + status.
A background scheduler (backend/exam-engine/internal/service/scheduler.go) runs
every 2 minutes and, once a deadline is in the past, flips the row to a terminal
status:

    group_assessments   valid_to     -> EXPIRED / PARTIALLY_EXPIRED
    assessment_sessions  valid_to     -> EXPIRED / PARTIALLY_EXPIRED   (per candidate)
    assessment_attempts  expires_at   -> EXPIRED / PARTIALLY_EXPIRED   (per level)

Because the scheduler treats EXPIRED / PARTIALLY_EXPIRED as terminal (it never
re-processes them), simply bumping the date is NOT enough -- the rows stay stuck.
This script does both in ONE transaction:

  * pushes every relevant deadline to the new end time, AND
  * resets the status so candidates can resume:
        EXPIRED           -> NOT_STARTED
        PARTIALLY_EXPIRED -> IN_PROGRESS   (resume mid-exam)
  * COMPLETED candidates are never touched (scores preserved).

Because all deadlines are now in the future, the scheduler leaves them alone.

Usage
-----
Dry run (default -- shows what WOULD change, commits nothing):
    python extend_group_assessment.py --ids 77 78 --days 3
    python extend_group_assessment.py --names "KIOT MBA" "KIOT MBA IEV" --days 3

Apply for real:
    python extend_group_assessment.py --ids 77 78 --days 3 --apply

Explicit end instead of +N days (timestamptz, keep the offset):
    python extend_group_assessment.py --ids 77 78 --until "2026-06-12 18:00:00+05:30" --apply

Discover expired group assessments:
    python extend_group_assessment.py --list

Connection (env, same convention as the other repo scripts):
    DB_HOST (localhost)  DB_PORT (5432)  DB_USER (postgres)
    DB_PASS (postgres)   DB_NAME (originbi)
  or a single DATABASE_URL=postgres://user:pass@host:port/db
"""

import argparse
import os
import sys
from datetime import timedelta

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit(
        "psycopg2 is required.  Install it with:\n"
        "    pip install psycopg2-binary"
    )

# Statuses that mean "the candidate is finished" -- never modified.
TERMINAL_OK = "COMPLETED"
# Statuses the scheduler parks rows in once the window passes.
EXPIRED_STATES = ("EXPIRED", "PARTIALLY_EXPIRED")


# --------------------------------------------------------------------------- #
# Connection
# --------------------------------------------------------------------------- #
def connect():
    dsn = os.environ.get("DATABASE_URL")
    if dsn:
        return psycopg2.connect(dsn)
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASS", "postgres"),
        dbname=os.environ.get("DB_NAME", "originbi"),
    )


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def resolve_ids(cur, ids, names):
    """Return the concrete group_assessments.id list to act on."""
    if ids:
        cur.execute(
            """
            SELECT ga.id, g.name, ga.status, ga.valid_to, ga.total_candidates
            FROM group_assessments ga
            JOIN groups g ON g.id = ga.group_id
            WHERE ga.id = ANY(%(ids)s::bigint[])
            ORDER BY g.name
            """,
            {"ids": ids},
        )
    else:
        cur.execute(
            """
            SELECT ga.id, g.name, ga.status, ga.valid_to, ga.total_candidates
            FROM group_assessments ga
            JOIN groups g ON g.id = ga.group_id
            WHERE g.name = ANY(%(names)s::text[])
            ORDER BY g.name
            """,
            {"names": names},
        )
    return cur.fetchall()


def session_breakdown(cur, ids):
    cur.execute(
        """
        SELECT g.name, s.status, COUNT(*) AS n
        FROM assessment_sessions s
        JOIN group_assessments ga ON ga.id = s.group_assessment_id
        JOIN groups g ON g.id = ga.group_id
        WHERE ga.id = ANY(%(ids)s::bigint[])
        GROUP BY g.name, s.status
        ORDER BY g.name, s.status
        """,
        {"ids": ids},
    )
    return cur.fetchall()


def print_rows(title, rows):
    print(f"\n{title}")
    if not rows:
        print("  (none)")
        return
    for r in rows:
        print("  " + "  ".join(str(v) for v in r))


def db_now(cur):
    cur.execute("SELECT now()")
    return cur.fetchone()[0]


# --------------------------------------------------------------------------- #
# Core
# --------------------------------------------------------------------------- #
def apply_extension(cur, ids, target):
    """
    Run the three-tier update.  Order matters: sessions/attempts first, then
    recompute the group status from the freshly-updated sessions.
    Returns (sessions_updated, attempts_updated, groups_updated).
    """
    params = {"ids": ids, "target": target, "ok": TERMINAL_OK, "exp": list(EXPIRED_STATES)}

    # (B) Candidate sessions -- everyone who has not COMPLETED.
    cur.execute(
        """
        UPDATE assessment_sessions
        SET valid_to = %(target)s,
            status = CASE status
                WHEN 'PARTIALLY_EXPIRED' THEN 'IN_PROGRESS'
                WHEN 'EXPIRED'           THEN 'NOT_STARTED'
                ELSE status END
        WHERE group_assessment_id = ANY(%(ids)s::bigint[])
          AND status <> %(ok)s
        """,
        params,
    )
    sessions_updated = cur.rowcount

    # (C) Level attempts under those (non-completed) sessions that the
    #     scheduler had parked in an expired state.
    cur.execute(
        """
        UPDATE assessment_attempts a
        SET expires_at = CASE
                WHEN a.expires_at IS NOT NULL AND a.expires_at < %(target)s
                THEN %(target)s ELSE a.expires_at END,
            status = CASE a.status
                WHEN 'PARTIALLY_EXPIRED' THEN 'IN_PROGRESS'
                WHEN 'EXPIRED'           THEN 'NOT_STARTED'
                ELSE a.status END
        FROM assessment_sessions s
        WHERE a.assessment_session_id = s.id
          AND s.group_assessment_id = ANY(%(ids)s::bigint[])
          AND s.status <> %(ok)s
          AND a.status = ANY(%(exp)s::text[])
        """,
        params,
    )
    attempts_updated = cur.rowcount

    # (A) Group rows -- recompute status from the now-updated sessions.
    #     "engaged" = anyone not NOT_STARTED (covers IN_PROGRESS and COMPLETED).
    cur.execute(
        """
        UPDATE group_assessments ga
        SET valid_to = %(target)s,
            status = CASE WHEN EXISTS (
                SELECT 1 FROM assessment_sessions s
                WHERE s.group_assessment_id = ga.id
                  AND s.status <> 'NOT_STARTED'
            ) THEN 'IN_PROGRESS' ELSE 'NOT_STARTED' END
        WHERE ga.id = ANY(%(ids)s::bigint[])
        """,
        params,
    )
    groups_updated = cur.rowcount

    return sessions_updated, attempts_updated, groups_updated


def list_expired(cur):
    cur.execute(
        """
        SELECT ga.id, g.name, ga.status, ga.valid_to, ga.total_candidates
        FROM group_assessments ga
        JOIN groups g ON g.id = ga.group_id
        WHERE ga.status = ANY(%(exp)s::text[])
        ORDER BY ga.valid_to DESC
        """,
        {"exp": list(EXPIRED_STATES)},
    )
    print_rows("Expired / partially-expired group assessments:", cur.fetchall())


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main():
    p = argparse.ArgumentParser(
        description="Extend (re-open) expired group assessments.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    target = p.add_mutually_exclusive_group()
    target.add_argument("--ids", nargs="+", type=int, help="group_assessments.id values")
    target.add_argument("--names", nargs="+", help="groups.name values")

    when = p.add_mutually_exclusive_group()
    when.add_argument("--days", type=int, default=3,
                      help="extend to now + N days (default 3)")
    when.add_argument("--until",
                      help="explicit new end, e.g. '2026-06-12 18:00:00+05:30'")

    p.add_argument("--apply", action="store_true",
                   help="actually COMMIT (default is a dry run)")
    p.add_argument("--yes", action="store_true",
                   help="skip the confirmation prompt when applying")
    p.add_argument("--list", action="store_true",
                   help="just list expired group assessments and exit")
    args = p.parse_args()

    conn = connect()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        if args.list:
            list_expired(cur)
            return

        if not args.ids and not args.names:
            p.error("provide --ids or --names (or use --list)")

        targets = resolve_ids(cur, args.ids, args.names)
        if not targets:
            print("No matching group assessments found.")
            return

        ids = [int(r[0]) for r in targets]
        print_rows("Target group assessments:", targets)

        print_rows("Current session status breakdown:", session_breakdown(cur, ids))

        # Compute the single new end timestamp every row will get.
        if args.until:
            cur.execute("SELECT %s::timestamptz", (args.until,))
            new_end = cur.fetchone()[0]
        else:
            new_end = db_now(cur) + timedelta(days=args.days)
        print(f"\nNew end (valid_to / expires_at) -> {new_end}")

        if not args.apply:
            conn.rollback()
            print("\n[DRY RUN] No changes committed. Re-run with --apply to commit.")
            return

        if not args.yes:
            ans = input(f"\nApply extension to {len(ids)} group assessment(s)? [y/N] ")
            if ans.strip().lower() not in ("y", "yes"):
                conn.rollback()
                print("Aborted; nothing committed.")
                return

        s_n, a_n, g_n = apply_extension(cur, ids, new_end)
        conn.commit()

        print(f"\nCommitted: {g_n} group row(s), {s_n} session(s), {a_n} attempt(s) updated.")
        print_rows("After -- session status breakdown:", session_breakdown(cur, ids))

    except Exception as exc:
        conn.rollback()
        print(f"\nERROR -- rolled back, nothing changed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
