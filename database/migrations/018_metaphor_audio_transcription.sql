-- ============================================================
-- Migration 018: Level 3 "Metaphor" audio transcription
--
-- Keeps the browser transcript as the fallback while allowing an
-- asynchronous Gemini pass to replace answer_text_original before
-- the existing English translation job runs.
-- ============================================================

ALTER TABLE metaphor_answers
    ADD COLUMN IF NOT EXISTS answer_text_web TEXT,
    ADD COLUMN IF NOT EXISTS audio_storage_key VARCHAR(300),
    ADD COLUMN IF NOT EXISTS transcription_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS transcription_source VARCHAR(10),
    ADD COLUMN IF NOT EXISTS transcription_error TEXT;

CREATE INDEX IF NOT EXISTS idx_metaphor_answers_transcription
    ON metaphor_answers (transcription_status);

CREATE TABLE IF NOT EXISTS metaphor_transcription_jobs (
    id                     BIGSERIAL    PRIMARY KEY,
    assessment_attempt_id  BIGINT       NOT NULL UNIQUE,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    total                  INT          NOT NULL DEFAULT 0,
    transcribed            INT          NOT NULL DEFAULT 0,
    last_error             TEXT,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_sensitive, display_order)
VALUES ('metaphor', 'gemini_api_key', 'string', '',
        'Gemini API key', 'Server-side API key used for Level 3 audio transcription (never sent to the browser).', true, 11)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'gemini_model', 'string', 'gemini-2.0-flash',
        'Gemini model', 'Gemini model used for Level 3 audio transcription and translation.', 12)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('metaphor', 'audio_transcription_enabled', 'boolean', true,
        'Audio transcription enabled', 'When on, Level 3 uploads voice clips and transcribes them with Gemini before translation.', 13)
ON CONFLICT (category, setting_key) DO NOTHING;

DELETE FROM originbi_settings
WHERE category = 'metaphor'
  AND setting_key IN ('segment_limit', 'limit_behavior', 'checkpoint_label');
