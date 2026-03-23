/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { getPool } from './dbPool';
import { logger } from './logger';

/**
 * Represents one row from the `university_datas` table.
 */
export interface UniversityData {
  id: number;
  school_stream_id: number;
  school_stream_department_id?: number;
  department_name?: string;
  /** ENGINEERING | MEDICAL | RESEARCH (stream 1) or MANAGEMENT (stream 2) or LAW (stream 3) */
  school_group?: string;
  institute_id: string;
  name: string;
  city: string;
  score: string;
  rank: string;
  state: string;
  tlr: string;
  rpc: string;
  go: string;
  oi: string;
  perception: string;
}

/**
 * Maps a primary DISC trait letter to the SQL ORDER BY clause.
 * Priority parameter comes first, secondary parameter second.
 * Both are cast to FLOAT to allow numeric sort on string-stored values.
 */
/**
 * Safely extracts only digits and decimals from a string column to cast it to FLOAT,
 * gracefully handling text like "101-150" or "N/A" by returning NULL/extracting just numbers.
 */
function safeCast(column: string): string {
  return `CAST(NULLIF(regexp_replace(${column}, '[^0-9.]', '', 'g'), '') AS FLOAT)`;
}

function normalizeCollegeName(name: string | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function takeUniqueColleges(
  colleges: UniversityData[],
  limit: number,
  seenNames: Set<string>,
): UniversityData[] {
  const picked: UniversityData[] = [];

  for (const college of colleges) {
    const normalizedName = normalizeCollegeName(college.name);
    if (!normalizedName || seenNames.has(normalizedName)) {
      continue;
    }
    seenNames.add(normalizedName);
    picked.push(college);

    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

/**
 * Maps a primary DISC trait letter to the SQL ORDER BY clause.
 * Priority parameter comes first, secondary parameter second.
 * Both are cast safely to allow numeric sort on string-stored values.
 */
function getOrderByClause(primaryTrait: string): string {
  switch (primaryTrait.toUpperCase()) {
    case 'D':
      return `${safeCast('go')} DESC, ${safeCast('perception')} DESC`;
    case 'I':
      return `${safeCast('oi')} DESC, ${safeCast('perception')} DESC`;
    case 'S':
      return `${safeCast('tlr')} DESC, ${safeCast('oi')} DESC`;
    case 'C':
      return `${safeCast('rpc')} DESC, ${safeCast('tlr')} DESC`;
    default:
      return `${safeCast('score')} DESC`;
  }
}

/**
 * Fetches the best matching colleges for a school student based on dominant
 * DISC trait and school stream.
 *
 * Behaviour by stream:
 *  - stream 1 (HSC Science): picks top 5 per school_group
 *      (ENGINEERING, MEDICAL, RESEARCH) → 15 total, ordered by rank.
 *  - stream 2 / 3 (HSC Commerce/Arts): picks top 10 from that stream,
 *      ordered by rank.
 *  - undefined (SSLC): picks top 5 per stream (1, 2, 3) → 15 total,
 *      ordered by rank.
 *
 * All selection uses DISC-weighted column priority via `getOrderByClause()`.
 *
 * @param traitCode     Two-letter DISC combo e.g. "DI"
 * @param schoolStreamId  1 | 2 | 3 | undefined
 */
export async function getTopCollegesForStudent(
  traitCode: string,
  schoolStreamId: number | undefined,
): Promise<UniversityData[]> {
  logger.info(
    `[SchoolHelper] Fetching colleges for trait="${traitCode}" stream=${schoolStreamId ?? 'SSLC'}`,
  );

  if (process.env.MOCK_DB === 'true') {
    logger.info('[SchoolHelper] MOCK_DB — returning empty list');
    return [];
  }

  const primaryTrait = traitCode.charAt(0).toUpperCase();
  const orderBy = getOrderByClause(primaryTrait);
  const client = await getPool().connect();

  try {
    let query: string;
    let params: number[];

    if (schoolStreamId !== undefined) {
      // 1. Get all departments for this stream (id + name)
      const allDeptsRes = await client.query(
        `SELECT id, name FROM school_stream_departments WHERE school_stream_id = $1 ORDER BY display_order ASC`,
        [schoolStreamId],
      );
      const allDepts: { id: number; name: string }[] = allDeptsRes.rows;
      const totalDepts = allDepts.length;

      // 2. Check which departments actually have university data
      const availRes = await client.query(
        `SELECT DISTINCT ud.school_stream_department_id
                 FROM university_datas ud
                 JOIN school_stream_departments ssd ON ud.school_stream_department_id = ssd.id
                 WHERE ssd.school_stream_id = $1`,
        [schoolStreamId],
      );
      const availableIds = new Set<number>(
        (availRes.rows as { school_stream_department_id: number }[]).map(
          (r) => r.school_stream_department_id,
        ),
      );
      const availableDepts = availableIds.size;

      // 3. Determine missing department names for the common label
      const missingDeptNames = allDepts
        .filter((d) => !availableIds.has(d.id))
        .map((d) => d.name);
      const commonLabel =
        missingDeptNames.length > 0 ? missingDeptNames.join(' / ') : 'Common';

      logger.info(
        `[SchoolHelper] Stream ${schoolStreamId}: ${totalDepts} total depts, ${availableDepts} have university data. Missing: ${missingDeptNames.join(', ') || 'none'}`,
      );

      const LIMIT_PER_DEPT = 3;
      const OVERFETCH_MULTIPLIER = 3;
      const commonNeeded = (totalDepts - availableDepts) * LIMIT_PER_DEPT;

      // 4. Fetch extra rows from each available department so duplicates can be skipped
      const deptQuery = `
        SELECT ud.id, ud.school_stream_id, ud.school_stream_department_id, ud.institute_id, ud.name, ud.city,
               ud.score, ud.rank, ud.state, ud.tlr, ud.rpc, ud.go, ud.oi, ud.perception,
               ssd.name as department_name, ssd.display_order
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY school_stream_department_id
              ORDER BY ${orderBy}
            ) AS rn
          FROM university_datas
          WHERE school_stream_id = $1
         ) AS ud
         JOIN school_stream_departments ssd ON ud.school_stream_department_id = ssd.id
         WHERE ud.rn <= ${LIMIT_PER_DEPT * OVERFETCH_MULTIPLIER}
         ORDER BY ssd.display_order ASC, ${safeCast('ud.rank')} ASC;
       `;
      const deptResult = await client.query(deptQuery, [schoolStreamId]);
      const deptRows: UniversityData[] = deptResult.rows as UniversityData[];

      // 5. If gaps exist, fetch from common department (school_stream_department_id = 0)
      let commonRows: UniversityData[] = [];
      if (commonNeeded > 0) {
        logger.info(
          `[SchoolHelper] Fetching ${commonNeeded} common universities (dept 0) labeled as "${commonLabel}"`,
        );
        const commonQuery = `
          SELECT ud.id, ud.school_stream_id, ud.school_stream_department_id, ud.institute_id, ud.name, ud.city,
                 ud.score, ud.rank, ud.state, ud.tlr, ud.rpc, ud.go, ud.oi, ud.perception,
                 '${commonLabel.replace(/'/g, "''")}' as department_name, 0 as display_order
          FROM (
            SELECT *,
              ROW_NUMBER() OVER (
                ORDER BY ${orderBy}
              ) AS rn
            FROM university_datas
            WHERE school_stream_department_id = 0
          ) AS ud
           WHERE ud.rn <= ${commonNeeded * OVERFETCH_MULTIPLIER}
           ORDER BY ${safeCast('ud.rank')} ASC;
         `;
        const commonResult = await client.query(commonQuery);
        commonRows = commonResult.rows as UniversityData[];
      }

      // 6. Fill each department with the next unique college by name.
      const seenNames = new Set<string>();
      const dedupedRows: UniversityData[] = [];
      const deptGrouped = new Map<string, UniversityData[]>();
      const deptOrder: string[] = [];

      for (const row of deptRows) {
        const deptName = row.department_name ?? 'Common';
        if (!deptGrouped.has(deptName)) {
          deptGrouped.set(deptName, []);
          deptOrder.push(deptName);
        }
        deptGrouped.get(deptName).push(row);
      }

      const appendGroup = (groupRows: UniversityData[], limit: number) => {
        dedupedRows.push(...takeUniqueColleges(groupRows, limit, seenNames));
      };

      if (availableDepts <= 1 && commonRows.length > 0) {
        appendGroup(commonRows, commonNeeded);
      }

      for (const deptName of deptOrder) {
        appendGroup(deptGrouped.get(deptName) ?? [], LIMIT_PER_DEPT);
      }

      if (availableDepts > 1 && commonRows.length > 0) {
        appendGroup(commonRows, commonNeeded);
      }

      logger.info(
        `[SchoolHelper] Total unique institutions: ${dedupedRows.length} (${deptRows.length} ranked dept rows + ${commonRows.length} common rows fetched)`,
      );
      return dedupedRows;
    } else {
      // SSLC → top 5 per stream ... leaving this as is unless specified otherwise.
      // If they want field groupings for SSLC too, we shouldn't break the current grouping.
      // But we can join it just in case.
      query = `
        SELECT ud.id, ud.school_stream_id, ud.institute_id, ud.name, ud.city,
               ud.score, ud.rank, ud.state, ud.tlr, ud.rpc, ud.go, ud.oi, ud.perception
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY school_stream_id
              ORDER BY ${orderBy}
            ) AS rn
          FROM university_datas
          WHERE school_stream_id IN (1, 2, 3, 4, 5, 6)
        ) AS ud
        WHERE ud.rn <= 5
        ORDER BY ${safeCast('ud.rank')} ASC;
      `;
      params = [];
    }

    const result = await client.query(query, params);
    logger.info(
      `[SchoolHelper] Found ${result.rows.length} institutions for trait=${primaryTrait}`,
    );
    return result.rows as UniversityData[];
  } catch (err) {
    logger.error('[SchoolHelper] Error fetching university data', err);
    return [];
  } finally {
    client.release();
  }
}
