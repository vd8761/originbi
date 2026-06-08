# Level 3 "Metaphor" — Backend + Frontend Architecture Plan

> Planning only (no code yet). Companion to `LEVEL3_METAPHOR_EXAM_PAGE_REQUIREMENT.md`.
> **Prime directive:** Level 3 is **additive and isolated**. Turning it off (Level 3 `is_mandatory = false`) must leave Level 1/2 and every other pipeline working untouched. No existing table is altered destructively; no existing flow is rewired — only new, gated code paths.

## A. Data model (new tables — migration `015_metaphor.sql`)

**1. `metaphor_questions`** — the Level 3 stimulus bank (5 sets × 20).
- `id`, `set_number` (smallint), `program_id` (nullable — global unless scoped), `external_code`
- `image_file` / `image_url` (varchar), `image_description_en/ta` (text), `context_text_en/ta` (text, optional), `question_text_en/ta` (text)
- `metadata` jsonb (e.g. source marker), `is_active`, `is_deleted`, timestamps

**2. `metaphor_answers`** — one row per (attempt, question), the stored response.
- `id`, `assessment_attempt_id`, `assessment_session_id`, `user_id`, `registration_id`, `program_id`, `assessment_level_id`
- `metaphor_question_id`, `question_sequence`
- `spoken_language` (varchar — language they chose)
- `answer_text_original` (text — transcript as spoken)
- `answer_text_en` (text, nullable — English translation, filled by the job)
- `translation_status` (varchar: `PENDING` | `DONE` | `FAILED` | `NONE`)
- `status` (`NOT_ANSWERED` | `ANSWERED`), timestamps
- **Checkpoints are NOT stored** (client-only).

**3. `metaphor_translation_jobs`** (optional, for admin visibility) — `id`, `assessment_attempt_id`, `status` (`PENDING`|`PROCESSING`|`DONE`|`FAILED`), `total`, `translated`, `last_error`, timestamps. (pgboss drives execution; this row is the human-readable rollup the admin panel reads.)

**4. `ai_usage_logs`** (generic AI usage / token tracking) — `id`, `purpose` (e.g. `metaphor_translation`), `assessment_attempt_id` (nullable), `model`, `input_tokens`, `output_tokens`, `total_tokens`, `question_count`, `question_ids` jsonb, `status`, `error`, `created_at`. One row **per AI call**. Because translation is **batched per attempt** (one call covers all that attempt's questions), the call-level tokens are the source of truth; per-question cost is derivable (`total_tokens / question_count`) or read from `question_ids`. Reusable for any future AI feature.

> All new tables only **reference** existing ids (attempt/session/user) — no FKs added onto existing tables, no schema changes to `assessment_*`.

## B. Admin settings (new `originbi_settings`, category `metaphor`)
- `metaphor_question_count` (number, default 20)
- `metaphor_allow_typing` (boolean, default false)
- `metaphor_duration_override` (boolean) + `metaphor_duration_seconds` (number) — per-question soft timer
- `metaphor_stt_provider` (json): `{ provider: 'web_speech'|'elevenlabs'|'azure'|'google'|'deepgram', params: {...} }` — non-secret config
- `metaphor_stt_secret` (string, sensitive) — provider API key (server-side only; never sent to browser)
- `metaphor_supported_languages` (json) — list for the picker, e.g. `[{code:'en-IN',label:'English'},{code:'ta-IN',label:'தமிழ்'}, ...]`
- `metaphor_translation_provider` (json) — provider for the async translation (e.g. Claude API / Google Translate)

Defaults are baked in so the feature behaves sanely even before an admin touches settings.

## C. Backend services (NestJS — new `metaphor` module in **student-service**; nothing in exam-engine)

Why student-service + a new module: the answer shape (voice text) is unlike the MCQ/option flow the Go exam-engine handles. Keeping it a separate NestJS module means **zero changes to the Go exam-engine** and no risk to Level 1/2 delivery.

**Candidate endpoints**
- `GET /metaphor/attempt/:attemptId/questions` → the candidate's generated questions (image, description, context, question, sequence, answered flag) + page config (allow typing, duration, languages, stt provider public config). Resumable (returns answered status per question).
- `GET /metaphor/stt-config` → `{ provider, params, token? }` — for cloud providers, mints a **short-lived token** server-side so API keys never reach the browser. For `web_speech`, returns `{ provider:'web_speech' }` (no token).
- `POST /metaphor/answers` → save ONE answer `{ attemptId, metaphorQuestionId, spokenLanguage, answerText }` → upsert into `metaphor_answers` (status ANSWERED, translation_status PENDING).
- `POST /metaphor/attempt/:attemptId/finish` → mark the Level 3 attempt COMPLETED + **enqueue the pgboss translation job**.

**Generation (gated, additive)**
- A `MetaphorGenerationService.generate(attempt)` that: picks a **random `set_number`** from active `metaphor_questions`, takes **N** (setting) questions, inserts `metaphor_answers` rows (NOT_ANSWERED) with sequence.
- Hooked into the existing registration loop **only** under `if (level is Metaphor)` (level_number === 3 OR pattern_type 'METAPHOR' OR name includes 'Metaphor'). If Level 3 isn't mandatory → never invoked. Guarded like Level 1: if no active metaphor questions, throw a clean "questions unavailable" (consistent with the existing guard) — or skip, matching how Level 2 behaves. (Decision: block vs skip.)

**Translation worker (pgboss — they already run pgboss) — Claude, batched per attempt**
- Queue `metaphor-translate`, payload `{ attemptId }`. One job per **attempt** (sequential across attempts, not per-question).
- Worker:
  1. Load all `metaphor_answers` for the attempt needing translation.
  2. **Single Claude call** for the whole attempt — prompt includes every answer keyed by id, and asks for **structured JSON back**: `[{ "id": <metaphorAnswerId>, "en": "<english>" }, ...]` (use tool/JSON-mode for reliable parsing).
  3. Parse JSON → update each row's `answer_text_en` + `translation_status=DONE`.
  4. **Log the call** to `ai_usage_logs` (model, input/output/total tokens from Claude's `usage`, `question_count`, `question_ids`, purpose `metaphor_translation`).
  5. Job succeeds only when **all** the attempt's rows are DONE; any parse/translation failure → mark remaining `FAILED` and **throw** so pgboss **retries with backoff**.
- **Periodic sweep** (pgboss scheduled job): re-enqueue attempts with any `PENDING/FAILED` translations — covers crashes/missed jobs.
- Batching = fewer Claude calls, lower cost/latency, and one clean usage-log row per attempt.

**Admin endpoints**
- `POST /admin/metaphor/translate/:attemptId` → manual (re-)enqueue translation.
- `GET /admin/metaphor/attempt/:attemptId/answers` → original + English per question + translation status (for the admin review tab).
- Metaphor question management (CRUD + bulk import + image upload/URL) — mirrors existing question admin.

## D. Frontend

**Candidate**
- New route/page **`MetaphorExam`** (separate from `AssessmentStarter` MCQ). The exam router sends the candidate here when the active attempt's level is Metaphor; MCQ flow is untouched.
- **Pluggable speech layer**: `useSpeechRecognition` hook with a **provider-adapter strategy** — `webSpeechAdapter`, `elevenLabsAdapter`, `azureAdapter`, … all behind one interface (`start/stop/onInterim/onFinal/onError`). The page fetches `/metaphor/stt-config`, picks the adapter, and never hard-codes a provider. Adding a provider later = add one adapter, no page rewrite.
- Checkpoint state machine (client-only, max 5, restart-one, start-over=current only), soft timer, Save & Next → POST answer, finish → POST finish.

**Admin**
- New **Metaphor settings** section (the §B knobs + provider config + supported languages) — same `SettingsManagement` pattern.
- **Translation management** view: attempts list with translation status, manual re-translate, view original + English per answer.
- (Later) a **Metaphor tab** in the assessment preview (like the Survey tab) to show a candidate's responses + translations.

## E. Isolation guarantees (the prime directive, concretely)
- **DB:** only new `metaphor_*` tables; existing tables unchanged. Dropping/disabling Level 3 leaves them as inert data.
- **Generation:** the Metaphor branch runs only when a Metaphor level is mandatory AND a metaphor bank exists; otherwise it's never entered.
- **Delivery:** a standalone NestJS module + endpoints + a standalone page. The Go exam-engine and the MCQ page are **not modified**.
- **Settings:** all new keys with safe defaults; absent settings → defaults; unused when Level 3 is off.
- **Translation:** isolated pgboss queue + worker; if it never runs (no Level 3), nothing else notices.
- **Kill switch:** `assessment_levels.is_mandatory = false` for Level 3 → no attempts created → page/endpoints/worker all dormant; Levels 1 & 2 and reports continue exactly as today.

## F. Decisions — RESOLVED
1. **Generation guard** — **skip silently** if Level 3 is on but the bank is empty (like Level 2); never blocks the main registration. ✅
2. **STT v1 adapters** — **Web Speech API** (default/fallback, free) + **ElevenLabs** (realtime, token-minted server-side). Others added later via the same adapter interface. ✅
3. **Translation provider** — **Claude API** (reuse existing key), **batched per attempt** with JSON output, **token usage logged** to `ai_usage_logs`. ✅
4. **Images** — **store URLs** (Aarya provides the ~100 images); no upload pipeline. ✅
5. **Metaphor question scope** — *(default: global bank; confirm if per-program needed.)*
6. **Back navigation** — *(default: forward-only; confirm.)*

## G. Suggested build order (when approved)
1. Migration 015 + settings seed + entities (additive).
2. Metaphor module in student-service: questions/answers endpoints + generation (gated).
3. pgboss translation worker + sweep + admin manual trigger.
4. Frontend MetaphorExam page + pluggable speech adapters (start with 1–2 providers).
5. Admin: settings + question import + translation management.
6. Wire Level 3 into the registration loop (gated) last, so nothing activates until everything's ready.
