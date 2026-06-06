-- ============================================================
-- FUNCTIONAL VERIFY: question generation for a freshly registered
-- College candidate. Run AFTER registering a test candidate on Local.
--
-- 1. Put the registered email in the :email CTE below (single quotes).
-- 2. Run. Read the three result blocks.
-- Read-only.
-- ============================================================

-- Block A — MAIN vs OPEN breakdown for the candidate's latest Level-1 attempt.
WITH params AS (SELECT 'REPLACE_WITH_REGISTERED_EMAIL@example.com'::text AS email),
u AS (SELECT id FROM users, params WHERE users.email = params.email),
att AS (
  SELECT aa.id AS attempt_id, aa.assessment_level_id, aa.program_id
  FROM assessment_attempts aa
  JOIN u ON aa.user_id = u.id
  ORDER BY aa.id DESC
  LIMIT 1
)
SELECT
  ans.question_source,
  COUNT(*) AS cnt
FROM assessment_answers ans, att
WHERE ans.assessment_attempt_id = att.attempt_id
GROUP BY ans.question_source
ORDER BY ans.question_source;
-- EXPECT (default 20-random config, no survey yet): MAIN = 40, OPEN = 20.


-- Block B — overall checks for that attempt.
WITH params AS (SELECT 'REPLACE_WITH_REGISTERED_EMAIL@example.com'::text AS email),
u AS (SELECT id FROM users, params WHERE users.email = params.email),
att AS (
  SELECT aa.id AS attempt_id
  FROM assessment_attempts aa JOIN u ON aa.user_id = u.id
  ORDER BY aa.id DESC LIMIT 1
),
ans AS (
  SELECT * FROM assessment_answers WHERE assessment_attempt_id = (SELECT attempt_id FROM att)
)
SELECT * FROM (
  SELECT 1 AS n, 'total questions = 60 (40 main + 20 open)' AS check_name,
         CASE WHEN COUNT(*) = 60 THEN 'PASS' ELSE 'CHECK' END AS status,
         COUNT(*)::text AS detail FROM ans
  UNION ALL
  SELECT 2, 'main from one set only (single set_number)',
         CASE WHEN COUNT(DISTINCT q.set_number) = 1 THEN 'PASS' ELSE 'CHECK' END,
         'sets: ' || COALESCE(string_agg(DISTINCT q.set_number::text, ','), '-')
  FROM ans JOIN assessment_questions q ON ans.main_question_id = q.id
  WHERE ans.question_source = 'MAIN'
  UNION ALL
  SELECT 3, 'question_sequence is contiguous 1..N',
         CASE WHEN MAX(question_sequence) = COUNT(*) AND MIN(question_sequence) = 1 THEN 'PASS' ELSE 'CHECK' END,
         'min=' || MIN(question_sequence) || ' max=' || MAX(question_sequence) || ' n=' || COUNT(*)
  FROM ans
  UNION ALL
  SELECT 4, 'all main questions belong to COLLEGE program',
         CASE WHEN COUNT(*) FILTER (WHERE p.code <> 'COLLEGE_STUDENT') = 0 THEN 'PASS' ELSE 'CHECK' END,
         COUNT(*) FILTER (WHERE p.code <> 'COLLEGE_STUDENT')::text || ' off-program'
  FROM ans
  JOIN assessment_questions q ON ans.main_question_id = q.id
  JOIN programs p ON q.program_id = p.id
  WHERE ans.question_source = 'MAIN'
) checks ORDER BY n;


-- Block C — the interleave pattern (first 12 rows; expect MAIN,MAIN,OPEN repeating).
WITH params AS (SELECT 'REPLACE_WITH_REGISTERED_EMAIL@example.com'::text AS email),
u AS (SELECT id FROM users, params WHERE users.email = params.email),
att AS (
  SELECT aa.id AS attempt_id
  FROM assessment_attempts aa JOIN u ON aa.user_id = u.id
  ORDER BY aa.id DESC LIMIT 1
)
SELECT ans.question_sequence, ans.question_source,
       ans.main_question_id, ans.open_question_id
FROM assessment_answers ans, att
WHERE ans.assessment_attempt_id = att.attempt_id
ORDER BY ans.question_sequence
LIMIT 12;
-- EXPECT sequence: MAIN, MAIN, OPEN, MAIN, MAIN, OPEN, ...
