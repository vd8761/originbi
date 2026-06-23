-- =====================================================================
-- Seed: 20 demo applicants under corporate account 15 (sri.cor1@sriharan.me)
-- Creates: users, registrations, sessions, attempts for Level 1 / 3 / 4,
--          IAT attempt modules, and minimal metaphor answers.
-- Every applicant gets varied DISC, sincerity, and IAT patterns so the
-- new cohort dashboard shows realistic spread.
--
-- Idempotency: keyed on email prefix 'seed.cor15.userNN@sriharan.me' so
-- re-running cleanly skips already-seeded rows. To rewipe, see the matching
-- cleanup file: cleanup_corp_demo_20_users.sql
-- =====================================================================

DO $$
DECLARE
    v_corp_id        BIGINT := 15;
    v_program_id     BIGINT := 3;   -- EMPLOYEE
    v_level1_id      INT    := 1;
    v_level3_id      INT    := 5;   -- level_number=3, IAT_GEN
    v_level4_id      INT    := 3;   -- level_number=4, METAPHOR
    v_now            TIMESTAMPTZ := now();

    -- Per-applicant variation arrays (length 20)
    v_first_names    TEXT[] := ARRAY[
        'Arjun','Priya','Karthik','Divya','Rohit','Meera','Vikram','Anjali','Suresh','Lakshmi',
        'Naveen','Kavya','Aravind','Pooja','Manoj','Swathi','Rahul','Deepa','Sanjay','Nisha'
    ];
    v_genders        TEXT[] := ARRAY[
        'M','F','M','F','M','F','M','F','M','F',
        'M','F','M','F','M','F','M','F','M','F'
    ];

    -- Personality trait IDs (PT table): 1=DI 2=DS 3=DC 4=ID 5=IS 6=IC
    --                                   7=SD 8=SI 9=SC 10=CD 11=CI 12=CS
    v_trait_ids      INT[] := ARRAY[
        1, 5, 1, 7, 9, 4, 1, 6, 5, 10,
        2, 11, 8, 3, 5, 1, 12, 4, 9, 7
    ];

    -- Sincerity: mostly SINCERE, some BORDERLINE, a couple NOT_SINCERE
    v_sincerity_idx  NUMERIC[] := ARRAY[
        95, 88, 72, 100, 60, 92, 45, 80, 90, 100,
        85, 70, 95, 35, 88, 100, 55, 90, 78, 92
    ];

    v_user_id        BIGINT;
    v_reg_id         BIGINT;
    v_session_id     BIGINT;
    v_l1_attempt_id  BIGINT;
    v_l3_attempt_id  BIGINT;
    v_l4_attempt_id  BIGINT;
    v_email          TEXT;
    v_full_name      TEXT;
    v_trait_id       INT;
    v_trait_code     TEXT;
    v_sincerity      NUMERIC;
    v_sincerity_cls  TEXT;
    v_disc           JSONB;
    v_disc_d         NUMERIC;
    v_disc_i         NUMERIC;
    v_disc_s         NUMERIC;
    v_disc_c         NUMERIC;
    v_meta1          JSONB;
    v_meta3          JSONB;
    v_meta4          JSONB;

    v_modules        BIGINT[];
    v_module_id      BIGINT;
    v_module_order   INT;
    v_pattern        TEXT;
    v_compat_ms      NUMERIC;
    v_incompat_ms    NUMERIC;
    v_gap_ms         NUMERIC;
    v_error_rate     NUMERIC;
    v_word_pool      TEXT[];
    v_slow_words     JSONB;
    v_err_words      JSONB;

    i                INT;
    j                INT;
BEGIN
    -- ------------------------------------------------------------------
    -- Fetch active IAT modules in order
    -- ------------------------------------------------------------------
    SELECT array_agg(id ORDER BY module_order) INTO v_modules
    FROM iat_modules
    WHERE is_active = true AND is_deleted = false;

    IF v_modules IS NULL OR array_length(v_modules, 1) = 0 THEN
        RAISE EXCEPTION 'No active IAT modules found';
    END IF;

    -- ------------------------------------------------------------------
    -- Loop 20 applicants
    -- ------------------------------------------------------------------
    FOR i IN 1..20 LOOP
        v_email := format('seed.cor15.user%s@sriharan.me', lpad(i::text, 2, '0'));
        v_full_name := v_first_names[i] || ' Demo' || lpad(i::text, 2, '0');
        v_trait_id := v_trait_ids[i];
        v_sincerity := v_sincerity_idx[i];
        v_sincerity_cls := CASE
            WHEN v_sincerity >= 80 THEN 'SINCERE'
            WHEN v_sincerity >= 50 THEN 'BORDERLINE'
            ELSE 'NOT_SINCERE'
        END;

        SELECT code INTO v_trait_code FROM personality_traits WHERE id = v_trait_id;

        -- Skip if already seeded
        IF EXISTS (SELECT 1 FROM users WHERE email = v_email) THEN
            RAISE NOTICE 'User % already exists, skipping', v_email;
            CONTINUE;
        END IF;

        -- ----------------------------------------------------
        -- 1. user
        -- ----------------------------------------------------
        INSERT INTO users (
            email, email_verified, role, is_active, is_blocked,
            login_count, metadata, created_at, updated_at
        ) VALUES (
            v_email, true, 'CANDIDATE', true, false,
            0, '{}'::jsonb,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_user_id;

        -- ----------------------------------------------------
        -- 2. registration
        -- ----------------------------------------------------
        INSERT INTO registrations (
            user_id, registration_source, corporate_account_id,
            payment_required, payment_status, status, metadata,
            is_deleted, country_code, mobile_number, gender, full_name,
            program_id, is_tech_assessment, has_ai_counsellor,
            created_at, updated_at
        ) VALUES (
            v_user_id, 'CORPORATE', v_corp_id,
            false, 'NOT_REQUIRED', 'COMPLETED', '{}'::jsonb,
            false, '+91', '9' || lpad((900000000 + i * 13)::text, 9, '0'),
            v_genders[i], v_full_name,
            v_program_id, 0, false,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_reg_id;

        -- ----------------------------------------------------
        -- 3. assessment_session
        -- ----------------------------------------------------
        INSERT INTO assessment_sessions (
            user_id, registration_id, program_id, status,
            valid_from, valid_to, started_at, completed_at,
            is_report_ready, metadata, created_at, updated_at
        ) VALUES (
            v_user_id, v_reg_id, v_program_id, 'COMPLETED',
            v_now - (i || ' days')::interval,
            v_now + '7 days'::interval,
            v_now - (i || ' days')::interval + '1 hour'::interval,
            v_now - (i || ' days')::interval + '2 hours'::interval,
            true, '{}'::jsonb,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_session_id;

        UPDATE registrations SET assessment_session_id = v_session_id WHERE id = v_reg_id;

        -- ----------------------------------------------------
        -- 4. Level 1 (DISC) attempt
        -- ----------------------------------------------------
        -- Build DISC scores: dominant letter gets highest, second letter next,
        -- others scattered lower. v_trait_code is two letters like 'DI'.
        v_disc_d := 5 + (random() * 4)::int;
        v_disc_i := 5 + (random() * 4)::int;
        v_disc_s := 5 + (random() * 4)::int;
        v_disc_c := 5 + (random() * 4)::int;

        IF substring(v_trait_code, 1, 1) = 'D' THEN v_disc_d := 22 + (random() * 6)::int;
        ELSIF substring(v_trait_code, 1, 1) = 'I' THEN v_disc_i := 22 + (random() * 6)::int;
        ELSIF substring(v_trait_code, 1, 1) = 'S' THEN v_disc_s := 22 + (random() * 6)::int;
        ELSIF substring(v_trait_code, 1, 1) = 'C' THEN v_disc_c := 22 + (random() * 6)::int;
        END IF;

        IF substring(v_trait_code, 2, 1) = 'D' THEN v_disc_d := 15 + (random() * 5)::int;
        ELSIF substring(v_trait_code, 2, 1) = 'I' THEN v_disc_i := 15 + (random() * 5)::int;
        ELSIF substring(v_trait_code, 2, 1) = 'S' THEN v_disc_s := 15 + (random() * 5)::int;
        ELSIF substring(v_trait_code, 2, 1) = 'C' THEN v_disc_c := 15 + (random() * 5)::int;
        END IF;

        v_disc := jsonb_build_object(
            'D', v_disc_d,
            'I', v_disc_i,
            'S', v_disc_s,
            'C', v_disc_c,
            'total', v_disc_d + v_disc_i + v_disc_s + v_disc_c
        );
        v_meta1 := jsonb_build_object(
            'disc_scores', v_disc,
            'overall_sincerity', v_sincerity
        );

        INSERT INTO assessment_attempts (
            assessment_session_id, user_id, registration_id, program_id,
            unlock_at, expires_at, started_at, must_finish_by, completed_at,
            status, total_score, max_score_snapshot,
            sincerity_index, sincerity_class, dominant_trait_id,
            metadata, assessment_level_id, created_at, updated_at
        ) VALUES (
            v_session_id, v_user_id, v_reg_id, v_program_id,
            v_now - (i || ' days')::interval,
            v_now + '7 days'::interval,
            v_now - (i || ' days')::interval + '1 hour'::interval,
            v_now + '2 days'::interval,
            v_now - (i || ' days')::interval + '1 hour 25 min'::interval,
            'COMPLETED',
            v_disc_d + v_disc_i + v_disc_s + v_disc_c, 100,
            v_sincerity, v_sincerity_cls, v_trait_id,
            v_meta1, v_level1_id,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_l1_attempt_id;

        -- ----------------------------------------------------
        -- 5. Level 3 (IAT Gen) attempt
        -- ----------------------------------------------------
        v_meta3 := jsonb_build_object(
            'assessment_kind', 'IAT_GEN',
            'overall_sincerity', v_sincerity
        );

        INSERT INTO assessment_attempts (
            assessment_session_id, user_id, registration_id, program_id,
            unlock_at, expires_at, started_at, must_finish_by, completed_at,
            status, total_score, max_score_snapshot,
            sincerity_index, sincerity_class,
            metadata, assessment_level_id, created_at, updated_at
        ) VALUES (
            v_session_id, v_user_id, v_reg_id, v_program_id,
            v_now - (i || ' days')::interval,
            v_now + '7 days'::interval,
            v_now - (i || ' days')::interval + '1 hour 30 min'::interval,
            v_now + '2 days'::interval,
            v_now - (i || ' days')::interval + '1 hour 55 min'::interval,
            'COMPLETED',
            0, 0,
            v_sincerity, v_sincerity_cls,
            v_meta3, v_level3_id,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_l3_attempt_id;

        -- For each of the 12 modules, create one iat_attempt_module
        v_module_order := 0;
        FOREACH v_module_id IN ARRAY v_modules LOOP
            v_module_order := v_module_order + 1;

            -- Vary pattern based on (i, module_order) so different modules
            -- show different group leans, but with some realism
            v_pattern := CASE ((i + v_module_order * 3) % 10)
                WHEN 0 THEN 'strong'
                WHEN 1 THEN 'strong'
                WHEN 2 THEN 'moderate'
                WHEN 3 THEN 'moderate'
                WHEN 4 THEN 'moderate'
                WHEN 5 THEN 'low'
                WHEN 6 THEN 'low'
                WHEN 7 THEN 'low'
                WHEN 8 THEN 'low'
                ELSE        'low'
            END;

            -- realistic ms values per pattern
            v_compat_ms := 450 + (random() * 150)::int;
            IF v_pattern = 'strong' THEN
                v_incompat_ms := v_compat_ms + 350 + (random() * 200)::int;
            ELSIF v_pattern = 'moderate' THEN
                v_incompat_ms := v_compat_ms + 180 + (random() * 100)::int;
            ELSE
                v_incompat_ms := v_compat_ms + (random() * 120)::int;
            END IF;
            v_gap_ms := v_incompat_ms - v_compat_ms;

            -- error rate: noisy candidate flag for some
            v_error_rate := CASE
                WHEN v_sincerity_cls = 'NOT_SINCERE' THEN 30 + (random() * 25)::int
                WHEN v_sincerity_cls = 'BORDERLINE' THEN 12 + (random() * 15)::int
                ELSE 3 + (random() * 10)::int
            END;

            -- pull friendly stumble-word pool per module
            v_word_pool := CASE v_module_order
                WHEN 1  THEN ARRAY['elder','junior','senior','novice','veteran','intern','head','trainee']
                WHEN 2  THEN ARRAY['urban','rural','metro','village','local','outsider','native','immigrant']
                WHEN 3  THEN ARRAY['nurse','engineer','homemaker','founder','manager','assistant','executive','intern']
                WHEN 4  THEN ARRAY['articulate','soft-spoken','loud','quiet','clear','mumbled','fluent','halting']
                WHEN 5  THEN ARRAY['trust','fear','open','guarded','honest','reserved','safe','tense']
                WHEN 6  THEN ARRAY['Iyer','Khan','Singh','Pillai','Sharma','Das','Rao','Kumar']
                WHEN 7  THEN ARRAY['leader','follower','assertive','timid','visionary','reactive','bold','passive']
                WHEN 8  THEN ARRAY['rockstar','underperformer','reliable','flaky','consistent','volatile','stellar','mediocre']
                WHEN 9  THEN ARRAY['diverse','homogeneous','inclusive','exclusive','varied','uniform','open','closed']
                WHEN 10 THEN ARRAY['direct','indirect','formal','casual','assertive','soft','plain','elaborate']
                WHEN 11 THEN ARRAY['obedient','rebellious','compliant','defiant','respectful','challenging','agreeable','disruptive']
                ELSE         ARRAY['innovate','conserve','disrupt','maintain','adapt','resist','reinvent','preserve']
            END;

            -- 2 random slow words, 1 random error word
            v_slow_words := to_jsonb(ARRAY[
                v_word_pool[1 + (random() * (array_length(v_word_pool,1)-1))::int],
                v_word_pool[1 + (random() * (array_length(v_word_pool,1)-1))::int]
            ]);
            v_err_words := to_jsonb(ARRAY[
                v_word_pool[1 + (random() * (array_length(v_word_pool,1)-1))::int]
            ]);

            INSERT INTO iat_attempt_modules (
                assessment_attempt_id, assessment_session_id, user_id,
                registration_id, program_id, assessment_level_id,
                module_id, module_order, status,
                compatible_average_ms, incompatible_average_ms, speed_gap_ms,
                pattern_label, slowest_words, error_words, error_rate,
                started_at, completed_at, metadata, created_at, updated_at
            ) VALUES (
                v_l3_attempt_id, v_session_id, v_user_id,
                v_reg_id, v_program_id, v_level3_id,
                v_module_id, v_module_order, 'COMPLETED',
                v_compat_ms, v_incompat_ms, v_gap_ms,
                v_pattern, v_slow_words, v_err_words, v_error_rate,
                v_now - (i || ' days')::interval + '1 hour 30 min'::interval,
                v_now - (i || ' days')::interval + '1 hour 32 min'::interval,
                '{}'::jsonb,
                v_now - (i || ' days')::interval,
                v_now - (i || ' days')::interval
            );
        END LOOP;

        -- ----------------------------------------------------
        -- 6. Level 4 (Metaphor) attempt
        -- ----------------------------------------------------
        v_meta4 := jsonb_build_object(
            'level4_scores', jsonb_build_object('answered', 4, 'total', 4),
            'overall_sincerity', v_sincerity
        );

        INSERT INTO assessment_attempts (
            assessment_session_id, user_id, registration_id, program_id,
            unlock_at, expires_at, started_at, must_finish_by, completed_at,
            status, total_score, max_score_snapshot,
            sincerity_index, sincerity_class,
            metadata, assessment_level_id, created_at, updated_at
        ) VALUES (
            v_session_id, v_user_id, v_reg_id, v_program_id,
            v_now - (i || ' days')::interval,
            v_now + '7 days'::interval,
            v_now - (i || ' days')::interval + '2 hours'::interval,
            v_now + '2 days'::interval,
            v_now - (i || ' days')::interval + '2 hours 20 min'::interval,
            'COMPLETED',
            0, 0,
            v_sincerity, v_sincerity_cls,
            v_meta4, v_level4_id,
            v_now - (i || ' days')::interval,
            v_now - (i || ' days')::interval
        )
        RETURNING id INTO v_l4_attempt_id;

        -- Minimal metaphor answers (first 4 questions)
        FOR j IN 1..4 LOOP
            INSERT INTO metaphor_answers (
                assessment_attempt_id, assessment_session_id, user_id,
                registration_id, program_id, assessment_level_id,
                metaphor_question_id, question_sequence,
                spoken_language, answer_text_original, answer_text_en,
                translation_status, status, created_at, updated_at
            )
            SELECT
                v_l4_attempt_id, v_session_id, v_user_id,
                v_reg_id, v_program_id, v_level4_id,
                mq.id, j,
                'en',
                'I feel that the moment captured here speaks to ambition and quiet resolve.',
                'I feel that the moment captured here speaks to ambition and quiet resolve.',
                'DONE', 'ANSWERED',
                v_now - (i || ' days')::interval,
                v_now - (i || ' days')::interval
            FROM metaphor_questions mq
            WHERE mq.is_active = true AND mq.is_deleted = false
              AND mq.set_number = 1 AND mq.question_number = j
            LIMIT 1;
        END LOOP;

        RAISE NOTICE 'Seeded applicant % (% / %)', i, v_full_name, v_email;
    END LOOP;

    RAISE NOTICE 'Seed complete';
END$$;
