-- =====================================================================
-- Cleanup: removes the 20 seeded demo applicants created by
-- seed_corp_demo_20_users.sql (emails like seed.cor15.userNN@sriharan.me).
-- Cascades through registrations, sessions, attempts, IAT modules,
-- and metaphor answers in dependency order.
-- =====================================================================

DO $$
DECLARE
    v_user_ids BIGINT[];
    v_reg_ids  BIGINT[];
    v_sess_ids BIGINT[];
    v_att_ids  BIGINT[];
BEGIN
    SELECT array_agg(id) INTO v_user_ids
    FROM users
    WHERE email LIKE 'seed.cor15.user%@sriharan.me';

    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RAISE NOTICE 'No seeded users found, nothing to clean up';
        RETURN;
    END IF;

    SELECT array_agg(id) INTO v_reg_ids
    FROM registrations WHERE user_id = ANY(v_user_ids);

    SELECT array_agg(id) INTO v_sess_ids
    FROM assessment_sessions WHERE user_id = ANY(v_user_ids);

    SELECT array_agg(id) INTO v_att_ids
    FROM assessment_attempts WHERE user_id = ANY(v_user_ids);

    -- Detach registration -> session FK before deleting sessions
    UPDATE registrations SET assessment_session_id = NULL WHERE id = ANY(v_reg_ids);

    IF v_att_ids IS NOT NULL THEN
        DELETE FROM metaphor_answers WHERE assessment_attempt_id = ANY(v_att_ids);
        DELETE FROM iat_attempt_modules WHERE assessment_attempt_id = ANY(v_att_ids);
        DELETE FROM assessment_answers WHERE assessment_attempt_id = ANY(v_att_ids);
        DELETE FROM assessment_attempts WHERE id = ANY(v_att_ids);
    END IF;

    IF v_sess_ids IS NOT NULL THEN
        DELETE FROM assessment_sessions WHERE id = ANY(v_sess_ids);
    END IF;

    DELETE FROM registrations WHERE id = ANY(v_reg_ids);
    DELETE FROM users WHERE id = ANY(v_user_ids);

    RAISE NOTICE 'Removed % seeded applicants', array_length(v_user_ids, 1);
END$$;
