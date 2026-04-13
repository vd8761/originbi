# Technical Assessment - Ultra Simple Walkthrough

Date: 2026-04-09

If you read only one section, read Section 3 (One Student Story).

## 1) What this system does
A candidate takes one test with two parts:
1. MCQ
2. Coding

Backend does 4 important jobs:
1. Shuffle questions/options fairly
2. Save answers safely
3. Run code in secure compiler sandbox
4. Calculate final score and completion time

## 2) Very simple architecture
1. Candidate UI (web page)
- shows questions
- sends selected answers and code

2. Assessment API (backend)
- creates attempt
- shuffles
- scores
- final submit

3. Compiler service (Judge0 CE)
- compiles and runs code with strict limits

4. Database (PostgreSQL)
- stores questions, attempts, answers, run history, timing

## 3) One Student Story (End to End)
Step 1: Student clicks Start.
- backend creates attempt record
- backend generates one seed
- backend shuffles questions and MCQ options
- backend stores shuffled order

Step 2: Student answers MCQ.
- frontend sends selectedOptionId (not option position)
- backend stores selectedOptionId

Step 3: Student runs code.
- backend sends code to Judge0
- Judge0 returns compile/runtime result
- backend saves run result

Step 4: Student submits coding answer.
- backend runs hidden tests
- backend computes coding marks

Step 5: Student clicks Final Submit.
- backend calculates MCQ total + coding total
- backend calculates timing (total/idle/active)
- backend marks attempt as submitted

## 4) How shuffle works (no confusion version)
Important concept:
- UI position can change.
- Option ID never changes.

Example:
- Correct option ID for one question is opt_07.

Student A sees options in this order:
1. opt_44
2. opt_07
3. opt_12
4. opt_29

Student B sees options in this order:
1. opt_12
2. opt_29
3. opt_07
4. opt_44

If Student A clicks option number 2:
- frontend sends selectedOptionId = opt_07
- backend checks opt_07 in canonical question data
- answer is correct

So scoring is always correct, even when order is different.

## 5) What is SHA/HMAC seed and why used
Seed is generated once per attempt, for example:
HMAC_SHA256(server_secret, attempt_id:user_id:assessment_id)

Why:
1. Same attempt always gets same shuffle if reloaded.
2. Different attempts get different order.
3. It is very fast and not the performance bottleneck.

## 6) Where data is stored (simple map)
1. tech_questions
- original question and correct option mapping

2. tech_attempts
- attempt status and final totals

3. tech_attempt_items
- shuffled order for that attempt
- selected answer for each question
- per-question score summary

4. tech_code_runs
- each code run result (compile/output/verdict)

5. tech_question_hidden_tests
- hidden coding test cases

6. tech_proctor_events
- tab switch, idle, network events

7. tech_assessments
- blueprint and scoring configuration

## 7) MCQ score calculation
For each MCQ:
1. read selectedOptionId
2. find that option in canonical question data
3. if option is correct, give marks, else 0

Final MCQ score:
mcq_score = sum(marks_awarded_per_mcq)

## 8) Compiler and coding evaluation
Two actions:
1. Run
- sample/custom input
- feedback only

2. Submit
- hidden tests
- score is calculated

Coding score for one problem:
pass_ratio = passed_hidden / total_hidden
problem_score = pass_ratio * problem_marks

## 9) Timing calculation
At final submit:
1. total_elapsed = submitted_at - starts_at
2. idle_elapsed = sum of idle intervals from events
3. active_elapsed = max(total_elapsed - idle_elapsed, 0)

Also tracked:
- MCQ time
- Coding time
- completion ratio

## 10) 1000+ candidates performance note
HMAC/SHA seed generation is cheap.
Typical bottlenecks are:
1. compiler queue
2. DB write volume (autosave/events)
3. hidden test execution load

So seed generation will not slow the system meaningfully.

## 11) Final summary in one line
Shuffle by IDs, store shuffled order once, validate MCQ by selectedOptionId, evaluate coding by hidden test pass ratio, and compute final timing at submit.
