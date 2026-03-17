WITH
    duplicated_sessions AS (
        SELECT a.user_id, a.assessment_session_id, COUNT(*) AS total_rows, COUNT(*) / 25 AS factor
        FROM public.assessment_answers a
            JOIN public.assessment_sessions s ON a.assessment_session_id = s.id
        WHERE
            s.group_id = '28'
            AND a.assessment_level_id = 2
        GROUP BY
            a.user_id,
            a.assessment_session_id
        HAVING
            COUNT(*) > 25
    )
SELECT ds.user_id, ds.total_rows, ds.factor,

-- Focus
(
    att.metadata -> 'agile_scores' ->> 'Focus'
)::numeric AS focus_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'Focus'
    )::numeric / ds.factor
) AS focus_new,

-- Courage
(
    att.metadata -> 'agile_scores' ->> 'Courage'
)::numeric AS courage_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'Courage'
    )::numeric / ds.factor
) AS courage_new,

-- Respect
(
    att.metadata -> 'agile_scores' ->> 'Respect'
)::numeric AS respect_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'Respect'
    )::numeric / ds.factor
) AS respect_new,

-- Openness
(
    att.metadata -> 'agile_scores' ->> 'Openness'
)::numeric AS openness_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'Openness'
    )::numeric / ds.factor
) AS openness_new,

-- Commitment
(
    att.metadata -> 'agile_scores' ->> 'Commitment'
)::numeric AS commitment_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'Commitment'
    )::numeric / ds.factor
) AS commitment_new,

-- Total
(
    att.metadata -> 'agile_scores' ->> 'total'
)::numeric AS total_old,
ROUND(
    (
        att.metadata -> 'agile_scores' ->> 'total'
    )::numeric / ds.factor
) AS total_new
FROM
    duplicated_sessions ds
    JOIN public.assessment_attempts att ON att.user_id = ds.user_id
    AND att.assessment_session_id = ds.assessment_session_id
WHERE
    att.assessment_level_id = 2;