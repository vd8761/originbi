WITH
    DuplicateCheck AS (
        SELECT full_name, department_degree_id
        FROM registrations
        WHERE
            department_degree_id = 3
        GROUP BY
            full_name,
            department_degree_id
        HAVING
            COUNT(*) > 1
    ),
    RawStudentData AS (
        SELECT
            aa.user_id,
            dpt.name AS "department_name",
            dt.name AS "degree_type",
            a1.started_at,
            gp.name AS "group_name",
            pt.code AS "trait_code",
            pt.id AS "trait_id",
            pt.blended_style_name,
            pt.blended_style_desc,
            aa.registration_id,
            r.full_name,
            r.metadata ->> 'currentYear' as "current_year",
            r.mobile_number,
            pt.color_rgb,
            ar.report_number,
            ar.agile_scores,
            a1.group_id,
            aa.metadata,
            aa.status,
            aa.assessment_level_id,
            r.department_degree_id,
            dpt.id AS department_id,
            dt.id AS degree_type_id,
            -- Check against the duplicate list
            CASE
                WHEN dc.full_name IS NOT NULL THEN true
                ELSE false
            END AS is_duplicate_name
        FROM
            assessment_attempts aa
            JOIN assessment_sessions a1 ON aa.assessment_session_id = a1.id
            JOIN registrations r ON aa.registration_id = r.id
            JOIN department_degrees dd ON r.department_degree_id = dd.id
            JOIN departments dpt ON dd.department_id = dpt.id
            JOIN degree_types dt ON dd.degree_type_id = dt.id
            JOIN groups gp ON a1.group_id = gp.id
            JOIN assessment_reports ar ON aa.assessment_session_id = ar.assessment_session_id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            LEFT JOIN DuplicateCheck dc ON r.full_name = dc.full_name
            AND r.department_degree_id = dc.department_degree_id
        WHERE
            a1.group_id = 26
            AND r.department_degree_id = 3
            AND aa.status = 'COMPLETED'
    ),
    TraitGrouped AS (
        SELECT
            trait_id,
            trait_code,
            blended_style_name,
            blended_style_desc,
            color_rgb,
            COUNT(user_id) AS trait_student_count,
            JSON_AGG(
                CASE
                    WHEN is_duplicate_name IS TRUE THEN JSON_BUILD_OBJECT(
                        'registration_ID',
                        registration_id,
                        'full_name',
                        full_name,
                        'college_year',
                        current_year,
                        'student_exam_ref_no',
                        report_number,
                        'duplicate_name',
                        true,
                        'mobile_number',
                        mobile_number,
                        'agile_score',
                        agile_scores -- << CHANGED: Added agile_score to JSON object
                    )
                    ELSE JSON_BUILD_OBJECT(
                        'registration_ID',
                        registration_id,
                        'full_name',
                        full_name,
                        'college_year',
                        current_year,
                        'student_exam_ref_no',
                        report_number,
                        'agile_score',
                        agile_scores -- << CHANGED: Added agile_score to JSON object
                    )
                END
            ) AS students_data,
            MAX(department_name) as department_name,
            MAX(degree_type) as degree_type,
            MAX(started_at) as exam_start_date,
            MAX(group_name) as group_name,
            MAX(report_number) as report_number,
            MAX(department_id) as department_id,
            MAX(degree_type_id) as degree_type_id,
            MAX(department_degree_id) as department_deg_id
        FROM RawStudentData
        WHERE
            trait_code IS NOT NULL
        GROUP BY
            trait_id,
            trait_code,
            blended_style_name,
            blended_style_desc,
            color_rgb
    )
SELECT JSON_BUILD_OBJECT(
        'department_name', MAX(department_name), 'degree_type', MAX(degree_type), 'exam_start_date', MAX(exam_start_date), 'total_students', COALESCE(SUM(trait_student_count), 0), 'group_name', MAX(group_name), 'report_title', CONCAT(
            'Students Handbook ', EXTRACT(
                YEAR
                FROM MAX(exam_start_date)
            )
        ), 'exam_ref_no', MAX(report_number), 'department_id', MAX(department_id), 'degree_type_id', MAX(degree_type_id), 'department_deg_id', MAX(department_deg_id), 'trait_distribution', COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'trait_ID', trait_id, 'trait_code', trait_code, 'blended_style_name', blended_style_name, 'blended_style_desc', blended_style_desc, 'student_count', trait_student_count, 'students_data', students_data, 'color_rgb', string_to_array(color_rgb, ',')::int[]
                )
            ) FILTER (
                WHERE
                    trait_id IS NOT NULL
            ), '[]'
        )
    ) AS final_json_output
FROM TraitGrouped;