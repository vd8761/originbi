# Level 1 - Behavioural (DISC)

The Know More page today is a single trait-count list. Level 1 is the most structured of the three levels: every answer maps to a `disc_factor` (D/I/S/C) on `assessment_question_options`, and every attempt has DISC totals, a dominant trait, sincerity scoring, and per-question behavioural telemetry. We can pivot the cohort across all of that.

## Raw data available (per candidate)

**From `assessment_attempts` (+ its `metadata.disc_scores`)**
- `total_score`, `max_score_snapshot`
- `metadata.disc_scores` → `{ D, I, S, C, total }` (raw factor sums)
- `dominant_trait_id` → joins `personality_traits.code` (single letter or 2-letter blend like `DI`, `SC`) + `blended_style_name`, `blended_style_desc`
- `sincerity_index` (0–100), `sincerity_class` (`SINCERE` / `BORDERLINE` / `NOT_SINCERE`)
- `started_at`, `completed_at` → duration

**From `assessment_answers`**
- `time_spent_seconds` per question
- `answer_change_count` (indecision)
- `is_attention_fail`, `is_distraction_chosen`, `sincerity_flag` (1 = fail, 2 = sincere, 0 = unset)
- `question_options_order` (shown order - useful to detect position bias)
- `main_option_id` chosen → option's `disc_factor` + `score_value`
- `assessment_questions.category` (D/I/S/C category at the question level)

**From `personality_traits`**
- `code` (D/I/S/C/DI/DS…/blends), `blended_style_name`, `blended_style_desc`

---

## What we can show on the Know More page

### 1. DISC distribution (replace the current donut)
- **Cohort DISC profile** - stacked or radial bar of average `D / I / S / C` factor scores across all completed applicants. Lets the corporate see *what the pool looks like* in raw DISC, not just the labelled trait.
- **DISC quadrant scatter** - each applicant as a dot on a D↔S × I↔C plane (Task vs People × Fast vs Cautious). Cluster centroids per job role.
- **Blend distribution** - bar chart of 2-letter codes (`DI`, `DC`, `SI`, `SC`, …) sorted by count, not just the 4 pure types.

### 2. Trait → role fit
- For each trait, the count we show today, **but also**:
  - Avg sincerity per trait (is the dominant-D group answering consistently?)
  - % of trait holders flagged `NOT_SINCERE` / `BORDERLINE`
  - Avg time-to-complete per trait
  - Top job (from `corporate_jobs`) the trait is applying to

### 3. Sincerity / data-quality panel
- Cohort sincerity histogram (0–100 in 10-point bins)
- Count by `sincerity_class`
- "Trustworthy pool size" = applicants where `sincerity_index >= 80`. Show toggle to filter the rest of the page by trustworthy-only.
- Avg attention fails per attempt, avg distraction picks per attempt

### 4. Per-question behavioural slices
- **Indecision heatmap** - questions with the highest avg `answer_change_count` (which prompts make this cohort flip-flop?)
- **Speed outliers** - questions answered in < 3 s on average (rushed) vs > 60 s (deliberation)
- **Attention-fail leaderboard** - questions where this cohort fails attention checks most
- **Position bias** - for questions where shuffle (`question_options_order`) varies, does the cohort still pick position-1 disproportionately?

### 5. Cohort comparisons (filters on the same page)
- By job / job role (`corporate_jobs` → registration)
- By gender (`registrations.gender`)
- By date range (already in the dashboard widget - reuse)
- By group (`groups` - useful when multiple intake batches)
- By DISC trait (click a trait → page filters to that subset)

### 6. Funnel / completion strip
- Registered → Started L1 → Completed L1, with % drop-off
- Avg time-to-start (registration → started_at) and avg time-to-finish

### 7. Detail drill-down (modal from any trait/bar)
- Candidate list with: name, DISC %D/%I/%S/%C bars, dominant blend, sincerity, time taken, applied job, view-profile link

---

## Derivable metrics (computed from raw, no AI needed)

| Metric | Formula | Why useful |
|---|---|---|
| DISC % per candidate | `factor / sum(D+I+S+C) * 100` | Normalises across max-score variations |
| Style intensity | `max(D,I,S,C) - second-max` | High = pure type, low = balanced |
| Task vs People score | `(D+C) - (I+S)` | Single axis for screening |
| Fast vs Cautious score | `(D+I) - (S+C)` | Pace dimension |
| Cohort fit score (per job) | cosine similarity of candidate DISC vector vs an ideal-profile vector defined by the corp | Ranking |
| Decisiveness index | `1 - avg(answer_change_count)/max_changes` | Confidence proxy |
| Engagement index | `1 - (attention_fails + distractions)/total_qs` | Effort proxy |
| Trust-weighted DISC | DISC averages weighted by `sincerity_index/100` | Removes garbage data |
| Response-time z-score | per-question RT vs cohort mean | Spot rushers / over-thinkers |
| Distractor pull rate | `distractions_chosen / questions_with_distractor` | Susceptibility to misdirection |

---

## Suggested page layout

```
[Header: cohort name, filters (job, date, gender, sincerity≥X)]

[KPI strip] Total | Completed | Avg sincerity | Decisiveness | Engagement

[DISC cohort profile]                [Trait distribution bar+%]
  radial avg D/I/S/C                   D, I, S, C, DI, DS, …

[Quadrant scatter (task×pace)]       [Sincerity histogram + class pie]

[Question telemetry tabs]
  Indecision | Speed | Attention fails | Position bias

[Per-trait drill table]
  trait | n | avg sincerity | avg time | top job | open list

[Funnel: Registered → Started → Completed]
```

Every chart should be click-through to a filtered candidate list - the current page is a dead end.
