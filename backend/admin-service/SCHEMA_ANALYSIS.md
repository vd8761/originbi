# DATABASE SCHEMA ANALYSIS

## Tables Found

### assessment_answers (85 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| assessment_attempt_id | bigint | NO |
| assessment_session_id | bigint | NO |
| user_id | bigint | NO |
| registration_id | bigint | NO |
| program_id | bigint | NO |
| assessment_level_id | bigint | NO |
| question_source | character varying | NO |
| main_question_id | bigint | YES |
| open_question_id | bigint | YES |
| question_sequence | smallint | YES |
| question_options_order | character varying | YES |
| main_option_id | bigint | YES |
| open_option_id | bigint | YES |
| answer_text | text | YES |
| answer_score | numeric | NO |
| time_spent_seconds | integer | NO |
| is_multiple_selection | boolean | NO |
| answer_change_count | integer | NO |
| is_attention_fail | boolean | NO |
| is_distraction_chosen | boolean | NO |
| sincerity_flag | smallint | YES |
| status | character varying | NO |
| metadata | jsonb | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### assessment_attempts (2 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| assessment_session_id | bigint | NO |
| user_id | bigint | NO |
| registration_id | bigint | NO |
| program_id | bigint | NO |
| unlock_at | timestamp with time zone | YES |
| expires_at | timestamp with time zone | YES |
| started_at | timestamp with time zone | YES |
| must_finish_by | timestamp with time zone | YES |
| completed_at | timestamp with time zone | YES |
| status | character varying | NO |
| total_score | numeric | YES |
| max_score_snapshot | integer | YES |
| sincerity_index | numeric | YES |
| sincerity_class | character varying | YES |
| dominant_trait_id | bigint | YES |
| metadata | jsonb | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |
| assessment_level_id | integer | YES |

### assessment_levels (4 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | integer | NO |
| level_number | smallint | NO |
| name | character varying | NO |
| description | text | YES |
| pattern_type | character varying | YES |
| unlock_after_hours | integer | NO |
| max_score | integer | YES |
| sort_order | smallint | NO |
| is_mandatory | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |
| start_within_hours | integer | NO |
| duration_minutes | integer | NO |

### assessment_question_options (1860 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| question_id | bigint | NO |
| display_order | smallint | NO |
| option_text_en | text | YES |
| option_text_ta | text | YES |
| disc_factor | character varying | YES |
| score_value | numeric | NO |
| is_correct | boolean | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### assessment_questions (540 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| assessment_level_id | bigint | NO |
| program_id | bigint | NO |
| set_number | smallint | NO |
| external_code | character varying | YES |
| context_text_en | text | YES |
| question_text_en | text | YES |
| context_text_ta | text | YES |
| question_text_ta | text | YES |
| metadata | jsonb | NO |
| category | character varying | YES |
| personality_trait_id | bigint | YES |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_by_user_id | bigint | YES |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### assessment_reports (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| assessment_session_id | bigint | NO |
| report_number | character varying | NO |
| report_password | character varying | YES |
| report_url | text | YES |
| generated_at | timestamp with time zone | NO |
| disc_scores | jsonb | YES |
| agile_scores | jsonb | YES |
| level3_scores | jsonb | YES |
| level4_scores | jsonb | YES |
| overall_sincerity | numeric | YES |
| dominant_trait_id | bigint | YES |
| email_sent | boolean | NO |
| email_sent_at | timestamp with time zone | YES |
| email_sent_to | character varying | YES |
| metadata | jsonb | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### assessment_sessions (1 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| user_id | bigint | NO |
| registration_id | bigint | NO |
| program_id | bigint | NO |
| group_id | bigint | YES |
| status | character varying | NO |
| valid_from | timestamp with time zone | YES |
| valid_to | timestamp with time zone | YES |
| started_at | timestamp with time zone | YES |
| completed_at | timestamp with time zone | YES |
| is_report_ready | boolean | NO |
| metadata | jsonb | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |
| group_assessment_id | bigint | YES |

### bulk_import_rows (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| import_id | uuid | NO |
| row_index | integer | NO |
| raw_data | jsonb | YES |
| normalized_data | jsonb | YES |
| status | character varying | NO |
| result_type | character varying | YES |
| error_message | text | YES |
| group_match_score | integer | YES |
| matched_group_id | bigint | YES |
| overridden | boolean | NO |
| override_data | jsonb | YES |

### bulk_imports (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| created_by | bigint | YES |
| filename | character varying | YES |
| total_records | integer | NO |
| processed_count | integer | NO |
| status | character varying | NO |
| validation_version | character varying | NO |
| created_at | timestamp with time zone | NO |
| completed_at | timestamp with time zone | YES |

### career_role_guidance_sections (1068 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| career_role_id | bigint | NO |
| section_content | jsonb | NO |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### career_role_tools (5515 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| career_role_id | bigint | NO |
| tool_name | character varying | NO |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### career_roles (1068 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| department_degree_id | bigint | NO |
| trait_id | bigint | NO |
| career_role_name | character varying | NO |
| short_description | text | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### corporate_accounts (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| user_id | bigint | NO |
| company_name | character varying | NO |
| sector_code | character varying | YES |
| job_title | character varying | YES |
| employee_ref_id | character varying | YES |
| country_code | character varying | YES |
| mobile_number | character varying | YES |
| total_credits | integer | NO |
| available_credits | integer | NO |
| is_active | boolean | NO |
| is_blocked | boolean | NO |
| full_name | character varying | YES |
| gender | character varying | YES |
| linkedin_url | character varying | YES |
| business_locations | character varying | YES |
| created_at | timestamp without time zone | NO |
| updated_at | timestamp without time zone | NO |

### corporate_bulk_import_rows (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| import_id | uuid | NO |
| row_index | integer | NO |
| raw_data | jsonb | YES |
| normalized_data | jsonb | YES |
| status | character varying | NO |
| error_message | text | YES |
| result_type | character varying | YES |
| group_match_score | integer | YES |
| matched_group_id | bigint | YES |
| overridden | boolean | NO |
| override_data | jsonb | YES |

### corporate_bulk_imports (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| created_by | bigint | YES |
| filename | character varying | YES |
| total_records | integer | NO |
| processed_count | integer | NO |
| status | character varying | NO |
| created_at | timestamp with time zone | NO |
| completed_at | timestamp with time zone | YES |

### corporate_credit_ledger (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| corporate_account_id | bigint | NO |
| credit_delta | integer | NO |
| reason | text | YES |
| created_by_user_id | bigint | YES |
| ledger_type | character varying | YES |
| per_credit_cost | numeric | YES |
| total_amount | numeric | YES |
| payment_status | character varying | YES |
| paid_on | timestamp without time zone | YES |
| created_at | timestamp without time zone | NO |
| razorpay_order_id | character varying | YES |
| razorpay_payment_id | character varying | YES |

### degree_types (6 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| name | character varying | NO |
| level | character varying | YES |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### department_degrees (23 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| department_id | bigint | NO |
| degree_type_id | bigint | NO |
| course_duration | smallint | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### departments (12 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| name | text | NO |
| short_name | character varying | YES |
| category | character varying | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### group_assessments (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| group_id | bigint | NO |
| program_id | bigint | NO |
| valid_from | timestamp with time zone | YES |
| valid_to | timestamp with time zone | YES |
| total_candidates | integer | NO |
| status | character varying | NO |
| corporate_account_id | bigint | YES |
| reseller_account_id | bigint | YES |
| created_by_user_id | bigint | YES |
| metadata | jsonb | NO |
| created_at | timestamp without time zone | NO |
| updated_at | timestamp without time zone | NO |

### groups (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| code | character varying | YES |
| name | text | NO |
| corporate_account_id | bigint | YES |
| reseller_account_id | bigint | YES |
| created_by_user_id | bigint | YES |
| is_default | boolean | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| metadata | jsonb | NO |
| created_at | timestamp without time zone | NO |
| updated_at | timestamp without time zone | NO |

### open_question_images (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| open_question_id | bigint | NO |
| image_file | character varying | NO |
| display_order | smallint | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### open_question_options (160 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| open_question_id | bigint | NO |
| option_type | character varying | NO |
| option_text_en | text | YES |
| option_text_ta | text | YES |
| option_image_file | character varying | YES |
| is_valid | boolean | NO |
| display_order | smallint | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### open_questions (40 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| question_type | character varying | NO |
| media_type | character varying | NO |
| question_text_en | text | YES |
| question_text_ta | text | YES |
| audio_file | character varying | YES |
| video_file | character varying | YES |
| document_file | character varying | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_by_user_id | bigint | YES |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### personality_traits (12 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| code | character varying | NO |
| blended_style_name | character varying | NO |
| blended_style_desc | text | YES |
| color_rgb | character varying | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### programs (6 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| code | character varying | NO |
| name | character varying | NO |
| description | text | YES |
| assessment_title | character varying | YES |
| report_title | character varying | YES |
| is_demo | boolean | NO |
| is_active | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### rag_documents (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | integer | NO |
| content | text | NO |
| metadata | jsonb | YES |
| category | character varying | YES |
| source_table | character varying | YES |
| source_id | bigint | YES |
| created_at | timestamp with time zone | YES |
| updated_at | timestamp with time zone | YES |

### rag_embeddings (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | integer | NO |
| document_id | integer | YES |
| embedding | USER-DEFINED | YES |
| model | character varying | YES |
| created_at | timestamp with time zone | YES |

### registrations (1 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| user_id | bigint | NO |
| registration_source | character varying | NO |
| created_by_user_id | bigint | YES |
| corporate_account_id | bigint | YES |
| reseller_account_id | bigint | YES |
| school_level | character varying | YES |
| school_stream | character varying | YES |
| department_degree_id | bigint | YES |
| group_id | bigint | YES |
| payment_required | boolean | NO |
| payment_provider | character varying | YES |
| payment_reference | character varying | YES |
| payment_amount | numeric | YES |
| payment_status | character varying | NO |
| payment_created_at | timestamp with time zone | YES |
| paid_at | timestamp with time zone | YES |
| status | character varying | NO |
| metadata | jsonb | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |
| country_code | character varying | NO |
| mobile_number | character varying | NO |
| gender | character varying | YES |
| full_name | character varying | YES |
| program_id | bigint | YES |
| assessment_session_id | bigint | YES |

### reseller_accounts (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| user_id | bigint | NO |
| reseller_name | character varying | NO |
| sector_code | character varying | YES |
| business_locations | text | YES |
| job_title | character varying | YES |
| employee_ref_id | character varying | YES |
| linkedin_url | character varying | YES |
| country_code | character varying | NO |
| mobile_number | character varying | NO |
| total_credits | integer | NO |
| available_credits | integer | NO |
| is_active | boolean | NO |
| is_blocked | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### reseller_credit_ledger (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| reseller_account_id | bigint | NO |
| credit_delta | integer | NO |
| reason | text | YES |
| created_by_user_id | bigint | YES |
| created_at | timestamp with time zone | NO |

### trait_based_course_details (470 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| school_level_id | smallint | NO |
| school_stream_id | smallint | NO |
| trait_id | bigint | NO |
| course_name | text | NO |
| compatibility_percentage | numeric | NO |
| notes | text | YES |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_deleted | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### user_action_logs (0 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| attempt_count | integer | NO |
| action_date | date | NO |
| user_id | bigint | NO |
| created_at | timestamp without time zone | NO |
| updated_at | timestamp without time zone | NO |
| registration_id | character varying | YES |
| role | USER-DEFINED | YES |
| action_type | USER-DEFINED | NO |

### users (2 rows)
| Column | Type | Nullable |
|--------|------|----------|
| id | bigint | NO |
| email_verified | boolean | NO |
| first_login_at | timestamp with time zone | YES |
| last_login_at | timestamp with time zone | YES |
| login_count | integer | NO |
| metadata | jsonb | NO |
| is_active | boolean | NO |
| is_blocked | boolean | NO |
| corporate_id | character varying | YES |
| cognito_sub | character varying | YES |
| email | character varying | YES |
| role | character varying | YES |
| avatar_url | character varying | YES |
| last_login_ip | character varying | YES |
| created_at | timestamp without time zone | NO |
| updated_at | timestamp without time zone | NO |

