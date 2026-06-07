-- ============================================================
-- Migration 015: Level 3 "Metaphor" assessment (additive, isolated)
--
-- Adds the metaphor question bank + per-candidate voice answers +
-- async-translation tracking + a generic AI-usage log. Nothing here
-- touches existing tables; if Level 3 is never activated these tables
-- simply stay empty and no other pipeline is affected.
-- ============================================================

-- 1. Question bank (5 sets x 20). Images are referenced by URL (provided by Aarya);
--    image_url stays NULL until the URLs are supplied.
CREATE TABLE IF NOT EXISTS metaphor_questions (
    id                     BIGSERIAL    PRIMARY KEY,
    set_number             SMALLINT     NOT NULL,
    question_number        SMALLINT,
    program_id             BIGINT,                       -- NULL = global bank
    external_code          VARCHAR(50),
    image_url              VARCHAR(500),                 -- filled later (Aarya provides)
    image_description_en   TEXT,
    image_description_ta   TEXT,
    context_text_en        TEXT,
    context_text_ta        TEXT,
    question_text_en       TEXT,
    question_text_ta       TEXT,
    metadata               JSONB        NOT NULL DEFAULT '{}',
    is_active              BOOLEAN      NOT NULL DEFAULT true,
    is_deleted             BOOLEAN      NOT NULL DEFAULT false,
    created_by_user_id     BIGINT,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metaphor_questions_set
    ON metaphor_questions (set_number) WHERE is_active = true AND is_deleted = false;

-- 2. Candidate answers (one row per attempt+question). Checkpoints are NOT stored.
CREATE TABLE IF NOT EXISTS metaphor_answers (
    id                     BIGSERIAL    PRIMARY KEY,
    assessment_attempt_id  BIGINT       NOT NULL,
    assessment_session_id  BIGINT,
    user_id                BIGINT,
    registration_id        BIGINT,
    program_id             BIGINT,
    assessment_level_id    BIGINT,
    metaphor_question_id   BIGINT       NOT NULL,
    question_sequence      SMALLINT,
    spoken_language        VARCHAR(20),
    answer_text_original   TEXT,
    answer_text_en         TEXT,
    translation_status     VARCHAR(20)  NOT NULL DEFAULT 'NONE',   -- NONE | PENDING | DONE | FAILED
    status                 VARCHAR(20)  NOT NULL DEFAULT 'NOT_ANSWERED', -- NOT_ANSWERED | ANSWERED
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_metaphor_answer_attempt_question UNIQUE (assessment_attempt_id, metaphor_question_id)
);
CREATE INDEX IF NOT EXISTS idx_metaphor_answers_attempt ON metaphor_answers (assessment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_metaphor_answers_translation ON metaphor_answers (translation_status);

-- 3. Per-attempt translation job rollup (human-readable; pgboss drives execution).
CREATE TABLE IF NOT EXISTS metaphor_translation_jobs (
    id                     BIGSERIAL    PRIMARY KEY,
    assessment_attempt_id  BIGINT       NOT NULL UNIQUE,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | DONE | FAILED
    total                  INT          NOT NULL DEFAULT 0,
    translated             INT          NOT NULL DEFAULT 0,
    last_error             TEXT,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. Generic AI usage / token log (reusable beyond metaphor).
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id                     BIGSERIAL    PRIMARY KEY,
    purpose                VARCHAR(50)  NOT NULL,        -- e.g. 'metaphor_translation'
    assessment_attempt_id  BIGINT,
    model                  VARCHAR(100),
    input_tokens           INT          NOT NULL DEFAULT 0,
    output_tokens          INT          NOT NULL DEFAULT 0,
    total_tokens           INT          NOT NULL DEFAULT 0,
    question_count         INT          NOT NULL DEFAULT 0,
    question_ids           JSONB        NOT NULL DEFAULT '[]',
    status                 VARCHAR(20)  NOT NULL DEFAULT 'DONE',
    error                  TEXT,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_attempt ON ai_usage_logs (assessment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_purpose ON ai_usage_logs (purpose);

-- 5. Admin-configurable settings (category 'metaphor'). Safe defaults so the
--    feature behaves even before an admin edits anything.
INSERT INTO originbi_settings (category, setting_key, value_type, value_number, label, description, display_order)
VALUES ('metaphor', 'question_count', 'number', 20,
        'Questions per assessment', 'How many metaphor questions are shown (from one random set).', 1)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('metaphor', 'allow_typing', 'boolean', false,
        'Allow typing fallback', 'When on, candidates can type instead of (or alongside) speaking.', 2)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('metaphor', 'duration_override', 'boolean', false,
        'Override Level 3 duration', 'When on, use the duration below instead of the default.', 3)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_number, label, description, display_order)
VALUES ('metaphor', 'duration_minutes', 'number', 20,
        'Assessment duration (minutes)', 'Overall soft timer for the Level 3 assessment (not force-submitted).', 4)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'checkpoint_label', 'string', 'Capture',
        'Capture button label', 'The label for the "pin a spoken segment" button.', 5)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_number, label, description, display_order)
VALUES ('metaphor', 'segment_limit', 'number', 5,
        'Max saved segments', 'Maximum number of checkpoints a candidate can pin per question.', 6)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('metaphor', 'stt_provider', 'json',
        '{"provider":"web_speech","params":{}}'::jsonb,
        'Speech-to-text provider',
        'Which STT engine the exam page uses. provider = web_speech | elevenlabs | azure | google | deepgram. Cloud providers also need the secret below.', 7)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_sensitive, display_order)
VALUES ('metaphor', 'stt_secret', 'string', '',
        'STT provider API key', 'Server-side API key for the cloud STT provider (never sent to the browser).', true, 8)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('metaphor', 'supported_languages', 'json',
        '[{"code":"en-IN","label":"English","native":"English"},{"code":"ta-IN","label":"Tamil","native":"தமிழ்"},{"code":"hi-IN","label":"Hindi","native":"हिन्दी"},{"code":"te-IN","label":"Telugu","native":"తెలుగు"},{"code":"ml-IN","label":"Malayalam","native":"മലയാളം"},{"code":"kn-IN","label":"Kannada","native":"ಕನ್ನಡ"}]'::jsonb,
        'Supported spoken languages', 'Languages the candidate can pick to speak in (for speech recognition).', 9)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'limit_behavior', 'string', 'disable',
        'At segment limit', 'When max segments reached: "disable" (block more) or "replace" (drop oldest).', 10)
ON CONFLICT (category, setting_key) DO NOTHING;
