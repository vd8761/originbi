# Phase 2 - Execution (BEFORE → AFTER) · Finish the empty parts, make it real

Completes the remaining Phase-2 jobs (CXO, School content + wiring across all
report families) and threads the **engine's resolved trait** into the report
data so reports stop recomputing (Q2). Employee was already done; this batch
finishes CXO + School + the JSON builders + the short reports, and wires the
real `dominant_trait_code` source.

---

## What was already true (start of this batch)

- `disc_trait.go` (engine, single source of truth) + `discTrait.ts` (TS mirror)
  resolve a pure trait when `top*2 >= total` OR `top/2 > every other`. ✅
- `personality_traits` + `aci_traits` have the 4 pure rows. ✅
- `employeeConstants.BLENDED_STYLE_MAPPING` has 4 pure keys; `employeeReport`
  PDF headline reads `resolveHeadlineTrait`. ✅
- `BaseReport.resolveHeadlineTrait(data)` exists (prefers `dominant_trait_code`,
  else recomputes from scores). ✅

## Key facts that shaped this batch's design (verified in code)

1. **`most_answered_answer_type` COUNT values *are* the raw `disc_scores` sums**
   (`groupReportHelper.processSessionRows`, lines ~394-399). So the existing
   `getTopTwoTraits(most_answered…)` already orders on the **engine's own input**
   and always returns a **2-letter** blend - it never emits a pure code and never
   breaks on one. ⇒ The career/compatibility/element lookups need **no change**;
   only the **headline/archetype** site per report must become pure-capable.
2. **College is already pure-compatible.** `collegeConstants.CONTENT` is keyed by
   the **single primary letter** (`CONTENT[primary]`) and career uses the 2-letter
   blend (`getCareerGuidanceByTrait(blend, dept)`), both of which exist for every
   profile. A pure-D student naturally reads `CONTENT['D']`. ⇒ verify only, no edit.
3. **School career/identity maps** (`IDENTITY_MAP`, `CAREER_DOMAIN_MAP`,
   `DUAL_ARCHETYPE`) are keyed by the **top-two blend** (`ci_topTwo`), matching the
   resolved decision "career/identity = top-two blend." ⇒ they stay blend-keyed,
   no pure keys. Only `SCHOOL_BLENDED_STYLE_MAPPING` (the headline archetype) gains
   pure keys.
4. `resolveHeadlineTrait`'s score fallback runs on the **percentage-scaled**
   `score_*` (calcScore = 40 + 1.5·raw), which is *not* proportional, so the
   `top*2 >= total` rule would differ from the engine. ⇒ fallback must use the raw
   sums (available in `most_answered_answer_type`), and the **authoritative** path
   is the stored `dominant_trait_code`.

## Changes in this batch

### A. Content (4 pure keys each; no DISC letters; archetype names from the DB rows)
- `cxoConstants.BLENDED_STYLE_MAPPING` - Bold Driver / Inspiring Motivator /
  Steadfast Anchor / Precise Perfectionist, **executive-flavoured** roles +
  `trait_combinations` (5-col table the CXO report renders).
- `schoolConstants.SCHOOL_BLENDED_STYLE_MAPPING` - same 4 archetypes,
  **school-flavoured** (stream/subject suggestions) + `trait_mapping1` /
  `trait_mapping2` (4-col tables the school report renders).
- Employee: already authored (unchanged).

### B. Headline wiring (pure-capable; blend output unchanged)
- `cxoReport.generateBusinessVisionSection` → `resolveHeadlineTrait` for the map
  lookup; keep `getTopTwoTraits` for `primaryType`/respond table.
- `schoolReport.generateAcademicCareerGoals` → `resolveHeadlineTrait` for the map
  lookup; keep top-two blend for `renderElementCombo` + respond table.
- `schoolShortReport.drawOverview` → prefer the resolved headline for the style
  label, fall back to the passed 2-letter combo.
- JSON builders (`employeeReportJSON`, `cxoReportJSON`, `schoolReportJSON`) →
  pure-capable headline for the blended-style block; other lookups untouched.

### C. Real data source (Q2 - stop recomputing, read the engine)
- `types.ts`: add `dominant_trait_code?: string` to College/School/Employee/Cxo.
- `groupReportHelper.processSessionRows`: select `aa.dominant_trait_id` +
  `LEFT JOIN personality_traits pt` → set `baseData.dominant_trait_code` from the
  DISC attempt's `pt.code`.
- `BaseReport.resolveHeadlineTrait`: fallback now resolves from the raw sums in
  `most_answered_answer_type` (engine-consistent) before the last-resort score path.

### D. Tests + samples + docs
- Extend `database/scripts/validate_report_trait_maps.js`: assert **all 16 codes**
  resolve in employee + cxo + school maps; the 4 pure entries are well-formed
  (required fields present, **no DISC letter** in `style_name`); resolver→map
  coverage (every code the resolver can emit has content).
- `sample-reports/generate_samples.js`: add `pureCxo` (C-dominant) and
  `pureSchool` (I-dominant) demos; rebuild + regenerate all PDFs.
- This file gets an **AFTER** section with the test output + sample diff.

## Guardrails (unchanged)
Additive only. Existing 12-blend keys, lookups, and blend output are untouched;
a pure code appears only where the engine emits one (or, with no stored code, the
identical rule applied to the raw sums). No DB seed; career/compat keep the
top-two blend behind `PURE_CAREER_ROWS_AVAILABLE`.

---

## AFTER (results)

**Shipped.** All five sub-jobs done; build, tests, and samples green.

### Files changed
- Content: `cxoConstants.ts` (+4 pure keys in `BLENDED_STYLE_MAPPING`),
  `schoolConstants.ts` (+4 pure keys in `SCHOOL_BLENDED_STYLE_MAPPING`, each with
  `trait_mapping1`/`trait_mapping2`).
- Helper: `discTrait.ts` - new `resolveHeadlineFromReportData(data)` (single
  engine-consistent implementation: stored code → raw sums → scores).
- Wiring: `cxoReport.ts`, `schoolReport.ts`, `schoolShortReport.ts`,
  `employeeReportJSON.ts`, `cxoReportJSON.ts`, `schoolReportJSON.ts` →
  pure-capable headline; `BaseReport.resolveHeadlineTrait` delegates to the helper.
- Data: `types.ts` (+`dominant_trait_code?`), `groupReportHelper.ts`
  (`processSessionRows` now reads `pt.code` from the DISC attempt's
  `dominant_trait_id` and sets `baseData.dominant_trait_code`).
- Tests: `validate_report_trait_maps.js` (now employee + cxo + school, all 16
  codes, pure-entry shape, banned-pattern scan, resolver→map coverage on every
  map), `validate_disc_trait_ts.js` (+`resolveHeadlineFromReportData` precedence).
- Samples: `generate_samples.js` (+`cxo_full_PURE-C`, `school_full_PURE-I`;
  explicit `dominant_trait_code` on the 3 pure demos) + `sample-reports/README.md`.

### Verification (all green)
- `npx nest build` → **EXIT 0** (full type-check of every edit).
- `node database/scripts/validate_report_trait_maps.js` → **ALL MAP COVERAGE
  TESTS PASSED** (employee/cxo/school × 16 codes + 4 pure entries + banned-pattern
  + resolver coverage).
- `node database/scripts/validate_disc_trait_ts.js` → **ALL TS RESOLVER TESTS
  PASSED** (17 parity cases + topTwoBlend + careerLookupCode + the 4 new
  `resolveHeadlineFromReportData` precedence cases).
- `node database/scripts/validate_pure_traits.js` (engine + DB rows, unchanged) →
  still green.
- End-to-end dist check: PURE-D→"Bold Driver", PURE-C→"Precise Perfectionist",
  PURE-I→"Inspiring Motivator"; blend-with-no-code→"Charismatic Leader".
- 24 sample PDFs regenerated (12 jobs × ACI on/off), all `OK`. The PURE-I school
  log shows the headline using pure-I while the college/element fetch used the
  top-two blend `ID` - the intended split in action.

### Behavioural guarantee confirmed
- Existing blend profiles are unchanged: with a stored blend code the headline
  reads it verbatim; with no code, the raw-sum fallback reproduces the same blend
  the old `getTopTwoTraits` produced (the single-student mocks still render
  "Charismatic Leader").
- A pure archetype appears only when the engine emits a pure code (or, with no
  stored code, the identical rule on the raw sums). Career/compat/element sections
  keep the top-two blend behind `PURE_CAREER_ROWS_AVAILABLE` (still `false`).

### Follow-up audit - placement / Level-1 family (Q10) - FIXED
A re-audit surfaced that the **placement / Level-1 family** (in scope per Q10) had
been missed and still carried the very issues Q1/Q5 called out:

- **Two divergent pure-trait resolvers** still hardcoded `top.score >= 20`:
  `specializationConstants.calculateDiscProfile` and
  `collegeLevel1Report.resolveProfileCode`. Both now use the **single source of
  truth**: `calculateDiscProfile` delegates to `resolveDominantFactor` (dynamic
  50%-of-total rule); the Level-1 report reads `dominant_trait_code` via
  `resolveHeadlineTrait` (engine first, then the same dynamic rule). The dead
  `PURE_TRAIT_THRESHOLD = 20` constant + `resolveProfileCode` were removed.
- **DISC-letter / inconsistent pure names.** `SPEC_MAP[D/I/S/C].trait` was
  `"Pure Dominance"…`, `HIGH_FACTOR_TEXT` was `"Pure Dominance (D): …"`, and
  `collegeConstants.blendedTraits` named them `"Decisive Driver" / "Inspiring
  Influencer" / "Steady Supporter" / "Precise Analyst"`. All three now use the
  **canonical** names - Bold Driver / Inspiring Motivator / Steadfast Anchor /
  Precise Perfectionist - with no DISC letters.
- New guard: `database/scripts/validate_placement_trait_maps.js` (dist-based)
  asserts all 16 codes, canonical pure names, banned-pattern-free copy, and
  `calculateDiscProfile == resolveDominantFactor` (incl. a discriminating case -
  11/10/1/0 now resolves pure **D** where the old `>=20` gave `DI`). **PASS.**
- Sample added: `college_level1_PURE-S` (Steadfast Anchor) - renders the canonical
  name across hero, specialization, and high-factor sections.

With this, **all three pure-trait resolvers (Go engine, TS report mirror, and the
placement helper) and every rendered pure name are consistent.**

### Follow-up 2 - image/colour fallback + dashboard/JD/frontend audit

**Superhero image + trait colour → top-two blend fallback (pure score/name kept).**
A Pure Trait has no dedicated artwork or colour yet (those are Q7/Q8), so every
per-student surface that renders an archetype image/colour now borrows the
candidate's **top-two blend** for the image + colour while still showing the Pure
Trait's name and its own score. Implemented at:
- `collegeLevel1Report` (PDF hero) - already did this (verified).
- `student.service.ts` → `PersonalityCard.tsx` (student's own card): the resolved
  trait now carries `imageName` (top-two blend name for a pure code, own name for
  a blend) + `colorRgb`; the card uses `imageName` for `/student_traits/*.png`.
- `corporate-dashboard.service.ts` per-student `ProfileResult`: new
  `resolvePureVisualFallback(discScores)` sets `characterImage` /
  `strengthChartImage` / `colorRgb` to the top-two blend's for a pure code.

**Data-driven surfaces already pure-safe (no hardcoded 12-list to populate):**
- Corporate dashboard buckets map by **primary letter** (`code[0]` →
  action/people/steady/careful), so pure codes bucket correctly.
- Dashboard aggregate trait cards + JD-matching read name/colour/metadata from
  `personality_traits` (the 4 pure rows flow through); JD-matching scores at the
  DISC **dimension** level, which pure traits don't change.
- `mbaConstants.BEHAVIORAL_ORIENTATION` already had pure (D/I/S/C) keys.
- Frontend `PersonalityOverview` aggregate cards hide a missing image via
  `onError` (graceful); aggregate has no per-card top-two so it keeps the DB
  colour - acceptable until Q7/Q8.

**Hardcoded `20`:** confirmed the only pure-trait `>= 20` thresholds were
`calculateDiscProfile` + `collegeLevel1Report` (both now delegate to the dynamic
resolver). The remaining `20` in `exam_service.go` is the **sincerity** penalty
(`AttentionFails * 20.0`), unrelated to pure traits - left as-is.

**Build/verify:** `student-service` + `corporate-service` `nest build` → EXIT 0;
trait validators still green. (Frontend `tsc` shows only pre-existing errors in
Next's generated `.next/dev/types/*` cache - unrelated to the one-line component
change; recommend a `.next` rebuild to clear them.)

### Still open (master checklist, unchanged)
Final pure-trait **images** (Q8) + **colours** (Q7) - until then the top-two
blend fallback above is used; historical backfill (Job 9, last); ts-jest upgrade
to enable jest `.spec.ts`.
