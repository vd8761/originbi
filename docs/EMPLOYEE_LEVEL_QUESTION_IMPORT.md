# Employee Level Questions - Import Approach (Dev Doc)

**Status:** design only (not yet implemented)
**Source file:** `Employee.xlsx` (3 sheets: `Level 1`, `Level 2`, `Level 3`)
**Goal:** deactivate the existing Employee Level‑1 questions and import the new
level‑segmented question bank, wired to the Employee “Level” feature
(`Entry / Medium / Executive`) we already built.

---

## 1. What the Excel contains

| Sheet | Set numbers | Rows | Meaning |
|-------|-------------|------|---------|
| `Level 1` | 1, 2 | 40 + 40 = 80 | Entry |
| `Level 2` | 1, 2 | 80 | Medium |
| `Level 3` | 1, 2 | 80 | Executive |

So **3 difficulty levels × 2 sets × 40 questions = 240 questions, 960 options.**

Columns (identical on every sheet):

```
Set number, Question number,
context_text_en, question_text_en, context_text_ta, question_text_ta,
metadata,                         # JSON, e.g. {"theme":..,"layer":"Layer 1","dimension":"upward_courage"}
option_a_en..option_d_en,
option_a_ta..option_d_ta
```

**Important - what is NOT in the file:** no DISC trait/`category`, no correct
answer, no per‑option `disc_factor`, no per‑option `score_value`. These are
situational‑judgment items; the only behavioural signal is the question‑level
`metadata.dimension`.

---

## 2. Target tables (already understood)

### `assessment_questions`
`assessment_level_id, set_number, program_id, external_code, context_text_en,
question_text_en, context_text_ta, question_text_ta, category, board,
personality_trait_id, metadata (jsonb), is_active, is_deleted`

### `assessment_question_options`
`question_id, display_order, option_text_en, option_text_ta, disc_factor,
score_value (default 0), is_correct (default false), metadata (jsonb), is_active,
is_deleted`

### Column mapping (the key decisions)

| Excel | DB column | Value |
|-------|-----------|-------|
| sheet name | `assessment_questions.board` | **`Level 1`→`Entry`, `Level 2`→`Medium`, `Level 3`→`Executive`** ⚠️ confirm |
| (fixed) | `assessment_questions.program_id` | `(SELECT id FROM programs WHERE code='EMPLOYEE')` (= 3) |
| (fixed) | `assessment_questions.assessment_level_id` | `(SELECT id FROM assessment_levels WHERE level_number=1)` |
| `Set number` | `set_number` | 1 or 2 |
| `Question number` | `external_code` (optional) | for traceability |
| `context_text_*`, `question_text_*` | same columns | direct |
| `metadata` cell | `assessment_questions.metadata` | parsed JSON **+ add `"source":"employee_xlsx_v1"`** marker |
| (none) | `category` | **NULL** - these are not DISC‑trait questions |
| `option_x_en/ta` | one option row each | `display_order` a=1,b=2,c=3,d=4 |
| (none) | option `disc_factor` | NULL |
| (none) | option `score_value` / `is_correct` | `0` / `false` |

**`board` is the join to the feature we shipped:** the generators filter
`q.board = registration.metadata.employeeLevel`, so tagging questions with
`Entry/Medium/Executive` is exactly what makes level‑based assignment work.

---

## 3. Two separate migrations

### Migration A - deactivate the existing Employee Level‑1 questions
`database/migrations/028_employee_level1_deactivate_old.sql`

```sql
BEGIN;
UPDATE assessment_questions
   SET is_active = false, updated_at = now()
 WHERE program_id = (SELECT id FROM programs WHERE code='EMPLOYEE')
   AND assessment_level_id = (SELECT id FROM assessment_levels WHERE level_number=1)
   AND COALESCE(metadata->>'source','') <> 'employee_xlsx_v1';   -- never touch the new import
COMMIT;
```

The `source <>` guard makes it **safe to re‑run** and guarantees it only
deactivates the *legacy* rows even if the import already ran. (Order: A then B,
but the guard makes ordering forgiving.)

### Migration B - import the new questions + options
`database/migrations/029_employee_level_questions_import.sql` - **auto‑generated**
by a Python script (see §4). Structure mirrors the existing
`018_mba_college_level1_questions.sql`:

- `BEGIN; … COMMIT;`
- **Idempotent preamble** keyed on the source marker:
  ```sql
  DELETE FROM assessment_question_options o USING assessment_questions q
   WHERE o.question_id = q.id AND q.metadata->>'source'='employee_xlsx_v1';
  DELETE FROM assessment_questions WHERE metadata->>'source'='employee_xlsx_v1';
  ```
- Per question: `WITH q AS (INSERT … RETURNING id) INSERT INTO …options SELECT q.id, v.* FROM q,(VALUES …)`.

---

## 4. The generator script (Python - efficient & repeatable)

`database/scripts/generate_employee_questions_sql.py`, modelled on the existing
`generate_mba_questions_sql.py`.

**Flow:**
1. `openpyxl.load_workbook(path, data_only=True)`.
2. For each sheet → resolve `board` from `SHEET_TO_BOARD = {"Level 1":"Entry","Level 2":"Medium","Level 3":"Executive"}`.
3. For each data row: read set/question numbers, the 4 EN + 4 TA texts, parse the
   `metadata` JSON (fallback `{}`), inject `source` + `board` into it.
4. Emit one CTE insert block per question (SQL‑escape via doubling `'`; keep
   Tamil UTF‑8 - write the file with `encoding='utf-8'`).
5. Write `029_employee_level_questions_import.sql`.

**Why a generator, not raw SQL by hand:** 240 questions × bilingual × 4 options
is too error‑prone to hand‑write; regenerating on a corrected Excel is one
command; the marker keeps it idempotent.

**Run:** `python database/scripts/generate_employee_questions_sql.py "C:\path\Employee.xlsx"`
then apply migrations via the existing runner (`database/tools/run-migrations.ts`).

> Alternative: the script could `INSERT` straight into Postgres via `psycopg2`.
> Generating a checked‑in `.sql` migration is preferred here - it matches repo
> convention, is reviewable, and replays through the normal migration path.

---

## 5. Validation (add to the script / a verify_*.sql)

- 3 boards × 2 sets each, 40 questions per (board,set) → 240 total, 960 options.
- Every question has exactly 4 options with `display_order` 1–4.
- `board` ∈ {Entry,Medium,Executive}; `program_id`=EMPLOYEE; `assessment_level_id`=L1.
- Spot‑check Tamil renders (no mojibake).
- After import, register a test Employee at each level → confirm the generator
  pulls only that level’s sets.

---

## 6. Open questions to confirm before coding

1. **Sheet → level mapping.** Is `Level 1 = Entry`, `Level 2 = Medium`,
   `Level 3 = Executive`? (Assumed above.)
2. **Scoring/report.** The file has no per‑option score or correct answer, so
   `score_value=0 / is_correct=false`. How should the Employee Level‑1 result be
   scored/reported (presumably off `metadata.dimension`)? This is **out of scope
   for the import** but blocks meaningful reports - needs its own spec.
3. **Open (survey) questions.** Exam = “40 main + 10 open”. The `10` is the
   admin `open_question_distribution` setting (currently defaults to 20) - set it
   to 10 for the Employee program flow; not part of this import.
4. **`category` left NULL** for these questions - confirm nothing downstream
   requires a non‑null `category` for Employee L1 (the DISC `GROUP BY category`
   scoring path does, which is why item 2 matters).
```
