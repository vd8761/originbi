# Technical Assessment - Detailed Architecture and Database Specification

Date: 2026-04-09
Status: Proposed
Owner: Product + Engineering

## 1. Purpose
This document defines the full design for the Technical Assessment module:
1. Architecture
2. Database structure (all tables, columns, constraints, indexes)
3. Question and option shuffle design
4. MCQ and coding evaluation logic
5. Compiler integration workflow
6. Timing and audit calculation

## 2. Scope
In scope:
1. MCQ + Coding in one attempt
2. Candidate-specific deterministic shuffle
3. Secure code execution through Judge0 CE
4. Final score and timing calculation
5. Audit and anti-cheat telemetry

Out of scope (Phase 1):
1. Webcam proctoring
2. Plagiarism engine
3. Adaptive question difficulty

## 3. Architecture

### 3.1 Components
1. Candidate Frontend
- Fetches shuffled paper
- Sends MCQ answers and code
- Sends heartbeat and proctor events

2. Technical Assessment API
- Creates attempt
- Generates and persists shuffle order
- Saves answers
- Orchestrates compile/run/submit
- Finalizes score and timing

3. Judge0 Gateway (backend service)
- Converts internal run request to Judge0 payload
- Enforces execution policies
- Normalizes Judge0 responses

4. Data Stores
- PostgreSQL: source of truth
- Redis: short-lived cache for heartbeat/session states

### 3.2 High-level Runtime Flow
1. Start attempt
2. Fetch question pool
3. Shuffle questions/options with deterministic seed
4. Persist attempt items with display order and option order
5. Save MCQ/coding progress
6. Execute coding runs via Judge0
7. Final submit computes score + timing and locks attempt

## 4. Database Design Principles
1. Keep correctness-critical data normalized.
2. Use JSONB only for flexible per-question and per-attempt payloads.
3. Store shuffled order once and never regenerate for same attempt.
4. Evaluate MCQ only by option ID, never by display index.
5. Keep full audit trail for code runs and proctor events.
6. Keep final aggregate fields in attempt row for fast reporting.

## 5. Detailed Database Structure

### 5.1 Table List
1. tech_assessments
2. tech_questions
3. tech_question_hidden_tests
4. tech_attempts
5. tech_attempt_items
6. tech_code_runs
7. tech_proctor_events

---

### 5.2 Table: tech_assessments
Purpose:
- Defines assessment configuration and policies.

Columns:
1. id, bigint, PK, auto increment
2. code, varchar(50), unique, not null
3. name, varchar(200), not null
4. duration_minutes, int, not null, check > 0
5. blueprint_jsonb, jsonb, not null, default {}
6. language_rules_jsonb, jsonb, not null, default {}
7. scoring_policy_jsonb, jsonb, not null, default {}
8. is_active, boolean, not null, default true
9. created_at, timestamptz, not null, default now()
10. updated_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_assessments primary key (id)
2. uq_tech_assessments_code unique (code)
3. chk_tech_assessments_duration positive duration

Indexes:
1. idx_tech_assessments_active on (is_active)

Example blueprint_jsonb:
{
  "mcq": {"total": 40, "common": 25, "language": 15},
  "coding": {"total": 2, "easy": 1, "medium": 1}
}

---

### 5.3 Table: tech_questions
Purpose:
- Stores both MCQ and coding question definitions.

Columns:
1. id, bigint, PK, auto increment
2. question_code, varchar(80), not null
3. type, varchar(20), not null, values: mcq, coding
4. section, varchar(20), not null, values: common, language
5. language_code, varchar(20), nullable (required for language section)
6. difficulty, varchar(20), not null, values: easy, medium, hard
7. stem, text, not null
8. marks, numeric(8,2), not null, check > 0
9. question_payload, jsonb, not null, default {}
10. constraints_text, text, nullable
11. tags, jsonb, not null, default []
12. version, int, not null, default 1
13. is_active, boolean, not null, default true
14. created_at, timestamptz, not null, default now()
15. updated_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_questions primary key (id)
2. uq_tech_questions_code_version unique (question_code, version)
3. chk_tech_questions_type values: mcq or coding
4. chk_tech_questions_section values: common or language
5. chk_tech_questions_difficulty values: easy/medium/hard
6. chk_tech_questions_marks positive marks

Indexes:
1. idx_tech_questions_filter on (type, section, language_code, difficulty, is_active)
2. gin_tech_questions_payload GIN on question_payload
3. gin_tech_questions_tags GIN on tags

MCQ question_payload example:
{
  "multi_select": false,
  "options": [
    {"id": "opt_01", "text": "O(n)", "is_correct": false},
    {"id": "opt_02", "text": "O(log n)", "is_correct": true},
    {"id": "opt_03", "text": "O(n log n)", "is_correct": false},
    {"id": "opt_04", "text": "O(1)", "is_correct": false}
  ]
}

Coding question_payload example:
{
  "input_format": "Two integers a and b",
  "output_format": "Sum of a and b",
  "boilerplate_by_language": {
    "python": "def solve():\n    pass",
    "java": "class Main { public static void main(String[] args) {} }"
  },
  "sample_tests": [
    {"stdin": "2 3", "expected_stdout": "5"}
  ]
}

---

### 5.4 Table: tech_question_hidden_tests
Purpose:
- Stores hidden tests for coding evaluation only.

Columns:
1. id, bigint, PK, auto increment
2. tech_question_id, bigint, FK -> tech_questions.id, not null
3. stdin, text, not null
4. expected_stdout, text, not null
5. weight, numeric(8,4), not null, default 1.0000
6. execution_limit_ms, int, not null, default 2000
7. memory_limit_kb, int, not null, default 262144
8. is_active, boolean, not null, default true
9. checksum, char(64), not null
10. created_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_question_hidden_tests primary key (id)
2. fk_hidden_tests_question foreign key (tech_question_id) references tech_questions(id) on delete cascade
3. chk_hidden_weight positive weight
4. chk_hidden_exec_limit positive execution limit
5. chk_hidden_memory_limit positive memory limit
6. uq_hidden_test_checksum unique (tech_question_id, checksum)

Indexes:
1. idx_hidden_tests_question_active on (tech_question_id, is_active)

---

### 5.5 Table: tech_attempts
Purpose:
- Root record for one candidate attempt.

Columns:
1. id, bigint, PK, auto increment
2. tech_assessment_id, bigint, FK -> tech_assessments.id, not null
3. user_id, bigint, not null
4. registration_id, bigint, nullable
5. selected_language, varchar(20), not null
6. status, varchar(20), not null, values: not_started, in_progress, submitted, expired
7. starts_at, timestamptz, not null
8. expires_at, timestamptz, not null
9. submitted_at, timestamptz, nullable
10. seed, char(64), not null
11. score_mcq, numeric(8,2), not null, default 0
12. score_coding, numeric(8,2), not null, default 0
13. score_total, numeric(8,2), not null, default 0
14. total_elapsed_sec, int, not null, default 0
15. active_elapsed_sec, int, not null, default 0
16. idle_elapsed_sec, int, not null, default 0
17. completion_ratio, numeric(6,4), not null, default 0
18. metadata, jsonb, not null, default {}
19. created_at, timestamptz, not null, default now()
20. updated_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_attempts primary key (id)
2. fk_attempt_assessment foreign key (tech_assessment_id) references tech_assessments(id)
3. chk_attempt_status values: not_started/in_progress/submitted/expired
4. chk_attempt_time_range expires_at >= starts_at
5. chk_attempt_completion_ratio between 0 and 1
6. chk_attempt_scores_non_negative

Recommended business rule:
- At most one active attempt per user + assessment (partial unique index where status in not_started, in_progress).

Indexes:
1. idx_attempts_user_status on (user_id, status, starts_at)
2. idx_attempts_assessment on (tech_assessment_id, status)
3. idx_attempts_registration on (registration_id)

---

### 5.6 Table: tech_attempt_items
Purpose:
- Per-question state within an attempt.

Columns:
1. id, bigint, PK, auto increment
2. tech_attempt_id, bigint, FK -> tech_attempts.id, not null
3. tech_question_id, bigint, FK -> tech_questions.id, not null
4. display_order, int, not null
5. section, varchar(20), not null
6. question_type, varchar(20), not null, values: mcq, coding
7. render_payload, jsonb, not null, default {}
8. answer_payload, jsonb, not null, default {}
9. grading_payload, jsonb, not null, default {}
10. timing_payload, jsonb, not null, default {}
11. answered_at, timestamptz, nullable
12. updated_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_attempt_items primary key (id)
2. fk_attempt_items_attempt foreign key (tech_attempt_id) references tech_attempts(id) on delete cascade
3. fk_attempt_items_question foreign key (tech_question_id) references tech_questions(id)
4. uq_attempt_items_order unique (tech_attempt_id, display_order)
5. uq_attempt_items_question unique (tech_attempt_id, tech_question_id)
6. chk_attempt_items_type values: mcq or coding

Indexes:
1. idx_attempt_items_attempt_answered on (tech_attempt_id, answered_at)
2. idx_attempt_items_type on (tech_attempt_id, question_type)
3. gin_attempt_items_answer_payload GIN on answer_payload
4. gin_attempt_items_timing_payload GIN on timing_payload

render_payload example:
{
  "optionOrder": ["opt_04", "opt_02", "opt_01", "opt_03"],
  "sampleTests": [{"stdin": "2 3", "expected_stdout": "5"}]
}

answer_payload examples:
MCQ:
{
  "selectedOptionId": "opt_03"
}

Coding:
{
  "language": "python",
  "latestCodeVersion": 12,
  "lastAutosaveAt": "2026-04-09T10:20:30Z"
}

grading_payload examples:
MCQ:
{
  "isCorrect": true,
  "marksAwarded": 2.0
}

Coding:
{
  "passedHidden": 7,
  "totalHidden": 10,
  "scoreAwarded": 28.0,
  "lastFinalRunId": 9912
}

---

### 5.7 Table: tech_code_runs
Purpose:
- Full execution history for coding actions.

Columns:
1. id, bigint, PK, auto increment
2. tech_attempt_item_id, bigint, FK -> tech_attempt_items.id, not null
3. language_code, varchar(20), not null
4. source_code, text, not null
5. run_type, varchar(20), not null, values: custom, final
6. stdin_custom, text, nullable
7. verdict, varchar(40), not null
8. compile_output, text, nullable
9. runtime_output, text, nullable
10. stderr_output, text, nullable
11. passed_hidden, int, nullable
12. total_hidden, int, nullable
13. score_awarded, numeric(8,2), nullable
14. exec_ms, int, nullable
15. memory_kb, int, nullable
16. judge_token, varchar(120), nullable
17. created_at, timestamptz, not null, default now()

Constraints:
1. pk_tech_code_runs primary key (id)
2. fk_code_runs_item foreign key (tech_attempt_item_id) references tech_attempt_items(id) on delete cascade
3. chk_code_runs_type values: custom or final
4. chk_code_runs_counts passed_hidden <= total_hidden when both are not null

Indexes:
1. idx_code_runs_item_type_time on (tech_attempt_item_id, run_type, created_at desc)
2. idx_code_runs_token on (judge_token)
3. idx_code_runs_created_at on (created_at)

---

### 5.8 Table: tech_proctor_events
Purpose:
- Event timeline for anti-cheat and timing reconstruction.

Columns:
1. id, bigint, PK, auto increment
2. tech_attempt_id, bigint, FK -> tech_attempts.id, not null
3. event_type, varchar(40), not null
4. event_value, jsonb, not null, default {}
5. client_ts, timestamptz, nullable
6. created_at, timestamptz, not null, default now()

Allowed event_type values:
1. tab_blur
2. tab_focus
3. paste
4. fullscreen_exit
5. network_offline
6. network_online
7. question_enter
8. question_leave
9. heartbeat
10. idle_start
11. idle_end

Constraints:
1. pk_tech_proctor_events primary key (id)
2. fk_proctor_attempt foreign key (tech_attempt_id) references tech_attempts(id) on delete cascade

Indexes:
1. idx_proctor_attempt_time on (tech_attempt_id, created_at)
2. idx_proctor_event_type on (event_type)
3. gin_proctor_event_value GIN on event_value

---

### 5.9 Relationship Map
1. tech_assessments (1) -> (many) tech_attempts
2. tech_questions (1) -> (many) tech_question_hidden_tests
3. tech_attempts (1) -> (many) tech_attempt_items
4. tech_questions (1) -> (many) tech_attempt_items
5. tech_attempt_items (1) -> (many) tech_code_runs
6. tech_attempts (1) -> (many) tech_proctor_events

## 6. Shuffle, Pairing, and Persistence Logic

### 6.1 Seed Generation
Generate exactly once when attempt starts:
- seed = HMAC_SHA256(server_secret, attempt_id:user_id:assessment_id)

Why HMAC:
1. Deterministic
2. Tenant-safe and tamper-resistant
3. Very low CPU cost

### 6.2 Shuffle Algorithm
1. Build candidate pool from blueprint quotas.
2. Seed PRNG with seed value.
3. Shuffle selected question IDs.
4. For each MCQ, shuffle option IDs.
5. Persist in tech_attempt_items:
- display_order for questions
- render_payload.optionOrder for options

Important:
- Never reshuffle after initial persistence.
- Refresh/re-login must return persisted order.

### 6.3 MCQ Save and Correctness Rule
Save request:
- attemptItemId + selectedOptionId

Evaluation:
1. Read selectedOptionId from tech_attempt_items.answer_payload.
2. Resolve option in canonical tech_questions.question_payload.
3. Apply correctness by option ID.

Critical rule:
- Never evaluate by visible index.
- Always evaluate by selectedOptionId.

## 7. MCQ and Coding Score Calculation

### 7.1 MCQ Scoring
Per question:
- marks_awarded = question_marks if selectedOptionId is correct, else 0

Final:
- score_mcq = sum(marks_awarded for all MCQ items)

### 7.2 Coding Scoring
For each coding question final submission:
1. Run all active hidden tests.
2. passed_hidden = number of passed tests
3. total_hidden = number of executed hidden tests
4. pass_ratio = passed_hidden / total_hidden
5. problem_score = pass_ratio * question_marks

Weighted variant:
- problem_score = (sum(weight_passed) / sum(weight_total)) * question_marks

Final:
- score_coding = sum(problem_score across coding items)
- score_total = score_mcq + score_coding

## 8. Compiler Integration and Evaluation Workflow

### 8.1 Run Types
1. Custom Run
- Uses custom/sample input
- Informational only
- Does not lock score

2. Final Run
- Uses hidden tests
- Score-affecting
- Updates grading payload

### 8.2 Compile/Run Pipeline
1. API receives run request.
2. Validate attempt status and ownership.
3. Load execution policy (time/memory/output/network limits).
4. Submit to Judge0 CE and get token.
5. Poll token until terminal status.
6. Normalize result and persist to tech_code_runs.
7. For final run, aggregate hidden test pass counts and score.

### 8.3 Judge0 Status Handling (normalized)
1. Accepted
2. Wrong Answer
3. Time Limit Exceeded
4. Memory Limit Exceeded
5. Runtime Error
6. Compilation Error
7. Internal Error

### 8.4 Failure and Retry Rules
1. Retry transient gateway/network errors with capped retries.
2. Do not retry deterministic compile/runtime errors.
3. Preserve every run in tech_code_runs for audit.

## 9. Timing and Completion Calculations

Compute on final submit.

1. total_elapsed_sec
- submitted_at - starts_at

2. idle_elapsed_sec
- Sum paired intervals from events:
  - idle_start -> idle_end
  - tab_blur -> tab_focus
  - network_offline -> network_online

3. active_elapsed_sec
- max(total_elapsed_sec - idle_elapsed_sec, 0)

4. section timing
- mcq_elapsed_sec: sum(timing_payload.timeSpentSec where question_type = mcq)
- coding_elapsed_sec: sum(timing_payload.timeSpentSec where question_type = coding)

5. completion_ratio
- answered_items / total_items

Store rollups in tech_attempts and section split in tech_attempts.metadata.

Edge handling:
1. If end event missing, cap interval at submitted_at.
2. Ignore negative or overlapping malformed intervals.

## 10. Security Controls
1. Browser never calls Judge0 directly.
2. Hidden tests are never returned in question payload responses.
3. MCQ correctness key is never exposed to candidate APIs.
4. Deterministic shuffle seed uses server secret.
5. All score-critical calculations happen in backend only.
6. Keep immutable run/event audit rows.

## 11. Performance and Scale (1000+ concurrent)
1. Seed generation is negligible CPU cost.
2. Real bottlenecks are compiler queue and DB write volume.
3. Required scaling measures:
- Worker queue for coding execution
- Batch event writes
- Proper indexes on attempt_id/item_id/created_at
- Caching for attempt snapshot reads
- p95 monitoring for run latency and finalization time

## 12. API Contract (High-level)
1. POST /technical-assessment/attempts/start
2. GET /technical-assessment/attempts/{attemptId}
3. POST /technical-assessment/attempts/{attemptId}/mcq/answer
4. POST /technical-assessment/attempts/{attemptId}/coding/run
5. POST /technical-assessment/attempts/{attemptId}/coding/submit
6. POST /technical-assessment/attempts/{attemptId}/heartbeat
7. POST /technical-assessment/attempts/{attemptId}/proctor-events
8. POST /technical-assessment/attempts/{attemptId}/submit-final

## 13. Draft PostgreSQL DDL (Reference)

```sql
-- 1) tech_assessments
CREATE TABLE IF NOT EXISTS tech_assessments (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  blueprint_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  language_rules_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_policy_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_assessments_active
  ON tech_assessments(is_active);

-- 2) tech_questions
CREATE TABLE IF NOT EXISTS tech_questions (
  id BIGSERIAL PRIMARY KEY,
  question_code VARCHAR(80) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('mcq','coding')),
  section VARCHAR(20) NOT NULL CHECK (section IN ('common','language')),
  language_code VARCHAR(20),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  stem TEXT NOT NULL,
  marks NUMERIC(8,2) NOT NULL CHECK (marks > 0),
  question_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  constraints_text TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tech_questions_code_version UNIQUE (question_code, version)
);

CREATE INDEX IF NOT EXISTS idx_tech_questions_filter
  ON tech_questions(type, section, language_code, difficulty, is_active);
CREATE INDEX IF NOT EXISTS gin_tech_questions_payload
  ON tech_questions USING GIN (question_payload);
CREATE INDEX IF NOT EXISTS gin_tech_questions_tags
  ON tech_questions USING GIN (tags);

-- 3) tech_question_hidden_tests
CREATE TABLE IF NOT EXISTS tech_question_hidden_tests (
  id BIGSERIAL PRIMARY KEY,
  tech_question_id BIGINT NOT NULL REFERENCES tech_questions(id) ON DELETE CASCADE,
  stdin TEXT NOT NULL,
  expected_stdout TEXT NOT NULL,
  weight NUMERIC(8,4) NOT NULL DEFAULT 1.0000 CHECK (weight > 0),
  execution_limit_ms INT NOT NULL DEFAULT 2000 CHECK (execution_limit_ms > 0),
  memory_limit_kb INT NOT NULL DEFAULT 262144 CHECK (memory_limit_kb > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  checksum CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hidden_test_checksum UNIQUE (tech_question_id, checksum)
);

CREATE INDEX IF NOT EXISTS idx_hidden_tests_question_active
  ON tech_question_hidden_tests(tech_question_id, is_active);

-- 4) tech_attempts
CREATE TABLE IF NOT EXISTS tech_attempts (
  id BIGSERIAL PRIMARY KEY,
  tech_assessment_id BIGINT NOT NULL REFERENCES tech_assessments(id),
  user_id BIGINT NOT NULL,
  registration_id BIGINT,
  selected_language VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_started','in_progress','submitted','expired')),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  seed CHAR(64) NOT NULL,
  score_mcq NUMERIC(8,2) NOT NULL DEFAULT 0,
  score_coding NUMERIC(8,2) NOT NULL DEFAULT 0,
  score_total NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_elapsed_sec INT NOT NULL DEFAULT 0,
  active_elapsed_sec INT NOT NULL DEFAULT 0,
  idle_elapsed_sec INT NOT NULL DEFAULT 0,
  completion_ratio NUMERIC(6,4) NOT NULL DEFAULT 0 CHECK (completion_ratio >= 0 AND completion_ratio <= 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_attempt_time_range CHECK (expires_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_status
  ON tech_attempts(user_id, status, starts_at);
CREATE INDEX IF NOT EXISTS idx_attempts_assessment
  ON tech_attempts(tech_assessment_id, status);
CREATE INDEX IF NOT EXISTS idx_attempts_registration
  ON tech_attempts(registration_id);

-- 5) tech_attempt_items
CREATE TABLE IF NOT EXISTS tech_attempt_items (
  id BIGSERIAL PRIMARY KEY,
  tech_attempt_id BIGINT NOT NULL REFERENCES tech_attempts(id) ON DELETE CASCADE,
  tech_question_id BIGINT NOT NULL REFERENCES tech_questions(id),
  display_order INT NOT NULL,
  section VARCHAR(20) NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq','coding')),
  render_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  answer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  grading_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  timing_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attempt_items_order UNIQUE (tech_attempt_id, display_order),
  CONSTRAINT uq_attempt_items_question UNIQUE (tech_attempt_id, tech_question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_items_attempt_answered
  ON tech_attempt_items(tech_attempt_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_attempt_items_type
  ON tech_attempt_items(tech_attempt_id, question_type);
CREATE INDEX IF NOT EXISTS gin_attempt_items_answer_payload
  ON tech_attempt_items USING GIN (answer_payload);
CREATE INDEX IF NOT EXISTS gin_attempt_items_timing_payload
  ON tech_attempt_items USING GIN (timing_payload);

-- 6) tech_code_runs
CREATE TABLE IF NOT EXISTS tech_code_runs (
  id BIGSERIAL PRIMARY KEY,
  tech_attempt_item_id BIGINT NOT NULL REFERENCES tech_attempt_items(id) ON DELETE CASCADE,
  language_code VARCHAR(20) NOT NULL,
  source_code TEXT NOT NULL,
  run_type VARCHAR(20) NOT NULL CHECK (run_type IN ('custom','final')),
  stdin_custom TEXT,
  verdict VARCHAR(40) NOT NULL,
  compile_output TEXT,
  runtime_output TEXT,
  stderr_output TEXT,
  passed_hidden INT,
  total_hidden INT,
  score_awarded NUMERIC(8,2),
  exec_ms INT,
  memory_kb INT,
  judge_token VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_code_runs_counts CHECK (
    passed_hidden IS NULL OR total_hidden IS NULL OR passed_hidden <= total_hidden
  )
);

CREATE INDEX IF NOT EXISTS idx_code_runs_item_type_time
  ON tech_code_runs(tech_attempt_item_id, run_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_runs_token
  ON tech_code_runs(judge_token);
CREATE INDEX IF NOT EXISTS idx_code_runs_created_at
  ON tech_code_runs(created_at);

-- 7) tech_proctor_events
CREATE TABLE IF NOT EXISTS tech_proctor_events (
  id BIGSERIAL PRIMARY KEY,
  tech_attempt_id BIGINT NOT NULL REFERENCES tech_attempts(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  event_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proctor_attempt_time
  ON tech_proctor_events(tech_attempt_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proctor_event_type
  ON tech_proctor_events(event_type);
CREATE INDEX IF NOT EXISTS gin_proctor_event_value
  ON tech_proctor_events USING GIN (event_value);
```

## 14. Implementation Checklist
1. Create migration for all 7 tables and indexes.
2. Implement attempt start transaction (seed + shuffle + persist items).
3. Implement MCQ answer save and ID-based evaluation.
4. Implement Judge0 gateway and run/submission orchestration.
5. Implement finalization transaction (score + timing + status lock).
6. Add dashboards for score distribution, run latency, and completion timing.
7. Add integration tests for shuffle reproducibility and scoring correctness.
