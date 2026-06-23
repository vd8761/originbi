-- ============================================================
-- VERIFY: MBA SURVEY import (open_questions, question_type = 'SURVEY')
-- Run AFTER migration 014 + mba_survey_questions.sql. All rows -> PASS.
-- Read-only.
-- ============================================================
WITH q AS (
  SELECT * FROM open_questions
  WHERE metadata->>'source' = 'mba_survey_v1'
    AND is_active = true AND is_deleted = false
),
o AS (
  SELECT op.* FROM open_question_options op JOIN q ON op.open_question_id = q.id
)
SELECT * FROM (
  SELECT 1 AS n, 'total survey questions = 100' AS check_name,
         CASE WHEN COUNT(*) = 100 THEN 'PASS' ELSE 'FAIL' END AS status,
         COUNT(*)::text AS detail FROM q
  UNION ALL
  SELECT 2, 'all rows are question_type = SURVEY',
         CASE WHEN COUNT(*) FILTER (WHERE question_type <> 'SURVEY') = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE question_type <> 'SURVEY')::text || ' non-SURVEY' FROM q
  UNION ALL
  SELECT 3, '5 sets, 20 each',
         CASE WHEN COUNT(*) = 5 AND COUNT(*) FILTER (WHERE c <> 20) = 0 THEN 'PASS' ELSE 'FAIL' END,
         string_agg('set ' || set_number || '=' || c, ', ' ORDER BY set_number)
  FROM (SELECT set_number, COUNT(*) AS c FROM q GROUP BY set_number) s
  UNION ALL
  SELECT 4, 'set_number populated on every survey question',
         CASE WHEN COUNT(*) FILTER (WHERE set_number IS NULL) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE set_number IS NULL)::text || ' null set' FROM q
  UNION ALL
  SELECT 5, 'every question has 4 options',
         CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END,
         bad::text || ' question(s) with !=4 options'
  FROM (SELECT COUNT(*) AS bad FROM (SELECT open_question_id, COUNT(*) c FROM o GROUP BY open_question_id) x WHERE c <> 4) y
  UNION ALL
  SELECT 6, 'options are non-scoring (is_valid = false)',
         CASE WHEN COUNT(*) FILTER (WHERE is_valid) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE is_valid)::text || ' option(s) marked valid' FROM o
  UNION ALL
  SELECT 7, 'Tamil present on every question (question_text_ta or context_text_ta)',
         CASE WHEN COUNT(*) FILTER (WHERE COALESCE(question_text_ta,'')='' AND COALESCE(context_text_ta,'')='') = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE COALESCE(question_text_ta,'')='' AND COALESCE(context_text_ta,'')='')::text || ' missing TA' FROM q
  UNION ALL
  SELECT 8, 'Tamil present on every option',
         CASE WHEN COUNT(*) FILTER (WHERE COALESCE(option_text_ta,'')='') = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE COALESCE(option_text_ta,'')='')::text || ' option(s) missing TA' FROM o
  UNION ALL
  SELECT 9, 'context is optional (info only - count with context)',
         'PASS',
         COUNT(*) FILTER (WHERE COALESCE(context_text_en,'') <> '')::text || ' of ' || COUNT(*)::text || ' have context_en' FROM q
) checks ORDER BY n;

-- Runtime spot-check (run after registering a College candidate post-survey-import):
-- one survey SET should supply the OPEN answers, scattered among MAIN.
--   SELECT ans.question_source, COUNT(*) FROM assessment_answers ans
--   WHERE ans.assessment_attempt_id = <attempt> GROUP BY 1;          -- expect MAIN=40, OPEN=10
--   SELECT DISTINCT oq.set_number FROM assessment_answers ans
--   JOIN open_questions oq ON ans.open_question_id = oq.id
--   WHERE ans.assessment_attempt_id = <attempt>;                     -- expect exactly ONE set_number
