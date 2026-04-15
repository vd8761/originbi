-- Migration 007: Corporate Jobs + Candidate Applications domain
-- Date: 2026-04-08
-- Purpose: Add jobs, job skills, job applications, and application status history tables

-- 1) corporate_jobs
CREATE TABLE IF NOT EXISTS corporate_jobs (
    id BIGSERIAL PRIMARY KEY,
    corporate_account_id BIGINT NOT NULL REFERENCES corporate_accounts(id),
    created_by_user_id BIGINT NULL REFERENCES users(id),
    updated_by_user_id BIGINT NULL REFERENCES users(id),
    job_ref_no VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(120) NULL,
    location VARCHAR(160) NULL,
    work_mode VARCHAR(20) NOT NULL,
    employment_type VARCHAR(20) NOT NULL,
    shift VARCHAR(20) NULL,
    experience_level VARCHAR(30) NULL,
    min_ctc NUMERIC(12, 2) NULL,
    max_ctc NUMERIC(12, 2) NULL,
    currency_code VARCHAR(8) NOT NULL DEFAULT 'INR',
    openings INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    posting_start_at TIMESTAMPTZ NULL,
    posting_end_at TIMESTAMPTZ NULL,
    description TEXT NOT NULL,
    responsibilities TEXT NULL,
    eligibility TEXT NULL,
    nice_to_have TEXT NULL,
    what_you_will_learn TEXT NULL,
    company_details TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_cjobs_work_mode
        CHECK (work_mode IN ('ONSITE', 'REMOTE', 'HYBRID')),
    CONSTRAINT chk_cjobs_employment_type
        CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT')),
    CONSTRAINT chk_cjobs_shift
        CHECK (shift IS NULL OR shift IN ('DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE')),
    CONSTRAINT chk_cjobs_experience
        CHECK (experience_level IS NULL OR experience_level IN ('FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD')),
    CONSTRAINT chk_cjobs_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'HOLD', 'CLOSED', 'ARCHIVED')),
    CONSTRAINT chk_cjobs_openings
        CHECK (openings >= 1),
    CONSTRAINT chk_cjobs_ctc_range
        CHECK (min_ctc IS NULL OR max_ctc IS NULL OR min_ctc <= max_ctc),
    CONSTRAINT chk_cjobs_posting_range
        CHECK (posting_start_at IS NULL OR posting_end_at IS NULL OR posting_start_at <= posting_end_at)
);

-- 2) corporate_job_skills
CREATE TABLE IF NOT EXISTS corporate_job_skills (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES corporate_jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(120) NOT NULL,
    skill_type VARCHAR(20) NOT NULL DEFAULT 'REQUIRED',
    weight SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_cjobskills_type
        CHECK (skill_type IN ('REQUIRED', 'PREFERRED')),
    CONSTRAINT chk_cjobskills_weight
        CHECK (weight >= 1)
);

-- 3) job_applications
CREATE TABLE IF NOT EXISTS job_applications (
    id BIGSERIAL PRIMARY KEY,
    corporate_account_id BIGINT NOT NULL REFERENCES corporate_accounts(id),
    job_id BIGINT NOT NULL REFERENCES corporate_jobs(id),
    registration_id BIGINT NOT NULL REFERENCES registrations(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    source VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    current_status VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    status_reason TEXT NULL,
    status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    match_score NUMERIC(5, 2) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_japps_source
        CHECK (source IN ('INTERNAL', 'EXTERNAL', 'REFERRAL', 'BULK_IMPORT')),
    CONSTRAINT chk_japps_status
        CHECK (current_status IN ('APPLIED', 'SHORTLISTED', 'HIRED', 'REJECTED', 'WITHDRAWN')),
    CONSTRAINT chk_japps_match_score
        CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100))
);

-- Allow one active application per candidate per job while supporting soft-delete.
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_registration_active
    ON job_applications(job_id, registration_id)
    WHERE is_deleted = false;

-- 4) job_application_status_history
CREATE TABLE IF NOT EXISTS job_application_status_history (
    id BIGSERIAL PRIMARY KEY,
    job_application_id BIGINT NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    from_status VARCHAR(20) NULL,
    to_status VARCHAR(20) NOT NULL,
    changed_by_user_id BIGINT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- 5) Optional advanced event log
CREATE TABLE IF NOT EXISTS job_activity_log (
    id BIGSERIAL PRIMARY KEY,
    corporate_account_id BIGINT NOT NULL REFERENCES corporate_accounts(id),
    job_id BIGINT NULL REFERENCES corporate_jobs(id),
    application_id BIGINT NULL REFERENCES job_applications(id),
    actor_user_id BIGINT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) Advanced integrity hardening
-- These composite unique indexes support strict composite FKs below.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cjobs_id_corp
    ON corporate_jobs(id, corporate_account_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registrations_id_corp_user
    ON registrations(id, corporate_account_id, user_id);

-- Enforce: job_applications.job_id must belong to same corporate_account_id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_japps_job_corporate_match'
    ) THEN
        ALTER TABLE job_applications
            ADD CONSTRAINT fk_japps_job_corporate_match
            FOREIGN KEY (job_id, corporate_account_id)
            REFERENCES corporate_jobs(id, corporate_account_id);
    END IF;
END $$;

-- Enforce: registration and user must match the same corporate context.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_japps_registration_corp_user_match'
    ) THEN
        ALTER TABLE job_applications
            ADD CONSTRAINT fk_japps_registration_corp_user_match
            FOREIGN KEY (registration_id, corporate_account_id, user_id)
            REFERENCES registrations(id, corporate_account_id, user_id);
    END IF;
END $$;

-- 7) Performance indexes
CREATE INDEX IF NOT EXISTS idx_cjobs_corp_status_created
    ON corporate_jobs(corporate_account_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cjobs_corp_posting_end
    ON corporate_jobs(corporate_account_id, posting_end_at);

CREATE INDEX IF NOT EXISTS idx_job_skills_job_id
    ON corporate_job_skills(job_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_job_skill_name_type
    ON corporate_job_skills(job_id, LOWER(skill_name), skill_type);

CREATE INDEX IF NOT EXISTS idx_japps_corp_status_applied
    ON job_applications(corporate_account_id, current_status, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_japps_job_status
    ON job_applications(job_id, current_status);

CREATE INDEX IF NOT EXISTS idx_japps_registration
    ON job_applications(registration_id);

CREATE INDEX IF NOT EXISTS idx_japps_user
    ON job_applications(user_id);

CREATE INDEX IF NOT EXISTS idx_japps_registration_corp_user
    ON job_applications(registration_id, corporate_account_id, user_id);

CREATE INDEX IF NOT EXISTS idx_jash_application_changed_at
    ON job_application_status_history(job_application_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_jactivity_corp_created
    ON job_activity_log(corporate_account_id, created_at DESC);

-- Optional trigram index (created only if pg_trgm extension is already available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cjobs_corp_title_trgm ON corporate_jobs USING GIN (title gin_trgm_ops)';
    END IF;
END $$;

-- 8) updated_at triggers
CREATE OR REPLACE FUNCTION update_jobs_domain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_corporate_jobs_updated ON corporate_jobs;
CREATE TRIGGER trg_corporate_jobs_updated
    BEFORE UPDATE ON corporate_jobs
    FOR EACH ROW EXECUTE FUNCTION update_jobs_domain_updated_at();

DROP TRIGGER IF EXISTS trg_job_applications_updated ON job_applications;
CREATE TRIGGER trg_job_applications_updated
    BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_jobs_domain_updated_at();
