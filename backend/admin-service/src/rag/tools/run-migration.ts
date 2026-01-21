/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-floating-promises */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runMigration() {
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
    console.log('Connected to database');

    // Read migration file - correct path (relative to originbi root)
    const migrationPath = path.resolve(
      process.cwd(),
      '../database/migrations/001_rag_pgvector.sql',
    );

    if (!fs.existsSync(migrationPath)) {
      console.log('Migration file not found at:', migrationPath);
      console.log('Trying alternate path...');

      // Try alternate path from project root
      const altPath =
        'c:/Users/Jaya Krishna/Desktop/OriginBi/originbi/database/migrations/001_rag_pgvector.sql';
      if (fs.existsSync(altPath)) {
        console.log('Found at alternate path');
        const sql = fs.readFileSync(altPath, 'utf-8');
        console.log('Running pgvector migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');
      } else {
        console.log('Migration file not found');
        return;
      }
    } else {
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      console.log('Running pgvector migration...');
      await client.query(sql);
      console.log('Migration completed successfully!');
    }

    // Verify tables
    const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE 'rag_%'
        `);
    console.log(
      'Created RAG tables:',
      tables.rows.map((r) => r.table_name),
    );
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.end();
  }
}

runMigration();
