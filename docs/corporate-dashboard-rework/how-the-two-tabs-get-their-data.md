# How the two tabs get their data

A short walk-through of where each number on the *Workforce Overview* page comes from.

---

## Common path

1. The corporate user opens **Dashboard → Know More**, which routes to `/corporate/personality-overview`.
2. The page (`PersonalityOverview.tsx`) fires two parallel calls keyed to the logged-in corporate email:
   - `GET /dashboard/behavioural-cohort?email=…`
   - `GET /dashboard/inner-patterns-cohort?email=…`
3. Both endpoints live in `corporate-service` and resolve the email → `corporate_account_id` first, then aggregate everything for that account (with `is_deleted = false` and `is_tech_assessment IN (0, 2)`).

Each tab renders independently from one of those responses.

---

## Tab 1 - Behavioural Personality (Level 1)

**Source tables:** `assessment_attempts`, `registrations`, `personality_traits`.

**Per-candidate row used:** every assessment_attempt that has a `dominant_trait_id`. That's one row per applicant who finished Level 1.

**What we read from each row:**

| Field on the page | Comes from |
|---|---|
| Character cards (name, color, image, description, strengths, roles, behaviours) | `personality_traits.blended_style_name / color_rgb / metadata` joined via `dominant_trait_id` |
| Four energy buckets (Action / People / Steady / Careful) | First letter of `personality_traits.code` - D→Action, I→People, S→Steady, C→Careful |
| Reliability banner | `assessment_attempts.sincerity_class` - counts of SINCERE / BORDERLINE / NOT_SINCERE |
| "At a glance" verdict | Computed from the bucket distribution (e.g. top bucket > 60% → "Mostly X", top two > 60% → "A mix of X and Y") |
| Strengths / watch-outs callouts | Rules on bucket share - a bucket above 25% adds a strength line, below 10% adds a watch-out line |

Everything is read-only - no AI involved, just SQL aggregation.

---

## Tab 2 - Inner Patterns (Level 3 / IAT)

**Source tables:** `iat_attempt_modules` joined to `iat_modules`, `assessment_attempts`, `registrations`.

**Per-candidate row used:** every `iat_attempt_modules` row where `status = 'COMPLETED'`. That's *12 rows per applicant* (one per theme).

**What we read:**

| Field on the page | Comes from |
|---|---|
| Theme card title | `iat_modules.display_name` |
| Distribution bar (No leaning / Slight / Moderate / Strong) | `iat_attempt_modules.pattern_label` bucketed: `strong` → Strong, `moderate` → Moderate, `low` (or anything else) → No leaning. (The exam engine writes only `low / moderate / strong` today - Slight stays empty until that grows.) |
| Per-theme verdict line | Picks the dominant bucket for that theme and renders the matching template ("Most show a strong hidden lean on …") |
| Stumble-word chips | Top 8 words from `iat_attempt_modules.slowest_words` + `error_words` arrays, counted across all candidates for that theme |
| Per-theme reliability % | Share of attempts where `error_rate ≤ 30` |
| Overall "at a glance" verdict | Theme with the highest combined moderate + strong count wins - page says "the strongest hidden pattern shows up on X" |
| Cohort reliability banner | A candidate is reliable if at most a third of their 12 modules were noisy (error_rate > 30) |

Again, no AI is called - the page reads only the structured numbers the engine wrote when the candidate finished. The per-person AI narrative still lives in `iat_reports.report_text` and is opened only on drill-down.

---

## Why both tabs ignore the AI report text

The Level 3 AI narrative (`iat_reports.report_text`) is written *per person*, so it cannot be averaged or rolled up. Every number you see on the cohort page comes from the **structured fields the engine already computed** (`pattern_label`, `slowest_words`, `error_words`, `error_rate`, `sincerity_class`, `dominant_trait_id`). The page just buckets, counts, and renders verdict templates on top - fast, deterministic, and the same answer every time.
