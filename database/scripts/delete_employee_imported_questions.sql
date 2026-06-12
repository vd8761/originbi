-- ============================================================
-- Standalone cleanup script (NOT a migration).
-- Removes the Employee level-segmented questions + options imported by
-- migration 029 (marker: metadata->>'source' = 'employee_xlsx_v1').
--
-- Usage:
--   psql "<connection-string>" -f database/scripts/delete_employee_imported_questions.sql
--
-- Safe & repeatable: deletes only rows carrying the import marker. Options are
-- removed first (FK references assessment_questions). Wrapped in a transaction
-- so it is all-or-nothing.
--
-- NOTE: this does NOT re-activate the legacy questions that migration 028
-- deactivated. If you need them back, separately run:
--   UPDATE assessment_questions SET is_active = true
--    WHERE program_id = (SELECT id FROM programs WHERE code='EMPLOYEE')
--      AND assessment_level_id = (SELECT id FROM assessment_levels WHERE level_number=1)
--      AND COALESCE(metadata->>'source','') <> 'employee_xlsx_v1';
-- ============================================================
BEGIN;

DELETE FROM assessment_question_options o
 USING assessment_questions q
 WHERE o.question_id = q.id
   AND q.metadata->>'source' = 'employee_xlsx_v1';

DELETE FROM assessment_questions
 WHERE metadata->>'source' = 'employee_xlsx_v1';

COMMIT;
