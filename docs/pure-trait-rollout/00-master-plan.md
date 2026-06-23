# Pure Trait Rollout — Master Plan

Status: **Phase 1 complete.** **Phase 2 in progress** — Job 3a (shared TS
resolver `discTrait.ts` + node validator) done & green. Career/compatibility
DB-content strategy decision pending (see below). Jest specs blocked by a
jest30/ts-jest29 version clash → TS validated via node scripts for now.
Process: every job below gets a **design doc (before)** → your approval →
implementation → **change doc (after)**. Jobs are done **one at a time**.
Nothing is implemented yet.

---

## Decisions log (your answers)

| # | Decision |
|---|---|
| Q1 | **Single source of truth** = the exam engine. `dominant_trait_id` becomes pure-capable. Fix the inconsistent paths. |
| Q2 | Reports must **not** recompute the trait — they read the engine's resolved trait. |
| Q3 | **Backfill** historical completed attempts too (re-mint + regenerate) — but **lowest priority**. |
| Q4 | Pure-trait test runs off the **raw `disc_scores`** (same input as the placement report). |
| Q5 | Threshold is **not fixed at 20** — it's **50%**, made **dynamic** (20 = 50% of the 40 DISC max). |
| Q6 | Trait content lives in DB tables (`personality_traits`, `aci_traits`); explore the DB directly (done — see below). |
| Q7 | Pure-trait **names + colours** → you'll provide later → **checklist**. |
| Q8 | Pure-trait **images** → you'll provide later → **checklist**. |
| Q9 | Pure-trait **narrative copy** → **I draft it** (low priority; placeholders until then) → **checklist**. |
| Q10 | **Both** the placement family **and** the report/dashboard family are in scope. |
| Q11 | **JD-matching + hardcoded frontend archetype lists** → you'll provide later → **checklist**. |

---

## DB findings (from `database/scripts/explore_traits_db.js`, read-only)

- **`personality_traits`** — 12 rows, codes `DI DS DC ID IS IC SD SI SC CD CI CS`,
  each with `blended_style_name` + `color_rgb`. **`metadata` is `{}` for all 12**
  → the dashboard's key-strengths / role-alignment / key-behaviours are empty
  today, so pure rows with empty metadata stay consistent.
- **`aci_traits`** — separate 12-row table, codes same 12, columns
  `trait_title`, `personalized_insight`, `score_overview_interpretation`
  (titles differ from `personality_traits`, e.g. `SD` = "The Reliable Executor"
  here vs "Reliable Executor" there). Needs its own 4 pure rows + titles.
- **`assessment_levels`** — Level 1 = "Behavioral Insight", `pattern_type=DISC`,
  **`max_score = 40`**. (ACI Level 2 = 125 = 25×5, so `max_score` is not a
  universal question count — but for DISC it is the 40 you referenced.)
- **DISC scale** — option `score_value` ∈ {1, 3, 5}; ~40 scored DISC answers per
  attempt (50 total incl. attention/distraction items). Real `disc_scores.total`
  avg **40.3**, max **62**, min 0.
- **Current dominant codes** — all 711 completed attempts map to one of the 12
  two-letter codes; **no single-letter codes exist yet** (engine never emits
  them). C-primary dominates (CD 151, CS 99 …) from the C>D>I>S tie-break.

---

## Dynamic threshold design (for confirmation at Job 1's design gate)

Faithful port of `calculateDiscProfile`, with the absolute cutoff made dynamic.
Given `scores = {D,I,S,C}`, `total = D+I+S+C`, sorted desc (tie-break C>D>I>S):

```
pure trait (single letter) when EITHER:
  (1) top.score * 2 >= total            // "≥ 50% of the DISC total"  (≡ top ≥ the other three combined)
  (2) top.score / 2  >  every other     // relative dominance rule (unchanged from placement report)
otherwise → top-two blend (the existing 12 behaviour)
```

- At the nominal 40-point scale, rule (1) = `top ≥ 20`, exactly your "50% of 40".
- Self-normalising: no hard-coded 20, no dependency on question count, works even
  when a candidate's total ≠ 40.
- **CONFIRMED (Q5):** use **50% of the candidate's actual `total`** — i.e.
  `top.score * 2 >= total`. Flat-20 option rejected.

This same spec is implemented in **both** Go (exam engine, the writer) and TS
(only where a surface must resolve a trait without a stored `dominant_trait_id`),
kept byte-for-byte equivalent and documented in one place.

---

## Job breakdown (sequenced)

Legend: 🟢 ready to start · 🟡 needs a checklist input · ⚪ depends on earlier job

### Phase 1 — Make `dominant_trait_id` pure-capable (the source of truth) ✅ DONE

- **Job 1 — Dynamic pure-trait resolver + engine wiring.** ✅ shipped
  `disc_trait.go` + 17-case Go test; `exam_service.go` wired. See `02-phase1-change.md`.
- **Job 2 — Add 4 pure rows to `personality_traits` + `aci_traits`.** ✅ shipped
  (placeholder names/colours, swap on Q7) — `032_pure_traits.sql`, validated.

### Phase 2 — Reports consume the resolved trait (stop recomputing)

**Foundation (done):** shared `discTrait.ts` — `resolveDominantFactor` (headline,
pure-capable), `topTwoBlend` + `careerLookupCode` (career/compat use the top-two
blend; pure rows deferred behind `PURE_CAREER_ROWS_AVAILABLE`). Validated by
`validate_disc_trait_ts.js`. Remaining = add 4 pure keys to the report content
maps + wire each report to (a) use the engine's resolved code for the headline,
(b) use `careerLookupCode` for the `trait_id` lookups.

- **Job 3 — School report.** ✅ DONE. Headline (`generateAcademicCareerGoals`,
  `schoolShortReport.drawOverview`, `schoolReportJSON`) reads the engine-resolved
  trait; 4 pure keys added to `SCHOOL_BLENDED_STYLE_MAPPING`. The element combo +
  respond table keep the top-two blend. `IDENTITY_MAP`/`CAREER_DOMAIN_MAP`/
  `DUAL_ARCHETYPE` stay top-two-blend keyed by design (no pure keys needed).
- **Job 4 — Employee report.** ✅ DONE. `BLENDED_STYLE_MAPPING` pure keys +
  `employeeReport`/`employeeReportJSON` headline wired.
- **Job 5 — CXO report.** ✅ DONE. `BLENDED_STYLE_MAPPING` pure keys +
  `cxoReport`/`cxoReportJSON` headline wired (executive-flavoured copy).
- **Job 6 — College / MBA / Placement verify.** ✅ DONE. Confirmed pure-compatible
  as-is: `collegeConstants.CONTENT` is keyed by the single primary letter and
  career uses the 2-letter blend (`getCareerGuidanceByTrait`), both of which exist
  for every profile — a pure code never falls back. No code change required.

**Engine-as-source-of-truth (Q2) wired:** `dominant_trait_code` now flows from
`dominant_trait_id → personality_traits.code` into the report data
(`groupReportHelper.processSessionRows`, `types.ts`), and every report headline
reads it via `resolveHeadlineFromReportData` (fallback uses the raw DISC sums, not
the percentage scores, so it matches the engine). See `04-phase2-execution.md`.

### Phase 3 — Assets & dashboard

- **Job 7 — Pure-trait images + dashboard verify.** 🟡 (Q8 art)
  Drop 4 `student_traits/*.png` + 4 `traits/Corporate_*.png` (+ backend copies);
  add a graceful image fallback; verify the corporate dashboard renders the 4 new
  cards (it is already data-driven, so no UI code change expected).

### Phase 4 — Deferred / lowest priority

- **Job 8 — JD-matching + hardcoded frontend archetype lists.** 🟡 (Q11)
- **Job 9 — Historical backfill.** ⚪ (Q3, **last**)
  Re-mint `dominant_trait_id` for completed attempts under the new rule, then
  regenerate affected reports. One-off, reversible, run on your go-ahead.

---

## Checklist — external inputs I'm waiting on (won't block earlier jobs)

- [x] **Threshold confirm (Q5):** ✅ 50% of candidate's actual `total` (`top*2 >= total`).
- [~] **Names + colours (Q7):** assigned (proposed) — Bold Driver / Inspiring
      Motivator / Steadfast Anchor / Precise Perfectionist (+ "The …" for
      `aci_traits`); colours = DISC bar colours. Swap via `UPDATE` if you prefer.
- [ ] **Images (Q8):** `student_traits/<Name>.png` + `traits/Corporate_<Name>.png`
      for each of the 4 (filename derives from the assigned name above).
- [~] **Narrative copy (Q9):** DB rows (`personality_traits` + `aci_traits`) now
      written, no DISC letters. Employee/CXO/school report-map copy = Phase 2.
- [ ] **JD-matching + frontend lists (Q11):** whether the 4 pure archetypes join
      `jd-matching.service.ts` and the candidate/job archetype chips now or later.

---

## Guardrails (unchanged from the questions doc)

Everything is **additive** — new branch, new rows, new keys, new assets. No
existing 12-blend row, key, image, or output is renamed or removed. The only
intentional behavioural change is that a sufficiently dominant profile now
resolves to a pure trait instead of a blend (Q1), and — later and last — the
backfill applies that to historical data (Q3).
