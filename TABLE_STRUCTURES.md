# Database Table Structures

**Last updated:** 2026-06-12
**Database checked:** PostgreSQL `public` schema, local `originbi` database at `localhost:5432`

This document lists only the tables used by this OriginBI codebase and confirmed to exist in the connected database. The database contains tables for more than one project, so tables that are present in PostgreSQL but are not referenced by this repo are intentionally excluded.

## Verification Summary

| Check | Result |
|---|---:|
| Public tables in connected DB | 138 |
| Tables referenced by this repo backend code | 61 |
| Referenced tables confirmed in connected DB and documented below | 52 |
| Referenced tables not present in connected DB and excluded from structures | 9 |
| Other public tables excluded as not used by this repo | 86 |

Code sources checked: TypeORM `@Entity(...)` declarations under `backend/**`, Go `TableName()` declarations in `backend/exam-engine`, and SQL migration table references under `database/migrations`.

## Tables Confirmed And Documented

- `aci_score_bands` (4 rows)
- `aci_trait_value_notes` (60 rows)
- `aci_traits` (12 rows)
- `aci_values` (5 rows)
- `affiliate_accounts` (9 rows)
- `affiliate_referral_transactions` (4 rows)
- `affiliate_settlement_transactions` (0 rows)
- `ai_usage_logs` (39 rows)
- `assessment_answers` (69128 rows)
- `assessment_attempts` (1761 rows)
- `assessment_levels` (5 rows)
- `assessment_question_options` (41255 rows)
- `assessment_questions` (12631 rows)
- `assessment_reports` (633 rows)
- `assessment_sessions` (868 rows)
- `corporate_accounts` (7 rows)
- `corporate_counselling_access` (2 rows)
- `corporate_credit_ledger` (245 rows)
- `counselling_question_options` (120 rows)
- `counselling_questions` (30 rows)
- `counselling_responses` (63 rows)
- `counselling_sessions` (4 rows)
- `counselling_types` (1 rows)
- `degree_types` (11 rows)
- `department_degrees` (41 rows)
- `departments` (30 rows)
- `group_assessments` (81 rows)
- `groups` (16 rows)
- `iat_attempt_modules` (84 rows)
- `iat_intake_profiles` (14 rows)
- `iat_keypresses` (6040 rows)
- `iat_modules` (6 rows)
- `iat_report_jobs` (4 rows)
- `iat_reports` (4 rows)
- `iat_stimuli` (120 rows)
- `iat_trials` (8640 rows)
- `metaphor_answers` (161 rows)
- `metaphor_questions` (100 rows)
- `metaphor_report_jobs` (7 rows)
- `metaphor_reports` (6 rows)
- `metaphor_transcription_jobs` (6 rows)
- `metaphor_translation_jobs` (9 rows)
- `notifications` (71 rows)
- `open_question_options` (560 rows)
- `open_questions` (140 rows)
- `originbi_settings` (69 rows)
- `personality_traits` (12 rows)
- `programs` (7 rows)
- `registrations` (878 rows)
- `school_streams` (6 rows)
- `student_subscriptions` (0 rows)
- `users` (907 rows)

## Table Structures

### `aci_score_bands`

Rows in connected DB: **4**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | smallint | NO | nextval('aci_score_bands_id_seq'::regclass) |
| `min_score` | smallint | YES |  |
| `max_score` | smallint | YES |  |
| `level_name` | character varying(60) | NO |  |
| `compatibility_tag` | character varying(150) | NO |  |
| `interpretation` | text | NO |  |
| `display_order` | smallint | NO |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `aci_trait_value_notes`

Rows in connected DB: **60**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('aci_trait_value_notes_id_seq'::regclass) |
| `aci_trait_id` | integer | NO |  |
| `aci_value_id` | smallint | NO |  |
| `behavioral_note` | text | NO |  |
| `reflection_text` | text | YES |  |
| `micro_habit` | text | YES |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `aci_trait_id -> aci_traits.id`
- `aci_value_id -> aci_values.id`

### `aci_traits`

Rows in connected DB: **12**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | integer | NO | nextval('aci_traits_id_seq'::regclass) |
| `trait_code` | character varying(10) | NO |  |
| `trait_title` | character varying(150) | NO |  |
| `short_summary` | text | YES |  |
| `detailed_overview` | text | YES |  |
| `personalized_insight` | text | YES |  |
| `score_overview_interpretation` | text | YES |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `aci_values`

Rows in connected DB: **5**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | smallint | NO | nextval('aci_values_id_seq'::regclass) |
| `value_name` | character varying(30) | NO |  |
| `display_order` | smallint | NO |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `affiliate_accounts`

Rows in connected DB: **9**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('affiliate_accounts_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `name` | character varying(255) | NO |  |
| `email` | character varying(255) | NO |  |
| `country_code` | character varying(10) | NO | '+91'::character varying |
| `mobile_number` | character varying(20) | NO |  |
| `address` | text | YES |  |
| `referral_code` | character varying(20) | NO |  |
| `referral_count` | integer | NO | 0 |
| `commission_percentage` | numeric(5,2) | NO | '0'::numeric |
| `total_earned_commission` | numeric(12,2) | NO | '0'::numeric |
| `total_settled_commission` | numeric(12,2) | NO | '0'::numeric |
| `total_pending_commission` | numeric(12,2) | NO | '0'::numeric |
| `upi_id` | character varying(100) | YES |  |
| `upi_number` | character varying(20) | YES |  |
| `banking_name` | character varying(255) | YES |  |
| `account_number` | character varying(50) | YES |  |
| `ifsc_code` | character varying(20) | YES |  |
| `branch_name` | character varying(255) | YES |  |
| `is_active` | boolean | NO | true |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `aadhar_documents` | jsonb | NO | '[]'::jsonb |
| `pan_documents` | jsonb | NO | '[]'::jsonb |
| `settlement_notification_sent` | boolean | YES | false |

Primary key: `id`

### `affiliate_referral_transactions`

Rows in connected DB: **4**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('affiliate_referral_transactions_id_seq'::regclass) |
| `affiliate_account_id` | bigint | NO |  |
| `registration_id` | bigint | NO |  |
| `registration_amount` | numeric(10,2) | NO | 0 |
| `commission_percentage` | numeric(5,2) | NO | 0 |
| `earned_commission_amount` | numeric(10,2) | NO | 0 |
| `settlement_status` | smallint | NO | 0 |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `payment_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `affiliate_account_id -> affiliate_accounts.id`

### `affiliate_settlement_transactions`

Rows in connected DB: **0**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('affiliate_settlement_transactions_id_seq'::regclass) |
| `affiliate_account_id` | bigint | NO |  |
| `settle_amount` | numeric(10,2) | NO |  |
| `transaction_mode` | character varying(50) | NO |  |
| `settlement_transaction_id` | character varying(255) | NO |  |
| `payment_date` | date | NO | ('now'::text)::date |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `affiliate_account_id -> affiliate_accounts.id`

### `ai_usage_logs`

Rows in connected DB: **39**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('ai_usage_logs_id_seq'::regclass) |
| `purpose` | character varying(50) | NO |  |
| `assessment_attempt_id` | bigint | YES |  |
| `model` | character varying(100) | YES |  |
| `input_tokens` | integer | NO | 0 |
| `output_tokens` | integer | NO | 0 |
| `total_tokens` | integer | NO | 0 |
| `question_count` | integer | NO | 0 |
| `question_ids` | jsonb | NO | '[]'::jsonb |
| `status` | character varying(20) | NO | 'DONE'::character varying |
| `error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `assessment_answers`

Rows in connected DB: **69128**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_answers_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `registration_id` | bigint | NO |  |
| `program_id` | bigint | NO |  |
| `assessment_level_id` | bigint | NO |  |
| `question_source` | character varying(10) | NO |  |
| `main_question_id` | bigint | YES |  |
| `open_question_id` | bigint | YES |  |
| `question_sequence` | smallint | YES |  |
| `question_options_order` | character varying(200) | YES |  |
| `main_option_id` | bigint | YES |  |
| `open_option_id` | bigint | YES |  |
| `answer_text` | text | YES |  |
| `answer_score` | numeric(10,2) | NO | 0 |
| `time_spent_seconds` | integer | NO | 0 |
| `is_multiple_selection` | boolean | NO | false |
| `answer_change_count` | integer | NO | 0 |
| `is_attention_fail` | boolean | NO | false |
| `is_distraction_chosen` | boolean | NO | false |
| `sincerity_flag` | smallint | YES |  |
| `status` | character varying(20) | NO | 'NOT_ANSWERED'::character varying |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `assessment_attempt_id -> assessment_attempts.id`

### `assessment_attempts`

Rows in connected DB: **1761**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_attempts_id_seq'::regclass) |
| `assessment_session_id` | bigint | NO |  |
| `user_id` | bigint | NO |  |
| `registration_id` | bigint | NO |  |
| `program_id` | bigint | NO |  |
| `unlock_at` | timestamp with time zone | YES |  |
| `expires_at` | timestamp with time zone | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `must_finish_by` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `status` | character varying(20) | NO | 'NOT_STARTED'::character varying |
| `total_score` | numeric(10,2) | YES |  |
| `max_score_snapshot` | integer | YES |  |
| `sincerity_index` | numeric(5,2) | YES |  |
| `sincerity_class` | character varying(20) | YES |  |
| `dominant_trait_id` | bigint | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `assessment_level_id` | integer | YES |  |

Primary key: `id`

Foreign keys:

- `assessment_level_id -> assessment_levels.id`
- `assessment_session_id -> assessment_sessions.id`
- `registration_id -> registrations.id`
- `user_id -> users.id`

### `assessment_levels`

Rows in connected DB: **5**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | integer | NO | nextval('assessment_levels_id_seq'::regclass) |
| `level_number` | smallint | NO |  |
| `name` | character varying(255) | NO |  |
| `description` | text | YES |  |
| `pattern_type` | character varying(50) | YES |  |
| `unlock_after_hours` | integer | NO | 0 |
| `max_score` | integer | YES |  |
| `sort_order` | smallint | NO | 0 |
| `is_mandatory` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `start_within_hours` | integer | NO | 72 |
| `duration_minutes` | integer | NO | 40 |

Primary key: `id`

### `assessment_question_options`

Rows in connected DB: **41255**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_question_options_id_seq'::regclass) |
| `question_id` | bigint | NO |  |
| `display_order` | smallint | NO | 1 |
| `option_text_en` | text | YES |  |
| `option_text_ta` | text | YES |  |
| `disc_factor` | character varying(10) | YES |  |
| `score_value` | numeric(5,2) | NO | 0.00 |
| `is_correct` | boolean | YES | false |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | NO | CURRENT_TIMESTAMP |

Primary key: `id`

Foreign keys:

- `question_id -> assessment_questions.id`

### `assessment_questions`

Rows in connected DB: **12631**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_questions_id_seq'::regclass) |
| `assessment_level_id` | bigint | NO |  |
| `program_id` | bigint | NO |  |
| `set_number` | smallint | NO |  |
| `external_code` | character varying(50) | YES |  |
| `context_text_en` | text | YES |  |
| `question_text_en` | text | YES |  |
| `context_text_ta` | text | YES |  |
| `question_text_ta` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `category` | character varying(100) | YES |  |
| `personality_trait_id` | bigint | YES |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_by_user_id` | bigint | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `board` | character varying(50) | YES |  |

Primary key: `id`

### `assessment_reports`

Rows in connected DB: **633**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_reports_id_seq'::regclass) |
| `assessment_session_id` | bigint | NO |  |
| `report_number` | character varying(150) | NO |  |
| `report_password` | character varying(150) | YES |  |
| `report_url` | text | YES |  |
| `generated_at` | timestamp with time zone | NO | now() |
| `disc_scores` | jsonb | YES |  |
| `agile_scores` | jsonb | YES |  |
| `level3_scores` | jsonb | YES |  |
| `level4_scores` | jsonb | YES |  |
| `overall_sincerity` | numeric(5,2) | YES |  |
| `dominant_trait_id` | bigint | YES |  |
| `email_sent` | boolean | NO | false |
| `email_sent_at` | timestamp with time zone | YES |  |
| `email_sent_to` | character varying(255) | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `assessment_session_id -> assessment_sessions.id`
- `dominant_trait_id -> personality_traits.id`

### `assessment_sessions`

Rows in connected DB: **868**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('assessment_sessions_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `registration_id` | bigint | NO |  |
| `program_id` | bigint | NO | '0'::bigint |
| `group_id` | bigint | YES |  |
| `status` | character varying(20) | NO | 'NOT_STARTED'::character varying |
| `valid_from` | timestamp with time zone | YES |  |
| `valid_to` | timestamp with time zone | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `is_report_ready` | boolean | NO | false |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `group_assessment_id` | bigint | YES |  |

Primary key: `id`

Foreign keys:

- `group_assessment_id -> group_assessments.id`
- `registration_id -> registrations.id`
- `user_id -> users.id`

### `corporate_accounts`

Rows in connected DB: **7**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('corporate_accounts_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `company_name` | character varying(250) | NO |  |
| `sector_code` | character varying(50) | YES |  |
| `job_title` | character varying(100) | YES |  |
| `employee_ref_id` | character varying(100) | YES |  |
| `country_code` | character varying(10) | YES |  |
| `mobile_number` | character varying(20) | YES |  |
| `total_credits` | integer | NO | 0 |
| `available_credits` | integer | NO | 0 |
| `is_active` | boolean | NO | true |
| `is_blocked` | boolean | NO | false |
| `full_name` | character varying(200) | YES |  |
| `gender` | character varying(20) | YES |  |
| `linkedin_url` | character varying | YES |  |
| `business_locations` | character varying | YES |  |
| `created_at` | timestamp without time zone | NO | now() |
| `updated_at` | timestamp without time zone | NO | now() |
| `ask_bi_enabled` | boolean | NO | false |

Primary key: `id`

Foreign keys:

- `user_id -> users.id`

### `corporate_counselling_access`

Rows in connected DB: **2**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('corporate_counselling_access_id_seq'::regclass) |
| `corporate_account_id` | bigint | NO |  |
| `counselling_type_id` | bigint | YES |  |
| `is_enabled` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |

Primary key: `id`

### `corporate_credit_ledger`

Rows in connected DB: **245**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('corporate_credit_ledger_id_seq'::regclass) |
| `corporate_account_id` | bigint | NO |  |
| `credit_delta` | integer | NO |  |
| `reason` | text | YES |  |
| `created_by_user_id` | bigint | YES |  |
| `ledger_type` | character varying(10) | YES |  |
| `per_credit_cost` | numeric(10,2) | YES |  |
| `total_amount` | numeric(10,2) | YES |  |
| `payment_status` | character varying(20) | YES | 'NA'::character varying |
| `paid_on` | timestamp without time zone | YES |  |
| `created_at` | timestamp without time zone | NO | now() |
| `razorpay_order_id` | character varying | YES |  |
| `razorpay_payment_id` | character varying | YES |  |

Primary key: `id`

Foreign keys:

- `corporate_account_id -> corporate_accounts.id`
- `created_by_user_id -> users.id`

### `counselling_question_options`

Rows in connected DB: **120**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('counselling_question_options_id_seq'::regclass) |
| `question_id` | bigint | YES |  |
| `option_text_en` | text | NO |  |
| `option_text_ta` | text | YES |  |
| `display_order` | integer | YES | 0 |
| `is_active` | boolean | YES | true |
| `is_deleted` | boolean | YES | false |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `disc_trait` | character varying(1) | YES |  |

Primary key: `id`

Foreign keys:

- `question_id -> counselling_questions.id`

### `counselling_questions`

Rows in connected DB: **30**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('counselling_questions_id_seq'::regclass) |
| `counselling_type_id` | bigint | YES |  |
| `question_text_en` | text | NO |  |
| `question_text_ta` | text | YES |  |
| `is_active` | boolean | YES | true |
| `is_deleted` | boolean | YES | false |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

Primary key: `id`

Foreign keys:

- `counselling_type_id -> counselling_types.id`

### `counselling_responses`

Rows in connected DB: **63**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('counselling_responses_id_seq'::regclass) |
| `session_id` | bigint | YES |  |
| `question_id` | bigint | YES |  |
| `selected_option_id` | bigint | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

Primary key: `id`

### `counselling_sessions`

Rows in connected DB: **4**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('counselling_sessions_id_seq'::regclass) |
| `counselling_type_id` | bigint | YES |  |
| `corporate_account_id` | bigint | YES |  |
| `mobile_number` | character varying(20) | NO |  |
| `email` | character varying(255) | YES |  |
| `access_code` | character varying(50) | YES |  |
| `is_verified` | boolean | YES | false |
| `session_token` | character varying(100) | NO |  |
| `status` | character varying(50) | YES | 'ACTIVE'::character varying |
| `student_details` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `results` | jsonb | YES | '{}'::jsonb |
| `personality_trait_id` | bigint | YES |  |
| `report_data` | jsonb | YES | '{}'::jsonb |

Primary key: `id`

Foreign keys:

- `counselling_type_id -> counselling_types.id`
- `personality_trait_id -> personality_traits.id`

### `counselling_types`

Rows in connected DB: **1**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('counselling_types_id_seq'::regclass) |
| `name` | character varying(255) | NO |  |
| `prompt` | text | YES |  |
| `course_details` | jsonb | YES | '{}'::jsonb |
| `is_active` | boolean | YES | true |
| `is_deleted` | boolean | YES | false |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `code` | character varying(50) | YES |  |

Primary key: `id`

### `degree_types`

Rows in connected DB: **11**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('degree_types_id_seq'::regclass) |
| `name` | character varying(50) | NO |  |
| `level` | character varying(20) | YES |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `department_degrees`

Rows in connected DB: **41**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('department_degrees_id_seq'::regclass) |
| `department_id` | bigint | NO |  |
| `degree_type_id` | bigint | NO |  |
| `course_duration` | smallint | NO |  |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `degree_type_id -> degree_types.id`
- `department_id -> departments.id`

### `departments`

Rows in connected DB: **30**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('departments_id_seq'::regclass) |
| `name` | text | NO |  |
| `short_name` | character varying(50) | YES |  |
| `category` | character varying(50) | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `group_assessments`

Rows in connected DB: **81**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('group_assessments_id_seq'::regclass) |
| `group_id` | bigint | NO |  |
| `program_id` | bigint | NO |  |
| `valid_from` | timestamp with time zone | YES |  |
| `valid_to` | timestamp with time zone | YES |  |
| `total_candidates` | integer | NO | 0 |
| `status` | character varying(50) | NO | 'NOT_STARTED'::character varying |
| `corporate_account_id` | bigint | YES |  |
| `reseller_account_id` | bigint | YES |  |
| `created_by_user_id` | bigint | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp without time zone | NO | now() |
| `updated_at` | timestamp without time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `group_id -> groups.id`
- `program_id -> programs.id`

### `groups`

Rows in connected DB: **16**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('groups_id_seq'::regclass) |
| `code` | character varying(100) | YES |  |
| `name` | text | NO |  |
| `corporate_account_id` | bigint | YES |  |
| `reseller_account_id` | bigint | YES |  |
| `created_by_user_id` | bigint | YES |  |
| `is_default` | boolean | NO | false |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp without time zone | NO | now() |
| `updated_at` | timestamp without time zone | NO | now() |

Primary key: `id`

### `iat_attempt_modules`

Rows in connected DB: **84**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_attempt_modules_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `registration_id` | bigint | YES |  |
| `program_id` | bigint | YES |  |
| `assessment_level_id` | bigint | YES |  |
| `module_id` | bigint | NO |  |
| `module_order` | smallint | NO |  |
| `status` | character varying(20) | NO | 'NOT_STARTED'::character varying |
| `compatible_average_ms` | numeric(10,2) | YES |  |
| `incompatible_average_ms` | numeric(10,2) | YES |  |
| `speed_gap_ms` | numeric(10,2) | YES |  |
| `pattern_label` | character varying(20) | YES |  |
| `slowest_words` | jsonb | NO | '[]'::jsonb |
| `error_words` | jsonb | NO | '[]'::jsonb |
| `error_rate` | numeric(6,2) | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `module_id -> iat_modules.id`

### `iat_intake_profiles`

Rows in connected DB: **14**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_intake_profiles_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `registration_id` | bigint | YES |  |
| `program_id` | bigint | YES |  |
| `student_name` | character varying(255) | YES |  |
| `age` | smallint | YES |  |
| `gender` | character varying(20) | YES |  |
| `hometown_tier` | character varying(30) | YES |  |
| `college_tier` | character varying(30) | YES |  |
| `undergraduate_stream` | character varying(50) | YES |  |
| `work_experience_years` | numeric(4,1) | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `iat_keypresses`

Rows in connected DB: **6040**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_keypresses_id_seq'::regclass) |
| `iat_trial_id` | bigint | NO |  |
| `assessment_attempt_id` | bigint | NO |  |
| `key_pressed` | character(1) | NO |  |
| `response_time_ms` | integer | NO |  |
| `is_correct` | boolean | NO | false |
| `event_sequence` | smallint | NO | 1 |
| `created_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `iat_trial_id -> iat_trials.id`

### `iat_modules`

Rows in connected DB: **6**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_modules_id_seq'::regclass) |
| `code` | character varying(50) | NO |  |
| `name` | character varying(150) | NO |  |
| `display_name` | character varying(150) | NO |  |
| `module_order` | smallint | NO |  |
| `left_concept_key` | character varying(50) | NO |  |
| `right_concept_key` | character varying(50) | NO |  |
| `compatible_left_keys` | jsonb | NO | '[]'::jsonb |
| `compatible_right_keys` | jsonb | NO | '[]'::jsonb |
| `incompatible_left_keys` | jsonb | NO | '[]'::jsonb |
| `incompatible_right_keys` | jsonb | NO | '[]'::jsonb |
| `slowed_on_description` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `iat_report_jobs`

Rows in connected DB: **4**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_report_jobs_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `retry_count` | integer | NO | 0 |
| `max_retries` | integer | NO | 5 |
| `next_retry_at` | timestamp with time zone | YES |  |
| `last_error` | text | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `iat_reports`

Rows in connected DB: **4**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_reports_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `registration_id` | bigint | YES |  |
| `program_id` | bigint | YES |  |
| `group_id` | bigint | YES |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `model` | character varying(100) | YES |  |
| `report_text` | text | YES |  |
| `report_input` | jsonb | NO | '{}'::jsonb |
| `bias_map` | jsonb | NO | '[]'::jsonb |
| `error` | text | YES |  |
| `generated_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `iat_stimuli`

Rows in connected DB: **120**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_stimuli_id_seq'::regclass) |
| `module_id` | bigint | NO |  |
| `concept_key` | character varying(50) | NO |  |
| `word` | text | NO |  |
| `display_order` | smallint | NO | 1 |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `module_id -> iat_modules.id`

### `iat_trials`

Rows in connected DB: **8640**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('iat_trials_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `iat_attempt_module_id` | bigint | NO |  |
| `module_id` | bigint | NO |  |
| `stimulus_id` | bigint | YES |  |
| `trial_sequence` | integer | NO |  |
| `step_number` | smallint | NO |  |
| `block_type` | character varying(30) | NO |  |
| `word_shown` | text | NO |  |
| `left_label` | text | YES |  |
| `right_label` | text | YES |  |
| `expected_key` | character(1) | NO |  |
| `first_key_pressed` | character(1) | YES |  |
| `final_key_pressed` | character(1) | YES |  |
| `is_correct` | boolean | YES |  |
| `response_time_ms` | integer | YES |  |
| `first_response_time_ms` | integer | YES |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `shown_at` | timestamp with time zone | YES |  |
| `answered_at` | timestamp with time zone | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `iat_attempt_module_id -> iat_attempt_modules.id`
- `module_id -> iat_modules.id`
- `stimulus_id -> iat_stimuli.id`

### `metaphor_answers`

Rows in connected DB: **161**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_answers_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `registration_id` | bigint | YES |  |
| `program_id` | bigint | YES |  |
| `assessment_level_id` | bigint | YES |  |
| `metaphor_question_id` | bigint | NO |  |
| `question_sequence` | smallint | YES |  |
| `spoken_language` | character varying(20) | YES |  |
| `answer_text_original` | text | YES |  |
| `answer_text_en` | text | YES |  |
| `translation_status` | character varying(20) | NO | 'NONE'::character varying |
| `status` | character varying(20) | NO | 'NOT_ANSWERED'::character varying |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `answer_text_web` | text | YES |  |
| `audio_storage_key` | character varying(300) | YES |  |
| `transcription_status` | character varying(20) | NO | 'NONE'::character varying |
| `transcription_source` | character varying(10) | YES |  |
| `transcription_error` | text | YES |  |
| `transcription_retry_count` | integer | NO | 0 |
| `transcription_next_retry_at` | timestamp with time zone | YES |  |
| `transcription_last_attempt_at` | timestamp with time zone | YES |  |

Primary key: `id`

### `metaphor_questions`

Rows in connected DB: **100**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_questions_id_seq'::regclass) |
| `set_number` | smallint | NO |  |
| `question_number` | smallint | YES |  |
| `program_id` | bigint | YES |  |
| `external_code` | character varying(50) | YES |  |
| `image_url` | character varying(500) | YES |  |
| `image_description_en` | text | YES |  |
| `image_description_ta` | text | YES |  |
| `context_text_en` | text | YES |  |
| `context_text_ta` | text | YES |  |
| `question_text_en` | text | YES |  |
| `question_text_ta` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_by_user_id` | bigint | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `metaphor_report_jobs`

Rows in connected DB: **7**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_report_jobs_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `retry_count` | integer | NO | 0 |
| `max_retries` | integer | NO | 5 |
| `next_retry_at` | timestamp with time zone | YES |  |
| `last_error` | text | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `metaphor_reports`

Rows in connected DB: **6**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_reports_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `assessment_session_id` | bigint | YES |  |
| `user_id` | bigint | YES |  |
| `registration_id` | bigint | YES |  |
| `model` | character varying(100) | YES |  |
| `markdown` | text | NO |  |
| `generated_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `metaphor_transcription_jobs`

Rows in connected DB: **6**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_transcription_jobs_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `total` | integer | NO | 0 |
| `transcribed` | integer | NO | 0 |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `metaphor_translation_jobs`

Rows in connected DB: **9**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('metaphor_translation_jobs_id_seq'::regclass) |
| `assessment_attempt_id` | bigint | NO |  |
| `status` | character varying(20) | NO | 'PENDING'::character varying |
| `total` | integer | NO | 0 |
| `translated` | integer | NO | 0 |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `notifications`

Rows in connected DB: **71**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('notifications_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `role` | character varying(20) | NO |  |
| `type` | character varying(50) | NO |  |
| `title` | character varying(255) | NO |  |
| `message` | text | NO |  |
| `is_read` | boolean | YES | false |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | YES | CURRENT_TIMESTAMP |

Primary key: `id`

### `open_question_options`

Rows in connected DB: **560**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('open_question_options_id_seq'::regclass) |
| `open_question_id` | bigint | NO |  |
| `option_type` | character varying(20) | NO |  |
| `option_text_en` | text | YES |  |
| `option_text_ta` | text | YES |  |
| `option_image_file` | character varying(255) | YES |  |
| `is_valid` | boolean | NO | false |
| `display_order` | smallint | NO | 1 |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

Foreign keys:

- `open_question_id -> open_questions.id`

### `open_questions`

Rows in connected DB: **140**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('open_questions_id_seq'::regclass) |
| `question_type` | character varying(30) | NO |  |
| `media_type` | character varying(20) | NO |  |
| `question_text_en` | text | YES |  |
| `question_text_ta` | text | YES |  |
| `audio_file` | character varying(255) | YES |  |
| `video_file` | character varying(255) | YES |  |
| `document_file` | character varying(255) | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_by_user_id` | bigint | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `set_number` | smallint | YES |  |
| `context_text_en` | text | YES |  |
| `context_text_ta` | text | YES |  |

Primary key: `id`

### `originbi_settings`

Rows in connected DB: **69**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('originbi_settings_id_seq'::regclass) |
| `category` | character varying(50) | NO |  |
| `setting_key` | character varying(100) | NO |  |
| `value_type` | character varying(20) | NO |  |
| `value_string` | text | YES |  |
| `value_boolean` | boolean | YES |  |
| `value_json` | jsonb | YES |  |
| `value_number` | numeric(15,4) | YES |  |
| `label` | character varying(200) | NO |  |
| `description` | text | YES |  |
| `is_sensitive` | boolean | NO | false |
| `is_readonly` | boolean | NO | false |
| `display_order` | smallint | NO | 0 |
| `updated_by` | character varying(100) | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `personality_traits`

Rows in connected DB: **12**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('personality_traits_id_seq'::regclass) |
| `code` | character varying(10) | NO |  |
| `blended_style_name` | character varying(100) | NO |  |
| `blended_style_desc` | text | YES |  |
| `color_rgb` | character varying(20) | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `programs`

Rows in connected DB: **7**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('programs_id_seq'::regclass) |
| `code` | character varying(50) | NO |  |
| `name` | character varying(255) | NO |  |
| `description` | text | YES |  |
| `assessment_title` | character varying(255) | YES |  |
| `report_title` | character varying(255) | YES |  |
| `is_demo` | boolean | NO | false |
| `is_active` | boolean | NO | true |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

Primary key: `id`

### `registrations`

Rows in connected DB: **878**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('registrations_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `registration_source` | character varying(20) | NO | 'SELF'::character varying |
| `created_by_user_id` | bigint | YES |  |
| `corporate_account_id` | bigint | YES |  |
| `reseller_account_id` | bigint | YES |  |
| `school_level` | character varying(20) | YES |  |
| `school_stream` | character varying(20) | YES |  |
| `department_degree_id` | bigint | YES |  |
| `group_id` | bigint | YES |  |
| `payment_required` | boolean | NO | false |
| `payment_provider` | character varying(20) | YES |  |
| `payment_reference` | character varying(100) | YES |  |
| `payment_amount` | numeric(10,2) | YES |  |
| `payment_status` | character varying(20) | NO | 'NOT_REQUIRED'::character varying |
| `payment_created_at` | timestamp with time zone | YES |  |
| `paid_at` | timestamp with time zone | YES |  |
| `status` | character varying(20) | NO | 'INCOMPLETE'::character varying |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_deleted` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `country_code` | character varying(10) | NO | '+91'::character varying |
| `mobile_number` | character varying(20) | NO |  |
| `gender` | character varying(10) | YES |  |
| `full_name` | character varying(255) | YES |  |
| `assessment_session_id` | bigint | YES |  |
| `program_id` | bigint | YES |  |
| `student_board` | character varying(20) | YES |  |
| `has_ai_counsellor` | boolean | NO | false |
| `is_tech_assessment` | smallint | YES | 0 |

Primary key: `id`

Foreign keys:

- `group_id -> groups.id`
- `program_id -> programs.id`
- `user_id -> users.id`

### `school_streams`

Rows in connected DB: **6**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | integer | NO | nextval('school_streams_id_seq'::regclass) |
| `name` | character varying(255) | NO |  |
| `short_name` | character varying(50) | NO |  |
| `vibe_description` | text | YES |  |
| `icon` | character varying(255) | YES |  |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | YES | CURRENT_TIMESTAMP |

Primary key: `id`

### `student_subscriptions`

Rows in connected DB: **0**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('student_subscriptions_id_seq'::regclass) |
| `user_id` | bigint | NO |  |
| `registration_id` | bigint | YES |  |
| `plan_type` | character varying(30) | YES | 'free'::character varying |
| `status` | character varying(20) | YES | 'active'::character varying |
| `payment_provider` | character varying(20) | YES |  |
| `payment_reference` | character varying(100) | YES |  |
| `payment_order_id` | character varying(100) | YES |  |
| `amount` | numeric(10,2) | YES | 0 |
| `currency` | character varying(10) | YES | 'INR'::character varying |
| `purchased_at` | timestamp with time zone | YES |  |
| `expires_at` | timestamp with time zone | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

Primary key: `id`

Foreign keys:

- `registration_id -> registrations.id`
- `user_id -> users.id`

### `users`

Rows in connected DB: **907**

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | bigint | NO | nextval('users_id_seq'::regclass) |
| `email_verified` | boolean | NO | false |
| `first_login_at` | timestamp with time zone | YES |  |
| `last_login_at` | timestamp with time zone | YES |  |
| `login_count` | integer | NO | 0 |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `is_active` | boolean | NO | true |
| `is_blocked` | boolean | NO | false |
| `corporate_id` | character varying | YES |  |
| `cognito_sub` | character varying | YES |  |
| `email` | character varying | YES |  |
| `role` | character varying | YES |  |
| `avatar_url` | character varying | YES |  |
| `last_login_ip` | character varying | YES |  |
| `created_at` | timestamp without time zone | NO | now() |
| `updated_at` | timestamp without time zone | NO | now() |

Primary key: `id`

## Referenced In Code But Not Present In Connected DB

These tables are referenced by entities or migrations in this repo, but were not found in the connected `public` schema, so they are not included in the structure catalog above.

- `bulk_import_rows`
- `bulk_imports`
- `corporate_bulk_import_rows`
- `corporate_bulk_imports`
- `corporate_job_skills`
- `corporate_jobs`
- `job_application_status_history`
- `job_applications`
- `user_action_logs`

## Exclusion Note

The connected database has 86 additional public tables that are not listed here because they were not found in this repository's backend entity/table declarations. This keeps the document scoped to the tables used by this project in the shared database.
