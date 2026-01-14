import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PRODUCTION AGENTIC RAG v6.0
 * - Direct, concise answers (no filler)
 * - Assessment/Exam results support
 * - Smart report generation with analysis
 * - Intent-based routing
 */

type Intent = 'DATA_QUERY' | 'REPORT' | 'COMPARE' | 'EXPLAIN' | 'LIST' | 'COUNT' | 'EXAM_RESULT';

interface QueryResult {
    answer: string;
    searchType: string;
    sources?: any;
    confidence: number;
    reportUrl?: string;
    reportId?: string;
    intent?: string;
}

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private llm: ChatGroq | null = null;
    private reportsDir: string;

    constructor(
        private dataSource: DataSource,
        private embeddingsService: EmbeddingsService,
    ) {
        this.reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

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
     * Main Query Entry - Agentic Flow
     */
    async query(question: string, user: any): Promise<QueryResult> {
        if (!question?.trim()) {
            return { answer: 'Please ask a question.', searchType: 'none', confidence: 0 };
        }

        this.logger.log(`🤖 Query: "${question}"`);

        try {
            const intent = this.classifyIntent(question);
            this.logger.log(`📋 Intent: ${intent}`);

            // Execute SQL with intent-aware query generation
            const sqlResult = await this.executeSqlQuery(question, intent);
            const semanticResults = await this.embeddingsService.semanticSearch(question, 5, undefined, 0.2);

            // Handle special intents
            if (intent === 'REPORT') {
                return await this.handleReportIntent(question, sqlResult, user);
            }

            if (intent === 'COMPARE') {
                return await this.handleCompareIntent(question);
            }

            // Generate direct response
            return await this.generateDirectResponse(question, sqlResult, semanticResults, intent);

        } catch (error) {
            this.logger.error('Query failed:', error.message);
            return {
                answer: `Sorry, I couldn't process that. Please try rephrasing.`,
                searchType: 'error',
                confidence: 0,
            };
        }
    }

    /**
     * Enhanced Intent Classification
     */
    private classifyIntent(question: string): Intent {
        const q = question.toLowerCase();

        // Exam/Test/Assessment results
        if (q.match(/exam|test|result|score|assessment|attempt|performance/)) return 'EXAM_RESULT';

        // Count queries
        if (q.match(/how many|count|total|number of/)) return 'COUNT';

        // Report generation
        if (q.match(/report|generate|download|export|pdf/)) return 'REPORT';

        // Comparison
        if (q.match(/compare|vs|versus|difference|between.*and/)) return 'COMPARE';

        // Explanation
        if (q.match(/what is|explain|describe|tell me about|define/)) return 'EXPLAIN';

        // List
        if (q.match(/list|show|display|get all|find all/)) return 'LIST';

        return 'DATA_QUERY';
    }

    /**
     * Execute SQL with Enhanced Schema
     */
    private async executeSqlQuery(question: string, intent: Intent): Promise<{ success: boolean; sql?: string; data?: any[]; error?: string }> {
        try {
            const sql = await this.generateSQL(question, intent);
            if (!sql) return { success: false, error: 'Could not generate query' };

            this.logger.log(`🔍 SQL: ${sql}`);
            const data = await this.dataSource.query(sql);
            return { success: true, sql, data };
        } catch (error) {
            this.logger.warn(`SQL failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate SQL with Exam/Assessment Support
     */
    private async generateSQL(question: string, intent: Intent): Promise<string | null> {
        const prompt = `You are an expert PostgreSQL query writer for OriginBI.
Output ONLY the SQL query - no markdown, no explanation, no backticks.

DATABASE SCHEMA:
================
users: id, email, role, is_active, is_blocked, login_count, last_login_at
registrations: id, full_name (candidate name), email, gender, status, program_id, mobile_number, is_deleted
career_roles: id, career_role_name (THE NAME), short_description, is_active, is_deleted
career_role_tools: id, career_role_id, tool_name, is_deleted
trait_based_course_details: id, course_name, notes, compatibility_percentage, is_deleted
programs: id, code, name, description, is_active, is_demo
personality_traits: id, code, blended_style_name, blended_style_desc, is_active
corporate_accounts: id, company_name, sector_code, total_credits, available_credits, is_deleted
groups: id, code, name, corporate_account_id, is_deleted
departments: id, name, short_name, category, is_deleted
assessment_attempts: id, registration_id, program_id, status, score, created_at, updated_at
open_questions: id, registration_id, question, response, marks, is_deleted
assessment_summary: id, registration_id, program_id, total_score, percentile, created_at

QUERY EXAMPLES (NEVER include 'id' columns in SELECT):
===============
"how many users" → SELECT COUNT(*) as count FROM users WHERE is_active = true
"list users" → SELECT email, role, is_active, login_count FROM users WHERE is_active = true LIMIT 20
"user details" → SELECT email, role, is_active, is_blocked, login_count, last_login_at FROM users LIMIT 20
"show career roles" → SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 20
"find java developer" → SELECT career_role_name, short_description FROM career_roles WHERE career_role_name ILIKE '%java%' AND is_deleted = false
"show courses" → SELECT course_name, notes, compatibility_percentage FROM trait_based_course_details WHERE is_deleted = false LIMIT 20
"test user exam" → SELECT registrations.full_name, registrations.email, assessment_attempts.status, assessment_attempts.score FROM assessment_attempts JOIN registrations ON assessment_attempts.registration_id = registrations.id LIMIT 20
"exam results" → SELECT registrations.full_name, registrations.email, assessment_attempts.score, assessment_attempts.status FROM assessment_attempts JOIN registrations ON assessment_attempts.registration_id = registrations.id ORDER BY assessment_attempts.created_at DESC LIMIT 20
"test result for john" → SELECT registrations.full_name, registrations.email, assessment_attempts.score, assessment_attempts.status, programs.name as program FROM assessment_attempts JOIN registrations ON assessment_attempts.registration_id = registrations.id LEFT JOIN programs ON assessment_attempts.program_id = programs.id WHERE registrations.full_name ILIKE '%john%'
"assessment summary" → SELECT registrations.full_name, registrations.email, assessment_summary.total_score, assessment_summary.percentile FROM assessment_summary JOIN registrations ON assessment_summary.registration_id = registrations.id LIMIT 20
"show candidates" → SELECT full_name, email, gender, status, mobile_number FROM registrations WHERE is_deleted = false LIMIT 20
"count registrations" → SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false
"list companies" → SELECT company_name, sector_code, total_credits, available_credits FROM corporate_accounts WHERE is_deleted = false
"show programs" → SELECT code, name, description, is_active FROM programs WHERE is_active = true
"personality types" → SELECT blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true
"find user by email" → SELECT email, role, is_active, is_blocked, login_count FROM users WHERE email ILIKE '%keyword%'

STRICT RULES:
=============
1. Return ONLY the SQL query
2. NEVER use table aliases like u, cr
3. NEVER include 'id' columns in SELECT - show meaningful data only (email, role, name, etc.)
4. For career_roles: use career_role_name (NOT name)
5. Always add LIMIT 20 (except for COUNT)
6. Use is_deleted = false where column exists
7. Use ILIKE '%keyword%' for text search
8. For exam/test queries: JOIN assessment_attempts with registrations
9. Always include meaningful columns like email, role, name, status, score
10. For users: always include email, role, is_active at minimum

Question: "${question}"

SQL:`;

        try {
            const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
            let sql = response.content.toString().trim();

            sql = sql.replace(/```sql/gi, '').replace(/```/g, '').trim();
            sql = sql.split('\n')[0].trim();

            const upper = sql.toUpperCase();
            if (!upper.startsWith('SELECT')) return null;
            if (['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'].some(k => upper.includes(k + ' '))) return null;

            return sql;
        } catch (error) {
            this.logger.error('SQL generation failed:', error);
            return null;
        }
    }

    /**
     * Generate Direct Response - No Filler
     */
    private async generateDirectResponse(question: string, sqlResult: any, semanticResults: any[], intent: Intent): Promise<QueryResult> {
        if (!sqlResult.success || !sqlResult.data?.length) {
            // Try semantic fallback
            if (semanticResults.length > 0) {
                return {
                    answer: this.formatSemanticResponse(semanticResults),
                    searchType: intent,
                    sources: { semanticMatches: semanticResults.length },
                    confidence: 0.6,
                };
            }

            return {
                answer: `No data found for "${question}". Try: "list users", "show career roles", "exam results"`,
                searchType: 'none',
                confidence: 0.1,
            };
        }

        // Direct formatting based on intent
        const data = sqlResult.data;
        let answer: string;

        if (intent === 'COUNT') {
            const count = data[0]?.count || data.length;
            answer = `**${count}** records found.`;
        } else if (intent === 'EXAM_RESULT') {
            answer = this.formatExamResults(data);
        } else if (intent === 'LIST' || data.length > 1) {
            answer = this.formatListResponse(data, question);
        } else {
            answer = this.formatDataResponse(data);
        }

        return {
            answer,
            searchType: intent,
            sources: { sqlRowCount: data.length },
            confidence: 0.9,
            intent,
        };
    }

    /**
     * Format Exam/Assessment Results
     */
    private formatExamResults(data: any[]): string {
        if (!data.length) return 'No exam results found.';

        let response = `**Exam Results** (${data.length} records)\n\n`;

        data.slice(0, 10).forEach((row, i) => {
            const name = row.full_name || row.email || 'Unknown';
            const score = row.score !== undefined ? row.score : row.total_score || 'N/A';
            const status = row.status || '';
            const program = row.program || row.name || '';

            response += `${i + 1}. **${name}**`;
            if (score !== 'N/A') response += ` — Score: **${score}**`;
            if (status) response += ` (${status})`;
            if (program) response += ` [${program}]`;
            response += '\n';
        });

        if (data.length > 10) {
            response += `\n... and ${data.length - 10} more results.`;
        }

        return response;
    }

    /**
     * Format List Response - Smart Column Selection
     */
    private formatListResponse(data: any[], question: string): string {
        if (!data.length) return 'No results found.';

        // Filter out id columns and internal columns
        const skipColumns = ['id', 'created_at', 'updated_at', 'is_deleted', 'registration_id', 'program_id', 'career_role_id', 'corporate_account_id'];
        const allKeys = Object.keys(data[0]);
        const keys = allKeys.filter(k => !skipColumns.includes(k.toLowerCase()));

        // If all columns were filtered, use original keys minus just 'id'
        const displayKeys = keys.length > 0 ? keys : allKeys.filter(k => k.toLowerCase() !== 'id');

        let response = `**Found ${data.length} results:**\n\n`;

        data.slice(0, 15).forEach((row, i) => {
            // Find primary display field (prefer name, email, title)
            const primaryKey = displayKeys.find(k =>
                k.includes('name') || k.includes('email') || k.includes('title') || k === 'career_role_name'
            ) || displayKeys[0];

            const primary = row[primaryKey] || 'N/A';

            // Build detail string from other columns
            const details: string[] = [];
            displayKeys.forEach(key => {
                if (key !== primaryKey && row[key] !== null && row[key] !== undefined) {
                    const value = row[key];
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    // Format based on type
                    if (typeof value === 'boolean') {
                        details.push(`${label}: ${value ? 'Yes' : 'No'}`);
                    } else if (typeof value === 'string' && value.length < 50) {
                        details.push(`${label}: ${value}`);
                    } else if (typeof value === 'number') {
                        details.push(`${label}: ${value}`);
                    }
                }
            });

            response += `${i + 1}. **${primary}**`;
            if (details.length > 0) {
                response += `\n   ${details.slice(0, 4).join(' | ')}`;
            }
            response += '\n\n';
        });

        if (data.length > 15) {
            response += `... and ${data.length - 15} more.`;
        }

        return response.trim();
    }

    /**
     * Format Data Response
     */
    private formatDataResponse(data: any[]): string {
        if (!data.length) return 'No data found.';

        const row = data[0];
        const entries = Object.entries(row).slice(0, 6);

        let response = '';
        entries.forEach(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            response += `**${label}:** ${value}\n`;
        });

        return response;
    }

    /**
     * Format Semantic Response
     */
    private formatSemanticResponse(results: any[]): string {
        let response = 'Here\'s what I found:\n\n';
        results.slice(0, 5).forEach((r, i) => {
            response += `${i + 1}. ${r.content?.slice(0, 150)}...\n`;
        });
        return response;
    }

    /**
     * Handle Report Generation with Analysis
     */
    private async handleReportIntent(question: string, sqlResult: any, user: any): Promise<QueryResult> {
        // Analyze what report the user wants
        const reportType = this.analyzeReportType(question);

        // Get relevant data
        let reportData = sqlResult.data || [];
        let reportQuery = question;

        // If no data from initial query, try to get relevant data based on report type
        if (!reportData.length) {
            const fallbackResult = await this.getReportData(reportType);
            reportData = fallbackResult.data || [];
            reportQuery = fallbackResult.query;
        }

        const reportId = `report_${Date.now()}`;
        const reportPath = path.join(this.reportsDir, `${reportId}.txt`);

        // Build formatted report
        let content = this.buildReport(reportType, reportData, question);

        // Save report
        fs.writeFileSync(reportPath, content);

        const recordCount = reportData.length;

        return {
            answer: `📊 **${reportType} Report Generated**\n\nReport contains **${recordCount}** records.\n\n📥 **[Download Report](/rag/reports/${reportId})**`,
            searchType: 'report',
            sources: { records: recordCount },
            confidence: 0.95,
            reportUrl: `/rag/reports/${reportId}`,
            reportId: reportId,
            intent: 'REPORT',
        };
    }

    /**
     * Analyze Report Type
     */
    private analyzeReportType(question: string): string {
        const q = question.toLowerCase();

        if (q.includes('user')) return 'User Report';
        if (q.includes('exam') || q.includes('test') || q.includes('assessment')) return 'Assessment Report';
        if (q.includes('career') || q.includes('role')) return 'Career Roles Report';
        if (q.includes('course')) return 'Courses Report';
        if (q.includes('candidate') || q.includes('registration')) return 'Candidates Report';
        if (q.includes('company') || q.includes('corporate')) return 'Corporate Report';

        return 'Data Report';
    }

    /**
     * Get Report Data
     */
    private async getReportData(reportType: string): Promise<{ data: any[]; query: string }> {
        let query = '';

        switch (reportType) {
            case 'User Report':
                query = 'SELECT id, email, role, is_active, login_count FROM users LIMIT 100';
                break;
            case 'Assessment Report':
                query = `SELECT registrations.full_name, assessment_attempts.score, assessment_attempts.status, programs.name as program 
                         FROM assessment_attempts 
                         JOIN registrations ON assessment_attempts.registration_id = registrations.id 
                         LEFT JOIN programs ON assessment_attempts.program_id = programs.id 
                         ORDER BY assessment_attempts.created_at DESC LIMIT 100`;
                break;
            case 'Career Roles Report':
                query = 'SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false LIMIT 100';
                break;
            case 'Courses Report':
                query = 'SELECT course_name, notes, compatibility_percentage FROM trait_based_course_details WHERE is_deleted = false LIMIT 100';
                break;
            case 'Candidates Report':
                query = 'SELECT full_name, email, gender, status FROM registrations WHERE is_deleted = false LIMIT 100';
                break;
            default:
                query = 'SELECT id, email, role FROM users LIMIT 50';
        }

        try {
            const data = await this.dataSource.query(query);
            return { data, query };
        } catch {
            return { data: [], query };
        }
    }

    /**
     * Build Formatted Report
     */
    private buildReport(reportType: string, data: any[], question: string): string {
        const divider = '═'.repeat(60);
        const now = new Date().toLocaleString();

        let content = `
${divider}
                    ORIGINBI ${reportType.toUpperCase()}
${divider}

Generated: ${now}
Query: ${question}
Total Records: ${data.length}

${divider}
                         DATA
${divider}

`;

        if (data.length === 0) {
            content += 'No records found matching your criteria.\n';
        } else {
            // Get column headers
            const headers = Object.keys(data[0]);

            // Add header row
            content += headers.map(h => h.toUpperCase().padEnd(20)).join(' | ') + '\n';
            content += '-'.repeat(headers.length * 22) + '\n';

            // Add data rows
            data.forEach(row => {
                const values = headers.map(h => {
                    const val = row[h];
                    return String(val || '').slice(0, 18).padEnd(20);
                });
                content += values.join(' | ') + '\n';
            });
        }

        content += `
${divider}
                      END OF REPORT
${divider}
Generated by OriginBI RAG System v6.0
`;

        return content;
    }

    /**
     * Handle Comparison Intent
     */
    private async handleCompareIntent(question: string): Promise<QueryResult> {
        const match = question.match(/compare\s+(.+?)\s+(?:and|vs|versus|with)\s+(.+)/i) ||
            question.match(/(.+?)\s+vs\s+(.+)/i);

        if (!match) {
            return {
                answer: 'Please specify two items to compare. Example: "compare Java Developer and Python Developer"',
                searchType: 'compare',
                confidence: 0.3,
            };
        }

        const [, entity1, entity2] = match;

        const [result1, result2] = await Promise.all([
            this.executeSqlQuery(`find ${entity1.trim()}`, 'DATA_QUERY'),
            this.executeSqlQuery(`find ${entity2.trim()}`, 'DATA_QUERY'),
        ]);

        let answer = `**Comparison: ${entity1.trim()} vs ${entity2.trim()}**\n\n`;

        if (result1.success && result1.data && result1.data.length > 0) {
            answer += `**${entity1.trim()}:** Found ${result1.data.length} matches\n`;
        } else {
            answer += `**${entity1.trim()}:** No data found\n`;
        }

        if (result2.success && result2.data && result2.data.length > 0) {
            answer += `**${entity2.trim()}:** Found ${result2.data.length} matches\n`;
        } else {
            answer += `**${entity2.trim()}:** No data found\n`;
        }

        return {
            answer,
            searchType: 'compare',
            confidence: 0.8,
        };
    }

    // ============ Service Methods ============

    async getStatus(): Promise<any> {
        const embeddingStatus = this.embeddingsService.getStatus();
        const docStats = await this.embeddingsService.getDocumentStats();
        let totalDocs = 0;
        try {
            const r = await this.dataSource.query('SELECT COUNT(*) as count FROM rag_documents');
            totalDocs = parseInt(r[0].count);
        } catch { }

        return {
            status: 'ok',
            service: 'rag',
            version: '6.0.0-production',
            embeddings: embeddingStatus,
            knowledgeBase: { totalDocuments: totalDocs, categories: docStats, ready: totalDocs > 0 },
            capabilities: ['sql_query', 'semantic_search', 'compare', 'report_generation', 'exam_results'],
        };
    }

    async seedKnowledgeBase() { return { indexed: 0, note: 'Use SyncService for seeding' }; }
    async rebuildKnowledgeBase() { return this.seedKnowledgeBase(); }
    async ingest(req: any) {
        const id = await this.embeddingsService.storeDocument(req.content, req.category, req.metadata, req.sourceTable, req.sourceId);
        return { success: !!id, documentId: id };
    }
    async bulkIngest(docs: any[]) { return this.embeddingsService.bulkStoreDocuments(docs); }
    async indexExistingData() { return this.seedKnowledgeBase(); }
    async generatePdf(data: any, q: string) { return Buffer.from(`Query: ${q}\n\n${data.answer}`); }
}
