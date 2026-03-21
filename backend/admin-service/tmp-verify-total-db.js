require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const TARGET_DEGREES = [21, 23, 38, 39, 40, 41];
const ALL_12_TRAITS = ['DI', 'DS', 'DC', 'ID', 'IS', 'IC', 'SD', 'SI', 'SC', 'CD', 'CI', 'CS'];

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const client = await pool.connect();

  try {
    const perDegree = await client.query(
      `SELECT
        dd.id AS degree_id,
        d.name AS department_name,
        dd.degree_type_id,
         COUNT(DISTINCT cr.id) AS roles,
         COUNT(DISTINCT g.id) AS guidance,
         COUNT(DISTINCT t.id) AS tools
       FROM department_degrees dd
       JOIN departments d ON d.id = dd.department_id
      JOIN degree_types dt ON dt.id = dd.degree_type_id
       LEFT JOIN career_roles cr
         ON cr.department_degree_id = dd.id
        AND cr.is_active = true
        AND cr.is_deleted = false
       LEFT JOIN career_role_guidance_sections g
         ON g.career_role_id = cr.id
        AND g.is_active = true
        AND g.is_deleted = false
       LEFT JOIN career_role_tools t
         ON t.career_role_id = cr.id
        AND t.is_active = true
        AND t.is_deleted = false
       WHERE dd.id = ANY($1::bigint[])
      GROUP BY dd.id, d.name, dd.degree_type_id
       ORDER BY dd.id`,
      [TARGET_DEGREES]
    );

    const traitCoverage = await client.query(
      `SELECT
         cr.department_degree_id AS degree_id,
         pt.code AS trait_code,
         COUNT(DISTINCT cr.id) AS roles,
         COUNT(DISTINCT g.id) AS guidance,
         COUNT(DISTINCT t.id) AS tools
       FROM career_roles cr
       JOIN personality_traits pt ON pt.id = cr.trait_id
       LEFT JOIN career_role_guidance_sections g
         ON g.career_role_id = cr.id
        AND g.is_active = true
        AND g.is_deleted = false
       LEFT JOIN career_role_tools t
         ON t.career_role_id = cr.id
        AND t.is_active = true
        AND t.is_deleted = false
       WHERE cr.department_degree_id = ANY($1::bigint[])
         AND pt.code = ANY($2::text[])
         AND cr.is_active = true
         AND cr.is_deleted = false
       GROUP BY cr.department_degree_id, pt.code
       ORDER BY cr.department_degree_id, pt.code`,
      [TARGET_DEGREES, ALL_12_TRAITS]
    );

    const integrityTarget = await client.query(
      `WITH role_checks AS (
         SELECT
           cr.department_degree_id,
           cr.id AS role_id,
           COUNT(DISTINCT g.id) AS guidance_rows,
           COUNT(DISTINCT t.id) AS tool_rows
         FROM career_roles cr
         LEFT JOIN career_role_guidance_sections g
           ON g.career_role_id = cr.id
          AND g.is_active = true
          AND g.is_deleted = false
         LEFT JOIN career_role_tools t
           ON t.career_role_id = cr.id
          AND t.is_active = true
          AND t.is_deleted = false
         WHERE cr.department_degree_id = ANY($1::bigint[])
           AND cr.is_active = true
           AND cr.is_deleted = false
         GROUP BY cr.department_degree_id, cr.id
       )
       SELECT
         department_degree_id,
         COUNT(*) AS total_roles,
         COUNT(*) FILTER (WHERE guidance_rows = 1) AS roles_with_1_guidance,
         COUNT(*) FILTER (WHERE tool_rows = 5) AS roles_with_5_tools
       FROM role_checks
       GROUP BY department_degree_id
       ORDER BY department_degree_id`,
      [TARGET_DEGREES]
    );

    const structuredCheck2123 = await client.query(
      `WITH role_checks AS (
         SELECT
           cr.department_degree_id,
           cr.id AS role_id,
           MAX(CASE WHEN g.section_content IS NOT NULL THEN jsonb_array_length(g.section_content) ELSE 0 END) AS top_sections,
           COUNT(*) FILTER (
             WHERE EXISTS (
               SELECT 1
               FROM jsonb_array_elements(g.section_content) e
               WHERE e->>'title' = 'Detailed Guidelines'
                 AND jsonb_typeof(e->'content') = 'array'
             )
           ) AS has_detailed
         FROM career_roles cr
         LEFT JOIN career_role_guidance_sections g
           ON g.career_role_id = cr.id
          AND g.is_active = true
          AND g.is_deleted = false
         WHERE cr.department_degree_id = ANY($1::bigint[])
           AND cr.is_active = true
           AND cr.is_deleted = false
         GROUP BY cr.department_degree_id, cr.id
       )
       SELECT
         department_degree_id,
         COUNT(*) AS total_roles,
         COUNT(*) FILTER (WHERE top_sections = 5) AS roles_with_5_top_sections,
         COUNT(*) FILTER (WHERE has_detailed > 0) AS roles_with_detailed_guidelines
       FROM role_checks
       GROUP BY department_degree_id
       ORDER BY department_degree_id`,
      [[21, 23]]
    );

    const globalTotals = await client.query(
      `SELECT
         COUNT(DISTINCT cr.id) AS total_roles,
         COUNT(DISTINCT g.id) AS total_guidance,
         COUNT(DISTINCT t.id) AS total_tools
       FROM career_roles cr
       LEFT JOIN career_role_guidance_sections g
         ON g.career_role_id = cr.id
        AND g.is_active = true
        AND g.is_deleted = false
       LEFT JOIN career_role_tools t
         ON t.career_role_id = cr.id
        AND t.is_active = true
        AND t.is_deleted = false
       WHERE cr.is_active = true
         AND cr.is_deleted = false`
    );

    console.log('=== PER DEGREE TOTALS (TARGET DEGREES) ===');
    console.table(perDegree.rows);

    console.log('=== TRAIT COVERAGE (TARGET DEGREES) ===');
    console.table(traitCoverage.rows);

    console.log('=== INTEGRITY CHECK (TARGET DEGREES) ===');
    console.table(integrityTarget.rows);

    console.log('=== STRUCTURE CHECK (DEGREE 21 & 23) ===');
    console.table(structuredCheck2123.rows);

    console.log('=== GLOBAL DB TOTALS (ALL ACTIVE ROLES) ===');
    console.log(globalTotals.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
