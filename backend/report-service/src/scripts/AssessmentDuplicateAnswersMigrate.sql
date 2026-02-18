WITH
    duplicated_sessions AS (
        -- 1. IDENTIFY TARGETS (With Safety Check)
        SELECT a.user_id, a.assessment_session_id, COUNT(*) / 25 AS factor
        FROM public.assessment_answers a
            JOIN public.assessment_sessions s ON a.assessment_session_id = s.id
            -- Join attempts specifically to check if we already fixed this one
            JOIN public.assessment_attempts att ON a.assessment_session_id = att.assessment_session_id
            AND a.user_id = att.user_id
            AND att.assessment_level_id = 2
        WHERE
            s.group_id = '28'
            AND a.assessment_level_id = 2
            -- THIS IS THE GUARD: If flag exists and is true, skip this row!
            AND (
                att.metadata ->> 'scoreDuplicateFix'
            ) IS DISTINCT FROM 'true'
        GROUP BY
            a.user_id,
            a.assessment_session_id
        HAVING
            COUNT(*) > 25
    ),
    update_attempts AS (
        -- 2. UPDATE ATTEMPTS (Injecting Flag into Metadata Root)
        UPDATE public.assessment_attempts att
        SET
            metadata = jsonb_set(
                metadata,
                '{agile_scores}',
                jsonb_build_object(
                    'total',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'total'
                        )::numeric / ds.factor
                    ),
                    'Focus',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'Focus'
                        )::numeric / ds.factor
                    ),
                    'Courage',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'Courage'
                        )::numeric / ds.factor
                    ),
                    'Respect',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'Respect'
                        )::numeric / ds.factor
                    ),
                    'Openness',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'Openness'
                        )::numeric / ds.factor
                    ),
                    'Commitment',
                    ROUND(
                        (
                            metadata -> 'agile_scores' ->> 'Commitment'
                        )::numeric / ds.factor
                    )
                )
            ) || '{"scoreDuplicateFix": true}'::jsonb -- <--- ADDS FLAG TO ROOT
        FROM duplicated_sessions ds
        WHERE
            att.user_id = ds.user_id
            AND att.assessment_session_id = ds.assessment_session_id
            AND att.assessment_level_id = 2
        RETURNING
            att.assessment_session_id
    )

-- 3. UPDATE REPORTS (Injecting Flag into agile_scores Object)
UPDATE public.assessment_reports rep
SET
    agile_scores = jsonb_build_object(
        'total',
        ROUND(
            (agile_scores ->> 'total')::numeric / ds.factor
        ),
        'Focus',
        ROUND(
            (agile_scores ->> 'Focus')::numeric / ds.factor
        ),
        'Courage',
        ROUND(
            (agile_scores ->> 'Courage')::numeric / ds.factor
        ),
        'Respect',
        ROUND(
            (agile_scores ->> 'Respect')::numeric / ds.factor
        ),
        'Openness',
        ROUND(
            (agile_scores ->> 'Openness')::numeric / ds.factor
        ),
        'Commitment',
        ROUND(
            (agile_scores ->> 'Commitment')::numeric / ds.factor
        )
    ) || '{"scoreDuplicateFix": true}'::jsonb -- <--- ADDS FLAG TO OBJECT
FROM duplicated_sessions ds
WHERE
    rep.assessment_session_id = ds.assessment_session_id;