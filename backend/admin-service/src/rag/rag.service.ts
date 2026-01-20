import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║           PRODUCTION RAG v11.0 - ENTERPRISE GRADE                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  ARCHITECTURE:                                                            ║
 * ║  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐ ║
 * ║  │   QUERY     │ → │    LLM      │ → │    SQL      │ → │  RESPONSE  │ ║
 * ║  │ UNDERSTAND  │    │ INTERPRET   │    │  EXECUTE    │    │  FORMAT    │ ║
 * ║  └─────────────┘    └─────────────┘    └─────────────┘    └────────────┘ ║
 * ║                                                                           ║
 * ║  FEATURES:                                                                ║
 * ║  • LLM-powered query understanding (handles typos, variations)            ║
 * ║  • Personality insights (DISC + Agile ACI)                                ║
 * ║  • Smart SQL generation                                                   ║
 * ║  • Professional response formatting                                       ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

interface QueryResult {
    answer: string;
    searchType: string;
    sources?: any;
    confidence: number;
    reportUrl?: string;
    reportId?: string;
}

// Complete Database Schema
const COMPLETE_SCHEMA = `
═══════════════════════════════════════════════════════════════════════════════
ORIGINBI DATABASE SCHEMA
═══════════════════════════════════════════════════════════════════════════════

TABLE: users
Columns: email, role, is_active, is_blocked, login_count, last_login_at
Notes: System users (admins, managers). Role can be ADMIN, SUPER_ADMIN, CORPORATE, STUDENT

TABLE: registrations  
Columns: full_name, mobile_number, gender, status, registration_source
Notes: Candidates/students. ALWAYS use full_name for person searches. Status: INCOMPLETE, COMPLETED, CANCELLED

TABLE: assessment_attempts
Columns: registration_id, program_id, total_score, status, dominant_trait_id, started_at, completed_at
Notes: Exam results. JOIN with registrations ON registration_id for candidate name. dominant_trait_id links to personality_traits

TABLE: personality_traits
Columns: id, blended_style_name, blended_style_desc
Notes: DISC behavioral styles. Join using assessment_attempts.dominant_trait_id = personality_traits.id

TABLE: assessment_levels
Columns: name, description, duration_minutes, max_score
Notes: Types of assessments (Behavioral, Agile, etc.)

TABLE: programs
Columns: code, name, description, is_active, is_demo
Notes: Assessment programs

TABLE: career_roles
Columns: career_role_name, short_description, is_active
Notes: Job roles for career matching

TABLE: corporate_accounts
Columns: company_name, sector_code, total_credits, available_credits
Notes: Company accounts

TABLE: groups
Columns: code, name
Notes: Candidate batches

═══════════════════════════════════════════════════════════════════════════════
`;

// Agile ACI Score Interpretation
const AGILE_LEVELS = {
    naturalist: { min: 100, max: 125, name: 'Agile Naturalist', desc: 'Lives the Agile mindset naturally with balance between speed, empathy, and accountability.' },
    adaptive: { min: 75, max: 99, name: 'Agile Adaptive', desc: 'Works well in dynamic situations and motivates others through enthusiasm.' },
    learner: { min: 50, max: 74, name: 'Agile Learner', desc: 'Open to Agile ideas but may need guidance for consistency.' },
    resistant: { min: 0, max: 49, name: 'Agile Resistant', desc: 'Prefers structure and predictability. Needs gradual exposure to flexibility.' }
};

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private llm: ChatGroq | null = null;
    private reportsDir: string;

    constructor(
        private dataSource: DataSource,
        private embeddingsService: EmbeddingsService,
        private futureRoleReportService: FutureRoleReportService,
        private overallRoleFitmentService: OverallRoleFitmentService,
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

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN QUERY ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════════════
    async query(question: string, user: any): Promise<QueryResult> {
        if (!question?.trim()) {
            return { answer: 'Please ask a question.', searchType: 'none', confidence: 0 };
        }

        this.logger.log(`\n${'═'.repeat(70)}`);
        this.logger.log(`🤖 RAG v11.0 - Production`);
        this.logger.log(`📝 Query: "${question}"`);

        try {
            // ═══════════════════════════════════════════════════════════════
            // STEP 1: LLM QUERY UNDERSTANDING
            // ═══════════════════════════════════════════════════════════════
            const interpretation = await this.understandQuery(question);
            this.logger.log(`🎯 Intent: ${interpretation.intent}`);
            this.logger.log(`🔍 Search: ${interpretation.searchTerm || 'general'}`);

            // ═══════════════════════════════════════════════════════════════
            // SPECIAL HANDLERS: GREETING & HELP
            // ═══════════════════════════════════════════════════════════════
            if (interpretation.intent === 'greeting') {
                return {
                    answer: `**👋 Hello!** I'm the OriginBI Assistant.\n\nI can help you with:\n• **Users & Candidates** - "list users", "show candidates"\n• **Test Results** - "test results", "[name]'s score"\n• **Career Reports** - "career report for [name]"\n• **Overall Reports** - "overall report", "placement report"\n• **Best Performers** - "top performer", "best score"\n• **Career Roles** - "show career roles"\n• **Counts** - "how many users"\n\nWhat would you like to know?`,
                    searchType: 'greeting',
                    confidence: 1.0,
                };
            }

            if (interpretation.intent === 'help') {
                return {
                    answer: `**🤖 OriginBI Assistant - Help**\n\n**Available Commands:**\n\n📊 **Data Queries:**\n• "list users" - Show all system users\n• "show candidates" - List registered candidates\n• "test results" - View assessment results\n• "career roles" - Available career paths\n\n👤 **Person-Specific:**\n• "[name]'s score" - Individual test results\n• "career report for [name]" - Full career fitment report\n• "show [name]'s results" - Assessment details\n\n📋 **Group Reports:**\n• "overall report" - Group role fitment by personality\n• "placement report" - Placement guidance for all students\n• "role fitment report" - Roles mapped to personality types\n\n🏆 **Analytics:**\n• "best performer" - Top scoring candidates\n• "how many users" - User counts\n• "total candidates" - Registration stats\n\n**Tips:**\n• If multiple people share a name, I'll ask you to pick one\n• Career reports include personality insights and role fitment analysis`,
                    searchType: 'help',
                    confidence: 1.0,
                };
            }


            // ═══════════════════════════════════════════════════════════════
            // SPECIAL HANDLER: CAREER REPORT GENERATION
            // ═══════════════════════════════════════════════════════════════
            if (interpretation.intent === 'career_report') {
                return await this.handleCareerReport(interpretation.searchTerm);
            }

            // ═══════════════════════════════════════════════════════════════
            // SPECIAL HANDLER: OVERALL ROLE FITMENT REPORT
            // ═══════════════════════════════════════════════════════════════
            if (interpretation.intent === 'overall_report') {
                return await this.handleOverallReport(user);
            }

            // ═══════════════════════════════════════════════════════════════
            // STEP 2: EXECUTE QUERY
            // ═══════════════════════════════════════════════════════════════
            const data = await this.executeQuery(interpretation);
            this.logger.log(`📊 Results: ${data.length} rows`);

            // ═══════════════════════════════════════════════════════════════
            // STEP 3: FORMAT RESPONSE
            // ═══════════════════════════════════════════════════════════════
            const answer = this.formatResponse(interpretation, data);

            return {
                answer,
                searchType: interpretation.intent,
                sources: { rows: data.length },
                confidence: data.length > 0 ? 0.95 : 0.3,
            };

        } catch (error) {
            this.logger.error(`❌ Error: ${error.message}`);
            return {
                answer: `Sorry, I couldn't process that. Try: "list users", "test results", or "show [person name]'s score"`,
                searchType: 'error',
                confidence: 0,
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAREER REPORT HANDLER - WITH DISAMBIGUATION
    // ═══════════════════════════════════════════════════════════════════════════
    private async handleCareerReport(searchTerm: string | null): Promise<QueryResult> {
        if (!searchTerm) {
            return {
                answer: `**📋 To generate a Career Fitment Report, I need more information:**\n\nPlease specify the person's name, e.g.:\n• "generate career report for Anjaly"\n• "career report for John"\n• "future role readiness for Priya"`,
                searchType: 'career_report',
                confidence: 0.3,
            };
        }

        // Check if user specified a number (e.g., "anjaly #2" or "anjaly 2")
        const numberMatch = searchTerm.match(/(.+?)\s*[#]?\s*(\d+)$/);
        let targetIndex = 0;
        let cleanSearchTerm = searchTerm;

        if (numberMatch) {
            cleanSearchTerm = numberMatch[1].trim();
            targetIndex = parseInt(numberMatch[2]) - 1; // Convert to 0-based index
        }

        // Fetch ALL matching people (not just one)
        try {
            const personData = await this.dataSource.query(`
                SELECT 
                    registrations.id,
                    registrations.full_name,
                    registrations.gender,
                    registrations.mobile_number,
                    users.email,
                    assessment_attempts.total_score,
                    personality_traits.blended_style_name as behavioral_style,
                    personality_traits.blended_style_desc as behavior_description
                FROM registrations
                LEFT JOIN users ON registrations.user_id = users.id
                LEFT JOIN assessment_attempts ON assessment_attempts.registration_id = registrations.id
                LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
                WHERE registrations.full_name ILIKE '%${cleanSearchTerm}%'
                AND registrations.is_deleted = false
                ORDER BY registrations.created_at DESC
                LIMIT 10
            `);

            if (!personData.length) {
                return {
                    answer: `**❌ No candidate found with name "${cleanSearchTerm}"**\n\nPlease check the name and try again.`,
                    searchType: 'career_report',
                    confidence: 0.3,
                };
            }

            // DISAMBIGUATION: If multiple matches found
            if (personData.length > 1 && !numberMatch) {
                let response = `**👥 Multiple candidates found with name "${cleanSearchTerm}":**\n\n`;
                response += `Please specify which one by number:\n\n`;

                personData.forEach((person: any, index: number) => {
                    const email = person.email ? ` | ${person.email}` : '';
                    const mobile = person.mobile_number ? ` | ${person.mobile_number.slice(-4)}` : '';
                    const score = person.total_score ? ` | Score: ${person.total_score}%` : '';
                    response += `**${index + 1}.** ${person.full_name}${email}${mobile}${score}\n`;
                });

                response += `\n**Example:** "career report for ${cleanSearchTerm} #1" or "career report for ${cleanSearchTerm} #2"`;

                return {
                    answer: response,
                    searchType: 'disambiguation',
                    confidence: 0.7,
                };
            }

            // Validate index if number was specified
            if (targetIndex >= personData.length) {
                return {
                    answer: `**❌ Invalid selection.** Only ${personData.length} candidate(s) found with name "${cleanSearchTerm}".\n\nPlease use a number between 1 and ${personData.length}.`,
                    searchType: 'career_report',
                    confidence: 0.3,
                };
            }

            const person = personData[targetIndex];

            // Generate the full Career Fitment Report
            const report = await this.futureRoleReportService.generateReport({
                name: person.full_name || searchTerm,
                currentRole: 'Assessment Candidate',
                currentJobDescription: 'Completed behavioral and skill assessments through the OriginBI platform.',
                yearsOfExperience: 0,
                relevantExperience: 'Based on assessment data',
                currentIndustry: 'Assessment',
                expectedFutureRole: 'To be determined based on assessment results',
                behavioralStyle: person.behavioral_style || undefined,
                behavioralDescription: person.behavior_description || undefined,
                agileScore: person.total_score ? parseFloat(person.total_score) : undefined,
            });

            return {
                answer: report.fullReportText,
                searchType: 'career_report',
                reportId: report.reportId,
                confidence: 0.95,
            };

        } catch (error) {
            this.logger.error(`Career report error: ${error.message}`);
            return {
                answer: `**❌ Error generating report:** ${error.message}`,
                searchType: 'error',
                confidence: 0,
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERALL ROLE FITMENT REPORT HANDLER
    // ═══════════════════════════════════════════════════════════════════════════
    private async handleOverallReport(user: any): Promise<QueryResult> {
        try {
            this.logger.log(`📊 Generating Overall Role Fitment Report`);

            // Get corporate/group context from user if available
            const input = {
                corporateId: user?.corporate_id,
                title: 'Placement Guidance Report',
            };

            const report = await this.overallRoleFitmentService.generateReport(input);

            return {
                answer: this.overallRoleFitmentService.formatForChat(report),
                searchType: 'overall_report',
                reportId: report.reportId,
                confidence: 0.95,
            };

        } catch (error) {
            this.logger.error(`Overall report error: ${error.message}`);
            return {
                answer: `**❌ Error generating overall report:** ${error.message}\n\nPlease ensure there are completed assessments with personality data.`,
                searchType: 'error',
                confidence: 0,
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LLM-POWERED QUERY UNDERSTANDING
    // ═══════════════════════════════════════════════════════════════════════════
    private async understandQuery(question: string): Promise<{
        intent: string;
        searchTerm: string | null;
        table: string;
        includePersonality: boolean;
    }> {
        const prompt = `You are a query interpreter for OriginBI assessment platform.

Analyze this user query and extract:
1. INTENT: What does the user want? (greeting, help, list_users, list_candidates, test_results, person_lookup, best_performer, career_roles, career_report, overall_report, count)
2. SEARCH_TERM: Any specific name or keyword to search (null if general query)
3. TABLE: Primary table to query (users, registrations, assessment_attempts, career_roles, programs, none)
4. INCLUDE_PERSONALITY: Should we include DISC behavioral style and Agile score? (true for test results, person lookups, career reports)

USER QUERY: "${question}"

EXAMPLES:
"hi" → {"intent":"greeting","searchTerm":null,"table":"none","includePersonality":false}
"hello" → {"intent":"greeting","searchTerm":null,"table":"none","includePersonality":false}
"hey" → {"intent":"greeting","searchTerm":null,"table":"none","includePersonality":false}
"good morning" → {"intent":"greeting","searchTerm":null,"table":"none","includePersonality":false}
"help" → {"intent":"help","searchTerm":null,"table":"none","includePersonality":false}
"what can you do" → {"intent":"help","searchTerm":null,"table":"none","includePersonality":false}
"list all users" → {"intent":"list_users","searchTerm":null,"table":"users","includePersonality":false}
"show test results" → {"intent":"test_results","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"anjaly's score" → {"intent":"person_lookup","searchTerm":"anjaly","table":"assessment_attempts","includePersonality":true}
"user details" → {"intent":"list_users","searchTerm":null,"table":"users","includePersonality":false}
"candidates" → {"intent":"list_candidates","searchTerm":null,"table":"registrations","includePersonality":false}
"best performer" → {"intent":"best_performer","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"career roles" → {"intent":"career_roles","searchTerm":null,"table":"career_roles","includePersonality":false}
"generate career report for anjaly" → {"intent":"career_report","searchTerm":"anjaly","table":"assessment_attempts","includePersonality":true}
"career report for john" → {"intent":"career_report","searchTerm":"john","table":"assessment_attempts","includePersonality":true}
"future role readiness for priya" → {"intent":"career_report","searchTerm":"priya","table":"assessment_attempts","includePersonality":true}
"overall report" → {"intent":"overall_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"placement report" → {"intent":"overall_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"group role fitment" → {"intent":"overall_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"role fitment report" → {"intent":"overall_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"how many users" → {"intent":"count","searchTerm":null,"table":"users","includePersonality":false}

Respond with ONLY valid JSON, no explanation:`;

        try {
            const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
            const jsonStr = response.content.toString().trim();
            const parsed = JSON.parse(jsonStr);
            return {
                intent: parsed.intent || 'list_users',
                searchTerm: parsed.searchTerm || null,
                table: parsed.table || 'users',
                includePersonality: parsed.includePersonality || false,
            };
        } catch (error) {
            this.logger.warn(`Query interpretation failed, using fallback`);
            return this.fallbackInterpretation(question);
        }
    }

    private fallbackInterpretation(question: string): { intent: string; searchTerm: string | null; table: string; includePersonality: boolean } {
        const q = question.toLowerCase();

        // Career report generation - CHECK FIRST
        if (q.match(/career\s*report|future\s*role|role\s*readiness|generate.*report/)) {
            const name = this.extractName(question);
            return { intent: 'career_report', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
        }

        // Best performer
        if (q.match(/best|top|highest|winner/)) {
            return { intent: 'best_performer', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
        }
        // Test/exam results
        if (q.match(/test|exam|result|score|assessment/) && !q.match(/report/)) {
            const name = this.extractName(question);
            return { intent: name ? 'person_lookup' : 'test_results', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
        }
        // Users
        if (q.match(/user/)) {
            return { intent: 'list_users', searchTerm: null, table: 'users', includePersonality: false };
        }
        // Candidates
        if (q.match(/candidate|registration|student/)) {
            return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
        }
        // Career roles
        if (q.match(/career|role|job/)) {
            return { intent: 'career_roles', searchTerm: null, table: 'career_roles', includePersonality: false };
        }
        // Count
        if (q.match(/how many|count/)) {
            return { intent: 'count', searchTerm: null, table: 'users', includePersonality: false };
        }

        // Default - try to find a name
        const name = this.extractName(question);
        if (name) {
            return { intent: 'person_lookup', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
        }

        return { intent: 'list_users', searchTerm: null, table: 'users', includePersonality: false };
    }

    private extractName(question: string): string | null {
        const patterns = [
            /(?:for|about|of)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
            /([A-Za-z]+)'s?\s+(?:test|exam|score|result)/i,
            /(?:show|get|find)\s+([A-Za-z]+)(?:'s)?/i,
        ];

        const stopWords = ['test', 'exam', 'score', 'result', 'user', 'all', 'the', 'show', 'get', 'list', 'find', 'best', 'top'];

        for (const pattern of patterns) {
            const match = question.match(pattern);
            if (match && match[1] && !stopWords.includes(match[1].toLowerCase())) {
                return match[1];
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUERY EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════
    private async executeQuery(interpretation: { intent: string; searchTerm: string | null; table: string; includePersonality: boolean }): Promise<any[]> {
        let sql = '';

        switch (interpretation.intent) {
            case 'list_users':
                sql = `SELECT email, role, is_active, login_count FROM users ORDER BY login_count DESC LIMIT 15`;
                break;

            case 'list_candidates':
                sql = `SELECT full_name, gender, status, mobile_number FROM registrations WHERE is_deleted = false ORDER BY created_at DESC LIMIT 15`;
                break;

            case 'test_results':
            case 'best_performer':
                sql = `
                    SELECT 
                        registrations.full_name,
                        assessment_attempts.total_score,
                        assessment_attempts.status,
                        personality_traits.blended_style_name as behavioral_style,
                        personality_traits.blended_style_desc as behavior_description,
                        programs.name as program_name
                    FROM assessment_attempts
                    JOIN registrations ON assessment_attempts.registration_id = registrations.id
                    LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
                    LEFT JOIN programs ON assessment_attempts.program_id = programs.id
                    WHERE assessment_attempts.status = 'COMPLETED'
                    ORDER BY assessment_attempts.total_score DESC
                    LIMIT 15
                `;
                break;

            case 'person_lookup':
                const name = interpretation.searchTerm || '';
                sql = `
                    SELECT 
                        registrations.full_name,
                        registrations.gender,
                        registrations.mobile_number,
                        assessment_attempts.total_score,
                        assessment_attempts.status,
                        personality_traits.blended_style_name as behavioral_style,
                        personality_traits.blended_style_desc as behavior_description,
                        programs.name as program_name
                    FROM registrations
                    LEFT JOIN assessment_attempts ON assessment_attempts.registration_id = registrations.id
                    LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
                    LEFT JOIN programs ON assessment_attempts.program_id = programs.id
                    WHERE registrations.full_name ILIKE '%${name}%'
                    AND registrations.is_deleted = false
                    LIMIT 10
                `;
                break;

            case 'career_roles':
                sql = `SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false AND is_active = true LIMIT 15`;
                break;

            case 'count':
                if (interpretation.table === 'users') {
                    sql = `SELECT COUNT(*) as count FROM users`;
                } else if (interpretation.table === 'registrations') {
                    sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false`;
                } else {
                    sql = `SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'COMPLETED'`;
                }
                break;

            default:
                sql = `SELECT email, role, is_active FROM users LIMIT 10`;
        }

        try {
            this.logger.log(`🔍 SQL: ${sql.substring(0, 80)}...`);
            return await this.dataSource.query(sql);
        } catch (error) {
            this.logger.error(`SQL Error: ${error.message}`);
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPONSE FORMATTING
    // ═══════════════════════════════════════════════════════════════════════════
    private formatResponse(interpretation: { intent: string; searchTerm: string | null; includePersonality: boolean }, data: any[]): string {
        if (!data.length) {
            return `No results found. Try:\n• "list users"\n• "show test results"\n• "candidates"\n• "[name]'s score"`;
        }

        switch (interpretation.intent) {
            case 'test_results':
            case 'best_performer':
            case 'person_lookup':
                return this.formatTestResults(data, interpretation.intent === 'best_performer');

            case 'list_users':
                return this.formatUserList(data);

            case 'list_candidates':
                return this.formatCandidateList(data);

            case 'career_roles':
                return this.formatCareerRoles(data);

            case 'count':
                return `**Total: ${data[0]?.count || 0}**`;

            default:
                return this.formatGenericList(data);
        }
    }

    private formatTestResults(data: any[], isBestPerformer: boolean): string {
        let response = isBestPerformer ? '**🏆 Top Performers:**\n\n' : '**📊 Assessment Results:**\n\n';

        data.slice(0, 5).forEach((row, i) => {
            const name = row.full_name || 'Unknown';
            const score = row.total_score ? parseFloat(row.total_score).toFixed(0) : 'N/A';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';

            response += `${medal} **${name}** - Score: **${score}%**\n`;

            // Behavioral Style (DISC) - FULL description
            if (row.behavioral_style) {
                response += `   📋 **Style: ${row.behavioral_style}**\n`;
                if (row.behavior_description) {
                    response += `   ${row.behavior_description}\n`;
                }
            }

            // Agile Compatibility - with FULL description
            const scoreNum = parseFloat(score);
            if (!isNaN(scoreNum)) {
                const agile = this.getAgileLevel(scoreNum);
                response += `   🎯 **${agile.name}**: ${agile.desc}\n`;
            }

            response += '\n';
        });

        if (data.length > 5) {
            response += `*... and ${data.length - 5} more*`;
        }

        return response.trim();
    }

    private getAgileLevel(score: number): { name: string; desc: string } {
        if (score >= 100) return { name: AGILE_LEVELS.naturalist.name, desc: AGILE_LEVELS.naturalist.desc };
        if (score >= 75) return { name: AGILE_LEVELS.adaptive.name, desc: AGILE_LEVELS.adaptive.desc };
        if (score >= 50) return { name: AGILE_LEVELS.learner.name, desc: AGILE_LEVELS.learner.desc };
        return { name: AGILE_LEVELS.resistant.name, desc: AGILE_LEVELS.resistant.desc };
    }

    private formatUserList(data: any[]): string {
        let response = '**👥 Users:**\n\n';
        data.slice(0, 10).forEach((row, i) => {
            const status = row.is_active ? '✓' : '✗';
            response += `${i + 1}. ${row.email} | ${row.role} | ${status} Active | ${row.login_count || 0} logins\n`;
        });
        if (data.length > 10) response += `\n*... and ${data.length - 10} more*`;
        return response;
    }

    private formatCandidateList(data: any[]): string {
        let response = '**📋 Candidates:**\n\n';
        data.slice(0, 10).forEach((row, i) => {
            response += `${i + 1}. **${row.full_name}** | ${row.gender || 'N/A'} | ${row.status}\n`;
        });
        if (data.length > 10) response += `\n*... and ${data.length - 10} more*`;
        return response;
    }

    private formatCareerRoles(data: any[]): string {
        let response = '**💼 Career Roles:**\n\n';
        data.forEach((row, i) => {
            response += `${i + 1}. **${row.career_role_name}**\n`;
            if (row.short_description) {
                response += `   ${row.short_description.slice(0, 80)}...\n`;
            }
        });
        return response;
    }

    private formatGenericList(data: any[]): string {
        let response = `**Found ${data.length} results:**\n\n`;
        const keys = Object.keys(data[0]).filter(k => !k.includes('id') && !k.includes('_at'));
        data.slice(0, 8).forEach((row, i) => {
            response += `${i + 1}. ${keys.map(k => row[k]).filter(v => v).join(' | ')}\n`;
        });
        return response;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERVICE METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    async getStatus(): Promise<any> {
        let totalDocs = 0;
        try {
            const r = await this.dataSource.query('SELECT COUNT(*) as count FROM rag_documents');
            totalDocs = parseInt(r[0].count);
        } catch { }

        return {
            status: 'ok',
            version: '11.0.0-production',
            features: ['llm_query_understanding', 'disc_personality', 'agile_aci', 'smart_formatting'],
            knowledgeBase: { documents: totalDocs },
        };
    }

    async seedKnowledgeBase() { return { indexed: 0 }; }
    async rebuildKnowledgeBase() { return { indexed: 0 }; }
    async ingest(req: any) {
        const id = await this.embeddingsService.storeDocument(req.content, req.category, req.metadata, req.sourceTable, req.sourceId);
        return { success: !!id, documentId: id };
    }
    async bulkIngest(docs: any[]) { return this.embeddingsService.bulkStoreDocuments(docs); }
    async indexExistingData() { return { indexed: 0 }; }
    async generatePdf(data: any, q: string) { return Buffer.from(`Query: ${q}\n\n${data.answer}`); }
}
