# Level 3 — IAT Gen (Implicit Association Test)

Level 3's report (`iat_reports.report_text`) is AI-generated and therefore not directly aggregable across a cohort. But the **inputs** to that report — module-level speeds, error rates, slowest words, and the structured `bias_map` — are all clean numbers and arrays we can pivot, rank, and compare. The Know More page can show the corporate what the AI saw across the whole pool, not just one person.

## Raw data available

**`iat_attempt_modules` — one row per (candidate × IAT module)**
- `module_id` → `iat_modules.code / display_name` (e.g. Career bias, Gender bias, Leadership bias…)
- `compatible_average_ms` — RT when stereotype-aligned pairing
- `incompatible_average_ms` — RT when stereotype-conflicting pairing
- `speed_gap_ms` = incompat − compat (the IAT D-score input)
- `pattern_label` (e.g. `STRONG_BIAS`, `MODERATE`, `NEUTRAL`, `REVERSE_BIAS`)
- `slowest_words` (jsonb array) — stimulus words this candidate slowed down on
- `error_words` (jsonb array) — words they misclassified
- `error_rate` (0–100)
- `started_at`, `completed_at` → per-module duration

**`iat_trials` — one row per stimulus shown**
- `block_type` (practice / compatible / incompatible / etc.)
- `word_shown`, `left_label`, `right_label`
- `expected_key`, `final_key_pressed`, `is_correct`
- `response_time_ms`, `first_response_time_ms` (gap between them = hesitation)
- `stimulus_id` → `iat_stimulus` (concept it belongs to)

**`iat_keypress`** — every keypress including reversals (rare but tells us "almost picked X, switched to Y")

**`iat_reports`**
- `bias_map` (jsonb array, structured per-module bias scores from the LLM)
- `report_input` (jsonb — the exact data we fed the model; we can re-aggregate from it)
- `report_text` (markdown narrative — *not* aggregable, candidate-level only)

---

## What we can show on the Know More page

### 1. Cohort bias panel (per IAT module)
For each `iat_module` (Career bias, Gender bias, Authority bias, etc.):
- Stacked bar: % of cohort in each `pattern_label` (Strong / Moderate / Neutral / Reverse)
- Avg `speed_gap_ms` with confidence interval
- Avg compat vs incompat RT side-by-side
- Avg error rate

Lets a hiring manager see, e.g., *"63 % of this applicant pool shows moderate-to-strong gender bias on leadership words."*

### 2. Module leaderboard
Rank modules by **how biased this cohort is** (descending avg speed gap). Highlights which implicit associations matter most for this group.

### 3. Word-level heatmap
Aggregate `slowest_words` and `error_words` across all attempts in a module → top 20 stimulus words this cohort consistently slowed on / errored on. Useful for the corp to see *which concepts* trip people up.

### 4. Reaction-time distribution
- Histogram of speed gaps in 50 ms bins per module (left-skew = mostly neutral, right-skew = bias-heavy pool)
- Box plot per module
- Scatter: error_rate × speed_gap (a high-error + high-gap quadrant = noisy data, not real bias)

### 5. Bias-map aggregation (from `iat_reports.bias_map`)
The AI's structured per-module bias array is the same shape across candidates. We can:
- Average each bias dimension across cohort
- Show top 5 implicit associations the AI flagged most often
- Count candidates where bias_map[i].severity == "high" per dimension

### 6. Data-quality strip
- % of attempts with error_rate > 30 (unreliable — IAT convention)
- % with extreme compatible_average_ms < 300 (too fast = random clicking)
- Trustworthy cohort size after filtering noisy attempts
- Toggle to filter the whole page to trustworthy-only

### 7. Cross-level signal
- Correlation: speed_gap × Level-1 DISC factor (does this pool's D-types show different career bias than S-types?)
- Speed gap by gender / by applied job / by group

### 8. Per-candidate drill (modal)
- Module-by-module table of speed gap and pattern label
- Sparkline of trial RTs in order (fatigue / learning curve)
- Their slowest/error words pulled out
- A "View AI report" link for the full narrative

---

## Derivable metrics (no AI re-call needed)

| Metric | Source | Formula |
|---|---|---|
| **D-score (IAT standard)** | trials | `(mean(incompat RT) − mean(compat RT)) / pooled SD of RTs` |
| Bias category | speed_gap_ms | `<200ms = none, 200–400 = slight, 400–650 = moderate, >650 = strong` |
| Hesitation index | trials | `mean(response_time_ms − first_response_time_ms)` |
| Reversal rate | iat_keypress | `% trials with key-change before final` |
| Module fatigue | trials in order | Slope of RT vs trial_sequence |
| Practice effect | trials | First-block avg RT vs last-block avg RT |
| Noisy attempt flag | module | `error_rate > 30 OR compat_avg < 300` |
| Cohort bias strength | per module | `mean(speed_gap_ms)` across non-noisy attempts |
| Cohort polarisation | per module | `std(speed_gap_ms)` — high = mixed pool, low = uniform |
| Concept hotspot | trials | `word_shown` ranked by `mean(RT)` across cohort |
| Mistake hotspot | trials | `word_shown` ranked by `% incorrect` across cohort |
| Cross-module consistency | per candidate | corr of speed_gap across their modules — flags response-style artefacts |

---

## What we *cannot* do at the cohort level
The AI narrative in `report_text` is per-person prose; we should not try to "average" sentences. But we should:
- Pre-extract structured fields (severity, top-concept, recommendation tag) into `bias_map` if not already, so cohort aggregation is purely numeric.
- Surface candidate-level narrative only on the drill-down modal.

## Suggested page layout

```
[KPI strip] Completed L3 | Avg D-score | % strong bias | Noisy attempts excluded

[Module bias panel — one card per IAT module]
  module name | distribution bar | avg speed gap | avg error rate | top slow words

[Speed-gap distribution chart]  [Bias-map top dimensions]

[Word hotspot table]
  word | mean RT | % errors | appears in N attempts

[Cross-cut filters: gender / job / DISC trait / sincere-only]

[Candidate drill table → modal with per-module detail + AI report link]
```
