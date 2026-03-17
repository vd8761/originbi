/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { SchemaIntrospectorService } from './schema-introspector.service';
import { SqlValidatorService } from './utils/sql-validator.service';
import { UserContext } from '../common/interfaces/user-context.interface';
import { AuditLoggerService } from './audit';
import { getTokenTrackerCallback } from './utils/token-tracker';
import { invokeWithFallback } from './utils/llm-fallback';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                 TEXT-TO-SQL ENGINE — "JARVIS MODE"                        ║
 * ║        Translates any natural language question into safe SQL             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FLOW:                                                                    ║
 * ║  1. User asks any question about their data                              ║
 * ║  2. LLM generates a SELECT query using real schema context              ║
 * ║  3. SQL Validator enforces security rules + injects RBAC                ║
 * ║  4. Query executes against live DB                                       ║
 * ║  5. LLM formats raw results into natural language answer                ║
 * ║                                                                           ║
 * ║  SAFETY:                                                                  ║
 * ║  - Read-only (SELECT only)                                               ║
 * ║  - RBAC auto-injected (corporate/student scoping)                        ║
 * ║  - Row limits enforced                                                    ║
 * ║  - Table whitelist per role                                               ║
 * ║  - Sensitive columns redacted                                             ║
 * ║  - SQL injection patterns blocked                                         ║
 * ║  - Retry with error feedback on failure                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export interface TextToSqlResult {
  answer: string;
  sql: string;
  rawData: any[];
  rowCount: number;
  executionTimeMs: number;
  confidence: number;
  searchType: string;
  warnings: string[];
}

@Injectable()
export class TextToSqlService {
  private readonly logger = new Logger('TextToSQL');
  private llm: ChatGoogleGenerativeAI | null = null;
  private formatterLlm: ChatGoogleGenerativeAI | null = null;
  private synthesizerLlm: ChatGoogleGenerativeAI | null = null;
  private sqlFallbackLlm: ChatGroq | null = null;
  private formatterFallbackLlm: ChatGroq | null = null;
  private synthesizerFallbackLlm: ChatGroq | null = null;

  // Retry state: when SQL fails, we feed the error back and retry
  private readonly MAX_SQL_RETRIES = 2;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schemaIntrospector: SchemaIntrospectorService,
    private readonly sqlValidator: SqlValidatorService,
    private readonly auditLogger: AuditLoggerService,
  ) {
    this.logger.log('🧠 Text-to-SQL Jarvis Engine initialized');
  }

  private getSqlLlm(): ChatGoogleGenerativeAI {
    if (!this.llm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      this.llm = new ChatGoogleGenerativeAI({
        apiKey,
        model: 'gemini-2.5-flash',
        temperature: 0, // Deterministic SQL generation
        maxOutputTokens: 768,
        callbacks: [getTokenTrackerCallback('TextToSql (SQL)')],
      });
    }
    return this.llm;
  }

  private getSqlFallbackLlm(): ChatGroq {
    if (!this.sqlFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      this.sqlFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        maxTokens: 768,
        callbacks: [getTokenTrackerCallback('TextToSql (SQL Groq Fallback)')],
      });
    }
    return this.sqlFallbackLlm;
  }

  private getFormatterLlm(): ChatGoogleGenerativeAI {
    if (!this.formatterLlm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      this.formatterLlm = new ChatGoogleGenerativeAI({
        apiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.4, // Slightly creative for natural phrasing
        maxOutputTokens: 1200,
        callbacks: [getTokenTrackerCallback('TextToSql (Formatter)')],
      });
    }
    return this.formatterLlm;
  }

  private getFormatterFallbackLlm(): ChatGroq {
    if (!this.formatterFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      this.formatterFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        maxTokens: 1200,
        callbacks: [getTokenTrackerCallback('TextToSql (Formatter Groq Fallback)')],
      });
    }
    return this.formatterFallbackLlm;
  }

  private getSynthesizerLlm(): ChatGoogleGenerativeAI {
    if (!this.synthesizerLlm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      this.synthesizerLlm = new ChatGoogleGenerativeAI({
        apiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.3,
        maxOutputTokens: 1800,
        callbacks: [getTokenTrackerCallback('TextToSql (Synthesizer)')],
      });
    }
    return this.synthesizerLlm;
  }

  private getSynthesizerFallbackLlm(): ChatGroq {
    if (!this.synthesizerFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      this.synthesizerFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        maxTokens: 1800,
        callbacks: [getTokenTrackerCallback('TextToSql (Synthesizer Groq Fallback)')],
      });
    }
    return this.synthesizerFallbackLlm;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * MAIN ENTRY POINT: Answer any data question using Text-to-SQL
   * ═══════════════════════════════════════════════════════════════
   */
  async answerQuestion(
    question: string,
    user: UserContext,
    conversationHistory: string = '',
  ): Promise<TextToSqlResult> {
    const startTime = Date.now();
    this.logger.log(`🚀 Text-to-SQL: "${question}" [${user.role}]`);

    try {
      // ── STEP 0: Detect complex multi-part questions → decompose ──
      if (this.isComplexQuestion(question)) {
        this.logger.log('🧩 Complex question detected → decomposing into sub-queries');
        const result = await this.answerComplexQuestion(question, user, conversationHistory, startTime);
        if (result) return result;
        // If decomposition failed, fall through to single-query mode
      }

      // ── STEP 1: Generate SQL from natural language ──
      const generatedSql = await this.generateSql(question, user, conversationHistory);
      this.logger.log(`📝 Generated SQL: ${generatedSql}`);

      // ── STEP 2: Validate & sanitize with RBAC injection ──
      const validation = this.sqlValidator.validate(generatedSql, user);
      if (!validation.isValid) {
        this.logger.warn(`🚫 SQL validation failed: ${validation.error}`);
        // Retry: feed the error back to the LLM for self-correction
        const retriedSql = await this.retryWithError(question, user, generatedSql, validation.error || 'Unknown error', conversationHistory);
        if (!retriedSql) {
          return this.buildErrorResult(question, validation.error || 'Could not generate a valid query', startTime);
        }
        const retryValidation = this.sqlValidator.validate(retriedSql, user);
        if (!retryValidation.isValid) {
          return this.buildErrorResult(question, retryValidation.error || 'Could not generate a valid query after retry', startTime);
        }
        // Use the retried + validated SQL
        return await this.executeAndFormat(question, retryValidation.sanitizedSql, user, startTime, retryValidation.warnings);
      }

      // ── STEP 3: Execute and format response ──
      return await this.executeAndFormat(question, validation.sanitizedSql, user, startTime, validation.warnings);

    } catch (error) {
      this.logger.error(`❌ Text-to-SQL failed: ${error.message}`, error.stack);
      return this.buildErrorResult(question, error.message, startTime);
    }
  }

  /**
   * Generate SQL from natural language using the LLM with full schema context.
   * This is the core prompt engineering — the brain of Jarvis.
   */
  private async generateSql(
    question: string,
    user: UserContext,
    conversationHistory: string = '',
  ): Promise<string> {
    const schema = this.schemaIntrospector.getSchemaText();

    // Build role-specific context
    const roleContext = this.buildRoleContext(user);

    const systemPrompt = `You are Ask BI's SQL generation engine — the Jarvis brain behind OriginBI's talent intelligence platform.
Your ONLY job is to convert a user's natural language question into a single, precise PostgreSQL SELECT query.

═══ DATABASE SCHEMA ═══
${schema}

═══ YOUR ROLE CONTEXT ═══
${roleContext}

═══ SQL GENERATION RULES (MANDATORY) ═══

1. OUTPUT FORMAT: Return ONLY the raw SQL query. No markdown, no explanation, no code fences. Just the SQL.

2. ONLY SELECT: You may ONLY generate SELECT statements. Never INSERT, UPDATE, DELETE, DROP, CREATE, or ALTER.

3. COLUMN NAMING PRECISION:
   - career_roles table: use "career_role_name" (NOT "name"), "short_description" (NOT "description")
   - registrations table: use "full_name" for names (NOT "name")
   - Always use exact column names from the schema above
   - When selecting columns, prefer explicit column names over SELECT *

4. TEXT SEARCH PATTERNS:
   - For name searches: use ILIKE '%term%' for fuzzy matching
   - For exact value matches (status, gender, role): use = with exact values from the schema's enum values
   - Never use LIKE when ILIKE is appropriate (case-insensitive search is default)

5. JOIN PATTERNS:
   - Candidate with assessment: registrations r JOIN assessment_attempts aa ON aa.registration_id = r.id
   - Assessment with personality: LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
   - Assessment with program: LEFT JOIN programs p ON aa.program_id = p.id
   - Career role with tools: career_roles cr JOIN career_role_tools crt ON crt.career_role_id = cr.id
   - Courses with traits: trait_based_course_details tcd LEFT JOIN personality_traits pt ON tcd.trait_id = pt.id

6. SOFT DELETE: Most tables have is_deleted column. Always add is_deleted = false in WHERE for:
   registrations, career_roles, career_role_tools, trait_based_course_details, groups, departments

7. ACTIVE FILTER: Tables with is_active column — add is_active = true when listing active records:
   career_roles, programs, personality_traits, users

8. AGGREGATION: When user asks "how many", "count", "total", "average", "highest", "lowest":
   - Use COUNT(*), SUM(), AVG(), MAX(), MIN() as appropriate
   - Always add GROUP BY when using aggregations with non-aggregated columns
   - For "top N" or "best N": use ORDER BY ... DESC LIMIT N

9. DATE/TIME QUERIES:
   - Use PostgreSQL date functions: NOW(), CURRENT_DATE, INTERVAL
   - "last week": WHERE created_at >= NOW() - INTERVAL '7 days'
   - "last month": WHERE created_at >= NOW() - INTERVAL '30 days'
   - "this year": WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())

10. ROW LIMITS: Always include a sensible LIMIT:
    - List queries: LIMIT 20
    - Count/aggregation queries: no LIMIT needed
    - Search queries: LIMIT 10
    - "Show all" explicitly: LIMIT 100

11. SORTING: Add meaningful ORDER BY:
    - Scores: ORDER BY total_score DESC
    - Dates: ORDER BY created_at DESC
    - Names: ORDER BY full_name ASC
    - Counts: ORDER BY count DESC

12. NULL SAFETY: For LEFT JOINs, use COALESCE for nullable fields in display:
    - COALESCE(pt.blended_style_name, 'Not assessed') as personality_style
    - COALESCE(aa.total_score, 0) as score

13. DOMAIN SYNONYMS (the user may use these interchangeably):
    - "candidates" = "students" = "registrations" = "employees" = "resources" = "staff" = "people"
    - "personality" = "behavioral style" = "DISC profile" = "dominant trait"
    - "test" = "assessment" = "exam"
    - "score" = "total_score" = "marks" = "result"
    - "job role" = "career role" = "career_roles"
    - "tools" = "technologies" = "tech stack" = "skills" (from career_role_tools)
    - "courses" = "programs" = "degree" (context-dependent: trait_based_course_details or programs)

═══ COMPLEX QUERY PATTERNS ═══

-- Candidates with their personality and score:
SELECT r.full_name, r.gender, aa.total_score, pt.blended_style_name AS personality
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE aa.status = 'COMPLETED' AND r.is_deleted = false
ORDER BY aa.total_score DESC LIMIT 20

-- Gender distribution:
SELECT r.gender, COUNT(*) as count
FROM registrations r WHERE r.is_deleted = false
GROUP BY r.gender

-- Career roles with tool count:
SELECT cr.career_role_name, COUNT(crt.id) as tool_count
FROM career_roles cr
LEFT JOIN career_role_tools crt ON crt.career_role_id = cr.id AND crt.is_deleted = false
WHERE cr.is_deleted = false AND cr.is_active = true
GROUP BY cr.id, cr.career_role_name
ORDER BY tool_count DESC LIMIT 20

-- Candidates who completed assessment in last 7 days:
SELECT r.full_name, aa.total_score, aa.completed_at
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE aa.status = 'COMPLETED' AND aa.completed_at >= NOW() - INTERVAL '7 days' AND r.is_deleted = false
ORDER BY aa.completed_at DESC

-- Average score by personality type:
SELECT pt.blended_style_name, ROUND(AVG(aa.total_score), 1) as avg_score, COUNT(*) as count
FROM assessment_attempts aa
JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE aa.status = 'COMPLETED'
GROUP BY pt.id, pt.blended_style_name
ORDER BY avg_score DESC

-- List all corporate accounts with details:
SELECT ca.company_name, ca.full_name, ca.sector_code, ca.job_title, ca.gender,
  ca.country_code, ca.mobile_number, ca.business_locations,
  ca.total_credits, ca.available_credits, ca.is_active, ca.created_at
FROM corporate_accounts ca
WHERE ca.is_active = true
ORDER BY ca.created_at DESC

-- Corporate account with candidate count:
SELECT ca.company_name, ca.full_name, ca.sector_code, ca.total_credits, ca.available_credits,
  COUNT(r.id) AS candidate_count
FROM corporate_accounts ca
LEFT JOIN users u ON u.corporate_account_id = ca.id AND u.role = 'CORPORATE'
LEFT JOIN registrations r ON r.corporate_account_id = ca.id AND r.is_deleted = false
WHERE ca.is_active = true
GROUP BY ca.id, ca.company_name, ca.full_name, ca.sector_code, ca.total_credits, ca.available_credits
ORDER BY candidate_count DESC

-- Candidates belonging to a specific corporate:
SELECT r.full_name, r.email, r.gender, aa.total_score, aa.status
FROM registrations r
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE r.corporate_account_id = (SELECT id FROM corporate_accounts WHERE company_name ILIKE '%CompanyName%' LIMIT 1)
  AND r.is_deleted = false
ORDER BY r.created_at DESC

-- Group/Batch summary with assessment stats (IMPORTANT: groups table = batches):
SELECT g.name AS group_name, g.code AS group_code,
  COUNT(DISTINCT r.id) AS total_candidates,
  COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed_assessments,
  COUNT(DISTINCT CASE WHEN aa.status = 'NOT_STARTED' THEN aa.id END) AS not_started,
  ROUND(AVG(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END), 1) AS avg_score,
  MAX(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS highest_score,
  MIN(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS lowest_score
FROM groups g
LEFT JOIN registrations r ON r.group_id = g.id AND r.is_deleted = false
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE g.is_deleted = false AND g.name ILIKE '%BatchName%'
GROUP BY g.id, g.name, g.code

-- Group/Batch with personality distribution (strengths analysis):
SELECT g.name AS group_name, pt.blended_style_name AS personality_type,
  COUNT(*) AS candidate_count,
  ROUND(AVG(aa.total_score), 1) AS avg_score
FROM groups g
JOIN registrations r ON r.group_id = g.id AND r.is_deleted = false
JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE g.is_deleted = false AND g.name ILIKE '%BatchName%'
GROUP BY g.id, g.name, pt.id, pt.blended_style_name
ORDER BY candidate_count DESC

-- Program summary with assessment stats:
SELECT p.name AS program_name, p.code AS program_code,
  COUNT(DISTINCT r.id) AS total_registrations,
  COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed,
  COUNT(DISTINCT CASE WHEN aa.status = 'NOT_STARTED' THEN aa.id END) AS not_started,
  ROUND(AVG(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END), 1) AS avg_score
FROM programs p
LEFT JOIN registrations r ON r.program_id = p.id AND r.is_deleted = false
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE p.is_active = true AND p.name ILIKE '%ProgramName%'
GROUP BY p.id, p.name, p.code

-- List all groups/batches:
SELECT g.name AS group_name, g.code AS group_code,
  COUNT(r.id) AS candidate_count, g.is_active, g.created_at
FROM groups g
LEFT JOIN registrations r ON r.group_id = g.id AND r.is_deleted = false
WHERE g.is_deleted = false
GROUP BY g.id, g.name, g.code, g.is_active, g.created_at
ORDER BY g.created_at DESC LIMIT 20

-- Group assessments (programs assigned to groups):
SELECT g.name AS group_name, p.name AS program_name,
  ga.total_candidates, ga.status, ga.valid_from, ga.valid_to
FROM group_assessments ga
JOIN groups g ON ga.group_id = g.id
JOIN programs p ON ga.program_id = p.id
WHERE g.name ILIKE '%GroupName%'
ORDER BY ga.created_at DESC

═══ DOMAIN SYNONYMS FOR GROUPS/BATCHES/PROGRAMS ═══
- "batch" = "group" = "groups" table. The user may say "KIOTstudents batch" meaning the groups table with name ILIKE '%KIOTstudents%'
- "program" = "assessment program" = "programs" table. E.g. "School Students Program" → programs WHERE name ILIKE '%School Students%'
- "summarize batch" = query groups + registrations + assessment_attempts for aggregate stats
- "strengths" = personality_traits distribution. "risks" = low scores / not started. "readiness" = completed vs not started ratio.

${conversationHistory ? `\n═══ CONVERSATION CONTEXT ═══\n${conversationHistory}\nUse this to resolve references like "those candidates", "that group", "them", etc.\n` : ''}

Now generate the SQL for the following question:`;

    const response = await invokeWithFallback({
      logger: this.logger,
      context: 'TextToSql SQL generation',
      invokePrimary: () =>
        this.getSqlLlm().invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(question),
        ]),
      invokeFallback: () =>
        this.getSqlFallbackLlm().invoke([
          new SystemMessage(systemPrompt),
          new HumanMessage(question),
        ]),
    });

    let sql = response.content.toString().trim();

    // Clean LLM output: remove code fences, markdown, extra text
    sql = sql
      .replace(/^```sql?\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^(Here|This|The|I|Let|Sure|Of course)[^;]*?(?=SELECT|WITH)/is, '') // Remove preamble text
      .trim();

    // If the LLM returned multiple lines with explanation, extract just the SQL
    const sqlMatch = sql.match(/((?:WITH|SELECT)\s[\s\S]*?)(?:\n\n|$)/i);
    if (sqlMatch) {
      sql = sqlMatch[1].trim();
    }

    return sql;
  }

  /**
   * Retry SQL generation by feeding the error back to the LLM
   */
  private async retryWithError(
    question: string,
    user: UserContext,
    failedSql: string,
    error: string,
    conversationHistory: string,
  ): Promise<string | null> {
    this.logger.log(`🔄 Retrying SQL generation with error feedback...`);

    const schema = this.schemaIntrospector.getCompactSchemaText();

    const retryPrompt = `You generated this SQL but it was rejected:
SQL: ${failedSql}
ERROR: ${error}

Fix the SQL to address the error. Remember:
- ONLY SELECT statements allowed
- Use exact column names from this schema:
${schema}

User question: "${question}"
User role: ${user.role}

Return ONLY the corrected SQL, nothing else:`;

    try {
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'TextToSql SQL retry',
        invokePrimary: () =>
          this.getSqlLlm().invoke([
            new SystemMessage('You are a SQL correction engine. Return ONLY the corrected PostgreSQL SELECT query. No explanation.'),
            new HumanMessage(retryPrompt),
          ]),
        invokeFallback: () =>
          this.getSqlFallbackLlm().invoke([
            new SystemMessage('You are a SQL correction engine. Return ONLY the corrected PostgreSQL SELECT query. No explanation.'),
            new HumanMessage(retryPrompt),
          ]),
      });

      let sql = response.content.toString().trim();
      sql = sql.replace(/^```sql?\s*/i, '').replace(/\s*```$/i, '').trim();
      return sql;
    } catch (retryError) {
      this.logger.warn(`SQL retry failed: ${retryError.message}`);
      return null;
    }
  }

  /**
   * Execute validated SQL and format the results into a natural language answer
   */
  private async executeAndFormat(
    question: string,
    sql: string,
    user: UserContext,
    startTime: number,
    warnings: string[],
  ): Promise<TextToSqlResult> {
    // Execute
    let rawData: any[];
    try {
      rawData = await this.dataSource.query(sql);
    } catch (dbError) {
      this.logger.error(`DB execution error: ${dbError.message}`);

      // Try one more time with error correction
      const fixedSql = await this.retryWithError(question, user, sql, dbError.message, '');
      if (fixedSql) {
        const revalidation = this.sqlValidator.validate(fixedSql, user);
        if (revalidation.isValid) {
          try {
            rawData = await this.dataSource.query(revalidation.sanitizedSql);
            sql = revalidation.sanitizedSql;
            warnings.push('SQL was auto-corrected after execution error');
          } catch (retryDbError) {
            return this.buildErrorResult(question, `Query execution failed: ${retryDbError.message}`, startTime);
          }
        } else {
          return this.buildErrorResult(question, `Could not fix query: ${revalidation.error}`, startTime);
        }
      } else {
        return this.buildErrorResult(question, `Query execution failed: ${dbError.message}`, startTime);
      }
    }

    const executionTimeMs = Date.now() - startTime;

    // Log successful query execution
    this.auditLogger.logQuery({
      timestamp: new Date(),
      userId: user.id,
      userRole: user.role,
      userEmail: user.email,
      corporateId: user.corporateId,
      action: 'TEXT_TO_SQL',
      intent: 'dynamic_query',
      query: question,
      tablesAccessed: this.extractTablesFromSql(sql),
      recordsReturned: rawData.length,
      accessGranted: true,
      responseTime: executionTimeMs,
    });

    // Format results into natural language
    if (rawData.length === 0) {
      const emptyAnswer = await this.formatEmptyResult(question, user);
      return {
        answer: emptyAnswer,
        sql,
        rawData: [],
        rowCount: 0,
        executionTimeMs,
        confidence: 0.85,
        searchType: 'text_to_sql',
        warnings,
      };
    }

    const answer = await this.formatResults(question, rawData, sql, user);
    return {
      answer,
      sql,
      rawData,
      rowCount: rawData.length,
      executionTimeMs,
      confidence: 0.92,
      searchType: 'text_to_sql',
      warnings,
    };
  }

  /**
   * Format raw SQL results into a natural, Jarvis-like response
   */
  private async formatResults(
    question: string,
    data: any[],
    sql: string,
    user: UserContext,
  ): Promise<string> {
    // For simple counts, format directly without LLM
    if (this.sqlValidator.isCountQuery(sql) && data.length === 1) {
      const countKey = Object.keys(data[0])[0];
      const countValue = data[0][countKey];
      return this.formatCountAnswer(question, countValue);
    }

    // For small result sets (1-3 rows) or aggregations, use compact formatting
    if (data.length <= 3 || this.sqlValidator.isAggregationQuery(sql)) {
      return this.formatCompactResults(question, data);
    }

    // For larger result sets, use LLM to create a rich summary
    const truncatedData = data.slice(0, 30); // Limit context window
    const dataStr = JSON.stringify(truncatedData, null, 2);
    const totalRows = data.length;

    const formatPrompt = `You are Ask BI — OriginBI's intelligent data analyst. Transform raw database results into a professional, insightful response that reads like a top-tier analytics dashboard.

═══ ABSOLUTE RULES ═══
1. ONLY use data from the "Data" section. ZERO tolerance for fabrication — every name, number, and fact must come from the provided data.
2. Never add companies, candidates, or statistics from general knowledge or the web.

═══ FORMATTING STYLE ═══
- Start with the answer immediately. No "Here are the results", no "Based on the data".
- Use **bold** for key values: counts, names, scores, percentages.
- Use markdown tables for tabular data (3+ rows with multiple columns).
- Use numbered lists for rankings or ordered items.
- Use bullet points for summaries (1-2 items).
- For single values: "There are **415** candidates registered." — clean and direct.

═══ ANALYTICAL QUALITY ═══
- Don't just list data — INTERPRET it. Add a 1-2 line insight when the data tells a story:
  - "**Expressive Communicators** dominate at 34%, suggesting the cohort is strong in interpersonal skills."
  - "Completion rate is **67%** — above average, but **22 candidates** still haven't started."
  - "**3 of the top 5 scorers** are female, indicating strong performance from female candidates."
- Compare values when relevant: "**KIOT IT** (avg 78.3) outperforms **KIOT CSE** (avg 63.1) by **24%**."
- Flag risks or notable patterns: "⚠️ **12 candidates** scored below 30 — they may need additional support."

═══ STRUCTURE ═══
- For 1 result: single sentence or bullet list
- For 2-5 results: compact bullet list or small table
- For 6+ results: markdown table + 1-line summary insight
- For aggregations: bold the key metric, add context
- If results truncated, note: "Showing **30 of ${totalRows}** total results."

═══ NEVER DO THIS ═══
- No disclaimers, tips, or "Try asking:" suggestions
- No "I hope this helps" or similar filler
- No making up data not in the results
- No explaining the SQL or methodology

User's question: "${question}"
User's role: ${user.role}
Total rows: ${totalRows}
${totalRows > 30 ? `(Showing first 30 of ${totalRows})` : ''}

Data:
${dataStr}

Response:`;

    try {
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'TextToSql formatting',
        invokePrimary: () => this.getFormatterLlm().invoke([
          new SystemMessage(formatPrompt),
          new HumanMessage('Format the response now.'),
        ]),
        invokeFallback: () =>
          this.getFormatterFallbackLlm().invoke([
            new SystemMessage(formatPrompt),
            new HumanMessage('Format the response now.'),
          ]),
      });
      return response.content.toString().trim();
    } catch (formatError) {
      this.logger.warn(`LLM formatting failed, using fallback: ${formatError.message}`);
      return this.fallbackFormat(question, data);
    }
  }

  /**
   * Format count-type answers concisely
   */
  private formatCountAnswer(question: string, count: number | string): string {
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    const q = question.toLowerCase();

    // Build a contextual response
    if (/\b(candidate|student|registration|employee|resource|people|person)\b/i.test(q)) {
      if (/\b(female|girl|women)\b/i.test(q)) return `**${num}** female candidates found.`;
      if (/\b(male|boy|men)\b/i.test(q)) return `**${num}** male candidates found.`;
      if (/\bcompleted\b/i.test(q)) return `**${num}** candidates have completed their assessments.`;
      return `**${num}** candidates total.`;
    }
    if (/\b(assessment|test|exam)\b/i.test(q)) return `**${num}** assessments found.`;
    if (/\b(career|role|job)\b/i.test(q)) return `**${num}** career roles available.`;
    if (/\b(course|program)\b/i.test(q)) return `**${num}** courses/programs available.`;
    if (/\b(user|login|account)\b/i.test(q)) return `**${num}** user accounts found.`;
    if (/\b(group|batch)\b/i.test(q)) return `**${num}** groups found.`;

    return `**${num}** records found.`;
  }

  /**
   * Format compact results (few rows or aggregations) without LLM
   */
  private formatCompactResults(question: string, data: any[]): string {
    if (data.length === 0) return 'No results found.';

    if (data.length === 1) {
      const row = data[0];
      const entries = Object.entries(row).filter(([, v]) => v != null);

      // Single-row, single-value (e.g., COUNT, AVG)
      if (entries.length === 1) {
        return `**${entries[0][1]}**`;
      }

      // Single row with multiple fields — bullet list
      const lines = entries.map(([key, value]) => {
        const label = this.humanizeColumnName(key);
        return `- **${label}**: ${value}`;
      });
      return lines.join('\n');
    }

    // 2-3 rows — create a neat table
    return this.buildMarkdownTable(data);
  }

  /**
   * Fallback formatter when LLM fails
   */
  private fallbackFormat(_question: string, data: any[]): string {
    if (data.length === 0) return 'No results found.';
    if (data.length <= 5) return this.buildMarkdownTable(data);

    const table = this.buildMarkdownTable(data.slice(0, 10));
    if (data.length > 10) {
      return `${table}\n\n*Showing 10 of ${data.length} total results.*`;
    }
    return table;
  }

  /**
   * Format response for empty results
   */
  private async formatEmptyResult(question: string, _user: UserContext): Promise<string> {
    const q = question.toLowerCase();

    if (/\b(who|find|search|show|list)\b/i.test(q) && /\b(name|person|candidate)\b/i.test(q)) {
      return `No matching candidates found. You can try asking **"list all candidates"** to see who's available.`;
    }

    // Contextual messages based on what the user asked about
    if (/\b(education|qualification|degree|department|school|board|stream)\b/i.test(q)) {
      return `The requested education/qualification details are not available for these candidates at this time.`;
    }
    if (/\b(score|marks|assessment|test|exam|result)\b/i.test(q)) {
      return `No assessment data is currently available for this query. The candidates may not have completed their assessments yet.`;
    }
    if (/\b(email|phone|mobile|contact)\b/i.test(q)) {
      return `The requested contact details are not available for these candidates.`;
    }

    return `No matching data found for your request. Please try a different question or ask **"what can you do"** for help.`;
  }

  /**
   * Build a markdown table from row data
   */
  private buildMarkdownTable(data: any[]): string {
    if (data.length === 0) return '';

    const columns = Object.keys(data[0]);
    const headers = columns.map(c => this.humanizeColumnName(c));

    // Header row
    let table = `| ${headers.join(' | ')} |\n`;
    table += `| ${headers.map(() => '---').join(' | ')} |\n`;

    // Data rows
    for (const row of data) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '-';
        if (typeof val === 'number') return String(val);
        if (val instanceof Date) return val.toLocaleDateString();
        const str = String(val);
        return str.length > 50 ? str.substring(0, 47) + '...' : str;
      });
      table += `| ${values.join(' | ')} |\n`;
    }

    return table;
  }

  /**
   * Convert column_name to "Column Name"
   */
  private humanizeColumnName(col: string): string {
    return col
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\bId\b/g, 'ID')
      .replace(/\bUrl\b/g, 'URL');
  }

  /**
   * Build role-specific context for the SQL generation prompt
   */
  private buildRoleContext(user: UserContext): string {
    switch (user.role) {
      case 'ADMIN':
        return `Role: ADMIN — Full access to all tables and data. No scoping restrictions. Can view all companies, all candidates, all system data.`;

      case 'CORPORATE':
        return `Role: CORPORATE — Company ID: ${user.corporateId}
IMPORTANT: All queries on registrations/assessments MUST be scoped to this company.
The SQL validator will auto-inject corporate_account_id filters, but you should still write clean queries.
This user can only see candidates registered under their corporate account.`;

      case 'STUDENT':
        return `Role: STUDENT — User ID: ${user.id}
IMPORTANT: This user can ONLY see their own data. 
All queries on registrations MUST be filtered to user_id = ${user.id}.
They can also view public reference data (career_roles, courses, programs, personality_traits).
The SQL validator will auto-inject user_id filters.`;

      case 'AFFILIATE':
        return `Role: AFFILIATE — Affiliate ID: ${user.affiliateId}
This user can only see their own affiliate data: their account, referrals, and settlements.
The SQL validator will auto-inject affiliate_account_id filters.`;

      default:
        return `Role: ${user.role} — Limited access. Treat as STUDENT-level permissions.`;
    }
  }

  /**
   * Extract table names from SQL for audit logging
   */
  private extractTablesFromSql(sql: string): string[] {
    const tables: string[] = [];
    const patterns = [/\bFROM\s+\"?(\w+)\"?/gi, /\bJOIN\s+\"?(\w+)\"?/gi];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(sql)) !== null) {
        if (!tables.includes(match[1].toLowerCase())) {
          tables.push(match[1].toLowerCase());
        }
      }
    }
    return tables;
  }

  /**
   * Build an error result when SQL generation or execution fails
   */
  private buildErrorResult(question: string, error: string, startTime: number): TextToSqlResult {
    this.logger.error(`Text-to-SQL error for "${question}": ${error}`);
    return {
      answer: `I wasn't able to process that request. ${this.getHelpfulErrorMessage(error)}\n\nTry asking something like **"list candidates"** or **"how many assessments completed"**.`,
      sql: '',
      rawData: [],
      rowCount: 0,
      executionTimeMs: Date.now() - startTime,
      confidence: 0.3,
      searchType: 'text_to_sql_error',
      warnings: [error],
    };
  }

  /**
   * Convert technical errors into user-friendly messages
   */
  private getHelpfulErrorMessage(error: string): string {
    if (error.includes('not allowed')) return 'That type of operation is restricted for security reasons.';
    if (error.includes('permission')) return 'You don\'t have access to that data with your current role.';
    if (error.includes('not exist') || error.includes('does not exist')) return 'Some requested data fields are not available.';
    if (error.includes('syntax')) return 'There was an issue understanding that question.';
    return '';
  }

  /**
   * Check if a question is suitable for Text-to-SQL (vs general knowledge)
   * Helps the intent classifier decide when to route here.
   */
  isDataQuestion(question: string): boolean {
    const q = question.toLowerCase();

    // Strong indicators of a data/DB question
    const dataPatterns = [
      /\b(how many|count|total|number of)\b/,
      /\b(list|show|get|display|find|search|fetch|retrieve)\b.*\b(candidate|student|user|registration|employee|resource|staff|member|assessment|test|exam|career|role|group|department|course|program|account|corporate|affiliate|referral|company|companies|corporates?|organization)\b/,
      /\b(who|which)\b.*\b(candidate|student|person|user)\b/,
      /\b(top|best|highest|lowest|worst|average|mean)\b.*\b(score|performer|candidate|result)\b/,
      /\b(score|result|assessment|test)s?\b.*\b(above|below|greater|less|between|over|under)\b/,
      /\b(male|female|gender)\b.*\b(candidate|student|count)\b/,
      /\b(completed|incomplete|pending|active|inactive)\b.*\b(assessment|test|candidate|registration)\b/,
      /\b(last|recent|past|this)\b\s*(week|month|year|day)/,
      /\b(report|summary|overview|dashboard|analytics|statistics|stats)\b/,
      /\b(compare|comparison|versus|vs|difference)\b/,
      /\b(personality|trait|disc|behavioral)\b.*\b(distribution|breakdown|count)\b/,
      // Company / corporate data patterns
      /\b(companies|corporates?|company|organization|employer)s?\b/,
      /\b(list|show|get|all|display)\s+(the\s+)?(companies|corporates?|organizations?)\b/,
      // Additional data question indicators
      /\b(suitable|fit|eligible|qualified)\s+(for|to)\b/,
      /\b(find|match|identify|suggest)\b.*\b(candidate|student|person)\b/,
      /\b(age|gender)\s+(distribution|breakdown|wise|group|range)\b/,
      /\b(today|yesterday|this\s+week|last\s+week|this\s+month|last\s+month)\b/,
      /\b(percentage|ratio|proportion|rate)\s+of\b/,
      /\b(group\s+by|grouped|categorize|segment|breakdown)\b/,
      /\b(latest|recent|newest|oldest)\s+(candidate|registration|user|attempt)\b/,
      /\b(inactive|pending|incomplete|abandoned|unfinished)\b/,
      /\bregistered?\s+(today|yesterday|this|last|in|between|from|since)\b/,
      /\b(my\s+employee|my\s+team|my\s+candidate|my\s+staff|my\s+resource)/,
      /\b(score|marks|result)\s+(of|for)\s+\w+/,
      // Credit / account queries
      /\b(credits?|balance|available\s+credits?)\b/,
      /\b(affiliate|referral|commission)\b/,
      // Group/batch/program queries
      /\b(batch|group|program)\b.*\b(summary|summarize|strengths?|risks?|readiness|stats?|statistics|performance|overview|report)\b/,
      /\b(summarize|summary|overview|analyze|analyse)\b.*\b(batch|group|program)\b/,
      /\b(list|show|get)\b.*\b(groups?|batches?|programs?)\b/,
      /\b(group_assessments?|group\s+assessments?|batch\s+assessment)\b/,
    ];

    return dataPatterns.some(p => p.test(q));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY DECOMPOSER — Breaks complex multi-part questions into sub-queries
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Detect whether a question is complex enough to need decomposition.
   */
  private isComplexQuestion(question: string): boolean {
    const q = question.toLowerCase();
    const complexPatterns = [
      /\b(compare|versus|vs)\b.*\b(and|with|to)\b/,                    // "compare X and Y"
      /\b(also|additionally|and also|plus|as well as)\b/,              // multi-part requests
      /\b(which|who).*(better|worse|higher|lower|more|less).*\b(than|compared)\b/, // comparisons
      /\b(difference|gap)\s+(between|among)\b/,                        // "difference between"
      /\b(both|each|every)\s+(group|batch|program|team)\b/,           // multi-entity
      /\band\b.*\band\b/,                                              // "X and Y and Z"
      /\b(breakdown|distribution)\b.*\b(by|across|per|for each)\b.*\b(and|,)\b/, // multi-dimension
      /\btop\b.*\bcomplete.*\band\b/,                                  // "top scorers and completion"
      /\b(then|after that|next|followed by)\b/,                       // sequential requests
    ];
    // Flag as complex when strong signals exist; avoid over-triggering decomposition.
    const matchCount = complexPatterns.filter(p => p.test(q)).length;
    if (matchCount >= 2) return true;
    if (/(\bcompare\b|\bversus\b|\bdifference\s+between\b|\bbreakdown\b.*\bby\b)/.test(q)) return true;
    // Very long questions with "and" likely need decomposition
    if (q.length > 120 && /\band\b/.test(q)) return true;
    return false;
  }

  private tryParseSubQuestionArray(raw: string): string[] | null {
    try {
      const cleaned = raw
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // First, try direct JSON parse.
      const direct = JSON.parse(cleaned);
      if (Array.isArray(direct)) {
        return direct.filter((x) => typeof x === 'string' && x.trim().length > 0);
      }
    } catch {
      // Fall through to extraction attempt.
    }

    // Recover if model added prose around JSON.
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return null;
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((x) => typeof x === 'string' && x.trim().length > 0);
    } catch {
      return null;
    }
  }

  /**
   * Decompose a complex question into sub-queries, execute each, and synthesize
   * a unified natural language response.
   */
  private async answerComplexQuestion(
    question: string,
    user: UserContext,
    conversationHistory: string,
    startTime: number,
  ): Promise<TextToSqlResult | null> {
    try {
      const schema = this.schemaIntrospector.getCompactSchemaText();
      const roleContext = this.buildRoleContext(user);

      // ── Step 1: Ask LLM to decompose into sub-questions ──
      const decomposePrompt = `You are a query decomposition engine. Break this complex question into 2-5 simpler sub-questions that can each be answered with a single SQL query against this database.

Schema (abbreviated):
${schema}

User role: ${user.role}

Complex question: "${question}"

Rules:
- Each sub-question must be independently answerable with a single SQL SELECT
- Preserve the user's original intent — don't change the meaning
- Keep sub-questions short and focused
- If the question is actually simple (can be done in 1 query), return just ["${question}"]
- Return ONLY a JSON array of strings, no explanation

Example:
Input: "Compare KIOT IT and KIOT CSE batches — which has higher scores and better completion rate"
Output: ["What is the average score and completion rate for batch KIOT IT?", "What is the average score and completion rate for batch KIOT CSE?"]

JSON array:`;

      const decomposeResp = await invokeWithFallback({
        logger: this.logger,
        context: 'TextToSql decomposition',
        invokePrimary: () =>
          this.getSqlLlm().invoke([
            new SystemMessage('Return ONLY a JSON array of sub-questions. No explanation.'),
            new HumanMessage(decomposePrompt),
          ]),
        invokeFallback: () =>
          this.getSqlFallbackLlm().invoke([
            new SystemMessage('Return ONLY a JSON array of sub-questions. No explanation.'),
            new HumanMessage(decomposePrompt),
          ]),
      });

      const subQuestions = this.tryParseSubQuestionArray(decomposeResp.content.toString().trim());

      if (!Array.isArray(subQuestions) || subQuestions.length === 0) return null;
      if (subQuestions.length === 1) return null; // Not actually complex

      this.logger.log(`🧩 Decomposed into ${subQuestions.length} sub-queries: ${JSON.stringify(subQuestions)}`);

      // ── Step 2: Execute each sub-question independently (up to 5) ──
      const subResults: { question: string; data: any[]; sql: string; error?: string }[] = [];

      for (const subQ of subQuestions.slice(0, 5)) {
        try {
          let sql = await this.generateSql(subQ, user, conversationHistory);
          let validation = this.sqlValidator.validate(sql, user);

          if (!validation.isValid) {
            const retriedSql = await this.retryWithError(
              subQ,
              user,
              sql,
              validation.error || 'Validation failed',
              conversationHistory,
            );
            if (!retriedSql) {
              subResults.push({ question: subQ, data: [], sql, error: validation.error || 'Validation failed' });
              continue;
            }
            sql = retriedSql;
            validation = this.sqlValidator.validate(sql, user);
            if (!validation.isValid) {
              subResults.push({ question: subQ, data: [], sql, error: validation.error || 'Validation failed after retry' });
              continue;
            }
          }

          try {
            const rows = await this.dataSource.query(validation.sanitizedSql);
            subResults.push({ question: subQ, data: rows.slice(0, 30), sql: validation.sanitizedSql });
          } catch (dbErr) {
            const retriedSql = await this.retryWithError(
              subQ,
              user,
              validation.sanitizedSql,
              dbErr?.message || 'Execution failed',
              conversationHistory,
            );
            if (!retriedSql) {
              subResults.push({ question: subQ, data: [], sql: validation.sanitizedSql, error: dbErr?.message || 'Execution failed' });
              continue;
            }
            const retryValidation = this.sqlValidator.validate(retriedSql, user);
            if (!retryValidation.isValid) {
              subResults.push({ question: subQ, data: [], sql: retriedSql, error: retryValidation.error || 'Retry validation failed' });
              continue;
            }
            const retryRows = await this.dataSource.query(retryValidation.sanitizedSql);
            subResults.push({ question: subQ, data: retryRows.slice(0, 30), sql: retryValidation.sanitizedSql });
          }
        } catch (subErr) {
          subResults.push({ question: subQ, data: [], sql: '', error: subErr.message });
        }
      }

      // Check if we got any useful data
      const successfulResults = subResults.filter(r => r.data.length > 0);
      if (successfulResults.length === 0) return null;

      // Log audit for the primary query
      this.auditLogger.logQuery({
        timestamp: new Date(),
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        corporateId: user.corporateId,
        action: 'TEXT_TO_SQL_COMPLEX',
        intent: 'complex_query',
        query: question,
        tablesAccessed: [...new Set(subResults.flatMap(r => this.extractTablesFromSql(r.sql)))],
        recordsReturned: subResults.reduce((sum, r) => sum + r.data.length, 0),
        accessGranted: true,
        responseTime: Date.now() - startTime,
      });

      // ── Step 3: Synthesize all sub-results into one cohesive response ──
      const synthesisInput = subResults.map((r, i) => {
        if (r.error) return `Sub-question ${i + 1}: "${r.question}"\nResult: Error — ${r.error}`;
        if (r.data.length === 0) return `Sub-question ${i + 1}: "${r.question}"\nResult: No data found`;
        return `Sub-question ${i + 1}: "${r.question}"\nData (${r.data.length} rows):\n${JSON.stringify(r.data.slice(0, 15), null, 2)}`;
      }).join('\n\n');

      const synthesisPrompt = `You are Ask BI, an advanced data intelligence assistant. The user asked a complex question that was broken into sub-queries. Now synthesize ALL the sub-results into a single, coherent, insightful response.

ORIGINAL QUESTION: "${question}"

SUB-QUERY RESULTS:
${synthesisInput}

SYNTHESIS RULES:
1. Combine all data into ONE unified response that directly answers the original question
2. If this is a comparison, use a comparison table or side-by-side format
3. Highlight the KEY INSIGHT — what's the main takeaway? (bold it)
4. Use markdown: tables for multi-row data, bullet points for summaries, bold for important values
5. Be analytical — don't just list data, draw conclusions:
   - "**KIOT IT** outperforms KIOT CSE by 15 points on average (78.3 vs 63.1)"
   - "**Completion rate is critically low** at 23% — only 15 of 67 candidates finished"
6. Add a brief analytical summary at the end if there are 2+ dimensions of data
7. NEVER fabricate data not in the results above
8. Start with the answer immediately — no filler, no "Based on the data..."
9. Keep it concise but complete

Synthesized response:`;

      const synthResp = await invokeWithFallback({
        logger: this.logger,
        context: 'TextToSql synthesis',
        invokePrimary: () =>
          this.getSynthesizerLlm().invoke([
            new SystemMessage(synthesisPrompt),
            new HumanMessage('Synthesize the final response now.'),
          ]),
        invokeFallback: () =>
          this.getSynthesizerFallbackLlm().invoke([
            new SystemMessage(synthesisPrompt),
            new HumanMessage('Synthesize the final response now.'),
          ]),
      });
      const answer = synthResp.content.toString().trim();

      return {
        answer,
        sql: subResults.map(r => r.sql).filter(Boolean).join(';\n'),
        rawData: subResults.flatMap(r => r.data),
        rowCount: subResults.reduce((sum, r) => sum + r.data.length, 0),
        executionTimeMs: Date.now() - startTime,
        confidence: 0.93,
        searchType: 'text_to_sql_complex',
        warnings: subResults.filter(r => r.error).map(r => `Sub-query failed: ${r.error}`),
      };
    } catch (err) {
      this.logger.warn(`Complex query decomposition failed: ${err.message} — falling back to single query`);
      return null;
    }
  }
}
