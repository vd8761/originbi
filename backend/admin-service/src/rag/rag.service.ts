/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-base-to-string, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { ConversationService } from './conversation.service';
import { ChatMemoryService } from './chat-memory.service';
import { OriIntelligenceService } from './ori-intelligence.service';
import { JDMatchingService } from './jd-matching.service';

// RBAC Imports
import { AccessPolicyFactory } from './policies';
import { AuditLoggerService } from './audit';
import { UserContext } from '../common/interfaces/user-context.interface';

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
  private readonly CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour (was 30 minutes)

  // Disambiguation follow-up cache: remembers the search term when multiple candidates are shown
  // so that a bare number reply ("1", "#2") re-routes to the correct career report.
  private disambiguationCache = new Map<string, { searchTerm: string; timestamp: number }>();
  private readonly DISAMBIG_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // ── PAGINATION STATE ──
  // Tracks the last list query per user so "next 10" / "show more" works
  private paginationCache = new Map<string, {
    intent: string;       // e.g. 'list_users', 'list_candidates', 'test_results', 'career_roles'
    page: number;         // current page (0-based)
    totalCount: number;   // total rows available
    timestamp: number;
  }>();
  private readonly PAGE_SIZE = 10;
  private readonly PAGINATION_EXPIRY = 10 * 60 * 1000; // 10 minutes

  private getDisambiguationKey(user: any): string {
    return `${user?.id || 0}:${user?.email || 'anon'}`;
  }

  private getPaginationKey(user: any): string {
    return `page:${user?.id || 0}:${user?.email || 'anon'}`;
  }

  constructor(
    private dataSource: DataSource,
    private embeddingsService: EmbeddingsService,
    private futureRoleReportService: FutureRoleReportService,
    private overallRoleFitmentService: OverallRoleFitmentService,
    private conversationService: ConversationService,
    private chatMemory: ChatMemoryService,
    private oriIntelligence: OriIntelligenceService,
    private jdMatchingService: JDMatchingService,
    private policyFactory: AccessPolicyFactory,
    private auditLogger: AuditLoggerService,
  ) {
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    this.logger.log('🤖 MITHRA v2.0 initialized with RBAC - Your intelligent career guide!');
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
      // FOLLOW-UP: Bare number selection after disambiguation
      // e.g. user types "1", "#2", "2" after seeing a list of candidates
      // ═══════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════
      // FOLLOW-UP: "next", "more", "next 10", "show more", "previous"
      // Detects pagination requests and returns the next/prev page
      // ═══════════════════════════════════════════════════════════════
      if (/^(next|more|show\s*more|next\s*\d+|see\s*more|continue|prev|previous|go\s*back)\b/i.test(normalizedQ) ||
          /\b(next|more)\s+(\d+\s+)?(users?|candidates?|students?|results?|roles?)\b/i.test(normalizedQ)) {
        const pagKey = this.getPaginationKey(user);
        const pagCtx = this.paginationCache.get(pagKey);
        if (pagCtx && Date.now() - pagCtx.timestamp < this.PAGINATION_EXPIRY) {
          const isPrev = /\b(prev|previous|go\s*back)\b/i.test(normalizedQ);
          const nextPage = isPrev ? Math.max(0, pagCtx.page - 1) : pagCtx.page + 1;
          const offset = nextPage * this.PAGE_SIZE;

          if (offset >= pagCtx.totalCount) {
            return {
              answer: `**That's all!** You've seen all ${pagCtx.totalCount} records. No more to show.\n\nWant to try a different query?`,
              searchType: 'pagination_end',
              confidence: 1.0,
            };
          }
          if (isPrev && pagCtx.page === 0) {
            return {
              answer: `**You're already on the first page!**`,
              searchType: 'pagination_start',
              confidence: 1.0,
            };
          }

          this.logger.log(`📄 Pagination: page ${nextPage} (offset ${offset}) for intent ${pagCtx.intent}`);
          pagCtx.page = nextPage;
          pagCtx.timestamp = Date.now();

          const interpretation = {
            intent: pagCtx.intent,
            searchTerm: null as string | null,
            table: pagCtx.intent === 'list_users' ? 'users' :
                   pagCtx.intent === 'list_candidates' ? 'registrations' :
                   pagCtx.intent === 'career_roles' ? 'career_roles' : 'assessment_attempts',
            includePersonality: ['test_results', 'best_performer'].includes(pagCtx.intent),
          };
          const data = await this.executeQuery(interpretation, user as UserContext, offset);
          if (data.length === 0) {
            return {
              answer: `**No more records.** You've seen all ${pagCtx.totalCount} items.`,
              searchType: 'pagination_end',
              confidence: 1.0,
            };
          }
          const answer = this.formatResponse(interpretation, data, offset, pagCtx.totalCount);
          return { answer, searchType: pagCtx.intent, sources: { rows: data.length }, confidence: 0.95 };
        }
      }

      const bareNumberMatch = normalizedQ.match(/^#?\s*(\d+)$/);
      if (bareNumberMatch) {
        const disambigKey = this.getDisambiguationKey(user);
        const ctx = this.disambiguationCache.get(disambigKey);
        if (ctx && Date.now() - ctx.timestamp < this.DISAMBIG_EXPIRY) {
          this.logger.log(`🔢 Bare number "${normalizedQ}" detected — resuming disambiguation for "${ctx.searchTerm}"`);
          this.disambiguationCache.delete(disambigKey);
          return await this.handleCareerReport(`${ctx.searchTerm} #${bareNumberMatch[1]}`, user);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 1: LLM QUERY UNDERSTANDING (role-aware for better routing)
      // ═══════════════════════════════════════════════════════════════
      const userRole = (user?.role || 'STUDENT').toUpperCase();
      const interpretation = await this.understandQuery(question, userRole);
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
      // SPECIAL HANDLER: CAREER REPORT GENERATION (RBAC scoped)
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'career_report') {
        return await this.handleCareerReport(interpretation.searchTerm, user);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: OVERALL ROLE FITMENT REPORT
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'overall_report') {
        return await this.handleOverallReport(user);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: CHAT-BASED CUSTOM REPORT (User-provided profile)
      // Detects when user provides profile details in chat
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'chat_profile_report') {
        return await this.handleChatProfileReport(question);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: JD CANDIDATE MATCHING (Admin/Corporate)
      // Matches candidates to a job description using advanced scoring
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'jd_candidate_match') {
        return await this.handleJDCandidateMatch(question, user);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: CUSTOM REPORT (Career Fitment, etc.)
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'custom_report') {
        return await this.handleCustomReport(user, interpretation.searchTerm, question);
      }

      // ═══════════════════════════════════════════════════════════════
      // LLM-ROUTED: career_guidance / personal_info
      // These intents skip DB entirely and go straight to AI
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'career_guidance') {
        this.logger.log('🎯 LLM routed: Career guidance (AI-powered)');
        const userId = user?.id || 0;
        const userEmail = user?.email || '';
        const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
        const answer = await this.oriIntelligence.generateCareerGuidance(question, userProfile);
        return { answer, searchType: 'career_guidance', confidence: 0.95 };
      }

      if (interpretation.intent === 'personal_info') {
        this.logger.log('🎯 LLM routed: Personal info');
        const userId = user?.id || 0;
        const userEmail = user?.email || '';
        const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
        const personalAnswer = this.oriIntelligence.answerPersonalQuestion(question, userProfile);
        if (personalAnswer) {
          return { answer: personalAnswer, searchType: 'personal_info', confidence: 0.98 };
        }
        // Fallback to LLM if no structured answer available
        const context = this.oriIntelligence.getConversationContext(userId);
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, context);
        return { answer, searchType: 'personal_info', confidence: 0.9 };
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
        qLower.includes('become a') || qLower.includes('become an') ||
        qLower.includes('should i') || qLower.includes('can you') ||
        qLower.includes('tell me about') || qLower.includes('explain') || qLower.includes('difference between') ||
        qLower.includes('compare') || qLower.includes('vs') || qLower.includes('versus') ||
        qLower.includes('tips') || qLower.includes('advice') || qLower.includes('recommend') ||
        qLower.includes('certification') || qLower.includes('skill') || qLower.includes('path');

      // Don't go to DB for general questions - use LLM directly
      // But ALWAYS respect explicit DB intents from the LLM (best_performer, person_lookup, etc.)
      if (isGeneralQuestion && !['list_users', 'list_candidates', 'test_results', 'career_roles', 'count', 'best_performer', 'person_lookup'].includes(interpretation.intent)) {
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
      // STEP 2: EXECUTE QUERY WITH RBAC (only for specific data queries)
      // ═══════════════════════════════════════════════════════════════

      // ── Anonymous / unauthenticated user check ──
      // If user id is 0 and role is STUDENT, they are anonymous.
      // Return a friendly login prompt instead of crashing.
      if ((!user || user.id === 0) && (user?.role === 'STUDENT' || !user?.role)) {
        this.logger.log('🔒 RBAC: Anonymous user detected — prompting to log in');
        return {
          answer: '👋 Welcome to MITHRA! To access your personalized data and results, please log in first. If you have any general career questions, feel free to ask!',
          searchType: 'auth_required',
          confidence: 1.0,
        };
      }

      // Get the access policy for this user's role
      const policy = this.policyFactory.createPolicy(user as UserContext);

      // Check if this intent is allowed for the user's role
      const allowedIntents = policy.getAllowedIntents();
      const isAllowed = allowedIntents.includes('*') || allowedIntents.includes(interpretation.intent);

      if (!isAllowed) {
        const redirectMsg = policy.getAccessDeniedMessage(interpretation.intent);
        this.logger.log(`🔒 RBAC: Access denied for intent '${interpretation.intent}' - redirecting`);

        // Use logAccessDenied for proper audit
        this.auditLogger.logAccessDenied(
          user?.id || 0,
          user?.role || 'unknown',
          interpretation.intent,
          'Intent not allowed for this role',
          question
        );

        return {
          answer: redirectMsg,
          searchType: 'rbac_redirect',
          confidence: 1.0,
        };
      }

      // ── First, get total count for pagination ──
      const totalCount = await this.getTotalCount(interpretation, user as UserContext);

      const data = await this.executeQuery(interpretation, user as UserContext, 0);
      this.logger.log(`📊 Results: ${data.length} rows (total: ${totalCount})`);

      // ── Store pagination state for "next 10" follow-ups ──
      if (['list_users', 'list_candidates', 'test_results', 'best_performer', 'career_roles'].includes(interpretation.intent)) {
        const pagKey = this.getPaginationKey(user);
        this.paginationCache.set(pagKey, {
          intent: interpretation.intent,
          page: 0,
          totalCount,
          timestamp: Date.now(),
        });
      }

      // Log the query for audit
      this.auditLogger.logQuery({
        timestamp: new Date(),
        userId: user?.id || 0,
        userRole: user?.role || 'unknown',
        userEmail: user?.email || 'unknown',
        corporateId: (user as any)?.corporateId,
        action: 'RAG_QUERY',
        intent: interpretation.intent,
        query: question,
        tablesAccessed: [interpretation.table],
        recordsReturned: data.length,
        accessGranted: true,
        responseTime: 0,
      });

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
      // STEP 3: FORMAT RESPONSE (with pagination info)
      // ═══════════════════════════════════════════════════════════════
      const answer = this.formatResponse(interpretation, data, 0, totalCount);

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
    user?: any,
  ): Promise<QueryResult> {
    const userRole = user?.role || 'STUDENT';
    const corporateId = user?.corporateId;
    const userId = user?.id;

    if (!searchTerm) {
      // For students, auto-generate report for themselves
      if (userRole === 'STUDENT' && userId) {
        const selfData = await this.executeDatabaseQuery(
          `SELECT r.full_name FROM registrations r WHERE r.user_id = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
          [userId]
        );
        if (selfData.length > 0) {
          searchTerm = selfData[0].full_name;
          this.logger.log(`📋 Student auto-generating career report for self: ${searchTerm}`);
        } else {
          return {
            answer: `I couldn't find your registration data. Please make sure you've completed your profile.`,
            searchType: 'career_report',
            confidence: 0.3,
          };
        }
      } else {
        return {
          answer: `**📋 To generate a Career Fitment Report, I need more information:**\n\nPlease specify the person's name, e.g.:\n• "generate career report for Anjaly"\n• "career report for John"\n• "future role readiness for Priya"`,
          searchType: 'career_report',
          confidence: 0.3,
        };
      }
    }

    // At this point searchTerm is guaranteed non-null (handled above)
    const term = searchTerm!;

    // Check if user specified a number (e.g., "anjaly #2" or "anjaly 2")
    const numberMatch = term.match(/(.+?)\s*[#]?\s*(\d+)$/);
    let targetIndex = 0;
    let cleanSearchTerm = term;

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
      // Build parameterized WHERE clause with RBAC scoping
      const params: any[] = [];
      let paramIndex = 1;
      let whereParts: string[] = [];

      if (emailSearch) {
        whereParts.push(`(u.email ILIKE $${paramIndex})`);
        params.push(`%${emailSearch}%`);
        paramIndex++;
        if (nameSearch) {
          whereParts.push(`(r.full_name ILIKE $${paramIndex})`);
          params.push(`%${nameSearch}%`);
          paramIndex++;
        }
      } else {
        // Only search by full_name when the term is a plain name.
        // Do NOT match email substrings — e.g. searching "ajay" must NOT
        // match "yesodharanramajayam@gmail.com".
        whereParts.push(`(r.full_name ILIKE $${paramIndex})`);
        params.push(`%${nameSearch}%`);
        paramIndex++;
      }

      let whereClause = whereParts.join(' OR ');

      // RBAC: Corporate users can only search within their company
      let rbacFilter = '';
      if (userRole === 'CORPORATE' && corporateId) {
        rbacFilter = ` AND r.corporate_account_id = $${paramIndex}`;
        params.push(corporateId);
        paramIndex++;
      } else if (userRole === 'STUDENT' && userId) {
        rbacFilter = ` AND r.user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
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
                AND r.is_deleted = false${rbacFilter}
                ORDER BY r.id, aa.total_score DESC NULLS LAST
                LIMIT 10
            `, params);

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

        response += `\n**Example:** "career report for ${cleanSearchTerm} #1" or "career report for ${cleanSearchTerm} #2"\n\nOr simply reply with the number (e.g. **1** or **2**).`;

        // Store disambiguation context so bare number follow-ups work
        this.disambiguationCache.set(this.getDisambiguationKey(user), {
          searchTerm: cleanSearchTerm,
          timestamp: Date.now(),
        });

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
      const userRole = user?.role || 'STUDENT';
      const corporateId = user?.corporateId;

      // RBAC: Students cannot generate overall reports
      if (userRole === 'STUDENT') {
        return {
          answer: `Overall reports are for organizational use. But I can generate a detailed **career report just for you**! Would you like that?`,
          searchType: 'rbac_redirect',
          confidence: 1.0,
        };
      }

      this.logger.log(`📊 Generating Overall Role Fitment Report | role=${userRole} corporateId=${corporateId || 'ALL'}`);

      const reportTitle = 'Placement Guidance Report';
      const input: any = { title: reportTitle };

      // RBAC: Corporate users → scope to their company
      if (userRole === 'CORPORATE' && corporateId) {
        input.corporateId = corporateId;
      }

      // Only filter by group if the user has a group
      if (user?.group_id) {
        input.groupId = user.group_id;
      }

      // Build download URL with appropriate scoping params
      let downloadUrl = `/rag/overall-report/pdf?title=${encodeURIComponent(reportTitle)}`;
      if (user?.group_id) {
        downloadUrl += `&groupId=${user.group_id}`;
      }
      if (userRole === 'CORPORATE' && corporateId) {
        downloadUrl += `&corporateId=${corporateId}`;
      }

      const report = await this.overallRoleFitmentService.generateReport(input);

      return {
        answer: `I've generated the **Overall Role Fitment Report** for you. \n\n📄 **[Click here to download the PDF Report](${downloadUrl})**\n\nSince I can't display the full graphical report here, please download the PDF for the complete analysis including charts and tables.\n\nSummary:\n${this.overallRoleFitmentService.formatForChat(report)}`,
        searchType: 'overall_report',
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
      const userRole = user?.role || 'STUDENT';
      const corporateId = user?.corporateId;
      const userId = user?.id;
      let targetUserId: number | null = null;
      let targetName = searchTerm;

      // RBAC: Students can only generate reports for themselves
      if (userRole === 'STUDENT') {
        if (userId) {
          const selfLookup = await this.executeDatabaseQuery(
            `SELECT r.user_id, r.full_name FROM registrations r WHERE r.user_id = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
            [userId]
          );
          if (selfLookup.length > 0) {
            targetUserId = parseInt(selfLookup[0].user_id);
            targetName = selfLookup[0].full_name;
          } else {
            return {
              answer: `I couldn't find your registration data. Please make sure you've completed your profile.`,
              searchType: 'error',
              confidence: 0,
            };
          }
        }
      } else {
        // ADMIN or CORPORATE: lookup by name
        if (!targetName) {
          targetName = this.extractName(question);
        }

        if (targetName) {
          this.logger.log(`🔍 Looking up user by name: "${targetName}"`);

          // RBAC: Corporate users can only find candidates in their company
          let lookupSql: string;
          let lookupParams: any[];

          if (userRole === 'CORPORATE' && corporateId) {
            lookupSql = `
              SELECT r.user_id, r.full_name
              FROM registrations r
              WHERE LOWER(r.full_name) LIKE $1
              AND r.is_deleted = false
              AND r.corporate_account_id = $2
              ORDER BY r.created_at DESC
              LIMIT 1
            `;
            lookupParams = [`%${targetName.toLowerCase()}%`, corporateId];
          } else {
            // ADMIN: search all
            lookupSql = `
              SELECT r.user_id, r.full_name
              FROM registrations r
              WHERE LOWER(r.full_name) LIKE $1
              AND r.is_deleted = false
              ORDER BY r.created_at DESC
              LIMIT 1
            `;
            lookupParams = [`%${targetName.toLowerCase()}%`];
          }

          const results = await this.executeDatabaseQuery(lookupSql, lookupParams);

          if (results && results.length > 0) {
            targetUserId = parseInt(results[0].user_id);
            targetName = results[0].full_name;
            this.logger.log(`✅ Found user: ${targetName} (ID: ${targetUserId})`);
          } else {
            const scopeMsg = userRole === 'CORPORATE' ? ' in your organization' : '';
            return {
              answer: `**⚠️ User "${targetName}" not found${scopeMsg}.** Please check the name and try again.\n\nYou can ask:\n- "Generate career fitment report for [full name]"\n- "Custom report for [person name]"`,
              searchType: 'error',
              confidence: 0,
            };
          }
        } else {
          return {
            answer: `**⚠️ Please specify a name for the report.** \n\nExample:\n- "Generate career fitment report for Anjaly"\n- "Custom report for John Smith"`,
            searchType: 'error',
            confidence: 0,
          };
        }
      }

      if (!targetUserId) {
        return {
          answer: `**⚠️ No user specified.** Please provide a name to generate the report for.\n\nExample: "Generate career fitment report for Anjaly"`,
          searchType: 'error',
          confidence: 0,
        };
      }

      this.logger.log(`📊 Generating Custom Career Fitment Report for ${targetName} (userId: ${targetUserId})`);

      // Use the name parameter for better matching (handles users with incomplete assessments)
      const encodedName = encodeURIComponent(targetName || '');
      const downloadUrl = `/rag/custom-report/pdf?name=${encodedName}&type=career_fitment`;

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

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: CHAT-BASED PROFILE REPORT (User provides profile data in chat)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleChatProfileReport(question: string): Promise<QueryResult> {
    try {
      this.logger.log('📋 Processing chat-based profile for custom report generation');

      // Parse profile from chat message
      const profileData = this.parseProfileFromChat(question);

      if (!profileData) {
        return {
          answer: `**📝 I detected you want to generate a custom report!**\n\nPlease provide the following details in your message:\n\n\`\`\`\nName: [Full Name]\nCurrent Role: [Your current job title]\nCurrent Job Description: [Brief description of responsibilities]\nYears of Experience: [Number]\nRelevant Experience: [Key focus areas]\nCurrent Industry: [Industry name]\nExpected Future Role: [Target role you aspire to]\n\`\`\`\n\n**Example:**\n\`\`\`\nName: Anjaly\nCurrent Role: VP- Sales and Marketing\nCurrent Job Description: Driving revenue growth and brand positioning\nYears of Experience: 15\nRelevant Experience: 10 years in Retail industry\nCurrent Industry: IT\nExpected Future Role: CTO for Aerospace/BFSI\n\`\`\`\n\nOnce you provide these details, I'll generate a personalized Career Fitment Report for you!`,
          searchType: 'chat_profile_request',
          confidence: 0.9,
        };
      }

      // Encode the profile data as base64 for the URL
      const reportPayload = {
        name: profileData.name,
        currentRole: profileData.currentRole,
        currentJobDescription: profileData.currentJobDescription,
        yearsOfExperience: profileData.yearsOfExperience,
        relevantExperience: profileData.relevantExperience,
        currentIndustry: profileData.currentIndustry,
        expectedFutureRole: profileData.expectedFutureRole,
        expectedIndustry: profileData.expectedIndustry || '',
      };

      const encodedProfile = Buffer.from(JSON.stringify(reportPayload)).toString('base64');
      const downloadUrl = `/rag/chat-report/download?profile=${encodedProfile}`;

      return {
        answer: `**✅ Profile Captured Successfully for ${profileData.name}!** 🎯\n\n📊 **Profile Summary:**\n- **Name:** ${profileData.name}\n- **Current Role:** ${profileData.currentRole}\n- **Experience:** ${profileData.yearsOfExperience} years\n- **Industry:** ${profileData.currentIndustry}\n- **Target Role:** ${profileData.expectedFutureRole}\n\n📄 **[Click here to download your personalized Career Fitment Report](${downloadUrl})**`,
        searchType: 'chat_profile_report',
        confidence: 0.95,
        reportUrl: downloadUrl,
      };
    } catch (error) {
      this.logger.error(`Chat profile report error: ${error.message}`);
      return {
        answer: `**❌ Error processing profile:** ${error.message}\n\nPlease make sure you've provided all required details (Name, Current Role, Years of Experience, Current Industry, Expected Future Role).`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  /**
   * Parse profile data from a chat message
   */
  private parseProfileFromChat(chatMessage: string): {
    name: string;
    currentRole: string;
    currentJobDescription: string;
    yearsOfExperience: number;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
    expectedIndustry?: string;
  } | null {
    try {
      const extractField = (patterns: RegExp[]): string => {
        for (const pattern of patterns) {
          const match = chatMessage.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return '';
      };

      const name = extractField([
        /name[:\s]*([^\n]+)/i,
        /(?:my name is|i am|i'm)\s+([^\n,]+)/i,
      ]);

      const currentRole = extractField([
        /current\s*role[:\s]*([^\n]+)/i,
        /(?:working as|position|designation)[:\s]*([^\n]+)/i,
      ]);

      const currentJobDescription = extractField([
        /(?:current\s*)?job\s*description[:\s]*([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)/i,
        /responsibilities[:\s]*([^\n]+)/i,
      ]);

      const yearsStr = extractField([
        /years?\s*of\s*experience[:\s]*(\d+)/i,
        /(\d+)\s*years?\s*(?:of\s*)?experience/i,
        /experience[:\s]*(\d+)/i,
      ]);
      const yearsOfExperience = parseInt(yearsStr) || 0;
5
      const relevantExperience = extractField([
        /relevant\s*experience[:\s\(]*([^\n\)]+)/i,
        /key\s*focus\s*areas?[:\s]*([^\n]+)/i,
      ]);

      const currentIndustry = extractField([
        /current\s*industry[:\s]*([^\n]+)/i,
        /industry[:\s]*([^\n]+)/i,
      ]);

      const expectedFutureRole = extractField([
        /expected\s*future\s*role[:\s]*([^\n]+)/i,
        /future\s*role[:\s]*([^\n]+)/i,
        /target\s*role[:\s]*([^\n]+)/i,
      ]);

      // Require at least name to proceed
      if (!name) {
        this.logger.warn('❌ Missing required field: name');
        return null;
      }

      return {
        name,
        currentRole: currentRole || 'Not Specified',
        currentJobDescription: currentJobDescription || '',
        yearsOfExperience,
        relevantExperience: relevantExperience || '',
        currentIndustry: currentIndustry || 'Not Specified',
        expectedFutureRole: expectedFutureRole || 'Not Specified',
        expectedIndustry: '',
      };
    } catch (error) {
      this.logger.error(`Failed to parse profile: ${error.message}`);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: JD-BASED CANDIDATE MATCHING (Admin / Corporate)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleJDCandidateMatch(question: string, user: any): Promise<QueryResult> {
    try {
      const userRole = (user?.role || 'STUDENT').toUpperCase();
      const corporateId = user?.corporateId;

      // RBAC: Only ADMIN and CORPORATE can use JD matching
      if (userRole === 'STUDENT') {
        return {
          answer: `JD-based candidate matching is available for administrators and corporate users. If you'd like to see your own career fit, try: **"What jobs am I eligible for?"**`,
          searchType: 'rbac_redirect',
          confidence: 1.0,
        };
      }

      // Extract the JD from the question
      const jobDescription = this.extractJDFromMessage(question);

      if (!jobDescription || jobDescription.length < 20) {
        return {
          answer: `**🎯 JD Candidate Matching**\n\nTo find the best candidates for a role, please provide a job description. You can:\n\n**Option 1 — Paste a full JD:**\n\`\`\`\nFind candidates for:\nJob Title: Senior Software Engineer\nResponsibilities: Lead backend development...\nRequirements: 5+ years experience, strong leadership...\n\`\`\`\n\n**Option 2 — Describe the role:**\n• "Find candidates suitable for a project manager role requiring leadership, analytical thinking, and team collaboration"\n• "Who is best suited for a customer success manager who needs empathy, communication, and adaptability?"\n• "Match candidates for: Senior Data Analyst - needs strong analytical skills, attention to detail, works independently"\n\nThe more detail you provide, the more accurate the matching will be!`,
          searchType: 'jd_candidate_match',
          confidence: 0.5,
        };
      }

      this.logger.log(`🎯 JD Matching triggered | role=${userRole} | JD length=${jobDescription.length}`);

      const result = await this.jdMatchingService.matchCandidatesToJD(jobDescription, {
        corporateId: userRole === 'CORPORATE' ? corporateId : undefined,
        topN: 10,
        minScore: 0,
        includeInsights: true,
      });

      const answer = this.jdMatchingService.formatMatchResultForChat(result);

      return {
        answer,
        searchType: 'jd_candidate_match',
        sources: { candidatesEvaluated: result.totalCandidatesEvaluated, matched: result.matchedCandidates.length },
        confidence: 0.95,
      };
    } catch (error) {
      this.logger.error(`JD Matching error: ${error.message}`);
      return {
        answer: `**❌ Error during JD matching:** ${error.message}\n\nPlease try again with a clearer job description.`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  /**
   * Extract the Job Description content from the user's message.
   * Handles various formats: "find candidates for: [JD]", "match for [JD]", etc.
   */
  private extractJDFromMessage(message: string): string {
    // Try to extract JD after common prefixes
    const prefixPatterns = [
      /(?:find|match|search|identify|list|show|get|who)\s+(?:candidates?|people|users?|suitable)\s+(?:for|matching|suited\s+for|that\s+match|who\s+(?:fit|match|suit))\s*[:\-]?\s*([\s\S]+)/i,
      /(?:job\s*description|jd)\s*[:\-]?\s*([\s\S]+)/i,
      /(?:find|match|search)\s+(?:for|candidates?\s+for)\s*[:\-]?\s*([\s\S]+)/i,
      /(?:who\s+(?:is|are)\s+(?:best|suitable|fit|right|ideal)\s+(?:for|candidate))\s*[:\-]?\s*([\s\S]+)/i,
      /(?:suitable\s+candidates?\s+for)\s*[:\-]?\s*([\s\S]+)/i,
      /(?:candidates?\s+(?:for|matching))\s*[:\-]?\s*([\s\S]+)/i,
    ];

    for (const pattern of prefixPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 15) {
        return match[1].trim();
      }
    }

    // If no prefix found but message is long enough, treat the whole thing as JD
    // (user might have just pasted a JD directly)
    if (message.length > 80) {
      return message;
    }

    return message;
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
  private async understandQuery(question: string, userRole: string = 'STUDENT'): Promise<{
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  }> {
    // Check cache first (keyed by role + question)
    const cacheKey = `${userRole}:${question.toLowerCase().trim()}`;
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      this.logger.log('📋 Using cached query understanding');
      return cached.result;
    }

    // ── TOKEN OPTIMIZATION: Try fast local matching first ──
    // This avoids an LLM call for ~70% of queries
    const localResult = this.fastLocalMatch(question);
    if (localResult) {
      this.logger.log(`⚡ Fast-matched intent: ${localResult.intent} (no LLM call)`);
      this.queryCache.set(cacheKey, { result: localResult, timestamp: Date.now() });
      return localResult;
    }

    // ── LLM call with compact prompt (~400 tokens instead of ~1200) ──
    const roleHint = userRole === 'ADMIN' ? 'ADMIN(full access)'
      : userRole === 'CORPORATE' ? 'CORPORATE(company-scoped)'
      : 'STUDENT(personal only)';

    const prompt = `You are an intent classifier for OriginBI, a career assessment platform. Your job is to classify user questions into the correct intent for routing.

User role: ${roleHint}

Output JSON: {"intent":"...","searchTerm":"...or null","table":"...","includePersonality":bool}

INTENTS (choose the MOST SPECIFIC one):
- general_knowledge: ANY question about skills, technologies, career advice, how-to guides, courses, learning, salaries, job markets, comparisons, explanations, tips, tutorials, roadmaps, programming concepts, or general world knowledge. This is the DEFAULT for any question that does NOT require looking up specific platform data.
- career_guidance: Personal career advice ("what jobs suit ME", "am I eligible", "should I try X")
- personal_info: "my name", "my profile", "who am I" (user asking about their own stored data)
- jd_candidate_match: User provides a job description, role description, or hiring criteria and wants to find/match/identify suitable candidates from the platform's assessment data. Trigger words: "find candidates for", "match candidates", "who is suitable for", "best candidates for [role/JD]", "job description:", "identify suitable users for"
- greeting: hi, hello, hey
- help: what can you do
- list_users: ONLY when explicitly asking to "list users", "show all users"
- list_candidates: ONLY when explicitly asking to "list candidates", "show registrations", "show students"
- test_results: ONLY when asking for assessment scores/exam results from the platform
- person_lookup: ONLY when asking about a SPECIFIC named person's data in the system (e.g. "show John's score")
- best_performer: "top performer", "highest score", "best candidates"
- career_roles: ONLY for listing job roles stored in the platform database
- career_report: generate career report for someone
- overall_report: overall/placement/group report
- custom_report: career fitment report (with user profile data)
- chat_profile_report: message contains structured fields like "Name:", "Current Role:", "Experience:"
- count: "how many users/candidates"

Tables: users|registrations|assessment_attempts|career_roles|none

CRITICAL RULES:
1. If someone asks "what are the skills to become X" or "how to become X" or "best courses for X" or "explain X" → general_knowledge (NOT list_users, NOT career_roles)
2. general_knowledge should be used for ANY educational, informational, or advisory question
3. list_users/list_candidates should ONLY be used when the user EXPLICITLY asks to list/show platform users
4. career_roles should ONLY be used when asking to list the career roles stored in the DATABASE
5. If you're unsure, default to general_knowledge rather than list_users
6. searchTerm should be null unless the query mentions a specific person's name
7. includePersonality=true for: test_results, person_lookup, best_performer, career_report, overall_report, custom_report, jd_candidate_match
8. jd_candidate_match should be used when the user explicitly wants to find candidates matching a job description or role description. The searchTerm should be null for this intent.

Query: "${question}"
JSON:`;

    try {
      const startTime = Date.now();
      const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
      const elapsed = Date.now() - startTime;
      this.logger.log(`🤖 LLM query understanding took ${elapsed}ms`);

      const jsonStr = response.content.toString().trim();
      // Extract JSON if wrapped in markdown code block
      const cleanJson = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      const result = {
        intent: parsed.intent || 'general_knowledge',
        searchTerm: parsed.searchTerm || null,
        table: parsed.table || 'none',
        includePersonality: parsed.includePersonality || false,
      };

      this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
      if (this.queryCache.size > 200) this.cleanCache();
      return result;
    } catch (error) {
      this.logger.warn(`Query interpretation failed: ${error.message}, using fallback`);
      return this.fallbackInterpretation(question);
    }
  }

  /**
   * Fast local pattern matching — avoids LLM call for common queries.
   * Returns null if no confident match (falls through to LLM).
   */
  private fastLocalMatch(question: string): {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  } | null {
    const q = question.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)\b/.test(q)) {
      return { intent: 'greeting', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Help
    if (/^(help|what can you do|what can you help)\b/.test(q)) {
      return { intent: 'help', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Chat profile report (contains structured "Name:", "Current Role:", etc.)
    if (/name\s*:/i.test(q) && (/current\s*role\s*:/i.test(q) || /experience\s*:/i.test(q) || /industry\s*:/i.test(q))) {
      return { intent: 'chat_profile_report', searchTerm: null, table: 'none', includePersonality: false };
    }

    // ═══════════════════════════════════════════════════════════════
    // JD CANDIDATE MATCHING — detect when user provides a job description
    // ═══════════════════════════════════════════════════════════════
    if (/\b(find|match|search|identify|list|show|get|who)\b.*\b(candidates?|people|users?|suitable|suited)\b.*\b(for|matching|that\s+match|who\s+fit)\b/i.test(q) ||
        /\b(job\s*description|jd)\s*[:\-]/i.test(q) ||
        /\b(suitable|best|ideal|right)\s+(candidates?|people|users?)\s+(for|to)\b/i.test(q) ||
        /\bwho\s+(is|are)\s+(best\s+)?(suitable|fit|suited|right|ideal)\s+(for|candidate)\b/i.test(q) ||
        /\b(match|find)\s+(candidates?|people)\s+(for|to|based\s+on)\s+.*\b(role|position|job|description)\b/i.test(q) ||
        /\bcandidates?\s+(for|matching|suited\s+for)\s*[:\-]?\s*.{20,}/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Overall / placement report
    if (/\b(overall\s*report|placement\s*report|group\s*role\s*fitment|role\s*fitment\s*report)\b/.test(q)) {
      return { intent: 'overall_report', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Custom / career fitment report
    if (/\b(career\s*fitment|custom\s*report|my\s*fitment|personalized\s*report)\b/.test(q)) {
      return { intent: 'custom_report', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Career report for someone
    if (/\b(career\s*report|future\s*role|role\s*readiness|generate.*report)\b/.test(q)) {
      const name = this.extractName(question);
      return { intent: 'career_report', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
    }

    // Best/top performer
    if (/\b(best|top|highest)\s*(performer|score|candidate|student|result)\b/i.test(q) ||
      /\b(show|list|get)\s*(top|best)\b/i.test(q) ||
      /\btop\s*\d+\b/.test(q)) {
      return { intent: 'best_performer', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Count
    if (/\b(how\s*many|count|total\s*number)\b/.test(q)) {
      const table = /user/i.test(q) ? 'users' : /candidate|registration|student/i.test(q) ? 'registrations' : 'assessment_attempts';
      return { intent: 'count', searchTerm: null, table, includePersonality: false };
    }

    // List users
    if (/\b(list|show|get)\b.*\busers?\b/.test(q) || /^users?\b/.test(q)) {
      return { intent: 'list_users', searchTerm: null, table: 'users', includePersonality: false };
    }

    // List candidates
    if (/\b(list|show|get)\b.*\b(candidate|registration|student)s?\b/.test(q) || /^candidates?\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }

    // Career roles
    if (/\b(career\s*roles?|job\s*roles?)\b/.test(q) && !/\b(my|eligible|suitable|fit)\b/.test(q)) {
      return { intent: 'career_roles', searchTerm: null, table: 'career_roles', includePersonality: false };
    }

    // Personal info: "my name", "my profile", "who am I"
    if (/\b(my\s*name|my\s*profile|who\s*am\s*i)\b/.test(q)) {
      return { intent: 'personal_info', searchTerm: null, table: 'none', includePersonality: false };
    }

    // My results / my score
    if (/\b(my\s*result|my\s*score|my\s*test|my\s*assessment|my\s*exam)\b/.test(q)) {
      return { intent: 'test_results', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Test results (general)
    if (/\b(test|exam|assessment)\s*(result|score)s?\b/.test(q) || /\bresults?\b/.test(q)) {
      const name = this.extractName(question);
      return { intent: name ? 'person_lookup' : 'test_results', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
    }

    // Person lookup: "[name]'s score" or "show [name]"
    const possibleName = this.extractName(question);
    if (possibleName && /\b(score|result|detail|profile|data)\b/.test(q)) {
      return { intent: 'person_lookup', searchTerm: possibleName, table: 'assessment_attempts', includePersonality: true };
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERAL KNOWLEDGE / EDUCATION / HOW-TO QUESTIONS
    // These must NEVER hit the database — route to LLM directly
    // ═══════════════════════════════════════════════════════════════

    // "what is X", "what are X", "what does X mean"
    if (/^(what|who|why|when|where)\s+(is|are|does|do|was|were|would|could|should|can|will)\b/.test(q) &&
        !/\b(my |user|candidate|registration|result|score|attempt|corporate|list|show|get|count|how many)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "how to become", "how to learn", "how to get", "how do I", "how can I"
    if (/^how\s+(to|do|can|should|would|could)\b/.test(q) &&
        !/\b(my result|my score|list|candidate|user|database|count|test result)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "skills for X", "skills to become", "skills needed", "skills required"
    if (/\bskills?\s+(for|to|needed|required|of|in)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "become a [role]", "become an [role]" (without "can I" prefix which is career_guidance)
    if (/\bbecome\s+(a|an)\s+\w+/.test(q) && !/\b(can i|should i|am i)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "explain X", "tell me about X" (general topics, not person/data)
    if (/^(explain|describe|define)\s+/.test(q) ||
        (/\btell\s+me\s+about\b/.test(q) && !/\b(my|his|her|their|candidate|user|\w+'s)\b/.test(q))) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "difference between X and Y", "X vs Y", "compare X and Y" (conceptual)
    if (/\b(difference\s+between|vs\.?|versus|compare|comparison)\b/.test(q) &&
        !/\b(candidate|user|score|result|name)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Technology / tool / framework / language questions
    if (/\b(python|java|javascript|typescript|react|angular|vue|node|docker|kubernetes|aws|azure|gcp|sql|mongodb|machine\s*learning|deep\s*learning|ai|artificial\s*intelligence|data\s*science|devops|cloud|blockchain|cybersecurity|frontend|backend|full\s*stack|web\s*development|mobile\s*development|software\s*engineering|programming|coding)\b/.test(q) &&
        !/\b(my|score|result|candidate|user|list|show|count)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "best way to", "tips for", "roadmap for/to", "guide to", "steps to"
    if (/\b(best\s+way\s+to|tips\s+(for|to|on)|roadmap\s+(for|to)|guide\s+(to|for)|steps\s+to|resources\s+(for|to))\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "what courses", "recommend courses", "suggest courses", "learning path"
    if (/\b(course|tutorial|certification|learning\s*path|study\s*plan|curriculum|syllabus|book|resource|training|bootcamp|workshop)\b/.test(q) &&
        !/\b(my|result|candidate|user|list|show|count|assessment)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "salary of", "job market", "industry trends", "career path"
    if (/\b(salary|compensation|pay|job\s*market|industry\s*trends?|career\s*path|career\s*options?|job\s*prospects?|job\s*opportunities|future\s+of|scope\s+of|demand\s+for|interview\s+questions?|resume\s+tips?)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Career guidance keywords (personal - "for me", "should I", "can I")
    if (/\b(eligible|jobs?\s*for\s*me|suitable|career\s*for\s*me|can\s*i\s*(become|try|apply)|should\s*i|higher\s*studies|masters|mba|skill\s*path|interview\s*prep)\b/.test(q)) {
      return { intent: 'career_guidance', searchTerm: null, table: 'none', includePersonality: false };
    }

    // No confident match — let LLM handle it
    return null;
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

    // Chat-based profile report - when user provides profile details directly
    // Check for patterns like "Name:", "Current Role:", "Years of Experience:", etc.
    const hasProfilePattern = qLowerUniq.match(/name[:\s]/i) &&
      (qLowerUniq.match(/current\s*role[:\s]/i) ||
        qLowerUniq.match(/experience[:\s]/i) ||
        qLowerUniq.match(/industry[:\s]/i) ||
        qLowerUniq.match(/future\s*role[:\s]/i));

    if (hasProfilePattern || qLowerUniq.match(/^custom:\s*name/i)) {
      return {
        intent: 'chat_profile_report',
        searchTerm: null,
        table: 'none',
        includePersonality: false,
      };
    }

    // JD candidate matching - find suitable candidates for a role/JD
    if (
      qLowerUniq.match(/\b(find|match|search|identify)\b.*\b(candidates?|people|users?|suitable)\b.*\b(for|matching)\b/) ||
      qLowerUniq.match(/\b(suitable|best|ideal)\s+(candidates?|people)\s+(for|to)\b/) ||
      qLowerUniq.match(/\bjob\s*description/i) ||
      qLowerUniq.match(/\bwho\s+(is|are)\s+(suitable|fit|suited|ideal)\s+for\b/)
    ) {
      return {
        intent: 'jd_candidate_match',
        searchTerm: null,
        table: 'assessment_attempts',
        includePersonality: true,
      };
    }

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
    // Users - ONLY when explicitly asking to list/show users
    if (qLowerUniq.match(/\b(list|show|get|display)\b.*\busers?\b/) || qLowerUniq.match(/^users?$/)) {
      return {
        intent: 'list_users',
        searchTerm: null,
        table: 'users',
        includePersonality: false,
      };
    }
    // Candidates - ONLY when explicitly listing
    if (qLowerUniq.match(/\b(list|show|get|display)\b.*\b(candidate|registration|student)s?\b/)) {
      return {
        intent: 'list_candidates',
        searchTerm: null,
        table: 'registrations',
        includePersonality: false,
      };
    }
    // Career roles - ONLY when explicitly asking for DB career roles list
    if (qLowerUniq.match(/\b(list|show|get|display)\b.*\b(career|job)\s*roles?\b/)) {
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

    // DEFAULT: Route to general knowledge (LLM) instead of listing users.
    // This prevents "what are skills for X" from showing user lists.
    return {
      intent: 'general_knowledge',
      searchTerm: null,
      table: 'none',
      includePersonality: false,
    };
  }

  private extractName(question: string): string | null {
    const patterns = [
      // "for ajay #1" → "ajay #1"  |  "for ajay" → "ajay"
      /(?:for|about|of)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?(?:\s*#\s*\d+)?)/i,
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
  // TOTAL COUNT FOR PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════
  private async getTotalCount(
    interpretation: { intent: string; table: string },
    user?: UserContext
  ): Promise<number> {
    const userRole = user?.role || 'STUDENT';
    const corporateId = user?.corporateId;
    const userId = user?.id;
    let sql = '';
    const params: any[] = [];

    try {
      switch (interpretation.intent) {
        case 'list_users':
          if (userRole !== 'ADMIN') return 0;
          sql = `SELECT COUNT(*) as count FROM users`;
          break;
        case 'list_candidates':
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND corporate_account_id = $1`;
            params.push(corporateId);
          } else {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND user_id = $1`;
            params.push(userId);
          }
          break;
        case 'test_results':
        case 'best_performer':
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts aa JOIN registrations r ON aa.registration_id = r.id WHERE aa.status = 'COMPLETED' AND r.is_deleted = false`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts aa JOIN registrations r ON aa.registration_id = r.id WHERE aa.status = 'COMPLETED' AND r.is_deleted = false AND r.corporate_account_id = $1`;
            params.push(corporateId);
          } else {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'COMPLETED' AND user_id = $1`;
            params.push(userId);
          }
          break;
        case 'career_roles':
          sql = `SELECT COUNT(*) as count FROM career_roles WHERE is_deleted = false AND is_active = true`;
          break;
        default:
          return 0;
      }
      const result = await this.executeDatabaseQuery(sql, params);
      return parseInt(result[0]?.count || '0');
    } catch {
      return 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY EXECUTION WITH RBAC — PARAMETERIZED QUERIES (SQL-injection safe)
  // ═══════════════════════════════════════════════════════════════════════════
  private async executeQuery(
    interpretation: {
      intent: string;
      searchTerm: string | null;
      table: string;
      includePersonality: boolean;
    },
    user?: UserContext,
    offset: number = 0
  ): Promise<any[]> {
    let sql = '';
    const params: any[] = [];

    const userRole = user?.role || 'STUDENT';
    const corporateId = user?.corporateId;
    const userId = user?.id;
    const limit = this.PAGE_SIZE;

    this.logger.log(`🔒 RBAC: role=${userRole}, corporateId=${corporateId || 'N/A'}, userId=${userId} | page offset=${offset}`);

    switch (interpretation.intent) {
      case 'list_users':
        // Only admin can list users
        if (userRole !== 'ADMIN') {
          return [];
        }
        sql = `SELECT u.email, u.role, COALESCE(r.full_name, split_part(u.email, '@', 1)) as full_name
               FROM users u
               LEFT JOIN registrations r ON r.user_id = u.id AND r.is_deleted = false
               ORDER BY u.email ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'list_candidates':
        if (userRole === 'ADMIN') {
          sql = `SELECT full_name, gender, status FROM registrations WHERE is_deleted = false ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `SELECT full_name, gender, status FROM registrations WHERE is_deleted = false AND corporate_account_id = $1 ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
          params.push(corporateId);
        } else {
          sql = `SELECT full_name, gender, status FROM registrations WHERE is_deleted = false AND user_id = $1 LIMIT ${limit}`;
          params.push(userId);
        }
        break;

      case 'test_results':
      case 'best_performer': {
        const baseTestSql = `
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
          WHERE assessment_attempts.status = 'COMPLETED' AND registrations.is_deleted = false`;

        if (userRole === 'ADMIN') {
          sql = `${baseTestSql} ORDER BY assessment_attempts.total_score DESC LIMIT ${limit} OFFSET ${offset}`;
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `${baseTestSql} AND registrations.corporate_account_id = $1 ORDER BY assessment_attempts.total_score DESC LIMIT ${limit} OFFSET ${offset}`;
          params.push(corporateId);
        } else {
          sql = `${baseTestSql} AND registrations.user_id = $1 LIMIT ${limit} OFFSET ${offset}`;
          params.push(userId);
        }
        break;
      }

      case 'person_lookup': {
        const searchName = interpretation.searchTerm || '';
        const baseLookupSql = `
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
          WHERE registrations.is_deleted = false`;

        if (userRole === 'ADMIN') {
          sql = `${baseLookupSql} AND registrations.full_name ILIKE $1 LIMIT 10`;
          params.push(`%${searchName}%`);
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `${baseLookupSql} AND registrations.full_name ILIKE $1 AND registrations.corporate_account_id = $2 LIMIT 10`;
          params.push(`%${searchName}%`, corporateId);
        } else {
          // Students can only see themselves — ignore search term
          sql = `${baseLookupSql} AND registrations.user_id = $1 LIMIT 1`;
          params.push(userId);
        }
        break;
      }

      case 'career_roles':
        sql = `SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false AND is_active = true ORDER BY career_role_name ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'count':
        if (interpretation.table === 'users') {
          if (userRole !== 'ADMIN') {
            return [{ count: 0 }];
          }
          sql = `SELECT COUNT(*) as count FROM users`;
        } else if (interpretation.table === 'registrations') {
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND corporate_account_id = $1`;
            params.push(corporateId);
          } else {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND user_id = $1`;
            params.push(userId);
          }
        } else {
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'COMPLETED'`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts aa JOIN registrations r ON aa.registration_id = r.id WHERE aa.status = 'COMPLETED' AND r.is_deleted = false AND r.corporate_account_id = $1`;
            params.push(corporateId);
          } else {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'COMPLETED' AND user_id = $1`;
            params.push(userId);
          }
        }
        break;

      default:
        // For unknown intents, return empty to trigger LLM fallback
        this.logger.log(`⚠️ Unknown intent "${interpretation.intent}" in executeQuery — returning empty`);
        return [];
    }

    try {
      this.logger.log(`🔍 SQL: ${sql.substring(0, 100)}... | params: [${params.join(', ')}]`);
      return await this.executeDatabaseQuery(sql, params);
    } catch (error) {
      this.logger.error(`SQL Error: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE FORMATTING (with pagination support)
  // ═══════════════════════════════════════════════════════════════════════════
  private formatResponse(
    interpretation: {
      intent: string;
      searchTerm: string | null;
      includePersonality: boolean;
    },
    data: any[],
    offset: number = 0,
    totalCount: number = 0,
  ): string {
    if (!data.length) {
      return `No results found. Try:\n• "list users"\n• "show test results"\n• "candidates"\n• "[name]'s score"`;
    }

    let body = '';
    switch (interpretation.intent) {
      case 'test_results':
      case 'best_performer':
      case 'person_lookup':
        body = this.formatTestResults(data, interpretation.intent === 'best_performer', offset);
        break;

      case 'list_users':
        body = this.formatUserList(data, offset);
        break;

      case 'list_candidates':
        body = this.formatCandidateList(data, offset);
        break;

      case 'career_roles':
        body = this.formatCareerRoles(data, offset);
        break;

      case 'count':
        return `**Total: ${data[0]?.count || 0}**`;

      default:
        body = this.formatGenericList(data, offset);
        break;
    }

    // ── Append pagination footer ──
    if (totalCount > 0 && ['list_users', 'list_candidates', 'test_results', 'best_performer', 'career_roles'].includes(interpretation.intent)) {
      const from = offset + 1;
      const to = Math.min(offset + data.length, totalCount);
      const hasMore = to < totalCount;
      body += `\n\n📄 **Showing ${from}–${to} of ${totalCount}**`;
      if (hasMore) {
        body += `  •  Say **"next"** or **"more"** to see the next ${Math.min(this.PAGE_SIZE, totalCount - to)}`;
      }
    }

    return body;
  }

  private formatTestResults(data: any[], isBestPerformer: boolean, offset: number = 0): string {
    let response = isBestPerformer
      ? '**🏆 Top Performers:**\n\n'
      : '**📊 Assessment Results:**\n\n';

    data.forEach((row, i) => {
      const name = row.full_name || 'Unknown';
      const num = offset + i + 1;
      const medal = (offset === 0 && isBestPerformer) ? (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${num}.**`) : `**${num}.**`;

      response += `${medal} **${name}**\n`;

      // Behavioral Style (DISC)
      if (row.behavioral_style) {
        response += `   📋 **Style: ${row.behavioral_style}**\n`;
        if (row.behavior_description) {
          response += `   ${row.behavior_description}\n`;
        }
      }

      // Agile Compatibility
      const scoreNum = row.total_score ? parseFloat(row.total_score) : NaN;
      if (!isNaN(scoreNum)) {
        const agile = this.getAgileLevel(scoreNum);
        response += `   🎯 **${agile.name}**: ${agile.desc}\n`;
      }

      response += '\n';
    });

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

  private formatUserList(data: any[], offset: number = 0): string {
    let response = '**👥 Users:**\n\n';
    data.forEach((row, i) => {
      const num = offset + i + 1;
      const name = row.full_name || row.email.split('@')[0];
      response += `**${num}.** ${name} | ${row.email} | ${row.role}\n`;
    });
    return response;
  }

  private formatCandidateList(data: any[], offset: number = 0): string {
    let response = '**📋 Candidates:**\n\n';
    data.forEach((row, i) => {
      const num = offset + i + 1;
      response += `**${num}.** **${row.full_name}** | ${row.gender || 'N/A'} | ${row.status}\n`;
    });
    return response;
  }

  private formatCareerRoles(data: any[], offset: number = 0): string {
    let response = '**💼 Career Roles:**\n\n';
    data.forEach((row, i) => {
      const num = offset + i + 1;
      response += `**${num}.** **${row.career_role_name}**\n`;
      if (row.short_description) {
        response += `   ${row.short_description}\n`;
      }
    });
    return response;
  }

  private formatGenericList(data: any[], offset: number = 0): string {
    let response = '';
    const keys = Object.keys(data[0]).filter(
      (k) => !k.includes('id') && !k.includes('_at'),
    );
    data.forEach((row, i) => {
      const num = offset + i + 1;
      response += `**${num}.** ${keys
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
