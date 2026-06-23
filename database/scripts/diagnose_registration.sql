-- ============================================================
-- DIAGNOSE "No Assessments Found" after registering a candidate.
-- Replace the email, run each block, read the notes.
-- ============================================================
\set email 'REPLACE_WITH_REGISTERED_EMAIL@example.com'

-- 1) Did the user + registration + session + attempts get created?
WITH u AS (SELECT id FROM users WHERE email = :'email')
SELECT 'user'         AS entity, (SELECT id FROM u)::text AS id, NULL AS extra
UNION ALL
SELECT 'registration', r.id::text, 'program_id=' || r.program_id
FROM registrations r JOIN u ON r.user_id = u.id
UNION ALL
SELECT 'session', s.id::text, 'status=' || s.status || ' validFrom=' || s.valid_from
FROM assessment_sessions s JOIN u ON s.user_id = u.id
UNION ALL
SELECT 'attempt', a.id::text,
       'level=' || a.assessment_level_id || ' status=' || a.status
FROM assessment_attempts a JOIN u ON a.user_id = u.id
ORDER BY entity;
-- EXPECT: a user, a registration, a session, and at least one attempt (Level 1).
-- If there are NO attempts -> registration never created them (guard/pre-flight
-- likely blocked it because the program has no active Level-1 questions).

-- 2) Does the registered program HAVE active Level-1 questions?
WITH u AS (SELECT id FROM users WHERE email = :'email'),
prog AS (
  SELECT r.program_id FROM registrations r JOIN u ON r.user_id = u.id
  ORDER BY r.id DESC LIMIT 1
),
lvl1 AS (SELECT id FROM assessment_levels WHERE level_number = 1)
SELECT (SELECT program_id FROM prog) AS program_id,
       (SELECT code FROM programs WHERE id = (SELECT program_id FROM prog)) AS program_code,
       COUNT(*) AS active_level1_questions
FROM assessment_questions q, prog, lvl1
WHERE q.program_id = prog.program_id
  AND q.assessment_level_id = lvl1.id
  AND q.is_active = true AND q.is_deleted = false;
-- EXPECT active_level1_questions > 0. If 0 -> THIS is the cause: the guard/
-- pre-flight blocks registration for a program with no active Level-1 questions.
-- Fix: import/activate Level-1 questions for that program, or register a program
-- that has them (e.g. COLLEGE_STUDENT).

-- 3) What does the student's attempt list join look like (what the dashboard reads)?
WITH u AS (SELECT id FROM users WHERE email = :'email')
SELECT a.id AS attempt_id, l.level_number, l.name, l.is_mandatory,
       a.status,
       (SELECT COUNT(*) FROM assessment_answers an WHERE an.assessment_attempt_id = a.id) AS mcq_answers,
       (SELECT COUNT(*) FROM metaphor_answers mn WHERE mn.assessment_attempt_id = a.id) AS metaphor_answers
FROM assessment_attempts a
JOIN u ON a.user_id = u.id
JOIN assessment_levels l ON a.assessment_level_id = l.id
ORDER BY a.id DESC;
-- A Level 1 attempt should have mcq_answers > 0. A Level 3 (Metaphor) attempt
-- should have metaphor_answers > 0 (and mcq_answers = 0 - that's expected).
