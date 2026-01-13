import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';

/**
 * Enterprise-Grade RAG Service for OriginBI
 * Advanced Text-to-SQL with intelligent query understanding
 */

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private llm: ChatGroq | null = null;

    constructor(
        private dataSource: DataSource,
        private embeddingsService: EmbeddingsService,
    ) { }

    private getLlm(): ChatGroq {
        if (!this.llm) {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error('GROQ_API_KEY not set');
            this.llm = new ChatGroq({
                apiKey,
                model: 'llama-3.3-70b-versatile',
                temperature: 0,
            });
        }
        return this.llm;
    }

    /**
     * Complete database schema with relationships
     */
    private getSchemaPrompt(): string {
        return `
ORIGINBI DATABASE SCHEMA
========================

## USERS & REGISTRATIONS

TABLE: users
- id (bigint, PK)
- email (varchar) - User's email address, used as identifier/name
- role (varchar) - User role: 'admin', 'corporate', 'student'
- is_active (boolean) - Whether user is active
- is_blocked (boolean) - Whether user is blocked
- first_login_at, last_login_at (timestamp) - Login timestamps
- login_count (integer) - Number of logins
- avatar_url (varchar) - Profile picture URL

TABLE: registrations
- id (bigint, PK)
- user_id (bigint, FK -> users.id)
- full_name (varchar) - Candidate's full name
- gender (varchar) - 'male', 'female', 'other'
- status (varchar) - 'PENDING', 'ACTIVE', 'COMPLETED'
- program_id (bigint, FK -> programs.id)
- mobile_number (varchar)
- country_code (varchar)
- is_deleted (boolean)

## CAREER & SKILLS

TABLE: career_roles
- id (bigint, PK)
- career_role_name (varchar) - THE ROLE NAME (NOT "name")
- short_description (text) - Role description (NOT "description")
- trait_id (bigint, FK -> personality_traits.id)
- is_active, is_deleted (boolean)

TABLE: career_role_tools
- id (bigint, PK)
- career_role_id (bigint, FK -> career_roles.id)
- tool_name (varchar) - Technology/tool name
- is_deleted (boolean)

## COURSES & EDUCATION

TABLE: trait_based_course_details
- id (bigint, PK)
- course_name (text) - Course title
- compatibility_percentage (numeric) - Match score 0-100
- notes (text) - Additional info
- trait_id (bigint, FK -> personality_traits.id)
- is_deleted (boolean)

TABLE: departments
- id, name, short_name, category

TABLE: degree_types
- id, name, level

## PROGRAMS & ASSESSMENTS

TABLE: programs
- id (bigint, PK)
- code (varchar) - Program code
- name (varchar) - Program name
- description (text) - Full description
- is_demo, is_active (boolean)

TABLE: personality_traits
- id (bigint, PK)
- code (varchar) - Trait code
- blended_style_name (varchar) - Personality type name
- blended_style_desc (text) - Description

TABLE: assessment_attempts
- id, registration_id, program_id, status, score

TABLE: open_questions
- id, question_type, question_text_en

## CORPORATE

TABLE: corporate_accounts
- id, user_id, company_name, sector_code, total_credits, available_credits

TABLE: groups
- id, code, name, corporate_account_id
`;
    }

    /**
     * Main query method
     */
    async query(question: string, user: any): Promise<any> {
        if (!question?.trim()) {
            return { answer: 'Please provide a question.', error: 'Empty question' };
        }

        this.logger.log(`Query: "${question}"`);

        try {
            const sql = await this.generateSQL(question);
            const results = await this.dataSource.query(sql);
            return await this.generateResponse(question, sql, results);
        } catch (error) {
            this.logger.error('Query error:', error.message);
            return {
                answer: `Sorry, I couldn't answer that question. ${error.message}`,
                error: error.message,
                suggestions: [
                    "Show me all users",
                    "List career roles",
                    "How many courses are there?",
                    "Find tools for software engineer"
                ]
            };
        }
    }

    /**
     * Advanced SQL Generation with comprehensive examples
     */
    private async generateSQL(question: string): Promise<string> {
        const schema = this.getSchemaPrompt();

        const prompt = `You are an expert PostgreSQL developer for OriginBI, a career guidance platform.
Generate a single SQL SELECT query to answer the user's question.

${schema}

## QUERY RULES
1. Output ONLY raw SQL - no markdown, no backticks, no comments
2. ONLY SELECT allowed - never INSERT/UPDATE/DELETE/DROP
3. Always add LIMIT (max 100)
4. For career_roles: use "career_role_name" and "short_description"
5. Use ILIKE for text search (case-insensitive)
6. Filter is_deleted = false and is_active = true where applicable
7. For user info: SELECT email, role, is_active from users
8. For candidate info: SELECT full_name, gender, status from registrations
9. Use JOINs to get related data when needed
10. For counts: use COUNT(*)

## QUERY EXAMPLES

Q: "how many users" or "count users"
SELECT COUNT(*) as total_users FROM users WHERE is_active = true

Q: "show users" or "list users" or "user details" or "user names"
SELECT id, email as user_name, role, is_active, last_login_at FROM users WHERE is_active = true LIMIT 50

Q: "list career roles" or "show roles" or "career options"
SELECT id, career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 30

Q: "find java developer tools" or "tools for java"
SELECT crt.tool_name FROM career_role_tools crt 
JOIN career_roles cr ON crt.career_role_id = cr.id 
WHERE cr.career_role_name ILIKE '%java%' AND crt.is_deleted = false LIMIT 30

Q: "show courses" or "list courses"
SELECT id, course_name, compatibility_percentage, notes FROM trait_based_course_details WHERE is_deleted = false LIMIT 30

Q: "show programs" or "available programs"
SELECT id, code, name, description FROM programs WHERE is_active = true

Q: "personality types" or "traits"
SELECT id, blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true

Q: "candidates" or "registrations" or "students"
SELECT id, full_name, gender, status, mobile_number FROM registrations WHERE is_deleted = false LIMIT 30

Q: "how many career roles"
SELECT COUNT(*) as total_roles FROM career_roles WHERE is_deleted = false

Q: "find software engineer"
SELECT career_role_name, short_description FROM career_roles WHERE career_role_name ILIKE '%software%engineer%' AND is_deleted = false LIMIT 20

USER QUESTION: "${question}"

Generate the SQL query now:`;

        const response = await this.getLlm().invoke([
            new SystemMessage(prompt),
        ]);

        let sql = response.content.toString().trim();

        // Clean SQL
        sql = sql.replace(/```sql/gi, '').replace(/```/g, '').trim();
        sql = sql.split('\n').filter(l => !l.trim().startsWith('--'))[0]?.trim() || sql;

        this.logger.log(`SQL: ${sql}`);

        // Validate
        if (!sql.toUpperCase().startsWith('SELECT')) {
            throw new Error('Query must be SELECT');
        }

        const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE'];
        for (const kw of forbidden) {
            if (sql.toUpperCase().includes(kw + ' ')) {
                throw new Error(`Forbidden: ${kw}`);
            }
        }

        return sql;
    }

    /**
     * Generate intelligent natural language response
     */
    private async generateResponse(question: string, sql: string, results: any[]): Promise<any> {
        const count = results.length;
        const sample = results.slice(0, 25);

        const prompt = `You are the AI Assistant for OriginBI, a career guidance platform.
Generate a helpful, professional response based on the database query results.

USER QUESTION: "${question}"
QUERY RESULTS: ${count} row(s) found

DATA:
${JSON.stringify(sample, null, 2)}

RESPONSE GUIDELINES:
1. Be conversational and helpful
2. If data has emails, present them as user names
3. If it's a count, state the number clearly
4. For lists, format nicely with bullet points or numbered lists
5. Highlight important information
6. If no results, politely say so and suggest alternatives
7. Don't mention SQL or technical details
8. Keep response concise but informative
9. If there are more results than shown, mention the total count

Generate your response:`;

        const response = await this.getLlm().invoke([
            new SystemMessage(prompt),
        ]);

        return {
            answer: response.content.toString(),
            sql,
            rowCount: count,
            searchType: 'sql',
        };
    }

    // Standard methods
    async ingest(request: any): Promise<any> {
        try {
            const docId = await this.embeddingsService.storeDocument(
                request.content, request.category, request.metadata || {},
                request.sourceTable, request.sourceId
            );
            return { success: !!docId, documentId: docId };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async bulkIngest(documents: any[]): Promise<any> {
        let success = 0, failed = 0;
        for (const doc of documents) {
            (await this.ingest(doc)).success ? success++ : failed++;
        }
        return { total: documents.length, success, failed };
    }

    async indexExistingData(): Promise<any> {
        let indexed = 0;
        const details: Record<string, number> = {};

        const sources = [
            {
                table: 'career_roles', query: `SELECT id, career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 300`,
                format: (r: any) => `Career: ${r.career_role_name}. ${r.short_description || ''}`, cat: 'career'
            },
            {
                table: 'trait_based_course_details', query: `SELECT id, course_name, notes FROM trait_based_course_details WHERE is_deleted = false LIMIT 300`,
                format: (r: any) => `Course: ${r.course_name}. ${r.notes || ''}`, cat: 'course'
            },
            {
                table: 'programs', query: `SELECT id, name, description FROM programs WHERE is_active = true`,
                format: (r: any) => `Program: ${r.name}. ${r.description || ''}`, cat: 'program'
            },
            {
                table: 'personality_traits', query: `SELECT id, blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true`,
                format: (r: any) => `Trait: ${r.blended_style_name}. ${r.blended_style_desc || ''}`, cat: 'trait'
            },
        ];

        for (const src of sources) {
            try {
                const rows = await this.dataSource.query(src.query);
                for (const row of rows) {
                    await this.ingest({ content: src.format(row), category: src.cat, sourceTable: src.table, sourceId: row.id });
                    indexed++;
                }
                details[src.table] = rows.length;
            } catch (e) { details[src.table] = 0; }
        }
        return { indexed, details };
    }

    async rebuildKnowledgeBase(): Promise<any> {
        try {
            await this.dataSource.query('DELETE FROM rag_embeddings');
            await this.dataSource.query('DELETE FROM rag_documents');
        } catch (e) { }
        return this.indexExistingData();
    }

    async getStatus(): Promise<any> {
        const embeddingStatus = this.embeddingsService.getStatus();
        let documentCount = 0, categories = {};
        try {
            const r = await this.dataSource.query('SELECT COUNT(*) as count FROM rag_documents');
            documentCount = parseInt(r[0].count);
            const cats = await this.dataSource.query('SELECT category, COUNT(*) as count FROM rag_documents GROUP BY category');
            categories = Object.fromEntries(cats.map((c: any) => [c.category, parseInt(c.count)]));
        } catch (e) { }
        return { status: 'ok', service: 'rag', embeddings: embeddingStatus, documentCount, categories };
    }

    async seedKnowledgeBase() { return this.indexExistingData(); }
    async generatePdf(data: any, question: string) { return Buffer.from(`Query: ${question}\n\n${data.answer}`); }
}
