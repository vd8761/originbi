# Level 3 "Metaphor" — Exam Page Requirement (frontend page only)

> Scope: **only the candidate-facing exam page.** Backend tables, admin settings, generation, and evaluation are planned separately. This doc is for designing the page.

## 1. Purpose
A dedicated, full-screen assessment screen for **Level 3 (Metaphor)** — fundamentally different from the MCQ screen. Each question shows an **image + image description + context + question**, and the candidate answers **by voice** (speech-to-text, real-time). No options, no "correct" answer. One question at a time.

## 2. When this page is shown
- The student exam flow routes here when the active attempt's level is **Level 3 / Metaphor** (distinct from the MCQ screen used by Level 1).
- Only when Level 3 is active for the assessment and questions have been generated for the attempt.
- If Level 3 is turned off, the student never reaches this page (no attempt exists) — the page is fully self-contained.

## 3. Layout — 4 zones

**A. Top bar**
- Assessment title / level name ("Metaphor").
- Progress: **Question X of N** (+ a thin progress bar).
- **Per-question timer** (countdown, e.g. 2:00).
- **Language picker** (the language the candidate will *speak* in).
- (Optional) "Instructions" link, mic-status indicator.

**B. Stimulus panel (primary focus)**
- **Image** — large, prominent, zoom/lightbox on click.
- **Image description** — short text describing the image.
- **Context** — the scenario framing.
- **Question** — the prompt the candidate must respond to.
- Prompt text may exist in EN/TA — a small display-language toggle for *reading* (separate from the *speaking* language).

**C. Answer panel (voice)**
- Big **Speak / Stop** button (toggle) with a clear "listening…" animation (pulse/waveform).
- **Live transcript box** — read-only by default; updates in real time as they speak (interim + finalized text).
- **Checkpoint controls** (see §5).
- **Checkpoints strip** — saved segments shown **above** the transcript box (up to 5).

**D. Bottom bar**
- **Save & Next** (primary). On the last question → **Save & Finish**.
- Helper text / mic-permission state / error messages.

## 4. Per-question content (data the page renders)
| Field | Required | Notes |
|---|---|---|
| image | yes | URL; large display + zoom |
| image description | yes | text (EN/TA) |
| context | optional | text (EN/TA); hide block if empty |
| question | yes | text (EN/TA) |

## 5. Voice answer + checkpoint flow (the core interaction)
1. Candidate picks their **spoken language** (top bar).
2. Press **Speak** → real-time recognition begins; transcript streams into the read-only box. Press **Stop** to pause.
3. **Checkpoint** action *(working name "quicksave" — needs a real name; suggestions: **"Capture"**, **"Pin"**, **"Save Segment"**, **"Snapshot"**)*:
   - Takes the current transcript and pins it as a **checkpoint** shown above the box.
   - Up to **5 checkpoints**. Checkpoints are **never sent to our backend** — purely client-side (in-memory/DOM).
4. **Restart checkpoint** — re-record/replace **one specific** checkpoint (clears just that segment and lets them speak again into it).
5. **Start Over** — clears **only the current live recording**; pinned checkpoints are kept. ✅ (decided)
6. **Save & Next** — assembles the **final answer** from the checkpoints (+ current box) in order, persists it for that question, and advances. *(Decision: exact compose rule — checkpoints joined in order, then current box appended.)*

> Checkpoints = the candidate's scratch space to build the answer in pieces. Only the final assembled text on **Save & Next** is stored.

## 6. Typing restriction
- **Typing is disabled by default** (the box is read-only; answers must be spoken).
- Admin-configurable: when **"allow typing"** is enabled, the transcript box becomes editable as a fallback / supplement.

## 7. Timer
- **Per-question soft timer**, default **2 minutes**, **not force-submitted** by default (informational countdown).
- Admin toggle **"Override Level 3 duration"** → exposes a duration choice (a few preset options, e.g. 1 / 2 / 3 / 5 min per question, or a total-assessment timer).
- **On expiry: soft** — timer hits 0, candidate can keep answering (not force-submitted). ✅ (decided)

## 8. Navigation & completion
- One question per screen; **Save & Next** moves forward.
- *(Decision: allow going back to a previous question? Default: no — forward-only, since answers are saved per question.)*
- Last question → **Save & Finish** → marks the Level 3 attempt complete → returns to the exam/dashboard.
- **Resume**: if the candidate refreshes or re-enters, already-saved questions are skipped; they resume at the next unanswered question. **Checkpoints are lost on refresh** (client-only) — show a warning before navigating away.

## 9. Admin-configurable knobs that change this page
- **Number of questions** shown (default 20).
- **Allow typing** (default off).
- **Duration override** (toggle + duration options).
- (Supported spoken-language list is a fixed set the picker draws from.)

## 10. States & edge cases the design must cover
- **Mic permission denied** → clear message + how to grant; if typing disabled, candidate is blocked until granted *(decision: allow typing fallback in this case?)*.
- **Browser/STT unsupported** → message; fallback path *(tied to the speech-tech decision below)*.
- **Image fails to load** → placeholder + retry.
- **Network drop mid-recognition** → graceful stop + notice.
- **Empty answer on Save & Next** → confirm/warn ("Submit without an answer?").
- **5-checkpoint limit reached** → disable "Capture" (or replace-oldest — decision).
- **Timer at 0** → per §7 decision.

## 11. Out of scope for this page
- **Evaluation / scoring** — method not yet declared; answers are just stored.
- **Image generation** — handled separately (Aarya).
- **Translation to English** — pending decision (see below); if adopted, it happens at save/processing time, not on the page UI.

## 12. Decisions — RESOLVED
1. **Speech-to-text technology = pluggable provider (admin-configurable).** The page must support a **swappable STT provider** chosen in admin settings — browser Web Speech API, realtime cloud APIs (ElevenLabs, Azure/Google/Deepgram, etc.). The page reads the active provider + its public config (and, for cloud providers, an ephemeral token from the backend) and uses the matching adapter. Switching providers must not require page-code changes.
2. **Translation = asynchronous, after submit (pgboss).** The page stores only the **original-language** transcript on Save & Next. After the attempt is submitted, a **pgboss job** translates each answer **sequentially** (source→English); the job is marked successful **only when every question of the attempt is translated**, else it retries. A **periodic sweep** re-enqueues pending attempts. Admin panel can **manually re-translate**. So translation never touches the exam page.
3. **Timer expiry = soft** (informational; candidate continues).
4. **"Start Over" = clears current recording only** (checkpoints kept).
5. **Back navigation** — *(still open; default forward-only — confirm if revisiting saved questions is wanted.)*
