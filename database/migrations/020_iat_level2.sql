-- ============================================================
-- Migration 020: Level 2 IAT Gen assessment
--
-- Additive sidecar schema for an IAT-based Level 2 replacement. ACI remains
-- the default Level 2 path; IAT is selected per registration via settings.
-- ============================================================

CREATE TABLE IF NOT EXISTS iat_modules (
    id                      BIGSERIAL   PRIMARY KEY,
    code                    VARCHAR(50) NOT NULL UNIQUE,
    name                    VARCHAR(150) NOT NULL,
    display_name            VARCHAR(150) NOT NULL,
    module_order            SMALLINT    NOT NULL,
    left_concept_key         VARCHAR(50) NOT NULL,
    right_concept_key        VARCHAR(50) NOT NULL,
    compatible_left_keys     JSONB       NOT NULL DEFAULT '[]',
    compatible_right_keys    JSONB       NOT NULL DEFAULT '[]',
    incompatible_left_keys   JSONB       NOT NULL DEFAULT '[]',
    incompatible_right_keys  JSONB       NOT NULL DEFAULT '[]',
    slowed_on_description    TEXT,
    metadata                JSONB       NOT NULL DEFAULT '{}',
    is_active               BOOLEAN     NOT NULL DEFAULT true,
    is_deleted              BOOLEAN     NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iat_modules_order
    ON iat_modules (module_order) WHERE is_active = true AND is_deleted = false;

CREATE TABLE IF NOT EXISTS iat_stimuli (
    id              BIGSERIAL   PRIMARY KEY,
    module_id       BIGINT      NOT NULL REFERENCES iat_modules(id),
    concept_key     VARCHAR(50) NOT NULL,
    word            TEXT        NOT NULL,
    display_order   SMALLINT    NOT NULL DEFAULT 1,
    metadata        JSONB       NOT NULL DEFAULT '{}',
    is_active       BOOLEAN     NOT NULL DEFAULT true,
    is_deleted      BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_iat_stimulus_module_word UNIQUE (module_id, concept_key, word)
);
CREATE INDEX IF NOT EXISTS idx_iat_stimuli_module_concept
    ON iat_stimuli (module_id, concept_key) WHERE is_active = true AND is_deleted = false;

CREATE TABLE IF NOT EXISTS iat_intake_profiles (
    id                         BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id      BIGINT      NOT NULL UNIQUE,
    assessment_session_id      BIGINT,
    user_id                    BIGINT,
    registration_id            BIGINT,
    program_id                 BIGINT,
    student_name               VARCHAR(255),
    age                        SMALLINT,
    gender                     VARCHAR(20),
    hometown_tier              VARCHAR(30),
    college_tier               VARCHAR(30),
    undergraduate_stream       VARCHAR(50),
    work_experience_years      NUMERIC(4,1),
    metadata                   JSONB       NOT NULL DEFAULT '{}',
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iat_attempt_modules (
    id                         BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id      BIGINT      NOT NULL,
    assessment_session_id      BIGINT,
    user_id                    BIGINT,
    registration_id            BIGINT,
    program_id                 BIGINT,
    assessment_level_id        BIGINT,
    module_id                  BIGINT      NOT NULL REFERENCES iat_modules(id),
    module_order               SMALLINT    NOT NULL,
    status                     VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    compatible_average_ms      NUMERIC(10,2),
    incompatible_average_ms    NUMERIC(10,2),
    speed_gap_ms               NUMERIC(10,2),
    pattern_label              VARCHAR(20),
    slowest_words              JSONB       NOT NULL DEFAULT '[]',
    error_words                JSONB       NOT NULL DEFAULT '[]',
    error_rate                 NUMERIC(6,2),
    started_at                 TIMESTAMPTZ,
    completed_at               TIMESTAMPTZ,
    metadata                   JSONB       NOT NULL DEFAULT '{}',
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_iat_attempt_module UNIQUE (assessment_attempt_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_iat_attempt_modules_attempt
    ON iat_attempt_modules (assessment_attempt_id, module_order);

CREATE TABLE IF NOT EXISTS iat_trials (
    id                         BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id      BIGINT      NOT NULL,
    iat_attempt_module_id      BIGINT      NOT NULL REFERENCES iat_attempt_modules(id) ON DELETE CASCADE,
    module_id                  BIGINT      NOT NULL REFERENCES iat_modules(id),
    stimulus_id                BIGINT      REFERENCES iat_stimuli(id),
    trial_sequence             INT         NOT NULL,
    step_number                SMALLINT    NOT NULL,
    block_type                 VARCHAR(30) NOT NULL,
    word_shown                 TEXT        NOT NULL,
    left_label                 TEXT,
    right_label                TEXT,
    expected_key               CHAR(1)     NOT NULL,
    first_key_pressed          CHAR(1),
    final_key_pressed          CHAR(1),
    is_correct                 BOOLEAN,
    response_time_ms           INT,
    first_response_time_ms     INT,
    status                     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    shown_at                   TIMESTAMPTZ,
    answered_at                TIMESTAMPTZ,
    metadata                   JSONB       NOT NULL DEFAULT '{}',
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_iat_trial_sequence UNIQUE (assessment_attempt_id, iat_attempt_module_id, trial_sequence)
);
CREATE INDEX IF NOT EXISTS idx_iat_trials_attempt_module
    ON iat_trials (assessment_attempt_id, iat_attempt_module_id, trial_sequence);

CREATE TABLE IF NOT EXISTS iat_keypresses (
    id                         BIGSERIAL   PRIMARY KEY,
    iat_trial_id               BIGINT      NOT NULL REFERENCES iat_trials(id) ON DELETE CASCADE,
    assessment_attempt_id      BIGINT      NOT NULL,
    key_pressed                CHAR(1)     NOT NULL,
    response_time_ms           INT         NOT NULL,
    is_correct                 BOOLEAN     NOT NULL DEFAULT false,
    event_sequence             SMALLINT    NOT NULL DEFAULT 1,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iat_keypresses_trial
    ON iat_keypresses (iat_trial_id, event_sequence);

CREATE TABLE IF NOT EXISTS iat_reports (
    id                         BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id      BIGINT      NOT NULL UNIQUE,
    assessment_session_id      BIGINT,
    user_id                    BIGINT,
    registration_id            BIGINT,
    program_id                 BIGINT,
    group_id                   BIGINT,
    status                     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    model                      VARCHAR(100),
    report_text                TEXT,
    report_input               JSONB       NOT NULL DEFAULT '{}',
    bias_map                   JSONB       NOT NULL DEFAULT '[]',
    error                      TEXT,
    generated_at               TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iat_reports_session
    ON iat_reports (assessment_session_id);

CREATE TABLE IF NOT EXISTS iat_report_jobs (
    id                         BIGSERIAL   PRIMARY KEY,
    assessment_attempt_id      BIGINT      NOT NULL UNIQUE,
    status                     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count                INT         NOT NULL DEFAULT 0,
    max_retries                INT         NOT NULL DEFAULT 5,
    next_retry_at              TIMESTAMPTZ,
    last_error                 TEXT,
    started_at                 TIMESTAMPTZ,
    completed_at               TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iat_report_jobs_status_retry
    ON iat_report_jobs (status, next_retry_at);

INSERT INTO iat_modules
    (code, name, display_name, module_order, left_concept_key, right_concept_key,
     compatible_left_keys, compatible_right_keys, incompatible_left_keys, incompatible_right_keys,
     slowed_on_description)
VALUES
    ('hierarchy', 'Hierarchy and Age Bias', 'Hierarchy and Age', 1, 'young', 'senior',
     '["young","strategic"]', '["senior","dependent"]', '["senior","strategic"]', '["young","dependent"]',
     'young + leadership pairings'),
    ('pedigree', 'Pedigree and Regional Affinity Bias', 'Pedigree and Regional Affinity', 2, 'elite', 'outgroup',
     '["elite","high_capability"]', '["outgroup","average_capability"]', '["outgroup","high_capability"]', '["elite","average_capability"]',
     'non-tier-1 + high capability pairings'),
    ('gender', 'Gender and Career Role Bias', 'Gender and Career Role', 3, 'female', 'male',
     '["female","domestic"]', '["male","executive"]', '["female","executive"]', '["male","domestic"]',
     'female names + executive role pairings'),
    ('articulation', 'Communication and Articulation Bias', 'Communication and Articulation', 4, 'fluent', 'vernacular',
     '["fluent","leader"]', '["vernacular","back_office"]', '["vernacular","leader"]', '["fluent","back_office"]',
     'vernacular + leader pairings'),
    ('psychological_safety', 'Psychological Safety Bias', 'Psychological Safety', 5, 'authority', 'peer',
     '["authority","always_correct"]', '["peer","open_to_critique"]', '["authority","open_to_critique"]', '["peer","always_correct"]',
     'authority + open to critique pairings'),
    ('origin', 'Origin and Surname Bias', 'Origin and Surname', 6, 'group_a', 'group_b',
     '["group_a","leadership_roles"]', '["group_b","support_roles"]', '["group_b","leadership_roles"]', '["group_a","support_roles"]',
     'Group B names + leadership role pairings')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    module_order = EXCLUDED.module_order,
    left_concept_key = EXCLUDED.left_concept_key,
    right_concept_key = EXCLUDED.right_concept_key,
    compatible_left_keys = EXCLUDED.compatible_left_keys,
    compatible_right_keys = EXCLUDED.compatible_right_keys,
    incompatible_left_keys = EXCLUDED.incompatible_left_keys,
    incompatible_right_keys = EXCLUDED.incompatible_right_keys,
    slowed_on_description = EXCLUDED.slowed_on_description,
    updated_at = NOW();

WITH seed(code, concept_key, words) AS (
    VALUES
    ('hierarchy','young',ARRAY['Gen-Z','Millennial','Associate','Management Trainee','Junior']),
    ('hierarchy','senior',ARRAY['Veteran','CXO','Director','Industry Elder','Promoter']),
    ('hierarchy','strategic',ARRAY['Visionary','Decision-maker','Innovative','Autonomy','Architect']),
    ('hierarchy','dependent',ARRAY['Assistant','Implementer','Follower','Execution','Trainee']),
    ('pedigree','elite',ARRAY['IIT Graduate','IIM Alumnus','Native Speaker','Alumnus','Top Tier']),
    ('pedigree','outgroup',ARRAY['Regional College','Tier-3','Distance Learning','Accent','Outstation']),
    ('pedigree','high_capability',ARRAY['Exceptional','Top-performer','Strategic Asset','Visionary','High-potential']),
    ('pedigree','average_capability',ARRAY['Ordinary','Mediocre','Standard','Replaceable','Baseline']),
    ('gender','female',ARRAY['Ananya','Priya','Sunita','Deepika','Kavita']),
    ('gender','male',ARRAY['Rahul','Amit','Vikram','Rajesh','Arjun']),
    ('gender','executive',ARRAY['Boardroom','P&L Owner','Global Project','Scale','Strategy']),
    ('gender','domestic',ARRAY['Childcare','Household','Marriage','Leave','Maternity']),
    ('articulation','fluent',ARRAY['Articulate','Polished English','Eloquent','Presenter','Vocal']),
    ('articulation','vernacular',ARRAY['Quiet','Reserved','Regional Accent','Hindi-medium','Shyer']),
    ('articulation','leader',ARRAY['Authority','Strategist','Key Thinker','Decision-maker','Director']),
    ('articulation','back_office',ARRAY['Executor','Coder','Data Entry','Support','Support-staff']),
    ('psychological_safety','authority',ARRAY['Founder','Chairman','Managing Director','Sir','Reporting Manager']),
    ('psychological_safety','peer',ARRAY['Team Member','Colleague','Desk Partner','Intern','Reportee']),
    ('psychological_safety','always_correct',ARRAY['Infallible','Absolute','Command','Final Word','Definite']),
    ('psychological_safety','open_to_critique',ARRAY['Feedback','Disagreement','Debate','Challenged','Questioned']),
    ('origin','group_a',ARRAY['Sharma','Iyer','Pillai','Nair','Reddy']),
    ('origin','group_b',ARRAY['Paswan','Chamar','Dhobi','Khatik','Mahar']),
    ('origin','leadership_roles',ARRAY['Director','Founder','Manager','Strategist','Leader']),
    ('origin','support_roles',ARRAY['Helper','Cleaner','Assistant','Attendant','Labourer'])
)
INSERT INTO iat_stimuli (module_id, concept_key, word, display_order)
SELECT m.id, seed.concept_key, word, ord
FROM seed
JOIN iat_modules m ON m.code = seed.code
CROSS JOIN LATERAL unnest(seed.words) WITH ORDINALITY AS w(word, ord)
ON CONFLICT (module_id, concept_key, word) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('iat', 'enabled', 'boolean', false,
        'Enable IAT Gen', 'When enabled, matching Level 2 candidates receive IAT Gen instead of ACI.', 1)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('iat', 'level2_replacement_rules', 'json',
        '{"rules":[]}'::jsonb,
        'Level 2 IAT replacement rules',
        'Program, department/degree, and board combinations that should receive IAT Gen instead of ACI.', 2)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, is_sensitive, display_order)
VALUES ('iat', 'claude_api_key', 'string', '',
        'Claude API key', 'Server-side Anthropic API key for IAT report generation.', true, 3)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('iat', 'claude_report_model', 'string', 'claude-sonnet-4-20250514',
        'Claude report model', 'Claude model used for admin-only IAT reports.', 4)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_string, label, description, display_order)
VALUES ('iat', 'report_skill_markdown', 'string', $iat_skill$# IAT-Based Corporate Bias Report Skill

## Purpose
This skill receives IAT assessment data from an MBA student and generates a deeply personal, honest, and actionable bias report in the format of a letter from a trusted senior mentor.

## Trigger
Use this skill when student IAT assessment data is submitted after completing all 6 bias modules.

## Input Format
The skill receives a JSON object with:

- student: name, age, gender, hometown_tier, college_tier, undergraduate_stream, work_experience_years
- areas: hierarchy, pedigree, gender, articulation, psychological_safety, origin
- summary: strongest_bias, weakest_bias, high_error_areas

Each area includes pattern, slowed_on, slowest_words, error_words, average_gap_ms, and error_rate.

## Prompt To Send To Claude API

You are a senior leadership coach and trusted mentor who deeply understands Indian corporate culture, MBA career development, and the hidden biases that shape leadership behaviour in India.

A student has just completed an implicit association test. Their response patterns - how fast or slow they reacted, and where they made errors - have revealed their instinctive bias profile across 6 areas.

Your job is to write them a deeply personal, honest, and actionable report in the format of a letter from a trusted senior mentor. This is not a test result. It is a mirror.

STUDENT BACKGROUND:
Name: {{student.name}}
Age: {{student.age}}
Gender: {{student.gender}}
Hometown: {{student.hometown_tier}}
College: {{student.college_tier}}
Stream: {{student.undergraduate_stream}}
Work experience: {{student.work_experience_years}} years

WHAT THEIR RESPONSES REVEALED:

AREA 1 - HIERARCHY AND AGE BIAS
Pattern strength: {{areas.hierarchy.pattern}}
They slowed down on: {{areas.hierarchy.slowed_on}}
Words that slowed them most: {{areas.hierarchy.slowest_words}}
Words they pressed wrong key on: {{areas.hierarchy.error_words}}

AREA 2 - PEDIGREE AND REGIONAL AFFINITY BIAS
Pattern strength: {{areas.pedigree.pattern}}
They slowed down on: {{areas.pedigree.slowed_on}}
Words that slowed them most: {{areas.pedigree.slowest_words}}
Words they pressed wrong key on: {{areas.pedigree.error_words}}

AREA 3 - GENDER AND CAREER ROLE BIAS
Pattern strength: {{areas.gender.pattern}}
They slowed down on: {{areas.gender.slowed_on}}
Words that slowed them most: {{areas.gender.slowest_words}}
Words they pressed wrong key on: {{areas.gender.error_words}}

AREA 4 - COMMUNICATION AND ARTICULATION BIAS
Pattern strength: {{areas.articulation.pattern}}
They slowed down on: {{areas.articulation.slowed_on}}
Words that slowed them most: {{areas.articulation.slowest_words}}
Words they pressed wrong key on: {{areas.articulation.error_words}}

AREA 5 - PSYCHOLOGICAL SAFETY BIAS
Pattern strength: {{areas.psychological_safety.pattern}}
They slowed down on: {{areas.psychological_safety.slowed_on}}
Words that slowed them most: {{areas.psychological_safety.slowest_words}}
Words they pressed wrong key on: {{areas.psychological_safety.error_words}}

AREA 6 - ORIGIN AND SURNAME BIAS
Pattern strength: {{areas.origin.pattern}}
They slowed down on: {{areas.origin.slowed_on}}
Words that slowed them most: {{areas.origin.slowest_words}}
Words they pressed wrong key on: {{areas.origin.error_words}}

OVERALL SUMMARY:
Their strongest bias area: {{summary.strongest_bias}}
Their weakest bias area (genuine strength): {{summary.weakest_bias}}
Areas with highest error rate: {{summary.high_error_areas}}

NOW WRITE THE REPORT.

Structure it exactly as follows:

SECTION 1 - OPENING (3 to 4 paragraphs)
Write directly to the student by name. Reference their specific background - hometown tier, college tier, and work experience. Make them feel genuinely seen, not judged. Connect their background to why this report matters for their future. Do not use generic opener lines.

SECTION 2 - YOUR BIAS MAP (one paragraph per area, all 6 areas)
For each area write three things in flowing prose, not bullet points: what their specific pattern means in plain conversational language, one vivid Indian workplace scenario where this bias may show up, and one practical action an MBA student can take now. For strong patterns, reference the specific slowest words by name. For low patterns, acknowledge it as a genuine strength and tell them how to use it. Never use the word caste directly for origin bias; frame it as pattern recognition around names and backgrounds. Never use academic or psychological jargon.

SECTION 3 - YOUR LEADERSHIP SHADOW (2 paragraphs)
Tell them honestly what kind of leader they will become if they do nothing about these patterns. Be specific about the real cost to their team, career, and results. Then tell them what kind of leader they can become if they act on this.

SECTION 4 - YOUR 90 DAY RESET (3 to 4 paragraphs)
Give three concrete actions tied directly to their strongest bias areas. Each action must be practical for an Indian MBA student right now. Frame them as small consistent habits, not grand gestures. End with one closing line that connects back to their personal background.

STRICT TONE AND FORMAT RULES:
Write in flowing prose with no bullet points anywhere in the report. Use short paragraphs, maximum 4 lines each. Sound like a trusted senior mentor writing a personal letter: warm, direct, honest. Never harsh, clinical, or generic. Always ground observations in Indian corporate reality. Never use the word caste. Never use D-score, IAT, implicit association, or any technical assessment language. Do not say "your results show"; say "your responses revealed" or "when these words appeared." Frame every bias as a career opportunity to grow, not a character flaw. End the report without a formal sign-off.

## Output
Claude returns a plain text narrative report - a personal letter structured in 4 sections as described above.

## Important Notes For Developers
Never show raw JSON data to the student. Do not regenerate the report on page refresh. Serve the stored version. In this phase, show this report only in the admin assessment candidate preview.
$iat_skill$,
        'IAT report skill prompt', 'Markdown prompt template used to generate the admin-only IAT report.', 5)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_number, label, description, display_order)
VALUES ('iat', 'min_retake_days', 'number', 30,
        'Minimum retake gap (days)', 'Recommended minimum days before allowing another IAT attempt.', 6)
ON CONFLICT (category, setting_key) DO NOTHING;
