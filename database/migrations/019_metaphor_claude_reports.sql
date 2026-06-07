-- ============================================================
-- Migration 019: Level 3 "Metaphor" Claude markdown reports
--
-- Adds retry-aware audio transcription metadata, Claude report
-- jobs, saved markdown reports, and admin-editable Claude/skill
-- settings. Readiness is based on the generated answer rows for
-- each attempt, not on a hardcoded question count.
-- ============================================================

ALTER TABLE metaphor_answers
    ADD COLUMN IF NOT EXISTS transcription_retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS transcription_next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS transcription_last_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_metaphor_answers_transcription_retry
    ON metaphor_answers (transcription_status, transcription_next_retry_at);

CREATE TABLE IF NOT EXISTS metaphor_reports (
    id                     BIGSERIAL    PRIMARY KEY,
    assessment_attempt_id  BIGINT       NOT NULL UNIQUE,
    assessment_session_id  BIGINT,
    user_id                BIGINT,
    registration_id        BIGINT,
    model                  VARCHAR(100),
    markdown               TEXT         NOT NULL,
    generated_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metaphor_reports_session
    ON metaphor_reports (assessment_session_id);

CREATE TABLE IF NOT EXISTS metaphor_report_jobs (
    id                     BIGSERIAL    PRIMARY KEY,
    assessment_attempt_id  BIGINT       NOT NULL UNIQUE,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    retry_count            INT          NOT NULL DEFAULT 0,
    max_retries            INT          NOT NULL DEFAULT 5,
    next_retry_at          TIMESTAMPTZ,
    last_error             TEXT,
    started_at             TIMESTAMPTZ,
    completed_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metaphor_report_jobs_status_retry
    ON metaphor_report_jobs (status, next_retry_at);

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_sensitive, display_order)
VALUES ('metaphor', 'claude_api_key', 'string', '',
        'Claude API key', 'Server-side Anthropic API key used only for Level 3 Metaphor report generation.', true, 14)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'claude_report_model', 'string', 'claude-sonnet-4-20250514',
        'Claude report model', 'Claude model used for Level 3 Metaphor markdown report generation.', 15)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('metaphor', 'report_skill_markdown', 'string',
$skill$
# DISC Behaviour Analyser

You are a senior behavioural assessment specialist trained in DISC psychology and career guidance. Analyse the generated Metaphor assessment responses and produce an admin-grade report for counsellors. Do not judge answers as right or wrong.

You will receive the attempt's generated questions in sequence. Some answers may be marked `[No answer submitted]`; treat missing answers as accountable evidence of non-response and do not invent content for them.

For each submitted translated English answer, silently identify the primary DISC trait:

**D - Dominance:** control, decide, win, fast, challenge, results, take charge, direct, bold.
**I - Influence:** people, together, feel, excited, inspire, connect, share, motivate, relationships.
**S - Steadiness:** support, careful, stable, harmony, trust, listen, patient, loyal, step by step.
**C - Conscientiousness:** analyse, process, data, correct, check, quality, accurate, research, evidence, logical.

Tally DISC scores across submitted answers. The total should equal the number of submitted answers, not the configured question count. Missing answers must be mentioned separately if any exist.

Determine the final DISC pattern:
- Single dominant: one trait is clearly highest.
- Primary + secondary: top two traits form the clearest behavioural combination.
- Adaptive: no clear dominant pattern.

Analyse these dimensions holistically:
Values Signal, Locus of Control, Ambiguity Tolerance, Thinking Style, Time Orientation, Identity Anchoring, Narrative Voice, Resilience Signal, Cultural Imprint.

Return clean Markdown only, no preamble:

## DISC Scores
D - [score] | I - [score] | S - [score] | C - [score]

Submitted answers: [count]
Missing answers: [count]

## Final DISC Pattern
[pattern]

## Behavioural Dimensions
DISC Pattern - [one line]
Values Signal - [one line]
Locus of Control - [one line]
Ambiguity Tolerance - [one line]
Thinking Style - [one line]
Time Orientation - [one line]
Identity Anchoring - [one line]
Narrative Voice - [one line]
Resilience Signal - [one line]
Cultural Imprint - [one line]

## Top 5 Roles & Career Paths
1. [Role Name] - [specific reason]
2. [Role Name] - [specific reason]
3. [Role Name] - [specific reason]
4. [Role Name] - [specific reason]
5. [Role Name] - [specific reason]

Use DISC plus the nine dimensions together for recommendations. Keep the output counsellor-ready, specific, and concise.
$skill$,
        'Metaphor report skill', 'Editable markdown prompt used by Claude to generate the Level 3 Metaphor report.', 16)
ON CONFLICT (category, setting_key) DO NOTHING;
