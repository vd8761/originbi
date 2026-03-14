/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { getPool } from './dbPool';
import { logger } from './logger';

/**
 * Represents one row from the `university_datas` table.
 */
export interface UniversityData {
    id: number;
    school_stream_id: number;
    school_stream_field_id?: number;
    field_name?: string;
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
            // First, determine how many fields this stream has.
            const countRes = await client.query(
                `SELECT COUNT(*) as c FROM school_stream_fields WHERE stream_id = $1`,
                [schoolStreamId]
            );
            const fieldCount = parseInt(countRes.rows[0].c, 10);

            // Determine dynamically the number of colleges to show per field
            let limitPerField = 3;
            if (fieldCount === 1) limitPerField = 10;
            else if (fieldCount === 2) limitPerField = 5;
            else if (fieldCount === 3) limitPerField = 5;
            else if (fieldCount === 4) limitPerField = 4;

            // Distinct fetch: Top X colleges per field for the specific stream
            query = `
        SELECT ud.id, ud.school_stream_id, ud.school_stream_field_id, ud.institute_id, ud.name, ud.city,
               ud.score, ud.rank, ud.state, ud.tlr, ud.rpc, ud.go, ud.oi, ud.perception,
               ssf.name as field_name, ssf.display_order
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY school_stream_field_id
              ORDER BY ${orderBy}
            ) AS rn
          FROM university_datas
          WHERE school_stream_id = $1
        ) AS ud
        JOIN school_stream_fields ssf ON ud.school_stream_field_id = ssf.id
        WHERE ud.rn <= ${limitPerField}
        ORDER BY ssf.display_order ASC, ${safeCast('ud.rank')} ASC;
      `;
            params = [schoolStreamId];
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
