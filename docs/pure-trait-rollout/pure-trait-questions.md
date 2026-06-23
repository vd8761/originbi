# Pure Trait Rollout - Findings & Open Questions

> Goal (as I understand it): the system today recognises **12 two-letter DISC
> blends** (DI, DS, DC, ID, IS, IC, SD, SI, SC, CD, CI, CS). We want to add the
> **4 "Pure Traits"** - D, I, S, C on their own - for a total of **16**, derived
> from the DISC score using the same logic that already lives in the
> **Level 1 Placement Report**. This must be additive: existing 12-blend
> behaviour stays intact; pure traits are a new branch that fires only when the
> score math says a single dimension dominates.

Please answer inline (e.g. `Q1: ...`) or however is easiest, then ping me and
I'll start implementing.

---

## 1. The pure-trait rule already exists (reference implementation)

`backend/student-service/src/report/reports/college/specializationConstants.ts`
→ `calculateDiscProfile(scores)` is the logic you pointed me to (used by
`level1PlacementReport.ts`). It does:

1. Sort the four factors by score, tie-break order **C > D > I > S**.
2. **Absolute override:** if the top factor's score `>= 20` → return the single
   letter (Pure Trait).
3. **Relative override:** else if `top / 2 > every other factor` → single letter.
4. **Otherwise:** return the top-two concatenated (the normal 12-blend code).

`SPEC_MAP` in that same file already has all **16** entries (D/I/S/C +
12 blends), and `HIGH_FACTOR_TEXT` already has copy for the 4 pure traits
("Pure Dominance", "Pure Influence", "Pure Steadiness", "Pure
Conscientiousness"). So the placement/specialization family is the one place
that is already 16-aware.

---

## 2. There are THREE independent trait-computation paths today

This is the crux of the rollout - the override currently lives in only one of
them.

| # | Path | Where | Output today | Pure-aware? |
|---|------|-------|--------------|-------------|
| A | **Exam engine** (Go) | `backend/exam-engine/internal/service/exam_service.go` ~L523-541 | Always `top1+top2` (e.g. `DI`), then looks up `personality_traits.code`. Writes `assessment_attempts.dominant_trait_id`. | ❌ never emits a single letter |
| B | **Report layer** (TS) | `BaseReport.getTopTwoTraits()` (`reports/BaseReport.ts` L356) → each report concatenates top-two → content maps | Always a 2-letter code | ❌ |
| C | **Specialization/placement** (TS) | `calculateDiscProfile()` | 1 **or** 2 letters | ✅ (the reference) |

`dominant_trait_id` (from path A) is what the **corporate dashboard** and the
RAG/text-to-sql layer read. The student PDF reports mostly use path B. They do
**not** currently agree with each other.

---

## 3. Inventory - every place the "12" assumption is baked in

| Surface | File(s) | State | What pure traits would need |
|---|---|---|---|
| DISC → dominant trait calc | `exam_service.go` L523-541 | 12 only | add the override before the `personality_traits` lookup |
| Report top-two calc | `BaseReport.ts` `getTopTwoTraits` | 12 only | optional override branch |
| **DB `personality_traits`** | seeded **somewhere I can't find** (see Q6) - only *referenced* by `database/scripts/seed_corp_demo_20_users.sql`; not in `database/migrations/` | 12 rows (DI…CS) | **4 new rows** D/I/S/C: `code`, `blended_style_name`, `blended_style_desc`, `color_rgb`, `metadata{key_strengths, role_alignment, key_behaviors}` |
| Character images (student) | `frontend/public/student_traits/*.png` + `backend/student-service/public/assets/images/student_traits/*.png` | 12 each | 4 new PNGs each |
| Character images (corporate) | `frontend/public/traits/Corporate_*.png` | 12 | 4 new PNGs |
| Employee report content | `reports/employee/employeeConstants.ts` `BLENDED_STYLE_MAPPING` | 12 keys | 4 keys D/I/S/C (full narrative blocks) |
| CXO report content | `reports/cxo/cxoConstants.ts` `BLENDED_STYLE_MAPPING` | 12 keys | 4 keys |
| School report content | `reports/school/schoolConstants.ts` `BLENDED_STYLE_MAPPING`, `IDENTITY_MAP`, `CAREER_DOMAIN_MAP`, `DUAL_ARCHETYPE` | 12 keys each (these fall back to `'DC'`) | 4 keys each. NOTE: `DISC_AGILE_CAREER_PACE` is already keyed by single trait |
| College report content | `reports/college/collegeConstants.ts` `CONTENT` | **already keyed by single trait D/I/S/C** (uses primary only) | likely fine as-is - confirm |
| MBA short / MBA placement | `reports/college/mbaConstants.ts` | `DISC_ALIGNMENT` keyed by single trait ✅; `BEHAVIORAL_ORIENTATION` has **both** 12 blends **and** 4 single-letter fallbacks ✅ | likely fine - confirm |
| Placement archetype list | `reports/placement/placementConstants.ts` | 12 archetype names | depends on scope |
| Corporate dashboard buckets | `corporate-dashboard.service.ts` `bucketFor()` | uses **first letter** of code | already works for single letters ✅ |
| Corporate dashboard trait cards | same file | generic over `personality_traits` rows | works **iff** the 4 DB rows + images exist ✅ |
| Frontend dashboard | `frontend/components/corporate/PersonalityOverview.tsx` | fully data-driven | no change needed ✅ |
| JD matching | `corporate-service/src/jd-matching/jd-matching.service.ts` | map keyed by archetype **name** | add 4 pure archetypes if in scope |
| Frontend hardcoded archetypes | `components/corporate/candidates/CandidatesList.tsx`, `jobs/JobDetails.tsx` | enumerate archetype names/colors | add 4 if those lists must be exhaustive |

**Good news:** the corporate dashboard + its frontend are already generic - they
will display pure traits automatically *once the 4 `personality_traits` rows and
their images exist*. The real work is (a) where we apply the override, (b) the
DB rows, (c) the images, and (d) narrative content for employee/cxo/school.

---

## 4. Questions / decisions I need from you

### A. Where do we apply the override? (most important)

The override can go in path A (exam engine), path B (report layer), or both.

- **Q1.** Do you want the override applied at the **exam engine** so
  `dominant_trait_id` itself can point to a pure-trait row? That makes the
  **dashboard, JD-matching, RAG and every report** consistent in one place - but
  it **changes the stored dominant trait** for anyone whose top factor is
  dominant enough (e.g. someone who is "DC" today could become "D"). That is a
  real output change, which brushes against your "must not affect current
  workflow" rule. My recommendation: **yes, do it here** (single source of
  truth) and accept that newly-completed attempts may resolve to a pure trait -
  but I want your explicit OK because it is the one change that alters existing
  semantics.

- **Q2.** Should it **also** be added to `BaseReport.getTopTwoTraits` / the
  report layer, or will the reports read the engine's result? (If the engine is
  the source of truth, I'd have reports honour it instead of recomputing, so the
  PDF and the dashboard never disagree.)

### B. Retroactive vs. forward-only

- **Q3.** Already-completed attempts have a stored `dominant_trait_id` (always a
  blend today). Do we **re-mint** those (a one-off backfill/migration so old
  dashboards/reports show pure traits too), or apply the new rule **only to
  attempts completed from the change forward**? Reports regenerated from raw
  scores would shift retroactively regardless; the dashboard would only shift if
  we backfill. My recommendation: **forward-only by default**, with an optional
  backfill script you can run when ready.

### C. The threshold and the score scale

`calculateDiscProfile` uses an **absolute** cutoff of `>= 20`. But the score
scales differ between paths:
- The placement report and `seed_corp_demo` use **raw DISC score sums** (a
  dominant factor there is ~22-28).
- The student reports often rank by **answer counts**
  (`most_answered_answer_type`), a different scale where "20" may be meaningless.

- **Q4.** Should the pure-trait test use the **raw DISC score sum**
  (`metadata.disc_scores`, the same input as the placement report) everywhere -
  so the threshold stays comparable - or do you want it computed off answer
  counts in the report layer? My recommendation: **always use raw
  `disc_scores`** so the rule is identical to the placement report you built.

- **Q5.** Keep the exact rule (`>= 20` **OR** `top/2 > all others`), or did you
  intend only the relative `top/2 > rest` rule (which is scale-independent)? Is
  `20` a fixed constant or should it be configurable (e.g. an `originbi_settings`
  row)?

### D. The DB rows + content + assets for the 4 pure traits

- **Q6.** **Where are the 12 `personality_traits` rows defined/seeded?** I can't
  find an INSERT in `database/migrations/` - only a *reference* in the demo seed.
  Were they inserted manually in the DB / via an ad-hoc script? I need to know so
  I can add the 4 pure rows the same way (and write a migration if appropriate).

- **Q7.** What **archetype name** and **brand colour** should each pure trait
  use? The specialization report calls them "Pure Dominance / Influence /
  Steadiness / Conscientiousness", but the dashboard/report archetypes use
  two-word names like "Charismatic Leader". The character-image filename is
  derived from this name (`name.replace(/\s+/g,'_')` →
  `Corporate_<Name>.png` / `student_traits/<Name>.png`). Please give me the 4
  names + colours (or confirm I should reuse the "Pure …" names).

- **Q8.** Who provides the **4 new character images** (student + `Corporate_`
  variants, 3 files each across the two backends + frontend)? If you'll supply
  art, I'll wire the naming; if not, do you want me to fall back to an existing
  image / a generic placeholder until art is ready?

- **Q9.** For the **employee / CXO / school** reports, who writes the **narrative
  content** for D/I/S/C (the `style_desc`, `key_behaviours`, `typical_scenarios`,
  `trait_combinations`, identity/career-domain copy)? Options: (a) you/the
  content team supply it, (b) I reuse the single-trait copy that already exists
  in `collegeConstants.CONTENT` + `HIGH_FACTOR_TEXT`, (c) I draft placeholders for
  your review.

### E. Scope

- **Q10.** Which surfaces are **in scope for this pass**? My read is the gaps
  are: exam-engine calc, `personality_traits` rows + images (→ unlocks the
  dashboard), and employee/cxo/school report content. College/MBA/placement
  already handle single traits. Do you want all report families pure-aware now,
  or dashboard-first?

- **Q11.** Does **JD-matching** (`jd-matching.service.ts`) and the
  **hardcoded frontend archetype lists** (candidates list, job details) need the
  4 pure archetypes in this pass, or can they keep mapping pure traits onto the
  nearest blend for now?

---

## 5. What I will NOT change without your sign-off

- The exam-engine `dominant_trait_id` formula (Q1) - it ripples everywhere.
- Any backfill of historical attempts (Q3).
- The `>= 20` threshold value / rule shape (Q5).
- Deleting or renaming any existing 12-blend row, image, or map key.

Everything I'd add is intended to be **purely additive** - a new branch + new
keys/rows/assets - so the existing 12-blend flows keep producing exactly what
they produce today.
