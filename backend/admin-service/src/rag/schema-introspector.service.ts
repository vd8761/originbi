/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              SCHEMA INTROSPECTOR SERVICE                                  ║
 * ║     Auto-discovers database schema from the live database                ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  - No hardcoded schema — always in sync with the real DB                ║
 * ║  - Caches at startup, refreshes periodically                            ║
 * ║  - Includes table relationships (foreign keys)                          ║
 * ║  - Provides sample data hints for LLM context                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
  rowCount: number;
  primaryKey: string | null;
  foreignKeys: ForeignKeyInfo[];
  sampleValues: Record<string, string[]>;
}

interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isEnum: boolean;
  enumValues: string[];
}

interface ForeignKeyInfo {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

@Injectable()
export class SchemaIntrospectorService implements OnModuleInit {
  private readonly logger = new Logger('SchemaIntrospector');
  private schemaCache: Map<string, TableInfo> = new Map();
  private schemaText: string = '';
  private compactSchemaText: string = '';
  private lastRefresh: Date | null = null;

  // Refresh schema every 6 hours (it rarely changes)
  private readonly REFRESH_INTERVAL = 6 * 60 * 60 * 1000;

  // Tables relevant to the application (skip pg_* internal tables)
  private readonly RELEVANT_TABLES = [
    'users', 'registrations', 'assessment_attempts', 'assessment_answers',
    'assessment_sessions', 'assessment_questions', 'assessment_question_options',
    'personality_traits', 'programs', 'career_roles', 'career_role_tools',
    'trait_based_course_details', 'departments', 'department_degrees', 'degree_types',
    'corporate_accounts', 'groups', 'group_assessments', 'open_questions', 'open_question_options',
    'affiliate_accounts', 'affiliate_referral_transactions', 'affiliate_settlement_transactions',
  ];

  // Columns that contain sensitive PII — never include sample values
  private readonly SENSITIVE_COLUMNS = new Set([
    'password', 'password_hash', 'token', 'secret', 'api_key',
    'mobile_number', 'phone', 'cognito_sub', 'refresh_token',
  ]);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.refreshSchema();
      this.logger.log('✅ Schema introspection complete');

      // Schedule periodic refresh
      setInterval(() => this.refreshSchema(), this.REFRESH_INTERVAL);
    } catch (err) {
      this.logger.error(`❌ Schema introspection failed: ${err.message}`);
    }
  }

  /**
   * Get the full schema description for LLM prompts
   */
  getSchemaText(): string {
    return this.schemaText;
  }

  /**
   * Get a compact schema (table + columns only, no samples) for token-constrained prompts
   */
  getCompactSchemaText(): string {
    return this.compactSchemaText;
  }

  /**
   * Get info about a specific table
   */
  getTableInfo(tableName: string): TableInfo | undefined {
    return this.schemaCache.get(tableName);
  }

  /**
   * Get all table names
   */
  getTableNames(): string[] {
    return Array.from(this.schemaCache.keys());
  }

  /**
   * Check if a table exists in our schema
   */
  hasTable(tableName: string): boolean {
    return this.schemaCache.has(tableName);
  }

  /**
   * Refresh the schema cache by querying the live database
   */
  async refreshSchema(): Promise<void> {
    const startTime = Date.now();
    this.schemaCache.clear();

    // 1. Discover which of our relevant tables actually exist
    const existingTables = await this.dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name = ANY($1)
      ORDER BY table_name
    `, [this.RELEVANT_TABLES]);

    const tableNames: string[] = existingTables.map((r: any) => r.table_name);

    // 2. For each table, get columns, FKs, row count, and sample enum values
    for (const tableName of tableNames) {
      try {
        const tableInfo = await this.introspectTable(tableName);
        this.schemaCache.set(tableName, tableInfo);
      } catch (err) {
        this.logger.warn(`⚠️ Failed to introspect ${tableName}: ${err.message}`);
      }
    }

    // 3. Build the text representations
    this.schemaText = this.buildFullSchemaText();
    this.compactSchemaText = this.buildCompactSchemaText();
    this.lastRefresh = new Date();

    const elapsed = Date.now() - startTime;
    this.logger.log(`📊 Introspected ${this.schemaCache.size} tables in ${elapsed}ms`);
  }

  /**
   * Introspect a single table: columns, FKs, row count, enum-like values
   */
  private async introspectTable(tableName: string): Promise<TableInfo> {
    // Get columns
    const columns = await this.dataSource.query(`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.udt_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = $1
      ORDER BY c.ordinal_position
    `, [tableName]);

    // Get primary key
    const pkResult = await this.dataSource.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
      LIMIT 1
    `, [tableName]);

    // Get foreign keys
    const fkResults = await this.dataSource.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
    `, [tableName]);

    // Get approximate row count (fast — uses pg statistics)
    const countResult = await this.dataSource.query(`
      SELECT reltuples::bigint AS estimate
      FROM pg_class
      WHERE relname = $1
    `, [tableName]);
    const rowCount = parseInt(countResult[0]?.estimate || '0', 10);

    // Build column infos and discover enum-like columns
    const columnInfos: ColumnInfo[] = [];
    const sampleValues: Record<string, string[]> = {};

    for (const col of columns) {
      const colInfo: ColumnInfo = {
        name: col.column_name,
        dataType: this.normalizeDataType(col.data_type, col.udt_name),
        isNullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        isEnum: false,
        enumValues: [],
      };

      // For varchar/text columns with low cardinality, sample distinct values
      // This helps the LLM know valid values (e.g., status = 'COMPLETED' | 'INCOMPLETE')
      if (!this.SENSITIVE_COLUMNS.has(col.column_name) &&
          ['character varying', 'varchar', 'text'].includes(col.data_type) &&
          !col.column_name.endsWith('_desc') &&
          !col.column_name.endsWith('_description') &&
          !col.column_name.includes('text')) {
        try {
          const distinctVals = await this.dataSource.query(`
            SELECT DISTINCT "${col.column_name}" AS val
            FROM "${tableName}"
            WHERE "${col.column_name}" IS NOT NULL
            LIMIT 15
          `);
          if (distinctVals.length <= 12 && distinctVals.length > 0) {
            const vals = distinctVals.map((r: any) => String(r.val)).filter((v: string) => v.length < 50);
            if (vals.length > 0 && vals.length <= 12) {
              colInfo.isEnum = true;
              colInfo.enumValues = vals;
              sampleValues[col.column_name] = vals;
            }
          }
        } catch { /* skip if column is unusual */ }
      }

      // For boolean columns, mark as enum with true/false
      if (col.data_type === 'boolean') {
        colInfo.isEnum = true;
        colInfo.enumValues = ['true', 'false'];
      }

      columnInfos.push(colInfo);
    }

    return {
      tableName,
      columns: columnInfos,
      rowCount,
      primaryKey: pkResult[0]?.column_name || null,
      foreignKeys: fkResults.map((fk: any) => ({
        column: fk.column_name,
        referencesTable: fk.foreign_table_name,
        referencesColumn: fk.foreign_column_name,
      })),
      sampleValues,
    };
  }

  /**
   * Build a full schema description for the LLM prompt (with enums, FKs, sample values)
   */
  private buildFullSchemaText(): string {
    const lines: string[] = [
      '═══ ORIGINBI DATABASE SCHEMA (auto-introspected) ═══',
      '',
    ];

    for (const [, table] of this.schemaCache) {
      lines.push(`TABLE: ${table.tableName} (~${table.rowCount} rows)`);

      // Columns
      for (const col of table.columns) {
        let colDesc = `  - ${col.name} (${col.dataType})`;
        if (!col.isNullable) colDesc += ' NOT NULL';
        if (col.isEnum && col.enumValues.length > 0) {
          colDesc += ` VALUES: [${col.enumValues.join(', ')}]`;
        }
        lines.push(colDesc);
      }

      // Foreign keys
      if (table.foreignKeys.length > 0) {
        lines.push('  FOREIGN KEYS:');
        for (const fk of table.foreignKeys) {
          lines.push(`    ${fk.column} → ${fk.referencesTable}.${fk.referencesColumn}`);
        }
      }

      lines.push('');
    }

    // Add domain-specific notes the LLM needs to know
    lines.push('═══ DOMAIN RULES ═══');
    lines.push('- "candidates" and "students" both refer to the registrations table');
    lines.push('- Use registrations.full_name for person name searches (ILIKE for partial, ~* for regex)');
    lines.push('- career_roles uses career_role_name (NOT name) and short_description (NOT description)');
    lines.push('- Always filter is_deleted = false where the column exists');
    lines.push('- Assessment results: JOIN assessment_attempts ON registration_id = registrations.id');
    lines.push('- Personality info: JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id');
    lines.push('- Corporate scoping: registrations.corporate_account_id = <corporate_id>');
    lines.push('- Student scoping: registrations.user_id = <user_id>');
    lines.push('- For gender queries: registrations.gender column (values: MALE, FEMALE)');
    lines.push('- assessment_attempts.status values: COMPLETED, IN_PROGRESS, ABANDONED');
    lines.push('- registrations.status values: COMPLETED, INCOMPLETE, CANCELLED');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build a compact schema (just table.columns) for token-efficient prompts
   */
  private buildCompactSchemaText(): string {
    const lines: string[] = [];

    for (const [, table] of this.schemaCache) {
      const colNames = table.columns.map(c => {
        let name = c.name;
        if (c.isEnum && c.enumValues.length > 0 && c.enumValues.length <= 5) {
          name += `[${c.enumValues.join('|')}]`;
        }
        return name;
      });
      lines.push(`${table.tableName}: ${colNames.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Normalize PostgreSQL data types to readable names
   */
  private normalizeDataType(dataType: string, udtName: string): string {
    if (udtName === 'int4' || udtName === 'int8') return 'integer';
    if (udtName === 'float4' || udtName === 'float8') return 'decimal';
    if (udtName === 'bool') return 'boolean';
    if (udtName === 'timestamptz' || dataType.includes('timestamp')) return 'timestamp';
    if (dataType === 'character varying') return 'varchar';
    if (dataType === 'ARRAY') return 'array';
    if (udtName === 'jsonb' || udtName === 'json') return 'jsonb';
    if (udtName === 'numeric') return 'decimal';
    return dataType;
  }

  /**
   * Get the RBAC-relevant tables that apply to each role
   */
  getRbacTableInfo(): Record<string, { scopeColumn: string; description: string }> {
    return {
      'registrations': { scopeColumn: 'corporate_account_id', description: 'Scoped by corporate_account_id for CORPORATE, user_id for STUDENT' },
      'assessment_attempts': { scopeColumn: 'registration_id', description: 'Scoped via JOIN to registrations' },
      'assessment_answers': { scopeColumn: 'assessment_attempt_id', description: 'Scoped via JOIN to assessment_attempts → registrations' },
      'assessment_sessions': { scopeColumn: 'program_id', description: 'Admin only' },
      'groups': { scopeColumn: 'corporate_account_id', description: 'Scoped by corporate_account_id' },
      'group_assessments': { scopeColumn: 'corporate_account_id', description: 'Scoped by corporate_account_id' },
    };
  }
}
