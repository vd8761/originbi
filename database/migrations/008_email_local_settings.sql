-- Up Migration
-- Adding specific local overrides for the 4 core email features

-- 1. Registration Email Override Config
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'registration_email_config', 'json', '{"mode":"global", "from_address":"", "from_name":"", "cc_addresses":[]}',
        'Registration Email Configuration',
        'Specific overrides for Registration emails (from address, from name, cc addresses). Overrides global if mode=local.',
        14)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 2. Report Email Override Config
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'report_email_config', 'json', '{"mode":"global", "from_address":"", "from_name":"", "cc_addresses":[]}',
        'Report Email Configuration',
        'Specific overrides for Report emails (from address, from name, cc addresses). Overrides global if mode=local.',
        15)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 3. Corporate Welcome Email Override Config
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'corporate_welcome_email_config', 'json', '{"mode":"global", "from_address":"", "from_name":"", "cc_addresses":[]}',
        'Corporate Welcome Email Configuration',
        'Specific overrides for Corporate Welcome emails (from address, from name, cc addresses). Overrides global if mode=local.',
        16)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 4. Affiliate Email Override Config
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'affiliate_email_config', 'json', '{"mode":"global", "from_address":"", "from_name":"", "cc_addresses":[]}',
        'Affiliate Email Configuration',
        'Specific overrides for Affiliate emails (from address, from name, cc addresses). Overrides global if mode=local.',
        17)
ON CONFLICT (category, setting_key) DO NOTHING;

-- 5. Manual Report Email Override Config
INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('email', 'manual_report_email_config', 'json', '{"mode":"global", "from_address":"", "from_name":"", "cc_addresses":[]}',
        'Manual Report Emails',
        'Configuration for reports triggered manually (e.g., from the corporate or admin dashboard). Overrides global if mode=local.',
        18)
ON CONFLICT (category, setting_key) DO NOTHING;
