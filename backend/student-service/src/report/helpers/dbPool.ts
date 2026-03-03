/* eslint-disable @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Pool } from 'pg';

/**
 * Shared PostgreSQL connection pool for the report helpers.
 * Both sqlHelper and groupReportHelper import from here to avoid
 * creating duplicate pool instances.
 */
const getPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    };
  }
  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS || '',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };
};

let poolInstance: Pool | null = null;

export const getPool = (): Pool => {
  if (!poolInstance) {
    poolInstance = new Pool(getPoolConfig());
  }
  return poolInstance;
};
