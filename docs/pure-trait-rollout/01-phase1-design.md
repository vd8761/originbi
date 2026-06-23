# Phase 1 - Design (BEFORE) · Make `dominant_trait_id` pure-capable

Covers **Job 2** (DB rows) + **Job 1** (engine resolver). They ship together
because the engine's `personality_traits.code` lookup needs the 4 rows to exist.

> Approve this doc to authorise implementation. A matching **02-phase1-change.md**
> (AFTER) will record exactly what shipped + verification output.

---

## Objective

When a single DISC factor is dominant enough, the engine writes a **pure**
`dominant_trait_id` (`D`/`I`/`S`/`C`) instead of always a 2-letter blend - at the
source, so every downstream reader (dashboard, reports, RAG) inherits it (Q1).
Blends are otherwise unchanged.

## Confirmed rule (Q4/Q5)

Inputs = raw `disc_scores` factor sums. `total = D+I+S+C` (verified to equal the
stored `disc_scores.total`). Sort factors desc, tie-break **C > D > I > S**.

```
pure (single letter) when EITHER
  (1) top*2 >= total           // ≥ 50% of the candidate's own DISC total
  (2) top/2  >  every other    // relative-dominance rule (strict), unchanged
else → top-two blend           // existing 12 behaviour
guard: if top <= 0 or total <= 0 → keep current behaviour (no override)
```

Real-data sanity check (recent attempts): `D22/total52`→`DI` (unchanged),
`C20/total40`→`C` (new pure), `C23/total40`→`C`, `I24/total54`→`IS` (unchanged).

---

## Job 2 - DB rows (4 pure traits in two tables)

New migration **`database/migrations/032_pure_traits.sql`** - additive,
idempotent, reversible. (The original 12 were inserted out-of-band; this gives
the pure rows proper traceability.)

**`personality_traits`** (drives dashboard + the engine lookup):

| code | blended_style_name (placeholder, Q7) | color_rgb (placeholder, Q7) |
|------|--------------------------------------|------------------------------|
| D | Pure Dominance | 255,49,49 |
| I | Pure Influence | 232,178,54 |
| S | Pure Steadiness | 0,173,76 |
| C | Pure Conscientiousness | 74,198,234 |

- `metadata = '{}'` (consistent - all 12 existing rows have empty metadata).
- `is_active=true, is_deleted=false`.
- Insert guarded by `ON CONFLICT (code) DO NOTHING` (code is unique).
- Names/colours are **placeholders** taken from the specialization report's
  existing `SPEC_MAP` trait names + the college report's DISC bar colours; they
  get swapped when Q7 lands (a one-line `UPDATE`, no schema change).

**`aci_traits`** (ACI content set):

| trait_code | trait_title (placeholder, Q9) |
|------------|-------------------------------|
| D | Pure Dominance |
| I | Pure Influence |
| S | Pure Steadiness |
| C | Pure Conscientiousness |

- Text columns (`personalized_insight`, `score_overview_interpretation`, …) left
  `NULL` for now (Q9 copy is low-priority; readers already tolerate missing ACI
  content). Guarded by `WHERE NOT EXISTS (… trait_code …)` (no unique constraint).

**Rollback:** `UPDATE … SET is_deleted=true` for the 4 codes (or `DELETE` since
nothing references them yet).

---

## Job 1 - Engine resolver

**File:** `backend/exam-engine/internal/service/exam_service.go`, the Level-1
DISC block (~L523-541). Today:

```go
sort.Slice(validScores, func(i, j int) bool { return validScores[i].Total > validScores[j].Total })
if len(validScores) >= 2 {
    dominantFactor = validScores[0].DiscFactor + validScores[1].DiscFactor
} else if len(validScores) == 1 {
    dominantFactor = validScores[0].DiscFactor
}
```

**Change to** (new helper `resolveDominantFactor(validScores)`):

```go
// sort desc by Total, tie-break C > D > I > S (aligns with the report layer)
// total := Σ validScores.Total
// if len==0 -> ""        (unchanged: no factors)
// if len==1 -> top.Factor (unchanged)
// top := validScores[0]
// if top.Total > 0 && total > 0 {
//     if top.Total*2 >= total { return top.Factor }            // rule (1)
//     if everyOther(r => top.Total/2 > r.Total)  { return top.Factor } // rule (2)
// }
// return top.Factor + second.Factor                            // blend (existing)
```

Notes:
- **Tie-break added** to the Go sort (`C>D>I>S`) to match `getTopTwoTraits` /
  `calculateDiscProfile`. This is the only change to *blend* selection and only
  affects exact ties; called out so it's not a surprise.
- Missing factor = absent from the SQL group → treated as 0 (matches today).
- The existing `personality_traits` lookup is unchanged; with Job 2's rows a pure
  `dominantFactor` now resolves. If a row were somehow missing, `traitID` stays
  nil and `dominant_trait_id` simply isn't updated (graceful, no crash) - same as
  today's behaviour for an unmatched code.

Report layer (Q2): no recompute. A tiny shared TS mirror of this rule will be
added **only** for surfaces that must resolve from raw scores without a stored
`dominant_trait_id`; the report refactors to consume `dominant_trait_id` are
Phase 2 jobs, not here.

---

## Scope guard

- Touches only the Level-1 DISC branch + a new additive migration.
- No change to Level 2/3/4 scoring, the sincerity calc, report numbering, or the
  12 existing rows/keys/images.
- Backward compatible: a profile that isn't dominant enough yields the exact same
  blend as today.

## Verification plan (recorded in the AFTER doc)

1. Rebuild exam-engine; complete a Level-1 attempt in a dominant-C fixture →
   `dominant_trait_id` resolves to the `C` row.
2. Complete a balanced fixture → still a blend (e.g. `DI`), unchanged.
3. Re-run `explore_traits_db.js` → the 4 pure rows present; dashboard
   `behavioural-cohort` call returns pure cards (placeholder name/image) without
   error.
4. Confirm no change to attempts that don't meet the threshold (diff dominant
   codes on a sample before/after on identical inputs).

## Deferred from Phase 1 (tracked in master checklist)

Real names/colours (Q7), images (Q8), ACI/report narrative (Q9), JD-matching &
frontend lists (Q11), historical backfill (Q3, last).
