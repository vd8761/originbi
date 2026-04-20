-- ============================================================
-- Migration 011: WhatsApp Student Notification Settings
--
-- Adds a new `whatsapp` category seeding admin-configurable
-- values used by student-facing WhatsApp templates:
--   [2] assessment_instructions_v6
--   [3] originbi_assessment_expiry_reminder
--   [4] assessment_completion_notification
--   [5] assessment_report_sent_notification
-- ============================================================

-- 1. Shared header image URL (consumed by templates [2]-[5])
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('whatsapp', 'student_template_image_url', 'string',
        'https://originbi.com/assets/images/originbi-pad.jpg',
        'Student WhatsApp Header Image',
        'Image used as the header (header_1) for all student-facing WhatsApp templates — assessment instructions, expiry reminder, completion, and report-sent notifications.',
        1)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 2. YouTube walkthrough URL used in assessment_instructions_v6 body_2
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('whatsapp', 'instructions_youtube_url', 'string',
        '',
        'Assessment Instructions Video (YouTube)',
        'YouTube video link sent as body_2 of the assessment_instructions_v6 template. Shown to students right after registration.',
        2)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 3. Student portal URL (instructions button_1 + expiry reminder body_2)
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('whatsapp', 'student_portal_url', 'string',
        'https://mind.originbi.com/student',
        'Student Portal URL',
        'Portal link used for the "Start Assessment" button in the instructions template and the body_2 of the expiry reminder template.',
        3)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4. Toggle: Assessment Instructions WhatsApp
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('whatsapp', 'send_assessment_instructions', 'boolean', true,
        'Send Assessment Instructions via WhatsApp',
        'When enabled, newly registered students (SELF or AFFILIATE source) receive the assessment_instructions_v6 WhatsApp template.',
        10)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 5. Toggle: Expiry Reminder WhatsApp
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('whatsapp', 'send_expiry_reminder', 'boolean', true,
        'Send Assessment Expiry Reminder via WhatsApp',
        'When enabled, a daily job sends a one-time expiry reminder exactly 3 days before an assessment expires. No reminder is sent at 2 or 1 day.',
        11)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 6. Toggle: Completion Notification WhatsApp
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('whatsapp', 'send_completion_notification', 'boolean', true,
        'Send Assessment Completion Notification via WhatsApp',
        'When enabled, students receive a WhatsApp message the moment their assessment completes, informing them their report is being generated.',
        12)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 7. Toggle: Report Sent Notification WhatsApp
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('whatsapp', 'send_report_sent_notification', 'boolean', true,
        'Send Report Sent Notification via WhatsApp',
        'When enabled, students receive a WhatsApp message after their report PDF email is successfully delivered.',
        13)
ON CONFLICT (category, setting_key) DO NOTHING;
