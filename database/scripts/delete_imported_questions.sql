-- ============================================================
-- Delete imported question batches (by metadata->>'source' marker).
--
-- Each generated import tags every row with metadata.source = '<marker>',
-- so we can cleanly drop a batch later. Run only the section(s) you need.
--
-- ALWAYS wrap in a transaction so you can verify counts before COMMIT.
-- Re-running the migration that originally inserted these rows will also
-- delete + re-insert them (the migrations have the same DELETE preamble),
-- so this script is mainly for manual cleanup WITHOUT re-importing.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) MBA College Level-1 main questions  (migration 018)
--    source = 'mba_xlsx_v1'  (assessment_questions + assessment_question_options)
-- ------------------------------------------------------------
DELETE FROM assessment_question_options o
 USING assessment_questions q
 WHERE o.question_id = q.id AND q.metadata->>'source' = 'mba_xlsx_v1';
DELETE FROM assessment_questions WHERE metadata->>'source' = 'mba_xlsx_v1';

-- ------------------------------------------------------------
-- 2) MBA Survey open questions  (migration 019)
--    source = 'mba_survey_v1'  (open_questions + open_question_options)
-- ------------------------------------------------------------
DELETE FROM open_question_options o
 USING open_questions q
 WHERE o.open_question_id = q.id AND q.metadata->>'source' = 'mba_survey_v1';
DELETE FROM open_questions WHERE metadata->>'source' = 'mba_survey_v1';

-- ------------------------------------------------------------
-- 3) Metaphor Level 3 questions  (migration 016)
--    source = 'metaphor_l3_v1'  (metaphor_questions; metaphor_answers cascade
--    via assessment_attempts in normal flows, but you may want to clear them
--    explicitly if you have orphan answers).
--    UNCOMMENT only if you really want to drop the metaphor bank too:
-- ------------------------------------------------------------
-- DELETE FROM metaphor_answers
--  WHERE metaphor_question_id IN (
--    SELECT id FROM metaphor_questions WHERE metadata->>'source' = 'metaphor_l3_v1'
--  );
-- DELETE FROM metaphor_questions WHERE metadata->>'source' = 'metaphor_l3_v1';

-- ------------------------------------------------------------
-- Sanity: confirm nothing remains for the markers you deleted.
-- ------------------------------------------------------------
SELECT 'assessment_questions' AS table_name,
       COUNT(*) FILTER (WHERE metadata->>'source' = 'mba_xlsx_v1') AS mba_xlsx_v1
  FROM assessment_questions
UNION ALL
SELECT 'open_questions',
       COUNT(*) FILTER (WHERE metadata->>'source' = 'mba_survey_v1')
  FROM open_questions
UNION ALL
SELECT 'metaphor_questions',
       COUNT(*) FILTER (WHERE metadata->>'source' = 'metaphor_l3_v1')
  FROM metaphor_questions;

-- Review the counts above. If they're all zero (for the rows you deleted)
-- and you're happy, commit. Otherwise ROLLBACK.
-- COMMIT;
-- ROLLBACK;
