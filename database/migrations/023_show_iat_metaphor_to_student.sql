-- ============================================================
-- Migration 023: Add show_iat_metaphor_to_student setting
--
-- Adds a new admin-configurable setting that controls whether
-- the IAT and Metaphor reports are visible to students.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('report', 'show_iat_metaphor_to_student', 'boolean', false,
        'Show IAT and Metaphor report to students',
        'When enabled, students can see their IAT and Metaphor reports in separate tabs on their report page.',
        11)
ON CONFLICT (category, setting_key) DO NOTHING;
