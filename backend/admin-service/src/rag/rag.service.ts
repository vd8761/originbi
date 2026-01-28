/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-base-to-string, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { ConversationService } from './conversation.service';
import { OriIntelligenceService } from './ori-intelligence.service';

import { MITHRA_PERSONA, getRandomResponse, getSignOff } from './ori-persona';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          🤖 MITHRA v2.0 - JARVIS EDITION                  ║
 * ║              OriginBI Intelligent - Your Career Guide                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║  • Personalized career guidance based on your personality                 ║
 * ║  • Job eligibility analysis with reasoning                                ║
 * ║  • Higher studies recommendations                                         ║
 * ║  • Emotional AI - friendly, supportive mentor                             ║
 * ║  • Answers ANY question intelligently                                     ║
 * ║  • Remembers your preferences and context                                 ║
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
  naturalist: {
    min: 100,
    max: 125,
    name: 'Agile Naturalist',
    desc: 'Lives the Agile mindset naturally with balance between speed, empathy, and accountability.',
  },
  adaptive: {
    min: 75,
    max: 99,
    name: 'Agile Adaptive',
    desc: 'Works well in dynamic situations and motivates others through enthusiasm.',
  },
  learner: {
    min: 50,
    max: 74,
    name: 'Agile Learner',
    desc: 'Open to Agile ideas but may need guidance for consistency.',
  },
  resistant: {
    min: 0,
    max: 49,
    name: 'Agile Resistant',
    desc: 'Prefers structure and predictability. Needs gradual exposure to flexibility.',
  },
};

@Injectable()
export class RagService {
  private readonly logger = new Logger('MITHRA');
  private llm: ChatGroq | null = null;
  private reportsDir: string;
  
  // Simple cache for query understanding to improve performance
  private queryCache = new Map<string, any>();
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

  constructor(
    private dataSource: DataSource,
    private embeddingsService: EmbeddingsService,
    private futureRoleReportService: FutureRoleReportService,
    private overallRoleFitmentService: OverallRoleFitmentService,
    private conversationService: ConversationService,
    private oriIntelligence: OriIntelligenceService,
  ) {
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    this.logger.log('🤖 MITHRA v2.0 initialized - Your intelligent career guide!');
  }

  private getLlm(): ChatGroq {
    if (!this.llm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set');
      this.llm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        timeout: 15000, // 15 second timeout for LLM calls
      });
    }
    return this.llm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN QUERY ENTRY POINT
  // ═══════════════════════════════════════════════════════════════════════════
  async query(question: string, user: any): Promise<QueryResult> {
    this.logger.log(`🚀 RAG Query Started at ${new Date().toISOString()}`);
    this.logger.log(`📝 Input Question: "${question}"`);
    this.logger.log(`👤 User:`, JSON.stringify(user));

    if (!question?.trim()) {
      this.logger.log(`❌ Empty question detected`);
      return {
        answer: 'Please ask a question.',
        searchType: 'none',
        confidence: 0,
      };
    }

    this.logger.log(`\n${'═'.repeat(70)}`);
    this.logger.log(`🤖 RAG v11.0 - Production`);
    this.logger.log(`📝 Query: "${question}"`);

    try {
      // Quick bypass for common greetings - avoid LLM call
      const normalizedQ = question.toLowerCase().trim();
      this.logger.log(`🔍 DEBUG: Normalized query = "${normalizedQ}"`);
      
      if (['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].includes(normalizedQ)) {
        this.logger.log('🎯 Intent: greeting (bypassed LLM)');
        return {
          answer: getRandomResponse(MITHRA_PERSONA.greetings),
          searchType: 'greeting',
          confidence: 1.0,
        };
      }

      if (['help', 'what can you do', 'what can you help me with'].includes(normalizedQ)) {
        this.logger.log('🎯 Intent: help (bypassed LLM)');
        return {
          answer: MITHRA_PERSONA.help,
          searchType: 'help',
          confidence: 1.0,
        };
      }

      this.logger.log('🔄 No bypass match, proceeding to LLM understanding...');

      // ═══════════════════════════════════════════════════════════════
      // STEP 1: LLM QUERY UNDERSTANDING (for complex queries only)
      // ═══════════════════════════════════════════════════════════════
      const interpretation = await this.understandQuery(question);
      this.logger.log(`🎯 Intent: ${interpretation.intent}`);
      this.logger.log(`🔍 Search: ${interpretation.searchTerm || 'general'}`);

      // ═══════════════════════════════════════════════════════════════
      // ORI GREETING & HELP - Jarvis-like personality
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'greeting') {
        return {
          answer: getRandomResponse(MITHRA_PERSONA.greetings),
          searchType: 'greeting',
          confidence: 1.0,
        };
      }

      if (interpretation.intent === 'help') {
        return {
          answer: MITHRA_PERSONA.help,
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
      // SPECIAL HANDLER: CUSTOM REPORT (Career Fitment, etc.)
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'custom_report') {
        return await this.handleCustomReport(user, interpretation.searchTerm, question);
      }

      // ═══════════════════════════════════════════════════════════════
      // 🧠 JARVIS-LIKE INTELLIGENT HANDLERS
      // Personal career guidance, job eligibility, higher studies, etc.
      // ═══════════════════════════════════════════════════════════════
      const qLower = question.toLowerCase();
      const userId = user?.id || user?.user_id || 0;
      const userEmail = user?.email || user?.sub || '';

      // Get user profile for personalization (using email if userId not available)
      const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);

      this.logger.log(`👤 User: ${userProfile?.name || 'Anonymous'} (${userEmail || 'no email'})`);

      // Store any facts the user shares
      if (userId || userEmail) {
        this.oriIntelligence.extractAndStoreFacts(userProfile?.userId || userId, question);
      }

      // ═══════════════════════════════════════════════════════════════
      // PERSONAL QUESTIONS: "what is my name", "my profile", etc.
      // ═══════════════════════════════════════════════════════════════
      const personalAnswer = this.oriIntelligence.answerPersonalQuestion(question, userProfile);
      if (personalAnswer) {
        this.logger.log('🎯 Detected: Personal question');
        return {
          answer: personalAnswer,
          searchType: 'personal_info',
          confidence: 0.98,
        };
      }

      // Questions about job eligibility
      if (qLower.includes('eligible') || qLower.includes('jobs for me') || qLower.includes('suitable') ||
        qLower.includes('what jobs') || qLower.includes('fit for') || qLower.includes('career for me')) {
        this.logger.log('🎯 Detected: Career eligibility question');
        const answer = await this.oriIntelligence.generateCareerGuidance(question, userProfile);
        return {
          answer,
          searchType: 'career_guidance',
          confidence: 0.95,
        };
      }

      // Questions about specific jobs ("can I try...", "can I become...")
      if ((qLower.includes('can i') || qLower.includes('should i')) &&
        (qLower.includes('try') || qLower.includes('apply') || qLower.includes('become') || qLower.includes('work as'))) {
        this.logger.log('🎯 Detected: Job compatibility question');
        const answer = await this.oriIntelligence.generateCareerGuidance(question, userProfile);
        return {
          answer,
          searchType: 'job_analysis',
          confidence: 0.95,
        };
      }

      // Higher studies questions
      if (qLower.includes('higher studies') || qLower.includes('masters') || qLower.includes('mba') ||
        qLower.includes('further studies') || qLower.includes('education') || qLower.includes('degree') ||
        qLower.includes('university') || qLower.includes('phd')) {
        this.logger.log('🎯 Detected: Higher studies question');
        const answer = await this.oriIntelligence.generateCareerGuidance(question, userProfile);
        return {
          answer,
          searchType: 'higher_studies',
          confidence: 0.95,
        };
      }

      // Personal questions about themselves or career advice
      if ((qLower.includes('my ') || qLower.includes('i am') || qLower.includes("i'm") || qLower.includes('me')) &&
        (qLower.includes('career') || qLower.includes('future') || qLower.includes('path') || qLower.includes('advice') ||
          qLower.includes('suggest') || qLower.includes('recommend') || qLower.includes('help me'))) {
        this.logger.log('🎯 Detected: Personal career advice question');
        const context = this.oriIntelligence.getConversationContext(userProfile?.userId || userId);
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, context);
        return {
          answer,
          searchType: 'personal_advice',
          confidence: 0.9,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // 🧠 GENERAL QUESTIONS - Route to LLM (courses, learning, how-to)
      // These should NOT search the database
      // ═══════════════════════════════════════════════════════════════
      const isGeneralQuestion =
        qLower.includes('what is') || qLower.includes('what are') || qLower.includes('how to') ||
        qLower.includes('how do') || qLower.includes('how can') || qLower.includes('best way') ||
        qLower.includes('course') || qLower.includes('learn') || qLower.includes('study') ||
        qLower.includes('become a') || qLower.includes('become an') || qLower.includes('best ') ||
        qLower.includes('which') || qLower.includes('should i') || qLower.includes('can you') ||
        qLower.includes('tell me about') || qLower.includes('explain') || qLower.includes('difference between') ||
        qLower.includes('compare') || qLower.includes('vs') || qLower.includes('versus') ||
        qLower.includes('tips') || qLower.includes('advice') || qLower.includes('recommend') ||
        qLower.includes('certification') || qLower.includes('skill') || qLower.includes('path');

      // Don't go to DB for general questions - use LLM directly
      if (isGeneralQuestion && !['list_users', 'list_candidates', 'test_results', 'career_roles', 'count'].includes(interpretation.intent)) {
        this.logger.log('🧠 Detected: General question - using LLM');
        const context = this.oriIntelligence.getConversationContext(userProfile?.userId || userId);
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, context);
        return {
          answer,
          searchType: 'intelligent_response',
          confidence: 0.9,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: EXECUTE QUERY (only for specific data queries)
      // ═══════════════════════════════════════════════════════════════
      const data = await this.executeQuery(interpretation);
      this.logger.log(`📊 Results: ${data.length} rows`);

      // If no data found, ALWAYS use LLM for intelligent response
      if (data.length === 0) {
        this.logger.log('🧠 No data found, using intelligent LLM response');
        const context = this.oriIntelligence.getConversationContext(userProfile?.userId || userId);
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, context);
        return {
          answer,
          searchType: 'intelligent_response',
          confidence: 0.85,
        };
      }

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
  // CAREER REPORT HANDLER - WITH SMART DEDUPLICATION & EMAIL MATCHING
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleCareerReport(
    searchTerm: string | null,
  ): Promise<QueryResult> {
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

    // Extract email if present in the search term (e.g., "anjaly anjaly@email.com")
    const emailMatch = cleanSearchTerm.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    let emailSearch = '';
    let nameSearch = cleanSearchTerm;

    if (emailMatch) {
      emailSearch = emailMatch[1];
      // Remove email from name search to get just the name
      nameSearch = cleanSearchTerm.replace(emailMatch[1], '').trim();
    }

    // Fetch UNIQUE people - deduplicated by registration ID with BEST score
    try {
      // Build smart WHERE clause
      let whereClause = '';
      if (emailSearch) {
        // If email is provided, prioritize exact email match
        whereClause = `(users.email ILIKE '%${emailSearch}%')`;
        if (nameSearch) {
          whereClause += ` OR (registrations.full_name ILIKE '%${nameSearch}%')`;
        }
      } else {
        // Search by name, also check if the search term looks like an email
        whereClause = `(registrations.full_name ILIKE '%${nameSearch}%' OR users.email ILIKE '%${nameSearch}%')`;
      }

      const personData = await this.dataSource.query(`
                SELECT 
                    r.id,
                    r.full_name,
                    r.gender,
                    r.mobile_number,
                    u.email,
                    aa.total_score,
                    pt.blended_style_name as behavioral_style,
                    pt.blended_style_desc as behavior_description,
                    (SELECT MAX(aa2.total_score) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id) as best_score,
                    (SELECT COUNT(*) FROM assessment_attempts aa3 WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count
                FROM registrations r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id 
                    AND aa.id = (SELECT id FROM assessment_attempts WHERE registration_id = r.id ORDER BY completed_at DESC LIMIT 1)
                LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
                WHERE (${whereClause})
                AND registrations.is_deleted = false
                ORDER BY registrations.id, assessment_attempts.total_score DESC NULLS LAST
                LIMIT 10
            `);

      if (!personData.length) {
        return {
          answer: `**❌ No candidate found matching "${cleanSearchTerm}"**\n\nPlease check the name or email and try again.`,
          searchType: 'career_report',
          confidence: 0.3,
        };
      }

      // If email was provided and exactly one match found, skip disambiguation
      const exactEmailMatch = emailSearch && personData.length === 1;

      // DISAMBIGUATION: If multiple UNIQUE people found (truly different registrations)
      if (personData.length > 1 && !numberMatch && !exactEmailMatch) {
        let response = `**👥 Multiple candidates found matching "${cleanSearchTerm}":**\n\n`;
        response += `Please specify which one by number:\n\n`;

        personData.forEach((person: any, index: number) => {
          const email = person.email ? ` | ${person.email}` : '';
          const mobile = person.mobile_number
            ? ` | ${person.mobile_number.slice(-4)}`
            : '';
          const attempts = person.attempt_count > 1
            ? ` (${person.attempt_count} attempts)`
            : '';
          response += `**${index + 1}.** ${person.full_name}${email}${mobile}${attempts}\n`;
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
          answer: `**❌ Invalid selection.** Only ${personData.length} candidate(s) found matching "${cleanSearchTerm}".\n\nPlease use a number between 1 and ${personData.length}.`,
          searchType: 'career_report',
          confidence: 0.3,
        };
      }

      const person = personData[targetIndex];

      // Use best_score for report generation if available
      const scoreToUse = person.best_score || person.total_score;

      // Generate the full Career Fitment Report
      const report = await this.futureRoleReportService.generateReport({
        name: person.full_name || searchTerm,
        currentRole: 'Assessment Candidate',
        currentJobDescription:
          'Completed behavioral and skill assessments through the OriginBI platform.',
        yearsOfExperience: 0,
        relevantExperience: 'Based on assessment data',
        currentIndustry: 'Assessment',
        expectedFutureRole: 'To be determined based on assessment results',
        behavioralStyle: person.behavioral_style || undefined,
        behavioralDescription: person.behavior_description || undefined,
        agileScore: scoreToUse
          ? parseFloat(scoreToUse)
          : undefined,
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
  // HANDLER: OVERALL ROLE FITMENT
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleOverallReport(user: any): Promise<QueryResult> {
    try {
      this.logger.log(`📊 Generating Overall Role Fitment Report`);

      const reportTitle = 'Placement Guidance Report';
      
      // Build input - only include groupId if user has one
      // If no groupId, the service will fetch ALL registrations (not filter by group)
      const input: any = {
        title: reportTitle,
      };

      // Only filter by group if the user has a group
      if (user?.group_id) {
        input.groupId = user.group_id;
      }
      
      // Build download URL - include groupId only if available
      let downloadUrl = `/rag/overall-report/pdf?title=${encodeURIComponent(reportTitle)}`;
      if (user?.group_id) {
        downloadUrl = `/rag/overall-report/pdf?groupId=${user.group_id}&title=${encodeURIComponent(reportTitle)}`;
      }

      const report = await this.overallRoleFitmentService.generateReport(input);

      return {
        answer: `I've generated the **Overall Role Fitment Report** for you. \n\n📄 **[Click here to download the PDF Report](${downloadUrl})**\n\nSince I can't display the full graphical report here, please download the PDF for the complete analysis including charts and tables.\n\nSummary:\n${this.overallRoleFitmentService.formatForChat(report)}`,
        searchType: 'overall_report',
        // reportId: report.reportId, // Not in RagResponse interface usually
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
  // HANDLER: CUSTOM REPORT (Career Fitment, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleCustomReport(user: any, searchTerm: string | null, question: string): Promise<QueryResult> {
    try {
      let targetUserId: number | null = null;
      let targetName = searchTerm;

      // If no searchTerm, try to extract name from question
      if (!targetName) {
        targetName = this.extractName(question);
      }

      // If we have a name, lookup the user
      if (targetName) {
        this.logger.log(`🔍 Looking up user by name: "${targetName}"`);

        const lookupSql = `
          SELECT r.user_id, r.full_name
          FROM registrations r
          WHERE LOWER(r.full_name) LIKE $1
          AND r.is_deleted = false
          ORDER BY r.created_at DESC
          LIMIT 1
        `;

        const results = await this.executeDatabaseQuery(lookupSql, [`%${targetName.toLowerCase()}%`]);

        if (results && results.length > 0) {
          targetUserId = parseInt(results[0].user_id);
          targetName = results[0].full_name;
          this.logger.log(`✅ Found user: ${targetName} (ID: ${targetUserId})`);
        } else {
          return {
            answer: `**⚠️ User "${targetName}" not found.** Please check the name and try again.\n\nYou can ask:\n- "Generate career fitment report for [full name]"\n- "Custom report for [person name]"`,
            searchType: 'error',
            confidence: 0,
          };
        }
      } else {
        // No name provided - require explicit name for custom reports
        return {
          answer: `**⚠️ Please specify a name for the report.** \n\nExample:\n- "Generate career fitment report for Anjaly"\n- "Custom report for John Smith"`,
          searchType: 'error',
          confidence: 0,
        };
      }

      if (!targetUserId) {
        return {
          answer: `**⚠️ No user specified.** Please provide a name to generate the report for.\n\nExample: "Generate career fitment report for Anjaly"`,
          searchType: 'error',
          confidence: 0,
        };
      }

      this.logger.log(`📊 Generating Custom Career Fitment Report for ${targetName} (userId: ${targetUserId})`);

      const downloadUrl = `/rag/custom-report/pdf?userId=${targetUserId}&type=career_fitment`;

      return {
        answer: `I'm ready to generate **${targetName}'s Career Fitment & Future Role Readiness Report**! 🎯\n\n📄 **[Click here to download the personalized PDF Report](${downloadUrl})**\n\nThis report includes:\n- Profile Snapshot\n- Behavioral Alignment Summary\n- Skill Assessment with AI-generated scores\n- Future Role Readiness Mapping\n- Role Fitment Score\n- Industry Suitability Analysis\n- Transition Requirements\n- Executive Insights\n\nDownload the PDF for the complete analysis!`,
        searchType: 'custom_report',
        confidence: 0.95,
      };
    } catch (error) {
      this.logger.error(`Custom report error: ${error.message}`);
      return {
        answer: `**❌ Error generating custom report:** ${error.message}`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  private async executeDatabaseQuery(sql: string, params: any[] = []): Promise<any[]> {
    const startTime = Date.now();
    try {
      const result = await this.dataSource.query(sql, params);
      const elapsed = Date.now() - startTime;
      if (elapsed > 1000) {
        this.logger.warn(`Slow query detected: ${elapsed}ms`);
      }
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      this.logger.error(`Query failed after ${elapsed}ms: ${error.message}`);
      throw error;
    }
  }
  private async understandQuery(question: string): Promise<{
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  }> {
    // Check cache first to avoid repeated LLM calls
    const cacheKey = question.toLowerCase().trim();
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      this.logger.log('📋 Using cached query understanding');
      return cached.result;
    }

    const prompt = `You are a query interpreter for OriginBI assessment platform.

Analyze this user query and extract:
1. INTENT: What does the user want? (greeting, help, list_users, list_candidates, test_results, person_lookup, best_performer, career_roles, career_report, overall_report, custom_report, count)
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
"generate my career fitment report" → {"intent":"custom_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"career fitment report" → {"intent":"custom_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"custom report" → {"intent":"custom_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"my fitment report" → {"intent":"custom_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"personalized report" → {"intent":"custom_report","searchTerm":null,"table":"assessment_attempts","includePersonality":true}
"custom report for anjaly" → {"intent":"custom_report","searchTerm":"anjaly","table":"assessment_attempts","includePersonality":true}
"generate career fitment report for john" → {"intent":"custom_report","searchTerm":"john","table":"assessment_attempts","includePersonality":true}
"fitment report for priya" → {"intent":"custom_report","searchTerm":"priya","table":"assessment_attempts","includePersonality":true}
"how many users" → {"intent":"count","searchTerm":null,"table":"users","includePersonality":false}

Respond with ONLY valid JSON, no explanation:`;

    try {
      const startTime = Date.now();
      const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
      const elapsed = Date.now() - startTime;
      
      this.logger.log(`🤖 LLM query understanding took ${elapsed}ms`);
      
      const jsonStr = response.content.toString().trim();
      const parsed = JSON.parse(jsonStr);
      const result = {
        intent: parsed.intent || 'list_users',
        searchTerm: parsed.searchTerm || null,
        table: parsed.table || 'users',
        includePersonality: parsed.includePersonality || false,
      };

      // Cache the result
      this.queryCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Clean old cache entries periodically
      if (this.queryCache.size > 100) {
        this.cleanCache();
      }

      return result;
    } catch (error) {
      this.logger.warn(`Query interpretation failed: ${error.message}, using fallback`);
      return this.fallbackInterpretation(question);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp >= this.CACHE_EXPIRY) {
        this.queryCache.delete(key);
      }
    }
  }

  private fallbackInterpretation(question: string): {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  } {
    const qLowerUniq = question.toLowerCase();

    // Custom report (career fitment, personalized) - CHECK FIRST
    if (
      qLowerUniq.match(/career\s*fitment|custom\s*report|my\s*fitment|personalized\s*report/)
    ) {
      return {
        intent: 'custom_report',
        searchTerm: null,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }

    // Career report generation for specific person
    if (
      qLowerUniq.match(/career\s*report|future\s*role|role\s*readiness|generate.*report/)
    ) {
      const name = this.extractName(question);
      return {
        intent: 'career_report',
        searchTerm: name,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }

    // Best performer
    if (qLowerUniq.match(/best|top|highest|winner/)) {
      return {
        intent: 'best_performer',
        searchTerm: null,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }
    // Test/exam results
    if (qLowerUniq.match(/test|exam|result|score|assessment/) && !qLowerUniq.match(/report/)) {
      const name = this.extractName(question);
      return {
        intent: name ? 'person_lookup' : 'test_results',
        searchTerm: name,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }
    // Users
    if (qLowerUniq.match(/user/)) {
      return {
        intent: 'list_users',
        searchTerm: null,
        table: 'users',
        includePersonality: false,
      };
    }
    // Candidates
    if (qLowerUniq.match(/candidate|registration|student/)) {
      return {
        intent: 'list_candidates',
        searchTerm: null,
        table: 'registrations',
        includePersonality: false,
      };
    }
    // Career roles
    if (qLowerUniq.match(/career|role|job/)) {
      return {
        intent: 'career_roles',
        searchTerm: null,
        table: 'career_roles',
        includePersonality: false,
      };
    }
    // Count
    if (qLowerUniq.match(/how many|count/)) {
      return {
        intent: 'count',
        searchTerm: null,
        table: 'users',
        includePersonality: false,
      };
    }

    // Default - try to find a name
    const name = this.extractName(question);
    if (name) {
      return {
        intent: 'person_lookup',
        searchTerm: name,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }

    return {
      intent: 'list_users',
      searchTerm: null,
      table: 'users',
      includePersonality: false,
    };
  }

  private extractName(question: string): string | null {
    const patterns = [
      /(?:for|about|of)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
      /([A-Za-z]+)'s?\s+(?:test|exam|score|result)/i,
      /(?:show|get|find)\s+([A-Za-z]+)(?:'s)?/i,
    ];

    const stopWords = [
      'test',
      'exam',
      'score',
      'result',
      'user',
      'all',
      'the',
      'show',
      'get',
      'list',
      'find',
      'best',
      'top',
    ];

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
  private async executeQuery(interpretation: {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  }): Promise<any[]> {
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
      return await this.executeDatabaseQuery(sql);
    } catch (error) {
      this.logger.error(`SQL Error: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE FORMATTING
  // ═══════════════════════════════════════════════════════════════════════════
  private formatResponse(
    interpretation: {
      intent: string;
      searchTerm: string | null;
      includePersonality: boolean;
    },
    data: any[],
  ): string {
    if (!data.length) {
      return `No results found. Try:\n• "list users"\n• "show test results"\n• "candidates"\n• "[name]'s score"`;
    }

    switch (interpretation.intent) {
      case 'test_results':
      case 'best_performer':
      case 'person_lookup':
        return this.formatTestResults(
          data,
          interpretation.intent === 'best_performer',
        );

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
    let response = isBestPerformer
      ? '**🏆 Top Performers:**\n\n'
      : '**📊 Assessment Results:**\n\n';

    data.slice(0, 5).forEach((row, i) => {
      const name = row.full_name || 'Unknown';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';

      response += `${medal} **${name}**\n`;

      // Behavioral Style (DISC) - FULL description
      if (row.behavioral_style) {
        response += `   📋 **Style: ${row.behavioral_style}**\n`;
        if (row.behavior_description) {
          response += `   ${row.behavior_description}\n`;
        }
      }

      // Agile Compatibility - with FULL description (but don't show score)
      const scoreNum = row.total_score ? parseFloat(row.total_score) : NaN;
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
    if (score >= 100)
      return {
        name: AGILE_LEVELS.naturalist.name,
        desc: AGILE_LEVELS.naturalist.desc,
      };
    if (score >= 75)
      return {
        name: AGILE_LEVELS.adaptive.name,
        desc: AGILE_LEVELS.adaptive.desc,
      };
    if (score >= 50)
      return {
        name: AGILE_LEVELS.learner.name,
        desc: AGILE_LEVELS.learner.desc,
      };
    return {
      name: AGILE_LEVELS.resistant.name,
      desc: AGILE_LEVELS.resistant.desc,
    };
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
        response += `   ${row.short_description}\n`;
      }
    });
    return response;
  }

  private formatGenericList(data: any[]): string {
    let response = `**Found ${data.length} results:**\n\n`;
    const keys = Object.keys(data[0]).filter(
      (k) => !k.includes('id') && !k.includes('_at'),
    );
    data.slice(0, 8).forEach((row, i) => {
      response += `${i + 1}. ${keys
        .map((k) => row[k])
        .filter((v) => v)
        .join(' | ')}\n`;
    });
    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  async getStatus(): Promise<any> {
    let totalDocs = 0;
    try {
      const r = await this.executeDatabaseQuery(
        'SELECT COUNT(*) as count FROM rag_documents',
      );
      totalDocs = parseInt(r[0].count);
    } catch { }

    return {
      status: 'ok',
      name: 'MITHRA',
      version: '2.0.0-jarvis',
      description: 'OriginBI Intelligent - Your Career Guide (JARVIS Edition)',
      features: [
        'personalized_career_guidance',
        'job_eligibility_analysis',
        'higher_studies_recommendations',
        'emotional_ai_responses',
        'user_memory',
        'any_question_intelligent',
        'conversation_context',
        'llm_powered',
      ],
      knowledgeBase: { documents: totalDocs },
    };
  }

  async seedKnowledgeBase() {
    return { indexed: 0 };
  }
  async rebuildKnowledgeBase() {
    return { indexed: 0 };
  }
  async ingest(req: any) {
    const id = await this.embeddingsService.storeDocument(
      req.content,
      req.category,
      req.metadata,
      req.sourceTable,
      req.sourceId,
    );
    return { success: !!id, documentId: id };
  }
  async bulkIngest(docs: any[]) {
    return this.embeddingsService.bulkStoreDocuments(docs);
  }
  async indexExistingData() {
    return { indexed: 0 };
  }
  async generatePdf(data: any, q: string) {
    return Buffer.from(`Query: ${q}\n\n${data.answer}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: OVERALL ROLE FITMENT
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleOverallReport_Unused(user: any): Promise<any> {
    const reportTitle = 'Placement Guidance Report';
    // Link relative to API root (Frontend should proxy or handle this)
    const downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:3001/api/admin'}/rag/overall-report/pdf?groupId=1&title=${encodeURIComponent(reportTitle)}`;

    return {
      answer: `I've generated the **Overall Role Fitment Report** for you. \n\nThis report analyzes student data to identify personality groups and recommend suitable career paths.\n\n📄 **[Click here to download the PDF Report](${downloadUrl})**`,
      searchType: 'overall_report',
      confidence: 1.0,
    };
  }
}
  
 
 