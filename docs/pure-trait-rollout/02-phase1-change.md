# Phase 1 - Change Log (AFTER) · `dominant_trait_id` is pure-capable

Shipped: **2026-06-21** · Status: **complete, all tests green.**
Design: see `01-phase1-design.md`. Tests: see `phase1-testcases.md`.

## What shipped

The exam engine now writes a **Pure Trait** (`D`/`I`/`S`/`C`) to
`assessment_attempts.dominant_trait_id` when one DISC dimension is dominant
enough, otherwise the unchanged 2-letter blend. The two trait-content tables
gained the 4 matching rows so the lookup resolves and the dashboard can render
them.

## Files changed / added

| File | Change |
|------|--------|
| `backend/exam-engine/internal/service/disc_trait.go` | **new** - `ResolveDominantFactor(map[string]float64) string` (the rule + C>D>I>S tie-break) |
| `backend/exam-engine/internal/service/disc_trait_test.go` | **new** - 17-case table test |
| `backend/exam-engine/internal/service/exam_service.go` | Level-1 block now calls `ResolveDominantFactor(scoreMap)`; removed the local top-two concat + `validScores` slice; dropped the now-unused `sort` import |
| `database/migrations/032_pure_traits.sql` | **new** - 4 pure rows into `personality_traits` + `aci_traits` (idempotent, additive) |
| `database/scripts/validate_pure_traits.js` | **new** - applies 032, asserts rows, Go/JS parity, real-data replay |
| `database/scripts/explore_traits_db.js` | **new** - read-only schema/data explorer used during design |

## Behaviour delta

- Before: `dominant_trait_id` was always one of 12 blends.
- After: a sufficiently dominant profile resolves to a pure trait. Replay over
  719 historical attempts → 110 (~15%) would be pure (C:72, D:18, S:13, I:7);
  the other 609 are byte-identical blends.
- The `C>D>I>S` tie-break was added to the engine sort (previously score-only);
  affects only exact ties.
- **Not** retroactive: stored historical `dominant_trait_id` is untouched until
  the Job 9 backfill.

## Verification (re-runnable)

```
cd backend/exam-engine && go test ./internal/service/ -run TestResolveDominantFactor -v   # 17/17 PASS
cd backend/exam-engine && go build ./...                                                   # exit 0
node database/scripts/validate_pure_traits.js                                              # ALL VALIDATIONS PASSED
```

## Rollback

- Engine: revert `disc_trait.go` + the `exam_service.go` block (re-add the
  top-two concat and the `sort` import). No data migration needed to revert code.
- Rows: `UPDATE personality_traits SET is_deleted=true WHERE code IN ('D','I','S','C');`
  and the same on `aci_traits.trait_code` (or `DELETE` - nothing references them yet).

## Content correction (post-review)

Initial rows used "Pure Dominance/…" labels with DISC letters and left the
`aci_traits` text columns NULL. Per feedback, migration 032 was rewritten so the
pure rows match the existing 12 in style and carry **no DISC-letter references**:

| code | personality_traits | aci_traits | colour |
|------|--------------------|------------|--------|
| D | Bold Driver | The Bold Driver | 255,49,49 |
| I | Inspiring Motivator | The Inspiring Motivator | 232,178,54 |
| S | Steadfast Anchor | The Steadfast Anchor | 0,173,76 |
| C | Precise Perfectionist | The Precise Perfectionist | 74,198,234 |

- `personality_traits`: 3-sentence `blended_style_desc` (metadata stays `{}` like
  all 12 existing rows).
- `aci_traits`: full `personalized_insight` + `score_overview_interpretation`
  (opener + the shared ACI band table + a tailored micro-habit table);
  `short_summary` NULL / `detailed_overview` '' to match existing rows.
- Migration 032 is now an idempotent **upsert** (insert-missing + update) so it
  re-converges content without duplicates or FK-breaking deletes.
- `validate_pure_traits.js` now asserts every text field is populated and
  contains none of `(D)`/`(I)`/`(S)`/`(C)` or the old "Pure …" labels.

## Still placeholder (tracked in master checklist)

- Pure-trait **names/colours** are now real but **proposed** - swap via `UPDATE`
  if you prefer different ones (Q7); image filenames derive from the name.
- **Images** (Q8) - needed before the dashboard cards look right (Job 7).
- Report-layer narrative for employee/CXO/school (Q9) - Phase 2.
