-- ============================================================
-- Migration 022: Add show_report_preview_after_exam setting
--
-- Adds a new admin-configurable setting that controls whether
-- the report preview is automatically shown to candidates
-- after they complete their assessments.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('report', 'show_report_preview_after_exam', 'boolean', true,
        'Show report preview after exam',
        'When disabled, the report preview will not be shown automatically when a candidate completes their assessment.',
        10)
ON CONFLICT (category, setting_key) DO NOTHING;
