-- ============================================================
-- Migration 024: Student preview report-variant settings
--
-- Controls which report the student-side preview ("personality
-- journey" tab) generates. The variant is resolved server-side
-- from the student's MBA status and assessment completion:
--   - MBA student      -> student_preview_variant_mba    (Level 1, DISC only)
--   - non-MBA student  -> student_preview_variant_non_mba (Short, DISC + ACI)
-- When the chosen variant's required assessment is incomplete,
-- generation is blocked and student_preview_blocked_message is shown.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('report', 'student_preview_variant_mba', 'string', 'level1',
        'Student preview report - MBA students',
        'Report variant shown in the student preview for MBA students. One of: level1 (Behavioural Snapshot, DISC only), short, or full.',
        12)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('report', 'student_preview_variant_non_mba', 'string', 'short',
        'Student preview report - non-MBA students',
        'Report variant shown in the student preview for non-MBA students. One of: short (DISC + ACI), full, or level1. "short"/"full" require the ACI assessment to be completed.',
        13)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('report', 'student_preview_blocked_message', 'string',
        'Please contact your administrator to receive your report.',
        'Student preview - blocked message',
        'Message shown to a student when the report cannot be generated because the required assessment (e.g. ACI) is not completed for their report type.',
        14)
ON CONFLICT (category, setting_key) DO NOTHING;
