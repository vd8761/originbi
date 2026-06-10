/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { getPool } from './dbPool';
import { logger } from './logger';
import { DiscScores } from '../reports/college/specializationConstants';

export interface Level1CohortStudent {
  fullName: string;
  deptCode: string | null;
  scores: DiscScores;
  /** Set only when another student in the cohort shares the same name. */
  mobile?: string;
}

export interface Level1CohortResult {
  groupName: string;
  departmentName: string | null;
  students: Level1CohortStudent[];
}

function cleanName(raw: string): string {
  const sanitized = (raw || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim();
  if (!sanitized) return raw?.trim() || 'Unknown';
  return sanitized
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetches every student in a group/department who has a COMPLETED assessment
 * attempt carrying DISC scores (the Level-1 attempt). One row per student —
 * their latest such attempt. When `deptDegreeId` is provided, the cohort is
 * scoped to that department.
 */
export async function fetchLevel1Cohort(
  groupId: number,
  deptDegreeId?: number,
): Promise<Level1CohortResult> {
  const client = await getPool().connect();
  try {
    const params: Array<string | number> = [groupId];
    let deptFilter = '';
    if (deptDegreeId !== undefined && Number.isFinite(deptDegreeId)) {
      params.push(deptDegreeId);
      deptFilter = ` AND r.department_degree_id = $${params.length}`;
    }

    const sql = `
      SELECT DISTINCT ON (s.user_id)
        s.user_id,
        r.full_name,
        r.country_code,
        r.mobile_number,
        d.short_name AS dept_code,
        d.name       AS dept_name,
        q.name       AS group_name,
        a.metadata   AS metadata
      FROM assessment_sessions s
      JOIN registrations r ON s.registration_id = r.id
      JOIN groups q ON s.group_id = q.id
      JOIN assessment_attempts a
        ON a.assessment_session_id = s.id
       AND a.status = 'COMPLETED'
       AND a.metadata -> 'disc_scores' IS NOT NULL
      LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
      LEFT JOIN departments d ON dd.department_id = d.id
      WHERE s.group_id = $1${deptFilter}
      ORDER BY s.user_id, a.completed_at DESC NULLS LAST
    `;

    const { rows } = await client.query(sql, params);
    logger.info(
      `[Level1Cohort] Group ${groupId}${deptDegreeId ? `, Dept ${deptDegreeId}` : ''}: ${rows.length} students fetched.`,
    );

    const groupName: string =
      rows.length > 0
        ? String(rows[0].group_name ?? `Group ${groupId}`)
        : `Group ${groupId}`;
    const departmentName: string | null =
      rows.length > 0 ? (rows[0].dept_name ?? null) : null;

    type Internal = Level1CohortStudent & { _mobile: string };
    const students: Internal[] = rows.map((row: any) => {
      const disc = (row.metadata?.disc_scores ?? {}) as Record<string, unknown>;
      const cc = (row.country_code ?? '').toString().trim();
      const num = (row.mobile_number ?? '').toString().trim();
      return {
        fullName: cleanName(row.full_name),
        deptCode: row.dept_code ?? null,
        _mobile: num
          ? `${cc ? (cc.startsWith('+') ? cc : `+${cc}`) : ''} ${num}`.trim()
          : '',
        scores: {
          D: toNum(disc.D),
          I: toNum(disc.I),
          S: toNum(disc.S),
          C: toNum(disc.C),
        },
      };
    });

    students.sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Flag duplicate names within the cohort — only those get a mobile line.
    const counts = new Map<string, number>();
    students.forEach((s) => {
      const k = s.fullName.toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    students.forEach((s) => {
      const dup = (counts.get(s.fullName.toLowerCase()) ?? 0) > 1;
      if (dup && s._mobile) s.mobile = s._mobile;
      delete (s as Partial<{ _mobile: string }>)._mobile;
    });

    return {
      groupName,
      departmentName,
      students: students as Level1CohortStudent[],
    };
  } catch (err) {
    logger.error('[Level1Cohort] Fetch failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
