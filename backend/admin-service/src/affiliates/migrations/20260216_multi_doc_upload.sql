-- Migration: Convert affiliate_accounts document columns from single URL to JSON arrays
-- Date: 2026-02-16
-- Description: Changes aadhar_url (varchar) and pan_url (varchar) to
--              aadhar_urls (jsonb) and pan_urls (jsonb) for multi-file support.
--              Adds onedrive_folder_id column.

-- Step 1: Add new columns
ALTER TABLE affiliate_accounts
ADD COLUMN IF NOT EXISTS aadhar_urls jsonb DEFAULT '[]';

ALTER TABLE affiliate_accounts
ADD COLUMN IF NOT EXISTS pan_urls jsonb DEFAULT '[]';

ALTER TABLE affiliate_accounts
ADD COLUMN IF NOT EXISTS onedrive_folder_id varchar(500);

-- Step 2: Migrate existing data (if old columns exist)
UPDATE affiliate_accounts
SET
    aadhar_urls = CASE
        WHEN aadhar_url IS NOT NULL
        AND aadhar_url != '' THEN jsonb_build_array(aadhar_url)
        ELSE '[]'::jsonb
    END
WHERE
    aadhar_urls = '[]'::jsonb;

UPDATE affiliate_accounts
SET
    pan_urls = CASE
        WHEN pan_url IS NOT NULL
        AND pan_url != '' THEN jsonb_build_array(pan_url)
        ELSE '[]'::jsonb
    END
WHERE
    pan_urls = '[]'::jsonb;

-- Step 3: Drop old columns (run AFTER verifying data migration)
-- ALTER TABLE affiliate_accounts DROP COLUMN IF EXISTS aadhar_url;
-- ALTER TABLE affiliate_accounts DROP COLUMN IF EXISTS pan_url;

-- Note: Step 3 is commented out intentionally.
-- Run it manually after verifying the data migration was successful.
-- TypeORM with synchronize=true will handle this automatically in dev.