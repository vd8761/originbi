# Technical Assessment - Optimal Database Structure

Date: 2026-04-10
Status: Recommended

## 1. Target Stack
- Code editor: CodeMirror 6 (frontend only, no DB coupling)
- Compiler and execution: Judge0 CE (self-hosted)

## 2. Design Goals
1. Correctness-safe MCQ evaluation after shuffle
2. Stable replay and audit for every attempt
3. Fast reporting and low-latency attempt APIs
4. Clean normalization for options, hidden tests, and code runs
5. No correctness-critical JSON logic

## 3. Final Table Set (Recommended)

### 3.1 Configuration
1. ta_assessment
- Master assessment definition (duration, active flag, metadata)

2. ta_assessment_language
- Allowed languages per assessment
- Maps internal language code to Judge0 language id

3. ta_blueprint_rule
- Per-assessment quota rules
- Example: common mcq easy=10, common mcq medium=10, lang mcq=15, coding easy=1, coding medium=1

### 3.2 Question Bank
4. ta_question
- One row per question version
- Stores both MCQ and coding questions

5. ta_question_option
- One row per MCQ option
- Stores is_correct for exact option-level validation

6. ta_coding_test_case
- Test cases for coding questions
- case_type: sample or hidden
- includes weight, time_limit_ms, memory_limit_kb

7. ta_coding_template
- Boilerplate/starter code by language per coding question

### 3.3 Attempt and Shuffle Mapping
8. ta_attempt
- Root attempt record for one candidate
- status, seed_hash, selected_language, final scores, timing rollups

9. ta_attempt_item
- Per-question row in one attempt
- stores display_order and marks snapshot

10. ta_attempt_item_option
- Per-attempt shuffled option order for MCQ items
- links attempt item to option id in shuffled sequence

11. ta_attempt_mcq_answer
- Candidate selected option per attempt item
- stores grading result (is_correct, marks_awarded)

### 3.4 Coding Runs and Grading
12. ta_code_submission
- Every code run (custom/final)
- stores Judge0 token, verdict, outputs, aggregate score fields

13. ta_code_submission_case_result
- Per-hidden-test result for each final run
- supports weighted scoring and full audit replay

### 3.5 Telemetry
14. ta_proctor_event
- tab blur/focus, paste, fullscreen, network, heartbeat

## 4. Why This Is Optimal
1. Correctness-safe:
- MCQ correctness is from ta_question_option.is_correct by option_id, not by UI index.

2. Shuffle-safe:
- Display order is attempt-level in ta_attempt_item and ta_attempt_item_option.
- Refresh never changes order because mapping is persisted once.

3. Edit-safe:
- Attempt rows snapshot marks/order so later question edits do not break old attempts.

4. Audit-ready:
- Every submission and test-case result is persisted.

5. Scale-ready:
- Hot queries are indexed by attempt_id, display_order, created_at.

## 5. Key Columns by Table

## 5.1 ta_assessment
- id bigserial pk
- code varchar(50) unique not null
- name varchar(200) not null
- duration_minutes int not null check (duration_minutes > 0)
- is_active boolean not null default true
- metadata jsonb not null default '{}'::jsonb
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

## 5.2 ta_assessment_language
- id bigserial pk
- assessment_id bigint not null fk ta_assessment(id)
- language_code varchar(20) not null
- judge0_language_id int not null
- is_enabled boolean not null default true
- unique (assessment_id, language_code)

## 5.3 ta_blueprint_rule
- id bigserial pk
- assessment_id bigint not null fk ta_assessment(id)
- section varchar(20) not null check (section in ('common','language'))
- question_type varchar(20) not null check (question_type in ('mcq','coding'))
- language_code varchar(20) null
- difficulty varchar(20) not null check (difficulty in ('easy','medium','hard'))
- required_count int not null check (required_count > 0)

## 5.4 ta_question
- id bigserial pk
- question_code varchar(80) not null
- version int not null default 1
- question_type varchar(20) not null check (question_type in ('mcq','coding'))
- section varchar(20) not null check (section in ('common','language'))
- language_code varchar(20) null
- difficulty varchar(20) not null check (difficulty in ('easy','medium','hard'))
- stem text not null
- marks numeric(8,2) not null check (marks > 0)
- constraints_text text null
- is_active boolean not null default true
- metadata jsonb not null default '{}'::jsonb
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- unique (question_code, version)

## 5.5 ta_question_option
- id bigserial pk
- question_id bigint not null fk ta_question(id) on delete cascade
- option_code varchar(40) not null
- option_text text not null
- is_correct boolean not null default false
- display_order int not null
- is_active boolean not null default true
- unique (question_id, option_code)
- unique (question_id, display_order)

## 5.6 ta_coding_test_case
- id bigserial pk
- question_id bigint not null fk ta_question(id) on delete cascade
- case_type varchar(20) not null check (case_type in ('sample','hidden'))
- stdin text not null
- expected_stdout text not null
- expected_stderr text null
- weight numeric(8,4) not null default 1 check (weight > 0)
- time_limit_ms int not null default 2000 check (time_limit_ms > 0)
- memory_limit_kb int not null default 262144 check (memory_limit_kb > 0)
- is_active boolean not null default true

## 5.7 ta_coding_template
- id bigserial pk
- question_id bigint not null fk ta_question(id) on delete cascade
- language_code varchar(20) not null
- starter_code text not null
- unique (question_id, language_code)

## 5.8 ta_attempt
- id bigserial pk
- assessment_id bigint not null fk ta_assessment(id)
- user_id bigint not null
- registration_id bigint null
- selected_language varchar(20) not null
- status varchar(20) not null check (status in ('not_started','in_progress','submitted','expired'))
- starts_at timestamptz not null
- expires_at timestamptz not null
- submitted_at timestamptz null
- seed_hash char(64) not null
- score_mcq numeric(8,2) not null default 0
- score_coding numeric(8,2) not null default 0
- score_total numeric(8,2) not null default 0
- total_elapsed_sec int not null default 0
- active_elapsed_sec int not null default 0
- idle_elapsed_sec int not null default 0
- completion_ratio numeric(6,4) not null default 0 check (completion_ratio >= 0 and completion_ratio <= 1)
- metadata jsonb not null default '{}'::jsonb
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Recommended partial unique index:
- one active attempt per user per assessment
- unique (assessment_id, user_id) where status in ('not_started','in_progress')

## 5.9 ta_attempt_item
- id bigserial pk
- attempt_id bigint not null fk ta_attempt(id) on delete cascade
- question_id bigint not null fk ta_question(id)
- display_order int not null
- section varchar(20) not null
- question_type varchar(20) not null check (question_type in ('mcq','coding'))
- marks_snapshot numeric(8,2) not null
- status varchar(20) not null default 'not_answered'
- render_payload jsonb not null default '{}'::jsonb
- timing_payload jsonb not null default '{}'::jsonb
- answered_at timestamptz null
- updated_at timestamptz not null default now()
- unique (attempt_id, display_order)
- unique (attempt_id, question_id)

## 5.10 ta_attempt_item_option
- id bigserial pk
- attempt_item_id bigint not null fk ta_attempt_item(id) on delete cascade
- option_id bigint not null fk ta_question_option(id)
- display_order int not null
- unique (attempt_item_id, option_id)
- unique (attempt_item_id, display_order)

## 5.11 ta_attempt_mcq_answer
- id bigserial pk
- attempt_item_id bigint not null unique fk ta_attempt_item(id) on delete cascade
- selected_option_id bigint not null fk ta_question_option(id)
- answered_at timestamptz not null default now()
- change_count int not null default 0
- is_correct boolean not null
- marks_awarded numeric(8,2) not null default 0

## 5.12 ta_code_submission
- id bigserial pk
- attempt_item_id bigint not null fk ta_attempt_item(id) on delete cascade
- language_code varchar(20) not null
- source_code text not null
- run_type varchar(20) not null check (run_type in ('custom','final'))
- stdin_custom text null
- judge0_token varchar(120) null
- verdict varchar(40) not null
- compile_output text null
- runtime_output text null
- stderr_output text null
- passed_hidden int null
- total_hidden int null
- score_awarded numeric(8,2) null
- exec_ms int null
- memory_kb int null
- created_at timestamptz not null default now()
- finished_at timestamptz null

## 5.13 ta_code_submission_case_result
- id bigserial pk
- submission_id bigint not null fk ta_code_submission(id) on delete cascade
- test_case_id bigint not null fk ta_coding_test_case(id)
- passed boolean not null
- exec_ms int null
- memory_kb int null
- output_received text null
- created_at timestamptz not null default now()
- unique (submission_id, test_case_id)

## 5.14 ta_proctor_event
- id bigserial pk
- attempt_id bigint not null fk ta_attempt(id) on delete cascade
- event_type varchar(40) not null
- event_value jsonb not null default '{}'::jsonb
- client_ts timestamptz null
- created_at timestamptz not null default now()

## 6. Index Strategy
1. ta_question:
- index (question_type, section, language_code, difficulty, is_active)

2. ta_attempt:
- index (user_id, status, starts_at)
- index (assessment_id, status)

3. ta_attempt_item:
- index (attempt_id, question_type)
- index (attempt_id, answered_at)

4. ta_code_submission:
- index (attempt_item_id, run_type, created_at desc)
- index (judge0_token)

5. ta_proctor_event:
- index (attempt_id, created_at)
- index (event_type)

## 7. Correct Option Resolution Flow (Critical)
1. Candidate opens question by attempt_item_id.
2. UI renders option order from ta_attempt_item_option.display_order.
3. Candidate selects an option_id.
4. Backend validates selected option belongs to that attempt item.
5. Backend reads ta_question_option.is_correct for selected option_id.
6. Backend writes ta_attempt_mcq_answer.is_correct and marks_awarded.

This guarantees correctness even when option order is shuffled differently per user.

## 8. Scoring Flow
1. MCQ score:
- Sum ta_attempt_mcq_answer.marks_awarded for all MCQ attempt items.

2. Coding score:
- For each final submission, compute from case results:
  - unweighted: passed_hidden / total_hidden * marks_snapshot
  - weighted: sum(weights_passed) / sum(weights_total) * marks_snapshot

3. Attempt totals:
- update ta_attempt.score_mcq, score_coding, score_total

## 9. Minimal Example Query (MCQ Correctness)
```sql
SELECT
  a.id AS attempt_item_id,
  ans.selected_option_id,
  opt.is_correct,
  CASE WHEN opt.is_correct THEN a.marks_snapshot ELSE 0 END AS marks_awarded
FROM ta_attempt_item a
JOIN ta_attempt_mcq_answer ans ON ans.attempt_item_id = a.id
JOIN ta_question_option opt ON opt.id = ans.selected_option_id
WHERE a.id = $1;
```

## 10. Migration Order
1. ta_assessment
2. ta_assessment_language
3. ta_blueprint_rule
4. ta_question
5. ta_question_option
6. ta_coding_test_case
7. ta_coding_template
8. ta_attempt
9. ta_attempt_item
10. ta_attempt_item_option
11. ta_attempt_mcq_answer
12. ta_code_submission
13. ta_code_submission_case_result
14. ta_proctor_event

## 11. Optional Enhancements
1. Partition ta_proctor_event and ta_code_submission by month for large scale.
2. Add materialized view for leaderboard/reporting.
3. Add question analytics table (difficulty calibration from real outcomes).
4. Add plagiarism pipeline table for post-exam checks.
