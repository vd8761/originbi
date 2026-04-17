-- ============================================================
-- Migration 007: Create originbi_settings table
-- 
-- A flexible, category-based key-value settings table that
-- supports typed values (string, boolean, json, number).
-- Self-documenting: label, description, display_order drive
-- the Admin Panel UI rendering automatically.
-- ============================================================

-- 1. Create Table
CREATE TABLE IF NOT EXISTS originbi_settings (
    id            BIGSERIAL    PRIMARY KEY,
    category      VARCHAR(50)  NOT NULL,            -- e.g. 'email', 'notifications', 'branding', 'system'
    setting_key   VARCHAR(100) NOT NULL,             -- e.g. 'from_address', 'cc_addresses', 'send_registration_email'
    value_type    VARCHAR(20)  NOT NULL              -- discriminator for which value column to read
                  CHECK (value_type IN ('string', 'boolean', 'json', 'number')),
    value_string  TEXT,                              -- used when value_type = 'string'
    value_boolean BOOLEAN,                           -- used when value_type = 'boolean'
    value_json    JSONB,                             -- used when value_type = 'json' (arrays, objects)
    value_number  NUMERIC(15,4),                     -- used when value_type = 'number'
    label         VARCHAR(200) NOT NULL,             -- human-readable label for the Settings UI
    description   TEXT,                              -- tooltip/help text shown in the Settings UI
    is_sensitive  BOOLEAN      NOT NULL DEFAULT false,  -- mask value in UI (e.g. API keys)
    is_readonly   BOOLEAN      NOT NULL DEFAULT false,  -- prevent edits from the UI (system-set values)
    display_order SMALLINT     NOT NULL DEFAULT 0,      -- ordering within a category section
    updated_by    VARCHAR(100),                      -- email of admin who last modified this setting
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Each setting is uniquely identified by its category + key
    CONSTRAINT uq_originbi_settings_category_key UNIQUE (category, setting_key)
);

COMMENT ON TABLE originbi_settings IS 'Flexible admin-configurable settings store. Grouped by category, typed by value_type.';

-- 2. Trigger: auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_originbi_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_originbi_settings_updated_at
    BEFORE UPDATE ON originbi_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_originbi_settings_updated_at();

-- 3. Index: fast lookups by category
CREATE INDEX IF NOT EXISTS idx_originbi_settings_category
    ON originbi_settings (category);


-- ============================================================
-- 4. Seed Data: Email Settings
-- ============================================================

-- 4a. From Address (static / readonly — must be verified in AWS SES)
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_readonly, display_order)
VALUES ('email', 'from_address', 'string', 'no-reply@originbi.com',
        'From Email Address',
        'The sender email address used for all outgoing emails. Must be verified in AWS SES — cannot be changed from the UI.',
        true, 1)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4b. From Display Name (editable)
INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('email', 'from_name', 'string', 'Origin BI Mind Works',
        'From Display Name',
        'The display name shown in the "From" field of outgoing emails.',
        2)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4c. CC Addresses (JSON array — 0 to n recipients)
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'cc_addresses', 'json', '["sriharan.me@gmail.com"]'::jsonb,
        'CC Email Addresses',
        'Admin email addresses to CC on all outgoing emails. Add or remove addresses as needed.',
        3)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4d. Toggle: Registration Emails
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('email', 'send_registration_email', 'boolean', true,
        'Send Registration Emails',
        'When enabled, welcome emails are sent to newly registered students with their login credentials.',
        10)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4e. Toggle: Individual Report Emails
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('email', 'send_report_email', 'boolean', true,
        'Send Report Emails',
        'When enabled, individual assessment report PDFs are emailed to students upon completion.',
        11)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4f. Toggle: Corporate Welcome Emails
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('email', 'send_corporate_welcome_email', 'boolean', true,
        'Send Corporate Welcome Emails',
        'When enabled, welcome emails are sent to employees registered through corporate accounts.',
        12)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4g. Toggle: Affiliate Emails
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('email', 'send_affiliate_email', 'boolean', true,
        'Send Affiliate Emails',
        'When enabled, notification emails are sent for affiliate-related actions (registrations, settlements).',
        13)
ON CONFLICT (category, setting_key) DO NOTHING;
