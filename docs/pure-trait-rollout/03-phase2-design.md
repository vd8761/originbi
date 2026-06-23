# Phase 2 - Design (BEFORE) · Reports honour the resolved trait + Pure Traits

Covers **Jobs 3–6** (school / employee / CXO / college report families).
Approve (and answer the one product decision at the end) to authorise implementation.

---

## Objective

Make the per-student PDF reports (a) use the **engine's** resolved trait instead
of recomputing their own, and (b) render correctly when that trait is a Pure
Trait (D/I/S/C) - without changing any of the existing 12-blend output.

## Current state (what I found)

1. **Reports recompute.** Each report calls `BaseReport.getTopTwoTraits(...)` on
   `most_answered_answer_type` (answer **counts**) and concatenates the top two,
   e.g. `"DI"`. This can already disagree with the engine, which resolves from
   `disc_scores` **sums**. (Q2 says: stop recomputing, read the engine.)
2. **Trait code drives DB lookups.** That computed code is passed to
   `getCareerGuidanceByTrait(code, dept)` and `getCompatibilityMatrixDetails(code, …)`
   in `sqlHelper.ts`, which resolve `personality_traits.id` then read
   `career_roles` (and related) by `trait_id`. These rows exist for the **12
   blends only** → a pure code returns empty unless we add data or a fallback.
3. **TS content maps are keyed by the 12.** `BLENDED_STYLE_MAPPING`
   (employee/cxo/school), `IDENTITY_MAP`, `CAREER_DOMAIN_MAP`, `DUAL_ARCHETYPE`
   (school) all fall back to `'DC'` for unknown keys. `collegeConstants.CONTENT`
   and `mbaConstants` are already keyed by single trait (pure-ready).

## Approach (Q2-compliant)

**A. Resolve once, read everywhere.** Add the engine's resolved code to the
per-student report data (`dominant_trait_code` from the consolidated query's
`personality_traits` join on `dominant_trait_id`). Replace the per-report
`getTopTwoTraits` usage with a small shared helper:

```
resolveReportTrait(data):
  if data.dominant_trait_code present  -> use it           // engine = source of truth
  else                                  -> ResolveDominantFactor(disc_scores)   // TS mirror, same rule as Go
```

The TS mirror is the exact rule already validated in `validate_pure_traits.js`
(kept in lock-step with `disc_trait.go`). For the existing maps that need a
`primary`/`secondary` split, a pure code `"D"` has `primary='D'`, `secondary=''`.

**B. Add pure-trait keys to the TS content maps** (employee, cxo, school) using
the same archetype names as the DB rows (Bold Driver / Inspiring Motivator /
Steadfast Anchor / Precise Perfectionist). I draft this copy (Q9), consistent
with the `personality_traits.blended_style_desc` already shipped.

**C. Trait_id-keyed DB content for pure traits** - see the decision below.

## Sub-jobs (each ships with a test)

- **Job 3a - Shared TS resolver + report-data field.** Add `resolveReportTrait`
  + the `dominant_trait_code` field; unit test mirrors the 17 Go cases (Go⇄TS
  parity). No visual change yet.
- **Job 3b - Employee report.** 4 pure keys in `employeeConstants.BLENDED_STYLE_MAPPING`;
  switch `employeeReport`/`employeeReportJSON` to `resolveReportTrait`.
- **Job 3c - CXO report.** Same for `cxoConstants` + cxo reports.
- **Job 3d - School report.** 4 pure keys in `BLENDED_STYLE_MAPPING`,
  `IDENTITY_MAP`, `CAREER_DOMAIN_MAP`, `DUAL_ARCHETYPE`; switch school reports.
- **Job 6 - College/MBA/placement verify.** Confirm pure codes flow through
  `CONTENT`/`SPEC_MAP`/`mbaConstants` with no `'DC'` fallback; patch any gap.

**Test per job:** a TS unit test asserting all **16** codes resolve to non-fallback
content in each map (no silent `|| 'DC'`), plus the resolver parity test.

## Tests / runners

**Finding (Job 3a):** `student-service` pins **jest@30 + ts-jest@29**, which are
incompatible - jest rejects the ts-jest transformer, so `.spec.ts` files cannot
run (and adding one would break `npm test`). Until ts-jest is upgraded, TS logic
is validated with **node transpile-and-run scripts** under `database/scripts/`
(no transformer needed, runs anywhere). The case tables are written so they can
move into a jest spec verbatim once the toolchain is aligned.
→ Infra item for you: bump `ts-jest` to a jest-30-compatible release to enable
`*.spec.ts`.

**Status:**
- Job 3a ✅ - `discTrait.ts` + `validate_disc_trait_ts.js` (resolver + blend +
  career seam, all green).
- Job 3b ✅ (content) - employee `BLENDED_STYLE_MAPPING` gained 4 pure entries;
  `validate_report_trait_maps.js` confirms all 16 codes + pure-entry shape.
  Report **wiring** (read engine code + `careerLookupCode`) still pending.
- Jobs 3c (CXO), 3d (school), 6 (college verify) + wiring: pending.

## Guardrails

- Additive: every existing 12-blend key/lookup is untouched; pure keys are new.
- A pure code only appears when the engine emits one - existing data is unchanged
  until the Job 9 backfill.

## Product decision (RESOLVED) - career_roles / compatibility for pure traits

`career_roles` (~137 roles × 31 depts/trait) and `trait_based_course_details`
(360/trait × 24 stream-depts) exist for the 12 blends only (~6,000 rows to mirror).

**Decision:** do **not** author pure rows now. A Pure-Trait student's
career-guidance & course-compatibility sections use their **top-two blend** (two
highest factors) - the blend rows always exist. The HEADLINE/narrative/identity
still uses the pure trait. This is a **swappable seam**, not permanent:

- `discTrait.careerLookupCode(resolvedTrait, scores)` returns `topTwoBlend(scores)`
  while `PURE_CAREER_ROWS_AVAILABLE === false`.
- When pure career rows are authored later, flip the flag → pure students use
  their own `trait_id`; nothing else changes. ✅ shipped + tested in Job 3a.

So Phase 2 narrows to: **headline trait = engine's resolved code (pure-capable);
career/compat = top-two blend; content maps gain 4 pure keys.** No DB seed.

## Deferred (master checklist)

Images (Q8), JD-matching + frontend archetype lists (Q11), historical backfill
(Job 9), final names if you want to change them (Q7).
