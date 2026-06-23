-- ============================================================
-- Migration 021: Add question_selection_mode setting for Metaphor Level 3
--
-- Adds a new admin-configurable setting that controls HOW metaphor
-- questions are selected for each candidate:
--   • 'random_single_set' (default) - pick N from one random set
--   • 'random_all_sets'             - pick N from all sets combined
--
-- The existing 'question_count' setting already controls HOW MANY.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'question_selection_mode', 'string', 'random_single_set',
        'Question selection mode',
        'How questions are picked for each candidate. "random_single_set" picks N questions from one randomly chosen set. "random_all_sets" picks N questions from all sets combined.',
        2)
ON CONFLICT (category, setting_key) DO NOTHING;
