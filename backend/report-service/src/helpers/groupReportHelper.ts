import { Pool } from "pg";
import fs from "fs";
import path from "path";
import {
    CollegeData,
    SchoolData,
    AnswerTypeCount,
    AgileScore,
} from "../types/types";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
});

const LOG_FILE_PATH = path.join(__dirname, "../../sql_logs.txt");

function logSqlOutput(label: string, data: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] --- ${label} ---\n${JSON.stringify(data, null, 2)}\n------------------------------------------------\n`;
    try {
        fs.appendFileSync(LOG_FILE_PATH, logEntry);
    } catch (err) {
        console.error("Failed to write to log file:", err);
    }
}

interface AssessmentAttemptRow {
    assessment_session_id: string;
    user_id: string;
    program_id: number;
    status: string;
    metadata: any;
}

interface GroupAssessmentData {
    groupId: string;
    programId: number;
}

export interface MergedUserData extends CollegeData {
    // Using CollegeData as base, covers most fields
    program_type: number;
    report_password?: string;
    school_level_id?: number;
    school_stream_id?: number;
}

export async function fetchGroupAssessmentData(
    groupId: string,
): Promise<MergedUserData[]> {
    const client = await pool.connect();

    try {
        console.log(`fetching data for group: ${groupId}`);
        logSqlOutput("Allowing data fetch for Group ID", groupId);

        const sessionsQuery = `
            SELECT 
                s.id as session_id, 
                s.user_id, 
                s.registration_id, 
                s.program_id,
                s.started_at, 
                s.completed_at,
                r.full_name,
                r.department_degree_id,
                d.short_name as "dept_code",
                u.email,
                ar.report_number,
                q.name as "group_name",
                r.school_level,
                r.school_stream
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            JOIN department_degrees dd ON r.department_degree_id = dd.id
            JOIN departments d ON dd.department_id = d.id
            JOIN groups q ON s.group_id = q.id
            WHERE s.group_id = $1
        `;
        const sessionsResult = await client.query(sessionsQuery, [groupId]);
        logSqlOutput("Sessions Query Result", sessionsResult.rows);

        return await processSessionRows(client, sessionsResult.rows);
    } catch (error) {
        console.error("Error fetching group assessment data:", error);
        logSqlOutput("Error", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function fetchUserAssessmentData(
    userIds: string[],
): Promise<MergedUserData[]> {
    const client = await pool.connect();

    try {
        console.log(`fetching data for users: ${userIds.join(", ")}`);
        logSqlOutput("Allowing data fetch for User IDs", userIds);

        // 1. Check Program ID first
        const programQuery = `SELECT program_id FROM assessment_sessions WHERE user_id = $1 LIMIT 1`;
        const programResult = await client.query(programQuery, [userIds[0]]);
        const programId = parseInt(programResult.rows[0]?.program_id);
        let sessionsQuery = "";

        if (programId === 1) {
            // --- SCHOOL QUERY (No Department Joins) ---
            console.log("Program ID:", programId);
            sessionsQuery = `
            SELECT 
            s.id as session_id, 
            s.user_id, 
            s.registration_id, 
            s.program_id,
            s.started_at, 
            s.completed_at,
            r.full_name,
            u.email,
            ar.report_number,
            r.school_level,
            r.school_stream
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            WHERE s.user_id = ANY($1)
            `;
        } else {
            // --- STANDARD QUERY (College/Others with Departments) ---
            sessionsQuery = `
            SELECT 
                s.id as session_id, 
                s.user_id, 
                s.registration_id, 
                s.program_id,
                s.started_at, 
                s.completed_at,
                r.full_name,
                r.department_degree_id,
                d.short_name as "dept_code",
                u.email,
                ar.report_number
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            JOIN department_degrees dd ON r.department_degree_id = dd.id
            JOIN departments d ON dd.department_id = d.id
            WHERE s.user_id = ANY($1)
        `;
        }

        const sessionsResult = await client.query(sessionsQuery, [userIds]);
        console.log(sessionsResult.rows);
        logSqlOutput("Sessions Query Result", sessionsResult.rows);

        return await processSessionRows(client, sessionsResult.rows);
    } catch (error) {
        console.error("Error fetching user assessment data:", error);
        logSqlOutput("Error", error);
        throw error;
    } finally {
        client.release();
    }
}

async function processSessionRows(
    client: any,
    sessionRows: any[],
): Promise<MergedUserData[]> {
    const validUsersData: MergedUserData[] = [];

    for (const session of sessionRows) {
        const programId = Number(session.program_id); // Ensure number

        // 2. For each session, fetch attempts (DISC + Agile usually)
        // We need COMPLETED attempts
        const attemptsQuery = `
            SELECT status, metadata
            FROM assessment_attempts 
            WHERE assessment_session_id = $1 
            AND status = 'COMPLETED'
            `;
        const attemptsResult = await client.query(attemptsQuery, [
            session.session_id,
        ]);
        // logSqlOutput(`Attempts for Session ${session.session_id}`, attemptsResult.rows);

        if (attemptsResult.rows.length < 2) {
            console.warn(
                `User ${session.user_id} (Session ${session.session_id}) has fewer than 2 completed attempts. Skipping.`,
            );
            continue; // We need both parts
        }

        // Merge Metadata
        let discData: any = null;
        let agileData: any = null;

        for (const row of attemptsResult.rows) {
            const meta = row.metadata;
            if (meta.disc_scores) {
                discData = meta;
            } else if (meta.agile_scores) {
                agileData = meta;
            }
        }

        if (!discData || !agileData) {
            console.warn(
                `User ${session.user_id} missing either DISC or Agile data. Skipping.`,
            );
            continue;
        }

        // Transform Data
        // DISC Scores: DB has total 40. Convert to percentage.
        // Assuming percent = (score / 40) * 100
        // User requested formula: (40 - Raw) + (Raw/40 * 100)
        const calcScore = (val: number) => {
            const percent = (val / 40) * 100;
            return 40 - val + percent;
        };

        const scoreD = calcScore(discData.disc_scores.D);
        const scoreI = calcScore(discData.disc_scores.I);
        const scoreS = calcScore(discData.disc_scores.S);
        const scoreC = calcScore(discData.disc_scores.C);

        const typeCounts: AnswerTypeCount[] = [
            { ANSWER_TYPE: "D", COUNT: discData.disc_scores.D },
            { ANSWER_TYPE: "I", COUNT: discData.disc_scores.I },
            { ANSWER_TYPE: "S", COUNT: discData.disc_scores.S },
            { ANSWER_TYPE: "C", COUNT: discData.disc_scores.C },
        ];

        // Agile Scores mapping
        const transformedAgile: AgileScore = {
            focus: agileData.agile_scores.Focus || 0,
            courage: agileData.agile_scores.Courage || 0,
            respect: agileData.agile_scores.Respect || 0,
            openness: agileData.agile_scores.Openness || 0,
            commitment: agileData.agile_scores.Commitment || 0,
        };

        const reportTitleMap: Record<number, string> = {
            1: "School Personalized Report",
            2: "College Personalized Report",
            3: "Employee Personalized Report",
            4: "OriginBI PersonaEdge Report",
        };
        console.log("Report Number", session.report_number);

        const formatReportRef = (ref: string | null) => {
            if (!ref) return "Nil";
            return ref
                .replace("COLLEGE_STUDENT", "CS")
                .replace("SCHOOL_STUDENT", "SS")
                .replace("EMPLOYEE", "E")
                .replace("CXO_GENERAL", "CG");
        };

        const userData: MergedUserData = {
            full_name: (() => {
                // Sanitize: Remove newlines, non-word characters (except spaces)
                const sanitized = session.full_name
                    .replace(/[\r\n\t]+/g, " ") // Convert newlines/tabs to spaces
                    .replace(/[^a-zA-Z\s]/g, ""); // Remove non-letters

                const words = sanitized
                    .trim()
                    .split(/\s+/) // handle multiple spaces
                    .map(
                        (word: string) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                    );

                return words.join(" ");
            })(),
            email_id: session.email,
            exam_start: session.started_at
                ? new Date(session.started_at)
                      .toISOString()
                      .replace("T", " ")
                      .split(".")[0]
                : "",
            exam_end: session.completed_at
                ? new Date(session.completed_at)
                      .toISOString()
                      .replace("T", " ")
                      .split(".")[0]
                : "",
            bi_registration_ID: session.registration_id,
            assigned_exam_id: session.session_id,

            exam_ref_no: formatReportRef(session.report_number),

            report_title: reportTitleMap[programId] || "Report",
            score_D: scoreD,
            score_I: scoreI,
            score_S: scoreS,
            score_C: scoreC,
            most_answered_answer_type: typeCounts,
            top_answered_types: [],
            program_type: programId,
            department_deg_id: session.department_degree_id,
            dept_code: session.dept_code,
            group_name: session.group_name,
            agile_scores: [transformedAgile],
            report_password: session.report_password,
        };

        // --- SCHOOL LOGIC ---
        if (programId === 1) {
            // School
            const schoolLevelMap: Record<string, number> = { SSLC: 1, HSC: 2 };
            const schoolStreamMap: Record<string, number> = {
                SCIENCE: 1,
                COMMERCE: 2,
                HUMANITIES: 3,
            };

            const levelId = schoolLevelMap[session.school_level];
            if (levelId) {
                userData.school_level_id = levelId;

                // Case A: HSC - Map Stream
                if (levelId === 2) {
                    userData.school_stream_id =
                        schoolStreamMap[session.school_stream];
                }
                // Case B: SSLC - Stream undefined (handled by default)
            }
        }

        validUsersData.push(userData);
    }

    logSqlOutput("Final Processed Data Count", validUsersData.length);
    return validUsersData;
}
