import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'origin_user',
  password: process.env.DB_PASS || 'origin_pass',
  database: process.env.DB_NAME || 'origin_db',

  // Load all entities
  entities: [
    path.join(__dirname, 'entities/**/*.ts'),
  ],

  // Migrations
  migrations: [
    path.join(__dirname, 'migrations/**/*.ts'),
  ],

  synchronize: false,   // always false in production
  logging: true,
});
