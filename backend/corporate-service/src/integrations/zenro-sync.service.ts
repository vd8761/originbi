import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantAppConfig } from '@originbi/shared-entities';
import * as mysql from 'mysql2/promise';
import * as crypto from 'crypto';

// Decryption helper
function getEncryptionKey(): string {
  let key =
    process.env.ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;
  if (key) {
    key = key.replace(/^"|"$/g, '').trim(); // Remove surrounding quotes just in case
  }
  if (!key || key.length !== 32) {
    console.error(
      `[FATAL] ENCRYPTION_KEY invalid. Length is ${key?.length || 0}. Expected 32.`,
    );
    throw new Error(
      'ENCRYPTION_KEY must be set and exactly 32 characters long in your .env file.',
    );
  }
  return key;
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(getEncryptionKey()),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

@Injectable()
export class ZenroSyncService implements OnModuleInit {
  private readonly logger = new Logger(ZenroSyncService.name);

  constructor(
    @InjectRepository(TenantAppConfig)
    private tenantAppConfigRepo: Repository<TenantAppConfig>,
    private dataSource: DataSource, // OriginBI PostgreSQL connection
  ) {}

  onModuleInit() {
    this.logger.log(
      '🔥 TEST MODE: Running Zenro Sync in background on startup...',
    );
    // Run asynchronously so it doesn't block server startup
    this.syncAllZenroTenants().catch((err) => {
      this.logger.error('Failed to run background Zenro sync on startup', err);
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('🚀 Starting Automated Schema Mirror for Zenro Payroll...');
    await this.syncAllZenroTenants();
  }

  async syncAllZenroTenants() {
    const configs = await this.tenantAppConfigRepo
      .createQueryBuilder('config')
      .innerJoinAndSelect('config.app', 'masterApp')
      .where('masterApp.name = :appName', { appName: 'zenro_payroll' })
      .andWhere('config.status = :status', { status: 'connected' })
      .getMany();

    this.logger.log(
      `Found ${configs.length} active Zenro integrations to sync.`,
    );
    for (const config of configs) {
      try {
        await this.syncTenant(config);
      } catch (err: any) {
        this.logger.error(
          `Failed to sync Zenro for tenant ${config.tenant_id}: ${err.message}`,
        );
      }
    }
  }

  private async syncTenant(config: TenantAppConfig) {
    const features = config.configured_features || {};
    if (!features.db_host || !features.db_user || !features.db_pass) return;

    this.logger.log(
      `🔄 Syncing Zenro (Read-Only) for tenant ${config.tenant_id}...`,
    );

    // 1. Connect strictly READ-ONLY to remote MySQL
    const password = decrypt(features.db_pass);

    // DEBUG: Log connection parameters so the user can verify what is currently in the DB
    this.logger.debug(`[DEBUG] Attempting connection with:
      Host: ${features.db_host}
      Port: ${features.db_port || '3306'}
      User: ${features.db_user}
      Database: ${features.db_name}
      Password length: ${password?.length} characters (Starts with: ${password?.substring(0, 3)}...)
    `);

    const remoteDb = await mysql.createConnection({
      host: features.db_host,
      port: parseInt(features.db_port || '3306'),
      user: features.db_user,
      password: password,
      database: features.db_name,
    });

    const schemaName = `zenro_tenant_${config.tenant_id}`;
    const tempSchemaName = `${schemaName}_temp`;

    // 2. Setup safe, isolated PostgreSQL schema in OriginBI
    await this.dataSource.query(
      `DROP SCHEMA IF EXISTS ${tempSchemaName} CASCADE;`,
    );
    await this.dataSource.query(`CREATE SCHEMA ${tempSchemaName};`);

    // 3. Discover N Tables automatically
    const [tablesRow] = await remoteDb.query('SHOW TABLES');
    const tables = (tablesRow as any[]).map(
      (row) => Object.values(row)[0] as string,
    );
    this.logger.log(
      `📋 Discovered ${tables.length} tables. Mirroring to PostgreSQL schema: ${tempSchemaName}`,
    );

    // 4. Safely map MySQL types to Postgres types
    for (const table of tables) {
      const [columns] = await remoteDb.query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE table_schema = ? AND table_name = ?`,
        [features.db_name, table],
      );

      let createTableQuery = `CREATE TABLE ${tempSchemaName}.${table} (`;
      const colDefs: string[] = [];
      const colNames: string[] = [];

      for (const col of columns as any[]) {
        const type = col.DATA_TYPE.toLowerCase();
        let pgType = 'TEXT';
        if (type.includes('int')) pgType = 'INTEGER';
        else if (
          type.includes('decimal') ||
          type.includes('float') ||
          type.includes('double')
        )
          pgType = 'NUMERIC';
        else if (type.includes('datetime') || type.includes('timestamp'))
          pgType = 'TIMESTAMP';
        else if (type.includes('date')) pgType = 'DATE';
        else if (type.includes('time'))
          pgType = 'TEXT'; // MySQL allows negative TIME (e.g. "-09:30:00"), PG TIME does not. Use TEXT.
        else if (type.includes('bool') || type.includes('tinyint'))
          pgType = 'BOOLEAN';

        // Escape reserved words safely in quotes
        colDefs.push(`"${col.COLUMN_NAME}" ${pgType}`);
        colNames.push(col.COLUMN_NAME);
      }
      createTableQuery += colDefs.join(', ') + ');';

      // Create PostgreSQL table
      await this.dataSource.query(createTableQuery);

      // 5. Safely copy rows in chunks to prevent Out of Memory errors
      let offset = 0;
      const fetchBatchSize = 10000;
      let hasMore = true;
      let totalRows = 0;

      while (hasMore) {
        const [rows] = await remoteDb.query(
          `SELECT * FROM ${table} LIMIT ${fetchBatchSize} OFFSET ${offset}`,
        );
        const batchRows = rows as any[];

        if (batchRows.length === 0) {
          hasMore = false;
          break;
        }

        totalRows += batchRows.length;
        const BATCH_SIZE = 100;
        for (let i = 0; i < batchRows.length; i += BATCH_SIZE) {
          const insertBatch = batchRows.slice(i, i + BATCH_SIZE);
          const values: any[] = [];
          const placeholders: string[] = [];
          let paramIndex = 1;

          for (const row of insertBatch) {
            const rowPlaceholders: string[] = [];
            for (const colName of colNames) {
              values.push(row[colName] ?? null);
              rowPlaceholders.push(`$${paramIndex++}`);
            }
            placeholders.push(`(${rowPlaceholders.join(',')})`);
          }

          const insertQuery = `INSERT INTO ${tempSchemaName}.${table} ("${colNames.join('","')}") VALUES ${placeholders.join(',')}`;
          await this.dataSource.query(insertQuery, values);
        }

        offset += fetchBatchSize;
        if (batchRows.length < fetchBatchSize) {
          hasMore = false;
        }
      }
      this.logger.log(`  -> Synced table: ${table} (${totalRows} rows)`);
    }

    await remoteDb.end();

    // 6. Zero Downtime Swap: Safely replace the old schema with the new mirrored schema
    await this.dataSource.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`);
    await this.dataSource.query(
      `ALTER SCHEMA ${tempSchemaName} RENAME TO ${schemaName};`,
    );

    // 7. Update Last Sync Time
    const currentFeatures = config.configured_features || {};
    config.configured_features = {
      ...currentFeatures,
      lastSyncAt: new Date().toISOString(),
    };
    await this.tenantAppConfigRepo.save(config);

    this.logger.log(
      `✅ Successfully securely mirrored Zenro DB into PostgreSQL Schema: ${schemaName}`,
    );
  }
}
