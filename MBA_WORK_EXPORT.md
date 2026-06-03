# MBA College Assessment Rework — Detailed Work Export / Handoff

**Date:** 2026-06-01 · **Branch:** `sriharan/develop` · **Owner:** Sriharan
**Status at export:** Code complete & typechecked; 120 questions imported & verified on **Local** (14/14 checks PASS); survey (Type-B) + go-live steps pending. **Nothing git-committed yet.** Work is being parked to build the separate "Group view" feature, then resumed.

---

## 1. Why this work exists (context)

Aarya sir requested a rework of the **College (MBA trial)** assessment before the platform must be live **6th–7th June 2026**. Three levels were discussed; **Level 1 is the priority**:

1. Deactivate old College questions + old open questions, and **prove** that an assessment can't be built when none are active ("questions unavailable").
2. Reimport fresh content: **3 sets × 40 College DISC questions** (+ a new survey/"diversion" bank), **with Tamil**.
3. Change open-question selection from "20 of one type" → "**10 + 10** of two types", and make the **count/split admin-configurable** (so we never edit code in 5+ registration paths again).
4. **Deactivate ACI (Level 2)** so only Level 1 runs for the MBA trial.

Level 2 replacement and Level 3 (Metaverse voice-to-text) are **out of scope** here.

---

## 2. Decisions made (with rationale)

| Decision | Choice | Why |
|---|---|---|
| Open-question count/split | **Admin-configurable** JSON setting `assessment.open_question_distribution` | Avoid editing 3 services / 6 registration paths for every tweak |
| Survey selection mode | `selection: 'set_sequential'` (no shuffle) slot reserved | Survey questions are **linked, set-based, fixed order** (logic still pending) |
| "Questions unavailable" guard | Admin/corporate **throw → tx rollback**; student **pre-flight check before any persistence** | Student `register()` is NOT transactional (Cognito + sequential saves) → must block before creating user to avoid orphans |
| `score_value` | **1.0** per option | Standard DISC tally; scoring sums score_value per letter |
| `disc_factor` | **Normalized to clean D/I/S/C**; original compound (e.g. "C over D") kept in `option.metadata.raw_factor` | Scoring does `GROUP BY disc_factor`; compound strings would break it and overflow `varchar(10)` |
| `category` on L1 questions | **Left NULL** (theme stored in `metadata.theme`) | Per Aarya: `category` is reserved for Level 2 (ACI). Verified: every backend read of `assessment_questions.category` is gated by `UPPER(category) IN ('COMMITMENT','COURAGE','FOCUS','OPENNESS','RESPECT')` |
| Import format | Python generator → idempotent, ID-portable SQL | Reviewable, re-runnable, same file Local↔Live |
| Set count | Imported **3 sets (120 Q)** from `MBA Questions (2).xlsx` | Final file had all 3 sets |

---

## 3. Code changes (Part A) — COMPLETE, typechecks clean

### Migration (new)
- **`database/migrations/013_open_question_distribution.sql`** — seeds the `originbi_settings` row `assessment.open_question_distribution`. **Default value reproduces legacy behaviour** (`[{"questionType":null,"count":20,"selection":"random"}]`) so applying it changes nothing until edited. For the MBA 10+10 split set it to:
  ```json
  [{"questionType":"OPEN","count":10,"selection":"random"},
   {"questionType":"SURVEY","count":10,"selection":"set_sequential"}]
  ```

### Generation services (configurable selection + guard) — same pattern in all 3
- **`backend/admin-service/src/assessment/assessment-generation.service.ts`**
  - Added `OpenQuestionGroup` interface + `selectOpenQuestions()` + `getOpenQuestionDistribution()` helpers (read the setting; fallback to legacy 20-random).
  - Replaced hard-coded `.limit(20)` open fetch + `for(i<20)` interleave with config-driven select + a **pool-driven `while` loop** (2 main : 1 open until both pools exhausted → all 40 main always used).
  - **Guard:** the "no active sets" branch now **throws** `No active questions available for this program/level.` (was a silent `return`). Existing empty-set throw aligned.
- **`backend/corporate-service/src/assessment/assessment-generation.service.ts`** — same helpers, same interleave change, same guard (silent `return` → throw).
- **`backend/student-service/src/student/student.service.ts`** (raw SQL):
  - Added `selectOpenQuestionIds()` (reads `originbi_settings.value_json` via raw SQL, per-group queries) + `assertActiveQuestionsExist(programId, levelId)`.
  - `generateQuestionsForAttempt`: open fetch now config-driven; interleave is the pool-driven `while`; **defensive throw** if no main questions.
  - `register()`: **pre-flight** block right after the user-exists check (before Cognito) resolves program + Level 1 and calls `assertActiveQuestionsExist` → blocks cleanly with no orphan records.

### Module wiring
- **`backend/admin-service/src/assessment/assessment.module.ts`** and **`backend/corporate-service/src/assessment/assessment.module.ts`** — `OriginbiSetting` added to `TypeOrmModule.forFeature([...])`. (student-service uses raw SQL, no wiring.)

### Admin UI
- **`frontend/components/admin/SettingsManagement.tsx`** — added a dedicated **`DistributionEditor`** table component (Question Type · Count · Selection dropdown · Remove · "+ Add group" · live Total) rendered for `assessment.open_question_distribution`. (The generic JSON path only handled string arrays via `ArrayChipInput`, which would have rendered the object array as broken chips — this was a latent bug, now fixed.)

**Guard behaviour in bulk uploads:** both bulk services already wrap each row in try/catch and mark `row.status='FAILED'` with the error, so the new throw is reported **per-row**, not as a batch crash. No bulk changes needed.

---

## 4. Data import pipeline (Part B) — GENERATED & VERIFIED on Local

Source of truth: **`MBA Questions (2).xlsx`** (3 sets, English + Tamil inline; sheets: Master Reference Table, Set 1/2/3).

- **`database/scripts/generate_mba_questions_sql.py`** — parses the Excel → emits the import SQL. Maps each row → 1 `assessment_questions` + 4 `assessment_question_options`. Normalizes `disc_factor`, sets `score_value=1.0`, omits `category`, stores theme/layer/dimension + `source: 'mba_xlsx_v1'` in metadata. Idempotent (preamble deletes prior `mba_xlsx_v1` rows) + ID-portable (program/level via sub-selects on `code='COLLEGE_STUDENT'` / `level_number=1`).
  - Re-run: `python database/scripts/generate_mba_questions_sql.py "<xlsx>" database/scripts/mba_college_level1_questions.sql`
- **`database/scripts/mba_college_level1_questions.sql`** — the generated import (**120 questions, 480 options**, 0 warnings).
- **`database/scripts/verify_mba_college_level1.sql`** — 14 PASS/FAIL checks + a spot-check sample. **Result on Local: all 14 PASS.**

**Validation summary:** 120 Q / 480 opts · each set = 40 · every Q has 4 options · every Q covers exactly {D,I,S,C} · `disc_factor` single clean letter · `score_value`=1.0 · `category` NULL for L1 · Tamil on every Q + option · `display_order` 1–4 · no orphans · Set-1 compound factors preserved in `metadata.raw_factor` (14) · Set-1 factors 160/160 vs Master key.

> Known/benign: Sets 2 & 3 each have 20 **context-only** questions (no separate `question_text`) — the Layer 2/3 forced-choice pattern; intentional.

---

## 5. Runbook (deactivate → verify-block → import → ACI off)

**`MBA_College_Level1_Runbook.md`** — the replayable Local→Live checklist:
- **R0** discover IDs (`COLLEGE_STUDENT` program, Level 1, Level 2/ACI, existing open `question_type`s).
- **R1/R2** deactivate old college main + old open questions.
- **R3** verify-block (register a College candidate → expect "No active questions available", 0 answers).
- **R4** run `mba_college_level1_questions.sql`.
- **R5** re-verify (random set, 40 main + configured open split, Tamil present).
- **R6** ACI off: `UPDATE assessment_levels SET is_mandatory=false WHERE level_number=2;`
- Go-Live section: backup, apply migration 013, redeploy 3 services, re-capture R0 IDs on Live, replay R1–R6, set distribution split, smoke test.

---

## 6. What's DONE
- ✅ All Part A code (3 services + migration + module wiring) — typechecks clean.
- ✅ Admin UI editor for the distribution setting — frontend typechecks clean.
- ✅ Generator + 120-question import SQL + verification SQL.
- ✅ Import run on **Local** and **verified (14/14 PASS)**.
- ✅ Runbook authored.
- ✅ Confirmed `category` rule against the codebase.

## 6b. SURVEY (Type-B) — BUILT (2026, set-based logic)

The survey logic was finalised and implemented. **New rule (replaces the old 2-main:1-open / 40+20 interleave):**
- `open_questions` gains **`set_number`**, **`context_text_en`**, **`context_text_ta`** (migration `014_open_questions_survey_sets.sql`).
- Survey questions are `question_type='SURVEY'`, in **5 sets × 20**.
- Per assessment: the distribution setting `[{"questionType":"SURVEY","count":10,"selection":"set_random"}]` → **pick ONE random set, then 10 random questions from it**, **scattered at random positions** among the 40 main (40 + 10 = 50). Count stays admin-configurable.
- New selection mode **`set_random`** added to all 3 generation services + the admin Settings dropdown.
- Exam-engine Go `OpenQuestion` struct gained `SetNumber/ContextTextEn/ContextTextTa` so context is served; the exam frontend ([AssessmentStarter.tsx](frontend/components/student/AssessmentStarter.tsx)) already renders context from `open_question` — **no frontend change needed**.
- Import: `database/scripts/generate_mba_survey_sql.py` → `database/scripts/mba_survey_questions.sql` (**100 Q / 400 options**, bilingual, non-scoring options `is_valid=false`). Verify with `database/scripts/verify_mba_survey.sql`.
- Survey options are **non-scoring** (no DISC factor, `is_valid=false`).

All 3 NestJS services typecheck clean; exam-engine `go build` clean; frontend typechecks clean.

## 7. What's PENDING / TO-DO (resume here)
1. **Run survey on Local:** apply migration 014 → run `mba_survey_questions.sql` → `verify_mba_survey.sql` (all PASS) → register a College candidate → confirm `assessment_answers` = 40 MAIN + 10 OPEN, OPEN all from a **single** survey set, scattered. (Old open questions already deactivated by Sriharan.)
2. **Local runbook completion** — R1/R2 (deactivate old), R3 (verify-block test), R5 (functional registration test through admin/corporate/self), R6 (ACI off). Import (R4) already done on Local.
3. **Functional test** — start services; confirm the admin Settings distribution editor renders; register a College student → 40 main + 20 open interleaved 2:1, set ∈ {1,2,3}; flip questions inactive → guard blocks.
4. **Set the distribution split** to the agreed 10+10 once SURVEY questions exist.
5. **Go-Live** — replay runbook on Live with backup.
6. **git commit** — Part A code + migration + admin UI + generator + import SQL + verification + runbook + this export. (Currently uncommitted in the working tree.)

## 8. Things to confirm (flags)
- Verify on the actual DB that the College program code is **`COLLEGE_STUDENT`** and Level 1 is **`level_number = 1`** (the import + pre-flight key off these).
- Confirm Sets 2 & 3 context-only questions are intentional (they are, per pattern).
- When SURVEY lands: confirm `score_value`/scoring expectations for survey (non-DISC, likely no DISC factor) and how (if at all) survey answers feed reports.

## 9. Key file index
```
database/migrations/013_open_question_distribution.sql        # admin setting (migration)
database/migrations/014_open_questions_survey_sets.sql        # survey: open_questions cols + setting
database/scripts/generate_mba_questions_sql.py               # main Excel -> SQL generator
database/scripts/mba_college_level1_questions.sql            # generated MAIN import (120 Q / 480 opts)
database/scripts/verify_mba_college_level1.sql               # 14 checks + sample (main)
database/scripts/generate_mba_survey_sql.py                  # survey Excel -> SQL generator
database/scripts/mba_survey_questions.sql                    # generated SURVEY import (100 Q / 400 opts)
database/scripts/verify_mba_survey.sql                       # survey checks
database/scripts/verify_mba_registration_generation.sql      # per-attempt generation check (40 main + open)
MBA_College_Level1_Runbook.md                                # R0-R6 Local->Live runbook
MBA_WORK_EXPORT.md                                           # this handoff
backend/admin-service/src/assessment/assessment-generation.service.ts
backend/admin-service/src/assessment/assessment.module.ts
backend/corporate-service/src/assessment/assessment-generation.service.ts
backend/corporate-service/src/assessment/assessment.module.ts
backend/student-service/src/student/student.service.ts
frontend/components/admin/SettingsManagement.tsx             # DistributionEditor
```

## 10. How scoring works (reference, so future changes don't break it)
Exam-engine (`backend/exam-engine/internal/service/exam_service.go`) scores Level 1 DISC via
`SELECT o.disc_factor, SUM(o.score_value) ... JOIN ... WHERE assessment_attempt_id=? GROUP BY o.disc_factor`,
then takes the **top-2 factors** as the dominant blend → maps to a `personality_trait`. Therefore `disc_factor` must stay a clean **D/I/S/C** letter and `score_value` must be **> 0**. Level 2 (ACI) is the path that uses `assessment_questions.category` (the 5 ACI categories) — hence category is reserved for it.
