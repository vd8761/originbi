# Phase 1 — Test Cases & Validation

Last validated: **2026-06-21** — **ALL PASS**.

## How to run

```bash
# 1. Go unit test for the resolver (pure function, no DB):
cd backend/exam-engine && go test ./internal/service/ -run TestResolveDominantFactor -v

# 2. DB validation + Go/JS parity + real-data replay (idempotent; applies 032):
node database/scripts/validate_pure_traits.js          # exit 0 = pass
```

Source under test:
- `backend/exam-engine/internal/service/disc_trait.go` — `ResolveDominantFactor`
- `backend/exam-engine/internal/service/disc_trait_test.go` — unit test
- `database/migrations/032_pure_traits.sql` — the 4 pure rows
- `database/scripts/validate_pure_traits.js` — DB + parity harness

---

## 1. Resolver unit cases (`disc_trait_test.go`) — 17/17 PASS

Rule: pure when `top*2 >= total` **OR** `top/2 > every other`; tie-break C>D>I>S;
guard when `top<=0` or `total<=0`.

| # | Case | Input {D,I,S,C} | Expected | Why |
|---|------|-----------------|----------|-----|
| 1 | pure C at exact 50% | 1,12,7,20 (tot 40) | `C` | 20*2=40 ≥ 40 → rule 1 (boundary inclusive) |
| 2 | pure C above 50% | 5,6,6,23 (tot 40) | `C` | 46 ≥ 40 |
| 3 | pure D at exact 50% | 20,10,5,5 (tot 40) | `D` | 40 ≥ 40 |
| 4 | pure D relative | 18,8,8,6 (tot 40) | `D` | 36<40 (rule1 no); 9>8,8,6 (rule2 yes) |
| 5 | blend DI (att 1888) | 22,16,6,8 (tot 52) | `DI` | 44<52; 11>16? no |
| 6 | blend IS (att 1891) | 6,24,17,7 (tot 54) | `IS` | 48<54; 12>17? no |
| 7 | blend DI (att 1894) | 27,15,9,8 (tot 59) | `DI` | 54<59; 13.5>15? no |
| 8 | blend SD (att 1897) | 19,6,25,7 (tot 57) | `SD` | top S; 50<57; 12.5>19? no |
| 9 | blend just below boundary | 19,11,5,5 (tot 40) | `DI` | 38<40; 9.5>11? no |
| 10 | tie D=I | 10,10,5,5 | `DI` | tie-break D before I; not dominant |
| 11 | tie on second I=S | 1,11,11,18 (tot 41) | `CI` | top C; second tie I=S → I wins |
| 12 | all equal | 10,10,10,10 | `CD` | guard path; tie-break C then D |
| 13 | single factor | {C:15} | `C` | only one present |
| 14 | empty map | {} | `` | no factors |
| 15 | all zero | 0,0,0,0 | `CD` | guard (top=0): no override, blend by priority |
| 16 | missing factor | {I:12,S:7,C:20} (tot 39) | `C` | 40 ≥ 39 → pure; D absent = 0 |
| 17 | ignores `total` key | 22,16,6,8 + total:52 | `DI` | extra keys ignored |

## 2. DB row assertions (`validate_pure_traits.js` step 2) — PASS

- `personality_traits` has 4 rows (codes D/I/S/C, not deleted), each with a
  populated `blended_style_name`, `blended_style_desc` and `color_rgb`:
  - D → Bold Driver (255,49,49)
  - I → Inspiring Motivator (232,178,54)
  - S → Steadfast Anchor (0,173,76)
  - C → Precise Perfectionist (74,198,234)
- `aci_traits` has 4 rows (codes D/I/S/C) with populated `trait_title`,
  `personalized_insight`, and `score_overview_interpretation` (opener + shared
  ACI band table + tailored micro-habits), matching the style of the 12 existing
  rows. `short_summary` NULL / `detailed_overview` '' as in existing rows.
- **No DISC-letter references:** every name/title/insight/score_overview field is
  scanned for `(D)`/`(I)`/`(S)`/`(C)` and the old "Pure …" labels — none present.
- Migration 032 is an idempotent upsert: re-running re-converges content with no
  duplicates.

## 3. Go ⇄ JS parity (`validate_pure_traits.js` step 3) — 17/17 PASS

The JS mirror used by later (Phase 2) TS surfaces produces identical output to the
Go resolver on all 17 cases above. Keep the two in lock-step.

## 4. Real-data replay (`validate_pure_traits.js` step 4) — informational

Over **719** completed Level-1 attempts, the new rule yields **110** Pure Traits
(C:72, D:18, S:13, I:7); the remaining 609 stay as blends (1 empty = a zero-score
attempt, which correctly leaves `dominant_trait_id` unset). This is the bounded,
expected behavioural change (Q1). Stored historical `dominant_trait_id` values are
**not** rewritten here — that is the opt-in backfill (Job 9, last).

## Regression guard

Cases 5–10 and the 609 unchanged replay attempts confirm non-dominant profiles
still resolve to the exact same 2-letter blend as before this change.
