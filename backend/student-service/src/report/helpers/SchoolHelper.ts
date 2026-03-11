/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { getPool } from './dbPool';
import { logger } from './logger';

/**
 * Represents one row from the `university_datas` table.
 */
export interface UniversityData {
    id: number;
    school_stream_id: number;
    /** ENGINEERING | MEDICAL | RESEARCH (stream 1) or MANAGEMENT (stream 2) or LAW (stream 3) */
    school_group: string;
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
function getOrderByClause(primaryTrait: string): string {
    switch (primaryTrait.toUpperCase()) {
        case 'D':
            return 'CAST(go AS FLOAT) DESC, CAST(perception AS FLOAT) DESC';
        case 'I':
            return 'CAST(oi AS FLOAT) DESC, CAST(perception AS FLOAT) DESC';
        case 'S':
            return 'CAST(tlr AS FLOAT) DESC, CAST(oi AS FLOAT) DESC';
        case 'C':
            return 'CAST(rpc AS FLOAT) DESC, CAST(tlr AS FLOAT) DESC';
        default:
            return 'CAST(score AS FLOAT) DESC';
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

        if (schoolStreamId === 1) {
            // HSC Science stream → 5 per school_group (ENGINEERING, MEDICAL, RESEARCH)
            query = `
        SELECT id, school_stream_id, school_group, institute_id, name, city,
               score, rank, state, tlr, rpc, go, oi, perception
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY school_group
              ORDER BY ${orderBy}
            ) AS rn
          FROM university_datas
          WHERE school_stream_id = 1
            AND school_group IN ('ENGINEERING', 'MEDICAL', 'RESEARCH')
        ) AS ranked
        WHERE rn <= 5
        ORDER BY school_group ASC, CAST(rank AS FLOAT) ASC;
      `;
            params = [];
        } else if (schoolStreamId !== undefined) {
            // HSC Commerce (2) or Arts (3) → top 10 from that stream, ordered by rank
            query = `
        SELECT id, school_stream_id, school_group, institute_id, name, city,
               score, rank, state, tlr, rpc, go, oi, perception
        FROM (
          SELECT *
          FROM university_datas
          WHERE school_stream_id = $1
          ORDER BY ${orderBy}
          LIMIT 10
        ) AS top_ten
        ORDER BY CAST(rank AS FLOAT) ASC;
      `;
            params = [schoolStreamId];
        } else {
            // SSLC → top 5 per stream (1, 2, 3) → 15 total, ordered by rank
            query = `
        SELECT id, school_stream_id, school_group, institute_id, name, city,
               score, rank, state, tlr, rpc, go, oi, perception
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY school_stream_id
              ORDER BY ${orderBy}
            ) AS rn
          FROM university_datas
          WHERE school_stream_id IN (1, 2, 3)
        ) AS ranked
        WHERE rn <= 5
        ORDER BY CAST(rank AS FLOAT) ASC;
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
