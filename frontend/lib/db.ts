// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

let sql: any;

if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('neon.tech')) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  sql = neon(process.env.DATABASE_URL);
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://origin_user:origin_pass@localhost:5432/originbi',
  });
  
  sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    let query = strings[0];
    for (let i = 1; i < strings.length; i++) {
      query += `$${i}` + strings[i];
    }
    const res = await pool.query(query, values);
    return res.rows;
  };
}

export { sql };
