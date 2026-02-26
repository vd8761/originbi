-- Migration: Student Subscriptions for AI Counsellor
-- Date: February 25, 2026
-- Purpose: Add subscription system for premium student features (AI Counsellor)

-- 1. Create student_subscriptions table
CREATE TABLE IF NOT EXISTS student_subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    registration_id BIGINT REFERENCES registrations(id),
    plan_type       VARCHAR(30) NOT NULL DEFAULT 'free',       -- 'free' | 'ai_counsellor'
    status          VARCHAR(20) NOT NULL DEFAULT 'active',     -- 'active' | 'expired' | 'cancelled'
    payment_provider VARCHAR(20),                              -- 'razorpay' | null for free
    payment_reference VARCHAR(100),                            -- razorpay payment_id
    payment_order_id  VARCHAR(100),                            -- razorpay order_id
    amount          NUMERIC(10, 2) DEFAULT 0,
    currency        VARCHAR(10) DEFAULT 'INR',
    purchased_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,                               -- NULL = lifetime
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add fast-access flag on registrations
ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS has_ai_counsellor BOOLEAN NOT NULL DEFAULT false;

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_user_id
    ON student_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_student_subscriptions_status
    ON student_subscriptions(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_registrations_ai_counsellor
    ON registrations(has_ai_counsellor) WHERE has_ai_counsellor = true;

-- 4. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_student_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_student_subscriptions_updated ON student_subscriptions;
CREATE TRIGGER trg_student_subscriptions_updated
    BEFORE UPDATE ON student_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_student_subscriptions_updated_at();
