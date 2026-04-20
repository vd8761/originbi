-- ============================================================
-- Migration 009: Affiliate WhatsApp Settings
-- ============================================================

-- Insert the toggle for WhatsApp Welcome Posters into the originbi_settings table.
-- Setting category to 'affiliate' will automatically create the Affiliate tab in the frontend.

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('affiliate', 'send_whatsapp_welcome_posters', 'boolean', true,
        'Send WhatsApp Welcome Promotional Posters',
        'When enabled, 3 customized promotional posters with unique QR codes are sent to newly registered affiliates via MSG91 WhatsApp API.',
        20)
ON CONFLICT (category, setting_key) DO NOTHING;
