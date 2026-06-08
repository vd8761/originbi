# MBA College — Level 1 Rework Runbook & Checklist

> **Rule:** Run every step on **LOCAL** first. Tick each box. Record the actual output / row counts in the "Result" column. Only after the whole list is green on Local do we replay the SAME statements on **LIVE** (with a fresh DB backup taken first). Note any interruption inline.

Related code change (already merged on this branch): open-question selection is now driven by the admin setting `assessment.open_question_distribution` (migration `database/migrations/013_open_question_distribution.sql`), and all 3 generation services now block with **"No active questions available for this program/level."** when a program/level has no active questions.

---

## Legend
- 🟢 = safe / read-only or additive
- 🟡 = data change (reversible with the rollback noted)
- 🔴 = destructive-ish (always backup first)

---

## R0 — Discover (🟢 read-only). Fill these in before doing anything.

| # | Query | Result (fill in) |
|---|-------|------------------|
| R0.1 | `SELECT id, code, name FROM programs WHERE code = 'COLLEGE_STUDENT';` | college **program_id = ____** |
| R0.2 | `SELECT id, level_number, name, is_mandatory FROM assessment_levels ORDER BY level_number;` | Level 1 id = ____ ; Level 2/ACI id = ____ |
| R0.3 | `SELECT DISTINCT question_type FROM open_questions;` | existing open type(s) = ____ |
| R0.4 | `SELECT set_number, COUNT(*) FROM assessment_questions WHERE program_id = <college_id> AND assessment_level_id = <level1_id> AND is_active = true GROUP BY set_number ORDER BY set_number;` | current college sets/counts = ____ |
| R0.5 | `SELECT COUNT(*) FROM open_questions WHERE is_active = true AND is_deleted = false;` | active open count = ____ |

- [ ] R0 complete, values recorded.

---

## R1 — Deactivate OLD college main questions (🟡)

```sql
-- Deactivate every existing main question for the College program.
UPDATE assessment_questions
SET is_active = false, updated_at = NOW()
WHERE program_id = <college_id>;          -- from R0.1
```
- Options are intentionally **not** touched — an inactive question's options are never fetched.
- **Rollback:** `UPDATE assessment_questions SET is_active = true WHERE program_id = <college_id>;` (only valid before the new import in R4; after R4 you'd re-activate old + new together, so prefer restoring from backup instead).
- [ ] R1 run. Rows affected = ____

## R2 — Deactivate OLD open questions (🟡)

```sql
UPDATE open_questions
SET is_active = false, updated_at = NOW()
WHERE is_active = true;
```
- The open bank is global (all programs) — we are replacing it wholesale.
- **Rollback:** restore from backup (we don't know which rows were already inactive otherwise).
- [ ] R2 run. Rows affected = ____

---

## R3 — VERIFY BLOCK (🟢 the critical test)

With college main + all open questions now inactive, prove the system refuses to build an assessment.

1. **Single registration (admin form):** register a test candidate against the **College** program.
   - [ ] Expected: request fails with **"No active questions available for this program/level."**
   - [ ] Verify NO orphan rows: `SELECT * FROM assessment_answers WHERE registration_id = <new_reg_id>;` → **0 rows**. (Admin/Corporate roll back the whole transaction; for self-registration the pre-flight check blocks before any user/registration row is created.)
2. **(Optional) Self-registration & corporate form** against College → same clean error.

- [ ] R3 green. This confirms inactive questions are never picked. ✅

> If R3 does NOT block (assessment still created), STOP and report — do not proceed to Live.

---

## R4 — Import NEW content (🟡) — ⛔ ON HOLD (waiting for Excel)

**Source of truth = `MBA Questions (2).xlsx`** (3 sets, English + Tamil inline). Generated to SQL by `database/scripts/generate_mba_questions_sql.py`.

- **Status: ALL 3 sets received & generated — `database/scripts/mba_college_level1_questions.sql` (120 questions, 480 options).** Review → run on Local (this R4) → replay on Live.
- Validated: 120 Q × exactly {D,I,S,C}; Set 1 factors 160/160 vs the Master Reference Table; 0 generator warnings.
- `disc_factor` normalised to clean **D/I/S/C** (Set 1 compound strings like "C over D" kept in option `metadata.raw_factor`).
- `score_value` = **1.0** per option. `category` = theme. Question `metadata` carries theme/layer/dimension + `source` marker (`mba_xlsx_v1`).
- Generated SQL is **idempotent** (preamble deletes any prior rows with that marker) and **ID-portable** (program/level via sub-selects) — same file runs on Local and Live.
- To regenerate after a corrected Excel: `python database/scripts/generate_mba_questions_sql.py "<xlsx>" database/scripts/mba_college_level1_questions.sql`
- NOTE (Sets 2 & 3): 20 questions each are context-only (no separate `question_text`) — the Layer 2/3 forced-choice pattern; intentional.

**Mapping (main questions):**
- `Theme N: <name>` → `category`
- `Question N | Layer X | Dimension: <d>` → metadata only (NOT into question text)
- scenario paragraph → `context_text_en`
- the prompt line ("What is your first move?") → `question_text_en`
- `A./B./C./D. ... (D|I|S|C)` → `assessment_question_options.option_text_en` + `disc_factor`
- Set 1/2/3 → `set_number` 1/2/3 ; `program_id` = college ; `assessment_level_id` = Level 1

**Mapping (survey / Type-B "diversion"):**
- `Question N | <Awareness category>` → category
- scenario+question paragraph → question text ; A–D options have **no DISC factor** (no scoring)
- Stored in `open_questions` with `question_type = 'SURVEY'` (Type B). The existing bank keeps its own type (Type A).

### ⛔ Two items must be resolved before R4 can be finalized:
1. **Tamil (`_ta`) translations** — the docx are **English only**. Every `context_text_en` / `question_text_en` / `option_text_en` needs a Tamil counterpart. **Decision needed:** generate via translation API / Claude vs. supplied manually. (I can generate a draft Tamil set on request.)
2. **Survey set-based selection** — Aarya/Sriharan: survey questions are **linked, set-based, picked in order without shuffle**. The config already supports this via `"selection":"set_sequential"`, but the exact set-grouping/sequence model (how a survey "set" is chosen and ordered) is **pending Sriharan's explanation**. Until then, survey rows can be imported but the in-exam survey selection logic is parked.

Import templates: see `database/migrations/templates_mba_import.sql` (to be generated once 1 & 2 are resolved).

- [ ] R4 main questions imported (3×40 = 120). Counts per set verified.
- [ ] R4 open/survey bank imported + Tamil present.

## R5 — Re-verify (🟢)

```sql
-- After import, confirm active college sets:
SELECT set_number, COUNT(*) FROM assessment_questions
WHERE program_id = <college_id> AND assessment_level_id = <level1_id> AND is_active = true
GROUP BY set_number ORDER BY set_number;   -- expect 1,2,3 each = 40
```
1. Register several College candidates →
   - [ ] random set ∈ {1,2,3} chosen
   - [ ] 40 MAIN + the configured open split (e.g. 10 Type-A + 10 Type-B) in `assessment_answers`
   - [ ] options shuffled; Tamil present
2. Set the split (admin panel → Settings → assessment → "Open Question Distribution (Level 1)") to:
   ```json
   [{"questionType":"OPEN","count":10,"selection":"random"},
    {"questionType":"SURVEY","count":10,"selection":"set_sequential"}]
   ```
   - [ ] new registration reflects the split (no redeploy needed)

---

## R6 — Deactivate ACI / Level 2 (🟡)

```sql
UPDATE assessment_levels
SET is_mandatory = false, updated_at = NOW()
WHERE level_number = 2;        -- the ACI level (from R0.2)
```
- Registration only creates attempts for `is_mandatory = true` levels → Level 2 attempt no longer generated.
- **Rollback:** `UPDATE assessment_levels SET is_mandatory = true WHERE level_number = 2;`
- [ ] R6 run. New College registration creates **only** the Level 1 attempt (verify in `assessment_attempts`).

---

## Go-Live (replay on LIVE)
- [ ] Fresh LIVE DB backup taken (timestamp: ____)
- [ ] Migration `013_open_question_distribution.sql` applied on LIVE
- [ ] Services redeployed (admin, corporate, student) with the new generation code
- [ ] R0 values re-captured on LIVE (IDs may differ!)
- [ ] R1 → R6 replayed, each ticked
- [ ] Distribution setting set to the agreed split on LIVE
- [ ] Smoke test: one College registration end-to-end

---

## Notes / Interruptions log
- (record anything that deviated here)
