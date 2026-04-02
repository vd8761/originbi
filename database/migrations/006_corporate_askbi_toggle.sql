-- Migration 006: Corporate ASK BI toggle support
ALTER TABLE corporate_accounts
ADD COLUMN IF NOT EXISTS ask_bi_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_corporate_accounts_ask_bi_enabled_true
ON corporate_accounts (ask_bi_enabled)
WHERE ask_bi_enabled = true;