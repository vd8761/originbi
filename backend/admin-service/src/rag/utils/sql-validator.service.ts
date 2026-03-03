/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    SQL VALIDATOR & SANITIZER                              ║
 * ║         Security layer for LLM-generated SQL queries                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  RULES:                                                                   ║
 * ║  1. ONLY SELECT statements are allowed                                   ║
 * ║  2. No DDL (CREATE, ALTER, DROP, TRUNCATE)                               ║
 * ║  3. No DML (INSERT, UPDATE, DELETE)                                       ║
 * ║  4. No system catalog access (pg_*, information_schema)                   ║
 * ║  5. No subqueries that modify data                                        ║
 * ║  6. Enforce row limits                                                    ║
 * ║  7. Auto-inject RBAC WHERE clauses based on user role                    ║
 * ║  8. Whitelist tables per role                                             ║
 * ║  9. Block sensitive column access per role                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedSql: string;
  error?: string;
  warnings: string[];
}

@Injectable()
export class SqlValidatorService {
  private readonly logger = new Logger('SqlValidator');

  // Absolute maximum rows to prevent memory issues
  private readonly MAX_ROW_LIMIT = 200;
  private readonly DEFAULT_ROW_LIMIT = 50;

  // ─── FORBIDDEN PATTERNS ───
  // These patterns are NEVER allowed in any SQL query, regardless of role.
  private readonly FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
    // DDL
    { pattern: /\b(CREATE|ALTER|DROP|TRUNCATE|RENAME)\b/i, reason: 'DDL statements are not allowed' },
    // DML
    { pattern: /\b(INSERT|UPDATE|DELETE|MERGE|UPSERT)\b/i, reason: 'Data modification is not allowed' },
    // Dangerous operations
    { pattern: /\b(GRANT|REVOKE|EXECUTE|CALL)\b/i, reason: 'Administrative operations are not allowed' },
    // Transaction control
    { pattern: /\b(BEGIN|COMMIT|ROLLBACK|SAVEPOINT)\b/i, reason: 'Transaction control is not allowed' },
    // System access
    { pattern: /\bpg_(catalog|stat|class|proc|namespace|extension)/i, reason: 'System catalog access is not allowed' },
    { pattern: /\binformation_schema\b/i, reason: 'information_schema access is not allowed' },
    // Copy/export
    { pattern: /\b(COPY|LOAD|IMPORT)\b/i, reason: 'Data import/export is not allowed' },
    // Functions that could be dangerous
    { pattern: /\b(pg_sleep|pg_terminate|pg_cancel|dblink|lo_import|lo_export)\b/i, reason: 'Dangerous function call blocked' },
    // Multiple statements (SQL injection via semicolon)
    { pattern: /;\s*\S/i, reason: 'Multiple statements are not allowed' },
    // Comment injection
    { pattern: /--.*\b(DROP|DELETE|INSERT|UPDATE|TRUNCATE)\b/i, reason: 'Suspicious comment detected' },
    // Into (SELECT INTO creates tables)
    { pattern: /\bSELECT\b[^;]*\bINTO\b\s+(?!TEMP|TEMPORARY)/i, reason: 'SELECT INTO is not allowed' },
  ];

  // ─── TABLE ACCESS PER ROLE ───
  private readonly ROLE_TABLE_ACCESS: Record<string, Set<string>> = {
    ADMIN: new Set([
      'users', 'registrations', 'assessment_attempts', 'assessment_answers',
      'assessment_sessions', 'assessment_questions', 'assessment_question_options',
      'personality_traits', 'programs', 'career_roles', 'career_role_tools',
      'trait_based_course_details', 'departments', 'department_degrees', 'degree_types',
      'corporate_accounts', 'groups', 'open_questions', 'open_question_options',
      'affiliate_accounts', 'affiliate_referral_transactions', 'affiliate_settlement_transactions',
    ]),
    CORPORATE: new Set([
      'registrations', 'assessment_attempts', 'assessment_answers',
      'personality_traits', 'programs', 'career_roles', 'career_role_tools',
      'trait_based_course_details', 'departments', 'department_degrees', 'degree_types',
      'corporate_accounts', 'groups',
    ]),
    STUDENT: new Set([
      'registrations', 'assessment_attempts', 'assessment_answers',
      'personality_traits', 'programs', 'career_roles', 'career_role_tools',
      'trait_based_course_details', 'departments', 'department_degrees', 'degree_types',
    ]),
    AFFILIATE: new Set([
      'affiliate_accounts', 'affiliate_referral_transactions', 'affiliate_settlement_transactions',
      'registrations', 'programs',
    ]),
  };

  // ─── SENSITIVE COLUMNS PER ROLE ───
  // Columns that non-admin roles should NOT be able to read
  private readonly RESTRICTED_COLUMNS: Record<string, Set<string>> = {
    CORPORATE: new Set(['cognito_sub', 'password_hash', 'mobile_number']),
    STUDENT: new Set(['cognito_sub', 'password_hash', 'mobile_number', 'corporate_account_id']),
    AFFILIATE: new Set(['cognito_sub', 'password_hash', 'mobile_number']),
  };

  /**
   * Validate and sanitize an LLM-generated SQL query.
   * Returns a cleaned-up, safe query or an error.
   */
  validate(sql: string, user: UserContext): ValidationResult {
    const warnings: string[] = [];

    if (!sql || typeof sql !== 'string') {
      return { isValid: false, sanitizedSql: '', error: 'Empty or invalid SQL', warnings };
    }

    // Step 0: Clean up the SQL (remove markdown code fences, extra whitespace)
    let cleaned = sql
      .replace(/^```sql?\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^\s*--.*$/gm, '') // remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
      .trim();

    // Remove trailing semicolon (we'll execute without it)
    cleaned = cleaned.replace(/;\s*$/, '').trim();

    // Step 1: Must start with SELECT (or WITH for CTEs)
    if (!/^\s*(SELECT|WITH)\b/i.test(cleaned)) {
      return { isValid: false, sanitizedSql: '', error: 'Only SELECT queries are allowed. The query must start with SELECT or WITH.', warnings };
    }

    // Step 2: Check forbidden patterns
    for (const { pattern, reason } of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(cleaned)) {
        this.logger.warn(`🚫 SQL blocked: ${reason} | SQL: ${cleaned.substring(0, 100)}`);
        return { isValid: false, sanitizedSql: '', error: reason, warnings };
      }
    }

    // Step 3: Extract and validate table references
    const tablesUsed = this.extractTableNames(cleaned);
    const allowedTables = this.ROLE_TABLE_ACCESS[user.role] || this.ROLE_TABLE_ACCESS['STUDENT'];

    for (const table of tablesUsed) {
      if (!allowedTables.has(table)) {
        this.logger.warn(`🚫 Table access denied: ${user.role} cannot access ${table}`);
        return {
          isValid: false,
          sanitizedSql: '',
          error: `Access denied: You don't have permission to query the "${table}" table.`,
          warnings,
        };
      }
    }

    // Step 4: Check for restricted columns
    const restrictedCols = this.RESTRICTED_COLUMNS[user.role];
    if (restrictedCols) {
      for (const col of restrictedCols) {
        // Check if the column is explicitly selected (not just in a WHERE)
        const selectRegex = new RegExp(`\\bSELECT\\b[^]*?\\b${col}\\b[^]*?\\bFROM\\b`, 'i');
        if (selectRegex.test(cleaned)) {
          warnings.push(`Sensitive column "${col}" removed from SELECT`);
          // Replace the column reference with a placeholder
          cleaned = cleaned.replace(new RegExp(`\\b${col}\\b`, 'gi'), "'[REDACTED]'");
        }
      }
    }

    // Step 5: Inject RBAC WHERE clauses
    cleaned = this.injectRbacFilters(cleaned, user, tablesUsed, warnings);

    // Step 6: Enforce row limit
    cleaned = this.enforceRowLimit(cleaned, warnings);

    // Step 7: Final safety check — re-verify no forbidden patterns after transformation
    for (const { pattern, reason } of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(cleaned)) {
        return { isValid: false, sanitizedSql: '', error: `Post-transform safety check failed: ${reason}`, warnings };
      }
    }

    this.logger.log(`✅ SQL validated (${tablesUsed.join(', ')}) for ${user.role}`);
    return { isValid: true, sanitizedSql: cleaned, warnings };
  }

  /**
   * Extract table names referenced in the SQL query
   */
  private extractTableNames(sql: string): string[] {
    const tables = new Set<string>();

    // Match FROM and JOIN clauses
    const patterns = [
      /\bFROM\s+\"?(\w+)\"?/gi,
      /\bJOIN\s+\"?(\w+)\"?/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(sql)) !== null) {
        const tableName = match[1].toLowerCase();
        // Skip common SQL keywords that could be falsely matched
        if (!['select', 'where', 'and', 'or', 'not', 'in', 'as', 'on', 'by', 'order', 'group', 'having', 'limit', 'offset', 'union', 'case', 'when', 'then', 'else', 'end'].includes(tableName)) {
          tables.add(tableName);
        }
      }
    }

    return Array.from(tables);
  }

  /**
   * Inject role-based access control WHERE clauses into the query.
   * 
   * ADMIN: Only add is_deleted = false where applicable
   * CORPORATE: Add corporate_account_id filter on registrations/groups
   * STUDENT: Add user_id filter to see only own data
   */
  private injectRbacFilters(sql: string, user: UserContext, tables: string[], warnings: string[]): string {
    if (user.role === 'ADMIN') {
      // Admin sees everything (just ensure is_deleted = false is respected)
      return this.ensureDeletedFilter(sql, tables);
    }

    if (user.role === 'CORPORATE' && user.corporateId) {
      // Corporate: scope to their corporate_account_id
      if (tables.includes('registrations')) {
        sql = this.injectWhereClause(sql, 'registrations', `corporate_account_id = ${user.corporateId}`);
        warnings.push('RBAC: Scoped to your corporate account');
      }
      if (tables.includes('groups')) {
        sql = this.injectWhereClause(sql, 'groups', `corporate_account_id = ${user.corporateId}`);
      }
      // If querying assessment_attempts without registrations, add a subquery scope
      if (tables.includes('assessment_attempts') && !tables.includes('registrations')) {
        sql = this.injectWhereClause(sql, 'assessment_attempts',
          `registration_id IN (SELECT id FROM registrations WHERE corporate_account_id = ${user.corporateId} AND is_deleted = false)`);
      }
      return this.ensureDeletedFilter(sql, tables);
    }

    if (user.role === 'STUDENT') {
      // Student: scope to their own user_id
      if (tables.includes('registrations')) {
        sql = this.injectWhereClause(sql, 'registrations', `user_id = ${user.id}`);
        warnings.push('RBAC: Scoped to your personal data');
      }
      if (tables.includes('assessment_attempts') && !tables.includes('registrations')) {
        sql = this.injectWhereClause(sql, 'assessment_attempts',
          `registration_id IN (SELECT id FROM registrations WHERE user_id = ${user.id} AND is_deleted = false)`);
      }
      return this.ensureDeletedFilter(sql, tables);
    }

    if (user.role === 'AFFILIATE' && user.affiliateId) {
      if (tables.includes('affiliate_accounts')) {
        sql = this.injectWhereClause(sql, 'affiliate_accounts', `id = ${user.affiliateId}`);
      }
      if (tables.includes('affiliate_referral_transactions')) {
        sql = this.injectWhereClause(sql, 'affiliate_referral_transactions', `affiliate_account_id = ${user.affiliateId}`);
      }
      if (tables.includes('affiliate_settlement_transactions')) {
        sql = this.injectWhereClause(sql, 'affiliate_settlement_transactions', `affiliate_account_id = ${user.affiliateId}`);
      }
      return this.ensureDeletedFilter(sql, tables);
    }

    return sql;
  }

  /**
   * Inject a WHERE clause condition for a specific table.
   * Handles both direct table references and aliased tables.
   */
  private injectWhereClause(sql: string, tableName: string, condition: string): string {
    // Find the table reference (possibly with alias)
    const tablePattern = new RegExp(
      `\\b${tableName}\\b(?:\\s+(?:AS\\s+)?([a-zA-Z_]\\w*))?`,
      'i'
    );
    const tableMatch = sql.match(tablePattern);

    if (!tableMatch) return sql;

    const alias = tableMatch[1] || tableName;
    const qualifiedCondition = condition.replace(
      /\b((?:corporate_account_id|user_id|id|registration_id|affiliate_account_id|is_deleted)\b)/g,
      `${alias}.$1`
    );

    // Check if there's already a WHERE clause
    if (/\bWHERE\b/i.test(sql)) {
      // Add to existing WHERE with AND
      sql = sql.replace(/\bWHERE\b/i, `WHERE ${qualifiedCondition} AND`);
    } else {
      // Look for the position right after the FROM/JOIN clause for this table
      // and insert WHERE before any GROUP BY / ORDER BY / LIMIT
      const insertBeforePattern = /\b(GROUP\s+BY|ORDER\s+BY|LIMIT|HAVING|UNION|INTERSECT|EXCEPT)\b/i;
      const insertMatch = sql.match(insertBeforePattern);
      if (insertMatch && insertMatch.index !== undefined) {
        sql = sql.slice(0, insertMatch.index) + ` WHERE ${qualifiedCondition} ` + sql.slice(insertMatch.index);
      } else {
        // Append WHERE at the end
        sql = sql + ` WHERE ${qualifiedCondition}`;
      }
    }

    return sql;
  }

  /**
   * Ensure is_deleted = false is applied to tables that have it
   */
  private ensureDeletedFilter(sql: string, tables: string[]): string {
    const tablesWithDeletedFlag = ['registrations', 'career_roles', 'career_role_tools',
      'trait_based_course_details', 'groups', 'departments', 'open_questions', 'open_question_options',
      'assessment_questions', 'assessment_question_options'];

    for (const table of tables) {
      if (tablesWithDeletedFlag.includes(table)) {
        // Check if is_deleted filter already exists
        const tablePattern = new RegExp(
          `\\b${table}\\b(?:\\s+(?:AS\\s+)?([a-zA-Z_]\\w*))?`,
          'i'
        );
        const match = sql.match(tablePattern);
        const alias = match?.[1] || table;

        if (!new RegExp(`${alias}\\.is_deleted`, 'i').test(sql) && 
            !new RegExp(`\\bis_deleted\\b`, 'i').test(sql)) {
          sql = this.injectWhereClause(sql, table, 'is_deleted = false');
        }
      }
    }
    return sql;
  }

  /**
   * Enforce row limit on the query
   */
  private enforceRowLimit(sql: string, warnings: string[]): string {
    const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i);

    if (limitMatch) {
      const requestedLimit = parseInt(limitMatch[1], 10);
      if (requestedLimit > this.MAX_ROW_LIMIT) {
        sql = sql.replace(/\bLIMIT\s+\d+/i, `LIMIT ${this.MAX_ROW_LIMIT}`);
        warnings.push(`Row limit capped from ${requestedLimit} to ${this.MAX_ROW_LIMIT}`);
      }
    } else {
      // No LIMIT found — add default
      // Insert before any trailing semicolon or at the end
      sql = sql.replace(/\s*$/, ` LIMIT ${this.DEFAULT_ROW_LIMIT}`);
      warnings.push(`Default LIMIT ${this.DEFAULT_ROW_LIMIT} applied`);
    }

    return sql;
  }

  /**
   * Check if a query is a simple count query (returns just a number)
   */
  isCountQuery(sql: string): boolean {
    return /^\s*SELECT\s+COUNT\s*\(/i.test(sql);
  }

  /**
   * Check if a query is an aggregation (GROUP BY, SUM, AVG, etc.)
   */
  isAggregationQuery(sql: string): boolean {
    return /\b(GROUP\s+BY|SUM\s*\(|AVG\s*\(|MIN\s*\(|MAX\s*\(|COUNT\s*\(.*GROUP)/i.test(sql);
  }
}
