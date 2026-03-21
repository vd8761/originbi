import psycopg2
from psycopg2.extras import RealDictCursor
import json

# ==========================================
# CONFIGURATION
# ==========================================
DB_DSN = "postgres://postgres:postgres@localhost:5432/obidatanew"

def get_db_connection():
    return psycopg2.connect(DB_DSN)

def get_completed_attempts(cur):
    """Fetches all users who have their assessment completed for level 2."""
    query = """
            SELECT
                id AS attempt_id,
                user_id,
                assessment_session_id,
                metadata
            FROM assessment_attempts
            WHERE assessment_level_id = 2
              AND status = 'COMPLETED' \
            """
    cur.execute(query)
    return cur.fetchall()

def process_attempt(conn, attempt):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        attempt_id = attempt['attempt_id']
        session_id = attempt['assessment_session_id']
        user_id = attempt['user_id']

        # ---------------------------------------------------------
        # 1. FIND THE NUMBER OF ROWS AND DETERMINE THE FACTOR
        # ---------------------------------------------------------
        cur.execute("SELECT COUNT(*) as row_count FROM assessment_answers WHERE assessment_attempt_id = %s", (attempt_id,))
        row_count = cur.fetchone()['row_count']

        if row_count == 0:
            print(f"User {user_id} (Attempt {attempt_id}) has 0 answers. Skipping.")
            return

        # Factor based on multiples of 25 (25->1, 50->2, 75->3, 100->4)
        factor = max(1, row_count // 25)

        # ---------------------------------------------------------
        # 2. GENERATE RAW SCORES
        # ---------------------------------------------------------
        # Raw Agile Scores
        query_agile = """
                      SELECT q.category, COALESCE(SUM(o.score_value), 0) as raw_total
                      FROM assessment_answers a
                               JOIN assessment_questions q ON a.main_question_id = q.id
                               LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
                      WHERE a.assessment_attempt_id = %s
                      GROUP BY q.category \
                      """
        cur.execute(query_agile, (attempt_id,))
        agile_results = cur.fetchall()

        # Raw Sincerity Stats
        query_sincerity = """
                          SELECT
                              COUNT(*) FILTER (WHERE is_attention_fail = true) as raw_attention_fails,
                              COUNT(*) FILTER (WHERE is_distraction_chosen = true) as raw_distractions
                          FROM assessment_answers
                          WHERE assessment_attempt_id = %s \
                          """
        cur.execute(query_sincerity, (attempt_id,))
        sincerity_stats = cur.fetchone()

        # ---------------------------------------------------------
        # 3. FIX SCORES FOR DUPLICATED ONES (APPLY FACTOR)
        # ---------------------------------------------------------
        agile_scores = {
            "Commitment": 0.0, "Courage": 0.0, "Focus": 0.0,
            "Openness": 0.0, "Respect": 0.0, "total": 0.0
        }

        total_score = 0.0
        for row in agile_results:
            cat_key = row['category'] if row['category'] else ""
            # Divide raw sum by the factor to fix duplicates
            fixed_val = round(float(row['raw_total']) / factor)

            capitalized_cat = cat_key.capitalize()
            if capitalized_cat in agile_scores:
                agile_scores[capitalized_cat] = fixed_val
                total_score += fixed_val

        agile_scores['total'] = total_score

        # Fix Sincerity Stats by dividing by factor
        fixed_attention_fails = float(sincerity_stats['raw_attention_fails'] or 0) / factor
        fixed_distractions = float(sincerity_stats['raw_distractions'] or 0) / factor

        # Calculate final sincerity index based on fixed counts
        sincerity_index = 100.0 - (fixed_attention_fails * 20.0) - (fixed_distractions * 10.0)
        sincerity_index = max(0.0, sincerity_index) # Ensure it doesn't go below 0

        sincerity_class = "NOT_SINCERE"
        if sincerity_index >= 80:
            sincerity_class = "SINCERE"
        elif sincerity_index >= 50:
            sincerity_class = "BORDERLINE"

        # ---------------------------------------------------------
        # 4. UPDATE ATTEMPTS AND REPORTS TABLES
        # ---------------------------------------------------------

        # Handle existing metadata safely
        meta = attempt['metadata']
        if isinstance(meta, str):
            try: meta = json.loads(meta)
            except: meta = {}
        elif not meta:
            meta = {}

        meta['agile_scores'] = agile_scores
        meta['overall_sincerity'] = sincerity_index
        meta['sincerity_class'] = sincerity_class
        meta['regenerated_score'] = True

        # Optional: tag records that were actually fixed
        if factor > 1:
            meta['scoreDuplicateFix'] = True
            print(f"User {user_id}: Fixed {row_count} rows (Factor {factor}). New Total: {total_score}")
        else:
            print(f"User {user_id}: Normal 25 rows. Processed cleanly.")

        # Update assessment_attempts
        update_attempt_query = """
                               UPDATE assessment_attempts
                               SET metadata = %s,
                                   total_score = %s,
                                   sincerity_index = %s,
                                   sincerity_class = %s,
                                   updated_at = NOW()
                               WHERE id = %s \
                               """
        cur.execute(update_attempt_query, (
            json.dumps(meta), total_score, sincerity_index, sincerity_class, attempt_id
        ))

        # Update assessment_reports (if it exists for this session)
        update_report_query = """
                              UPDATE assessment_reports
                              SET agile_scores = %s,
                                  overall_sincerity = %s,
                                  updated_at = NOW()
                              WHERE assessment_session_id = %s \
                              """
        cur.execute(update_report_query, (json.dumps(agile_scores), sincerity_index, session_id))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print(f"Error processing attempt {attempt.get('attempt_id')}: {e}")
    finally:
        cur.close()

# ==========================================
# MAIN EXECUTION
# ==========================================
def main():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        attempts = get_completed_attempts(cur)
        cur.close()

        print(f"Found {len(attempts)} completed level 2 attempts. Beginning processing...")

        for attempt in attempts:
            process_attempt(conn, attempt)

        print("Done.")

    finally:
        conn.close()

if __name__ == "__main__":
    main()