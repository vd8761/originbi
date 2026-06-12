-- ============================================================
-- Migration 027: Per-Program Question Generation Mode
--
-- Adds an admin-configurable setting that controls HOW the main
-- (DISC) questions are selected for an assessment, configurable
-- PER PROGRAM. The value is a JSON object keyed by program id:
--
--   {
--     "<programId>": { "mode": "<mode>", "count": <n> }
--   }
--
-- Supported modes:
--   random_set_shuffled : pick ONE random set, then `count`
--                         questions in random order (legacy default)
--   random_set_ordered  : pick ONE random set, then the first
--                         `count` questions in authored order
--                         (external_code / id ascending)
--   random_all_sets     : ignore set boundaries; pick `count`
--                         random questions across all sets
--
-- Any program not present in the object (or an invalid entry) falls
-- back to the legacy default { random_set_shuffled, 40 }, so applying
-- this migration changes nothing until an admin configures a program.
--
-- This works together with the Employee "Level" (Entry/Medium/
-- Executive), which is stored on registration.metadata.employeeLevel
-- and filters questions via the assessment_questions.board column.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('assessment', 'question_generation_mode', 'json',
        '{}'::jsonb,
        'Question Generation Mode (per Program)',
        'Controls how the main (DISC) questions are selected, per program. A JSON object keyed by program id -> { mode, count }. Modes: random_set_shuffled (one random set, N random), random_set_ordered (one random set, first N in authored order), random_all_sets (N random across all sets). Programs not listed use random_set_shuffled with count 40.',
        11)
ON CONFLICT (category, setting_key) DO NOTHING;
