/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-floating-promises */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectDb() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    const tablesOfInterest = [
      'registrations',
      'career_roles',
      'career_role_tools',
      'trait_based_course_details',
    ];

    const sql = `
            SELECT 
                table_name,
                column_name,
                data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = ANY($1)
            ORDER BY table_name, ordinal_position;
        `;

    const result = await client.query(sql, [tablesOfInterest]);

    console.log('\n=== DETAILED SCHEMA ===\n');
    let currentTable = '';
    for (const row of result.rows) {
      if (row.table_name !== currentTable) {
        console.log(`\nTABLE: ${row.table_name}`);
        currentTable = row.table_name;
      }
      console.log(`  - ${row.column_name} (${row.data_type})`);
    }
    console.log('\n=======================\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

inspectDb();
