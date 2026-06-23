/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { logger } from './logger';
import { getPool } from './dbPool';
import {
  AnswerTypeCount,
  AgileScore,
  MergedReportData,
  CollegeData,
  SchoolData,
  EmployeeData,
  CxoData,
} from '../types/types';
import { SCHOOL_LEVEL_ID, SCHOOL_STREAM_ID } from '../reports/BaseConstants';
import { ReportVariant } from './reportFactory';

/**
 * Ensures an `assessment_reports` row (and therefore an OBI report number)
 * exists for a session, minting one on the fly if absent. This is a read-path
 * safety net: the exam-engine assigns the number when Level 1 completes, but
 * sessions whose Level 1 was finished before that change shipped (or a rare
 * race) can still lack one. When such a report is downloaded we mint it here so
 * the filename and the number printed on the PDF are real instead of "Nil".
 *
 * It NEVER touches the exam-submission flow. The number uses the same
 * `OBI-G{group}-{MM/YY}-{code}-{seq}` convention as the exam-engine, and the
 * insert is idempotent — when the session later completes the exam-engine finds
 * this row and backfills the ACI/Level-3/4 score snapshot onto it.
 *
 * @returns the report number, or null when one can't be determined (e.g. no
 *          completed Level 1 yet) so callers can fall back gracefully.
 */
export async function ensureReportNumber(
  sessionId: string | number,
): Promise<string | null> {
  if (!sessionId) return null;
  const client = await getPool().connect();
  try {
    // 1. Already has one?
    const existing = await client.query(
      `SELECT report_number FROM assessment_reports WHERE assessment_session_id = $1 LIMIT 1`,
      [sessionId],
    );
    if (existing.rows[0]?.report_number) {
      return existing.rows[0].report_number as string;
    }

    // 2. Resolve program / group for the prefix.
    const sess = await client.query(
      `SELECT s.group_id, p.code AS program_code
         FROM assessment_sessions s
         JOIN programs p ON p.id = s.program_id
        WHERE s.id = $1 LIMIT 1`,
      [sessionId],
    );
    if (!sess.rows[0]) return null;
    const groupId: number | null = sess.rows[0].group_id ?? null;
    const programCode: string = sess.rows[0].program_code || '';

    // 3. Require a completed Level 1 (DISC) attempt — its data seeds the row.
    const att = await client.query(
      `SELECT aa.dominant_trait_id, aa.sincerity_index, aa.metadata
         FROM assessment_attempts aa
         JOIN assessment_levels al ON aa.assessment_level_id = al.id
        WHERE aa.assessment_session_id = $1
          AND aa.status = 'COMPLETED'
          AND (al.level_number = 1 OR al.pattern_type = 'DISC' OR al.name = 'Level 1')
        LIMIT 1`,
      [sessionId],
    );
    if (!att.rows[0]) return null;

    const shortMap: Record<string, string> = {
      COLLEGE_STUDENT: 'CS',
      SCHOOL_STUDENT: 'SS',
      EMPLOYEE: 'E',
      CXO_GENERAL: 'CG',
    };
    const shortCode = shortMap[programCode] || programCode || 'X';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(2);
    const prefix = `OBI-${groupId ? `G${groupId}-` : ''}${mm}/${yy}-${shortCode}-`;

    // Seed scores from the L1 attempt (agile/level3/4 backfilled at completion).
    let discJson = '{}';
    try {
      const meta =
        typeof att.rows[0].metadata === 'string'
          ? JSON.parse(att.rows[0].metadata)
          : att.rows[0].metadata || {};
      if (meta?.disc_scores) discJson = JSON.stringify(meta.disc_scores);
    } catch {
      discJson = '{}';
    }
    const dominantTraitId = att.rows[0].dominant_trait_id ?? null;
    const sincerity = att.rows[0].sincerity_index ?? 0;

    // 4. Mint + insert idempotently. A unique-number race (another session in
    //    the same prefix minting at once) can't corrupt anything — we roll back
    //    and re-read; the row is created by whoever wins, else at completion.
    try {
      await client.query('BEGIN');
      const cnt = await client.query(
        `SELECT COUNT(*)::int AS c FROM assessment_reports WHERE report_number LIKE $1`,
        [prefix + '%'],
      );
      const seq = ((cnt.rows[0]?.c as number) ?? 0) + 1;
      const reportNumber = `${prefix}${String(seq).padStart(3, '0')}`;
      const ins = await client.query(
        `INSERT INTO assessment_reports
           (assessment_session_id, report_number, generated_at, disc_scores,
            agile_scores, level3_scores, level4_scores, overall_sincerity,
            dominant_trait_id, metadata)
         VALUES ($1, $2, NOW(), $3, '{}', '{}', '{}', $4, $5, '{}')
         ON CONFLICT (assessment_session_id) DO NOTHING
         RETURNING report_number`,
        [sessionId, reportNumber, discJson, sincerity, dominantTraitId],
      );
      await client.query('COMMIT');
      if (ins.rows[0]?.report_number) {
        return ins.rows[0].report_number as string;
      }
    } catch (e) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      logger.warn(
        `ensureReportNumber: mint failed for session ${sessionId}: ${(e as Error).message}`,
      );
    }

    // 5. Conflict / concurrent creation — re-read whatever is now there.
    const reselect = await client.query(
      `SELECT report_number FROM assessment_reports WHERE assessment_session_id = $1 LIMIT 1`,
      [sessionId],
    );
    return (reselect.rows[0]?.report_number as string) || null;
  } catch (e) {
    logger.warn(
      `ensureReportNumber: failed for session ${sessionId}: ${(e as Error).message}`,
    );
    return null;
  } finally {
    client.release();
  }
}

export async function fetchGroupAssessmentData(
  groupId: string,
  programId?: string | number,
  variant: ReportVariant = 'full',
): Promise<MergedReportData[]> {
  const client = await getPool().connect();

  try {
    logger.info(
      `Fetching data for group: ${groupId}${
        programId ? `, program: ${programId}` : ''
      }`,
    );

    // Optional program filter — used by the combined "By Group" report so the
    // report stays scoped to one (group, program) cohort.
    const params: (string | number)[] = [groupId];
    let programFilter = '';
    if (
      programId !== undefined &&
      programId !== null &&
      `${programId}` !== ''
    ) {
      params.push(programId);
      programFilter = ` AND s.program_id = $${params.length}`;
    }

    // DISTINCT ON (user) keeps exactly one row per student — their latest
    // completed session — so a student who sat in multiple exam windows of the
    // same group is counted once in the combined report. (No-op for single
    // windows, where a user has only one session.)
    const sessionsQuery = `
            SELECT DISTINCT ON (s.user_id)
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
                r.school_stream,
                r.student_board
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            JOIN department_degrees dd ON r.department_degree_id = dd.id
            JOIN departments d ON dd.department_id = d.id
            JOIN groups q ON s.group_id = q.id
            WHERE s.group_id = $1${programFilter}
            ORDER BY s.user_id,
                     s.completed_at DESC NULLS LAST,
                     s.started_at DESC NULLS LAST
        `;
    const sessionsResult = await client.query(sessionsQuery, params);
    logger.info(
      `Sessions fetched for group ${groupId}: ${sessionsResult.rows.length} rows`,
    );

    return await processSessionRows(client, sessionsResult.rows, variant);
  } catch (error) {
    logger.error('Error fetching group assessment data:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function fetchUserAssessmentData(
  userIds: string[],
  variant: ReportVariant = 'full',
): Promise<MergedReportData[]> {
  const client = await getPool().connect();

  try {
    logger.info(`Fetching data for users: ${userIds.join(', ')}`);

    // 1. Check Program ID first
    const programQuery = `SELECT program_id FROM assessment_sessions WHERE user_id = $1 LIMIT 1`;
    const programResult = await client.query(programQuery, [userIds[0]]);
    const programId = parseInt(programResult.rows[0]?.program_id);
    let sessionsQuery = '';

    if (programId === 1) {
      // --- SCHOOL QUERY (No Department Joins) ---
      logger.info(`Program ID: ${programId} (School)`);
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
            r.school_stream,
            r.student_board
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            WHERE s.user_id = ANY($1)
            `;
    } else if (programId === 2) {
      // --- COLLEGE QUERY (Join with Departments) ---
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
    } else {
      // --- OTHER PROGRAMS (No Department Joins, No School Joins) ---
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
                ar.report_number
            FROM assessment_sessions s
            JOIN registrations r ON s.registration_id = r.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN assessment_reports ar ON s.id = ar.assessment_session_id
            WHERE s.user_id = ANY($1)
        `;
    }

    const sessionsResult = await client.query(sessionsQuery, [userIds]);
    logger.info(
      `Sessions fetched for users: ${sessionsResult.rows.length} rows`,
    );

    return await processSessionRows(client, sessionsResult.rows, variant);
  } catch (error) {
    logger.error('Error fetching user assessment data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function processSessionRows(
  client: any,
  sessionRows: any[],
  variant: ReportVariant = 'full',
): Promise<MergedReportData[]> {
  const validUsersData: MergedReportData[] = [];
  const level1Only = variant === 'level1';

  for (const session of sessionRows) {
    const programId = Number(session.program_id); // Ensure number

    // 2. For each session, fetch attempts (DISC + Agile usually)
    // We need COMPLETED attempts
    const attemptsQuery = `
            SELECT aa.status, aa.metadata, aa.dominant_trait_id,
                   pt.code AS dominant_trait_code
            FROM assessment_attempts aa
            LEFT JOIN personality_traits pt ON pt.id = aa.dominant_trait_id
            WHERE aa.assessment_session_id = $1
            AND aa.status = 'COMPLETED'
            `;
    const attemptsResult = await client.query(attemptsQuery, [
      session.session_id,
    ]);

    // DISC is the only mandatory assessment. ACI (Agile) is optional: when it
    // is absent the report degrades to DISC-only (ACI sections are skipped at
    // render time), so we no longer require a second completed attempt here.
    // Only skip when there are no completed attempts at all.
    if (attemptsResult.rows.length === 0) {
      logger.warn(
        `User ${session.user_id} (Session ${session.session_id}) has no completed attempts. Skipping.`,
      );
      continue;
    }

    // Merge Metadata
    let discData: any = null;
    let agileData: any = null;
    // The engine's resolved headline code (pure-capable) lives on the DISC
    // (Level 1) attempt via dominant_trait_id -> personality_traits.code.
    let discTraitCode: string | null = null;

    for (const row of attemptsResult.rows) {
      const meta = row.metadata;
      if (meta.disc_scores) {
        discData = meta;
        discTraitCode = row.dominant_trait_code ?? null;
      } else if (meta.agile_scores) {
        agileData = meta;
      }
    }

    if (!discData) {
      logger.warn(`User ${session.user_id} missing DISC data. Skipping.`);
      continue;
    }

    if (!level1Only && !agileData) {
      // Not fatal: build a DISC-only report. transformedAgile below defaults to
      // zeros, so hasAci() returns false and ACI sections are skipped cleanly.
      logger.info(
        `User ${session.user_id} missing Agile data - generating DISC-only report (ACI sections skipped).`,
      );
    }

    // Transform Data
    // DISC Scores: DB has total 40. Convert to percentage.
    // Assuming percent = (score / 40) * 100
    // User requested formula: (40 - Raw) + (Raw/40 * 100)
    const calcScore = (val: number) => {
      const percent = (val / 40) * 100;
      return 40 - val + percent;
    };

    const scoreD = calcScore(discData.disc_scores.D || 0);
    const scoreI = calcScore(discData.disc_scores.I || 0);
    const scoreS = calcScore(discData.disc_scores.S || 0);
    const scoreC = calcScore(discData.disc_scores.C || 0);

    const typeCounts: AnswerTypeCount[] = [
      { ANSWER_TYPE: 'D', COUNT: discData.disc_scores.D || 0 },
      { ANSWER_TYPE: 'I', COUNT: discData.disc_scores.I || 0 },
      { ANSWER_TYPE: 'S', COUNT: discData.disc_scores.S || 0 },
      { ANSWER_TYPE: 'C', COUNT: discData.disc_scores.C || 0 },
    ];

    // Agile Scores mapping (null when level1-only variant — not required for that report)
    const transformedAgile: AgileScore = agileData
      ? {
          focus: agileData.agile_scores.Focus || 0,
          courage: agileData.agile_scores.Courage || 0,
          respect: agileData.agile_scores.Respect || 0,
          openness: agileData.agile_scores.Openness || 0,
          commitment: agileData.agile_scores.Commitment || 0,
        }
      : { focus: 0, courage: 0, respect: 0, openness: 0, commitment: 0 };

    const reportTitleMap: Record<number, string> = {
      1: 'School Personalized Report',
      2: 'College Personalized Report',
      3: 'Employee Personalized Report',
      4: 'OriginBI PersonaEdge Report',
    };
    logger.info(`Report Number: ${session.report_number}`);

    const formatReportRef = (ref: string | null) => {
      if (!ref) return 'Nil';
      return ref
        .replace('COLLEGE_STUDENT', 'CS')
        .replace('SCHOOL_STUDENT', 'SS')
        .replace('EMPLOYEE', 'E')
        .replace('CXO_GENERAL', 'CG');
    };

    const baseData = {
      full_name: (() => {
        // Sanitize: Remove newlines, non-word characters (except spaces)
        const sanitized = session.full_name
          .replace(/[\r\n\t]+/g, ' ') // Convert newlines/tabs to spaces
          .replace(/[^a-zA-Z\s]/g, ''); // Remove non-letters

        const words = sanitized
          .trim()
          .split(/\s+/) // handle multiple spaces
          .map(
            (word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          );

        return words.join(' ');
      })(),
      email_id: session.email,
      exam_start: session.started_at
        ? new Date(session.started_at)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0]
        : '',
      exam_end: session.completed_at
        ? new Date(session.completed_at)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0]
        : '',
      bi_registration_ID: session.registration_id,
      assigned_exam_id: session.session_id,

      exam_ref_no: formatReportRef(session.report_number),

      report_title: reportTitleMap[programId] || 'Report',
      score_D: scoreD,
      score_I: scoreI,
      score_S: scoreS,
      score_C: scoreC,
      most_answered_answer_type: typeCounts,
      top_answered_types: [],
      program_type: programId,
      agile_scores: [transformedAgile],
      report_password: session.report_password,
      dominant_trait_code: discTraitCode ?? undefined,
    };

    // --- PROGRAM LOGIC ---
    if (programId === 1) {
      // School
      const levelId =
        SCHOOL_LEVEL_ID[session.school_level as keyof typeof SCHOOL_LEVEL_ID];
      if (!levelId) {
        logger.warn(
          `User ${session.user_id} has invalid or missing school_level: ${session.school_level}. Skipping.`,
        );
        continue;
      }

      const schoolData: SchoolData = {
        ...baseData,
        school_level_id: levelId,
        student_board: session.student_board,
      };

      if (levelId === SCHOOL_LEVEL_ID.HSC && session.school_stream) {
        const streamId =
          SCHOOL_STREAM_ID[
            session.school_stream.toUpperCase() as keyof typeof SCHOOL_STREAM_ID
          ];
        if (streamId) {
          schoolData.school_stream_id = streamId;
        }
      }

      logger.debug('Processing for Program:', reportTitleMap[programId]);
      validUsersData.push(schoolData);
    } else if (programId === 2) {
      // College
      const collegeData: CollegeData = {
        ...baseData,
        department_deg_id: session.department_degree_id,
        dept_code: session.dept_code,
        group_name: session.group_name,
      };
      logger.debug('Processing for Program:', reportTitleMap[programId]);
      validUsersData.push(collegeData);
    } else if (programId === 3) {
      // Employee
      const employeeData: EmployeeData = {
        ...baseData,
        group_name: session.group_name,
      };
      logger.debug('Processing for Program:', reportTitleMap[programId]);
      validUsersData.push(employeeData);
    } else {
      // CXO or other
      const cxoData: CxoData = {
        ...baseData,
        group_name: session.group_name,
      };
      logger.debug('Processing for Program:', reportTitleMap[programId]);
      validUsersData.push(cxoData);
    }
  }

  logger.info(`Final processed data count: ${validUsersData.length}`);
  return validUsersData;
}
