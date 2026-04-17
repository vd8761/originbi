-- ============================================================
-- Migration 010: Email BCC/Reply-To & Report Password Settings
--
-- 1. Add global BCC and Reply-To email settings
-- 2. Add report password settings (toggle + admin password)
-- 3. Update existing local override configs to support
--    bcc_addresses and reply_to_address fields (done via
--    the JSON schema — no column changes needed since they
--    are stored inside value_json).
-- ============================================================

-- -------------------------------------------------------
-- 1a. Global BCC Addresses (JSON array, like cc_addresses)
-- -------------------------------------------------------
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'bcc_addresses', 'json', '[]'::jsonb,
        'BCC Email Addresses',
        'Admin email addresses to BCC on all outgoing emails. These recipients are hidden from other recipients. Can be left blank.',
        4)
ON CONFLICT (category, setting_key) DO NOTHING;

-- -------------------------------------------------------
-- 1b. Global Reply-To Address (string, optional)
-- -------------------------------------------------------
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('email', 'reply_to_address', 'string', '',
        'Reply-To Address',
        'When set, replies to outgoing emails will be directed to this address instead of the From address. Can be left blank.',
        5)
ON CONFLICT (category, setting_key) DO NOTHING;

-- -------------------------------------------------------
-- 2. Update existing local override JSON configs to include
--    bcc_addresses and reply_to_address fields.
--    We merge into the existing JSONB value without losing
--    existing keys (mode, from_address, from_name, cc_addresses).
-- -------------------------------------------------------

-- 2a. registration_email_config
UPDATE originbi_settings
SET value_json = value_json || '{"bcc_addresses": [], "reply_to_address": ""}'::jsonb
WHERE category = 'email' AND setting_key = 'registration_email_config'
  AND NOT (value_json ? 'bcc_addresses');

-- 2b. report_email_config
UPDATE originbi_settings
SET value_json = value_json || '{"bcc_addresses": [], "reply_to_address": ""}'::jsonb
WHERE category = 'email' AND setting_key = 'report_email_config'
  AND NOT (value_json ? 'bcc_addresses');

-- 2c. corporate_welcome_email_config
UPDATE originbi_settings
SET value_json = value_json || '{"bcc_addresses": [], "reply_to_address": ""}'::jsonb
WHERE category = 'email' AND setting_key = 'corporate_welcome_email_config'
  AND NOT (value_json ? 'bcc_addresses');

-- 2d. affiliate_email_config
UPDATE originbi_settings
SET value_json = value_json || '{"bcc_addresses": [], "reply_to_address": ""}'::jsonb
WHERE category = 'email' AND setting_key = 'affiliate_email_config'
  AND NOT (value_json ? 'bcc_addresses');

-- 2e. manual_report_email_config
UPDATE originbi_settings
SET value_json = value_json || '{"bcc_addresses": [], "reply_to_address": ""}'::jsonb
WHERE category = 'email' AND setting_key = 'manual_report_email_config'
  AND NOT (value_json ? 'bcc_addresses');


-- ============================================================
-- 3. Report Password Settings (new 'report' category)
-- ============================================================

-- 3a. Toggle: Enable/Disable PDF Password Protection
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('report', 'report_password_enabled', 'boolean', true,
        'Enable Report Password Protection',
        'When enabled, generated PDF reports are protected with a password. The admin password (owner) controls edit/copy permissions, and a random user password is generated for each report to open the PDF.',
        1)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 3b. Admin Password for PDFs (sensitive)
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_sensitive, display_order)
VALUES ('report', 'report_admin_password', 'string', '',
        'PDF Admin (Owner) Password',
        'The master password used as the owner/admin password for generated PDF reports. Controls edit, copy, and print permissions. If left blank, falls back to the PDF_ADMIN_PASSWORD environment variable.',
        true, 2)
ON CONFLICT (category, setting_key) DO NOTHING;
