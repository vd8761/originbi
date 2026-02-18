import { Pool } from "pg";
import { PlacementData } from "../types/placementTypes";

import { logger } from "./logger";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
});

interface GuidanceSectionJSON {
    title: string;
    content: string | GuidanceSubContent[];
}

interface GuidanceSubContent {
    text?: string;
    subtitle?: string;
    bullets?: string[];
    tip?: string;
}

export interface CareerRoleData {
    roleName: string;
    shortDescription: string;
    guidanceSections: GuidanceSectionJSON[];
    tools: string[];
}

export interface CourseCompatibility {
    course_name: string;
    compatibility_percentage: number;
    notes: string;
}

/**
 * Fetches career guidance roles filtered by Trait AND Department.
 * * @param traitCode - The trait string (e.g. "DI")
 * @param departmentId - The department degree ID (e.g. 101)
 */
export async function getCareerGuidanceByTrait(
    traitCode: string,
    departmentId: number | undefined,
): Promise<CareerRoleData[]> {
    logger.info(
        `\n[DB-DEBUG] 🚀 Starting fetch for trait: "${traitCode}" & Dept ID: ${departmentId}`,
    );

    if (process.env.MOCK_DB === "true") {
        logger.info("[DB-DEBUG] Mocking Career Guidance");
        return [];
    }

    const client = await pool.connect();

    try {
        // 1. Get Trait ID
        const traitQuery = `SELECT id FROM personality_traits WHERE code = $1 AND is_active = true LIMIT 1;`;
        const traitResult = await client.query(traitQuery, [traitCode]);

        if (traitResult.rows.length === 0) {
            logger.warn(
                `[DB-DEBUG] ❌ No entry found in 'personality_traits' for code '${traitCode}'.`,
            );
            return [];
        }

        const traitId = traitResult.rows[0].id;
        logger.info(
            `[DB-DEBUG] ✅ Found Trait ID: ${traitId} for Trait Code: ${traitCode}`,
        );

        // 2. Get Career Roles (Filtered by Trait AND Department)
        // Note: Using 'department_degree_id' matching the table schema.
        const rolesQuery = `
            SELECT id, career_role_name, short_description 
            FROM career_roles 
            WHERE trait_id = $1 
            AND department_degree_id = $2
            AND is_active = true 
            AND is_deleted = false
            ORDER BY id ASC;
        `;

        const rolesResult = await client.query(rolesQuery, [
            traitId,
            departmentId,
        ]);

        if (rolesResult.rows.length === 0) {
            logger.warn(
                `[DB-DEBUG] ❌ No active career roles found for Trait ID ${traitId} AND Dept ID ${departmentId}.`,
            );
            // Optional: Fallback logic could go here if you wanted to show generic roles instead
            return [];
        }

        logger.info(
            `[DB-DEBUG] ✅ Found ${rolesResult.rows.length} Roles matching criteria.`,
        );

        // 3. Loop through roles to get Details & Tools
        const results: CareerRoleData[] = [];

        for (const role of rolesResult.rows) {
            // A. Fetch Guidance Sections
            const sectionsQuery = `
                SELECT section_content FROM career_role_guidance_sections 
                WHERE career_role_id = $1 AND is_active = true AND is_deleted = false
                ORDER BY id ASC;
            `;
            const sectionsResult = await client.query(sectionsQuery, [role.id]);

            let guidanceSections: GuidanceSectionJSON[] = [];
            if (sectionsResult.rows.length > 0) {
                guidanceSections = sectionsResult.rows[0].section_content;
            }

            // B. Fetch Tools
            const toolsQuery = `SELECT tool_name FROM career_role_tools WHERE career_role_id = $1 AND is_active = true AND is_deleted = false;`;
            const toolsResult = await client.query(toolsQuery, [role.id]);
            const tools = toolsResult.rows.map((row) => row.tool_name);

            results.push({
                roleName: role.career_role_name,
                shortDescription: role.short_description,
                guidanceSections,
                tools,
            });
        }

        return results;
    } catch (error) {
        logger.error("[DB-DEBUG] ❌ SQL ERROR:", error);
        throw error;
    } finally {
        client.release();
        logger.info(`[DB-DEBUG] DB Connection released.\n`);
    }
}

export async function getCompapabilityMatixDetails(
    traitCode: string,
    schoolStreamId: number | undefined,
): Promise<CourseCompatibility[]> {
    logger.info(`\n[DB-DEBUG] 🚀 Starting fetch for trait: "${traitCode}"`);
    logger.info(
        `\n[DB-DEBUG] 🚀 Starting fetch for schoolStreamId: "${schoolStreamId}"`,
    );

    if (process.env.MOCK_DB === "true") {
        logger.info("[DB-DEBUG] Mocking Compatibility Matrix");
        return [];
    }

    const client = await pool.connect();

    try {
        // 1. Get Trait ID
        const traitQuery = `SELECT id FROM personality_traits WHERE code = $1 AND is_active = true LIMIT 1;`;
        const traitResult = await client.query(traitQuery, [traitCode]);

        if (traitResult.rows.length === 0) {
            logger.warn(
                `[DB-DEBUG] ❌ No entry found in 'personality_traits' for code '${traitCode}'.`,
            );
            return [];
        }

        const traitId = traitResult.rows[0].id;
        logger.info(`[DB-DEBUG] ✅ Found Trait ID: ${traitId}`);

        // 2. Get Career Roles (Filtered by Trait AND Department)
        // Note: Using 'department_degree_id' matching the table schema.
        if (schoolStreamId) {
            // --- EXISTING LOGIC (HSC - Specific Stream) ---
            const rolesQuery = `
                SELECT course_name, compatibility_percentage, notes
                FROM trait_based_course_details WHERE trait_id = $1 and school_stream_id = $2
            `;

            const rolesResult = await client.query(rolesQuery, [
                traitId,
                schoolStreamId,
            ]);

            if (rolesResult.rows.length === 0) {
                logger.warn(
                    `[DB-DEBUG] ❌ No Recommended Courses found for Trait ID ${traitId}.`,
                );
                return [];
            }

            return rolesResult.rows;
        } else {
            // --- NEW LOGIC (SSLC - All Streams, Top 5 Each) ---
            logger.info("[DB-DEBUG] ℹ️ SSLC Case: Fetching Top 5 per stream");

            // We need to fetch for streams 1 (Science), 2 (Commerce), 3 (Humanities)
            // Union approach with ROW_NUMBER partition

            const multiStreamQuery = `
                WITH RankedCourses AS (
                    SELECT 
                        course_name, 
                        compatibility_percentage, 
                        notes,
                        school_stream_id,
                        ROW_NUMBER() OVER (
                            PARTITION BY school_stream_id 
                            ORDER BY compatibility_percentage DESC, id ASC
                        ) as rank
                    FROM trait_based_course_details 
                    WHERE trait_id = $1 
                    AND school_stream_id IN (1, 2, 3) 
                )
                SELECT 
                    course_name, 
                    compatibility_percentage, 
                    notes, 
                    school_stream_id
                FROM RankedCourses
                WHERE rank <= 5
                ORDER BY school_stream_id ASC, compatibility_percentage DESC;
            `;

            const result = await client.query(multiStreamQuery, [traitId]);

            if (result.rows.length === 0) {
                return [];
            }

            // Transform: Append Stream Name
            const streamNames: Record<number, string> = {
                1: "Science",
                2: "Commerce",
                3: "Humanities",
            };

            return result.rows.map((row) => ({
                course_name: `${row.course_name} (${streamNames[row.school_stream_id] || "General"})`,
                compatibility_percentage: row.compatibility_percentage,
                notes: row.notes,
            }));
        }
    } catch (error) {
        logger.error("[DB-DEBUG] ❌ SQL ERROR:", error);
        throw error;
    } finally {
        client.release();
        logger.info(`[DB-DEBUG] DB Connection released.\n`);
    }
}

export async function getPlacementDetails(
    department_degree_id: number,
    group_id: number,
): Promise<PlacementData | null> {
    logger.info(
        `\n[DB-DEBUG] 🚀 Starting fetch for department_degree_id: "${department_degree_id}"`,
    );
    logger.info(`\n[DB-DEBUG] 🚀 Starting fetch for group_id: "${group_id}"`);

    if (process.env.MOCK_DB === "true") {
        logger.info("[DB-DEBUG] Mocking Placement Details");
        return {
            department_name: "Mock Dept",
            degree_type: "Mock Degree",
            exam_start_date: new Date().toISOString(),
            total_students: 10,
            group_name: "Mock Group",
            report_title: "Mock Report",
            exam_ref_no: "MOCK-REF",
            department_id: 1,
            degree_type_id: 1,
            department_deg_id: 1,
            trait_distribution: [],
        } as PlacementData;
    }

    const client = await pool.connect();

    try {
        const query = `
            WITH DuplicateCheck AS (
SELECT 
    full_name, 
    department_degree_id
FROM registrations
WHERE department_degree_id = $2
GROUP BY full_name, department_degree_id
HAVING COUNT(*) > 1
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
FROM assessment_attempts aa
JOIN assessment_sessions a1 ON aa.assessment_session_id = a1.id
JOIN registrations r ON aa.registration_id = r.id
JOIN department_degrees dd ON r.department_degree_id = dd.id
JOIN departments dpt ON dd.department_id = dpt.id
JOIN degree_types dt ON dd.degree_type_id = dt.id
JOIN groups gp ON a1.group_id = gp.id
JOIN assessment_reports ar ON aa.assessment_session_id = ar.assessment_session_id
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id 
LEFT JOIN DuplicateCheck dc 
    ON r.full_name = dc.full_name 
    AND r.department_degree_id = dc.department_degree_id
WHERE 
    a1.group_id = $1
    AND r.department_degree_id = $2
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
            WHEN is_duplicate_name IS TRUE THEN
                JSON_BUILD_OBJECT(
                    'registration_ID', registration_id,
                    'full_name', full_name,
                    'college_year', current_year,
                    'student_exam_ref_no', report_number,
                    'duplicate_name', true,
                    'mobile_number', mobile_number,
                    'agile_score', agile_scores -- << CHANGED: Added agile_score to JSON object
                )
            ELSE
                JSON_BUILD_OBJECT(
                    'registration_ID', registration_id,
                    'full_name', full_name,
                    'college_year', current_year,
                    'student_exam_ref_no', report_number,
                    'agile_score', agile_scores -- << CHANGED: Added agile_score to JSON object
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
WHERE trait_code IS NOT NULL
GROUP BY trait_id, trait_code, blended_style_name, blended_style_desc, color_rgb
)
SELECT 
JSON_BUILD_OBJECT(
    'department_name', MAX(department_name),
    'degree_type', MAX(degree_type),
    'exam_start_date', MAX(exam_start_date),
    'total_students', COALESCE(SUM(trait_student_count), 0),
    'group_name', MAX(group_name),
    'report_title', CONCAT('Students Handbook ', EXTRACT(YEAR FROM MAX(exam_start_date))),
    'exam_ref_no', MAX(report_number),
    'department_id', MAX(department_id),
    'degree_type_id', MAX(degree_type_id),
    'department_deg_id', MAX(department_deg_id),
    'trait_distribution', COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'trait_ID', trait_id,
                'trait_code', trait_code,
                'blended_style_name', blended_style_name,
                'blended_style_desc', blended_style_desc,
                'student_count', trait_student_count,
                'students_data', students_data,
                'color_rgb', string_to_array(color_rgb, ',')::int[]
            )
        ) FILTER (WHERE trait_id IS NOT NULL), '[]'
    )
) AS final_json_output
FROM TraitGrouped;
        `;

        const result = await client.query(query, [
            group_id,
            department_degree_id,
        ]);

        const data = result.rows[0]?.final_json_output;

        if (!data || !data.department_name) {
            logger.warn(`[DB-DEBUG] ⚠️ No data found for group: ${group_id}`);
            return null;
        }

        logger.info(
            `[DB-DEBUG] ✅ Successfully fetched placement details. Total Students: ${data.total_students}`,
        );

        return data as PlacementData;
    } catch (error) {
        logger.error("[DB-DEBUG] ❌ SQL ERROR:", error);
        throw error;
    } finally {
        client.release();
        logger.info(`[DB-DEBUG] DB Connection released.\n`);
    }
}

export async function updateReportPassword(
    assessmentSessionId: string,
    password: string,
): Promise<string> {
    // Changed return type to Promise<string>

    if (process.env.MOCK_DB === "true") {
        logger.info(
            `[DB-MOCK] Checking/Updating report password for session: ${assessmentSessionId}. New would be: ${password}`,
        );
        // In mock mode, we can simulate either case. Let's simulate "new password used" for simplicity,
        // or return a fixed mock string if we wanted to test "existing".
        // For now, return the passed password to simulate "first time generation".
        return password;
    }

    const client = await pool.connect();

    try {
        // 1. Check if password already exists
        const checkQuery = `
            SELECT report_password 
            FROM assessment_reports 
            WHERE assessment_session_id = $1
        `;
        const checkResult = await client.query(checkQuery, [
            assessmentSessionId,
        ]);

        if (checkResult.rows.length > 0) {
            const existingPassword = checkResult.rows[0].report_password;
            if (existingPassword.trim().length >= 5) {
                logger.info(
                    `[DB] Found existing valid password for session: ${assessmentSessionId}`,
                );
                return existingPassword;
            }
        }

        // 2. If not exists (or empty), update with new password
        const updateQuery = `
            UPDATE assessment_reports 
            SET report_password = $1 
            WHERE assessment_session_id = $2
        `;
        await client.query(updateQuery, [password, assessmentSessionId]);
        logger.info(
            `[DB] Updated report password for session: ${assessmentSessionId}`,
        );
        return password;
    } catch (error) {
        logger.error(
            `[DB] Failed to update/fetch report password for session: ${assessmentSessionId}`,
            error,
        );
        throw error;
    } finally {
        client.release();
    }
}
