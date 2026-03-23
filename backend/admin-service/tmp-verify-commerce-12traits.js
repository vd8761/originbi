require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const TRAITS = ['DI', 'DS', 'DC', 'ID', 'IS', 'IC', 'SD', 'SI', 'SC', 'CD', 'CI', 'CS'];

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
    const byTrait = await client.query(
      `SELECT
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
       WHERE cr.department_degree_id = 21
         AND pt.code = ANY($1::text[])
         AND cr.is_active = true
         AND cr.is_deleted = false
       GROUP BY pt.code
       ORDER BY pt.code`,
      [TRAITS]
    );

    const totals = await client.query(
      `SELECT
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
       WHERE cr.department_degree_id = 21
         AND pt.code = ANY($1::text[])
         AND cr.is_active = true
         AND cr.is_deleted = false`,
      [TRAITS]
    );

    console.table(byTrait.rows);
    console.log('TOTAL:', totals.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
