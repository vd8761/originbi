WITH RawStudentData AS (
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
		pt.color_rgb,
		ar.report_number,
		a1.group_id,
		aa.metadata,
		aa.status,
		aa.assessment_level_id,
		r.department_degree_id
	FROM assessment_attempts aa
	JOIN assessment_sessions a1 ON aa.assessment_session_id = a1.id
	JOIN registrations r ON aa.registration_id = r.id
	JOIN department_degrees dd ON r.department_degree_id = dd.id
	JOIN departments dpt ON dd.department_id = dpt.id
	JOIN degree_types dt ON dd.degree_type_id = dt.id
	JOIN groups gp ON a1.group_id = gp.id
	JOIN assessment_reports ar ON aa.assessment_session_id = ar.assessment_session_id
	LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id 
	WHERE 
		a1.group_id = 27
		AND
		r.department_degree_id = 19
		AND aa.status = 'COMPLETED'
		-- AND aa.assessment_level_id = 1
),

TotalStudents AS (
    SELECT
        trait_id,
        trait_code,
		blended_style_name,
		blended_style_desc,
        COUNT(user_id) AS total_students,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'registration_id', registration_id,
                'full_name', full_name,
                'current_year', current_year,
                'report_number', report_number
            )
        ) AS students_data,
		color_rgb
    FROM RawStudentData
    WHERE trait_code IS NOT NULL
    GROUP BY trait_id, trait_code, blended_style_name, blended_style_desc, color_rgb
    ORDER BY trait_id
)

SELECT * FROM TotalStudents;