-- ============================================================
-- Migration 012: SMS Student Notification Settings
--
-- Adds a new `sms` category for SMS gateway credentials and
-- per-template toggles. SMS acts as a fallback when WhatsApp
-- send fails, and as a direct channel when WhatsApp is disabled.
--
-- Templates are HARDCODED in code (not configurable); only the
-- template IDs and credentials live here.
--
--   template_id_instructions    -> assessment instructions SMS
--   template_id_expiry          -> 3-day expiry reminder SMS
--   template_id_completion      -> assessment completion SMS
--   template_id_report_sent     -> report delivered SMS
-- ============================================================

-- 1. SMS gateway auth key (sensitive field — hidden in UI with eye icon)
-- Removed

-- 2. SMS sender ID
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('sms', 'sender_id', 'string',
        'ORGNBI',
        'SMS Sender ID',
        'DLT-registered sender ID shown as the SMS "from" field.',
        2)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 3. DLT template IDs
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('sms', 'template_id_instructions', 'string',
        '1707177669149373626',
        'Template ID: Assessment Instructions',
        'DLT template ID used when sending the assessment instructions SMS (sent on registration for SELF / AFFILIATE users).',
        3)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('sms', 'template_id_expiry', 'string',
        '1707177669254654346',
        'Template ID: Expiry Reminder',
        'DLT template ID used when sending the 3-day expiry reminder SMS.',
        4)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('sms', 'template_id_completion', 'string',
        '1707177669274777143',
        'Template ID: Completion Notification',
        'DLT template ID used when sending the assessment completion SMS.',
        5)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('sms', 'template_id_report_sent', 'string',
        '1707177669296049700',
        'Template ID: Report Sent Notification',
        'DLT template ID used when sending the report-delivered SMS (fires after the report PDF email is sent).',
        6)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4. Per-template toggles (independent of WhatsApp toggles)
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('sms', 'send_assessment_instructions', 'boolean', true,
        'Send Assessment Instructions via SMS',
        'When enabled, SMS is sent as a fallback if the WhatsApp instructions message fails, or directly if WhatsApp is disabled. If this toggle is off, no SMS is sent even when WhatsApp fails.',
        10)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('sms', 'send_expiry_reminder', 'boolean', true,
        'Send Assessment Expiry Reminder via SMS',
        'When enabled, SMS is sent as a fallback if the WhatsApp expiry reminder fails, or directly if WhatsApp is disabled. Applies only to the 3-day reminder.',
        11)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('sms', 'send_completion_notification', 'boolean', true,
        'Send Assessment Completion Notification via SMS',
        'When enabled, SMS is sent as a fallback if the WhatsApp completion notification fails, or directly if WhatsApp is disabled.',
        12)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('sms', 'send_report_sent_notification', 'boolean', true,
        'Send Report Sent Notification via SMS',
        'When enabled, SMS is sent as a fallback if the WhatsApp report-sent notification fails, or directly if WhatsApp is disabled.',
        13)
ON CONFLICT (category, setting_key) DO NOTHING;
