#!/usr/bin/env python3
"""
Generate the Level 3 metaphor question import migration from the "Level 3" sheet.

Usage:
    python generate_metaphor_questions_sql.py "<Level 3.xlsx>" <out.sql>

- image_url is filled automatically as "/assets/images/<set>.<question>.webp"
  (relative path). The origin/domain is admin-configurable via the
  originbi_settings row metaphor.image_base_url, prefixed at serve time so the
  whole image library can be repointed without touching the data.
- Idempotent: a source marker lets the migration be re-run safely.
"""
import sys
import json
import openpyxl

SHEET = "Level 3"
SOURCE_MARKER = "metaphor_l3_v1"

# 0-based columns in the Level 3 sheet.
C_SET, C_QNUM, C_CTX_EN, C_CTX_TA, C_Q_EN, C_Q_TA, C_DESC_EN, C_DESC_TA, C_META = range(9)


def sql_str(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    if s == "":
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def sql_jsonb(obj):
    return "'" + json.dumps(obj, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def main():
    if len(sys.argv) < 3:
        print("usage: generate_metaphor_questions_sql.py <xlsx> <out.sql>")
        sys.exit(1)
    xlsx, out = sys.argv[1], sys.argv[2]
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    ws = wb[SHEET]
    data = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)][1:]

    L, lines = None, []
    L = lines.append
    L("-- ============================================================")
    L("-- Migration 016: Level 3 metaphor questions import (auto-generated)")
    L(f"-- Source: {xlsx} [sheet: {SHEET}] | marker: {SOURCE_MARKER}")
    L("-- image_url = /assets/images/<set>.<question>.webp (relative).")
    L("-- Origin is configurable via originbi_settings.metaphor.image_base_url.")
    L("-- Requires migration 015 (metaphor tables + settings).")
    L("-- ============================================================")
    L("BEGIN;")
    L("")
    L("-- Configurable image origin (final URL = <base>/assets/images/<set>.<q>.webp).")
    L("INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)")
    L("VALUES ('metaphor', 'image_base_url', 'string', '',")
    L("        'Metaphor image base URL',")
    L("        'Origin for metaphor images. Final URL = <base>/assets/images/<set>.<question>.webp. Leave blank to use relative paths.', 11)")
    L("ON CONFLICT (category, setting_key) DO NOTHING;")
    L("")
    L("-- Idempotency: clear any previous import of this batch.")
    L(f"DELETE FROM metaphor_questions WHERE metadata->>'source' = '{SOURCE_MARKER}';")
    L("")
    L("INSERT INTO metaphor_questions")
    L("  (set_number, question_number, image_url,")
    L("   image_description_en, image_description_ta,")
    L("   context_text_en, context_text_ta, question_text_en, question_text_ta,")
    L("   metadata, is_active, is_deleted)")
    L("VALUES")

    values = []
    set_counts = {}
    for r in data:
        s = int(float(r[C_SET]))
        qn = int(float(r[C_QNUM]))
        set_counts[s] = set_counts.get(s, 0) + 1
        try:
            meta = json.loads(r[C_META]) if r[C_META] else {}
        except Exception:
            meta = {}
        meta["source"] = SOURCE_MARKER
        image_url = f"/assets/images/{s}.{qn}.webp"
        values.append(
            f"  ({s}, {qn}, '{image_url}', "
            f"{sql_str(r[C_DESC_EN])}, {sql_str(r[C_DESC_TA])}, "
            f"{sql_str(r[C_CTX_EN])}, {sql_str(r[C_CTX_TA])}, "
            f"{sql_str(r[C_Q_EN])}, {sql_str(r[C_Q_TA])}, "
            f"{sql_jsonb(meta)}, true, false)"
        )

    L(",\n".join(values) + ";")
    L("")
    L(f"-- imported {len(values)} questions, sets: {sorted(set_counts.items())}")
    L("COMMIT;")

    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(f"Wrote {out}")
    print(f"  questions: {len(values)}, per-set: {dict(sorted(set_counts.items()))}")


if __name__ == "__main__":
    main()
