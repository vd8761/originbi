# Level 4 — Metaphor (Image-prompt, voice answers)

Level 4 is the most free-form: candidates speak about an image, audio is transcribed, optionally translated, and an LLM writes a markdown report (`metaphor_reports.markdown`). The narrative is per-person and not directly aggregable — but **the inputs around it** (which image, language used, length, sentiment, time spent, transcription quality, audio metadata) are. The Know More page can show the corporate the *signal* across the answer pool even when the prose itself can only be read one report at a time.

## Raw data available

**`metaphor_answers`**
- `metaphor_question_id` → `metaphor_questions.image_url`, `image_description_en`, `set_number`, `question_number`
- `spoken_language` (e.g. `en`, `ta`, `hi`)
- `answer_text_original` (transcribed in spoken language)
- `answer_text_web` (browser SpeechRecognition fallback)
- `answer_text_en` (translated to English)
- `translation_status`, `transcription_status`, `transcription_source` (`web` / `gemini`), `transcription_retry_count`, `transcription_error`
- `audio_storage_key` — raw audio is on disk; size/duration retrievable
- `status`, `created_at`, `updated_at`
- Time spent is in the parallel `assessment_answers` row (linked via session/attempt) — `time_spent_seconds`, `answer_change_count` (= re-record count)

**`metaphor_questions`**
- The prompt itself: `image_url`, `image_description_en`, `context_text_en`, `question_text_en`

**`metaphor_reports`**
- `markdown` (LLM narrative)
- `model` (which LLM produced it — gemini, claude, gpt — useful for QA)
- `generated_at`

---

## What we can show on the Know More page

### 1. Answer-volume panel
- Total candidates who completed Level 4
- Total answers recorded, total audio minutes captured
- Avg answers per candidate
- Avg time spent per question

### 2. Language mix
- Pie / donut of `spoken_language` across the cohort
- Translation success rate per language
- "Answers we processed in English natively" vs "answers we translated" vs "answers that failed"

### 3. Data-quality strip
- Transcription success / pending / failed counts
- Avg retry count
- Avg audio duration (proxy: file size / sample rate)
- % answers with `answer_text_en` shorter than 10 words (likely dodge answers)
- % blank / "I don't know" patterns

### 4. Engagement strip
- Avg `time_spent_seconds` per question
- Avg word count of `answer_text_en` per question
- Re-record rate (`answer_change_count`)
- Histogram of words-per-answer

### 5. Per-image breakdown
For each metaphor question (image):
- Thumbnail of `image_url` + the prompt text
- N answers, avg words, avg time, % blank
- Click → list of answers from this cohort for that image

### 6. Text-derived cohort signals (computable without the LLM)
The raw `answer_text_en` enables a lot of lightweight NLP — none of it requires re-calling the report-writing model:
- **Word cloud / top-N keywords** per image (after stop-word removal) — what concepts this pool reaches for
- **Top bigrams / noun phrases** per image
- **Sentiment polarity** (off-the-shelf model) — % positive / neutral / negative answers per image
- **Reading-ease score** (Flesch) per answer → cohort distribution
- **Emotion classification** (joy / fear / anger / sadness / surprise) per answer if we want a richer axis
- **Theme clustering** — embed `answer_text_en`, cluster, label top 5 themes per image
- **Lexical diversity** (type/token ratio) — proxy for richness of response

### 7. Cross-cut filters
- By image (which prompt)
- By spoken language
- By job applied for
- By DISC trait from Level 1
- By IAT pattern from Level 3
  (e.g. "show me how D-types described image 3 vs S-types")

### 8. Report-level pulls (from `markdown`)
The narrative itself isn't aggregable, but we can **structure it once at generation time**: ask the LLM to emit a short JSON header (themes, dominant_emotion, recommended_followup_tags, confidence) alongside the markdown. Then we can aggregate the JSON across the cohort even though the prose stays personal.

If we don't want to re-run generation, a cheap post-hoc extraction job can tag each existing `markdown` with those fields and store them on the report row.

### 9. Per-candidate drill (modal)
- Each image + their transcript + audio playback (signed URL from `audio_storage_key`)
- Word count, time spent, language, retries
- "View full AI report" → full markdown
- Side-by-side Tamil/English when translated

---

## Derivable metrics (no AI dependency)

| Metric | Source | Why useful |
|---|---|---|
| Words per answer | `len(answer_text_en.split())` | Engagement / verbosity |
| Time per word | `time_spent_seconds / word_count` | Thoughtfulness vs filler |
| Blank-answer rate | `% with word_count < 5` | Dodge detection |
| Re-record rate | `answer_change_count > 0` | Self-correction / nerves |
| Language preference | `spoken_language` distribution | Hiring localisation insight |
| Translation reliability | `translation_status` distribution | Pipeline health |
| Transcription reliability | `transcription_status` + retry count | Pipeline health |
| Effort score | normalised(word_count) × time_spent | Per-candidate engagement |
| Image difficulty | per-image avg time + blank-rate | Which prompts are too abstract |
| Theme frequency | NLP cluster freq per image | What this pool talks about |
| Sentiment per image | avg polarity | Reactions to each prompt |
| Cross-image consistency | per-candidate sentiment stddev | Stable vs volatile narrator |
| Vocabulary depth | type/token ratio per candidate | Communication richness |

---

## What we *cannot* do at the cohort level
- Mean or compare full markdown narratives directly.
- Treat the LLM's prose as a numeric score.

Solution: store a structured JSON sidecar at generation time (themes, sentiment, recommendation tags), then aggregate the sidecar. Prose stays per-person; metrics aggregate.

## Suggested page layout

```
[KPI strip] Completed L4 | Total answers | Audio minutes | Avg words/answer | Avg time/question

[Language mix donut]   [Transcription quality bar]   [Data-quality flags]

[Per-image grid — card per metaphor question]
  thumbnail | prompt | N | avg words | avg time | top themes | sentiment bar

[Theme cluster cloud] [Sentiment per image] [Word-cloud per image (tab)]

[Cross-cut filters: language / job / DISC trait / IAT pattern / sincere-only]

[Candidate drill table → modal with transcripts + audio + AI report link]
```
