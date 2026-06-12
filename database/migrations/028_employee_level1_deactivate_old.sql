-- ============================================================
-- Migration 028: Deactivate existing Employee Level-1 questions
--
-- The Employee program (code 'EMPLOYEE') is moving to a level-segmented
-- question bank (Entry/Medium/Executive), imported by migration 029 with the
-- metadata marker source = 'employee_xlsx_v1'.
--
-- This migration turns is_active = false for the OLD Employee Level-1 main
-- questions so the generator no longer assigns them. It deliberately does NOT
-- touch the newly imported rows (guarded by the source marker), which keeps it
-- safe to run before OR after 029 and safe to re-run.
--
-- Note: rows are deactivated (is_active = false), not deleted, so historical
-- assessments that already reference them stay intact.
-- ============================================================
BEGIN;

UPDATE assessment_questions
   SET is_active = false,
       updated_at = now()
 WHERE program_id = (SELECT id FROM programs WHERE code = 'EMPLOYEE')
   AND assessment_level_id = (SELECT id FROM assessment_levels WHERE level_number = 1)
   AND COALESCE(metadata->>'source', '') <> 'employee_xlsx_v1';

COMMIT;
