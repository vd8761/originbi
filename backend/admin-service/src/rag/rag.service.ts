/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-base-to-string, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getTokenTrackerCallback } from './utils/token-tracker';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { ConversationService } from './conversation.service';
import { ChatMemoryService } from './chat-memory.service';
import { OriIntelligenceService } from './ori-intelligence.service';
import { JDMatchingService } from './jd-matching.service';
import { TextToSqlService } from './text-to-sql.service';
import { RagCacheService } from './rag-cache.service';
import { AgentOrchestratorService } from './agent-orchestrator.service';

// RBAC Imports
import { AccessPolicyFactory } from './policies';
import { AuditLoggerService } from './audit';
import { UserContext } from '../common/interfaces/user-context.interface';

import { BI_PERSONA, getRandomResponse, getSignOff } from './ori-persona';
import { invokeWithFallback } from './utils/llm-fallback';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          🤖 BI v2.0 - JARVIS EDITION                      ║
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
  suggestions?: string[];
}

// Complete Database Schema
const COMPLETE_SCHEMA = `
═══════════════════════════════════════════════════════════════════════════════
ORIGINBI DATABASE SCHEMA — COMPLETE REFERENCE
═══════════════════════════════════════════════════════════════════════════════

TABLE: users
Columns: id, cognito_sub, email, email_verified, role, avatar_url, first_login_at, last_login_at, last_login_ip, login_count, metadata(jsonb), is_active, is_blocked, corporate_id, created_at, updated_at
Notes: System login accounts. role = ADMIN | SUPER_ADMIN | CORPORATE | STUDENT. corporate_id links corporate users to their company.
Relationships: users.id → registrations.user_id, users.id → corporate_accounts.user_id

TABLE: registrations
Columns: id, user_id, full_name, country_code, mobile_number, gender(MALE/FEMALE/OTHER), registration_source(SELF/ADMIN/CORPORATE/RESELLER), created_by_user_id, corporate_account_id, reseller_account_id, group_id, school_level, school_stream, student_board, department_degree_id, program_id, assessment_session_id, payment_required, payment_provider, payment_reference, payment_amount, payment_status(NOT_REQUIRED/PENDING/PAID/FAILED/REFUNDED), payment_created_at, paid_at, status(INCOMPLETE/COMPLETED/CANCELLED), metadata(jsonb), has_ai_counsellor, is_deleted, created_at, updated_at
Notes: Candidates/students. ALWAYS use full_name for person searches. Email is NOT in this table — join users for email. "resource" / "employee" = registration (corporate candidate).
Relationships: registrations.user_id → users.id, registrations.corporate_account_id → corporate_accounts.id, registrations.group_id → groups.id, registrations.program_id → programs.id

TABLE: assessment_attempts
Columns: id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, unlock_at, expires_at, started_at, must_finish_by, completed_at, status(NOT_STARTED/IN_PROGRESS/COMPLETED), total_score(numeric), max_score_snapshot, sincerity_index(numeric), sincerity_class, dominant_trait_id, is_deleted, created_at, updated_at
Notes: Exam/assessment results. JOIN with registrations ON registration_id for candidate name. total_score is the main score (also known as agile_score in reports). sincerity_index is numeric.
Relationships: assessment_attempts.registration_id → registrations.id, assessment_attempts.dominant_trait_id → personality_traits.id, assessment_attempts.program_id → programs.id

TABLE: assessment_answers
Columns: id, assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, question_source(MAIN/OPEN), main_question_id, open_question_id, question_sequence, main_option_id, open_option_id, answer_text, answer_score(numeric), time_spent_seconds, is_multiple_selection, answer_change_count, is_attention_fail, is_distraction_chosen, sincerity_flag, created_at, updated_at
Notes: Individual answers per question in an assessment attempt.

TABLE: personality_traits
Columns: id, code, blended_style_name, blended_style_desc, color_rgb, metadata(jsonb), is_active, is_deleted, created_at, updated_at
Notes: DISC behavioral styles (e.g., "Influential Leader", "Steady Analyst"). Join using assessment_attempts.dominant_trait_id

TABLE: assessment_sessions
Columns: id, user_id, registration_id, program_id
Notes: Links a user's assessment session to their registration and program.

TABLE: programs
Columns: id, code, name, description, assessment_title, report_title, is_demo, is_active, created_at, updated_at
Notes: Assessment programs (e.g., "Career Compass", "Student Discovery")

TABLE: career_roles
Columns: id, career_role_name, short_description, is_active, is_deleted
Notes: Job roles for career matching. Use career_role_name (NOT "name").

TABLE: career_role_tools
Columns: id, career_role_id, tool_name, is_deleted
Notes: Technologies/skills per career role. JOIN with career_roles ON career_role_id.

TABLE: corporate_accounts
Columns: id, user_id, company_name, full_name, sector_code, job_title, gender, country_code, mobile_number, linkedin_url, business_locations, employee_ref_id, total_credits, available_credits, is_active, is_blocked, created_at, updated_at
Notes: Company/employer accounts. company_name = organization name, full_name = contact person. "resource"/"employee" of a corporate = registrations WHERE corporate_account_id = corporate_accounts.id
Relationships: corporate_accounts.user_id → users.id (the corporate user login). Candidates link via registrations.corporate_account_id → corporate_accounts.id

TABLE: groups
Columns: id, code, name, corporate_account_id, reseller_account_id, created_by_user_id, is_default, is_active, is_deleted, metadata(jsonb), created_at, updated_at
Notes: Candidate batches/groups within a corporate. groups.corporate_account_id → corporate_accounts.id

TABLE: affiliate_accounts
Columns: id, user_id, name, email, country_code, mobile_number, address, referral_code, referral_count, commission_percentage(numeric), total_earned_commission(numeric), total_settled_commission(numeric), total_pending_commission(numeric), upi_id, upi_number, banking_name, account_number, ifsc_code, branch_name, aadhar_documents(jsonb), pan_documents(jsonb), is_active, metadata(jsonb), created_at, updated_at
Notes: Affiliate/referral partners

TABLE: affiliate_referral_transactions
Columns: id, affiliate_account_id, registration_id, registration_amount(numeric), commission_percentage(numeric), earned_commission_amount(numeric), settlement_status(0=Not Settled/1=Processing/2=Settled), metadata(jsonb), payment_at, created_at, updated_at
Notes: Individual referral records.

TABLE: affiliate_settlement_transactions
Columns: id, affiliate_account_id, settle_amount(numeric), transaction_mode, settlement_transaction_id, payment_date, metadata(jsonb), created_at
Notes: Payout records to affiliates

TABLE: trait_based_course_details
Columns: id, trait_id, course_name, course_description, is_deleted
Notes: Course recommendations per personality trait

TABLE: departments
Columns: id, name, short_name, category, metadata(jsonb), is_active, is_deleted, created_at, updated_at
Notes: Academic departments

TABLE: department_degrees
Columns: id, department_id, degree_type_id
Notes: Links departments to degree types. department_degrees.department_id → departments.id, department_degrees.degree_type_id → degree_types.id

TABLE: degree_types
Columns: id, name, level, is_active, is_deleted, created_at, updated_at
Notes: Degree levels (Bachelor's, Master's, Diploma, etc.)

═══════════════════════════════════════════════════════════════════════════════
COMMON VOCABULARY MAPPING:
- "resource" / "employee" / "candidate" / "student" / "member" = registrations table
- "corporate" / "company" / "employer" / "organization" = corporate_accounts table
- "score" / "result" / "marks" / "assessment" = assessment_attempts table
- "personality" / "trait" / "style" / "DISC" = personality_traits table
- "program" / "course" / "exam type" = programs table
- "group" / "batch" = groups table
- "affiliate" / "partner" / "referral" = affiliate_accounts table
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
  private readonly logger = new Logger('BI');
  private llm: ChatGoogleGenerativeAI | null = null;
  private fallbackLlm: ChatGroq | null = null;
  private reportsDir: string;
  private readonly ROUTING_HISTORY_MAX_CHARS = 900;
  private readonly GENERAL_KNOWLEDGE_CHUNK_LIMIT = 2;
  private readonly GENERAL_KNOWLEDGE_CHUNK_MAX_CHARS = 380;

  // Simple cache for query understanding to improve performance
  private queryCache = new Map<string, any>();
  private readonly CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour (was 30 minutes)

  // Column safety: tracks which optional columns exist in the DB
  private safeColumnsChecked = false;
  private hasSincerityColumns = true; // assume true, checked on first query

  // Disambiguation follow-up cache: remembers the search term when multiple candidates are shown
  // so that a bare number reply ("1", "#2") re-routes to the correct handler.
  private disambiguationCache = new Map<string, {
    searchTerm: string;
    timestamp: number;
    handler?: string;
    options?: string[];
  }>();
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
    private textToSqlService: TextToSqlService,
    private policyFactory: AccessPolicyFactory,
    private auditLogger: AuditLoggerService,
    private ragCache: RagCacheService,
    private agentOrchestrator: AgentOrchestratorService,
  ) {
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    this.logger.log('🤖 BI v2.0 initialized with RBAC - Your intelligent career guide!');
  }

  /**
   * Check which optional columns exist in the DB (runs once, lazily)
   * Prevents "column does not exist" errors from crashing queries
   */
  private async ensureColumnSafety(): Promise<void> {
    if (this.safeColumnsChecked) return;
    try {
      const result = await this.dataSource.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'assessment_attempts' AND column_name IN ('sincerity_class', 'sincerity_index')
      `);
      const existingCols = new Set(result.map((r: any) => r.column_name));
      this.hasSincerityColumns = existingCols.has('sincerity_class') && existingCols.has('sincerity_index');
      if (!this.hasSincerityColumns) {
        this.logger.warn('⚠️ sincerity_class/sincerity_index columns not found in assessment_attempts — queries will omit them');
      }
      this.safeColumnsChecked = true;
    } catch (e) {
      this.logger.warn(`Column safety check failed: ${e.message} — assuming columns exist`);
      this.safeColumnsChecked = true;
    }
  }

  /** Returns sincerity SELECT fields if columns exist, or NULL aliases */
  private getSinceritySelectFields(alias: string = 'aa'): string {
    if (this.hasSincerityColumns) {
      return `${alias}.sincerity_index, ${alias}.sincerity_class`;
    }
    return `NULL::numeric as sincerity_index, NULL::varchar as sincerity_class`;
  }

  /** Generate a contextual "no data" message based on what the user asked about */
  private getContextualNoDataMessage(question: string, scopeMsg: string): string {
    const q = question.toLowerCase();
    if (/\b(education|qualification|degree|department|school|board|stream)\b/i.test(q)) {
      return `Education/qualification details are not available for the candidates${scopeMsg} at this time.`;
    }
    if (/\b(score|marks|assessment|test|exam|result)\b/i.test(q)) {
      return `No assessment results are currently available${scopeMsg}. The candidates may not have completed their assessments yet.`;
    }
    if (/\b(email|phone|mobile|contact)\b/i.test(q)) {
      return `Contact details are not available for these candidates${scopeMsg}.`;
    }
    if (/\b(their|them|those)\b/i.test(q)) {
      return `No data available for the requested details${scopeMsg}. Try asking **"list candidates"** to see available data.`;
    }
    return `No matching data found${scopeMsg}. Try asking a more specific question or use **"list candidates"** to see available data.`;
  }

  /** Sanitize error messages — never expose raw SQL/DB internals to users */
  private sanitizeErrorForUser(error: any): string {
    const msg = error?.message || 'An unexpected error occurred';
    // Strip SQL internals
    if (/column.*does not exist/i.test(msg)) {
      return 'A system configuration issue was detected. Please contact your administrator.';
    }
    if (/relation.*does not exist/i.test(msg)) {
      return 'A required system resource is missing. Please contact your administrator.';
    }
    if (/permission denied/i.test(msg)) {
      return 'You do not have permission to access this data.';
    }
    if (/timeout|timed out/i.test(msg)) {
      return 'The request took too long. Please try a simpler query.';
    }
    if (/syntax error/i.test(msg)) {
      return 'There was a problem processing your request. Please try rephrasing your question.';
    }
    if (/connect|connection/i.test(msg)) {
      return 'Unable to process the request right now. Please try again in a moment.';
    }
    // For any other DB errors, return generic message
    if (/ECONNREFUSED|ENOTFOUND|ERROR/i.test(msg)) {
      return 'A system error occurred. Please try again or contact support.';
    }
    return msg;
  }

  private compactRoutingHistory(history: string): string {
    if (!history) return '';
    const normalized = history
      .replace(/---\s*CONVERSATION HISTORY\s*---/gi, '')
      .replace(/---\s*CURRENT INTERACTION\s*---/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return normalized.length > this.ROUTING_HISTORY_MAX_CHARS
      ? normalized.slice(-this.ROUTING_HISTORY_MAX_CHARS)
      : normalized;
  }

  private buildCompactKnowledgeContext(chunks: any[]): string {
    if (!Array.isArray(chunks) || chunks.length === 0) return '';
    return chunks
      .slice(0, this.GENERAL_KNOWLEDGE_CHUNK_LIMIT)
      .map((d: any, i: number) => {
        const text = String(d?.content || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, this.GENERAL_KNOWLEDGE_CHUNK_MAX_CHARS);
        return `[${i + 1}] ${text}`;
      })
      .join('\n---\n');
  }

  private getLlm(): ChatGoogleGenerativeAI {
    if (!this.llm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      this.llm = new ChatGoogleGenerativeAI({
        apiKey,
        model: 'gemini-2.5-flash',
        temperature: 0,
        maxOutputTokens: 600,
        callbacks: [getTokenTrackerCallback('RAG Service')],
      });
    }
    return this.llm;
  }

  private getFallbackLlm(): ChatGroq {
    if (!this.fallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      this.fallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        timeout: 15000,
        maxTokens: 600,
        callbacks: [getTokenTrackerCallback('RAG Service (Groq Fallback)')],
      });
    }
    return this.fallbackLlm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART QUERY NORMALIZATION — Auto-correct typos, map synonyms, clean input
  // ═══════════════════════════════════════════════════════════════════════════
  private normalizeQuery(question: string): string {
    let q = question.trim();

    // ── Step 0: Fix commonly joined/merged words ──
    q = q.replace(/\bhowmany\b/gi, 'how many');
    q = q.replace(/\bhoware\b/gi, 'how are');
    q = q.replace(/\bwhatis\b/gi, 'what is');
    q = q.replace(/\bwhatare\b/gi, 'what are');
    q = q.replace(/\bwhatabout\b/gi, 'what about');
    q = q.replace(/\blistmy\b/gi, 'list my');
    q = q.replace(/\bshowmy\b/gi, 'show my');

    // ── Domain-specific typo dictionary ──
    // Maps common misspellings to correct terms
    const typoMap: Record<string, string> = {
      // Candidate variations
      'candiate': 'candidate', 'candadate': 'candidate', 'candidte': 'candidate',
      'candiates': 'candidates', 'candidtes': 'candidates', 'candadates': 'candidates',
      'canidate': 'candidate', 'canidates': 'candidates', 'candidat': 'candidate',
      'candidats': 'candidates', 'canditae': 'candidate', 'canditaes': 'candidates',
      'canditare': 'candidate', 'canditares': 'candidates', 'canditate': 'candidate',
      'canditates': 'candidates', 'candidaet': 'candidate', 'candidaets': 'candidates',
      'cadnidate': 'candidate', 'canddidate': 'candidate', 'candadite': 'candidate',
      // Employee variations
      'employe': 'employee', 'employes': 'employees', 'employeee': 'employee',
      'emplyee': 'employee', 'emplyees': 'employees', 'emploee': 'employee',
      'emploees': 'employees', 'employi': 'employee', 'employess': 'employees',
      // Resource variations
      'resourse': 'resource', 'resourses': 'resources', 'resorce': 'resource',
      'resorces': 'resources', 'resouces': 'resources',
      // Performer variations
      'performar': 'performer', 'performars': 'performers', 'preformer': 'performer',
      'preformers': 'performers', 'perfomer': 'performer', 'perfomers': 'performers',
      'performaer': 'performer', 'performaers': 'performers', 'performaes': 'performers',
      'performr': 'performer', 'performrs': 'performers', 'preformner': 'performer',
      // Assessment variations
      'assesment': 'assessment', 'assesments': 'assessments', 'asessment': 'assessment',
      'assessmnt': 'assessment', 'assement': 'assessment',
      // Result variations 
      'reslt': 'result', 'reslts': 'results', 'reult': 'result', 'reults': 'results',
      // Development variations
      'developement': 'development', 'devlopment': 'development', 'developmnt': 'development',
      // Score variations
      'scor': 'score', 'scors': 'scores', 'scroe': 'score',
      // Report variations
      'reprt': 'report', 'repert': 'report', 'reprot': 'report',
      // Other common typos
      'detils': 'details', 'detials': 'details', 'deatils': 'details',
      'carreer': 'career', 'carrer': 'career', 'carier': 'career',
      'abut': 'about', 'abot': 'about', 'abour': 'about',
      'knw': 'know', 'konw': 'know',
      'shw': 'show', 'shwo': 'show',
      'lst': 'list', 'lsit': 'list',
      'fir': 'fit', // "fir for" → "fit for" (from screenshot)
      'sutable': 'suitable', 'sutiable': 'suitable', 'suitble': 'suitable',
      'sutaible': 'suitable', 'suitabel': 'suitable', 'suitabale': 'suitable',
      'eligble': 'eligible', 'elegible': 'eligible', 'eligibel': 'eligible',
      'devlop': 'develop', 'develp': 'develop', 'develope': 'develop',
      'devloper': 'developer', 'develper': 'developer', 'developar': 'developer',
      'ful': 'full', 'stck': 'stack',
      'thier': 'their', 'theri': 'their',
      'managr': 'manager', 'managrs': 'managers',
      'analsis': 'analysis', 'anaylsis': 'analysis',
      'personalti': 'personality', 'personalty': 'personality',
      'teh': 'the', 'hte': 'the',
      // Count/total typos
      'toal': 'total', 'totl': 'total', 'tatal': 'total',
      'conut': 'count', 'cont': 'count',
      // Pronoun typos
      'im': 'i am', 'iam': 'i am',
      'thies': 'their', 'ther': 'their', 'thire': 'their',
      'educations': 'education', 'qulaification': 'qualification', 'qualificaton': 'qualification',
      'qualifcation': 'qualification', 'qualificaion': 'qualification',
      // Gender typos
      'mal': 'male', 'femal': 'female', 'femle': 'female',
      // Project/role typos
      'projct': 'project', 'managar': 'manager', 'mangaer': 'manager',
      'engneer': 'engineer', 'enginer': 'engineer', 'enginear': 'engineer',
      'desginer': 'designer', 'desgner': 'designer',
      'analyt': 'analyst', 'analist': 'analyst', 'analitcs': 'analytics',
      'complet': 'complete', 'complted': 'completed', 'compleated': 'completed',
      'registred': 'registered', 'registerd': 'registered', 'regstered': 'registered',
      'afiliate': 'affiliate', 'affilate': 'affiliate', 'affilait': 'affiliate',
      'referal': 'referral', 'referel': 'referral', 'refferal': 'referral',
      // Company/Corporate typos
      'comany': 'company', 'compny': 'company', 'compnay': 'company', 'companie': 'company',
      'companyes': 'companies', 'companis': 'companies', 'compaines': 'companies',
      'corporte': 'corporate', 'corporat': 'corporate', 'corparate': 'corporate',
      'corpoarte': 'corporate', 'coroprate': 'corporate', 'corprate': 'corporate',
      'corportes': 'corporates', 'corparates': 'corporates',
      // Comparison/question typos
      'comparision': 'comparison', 'compaire': 'compare', 'comapre': 'compare',
      'averge': 'average', 'avrage': 'average', 'avreage': 'average',
      'highst': 'highest', 'lowst': 'lowest',
      'montly': 'monthly', 'weakly': 'weekly', 'yealy': 'yearly',
    };

    // ── Corporate synonym mapping ──
    // In corporate context, these all mean "candidate" (registrations table)
    const corporateSynonyms: Record<string, string> = {
      'employee': 'candidate', 'employees': 'candidates',
      'resource': 'candidate', 'resources': 'candidates',
      'staff': 'candidate', 'staffs': 'candidates',
      'worker': 'candidate', 'workers': 'candidates',
      'team member': 'candidate', 'team members': 'candidates',
      'member': 'candidate', 'members': 'candidates',
      'people': 'candidates', 'person': 'candidate',
    };

    // Step 1: Apply typo corrections (word-boundary aware)
    const words = q.split(/\s+/);
    const correctedWords = words.map(word => {
      // Remove trailing punctuation for matching, preserve it
      const match = word.match(/^([\w']+)([^\w]*)$/);
      if (!match) return word;
      const [, core, punct] = match;
      const lower = core.toLowerCase();
      if (typoMap[lower]) {
        this.logger.log(`✏️ Auto-correct: "${core}" → "${typoMap[lower]}"`);
        return typoMap[lower] + punct;
      }
      return word;
    });
    q = correctedWords.join(' ');

    // Step 2: Apply multi-word synonym mapping
    const qLower = q.toLowerCase();
    for (const [synonym, replacement] of Object.entries(corporateSynonyms)) {
      if (synonym.includes(' ')) {
        // Multi-word synonym
        const regex = new RegExp(`\\b${synonym}\\b`, 'gi');
        if (regex.test(qLower)) {
          q = q.replace(regex, replacement);
          this.logger.log(`🔄 Synonym mapped: "${synonym}" → "${replacement}"`);
        }
      }
    }
    // Single-word synonyms
    const finalWords = q.split(/\s+/);
    const mappedWords = finalWords.map(word => {
      const match = word.match(/^([\w']+)([^\w]*)$/);
      if (!match) return word;
      const [, core, punct] = match;
      const lower = core.toLowerCase();
      // Only map single-word synonyms (multi-word already handled)
      if (corporateSynonyms[lower] && !lower.includes(' ')) {
        this.logger.log(`🔄 Synonym mapped: "${core}" → "${corporateSynonyms[lower]}"`);
        return corporateSynonyms[lower] + punct;
      }
      return word;
    });
    q = mappedWords.join(' ');

    // Step 3: Clean up grammar artifacts
    q = q.replace(/\s{2,}/g, ' ').trim(); // double spaces
    q = q.replace(/\?{2,}/g, '?'); // multiple question marks

    if (q !== question.trim()) {
      this.logger.log(`📝 Normalized: "${question}" → "${q}"`);
    }

    return q;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN QUERY ENTRY POINT
  // ═══════════════════════════════════════════════════════════════════════════
  async query(question: string, user: any, conversationId: number = 0, mode?: string): Promise<QueryResult> {
    this.logger.log(`🚀 RAG Query Started at ${new Date().toISOString()}`);
    this.logger.log(`📝 Input Question: "${question}"`);
    this.logger.log(`👤 User:`, JSON.stringify(user));

    // Ensure column safety check runs once
    await this.ensureColumnSafety();

    if (!question?.trim()) {
      this.logger.log(`❌ Empty question detected`);
      return {
        answer: 'Please ask a question.',
        searchType: 'none',
        confidence: 0,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // AI COUNSELLOR MODE — Premium career counselling for students
    // Bypasses normal intent classification and routes directly to
    // the advanced counsellor prompt engine.
    // ═══════════════════════════════════════════════════════════════
    if (mode === 'counsellor') {
      const normalizedCounsellorQ = this.normalizeQuery(question).toLowerCase();
      const isCounsellorDataRequest =
        /\b(list|show|get|count|how many|total|top|best|who)\b/i.test(normalizedCounsellorQ) &&
        /\b(user|users|candidate|candidates|resource|resources|employee|employees|staff|member|members|result|results|score|scores|assessment|assessments|company|companies|corporate|group|groups|batch|batches)\b/i.test(normalizedCounsellorQ);

      if (!isCounsellorDataRequest) {
        this.logger.log('🎓 AI Counsellor mode activated — premium career guidance');
        try {
          const userId = user?.id || 0;
          const userEmail = user?.email || user?.sub || '';
          this.logger.log(`🎓 Counsellor: userId=${userId}, email=${userEmail}`);

          let userProfile: any = null;
          try {
            userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
            this.logger.log(`🎓 Counsellor: profile found = ${!!userProfile}`);
          } catch (profileErr) {
            this.logger.warn(`🎓 Profile lookup failed (non-blocking): ${profileErr.message}`);
          }

          // Build conversation context from memory + chat history
          let conversationHistory = '';
          if (userId > 0) {
            try {
              this.oriIntelligence.extractAndStoreFacts(userId, question);
              conversationHistory = this.oriIntelligence.getConversationContext(userId);
            } catch { /* non-blocking */ }
          }
          if (conversationId > 0) {
            try {
              const history = await this.chatMemory.buildLlmHistory(conversationId);
              if (history) conversationHistory += '\n' + history;
            } catch { /* non-blocking */ }
          }

          const answer = await this.oriIntelligence.answerCounsellorQuestion(
            question, userProfile, conversationHistory,
          );
          this.logger.log(`🎓 Counsellor answer generated (${answer.length} chars)`);
          return { answer, searchType: 'ai_counsellor', confidence: 0.97 };
        } catch (counsellorError) {
          this.logger.error(`🎓 AI Counsellor error: ${counsellorError.message}`, counsellorError.stack);
          return {
            answer: 'I am having a temporary issue right now. Please try again in a moment.',
            searchType: 'ai_counsellor',
            confidence: 0,
          };
        }
      }

      this.logger.log('🎓 Counsellor data request detected — routing to standard data query pipeline');
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
          answer: getRandomResponse(BI_PERSONA.greetings),
          searchType: 'greeting',
          confidence: 1.0,
        };
      }

      if (['help', 'what can you do', 'what can you help me with'].includes(normalizedQ)) {
        this.logger.log('🎯 Intent: help (bypassed LLM)');
        return {
          answer: BI_PERSONA.help,
          searchType: 'help',
          confidence: 1.0,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // SMART NORMALIZATION: Auto-correct typos + map synonyms
      // This runs BEFORE intent classification to fix user input
      // ═══════════════════════════════════════════════════════════════
      question = this.normalizeQuery(question);

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
                pagCtx.intent === 'career_roles' ? 'career_roles' :
                  pagCtx.intent === 'affiliate_referrals' ? 'affiliate_referral_transactions' :
                    pagCtx.intent === 'affiliate_payments' ? 'affiliate_settlement_transactions' :
                      pagCtx.intent === 'affiliate_list' || pagCtx.intent === 'affiliate_earnings' ? 'affiliate_accounts' :
                        'assessment_attempts',
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
          this.logger.log(`🔢 Bare number "${normalizedQ}" detected — resuming disambiguation for "${ctx.searchTerm}" (handler=${ctx.handler || 'career_report'})`);
          const selectedIndex = parseInt(bareNumberMatch[1], 10) - 1;
          if (ctx.options?.length && (selectedIndex < 0 || selectedIndex >= ctx.options.length)) {
            return {
              answer: `**❌ Invalid selection.** Please use a number between 1 and ${ctx.options.length}.`,
              searchType: 'disambiguation',
              confidence: 0.4,
            };
          }

          const selectedName = ctx.options?.[selectedIndex];
          this.disambiguationCache.delete(disambigKey);

          const targetTerm = selectedName || `${ctx.searchTerm} #${bareNumberMatch[1]}`;

          // Route to the correct handler based on what created the disambiguation
          if (ctx.handler === 'person_lookup') {
            return await this.handlePersonLookup(targetTerm, user);
          }
          return await this.handleCareerReport(targetTerm, user);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // SEMANTIC CACHE — Check if a similar question was answered recently
      // ═══════════════════════════════════════════════════════════════
      const userRole = (user?.role || 'STUDENT').toUpperCase();
      const bypassResponseCache = this.shouldBypassResponseCache(question);
      if (bypassResponseCache) {
        this.logger.debug(`⏭️ Cache bypass for dynamic/personal query: "${question.slice(0, 60)}"`);
      } else {
        try {
          const cached = await this.ragCache.lookup(question, userRole);
          if (cached) {
            this.logger.log(`⚡ Cache HIT — returning cached response (similarity ≥ 0.92)`);
            return {
              answer: cached.answer,
              searchType: cached.searchType || 'cached',
              confidence: cached.confidence || 0.95,
            };
          }
        } catch (cacheErr) {
          this.logger.warn(`Cache lookup failed (non-blocking): ${cacheErr}`);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 1: CONVERSATION CONTEXT + QUERY UNDERSTANDING
      // ═══════════════════════════════════════════════════════════════
      const sessionId = conversationId > 0 ? `conv_${conversationId}` : `user_${user?.id || 0}`;

      // Build conversation history for context-aware intent classification
      let conversationHistory = '';
      if (conversationId > 0) {
        try {
          conversationHistory = await this.chatMemory.buildLlmHistory(conversationId);
        } catch (e) {
          this.logger.warn(`Failed to build conversation history: ${e}`);
        }
      }

      // Enrich conversation history with tracked entity context
      const session = this.conversationService.getSession(sessionId);
      const ctx = session.currentContext;
      if (ctx.lastPersonMentioned || ctx.entitiesDiscussed.length > 0) {
        let entityContext = '--- ENTITY CONTEXT ---\n';
        if (ctx.lastPersonMentioned) {
          entityContext += `Last person discussed: ${ctx.lastPersonMentioned}\n`;
        }
        if (ctx.entitiesDiscussed.length > 0) {
          entityContext += `People mentioned in this conversation: ${ctx.entitiesDiscussed.join(', ')}\n`;
        }
        if (ctx.lastIntent) {
          entityContext += `Last topic: ${ctx.lastIntent}\n`;
        }
        entityContext += '---\n';
        conversationHistory = entityContext + conversationHistory;
      }

      const routingHistory = this.compactRoutingHistory(conversationHistory);

      // ── Smart Pronoun Resolution & Entity Tracking ──
      // Resolve "him", "her", "that person" → actual name from conversation context
      let resolvedQuestion = question;
      const isFollowUp = this.conversationService.isFollowUp(sessionId, question);
      if (isFollowUp) {
        resolvedQuestion = this.conversationService.resolveReferences(sessionId, question);
        if (resolvedQuestion !== question) {
          this.logger.log(`🔄 Pronoun resolved: "${question}" → "${resolvedQuestion}"`);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // SMART FOLLOW-UP CONTEXT RESOLVER
      // "list the details" / "list those" / "show them" / "give details"
      // These generic queries need context from the previous intent to
      // decide WHAT to list. Without this, the LLM hallucinates text.
      // ═══════════════════════════════════════════════════════════════
      const followUpResolved = this.resolveFollowUpIntent(sessionId, resolvedQuestion, userRole);
      if (followUpResolved) {
        this.logger.log(`🔁 Follow-up resolved: "${resolvedQuestion}" → intent: ${followUpResolved.intent} (from lastIntent context)`);
        // Track in conversation
        this.conversationService.addUserMessage(sessionId, question, followUpResolved.intent, []);
        // Execute directly
        const followUpData = await this.executeQuery(followUpResolved, user as any, 0);

        // Store pagination state
        if (['list_users', 'list_candidates', 'test_results', 'best_performer', 'career_roles', 'corporate_details', 'affiliate_referrals'].includes(followUpResolved.intent)) {
          const pagKey = this.getPaginationKey(user);
          this.paginationCache.set(pagKey, {
            intent: followUpResolved.intent,
            page: 0,
            totalCount: Array.isArray(followUpData) ? followUpData.length : 0,
            timestamp: Date.now(),
          });
        }

        if (!followUpData || (Array.isArray(followUpData) && followUpData.length === 0)) {
          return {
            answer: this.getContextualNoDataMessage(resolvedQuestion, userRole === 'CORPORATE' ? ' in your organization' : ''),
            searchType: followUpResolved.intent,
            confidence: 0.8,
          };
        }

        const formattedAnswer = this.formatResponse(followUpResolved, followUpData, 0);
        return {
          answer: formattedAnswer,
          searchType: followUpResolved.intent,
          confidence: 0.95,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // 🤖 AGENTIC RAG — LLM-based tool selection (v3.0)
      // The agent dynamically selects 1-3 tools, runs them in parallel,
      // and synthesizes a unified response. Falls back to legacy intent
      // routing if the agent fails.
      // ═══════════════════════════════════════════════════════════════
      try {
        this.logger.log('🤖 Attempting Agentic RAG tool selection...');
        const agentResult = await this.agentOrchestrator.agentQuery(
          resolvedQuestion,
          user as UserContext,
          conversationId,
          routingHistory,
        );

        if (agentResult && agentResult.confidence > 0.3) {
          this.logger.log(`✅ Agentic RAG succeeded: tools=[${agentResult.toolsUsed.join('+')}] confidence=${agentResult.confidence} plan=${agentResult.planningTimeMs}ms exec=${agentResult.executionTimeMs}ms`);

          // Persist disambiguation context produced by Agentic person lookup so bare-number follow-ups work.
          const disambiguation = agentResult.sources?.disambiguation;
          if (agentResult.searchType === 'disambiguation' && disambiguation?.searchTerm && Array.isArray(disambiguation?.options)) {
            this.disambiguationCache.set(this.getDisambiguationKey(user), {
              searchTerm: disambiguation.searchTerm,
              timestamp: Date.now(),
              handler: disambiguation.handler || 'person_lookup',
              options: disambiguation.options,
            });
          }

          // Track intent/entities from the agent response for stronger follow-up memory.
          const primaryIntent = agentResult.toolsUsed?.find(t => t !== 'conversation_context') || agentResult.searchType;
          const entityName = this.extractName(resolvedQuestion) || this.extractName(question) || '';
          this.conversationService.addUserMessage(
            sessionId,
            question,
            primaryIntent,
            entityName ? [entityName] : [],
          );
          this.conversationService.addBiResponse(
            sessionId, agentResult.answer.slice(0, 500), agentResult.searchType,
          );

          // Cache the result
          if (!this.shouldBypassResponseCache(question)) {
            try {
              await this.ragCache.store(
                question,
                agentResult.answer,
                agentResult.searchType,
                agentResult.confidence,
                userRole,
              );
            } catch { /* non-blocking */ }
          }

          return {
            answer: agentResult.answer,
            searchType: agentResult.searchType,
            confidence: agentResult.confidence,
            sources: agentResult.sources,
          };
        }

        this.logger.log(`🔄 Agentic RAG low confidence (${agentResult?.confidence}) — falling back to legacy routing`);
      } catch (agentError) {
        this.logger.warn(`🔄 Agentic RAG failed: ${agentError.message} — falling back to legacy routing`);
      }

      // ═══════════════════════════════════════════════════════════════
      // LEGACY FALLBACK — Original intent-based routing (v2.0)
      // Used when Agentic RAG fails or returns low confidence
      // ═══════════════════════════════════════════════════════════════
      const interpretation = await this.understandQuery(resolvedQuestion, userRole, routingHistory);
      this.logger.log(`🎯 Intent: ${interpretation.intent}`);
      this.logger.log(`🔍 Search: ${interpretation.searchTerm || 'general'}`);

      // Track entities: extract person names from the question for future pronoun resolution
      const mentionedEntities: string[] = [];
      if (interpretation.searchTerm) {
        mentionedEntities.push(interpretation.searchTerm);
      }
      // Extract names from the raw question for entity tracking
      const nameFromQuestion = this.extractName(resolvedQuestion);
      if (nameFromQuestion && !mentionedEntities.includes(nameFromQuestion)) {
        mentionedEntities.push(nameFromQuestion);
      }
      // Also extract "Name: XYZ" format (from chat_profile_report messages)
      const nameFieldMatch = resolvedQuestion.match(/name[:\s]+([^\n,]+)/i);
      if (nameFieldMatch && nameFieldMatch[1]) {
        const profileName = nameFieldMatch[1].trim().replace(/[.,;:!?]+$/, '');
        if (profileName.length >= 2 && !mentionedEntities.includes(profileName)) {
          mentionedEntities.push(profileName);
        }
      }

      // Add user message to conversation session with tracked entities
      this.conversationService.addUserMessage(
        sessionId,
        question,
        interpretation.intent,
        mentionedEntities,
      );

      // ═══════════════════════════════════════════════════════════════
      // ORI GREETING & HELP - Jarvis-like personality
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'greeting') {
        return {
          answer: getRandomResponse(BI_PERSONA.greetings),
          searchType: 'greeting',
          confidence: 1.0,
        };
      }

      if (interpretation.intent === 'help') {
        return {
          answer: BI_PERSONA.help,
          searchType: 'help',
          confidence: 1.0,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // MULTI-PERSON QUERY HANDLER: "X and Y report" / "X and Y results"
      // Split multi-person queries and handle each separately
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.searchTerm && /\band\b/i.test(interpretation.searchTerm)) {
        const names = interpretation.searchTerm.split(/\s+and\s+/i).map((n: string) => n.trim()).filter((n: string) => n.length >= 2);
        if (names.length >= 2) {
          this.logger.log(`👥 Multi-person query detected: ${names.join(', ')}`);
          const results: string[] = [];
          for (const name of names) {
            const result = interpretation.intent === 'career_report'
              ? await this.handleCareerReport(name, user)
              : await this.handlePersonLookup(name, user);
            results.push(`### ${name}\n${result.answer}`);
          }
          return {
            answer: results.join('\n\n---\n\n'),
            searchType: interpretation.intent,
            confidence: 0.9,
          };
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: BATCH / GROUP / PROGRAM QUERIES
      // MUST come before career_report to intercept program queries
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'batch_group_query') {
        this.logger.log(`📊 Intent: batch_group_query → handleBatchGroupQuery`);
        return await this.handleBatchGroupQuery(resolvedQuestion, user);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: CAREER REPORT GENERATION (RBAC scoped)
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'career_report') {
        // SAFETY: if the query mentions batch/group/program, divert to batch handler
        if (/\b(batch|group|program)\b/i.test(resolvedQuestion)) {
          this.logger.log(`📊 career_report contains batch/group/program keywords → routing to handleBatchGroupQuery`);
          return await this.handleBatchGroupQuery(resolvedQuestion, user);
        }
        return await this.handleCareerReport(interpretation.searchTerm, user);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: PERSON LOOKUP (name search + disambiguation)
      // SAFETY: Skip person lookup if query mentions company/corporate keywords
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'person_lookup' && interpretation.searchTerm) {
        // Company/corporate queries should NEVER go through person lookup
        const companyGuardPattern = /\b(companies?|corporates?|organization|employer|business)\b/i;
        // Batch/group/program queries should NEVER go through person lookup
        const batchProgramGuardPattern = /\b(batch|group|program|summarize|summary|readiness|strengths|risks|principal\s+version)\b/i;
        if (companyGuardPattern.test(resolvedQuestion)) {
          this.logger.log(`🏢 Company guard: "${interpretation.searchTerm}" query mentions company keywords — redirecting to corporate_details`);
          interpretation.intent = 'corporate_details';
          interpretation.table = 'corporate_accounts';
          // Extract actual company name (remove articles)
          const companyName = interpretation.searchTerm
            .replace(/^(the|a|an)\s+/i, '')
            .replace(/\s+(company|corporate|organization|business|employer)$/i, '')
            .trim();
          interpretation.searchTerm = companyName || null;
        } else if (batchProgramGuardPattern.test(resolvedQuestion)) {
          this.logger.log(`📊 Batch/program guard at person_lookup: redirecting to handleBatchGroupQuery`);
          return await this.handleBatchGroupQuery(resolvedQuestion, user);
        } else {
          return await this.handlePersonLookup(interpretation.searchTerm, user);
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: OVERALL ROLE FITMENT REPORT
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'overall_report') {
        return await this.handleOverallReport(user, question);
      }

      // ═══════════════════════════════════════════════════════════════
      // SPECIAL HANDLER: CHAT-BASED CUSTOM REPORT (User-provided profile)
      // Detects when user provides profile details in chat
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'chat_profile_report') {
        return await this.handleChatProfileReport(question, user);
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
        // Semantic enrichment: fetch relevant career/knowledge docs from vector store
        const careerRagChunks = await this.embeddingsService.semanticSearch(resolvedQuestion, 3).catch(() => []);
        if (careerRagChunks.length > 0) {
          this.logger.log(`📚 Career guidance enriched with ${careerRagChunks.length} semantic chunks`);
          const ragCtx = `\n\n— RELEVANT KNOWLEDGE BASE —\n${careerRagChunks.map((d: any, i: number) => `[${i + 1}] ${d.content}`).join('\n---\n')}`;
          const answer = await this.oriIntelligence.answerAnyQuestion(resolvedQuestion, userProfile, ragCtx, userRole);
          return { answer, searchType: 'career_guidance_semantic', confidence: 0.95 };
        }
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
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, conversationHistory, userRole);
        return { answer, searchType: 'personal_info', confidence: 0.9 };
      }

      // ═══════════════════════════════════════════════════════════════
      // 🧠 INTELLIGENT ROUTING (v3.0 — intent-driven, no keyword hijacking)
      //
      // The intent classification (fastLocalMatch + LLM understandQuery)
      // already handles routing to general_knowledge / career_guidance.
      // DB-bound intents MUST flow through to executeQuery() with RBAC.
      // ═══════════════════════════════════════════════════════════════
      const userId = user?.id || user?.user_id || 0;
      const userEmail = user?.email || user?.sub || '';

      // ═══════════════════════════════════════════════════════════════
      // PERSON-SPECIFIC QUERY GUARD
      // If the query mentions a person's name (from current question or
      // conversation context), verify they exist in our DB before routing
      // to general_knowledge. This prevents the LLM from searching the
      // web for biographical info about people.
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'general_knowledge' || interpretation.intent === 'career_guidance') {
        // COMPANY GUARD: Skip person guard entirely for company/corporate queries
        const companyKeywordGuard = /\b(companies?|corporates?|organization|employer|business)\b/i;
        if (companyKeywordGuard.test(resolvedQuestion)) {
          this.logger.log(`🏢 Company guard: Skipping person guard for company-related query`);
          interpretation.intent = 'corporate_details';
          interpretation.table = 'corporate_accounts';
          interpretation.searchTerm = null;
        }
        // BATCH/GROUP/PROGRAM GUARD: Skip person guard for batch/group/program queries
        else if (/\b(batch|group|program|summarize\s+(?:this\s+)?(?:batch|group)|readiness\s+level|principal\s+version)\b/i.test(resolvedQuestion)) {
          this.logger.log(`📊 Batch/program guard: Routing to handleBatchGroupQuery`);
          return await this.handleBatchGroupQuery(resolvedQuestion, user);
        } else {
        const personNameToCheck = interpretation.searchTerm
          || this.extractName(resolvedQuestion)
          || (nameFieldMatch && nameFieldMatch[1]?.trim());

        // Detect if this is a person-specific query (not a generic concept question)
        const isPersonSpecificQuery = this.isPersonSpecificQuery(resolvedQuestion, ctx);

        if (isPersonSpecificQuery && personNameToCheck) {
          this.logger.log(`🔍 Person guard: checking if "${personNameToCheck}" exists in DB (role=${userRole})`);

          // RBAC: Corporate users can ONLY see people in their organization
          const guardRole = (user?.role || 'STUDENT').toUpperCase();
          const guardCorporateId = user?.corporateId;
          let guardFilter = '';
          const guardParams: any[] = [`\\m${personNameToCheck}\\M`];
          if (guardRole === 'CORPORATE' && guardCorporateId) {
            guardFilter = ' AND r.corporate_account_id = $2';
            guardParams.push(guardCorporateId);
          }

          // Word-boundary match first for precision, then ILIKE fallback
          let personCheck = await this.dataSource.query(
            `SELECT r.full_name, 
                    (SELECT COUNT(*) FROM assessment_attempts aa WHERE aa.registration_id = r.id AND aa.status = 'COMPLETED') as completed_count
             FROM registrations r
             WHERE r.full_name ~* $1 AND r.is_deleted = false${guardFilter}
             LIMIT 3`,
            guardParams
          );
          let usedILIKEFallback = false;
          if (!personCheck || personCheck.length === 0) {
            const iLikeParams: any[] = [`%${personNameToCheck.toLowerCase()}%`];
            let iLikeFilter = '';
            if (guardRole === 'CORPORATE' && guardCorporateId) {
              iLikeFilter = ' AND r.corporate_account_id = $2';
              iLikeParams.push(guardCorporateId);
            }
            personCheck = await this.dataSource.query(
              `SELECT r.full_name, 
                      (SELECT COUNT(*) FROM assessment_attempts aa WHERE aa.registration_id = r.id AND aa.status = 'COMPLETED') as completed_count
               FROM registrations r
               WHERE LOWER(r.full_name) LIKE $1 AND r.is_deleted = false${iLikeFilter}
               LIMIT 5`,
              iLikeParams
            );
            usedILIKEFallback = true;
          }

          if (!personCheck || personCheck.length === 0) {
            const scopeMsg = guardRole === 'CORPORATE' ? ' within your organization' : '';
            this.logger.warn(`⚠️ Person guard: "${personNameToCheck}" not found${scopeMsg}`);

            // NO LLM FALLBACK — never use general/web knowledge for person queries.
            // This prevents the LLM from fabricating data about people.
            return {
              answer: BI_PERSONA.errors.notFound(personNameToCheck),
              searchType: 'person_not_found',
              confidence: 0.6,
            };
          }

          // If ILIKE fallback was used, verify we have an exact word-token match
          // to prevent "jai" → "JAISHREE" style substring mismatches
          if (usedILIKEFallback && !this.hasExactTokenMatch(personNameToCheck, personCheck)) {
            this.logger.log(`⚠️ Person guard: ILIKE matched but no exact token for "${personNameToCheck}" — showing disambiguation`);
            return this.buildFuzzyDisambiguation(personNameToCheck, personCheck, 'disambiguation');
          }

          // Person found but user asked general_knowledge → redirect to person_lookup or career_report
          this.logger.log(`✅ Person guard: "${personNameToCheck}" found in DB — redirecting to person_lookup`);
          const matchedName = personCheck[0].full_name;
          const hasAssessment = parseInt(personCheck[0].completed_count) > 0;

          if (hasAssessment) {
            // Redirect to career_report or person_lookup
            return await this.handleCareerReport(matchedName, user);
          } else {
            return {
              answer: `**Found "${matchedName}"**, but they haven't completed any assessments yet. Results will be available once an assessment is completed.`,
              searchType: 'person_no_assessment',
              confidence: 0.9,
            };
          }
        }
        } // end else (non-company person guard)
      }

      // ═══════════════════════════════════════════════════════════════
      // TEXT-TO-SQL ENGINE — "JARVIS MODE"
      // Routes data_query intent (or any unrecognized data question)
      // through the dynamic SQL generation engine for maximum flexibility.
      // Can answer ANY question about the database data without templates.
      // ═══════════════════════════════════════════════════════════════
      if (interpretation.intent === 'data_query') {
        this.logger.log('🧠 Intent: data_query → Text-to-SQL Jarvis Engine');
        try {
          const tsResult = await this.textToSqlService.answerQuestion(
            resolvedQuestion, user as UserContext, conversationHistory,
          );
          if (tsResult.confidence > 0.3) {
            // Store in semantic cache (fire-and-forget) unless query is dynamic/personal
            if (!this.shouldBypassResponseCache(resolvedQuestion)) {
              this.ragCache.store(resolvedQuestion, tsResult.answer, tsResult.searchType, tsResult.confidence, userRole).catch(() => {});
            }
            return {
              answer: tsResult.answer,
              searchType: tsResult.searchType,
              confidence: tsResult.confidence,
              sources: { rows: tsResult.rowCount },
            };
          }
          // Low confidence — return a clear DB-only response, NEVER fallback to LLM general knowledge
          this.logger.log('🔄 Text-to-SQL low confidence — returning DB-only response');
          return {
            answer: `No matching users found for that request.\n\nTry asking:\n- **"list users"**\n- **"list candidates"**\n- **"show top performers"**`,
            searchType: 'data_query_no_results',
            confidence: 0.6,
          };
        } catch (tsError) {
          this.logger.warn(`Text-to-SQL data_query failed: ${tsError.message}`);
          return {
            answer: `I couldn't process that request right now. Please try again.`,
            searchType: 'data_query_error',
            confidence: 0.4,
          };
        }
      }

      if (interpretation.intent === 'general_knowledge') {
        this.logger.log('🧠 Intent: general_knowledge → checking if data question first');

        // ═══════════════════════════════════════════════════════════════
        // PLATFORM DATA GUARD — Prevent LLM from answering platform
        // data questions (companies, candidates, scores, etc.) using
        // general/web knowledge. Force these through the DB pipeline.
        // ═══════════════════════════════════════════════════════════════
        const platformDataPattern = /\b(companies|corporates?|company|organization|employer|accounts?|candidates?|students?|registrations?|users?|employees?|resources?|staff|members?|assessments?|scores?|results?|affiliates?|referrals?|groups?|batches?|credits?)\b/i;
        const isPlatformDataQuery = platformDataPattern.test(resolvedQuestion);

        if (isPlatformDataQuery) {
          this.logger.log('🛡️ DATA GUARD: Platform entity detected in general_knowledge query — forcing DB route');
          try {
            const tsResult = await this.textToSqlService.answerQuestion(
              resolvedQuestion, user as UserContext, conversationHistory,
            );
            if (tsResult.confidence > 0.3) {
              return {
                answer: tsResult.answer,
                searchType: tsResult.searchType,
                confidence: tsResult.confidence,
                sources: { rows: tsResult.rowCount },
              };
            }
            // If Text-to-SQL returned low confidence with 0 rows, give a clear DB-only answer
            if (tsResult.rowCount === 0) {
              return {
                answer: `No users found for that request.`,
                searchType: 'data_guard_no_results',
                confidence: 0.8,
              };
            }
          } catch (tsErr) {
            this.logger.warn(`Text-to-SQL data guard failed: ${tsErr.message}`);
            return {
              answer: `I couldn't process that request right now. Please try again.`,
              searchType: 'data_guard_error',
              confidence: 0.6,
            };
          }
        }

        // SMART ROUTING: If the question looks like it wants DB data,
        // route through Text-to-SQL instead of generic LLM
        if (this.textToSqlService.isDataQuestion(resolvedQuestion)) {
          this.logger.log('🔄 Rerouting general_knowledge → Text-to-SQL (data question detected)');
          try {
            const tsResult = await this.textToSqlService.answerQuestion(
              resolvedQuestion, user as UserContext, conversationHistory,
            );
            if (tsResult.confidence > 0.5) {
              return {
                answer: tsResult.answer,
                searchType: tsResult.searchType,
                confidence: tsResult.confidence,
                sources: { rows: tsResult.rowCount },
              };
            }
          } catch (tsErr) {
            this.logger.warn(`Text-to-SQL reroute failed: ${tsErr.message} — falling through to LLM`);
          }
          // If Text-to-SQL had low confidence or failed, fall through to LLM
        }

        // ── Enhanced role-aware context for LLM ──
        const userRole = user?.role || 'STUDENT';

        // ═══════════════════════════════════════════════════════════════
        // CORPORATE DOMAIN GUARD — Corporate users should ONLY get
        // answers about career, talent, HR, business, and their platform
        // data. Block random general knowledge like "what is dusk".
        // ═══════════════════════════════════════════════════════════════
        if (userRole === 'CORPORATE') {
          const careerDomainPattern = /\b(career|job|role|skill|talent|hire|hiring|recruit|interview|resume|salary|promotion|performance|team|employee|resource|candidate|assessment|report|leadership|management|strategy|business|company|corporate|industry|sector|competency|development|training|analytics|data|dashboard|score|result|qualification|education|experience|department|designation|onboarding|retention|attrition|engagement|workforce|succession|pipeline|aptitude|personality|behavioral|soft\s*skill|hard\s*skill|technical|professional|human\s*resource|HR|KPI|OKR|feedback|appraisal|review|goal|objective|benchmark|productivity|efficiency|compliance|policy|diversity|inclusion|culture|compensation|benefits?|payroll|leave|attendance|probation)\b/i;
          const isCareerDomainQuery = careerDomainPattern.test(resolvedQuestion);

          // Also allow follow-ups that reference conversation context (pronouns, "them", "those", etc.)
          const isFollowUpQuery = /\b(their|them|those|these|his|her|show|list|get|display)\b/i.test(resolvedQuestion) && conversationHistory;

          if (!isCareerDomainQuery && !isFollowUpQuery) {
            this.logger.log(`🚫 CORPORATE DOMAIN GUARD: Blocking non-domain query: "${resolvedQuestion}"`);
            return {
              answer: `I'm designed to help with career intelligence, talent analytics, and workforce management for your organization.\n\nTry asking about:\n- **Your candidates/employees** — "list my employees", "show top performers"\n- **Career insights** — "skills for data analyst", "career path for CFO"\n- **Assessments** — "show test results", "best candidate for [role]"\n- **Reports** — "generate career report for [name]"`,
              searchType: 'domain_guard',
              confidence: 0.95,
            };
          }
        }

        const roleContext = userRole === 'ADMIN'
          ? 'The user is a platform ADMIN with full access to all candidates, users, and analytics. They may ask about platform metrics, candidate management, or hiring insights.'
          : userRole === 'CORPORATE'
            ? 'The user is a CORPORATE employer who manages their own candidates/employees. They care about team performance, hiring decisions, and employee development.'
            : userRole === 'AFFILIATE'
              ? 'The user is an AFFILIATE partner who refers candidates. They care about referral performance, commissions, and partner growth.'
              : 'The user is a STUDENT/individual who took assessments. They care about their own career growth, skill development, and career opportunities.';

        const enrichedHistory = conversationHistory
          ? `[User Role: ${userRole}] ${roleContext}\n\n${conversationHistory}`
          : `[User Role: ${userRole}] ${roleContext}`;

        // ═══════════════════════════════════════════════════════════════
        // ANTI-FABRICATION GUARD — If conversation mentions candidates/
        // people/names and user asks about their details (education,
        // scores, qualifications), NEVER let LLM answer. Force DB route
        // or return "data not available" — prevents hallucinated data.
        // ═══════════════════════════════════════════════════════════════
        const askingAboutPeopleData = /\b(education|qualification|degree|score|marks|result|assessment|email|phone|contact|address|experience|department|designation|salary|gender|age)\b/i.test(resolvedQuestion);
        const conversationMentionsPeople = conversationHistory && /\b(candidates?|employees?|resources?|people|names?|male|female|persons?|staff)\b/i.test(conversationHistory);
        const isFollowUpAboutPeople = /\b(their|them|those|these|his|her|list|show)\b/i.test(resolvedQuestion) && conversationMentionsPeople;

        if ((askingAboutPeopleData && conversationMentionsPeople) || (askingAboutPeopleData && isFollowUpAboutPeople)) {
          this.logger.log('🛡️ ANTI-FABRICATION GUARD: User asking about candidate details — routing to DB, not LLM');
          try {
            const tsResult = await this.textToSqlService.answerQuestion(
              resolvedQuestion, user as UserContext, conversationHistory,
            );
            if (tsResult.confidence > 0.3 && tsResult.rowCount > 0) {
              return {
                answer: tsResult.answer,
                searchType: tsResult.searchType,
                confidence: tsResult.confidence,
                sources: { rows: tsResult.rowCount },
              };
            }
          } catch (e) {
            this.logger.warn(`Anti-fabrication DB route failed: ${e.message}`);
          }
          // If DB returned nothing, give a clear "not available" response instead of letting LLM fabricate
          const scopeMsg = userRole === 'CORPORATE' ? ' in your organization' : '';
          return {
            answer: this.getContextualNoDataMessage(resolvedQuestion, scopeMsg),
            searchType: 'data_guard_no_fabrication',
            confidence: 0.85,
          };
        }

        this.logger.log('🧠 Using LLM directly for general knowledge');
        const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
        // Semantic enrichment: pull relevant docs from vector store with Cohere reranking
        const genKnowledgeChunks = await this.embeddingsService.semanticSearch(resolvedQuestion, 3).catch(() => []);
        const compactKnowledge = this.buildCompactKnowledgeContext(genKnowledgeChunks);
        const genRagContext = compactKnowledge
          ? `${enrichedHistory}\n\n— RELEVANT PLATFORM KNOWLEDGE (use if applicable) —\n${compactKnowledge}`
          : enrichedHistory;
        if (genKnowledgeChunks.length > 0) {
          this.logger.log(`📚 General knowledge enriched with ${genKnowledgeChunks.length} semantic chunks`);
        }
        const answer = await this.oriIntelligence.answerAnyQuestion(resolvedQuestion, userProfile, genRagContext, userRole);
        return {
          answer,
          searchType: genKnowledgeChunks.length > 0 ? 'semantic_enriched' : 'intelligent_response',
          confidence: 0.9,
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: EXECUTE QUERY WITH RBAC (only for specific data queries)
      // ═══════════════════════════════════════════════════════════════

      // ── Anonymous / unauthenticated user check ──
      // If user id is 0 AND no email is available, they are truly anonymous.
      // Users with email from Cognito can still use email-based DB lookups.
      if ((!user || (user.id === 0 && !user.email && !user.sub)) && (user?.role === 'STUDENT' || !user?.role)) {
        this.logger.log('🔒 RBAC: Anonymous user detected — prompting to log in');
        return {
          answer: 'Welcome to Ask BI. To access your personalized data and results, please log in first. If you have any general career questions, feel free to ask.',
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

      // ── Inject gender filter for count queries ──
      if (interpretation.intent === 'count') {
        const qLow = (resolvedQuestion || question).toLowerCase();
        const hasMale = /\b(male|boys?|men)\b/.test(qLow);
        const hasFemale = /\b(female|girls?|women)\b/.test(qLow);
        if (hasMale && hasFemale) {
          // Both genders requested → gender breakdown
          (interpretation as any).genderBreakdown = true;
          interpretation.table = 'registrations'; // force registrations table
        } else if (hasMale) {
          (interpretation as any).gender = 'MALE';
        } else if (hasFemale) {
          (interpretation as any).gender = 'FEMALE';
        }
      }

      // ── First, get total count for pagination ──
      const totalCount = await this.getTotalCount(interpretation, user as UserContext);

      const data = await this.executeQuery(interpretation, user as UserContext, 0);
      this.logger.log(`📊 Results: ${data.length} rows (total: ${totalCount})`);

      // ── Store pagination state for "next 10" follow-ups ──
      if (['list_users', 'list_candidates', 'test_results', 'best_performer', 'career_roles', 'corporate_details', 'affiliate_referrals', 'affiliate_payments', 'affiliate_list', 'affiliate_earnings', 'affiliate_students'].includes(interpretation.intent)) {
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

      // If no data found, provide a helpful response based on intent
      if (data.length === 0) {
        this.logger.log('🧠 No data found for intent: ' + interpretation.intent);

        const curRole = (user?.role || 'STUDENT').toUpperCase();
        const scopeMsg = curRole === 'CORPORATE' ? ' in your organization' : '';

        // ═══════════════════════════════════════════════════════════
        // DB-BOUND INTENTS: Return clear "no data" — NEVER use LLM
        // This prevents generic web-like responses for DB queries
        // ═══════════════════════════════════════════════════════════
        const dbBoundIntents = [
          'list_users', 'list_candidates', 'test_results', 'best_performer',
          'person_lookup', 'self_results', 'career_roles', 'count', 'count_by_role',
          'corporate_details', 'data_query',
          'affiliate_dashboard', 'affiliate_referrals', 'affiliate_earnings',
          'affiliate_payments', 'affiliate_list', 'affiliate_lookup',
          'affiliate_students',
        ];

        if (dbBoundIntents.includes(interpretation.intent)) {
          // Specific messages per intent
          const noDataMessages: Record<string, string> = {
            person_lookup: BI_PERSONA.errors.notFound(interpretation.searchTerm || 'that person'),
            self_results: `You don't have any completed assessments yet. Complete an assessment to see your results here.`,
            list_candidates: `No users found${scopeMsg}.`,
            list_users: `No users found.`,
            test_results: `No completed assessment results found${scopeMsg}.`,
            best_performer: `No candidates or completed assessments found${scopeMsg}.`,
            career_roles: `No career roles found.`,
            count: `**Total: 0**`,
            count_by_role: `No accounts found.`,
            corporate_details: `No corporate accounts found${scopeMsg}.`,
            data_query: this.getContextualNoDataMessage(question, scopeMsg),
          };

          const answer = noDataMessages[interpretation.intent]
            || `No data found for this query${scopeMsg}.`;

          return {
            answer,
            searchType: interpretation.intent,
            confidence: 0.8,
          };
        }

        // Only use LLM fallback for genuinely non-DB intents (career_guidance, etc.)
        // Even here, check that the question isn't about platform entities or candidate data
        const platformEntityCheck = /\b(companies|corporates?|company|candidates?|students?|users?|employees?|resources?|assessments?|scores?|results?|affiliates?|registrations?)\b/i;
        const candidateDataCheck = /\b(education|qualification|degree|department|designation|salary|gender|age|email|mobile|phone|contact|address|experience|marks|board|stream)\b/i;
        if (platformEntityCheck.test(question) || (candidateDataCheck.test(question) && conversationHistory && /\b(candidate|employee|resource|people|person|staff|male|female)\b/i.test(conversationHistory))) {
          // Platform data question — return DB-only message, don't use LLM
          return {
            answer: `No users found for that request.`,
            searchType: 'data_guard_no_results',
            confidence: 0.7,
          };
        }
        const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
        const answer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, conversationHistory, userRole);
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

      // ═══════════════════════════════════════════════════════════
      // LAST RESORT: Try Text-to-SQL when the standard pipeline fails
      // This catches edge cases the intent classifier missed
      // ═══════════════════════════════════════════════════════════
      try {
        this.logger.log('🔄 Standard pipeline failed — trying Text-to-SQL fallback...');
        const tsResult = await this.textToSqlService.answerQuestion(
          question, user as UserContext, '',
        );
        if (tsResult.confidence > 0.5) {
          return {
            answer: tsResult.answer,
            searchType: 'text_to_sql_fallback',
            confidence: tsResult.confidence,
            sources: { rows: tsResult.rowCount },
          };
        }
      } catch (tsError) {
        this.logger.warn(`Text-to-SQL fallback also failed: ${tsError.message}`);
      }

      // ═══════════════════════════════════════════════════════════
      // GRACEFUL FALLBACK: Only use LLM for genuinely non-data questions
      // Platform data queries MUST NOT fall back to LLM general knowledge
      // ═══════════════════════════════════════════════════════════
      const platformEntityPattern = /\b(companies|corporates?|company|candidates?|students?|users?|employees?|resources?|assessments?|scores?|results?|affiliates?|registrations?)\b/i;
      const isDataRelatedQuery = platformEntityPattern.test(question) || this.textToSqlService.isDataQuestion(question);

      if (!isDataRelatedQuery) {
        try {
          this.logger.log('🧠 Non-data query — trying LLM general knowledge fallback...');
          const userId = user?.id || 0;
          const userEmail = user?.email || '';
          const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);
          const llmAnswer = await this.oriIntelligence.answerAnyQuestion(question, userProfile, '', (user?.role || 'STUDENT').toUpperCase());
          if (llmAnswer && !llmAnswer.includes('experiencing high demand')) {
            return {
              answer: llmAnswer,
              searchType: 'llm_fallback',
              confidence: 0.7,
            };
          }
        } catch (llmError) {
          this.logger.warn(`LLM fallback also failed: ${llmError.message}`);
        }
      } else {
        this.logger.log('🛡️ DATA GUARD: Skipping LLM fallback for data-related query to prevent web/general data leakage');
      }

      // ── Role-aware error message as absolute last resort ──
      const userRole = user?.role || 'STUDENT';
      const roleSuggestions: Record<string, string> = {
        ADMIN: 'You can try: **"list candidates"**, **"show top performers"**, **"how many users registered this month"**, or **"find candidates for [role]"**.',
        CORPORATE: 'You can try: **"show my employees"**, **"best performers in my team"**, **"how many candidates completed"**, or ask any career-related question.',
        STUDENT: 'You can try: **"show my results"**, **"what careers suit me"**, **"generate my career report"**, or ask any career or tech question.',
        AFFILIATE: 'You can try: **"my referrals"**, **"my earnings"**, **"affiliate dashboard"**, or ask any general question.',
      };
      const suggestion = roleSuggestions[userRole] || roleSuggestions.STUDENT;

      return {
        answer: `I couldn't process that request right now. ${suggestion}\n\nYou can also ask me general questions about careers, technologies, skills, or interview preparation — I'm happy to help!`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH / GROUP / PROGRAM HANDLER — dedicated handler for group analytics
  // Generates targeted SQL directly without relying on generic text-to-sql
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleBatchGroupQuery(
    question: string,
    user?: any,
  ): Promise<QueryResult> {
    const userRole = (user?.role || 'STUDENT').toUpperCase();
    const corporateId = user?.corporateId;
    const q = question.toLowerCase();

    // ── Extract group/batch/program name ──
    let searchName: string | null = null;
    // 1) Parenthesized name: (KIOTstudents) or (KIOTstudents  — handle missing close paren
    const parenMatch = question.match(/\(([^)]+)\)?/);
    if (parenMatch) searchName = parenMatch[1].trim();
    // 2) After "batch" / "group": summarize batch KIOTstudents
    if (!searchName) {
      const afterBatch = question.match(/\b(?:batch|group)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+(?:\s+[A-Za-z0-9_\-]+)*)["']?/i);
      if (afterBatch) {
        let n = afterBatch[1].replace(/\b(summary|summarize|report|strengths|risks|readiness|overview|stats|statistics|performance|analysis|details?|info|candidates?|list|show|all|get|display)\b/gi, '').trim();
        if (n.length >= 2) searchName = n;
      }
    }
    // 3) "for [program/group name]": Generate report for School Students Program
    if (!searchName) {
      const forMatch = question.match(/\bfor\s+(.+?)(?:\s*$|\s*\?)/i);
      if (forMatch) {
        let pn = forMatch[1].replace(/\b(program|report|summary|version|principal|generate|no\s+disc\s+naming|batch|group)\b/gi, '').trim();
        if (pn.length >= 2) searchName = pn;
      }
    }
    // 4) "program [name]" or "[Name] Program" 
    if (!searchName) {
      const progMatch = question.match(/\bprogram\s+["']?(.+?)["']?\s*(?:$|\?|summary|report)/i);
      if (progMatch) {
        let pn = progMatch[1].replace(/\b(report|summary|version|principal|generate)\b/gi, '').trim();
        if (pn.length >= 2) searchName = pn;
      }
    }
    // 5) Full program name like "School Students Program"
    if (!searchName) {
      const fullProgMatch = question.match(/["']?([A-Z][A-Za-z\s]+Program)["']?/i);
      if (fullProgMatch) searchName = fullProgMatch[1].trim();
    }
    // 6) "[name] count" or "[name] total" — e.g. "kiot aids count", "kiot it total"
    if (!searchName) {
      const countMatch = question.match(/^(.+?)\s+(?:count|total)\s*$/i);
      if (countMatch) {
        let n = countMatch[1]
          .replace(/\b(how|many|total|number|of|the|a|an|candidates?|students?|users?)\b/gi, '')
          .trim();
        if (n.length >= 2) searchName = n;
      }
    }

    this.logger.log(`📊 handleBatchGroupQuery: question="${question}", searchName="${searchName}", role=${userRole}`);

    // ── Determine if this is about a program or a group/batch ──
    const isProgramQuery = /\bprogram\b/i.test(q) || /\b(principal|version|disc\s+naming)\b/i.test(q);
    const isListQuery = /\b(list|show|all|get|display)\b/i.test(q) && !searchName;
    // Count-only query (no full summary needed) — e.g. "kiot aids count"
    const isCountOnlyQuery = /\b(count|total)\s*$/i.test(q) && !/\b(summarize|summary|overview|analyze|report|stats|performance|strengths|risks|readiness)\b/i.test(q);

    try {
      // ═══ LIST ALL GROUPS ═══
      if (isListQuery && !isProgramQuery) {
        const params: any[] = [];
        let listSql = `
          SELECT g.name AS group_name, g.code AS group_code,
            COUNT(DISTINCT r.id) AS total_candidates,
            COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed,
            g.is_active, g.created_at
          FROM groups g
          LEFT JOIN registrations r ON r.group_id = g.id AND r.is_deleted = false
          LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
          WHERE g.is_deleted = false`;
        if (userRole === 'CORPORATE' && corporateId) {
          listSql += ` AND g.corporate_account_id = $1`;
          params.push(corporateId);
        }
        listSql += ` GROUP BY g.id, g.name, g.code, g.is_active, g.created_at ORDER BY g.created_at DESC LIMIT 50`;

        const rows = await this.dataSource.query(listSql, params);
        if (!rows || rows.length === 0) {
          return { answer: 'No groups/batches found in the system.', searchType: 'batch_group_query', confidence: 0.8 };
        }
        let table = '| Group Name | Code | Total Candidates | Completed | Active | Created |\n';
        table += '| --- | --- | --- | --- | --- | --- |\n';
        for (const r of rows) {
          table += `| ${r.group_name} | ${r.group_code || '-'} | ${r.total_candidates} | ${r.completed} | ${r.is_active ? 'Yes' : 'No'} | ${new Date(r.created_at).toLocaleDateString()} |\n`;
        }
        return { answer: `**📋 All Groups/Batches (${rows.length})**\n\n${table}`, searchType: 'batch_group_query', confidence: 0.95 };
      }

      // ═══ LIST ALL PROGRAMS ═══
      if (isListQuery && isProgramQuery) {
        const rows = await this.dataSource.query(`
          SELECT p.name AS program_name, p.code AS program_code, p.description,
            COUNT(DISTINCT r.id) AS total_registrations,
            COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed
          FROM programs p
          LEFT JOIN registrations r ON r.program_id = p.id AND r.is_deleted = false
          LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
          WHERE p.is_active = true
          GROUP BY p.id, p.name, p.code, p.description
          ORDER BY total_registrations DESC LIMIT 50`);
        if (!rows || rows.length === 0) {
          return { answer: 'No active programs found in the system.', searchType: 'batch_group_query', confidence: 0.8 };
        }
        let table = '| Program Name | Code | Description | Registrations | Completed |\n';
        table += '| --- | --- | --- | --- | --- |\n';
        for (const r of rows) {
          table += `| ${r.program_name} | ${r.program_code || '-'} | ${(r.description || '-').substring(0, 60)} | ${r.total_registrations} | ${r.completed} |\n`;
        }
        return { answer: `**📋 All Programs (${rows.length})**\n\n${table}`, searchType: 'batch_group_query', confidence: 0.95 };
      }

      // ═══ PROGRAM SUMMARY ═══
      if (isProgramQuery && searchName) {
        // Find matching program
        const programs = await this.dataSource.query(
          `SELECT id, name, code, description, assessment_title, report_title FROM programs WHERE name ILIKE $1 AND is_active = true LIMIT 5`,
          [`%${searchName}%`]
        );
        if (!programs || programs.length === 0) {
          // Try broader search
          const words = searchName.split(/\s+/).filter(w => w.length >= 3);
          let found: any[] = [];
          for (const word of words) {
            found = await this.dataSource.query(
              `SELECT id, name, code, description FROM programs WHERE name ILIKE $1 AND is_active = true LIMIT 5`,
              [`%${word}%`]
            );
            if (found.length > 0) break;
          }
          if (found.length === 0) {
            return {
              answer: `No program found matching **"${searchName}"**. Try **"list programs"** to see all available programs.`,
              searchType: 'batch_group_query', confidence: 0.7,
            };
          }
          // Found via broader search
          programs.push(...found);
        }
        const prog = programs[0];

        // Stats
        const statsParams: any[] = [prog.id];
        let regRbac = '';
        if (userRole === 'CORPORATE' && corporateId) {
          regRbac = ` AND r.corporate_account_id = $2`;
          statsParams.push(corporateId);
        }
        const stats = await this.dataSource.query(`
          SELECT
            COUNT(DISTINCT r.id) AS total_registrations,
            COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed_assessments,
            COUNT(DISTINCT CASE WHEN aa.status = 'NOT_STARTED' OR aa.status IS NULL THEN r.id END) AS not_started,
            ROUND(AVG(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END), 1) AS avg_score,
            MAX(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS highest_score,
            MIN(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS lowest_score,
            COUNT(DISTINCT CASE WHEN r.gender = 'MALE' THEN r.id END) AS male_count,
            COUNT(DISTINCT CASE WHEN r.gender = 'FEMALE' THEN r.id END) AS female_count
          FROM registrations r
          LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
          WHERE r.program_id = $1 AND r.is_deleted = false${regRbac}`, statsParams);

        // Personality distribution
        const traitParams: any[] = [prog.id];
        let traitRbac = '';
        if (userRole === 'CORPORATE' && corporateId) {
          traitRbac = ` AND r.corporate_account_id = $2`;
          traitParams.push(corporateId);
        }
        const traits = await this.dataSource.query(`
          SELECT pt.blended_style_name AS personality_type, COUNT(*) AS count,
            ROUND(AVG(aa.total_score), 1) AS avg_score
          FROM registrations r
          JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
          LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
          WHERE r.program_id = $1 AND r.is_deleted = false${traitRbac}
          GROUP BY pt.id, pt.blended_style_name ORDER BY count DESC`, traitParams);

        const s = stats[0] || {};
        const totalReg = parseInt(s.total_registrations) || 0;
        const completed = parseInt(s.completed_assessments) || 0;
        const notStarted = parseInt(s.not_started) || 0;
        const readinessRate = totalReg > 0 ? Math.round((completed / totalReg) * 100) : 0;

        let response = `## 📊 Program Summary: ${prog.name}\n\n`;
        if (prog.description) response += `> ${prog.description}\n\n`;
        response += `### 📈 Key Metrics\n`;
        response += `- **Total Registrations**: ${totalReg}\n`;
        response += `- **Completed Assessments**: ${completed}\n`;
        response += `- **Not Started / Pending**: ${notStarted}\n`;
        response += `- **Readiness Rate**: ${readinessRate}%\n`;
        if (s.avg_score) response += `- **Average Score**: ${s.avg_score}\n`;
        if (s.highest_score) response += `- **Highest Score**: ${s.highest_score}\n`;
        if (s.lowest_score) response += `- **Lowest Score**: ${s.lowest_score}\n`;
        response += `- **Gender**: ${s.male_count || 0} Male, ${s.female_count || 0} Female\n\n`;

        if (traits.length > 0) {
          response += `### 🧠 Personality Distribution\n`;
          response += `| Personality Type | Count | Avg Score |\n| --- | --- | --- |\n`;
          for (const t of traits) {
            response += `| ${t.personality_type || 'Unknown'} | ${t.count} | ${t.avg_score || '-'} |\n`;
          }
          response += '\n';
        }

        if (notStarted > 0 || readinessRate < 50) {
          response += `### ⚠️ Risks\n`;
          if (notStarted > 0) response += `- **${notStarted}** candidates have not started their assessment yet\n`;
          if (readinessRate < 50) response += `- Readiness rate is below 50% — consider follow-up\n`;
          response += '\n';
        }

        return { answer: response, searchType: 'batch_group_query', confidence: 0.95 };
      }

      // ═══ GROUP/BATCH SUMMARY ═══
      if (!isProgramQuery || searchName) {
        // Find the group
        let groupRows: any[];
        if (searchName) {
          const groupParams: any[] = [`%${searchName}%`];
          let groupRbac = '';
          if (userRole === 'CORPORATE' && corporateId) {
            groupRbac = ` AND corporate_account_id = $2`;
            groupParams.push(corporateId);
          }
          groupRows = await this.dataSource.query(
            `SELECT id, name, code, corporate_account_id FROM groups WHERE (name ILIKE $1 OR code ILIKE $1) AND is_deleted = false${groupRbac} LIMIT 5`,
            groupParams,
          );
          // If no match, try broader word-by-word search
          if ((!groupRows || groupRows.length === 0) && searchName.length >= 3) {
            const words = searchName.split(/\s+/).filter(w => w.length >= 3);
            for (const word of words) {
              const wParams: any[] = [`%${word}%`];
              let wRbac = '';
              if (userRole === 'CORPORATE' && corporateId) {
                wRbac = ` AND corporate_account_id = $2`;
                wParams.push(corporateId);
              }
              groupRows = await this.dataSource.query(
                `SELECT id, name, code, corporate_account_id FROM groups WHERE (name ILIKE $1 OR code ILIKE $1) AND is_deleted = false${wRbac} LIMIT 5`,
                wParams,
              );
              if (groupRows && groupRows.length > 0) break;
            }
          }
        } else {
          // No name — summarize all groups
          const allParams: any[] = [];
          let allRbac = '';
          if (userRole === 'CORPORATE' && corporateId) {
            allRbac = ` AND corporate_account_id = $1`;
            allParams.push(corporateId);
          }
          groupRows = await this.dataSource.query(
            `SELECT id, name, code, corporate_account_id FROM groups WHERE is_deleted = false${allRbac} LIMIT 20`,
            allParams,
          );
        }

        if (!groupRows || groupRows.length === 0) {
          return {
            answer: searchName
              ? `No group/batch found matching **"${searchName}"**. Try **"list groups"** to see all available groups/batches.`
              : `No groups/batches found in the system.`,
            searchType: 'batch_group_query', confidence: 0.7,
          };
        }

        // ── COUNT-ONLY shortcut: just return the candidate count for the matched group ──
        if (isCountOnlyQuery && searchName && groupRows.length > 0) {
          const group = groupRows[0];
          const cParams: any[] = [group.id];
          let cRbac = '';
          if (userRole === 'CORPORATE' && corporateId) {
            cRbac = ` AND r.corporate_account_id = $2`;
            cParams.push(corporateId);
          }
          const cRows = await this.dataSource.query(
            `SELECT COUNT(DISTINCT r.id) AS total_candidates FROM registrations r WHERE r.group_id = $1 AND r.is_deleted = false${cRbac}`,
            cParams,
          );
          const total = parseInt(cRows[0]?.total_candidates) || 0;
          return {
            answer: `**${group.name}** has **${total} candidates** registered.`,
            searchType: 'batch_group_query',
            confidence: 0.95,
          };
        }

        // Build summary for each matching group
        const summaries: string[] = [];
        for (const group of groupRows.slice(0, 5)) {
          const gParams: any[] = [group.id];
          let regRbac = '';
          if (userRole === 'CORPORATE' && corporateId) {
            regRbac = ` AND r.corporate_account_id = $2`;
            gParams.push(corporateId);
          }

          // Stats
          const stats = await this.dataSource.query(`
            SELECT
              COUNT(DISTINCT r.id) AS total_candidates,
              COUNT(DISTINCT CASE WHEN aa.status = 'COMPLETED' THEN aa.id END) AS completed,
              COUNT(DISTINCT CASE WHEN aa.status = 'NOT_STARTED' OR aa.status IS NULL THEN r.id END) AS not_started,
              ROUND(AVG(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END), 1) AS avg_score,
              MAX(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS highest_score,
              MIN(CASE WHEN aa.status = 'COMPLETED' THEN aa.total_score END) AS lowest_score,
              COUNT(DISTINCT CASE WHEN r.gender = 'MALE' THEN r.id END) AS male_count,
              COUNT(DISTINCT CASE WHEN r.gender = 'FEMALE' THEN r.id END) AS female_count
            FROM registrations r
            LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
            WHERE r.group_id = $1 AND r.is_deleted = false${regRbac}`, gParams);

          // Personality distribution
          const traits = await this.dataSource.query(`
            SELECT pt.blended_style_name AS personality_type, COUNT(*) AS count,
              ROUND(AVG(aa.total_score), 1) AS avg_score
            FROM registrations r
            JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE r.group_id = $1 AND r.is_deleted = false${regRbac}
            GROUP BY pt.id, pt.blended_style_name ORDER BY count DESC`, gParams);

          // Assigned programs via group_assessments
          const programs = await this.dataSource.query(`
            SELECT p.name AS program_name, ga.total_candidates, ga.status
            FROM group_assessments ga
            JOIN programs p ON ga.program_id = p.id
            WHERE ga.group_id = $1
            ORDER BY ga.created_at DESC LIMIT 10`, [group.id]);

          const s = stats[0] || {};
          const totalCand = parseInt(s.total_candidates) || 0;
          const completed = parseInt(s.completed) || 0;
          const notStarted = parseInt(s.not_started) || 0;
          const readinessRate = totalCand > 0 ? Math.round((completed / totalCand) * 100) : 0;

          let summary = `## 📊 Batch/Group: ${group.name}${group.code ? ` (${group.code})` : ''}\n\n`;
          summary += `### 📈 Key Metrics\n`;
          summary += `- **Total Candidates**: ${totalCand}\n`;
          summary += `- **Completed Assessments**: ${completed}\n`;
          summary += `- **Not Started / Pending**: ${notStarted}\n`;
          summary += `- **Readiness Rate**: ${readinessRate}%\n`;
          if (s.avg_score) summary += `- **Average Score**: ${s.avg_score}\n`;
          if (s.highest_score) summary += `- **Highest Score**: ${s.highest_score}\n`;
          if (s.lowest_score) summary += `- **Lowest Score**: ${s.lowest_score}\n`;
          summary += `- **Gender**: ${s.male_count || 0} Male, ${s.female_count || 0} Female\n\n`;

          // Strengths (personality distribution)
          if (traits.length > 0) {
            summary += `### 🧠 Strengths (Personality Distribution)\n`;
            summary += `| Personality Type | Count | Avg Score |\n| --- | --- | --- |\n`;
            for (const t of traits) {
              summary += `| ${t.personality_type || 'Unknown'} | ${t.count} | ${t.avg_score || '-'} |\n`;
            }
            summary += '\n';
          }

          // Readiness levels
          summary += `### 🎯 Readiness Levels\n`;
          if (readinessRate >= 80) summary += `- 🟢 **High Readiness** (${readinessRate}% completion rate)\n`;
          else if (readinessRate >= 50) summary += `- 🟡 **Moderate Readiness** (${readinessRate}% completion rate)\n`;
          else summary += `- 🔴 **Low Readiness** (${readinessRate}% completion rate) — immediate attention needed\n`;
          summary += '\n';

          // Risks
          const risks: string[] = [];
          if (notStarted > 0) risks.push(`**${notStarted}** candidates have not started their assessment`);
          if (readinessRate < 50) risks.push(`Readiness rate is critically low at ${readinessRate}%`);
          if (totalCand === 0) risks.push('No candidates registered in this batch');
          if (s.lowest_score && parseFloat(s.lowest_score) < 30) risks.push(`Lowest score is ${s.lowest_score} — some candidates may need support`);
          if (risks.length > 0) {
            summary += `### ⚠️ Risks\n`;
            for (const risk of risks) summary += `- ${risk}\n`;
            summary += '\n';
          }

          // Assigned programs
          if (programs.length > 0) {
            summary += `### 📚 Assigned Programs\n`;
            for (const p of programs) {
              summary += `- **${p.program_name}** — ${p.total_candidates || 0} candidates, status: ${p.status || 'N/A'}\n`;
            }
            summary += '\n';
          }

          summaries.push(summary);
        }

        return {
          answer: summaries.join('\n---\n\n'),
          searchType: 'batch_group_query',
          confidence: 0.95,
        };
      }

      // ═══ FALLBACK: Route to text-to-sql for anything else ═══
      this.logger.log('📊 Batch/group query — falling back to Text-to-SQL');
      const tsResult = await this.textToSqlService.answerQuestion(
        question, user as any, '',
      );
      return {
        answer: tsResult.answer,
        searchType: tsResult.searchType,
        confidence: tsResult.confidence,
      };
    } catch (error) {
      this.logger.error(`❌ handleBatchGroupQuery failed: ${error.message}`, error.stack);
      return {
        answer: `I encountered an issue querying batch/group data. Please try rephrasing your question.\n\nExamples:\n- **"list groups"** — see all batches\n- **"summarize batch KIOTstudents"** — get batch summary\n- **"list programs"** — see all programs`,
        searchType: 'batch_group_query',
        confidence: 0.4,
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
      if (userRole === 'STUDENT') {
        let selfData: any[] = [];
        // Try user_id first (if available and valid)
        if (userId && userId > 0) {
          selfData = await this.executeDatabaseQuery(
            `SELECT r.full_name FROM registrations r WHERE r.user_id = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
            [userId]
          );
        }
        // Fallback: use email from Cognito token when userId is 0 or lookup failed
        if (selfData.length === 0 && (user?.email || user?.sub)) {
          const email = user?.email || user?.sub;
          this.logger.log(`📋 userId=${userId} lookup failed, trying email fallback: ${email}`);
          selfData = await this.executeDatabaseQuery(
            `SELECT r.full_name FROM registrations r JOIN users u ON r.user_id = u.id WHERE u.email = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
            [email]
          );
        }
        if (selfData.length > 0) {
          searchTerm = selfData[0].full_name;
          this.logger.log(`📋 Student auto-generating career report for self: ${searchTerm}`);
        } else {
          return {
            answer: `I couldn't find your registration data. Please make sure you've completed your profile and assessment.`,
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
        // Smart name matching with word-boundary precision:
        // 1. Use PostgreSQL regex \m (word start) and \M (word end) for exact word matching
        // 2. This prevents "jai" from matching "JAISHREE" (substring match was too broad)
        // 3. Falls back to ILIKE if word-boundary match returns 0 results (handled below)
        whereParts.push(`(r.full_name ~* $${paramIndex})`);
        params.push(`\\m${nameSearch}\\M`);
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

      const careerReportSql = `
                SELECT 
                    r.id,
                    r.full_name,
                    r.gender,
                    r.mobile_number,
                    r.school_level,
                    r.school_stream,
                    r.student_board,
                    r.registration_source,
                    u.email,
                    aa.total_score,
                    aa.sincerity_index,
                    pt.blended_style_name as behavioral_style,
                    pt.blended_style_desc as behavior_description,
                    p.name as program_name,
                    g.name as group_name,
                    dep.name as department_name,
                    dt.name as degree_name,
                    ca.company_name,
                    (SELECT MAX(aa2.total_score) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id) as best_score,
                    (SELECT COUNT(*) FROM assessment_attempts aa3 WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count
                FROM registrations r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id 
                    AND aa.id = (SELECT id FROM assessment_attempts WHERE registration_id = r.id ORDER BY completed_at DESC LIMIT 1)
                LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
                LEFT JOIN programs p ON COALESCE(aa.program_id, r.program_id) = p.id
                LEFT JOIN groups g ON r.group_id = g.id
                LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
                LEFT JOIN departments dep ON dd.department_id = dep.id
                LEFT JOIN degree_types dt ON dd.degree_type_id = dt.id
                LEFT JOIN corporate_accounts ca ON r.corporate_account_id = ca.id
                WHERE (${whereClause})
                AND r.is_deleted = false${rbacFilter}
                ORDER BY r.id, aa.total_score DESC NULLS LAST
                LIMIT 10`;

      let personData = await this.dataSource.query(careerReportSql, params);

      // Fallback: if word-boundary match returned 0 and we used ~*, try ILIKE fuzzy match
      let usedCareerILIKEFallback = false;
      if (!personData.length && !emailSearch) {
        this.logger.log(`🔄 Word-boundary match for "${nameSearch}" returned 0, falling back to ILIKE`);
        usedCareerILIKEFallback = true;
        const fallbackParams: any[] = [`%${nameSearch}%`];
        let fallbackRbac = '';
        if (userRole === 'CORPORATE' && corporateId) {
          fallbackRbac = ` AND r.corporate_account_id = $2`;
          fallbackParams.push(corporateId);
        } else if (userRole === 'STUDENT' && userId) {
          fallbackRbac = ` AND r.user_id = $2`;
          fallbackParams.push(userId);
        }
        personData = await this.dataSource.query(`
                SELECT 
                    r.id, r.full_name, r.gender, r.mobile_number,
                    r.school_level, r.school_stream, r.student_board, r.registration_source,
                    u.email,
                    aa.total_score, aa.sincerity_index,
                    pt.blended_style_name as behavioral_style,
                    pt.blended_style_desc as behavior_description,
                    p.name as program_name,
                    g.name as group_name,
                    dep.name as department_name,
                    dt.name as degree_name,
                    ca.company_name,
                    (SELECT MAX(aa2.total_score) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id) as best_score,
                    (SELECT COUNT(*) FROM assessment_attempts aa3 WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count
                FROM registrations r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id 
                    AND aa.id = (SELECT id FROM assessment_attempts WHERE registration_id = r.id ORDER BY completed_at DESC LIMIT 1)
                LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
                LEFT JOIN programs p ON COALESCE(aa.program_id, r.program_id) = p.id
                LEFT JOIN groups g ON r.group_id = g.id
                LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
                LEFT JOIN departments dep ON dd.department_id = dep.id
                LEFT JOIN degree_types dt ON dd.degree_type_id = dt.id
                LEFT JOIN corporate_accounts ca ON r.corporate_account_id = ca.id
                WHERE r.full_name ILIKE $1 AND r.is_deleted = false${fallbackRbac}
                ORDER BY r.id, aa.total_score DESC NULLS LAST
                LIMIT 10`, fallbackParams);
      }

      if (!personData.length) {
        const scopeMsg = userRole === 'CORPORATE' ? ' within your organization' : '';
        return {
          answer: `**"${cleanSearchTerm}" not found${scopeMsg}.** Check the spelling or try "list candidates".`,
          searchType: 'career_report',
          confidence: 0.3,
        };
      }

      // If ILIKE fallback was used, verify exact word-token match
      // Prevents "jai" from auto-matching "JAISHREE M" — shows "did you mean?" instead
      if (usedCareerILIKEFallback && !numberMatch && !this.hasExactTokenMatch(nameSearch, personData)) {
        this.logger.log(`⚠️ Career report: ILIKE matched but no exact token for "${nameSearch}" — showing fuzzy disambiguation`);
        return this.buildFuzzyDisambiguation(nameSearch, personData, 'career_report');
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
          handler: 'career_report',
          options: personData.slice(0, 10).map((p: any) => p.full_name),
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

      // ── Build smart ProfileInput based on actual student data ──
      const isStudent = !person.company_name; // No corporate = student
      const schoolInfo = [person.school_level, person.school_stream, person.student_board].filter(Boolean).join(' / ');
      const deptInfo = [person.degree_name, person.department_name].filter(Boolean).join(' — ');
      const currentRole = isStudent
        ? (deptInfo ? `Student (${deptInfo})` : (schoolInfo ? `Student (${schoolInfo})` : 'Student'))
        : (person.company_name ? `Employee at ${person.company_name}` : 'Assessment Candidate');
      const currentIndustry = isStudent
        ? (person.department_name || 'Education / Academics')
        : (person.company_name || 'Professional');

      // Generate the full Career Fitment Report
      const report = await this.futureRoleReportService.generateReport({
        name: person.full_name || searchTerm,
        currentRole,
        currentJobDescription: isStudent
          ? `Pursuing ${deptInfo || schoolInfo || 'academics'}. Completed behavioral and skill assessments.`
          : `Working at ${person.company_name || 'organization'}. Completed behavioral and skill assessments.`,
        yearsOfExperience: isStudent ? 0 : 0,
        relevantExperience: isStudent ? '' : '',
        currentIndustry,
        expectedFutureRole: '',
        behavioralStyle: person.behavioral_style || undefined,
        behavioralDescription: person.behavior_description || undefined,
        agileScore: scoreToUse ? parseFloat(scoreToUse) : undefined,
        totalScore: scoreToUse ? parseFloat(scoreToUse) : undefined,
        sincerityIndex: person.sincerity_index ? parseFloat(person.sincerity_index) : undefined,
        programName: person.program_name || undefined,
        groupName: person.group_name || undefined,
        gender: person.gender || undefined,
        attemptCount: person.attempt_count ? parseInt(person.attempt_count) : undefined,
      } as any);

      return {
        answer: report.fullReportText,
        searchType: 'career_report',
        reportId: report.reportId,
        confidence: 0.95,
      };
    } catch (error) {
      this.logger.error(`Career report error: ${error.message}`);
      return {
        answer: `**I couldn't generate the career report right now.** ${this.sanitizeErrorForUser(error)}\n\n💡 Try: "list candidates" to find the right person first.`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: PERSON LOOKUP (with smart matching + disambiguation)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handlePersonLookup(
    searchTerm: string,
    user?: any,
  ): Promise<QueryResult> {
    const userRole = user?.role || 'STUDENT';
    const corporateId = user?.corporateId;
    const userId = user?.id;

    // Check for disambiguation number (e.g., "jai #2" or bare "2")
    const numberMatch = searchTerm.match(/(.+?)\s*[#]?\s*(\d+)$/);
    let targetIndex = -1;
    let cleanSearch = searchTerm;
    if (numberMatch && numberMatch[1].trim().length > 0) {
      cleanSearch = numberMatch[1].trim();
      targetIndex = parseInt(numberMatch[2]) - 1; // 0-based
    }

    try {
      // ── Step 1: Smart name search (word-boundary first, ILIKE fallback) ──
      // Build RBAC filter with parameterized query for security
      let rbacFilterClause = '';
      const extraParams: any[] = [];
      if (userRole === 'CORPORATE' && corporateId) {
        rbacFilterClause = ' AND r.corporate_account_id = $2';
        extraParams.push(corporateId);
      } else if (userRole === 'STUDENT' && userId) {
        rbacFilterClause = ' AND r.user_id = $2';
        extraParams.push(userId);
      }

      const sincerityFields = this.getSinceritySelectFields('aa');
      const lookupSql = (whereNameClause: string) => `
        SELECT 
          r.id as reg_id,
          r.full_name,
          r.gender,
          r.mobile_number,
          u.email,
          aa.total_score,
          ${sincerityFields},
          aa.status,
          aa.completed_at,
          pt.blended_style_name as behavioral_style,
          pt.blended_style_desc as behavior_description,
          p.name as program_name,
          (SELECT MAX(aa2.total_score) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id AND aa2.status = 'COMPLETED') as best_score,
          (SELECT COUNT(*) FROM assessment_attempts aa3 WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count
        FROM registrations r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
        LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
        LEFT JOIN programs p ON aa.program_id = p.id
        WHERE r.is_deleted = false AND ${whereNameClause}${rbacFilterClause}
        ORDER BY r.full_name, aa.completed_at DESC NULLS LAST
        LIMIT 20`;

      // Try word-boundary match first
      let data = await this.executeDatabaseQuery(
        lookupSql(`r.full_name ~* $1`),
        [`\\m${cleanSearch}\\M`, ...extraParams],
      );

      // Fallback to ILIKE if no results
      let usedLookupILIKEFallback = false;
      if (data.length === 0) {
        this.logger.log(`🔄 person_lookup: word-boundary for "${cleanSearch}" → 0, trying ILIKE`);
        usedLookupILIKEFallback = true;
        data = await this.executeDatabaseQuery(
          lookupSql(`r.full_name ILIKE $1`),
          [`%${cleanSearch}%`, ...extraParams],
        );
      }

      if (data.length === 0) {
        const scopeMsg = userRole === 'CORPORATE' ? ' within your organization' : '';
        return {
          answer: `**"${cleanSearch}" not found${scopeMsg}.** Check the spelling or try "list candidates".`,
          searchType: 'person_not_found',
          confidence: 0.7,
        };
      }

      // If ILIKE fallback was used, verify exact word-token match
      // Prevents "jai" from auto-matching "JAISHREE M" — shows "did you mean?" instead
      if (usedLookupILIKEFallback && targetIndex < 0 && !this.hasExactTokenMatch(cleanSearch, data)) {
        this.logger.log(`⚠️ Person lookup: ILIKE matched but no exact token for "${cleanSearch}" — showing fuzzy disambiguation`);
        // Deduplicate by full_name for the disambiguation prompt
        const seen = new Set<string>();
        const uniqueForPrompt = data.filter((r: any) => {
          if (seen.has(r.full_name)) return false;
          seen.add(r.full_name);
          return true;
        });
        return this.buildFuzzyDisambiguation(cleanSearch, uniqueForPrompt, 'person_lookup');
      }

      // ── Step 2: Group by unique person (by registration ID) ──
      const personMap = new Map<number, { person: any; attempts: any[] }>();
      for (const row of data) {
        const regId = parseInt(row.reg_id);
        if (!personMap.has(regId)) {
          personMap.set(regId, {
            person: {
              full_name: row.full_name,
              gender: row.gender,
              mobile_number: row.mobile_number,
              email: row.email,
              best_score: row.best_score,
              attempt_count: parseInt(row.attempt_count) || 0,
            },
            attempts: [],
          });
        }
        if (row.status === 'COMPLETED') {
          personMap.get(regId)!.attempts.push({
            total_score: row.total_score,
            behavioral_style: row.behavioral_style,
            behavior_description: row.behavior_description,
            sincerity_index: row.sincerity_index,
            sincerity_class: row.sincerity_class,
            completed_at: row.completed_at,
            program_name: row.program_name,
          });
        }
      }

      const uniquePersons = Array.from(personMap.values());

      // ── Step 3: Disambiguation if multiple unique people ──
      if (uniquePersons.length > 1 && targetIndex < 0) {
        let response = `**👥 Multiple candidates found matching "${cleanSearch}":**\n\n`;
        response += `Please specify which one:\n\n`;

        uniquePersons.forEach((entry, index) => {
          const p = entry.person;
          const email = p.email ? ` | ${p.email}` : '';
          const attempts = p.attempt_count > 0 ? ` (${p.attempt_count} assessment${p.attempt_count > 1 ? 's' : ''})` : ' (no assessments)';
          const bestStyle = entry.attempts.length > 0 ? ` | ${entry.attempts[0].behavioral_style || 'N/A'}` : '';
          response += `**${index + 1}.** ${p.full_name}${email}${bestStyle}${attempts}\n`;
        });

        response += `\n**Reply with a number** (e.g. **1** or **2**) or try:\n• "${cleanSearch} #1"\n• "${cleanSearch} #2"`;

        // Store disambiguation context for follow-up
        this.disambiguationCache.set(this.getDisambiguationKey(user), {
          searchTerm: cleanSearch,
          timestamp: Date.now(),
          handler: 'person_lookup',
          options: uniquePersons.map((entry: any) => entry.person.full_name),
        });

        return {
          answer: response,
          searchType: 'disambiguation',
          confidence: 0.7,
        };
      }

      // Validate index for numbered selections
      if (targetIndex >= uniquePersons.length) {
        return {
          answer: `**❌ Invalid selection.** Only ${uniquePersons.length} candidate(s) found matching "${cleanSearch}".\nPlease use a number between 1 and ${uniquePersons.length}.`,
          searchType: 'person_lookup',
          confidence: 0.3,
        };
      }

      // ── Step 4: Format consolidated results for the selected person ──
      const selected = targetIndex >= 0 ? uniquePersons[targetIndex] : uniquePersons[0];
      const person = selected.person;
      const attempts = selected.attempts;

      let response = `**📊 Assessment Results for ${person.full_name}**\n\n`;

      if (person.email) response += `📧 **Email:** ${person.email}\n`;
      if (person.gender) response += `👤 **Gender:** ${person.gender}\n`;

      if (attempts.length === 0) {
        response += `\n⚠️ **No completed assessments found.** This candidate has registered but hasn't completed any tests yet.\n`;
      } else {
        // Show the latest/best attempt details
        const latest = attempts[0];
        const scoreNum = latest.total_score ? parseFloat(latest.total_score) : NaN;

        if (latest.behavioral_style) {
          response += `\n📋 **Behavioral Style: ${latest.behavioral_style}**\n`;
          if (latest.behavior_description) {
            response += `${latest.behavior_description}\n`;
          }
        }

        if (!isNaN(scoreNum)) {
          const agile = this.getAgileLevel(scoreNum);
          response += `\n🎯 **Agile Compatibility: ${agile.name}** (Score: ${scoreNum}/125)\n`;
          response += `${agile.desc}\n`;
        }

        if (latest.sincerity_class) {
          response += `\n🔒 **Sincerity:** ${latest.sincerity_class}`;
          if (latest.sincerity_index) response += ` (Index: ${parseFloat(latest.sincerity_index).toFixed(1)})`;
          response += '\n';
        }

        if (latest.program_name) {
          response += `📚 **Program:** ${latest.program_name}\n`;
        }

        if (latest.completed_at) {
          response += `📅 **Completed:** ${new Date(latest.completed_at).toLocaleDateString()}\n`;
        }

        // Show additional attempts if any
        if (attempts.length > 1) {
          response += `\n---\n📊 **All ${attempts.length} Completed Assessments:**\n\n`;
          attempts.forEach((att, i) => {
            const s = att.total_score ? parseFloat(att.total_score) : 0;
            const style = att.behavioral_style || 'N/A';
            const date = att.completed_at ? new Date(att.completed_at).toLocaleDateString() : 'N/A';
            response += `**${i + 1}.** Score: ${s}/125 | Style: ${style} | Date: ${date}\n`;
          });
        }
      }

      response += `\n💡 *Want a detailed analysis? Try: "generate career report for ${person.full_name}"*`;

      return {
        answer: response,
        searchType: 'person_lookup',
        confidence: 0.95,
      };

    } catch (error) {
      this.logger.error(`Person lookup error: ${error.message}`);
      return {
        answer: `**I couldn't look up that person right now.** ${this.sanitizeErrorForUser(error)}\n\n💡 Try: "list candidates" to browse available records.`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: OVERALL ROLE FITMENT (WITH ADVANCED FILTERS)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleOverallReport(user: any, question?: string): Promise<QueryResult> {
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

      // ── Extract filters from natural language query ──
      const filters = question ? await this.extractReportFilters(question) : {};

      const reportTitle = filters.title || 'Placement Guidance Report';
      const input: any = {
        title: reportTitle,
        ...filters,
      };

      // RBAC: Corporate users → scope to their company
      if (userRole === 'CORPORATE' && corporateId) {
        input.corporateId = corporateId;
      }

      // Only filter by group if the user has a group and no explicit college filter
      if (user?.group_id && !input.collegeName) {
        input.groupId = user.group_id;
      }

      // Build download URL with all filter parameters
      let downloadUrl = `/rag/overall-report/pdf?title=${encodeURIComponent(reportTitle)}`;
      if (input.groupId) downloadUrl += `&groupId=${input.groupId}`;
      if (input.corporateId) downloadUrl += `&corporateId=${input.corporateId}`;
      if (input.dateFrom) downloadUrl += `&dateFrom=${encodeURIComponent(input.dateFrom)}`;
      if (input.dateTo) downloadUrl += `&dateTo=${encodeURIComponent(input.dateTo)}`;
      if (input.collegeName) downloadUrl += `&collegeName=${encodeURIComponent(input.collegeName)}`;
      if (input.affiliateName) downloadUrl += `&affiliateName=${encodeURIComponent(input.affiliateName)}`;
      if (input.schoolLevel) downloadUrl += `&schoolLevel=${encodeURIComponent(input.schoolLevel)}`;
      if (input.schoolStream) downloadUrl += `&schoolStream=${encodeURIComponent(input.schoolStream)}`;
      if (input.departmentName) downloadUrl += `&departmentName=${encodeURIComponent(input.departmentName)}`;
      if (input.gender) downloadUrl += `&gender=${encodeURIComponent(input.gender)}`;

      const report = await this.overallRoleFitmentService.generateReport(input);

      return {
        answer: `I've generated the **Overall Role Fitment Report** for you.\n\n📄 **[Click here to download the PDF Report](${downloadUrl})**\n\nSince I can't display the full graphical report here, please download the PDF for the complete analysis including charts and tables.\n\nSummary:\n${this.overallRoleFitmentService.formatForChat(report, input)}`,
        searchType: 'overall_report',
        confidence: 0.95,
      };
    } catch (error) {
      this.logger.error(`Overall report error: ${error.message}`);
      return {
        answer: `**I couldn't generate the overall report right now.** ${this.sanitizeErrorForUser(error)}\n\nPlease ensure there are completed assessments with personality data.\n\n💡 **Tip:** Try refining your query, for example:\n- "Generate overall report for students completed on 2024-01-15"\n- "Report for ABC college students"\n- "Overall report for SSLC students"\n- "Generate report for affiliate John's referrals"`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER EXTRACTION: Natural language → structured filters
  // ═══════════════════════════════════════════════════════════════════════════
  private async extractReportFilters(question: string): Promise<any> {
    const q = question.toLowerCase();
    const filters: any = {};

    // ── Date extraction (regex-based for speed) ──
    // "on 2024-01-15", "from 2024-01-01 to 2024-01-31", "today", "this month", "last week"
    const isoDatePattern = /(\d{4}-\d{2}-\d{2})/g;
    const dates = q.match(isoDatePattern);
    if (dates) {
      if (dates.length === 1) {
        // Single date: both from and to = same day
        filters.dateFrom = dates[0];
        filters.dateTo = dates[0];
      } else if (dates.length >= 2) {
        filters.dateFrom = dates[0];
        filters.dateTo = dates[1];
      }
    }

    // "today"
    if (/\btoday\b/.test(q)) {
      const today = new Date().toISOString().split('T')[0];
      filters.dateFrom = today;
      filters.dateTo = today;
    }
    // "yesterday"
    if (/\byesterday\b/.test(q)) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      filters.dateFrom = yesterday;
      filters.dateTo = yesterday;
    }
    // "this week"
    if (/\bthis\s+week\b/.test(q)) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      filters.dateFrom = monday.toISOString().split('T')[0];
      filters.dateTo = now.toISOString().split('T')[0];
    }
    // "this month"
    if (/\bthis\s+month\b/.test(q)) {
      const now = new Date();
      filters.dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      filters.dateTo = now.toISOString().split('T')[0];
    }
    // "last month"
    if (/\blast\s+month\b/.test(q)) {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      filters.dateFrom = lastMonth.toISOString().split('T')[0];
      filters.dateTo = lastMonthEnd.toISOString().split('T')[0];
    }

    // ── School level ──
    if (/\bsslc\b/.test(q)) {
      filters.schoolLevel = 'SSLC';
    } else if (/\bhsc\b/.test(q)) {
      filters.schoolLevel = 'HSC';
    } else if (/\bschool\b/.test(q) && !filters.schoolLevel) {
      // Generic "school students" — include both
      // Don't set filter; let it include all school levels
    }

    // ── School stream ──
    if (/\bscience\b/.test(q)) filters.schoolStream = 'SCIENCE';
    else if (/\bcommerce\b/.test(q)) filters.schoolStream = 'COMMERCE';
    else if (/\bhumanities\b|\barts\b/.test(q)) filters.schoolStream = 'HUMANITIES';

    // ── Gender ──
    if (/\b(male|boys?|men)\b/.test(q) && !/\bfemale\b/.test(q)) filters.gender = 'MALE';
    else if (/\b(female|girls?|women)\b/.test(q)) filters.gender = 'FEMALE';

    // ── Affiliate ──
    const affiliateMatch = q.match(/\baffiliate\s+([a-z][a-z\s]+?)(?:'s|\s+referral|\s+student|\s+report|\b)/);
    if (affiliateMatch) {
      const name = affiliateMatch[1].trim();
      if (name.length > 1 && !/\b(student|report|overall|referral|list|all)\b/.test(name)) {
        filters.affiliateName = name;
      }
    }

    // ── College / group name — use LLM if regex doesn't capture clean enough ──
    // Try common patterns: "for [college name] students", "[college] college", "group [name]"
    const collegeMatch = q.match(
      /(?:for|from|of|in)\s+([a-z][a-z\s&.]+?)\s*(?:college|university|institute|school|group|students|batch)/i
    );
    if (collegeMatch) {
      const name = collegeMatch[1].trim();
      // Exclude generic words that aren't college names
      if (name.length > 2 && !/\b(all|the|every|each|our|my|sslc|hsc|overall|completed)\b/.test(name)) {
        filters.collegeName = name;
      }
    }

    // ── Department ──
    const deptMatch = q.match(
      /(?:department|dept|degree|branch)\s+(?:of\s+)?([a-z][a-z\s&.]+?)(?:\s+student|\s+report|$)/i
    );
    if (deptMatch) {
      filters.departmentName = deptMatch[1].trim();
    }

    // ── Build dynamic title based on filters ──
    const titleParts: string[] = [];
    if (filters.schoolLevel) titleParts.push(filters.schoolLevel);
    if (filters.schoolStream) titleParts.push(filters.schoolStream);
    if (filters.collegeName) titleParts.push(filters.collegeName);
    if (filters.affiliateName) titleParts.push(`Affiliate: ${filters.affiliateName}`);
    if (filters.dateFrom) titleParts.push(`From: ${filters.dateFrom}`);
    if (filters.dateTo && filters.dateTo !== filters.dateFrom) titleParts.push(`To: ${filters.dateTo}`);
    if (filters.gender) titleParts.push(filters.gender);

    if (titleParts.length > 0) {
      filters.title = `Career Fitment Report — ${titleParts.join(' | ')}`;
    }

    this.logger.log(`🔍 Extracted report filters: ${JSON.stringify(filters)}`);
    return filters;
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
        let selfLookup: any[] = [];
        // Try user_id first
        if (userId && userId > 0) {
          selfLookup = await this.executeDatabaseQuery(
            `SELECT r.user_id, r.full_name FROM registrations r WHERE r.user_id = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
            [userId]
          );
        }
        // Fallback: use email when userId is 0 or lookup failed
        if (selfLookup.length === 0 && (user?.email || user?.sub)) {
          const email = user?.email || user?.sub;
          this.logger.log(`📋 Custom report: userId=${userId} lookup failed, trying email: ${email}`);
          selfLookup = await this.executeDatabaseQuery(
            `SELECT r.user_id, r.full_name FROM registrations r JOIN users u ON r.user_id = u.id WHERE u.email = $1 AND r.is_deleted = false ORDER BY r.created_at DESC LIMIT 1`,
            [email]
          );
        }
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
        answer: `**I couldn't generate the custom report right now.** ${this.sanitizeErrorForUser(error)}`,
        searchType: 'error',
        confidence: 0,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: CHAT-BASED PROFILE REPORT (User provides profile data in chat)
  // ═══════════════════════════════════════════════════════════════════════════
  private async handleChatProfileReport(question: string, user?: any): Promise<QueryResult> {
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

      // ══════════════════════════════════════════════════════════
      // DB VALIDATION: Verify the person exists in our database
      // with completed assessment data before generating a report.
      // We NEVER generate reports for people not in our system.
      // Uses word-boundary matching for precision (prevents "jai" → "JAISHREE")
      // ══════════════════════════════════════════════════════════
      let corporateFilter = '';
      const profileGuardParams: any[] = [`\\m${profileData.name}\\M`];
      const profileUserRole = (user?.role || 'STUDENT').toUpperCase();
      const profileCorporateId = user?.corporateId;
      if (profileUserRole === 'CORPORATE' && profileCorporateId) {
        corporateFilter = ' AND r.corporate_account_id = $2';
        profileGuardParams.push(profileCorporateId);
      }

      let dbCheck = await this.dataSource.query(
        `SELECT r.id, r.full_name, r.user_id,
                (SELECT COUNT(*) FROM assessment_attempts aa
                 WHERE aa.registration_id = r.id AND aa.status = 'COMPLETED') as completed_count
         FROM registrations r
         WHERE r.full_name ~* $1 AND r.is_deleted = false${corporateFilter}
         ORDER BY r.created_at DESC LIMIT 5`,
        profileGuardParams
      );

      // Fallback to ILIKE if word-boundary returned 0
      let usedProfileILIKEFallback = false;
      if (!dbCheck || dbCheck.length === 0) {
        usedProfileILIKEFallback = true;
        const iLikeParams2: any[] = [`%${profileData.name.toLowerCase()}%`];
        let iLikeFilter2 = '';
        if (profileUserRole === 'CORPORATE' && profileCorporateId) {
          iLikeFilter2 = ' AND r.corporate_account_id = $2';
          iLikeParams2.push(profileCorporateId);
        }
        dbCheck = await this.dataSource.query(
          `SELECT r.id, r.full_name, r.user_id,
                  (SELECT COUNT(*) FROM assessment_attempts aa
                   WHERE aa.registration_id = r.id AND aa.status = 'COMPLETED') as completed_count
           FROM registrations r
           WHERE LOWER(r.full_name) LIKE $1 AND r.is_deleted = false${iLikeFilter2}
           ORDER BY r.created_at DESC LIMIT 5`,
          iLikeParams2
        );
      }

      if (!dbCheck || dbCheck.length === 0) {
        const scopeMsg = profileUserRole === 'CORPORATE' ? ' within your organization' : '';
        this.logger.warn(`❌ Chat profile report: "${profileData.name}" not found${scopeMsg}`);
        return {
          answer: `**⚠️ "${profileData.name}" was not found${scopeMsg}.**\n\nTry this:\n• Check the spelling\n• Ask **"list candidates"**\n• Ask the person to complete assessment before report generation`,
          searchType: 'person_not_found',
          confidence: 0.95,
        };
      }

      // If ILIKE fallback was used, verify exact word-token match
      if (usedProfileILIKEFallback && !this.hasExactTokenMatch(profileData.name, dbCheck)) {
        this.logger.log(`⚠️ Chat profile: ILIKE matched but no exact token for "${profileData.name}" — showing fuzzy disambiguation`);
        return this.buildFuzzyDisambiguation(profileData.name, dbCheck, 'career_report');
      }

      // Check if at least one match has completed assessments
      const withAssessment = dbCheck.filter((r: any) => parseInt(r.completed_count) > 0);
      if (withAssessment.length === 0) {
        const names = dbCheck.map((r: any) => r.full_name).join(', ');
        this.logger.warn(`❌ Chat profile report: "${profileData.name}" found but no completed assessments`);
        return {
          answer: `**⚠️ Found "${names}", but no completed assessments yet.**\n\nCareer Fitment Report is available after assessment completion.\n\n**Next steps:**\n1. Complete behavioral assessment\n2. Complete aptitude/agile assessment`,
          searchType: 'no_assessment_data',
          confidence: 0.95,
        };
      }

      // Use the best match from DB (person with completed assessment)
      const bestMatch = withAssessment[0];
      this.logger.log(`✅ DB validated: ${bestMatch.full_name} (userId: ${bestMatch.user_id}, assessments: ${bestMatch.completed_count})`);

      // Encode the profile data as base64 for the URL — merge DB data with provided profile
      const reportPayload = {
        name: bestMatch.full_name, // Use the DB name for accuracy
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
        answer: `**✅ Profile Captured Successfully for ${bestMatch.full_name}!** 🎯\n\n📊 **Profile Summary:**\n- **Name:** ${bestMatch.full_name}\n- **Current Role:** ${profileData.currentRole}\n- **Experience:** ${profileData.yearsOfExperience} years\n- **Industry:** ${profileData.currentIndustry}\n- **Target Role:** ${profileData.expectedFutureRole}\n- **Assessments Completed:** ${bestMatch.completed_count}\n\n📄 **[Click here to download your personalized Career Fitment Report](${downloadUrl})**\n\n*Report is generated using real assessment data from our platform combined with the profile details you provided.*`,
        searchType: 'chat_profile_report',
        confidence: 0.95,
        reportUrl: downloadUrl,
      };
    } catch (error) {
      this.logger.error(`Chat profile report error: ${error.message}`);
      return {
        answer: `**I couldn't process that profile.** ${this.sanitizeErrorForUser(error)}\n\nPlease make sure you've provided all required details (Name, Current Role, Years of Experience, Current Industry, Expected Future Role).`,
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
          answer: `**JD Candidate Matching**\n\nTo identify the best-suited candidates for a role, please provide a job description.\n\n**Option 1 — Paste a full JD:**\n\`\`\`\nFind candidates for:\nJob Title: Senior Software Engineer\nResponsibilities: Lead backend development...\nRequirements: 5+ years experience, strong leadership...\n\`\`\`\n\n**Option 2 — Describe the role naturally:**\n- "Find candidates suitable for a project manager role requiring leadership, analytical thinking, and team collaboration"\n- "Who is best suited for a customer success manager who needs empathy, communication, and adaptability?"\n- "Match candidates for: Senior Data Analyst — strong analytical skills, attention to detail, works independently"\n\nThe more detail you provide, the more precise the matching will be.`,
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
        answer: `**I couldn't run the candidate matching right now.** ${this.sanitizeErrorForUser(error)}\n\n💡 Please try again with a more detailed job description.`,
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
    // Try short role extraction first: "best/top candidate for [role]"
    const shortRolePattern = /(?:best|top|ideal)\s+(?:candidates?|performer|person|employee|resource|member)s?\s+(?:for|to)\s*[:\-]?\s*([\s\S]+)/i;
    const shortMatch = message.match(shortRolePattern);
    if (shortMatch && shortMatch[1] && shortMatch[1].trim().length > 3) {
      // Return the role name as a JD prompt for the LLM to understand
      const role = shortMatch[1].trim();
      return `Find the best candidate for the role: ${role}. Required: strong behavioral traits, leadership potential, and personality fit for ${role}.`;
    }

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
  private async understandQuery(question: string, userRole: string = 'STUDENT', conversationHistory: string = ''): Promise<{
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
      // CRITICAL: Run domain overrides even on fastLocalMatch results
      // This catches cases like "tell about the touchmark company" where
      // extractName returns "the touchmark" as person_lookup, but the query
      // actually mentions "company" and should route to corporate_details.
      const overridden = this.applyDomainOverrides(question, localResult);
      this.logger.log(`⚡ Fast-matched intent: ${overridden.intent} (no LLM call${overridden.intent !== localResult.intent ? `, overridden from ${localResult.intent}` : ''})`);
      this.queryCache.set(cacheKey, { result: overridden, timestamp: Date.now() });
      return overridden;
    }

    // ── LLM call with compact prompt (~400 tokens instead of ~1200) ──
    const roleHint = userRole === 'ADMIN' ? 'ADMIN(full access)'
      : userRole === 'CORPORATE' ? 'CORPORATE(company-scoped)'
        : 'STUDENT(personal only)';

    const prompt = `You are the intent classifier for Ask BI (OriginBI's AI talent intelligence assistant). Classify user questions into the correct intent for routing.

User role: ${roleHint}
${conversationHistory ? `\n${conversationHistory}\n` : ''}
Output JSON: {"intent":"...","searchTerm":"...or null","table":"...","includePersonality":bool}

AUTO-CORRECTION (CRITICAL):
Before classifying, mentally correct obvious misspellings and interpret user intent:
- "candiate"/"candidte"/"canidate" = candidate
- "employe"/"emploee"/"emplyee" = employee (which means candidate in this platform)
- "fir" in context like "fir for" = "fit for"
- "resourse" = resource (which means candidate)
- In corporate context: employee = resource = staff = member = worker = candidate (all refer to registrations table)
- "my employee" / "my resource" / "my staff" = asking about their candidates → list_candidates
- "know about my employee" = list_candidates (NOT person_lookup)
- "list of [misspelled word similar to candidate]" = list_candidates

INTENTS (choose the MOST SPECIFIC one):
- data_query: **USE THIS for ANY complex, analytical, or flexible data question** that doesn't fit a specific intent below. Examples: "female candidates who scored above 80", "average score by personality type", "candidates who completed last week", "gender distribution", "score range breakdown", "which departments have the most candidates", "compare scores between groups". This intent powers dynamic SQL generation and can answer virtually ANY database question.
- general_knowledge: ANY question about skills, technologies, career advice, how-to guides, courses, learning, salaries, job markets, comparisons, explanations, tips, tutorials, roadmaps, programming concepts, or general world knowledge. This is the DEFAULT for any question that does NOT require looking up specific platform data.
- career_guidance: Personal career advice ("what jobs suit ME", "am I eligible", "should I try X")
- personal_info: "my name", "my profile", "who am I" (user asking about their own stored data)
- self_results: User asking about THEIR OWN results/scores/data ("my results", "my score", "show my test", "my details", "my assessment")
- jd_candidate_match: User provides a job description, role description, or hiring criteria and wants to find/match/identify suitable candidates from the platform's assessment data.
- greeting: hi, hello, hey
- help: what can you do
- list_users: ONLY for listing platform users from the "users" table (NOT affiliates, NOT candidates)
- list_candidates: For listing candidates/students/registrations OR when user asks about "my employees"/"my resources"/"my staff"/"my team"/"my people" — these ALL mean candidates in the registrations table
- test_results: ONLY when asking for assessment scores/exam results from the platform
- person_lookup: ONLY when asking about a SPECIFIC named person's data in the system (e.g. "show John's score"). The searchTerm MUST be an actual human name, NEVER a domain word like "employee", "candidate", "development", etc.
- best_performer: "top performer", "highest score", "best candidates"
- career_roles: ONLY for listing job roles stored in the platform database
- career_report: generate career report for someone
- overall_report: overall/placement/group report
- custom_report: career fitment report (with user profile data)
- chat_profile_report: message contains structured fields like "Name:", "Current Role:", "Experience:"
- count: "how many users/candidates"
- count_by_role: "how many corporate/admin/student accounts" (role-based user breakdown)
- corporate_details: Listing corporate/company accounts, corporate details, company info, "list corporates", "show corporate accounts", "corporate details", "list those details" (when conversation context is about corporates). If user is CORPORATE, show ONLY their own company details.
- affiliate_dashboard: Affiliate program overview/stats
- affiliate_referrals: Referral transactions
- affiliate_earnings: Affiliate commissions/earnings
- affiliate_payments: Affiliate settlements/payment history
- affiliate_list: List all affiliate accounts
- affiliate_lookup: Look up a specific affiliate by name
- affiliate_students: Students referred by affiliate(s)

Tables: users|registrations|assessment_attempts|career_roles|corporate_accounts|affiliate_accounts|affiliate_referral_transactions|affiliate_settlement_transactions|groups|group_assessments|programs|none

DOMAIN SYNONYMS:
- "batch" = group (groups table). A batch/group contains candidates.
- "program" = assessment program (programs table). Groups are assigned to programs via group_assessments.
- "summarize batch X" / "batch summary" / "group report" → data_query with table=groups
- "list programs" / "program overview" → data_query with table=programs
- "School Students Program" is a PROGRAM NAME, not a person name

CRITICAL RULES:
1. If someone asks "what are the skills to become X" or "how to become X" or "best courses for X" or "explain X" → general_knowledge (NOT list_users, NOT career_roles)
2. general_knowledge should be used for ANY educational, informational, or advisory question
3. **DOMAIN PRIORITY**: If the query mentions "affiliate", "referral", "commission", "settlement", or "payout", it MUST route to an affiliate_* intent
4. **DATA QUERY PRIORITY**: If the question involves filtering, comparing, aggregating, or analyzing data from the platform (scores, dates, gender, personality types, etc.), use data_query to leverage dynamic SQL generation. Examples that MUST be data_query: "female candidates above 80 score", "average score", "personality distribution", "candidates completed this month", "score comparison between personality types"
5. list_users/list_candidates should ONLY be used when the user EXPLICITLY asks to list platform users/candidates WITHOUT filtering, analysis, or specific criteria
6. career_roles should ONLY be used when asking to list the career roles stored in the DATABASE
7. If the question is analytical or requires combining multiple filters → data_query
8. If the question is purely educational/advisory with no DB data needed → general_knowledge
9. **searchTerm MUST be null unless the query mentions a specific human person's name (first name + optional last name). NEVER put domain words like "employee", "candidate", "resource", "full stack development", "my employee" as searchTerm.**
10. includePersonality=true for: test_results, self_results, person_lookup, best_performer, career_report, overall_report, custom_report, jd_candidate_match, data_query
11. If conversation history is provided, use it to resolve follow-up references like "her", "him", "that person", "their report"
12. All affiliate_* intents are ADMIN-ONLY
13. **"candidates for [role]" or "candidate's for [role]" = the user wants to find/match candidates for that role → jd_candidate_match or list_candidates, NEVER person_lookup**
14. **CORPORATE DATA**: "list corporates", "corporate details", "company accounts", "show companies" → corporate_details. If conversation previously mentioned corporates/companies and user says "list those details" or "show details" → corporate_details
15. **FOLLOW-UP CONTEXT**: When conversation history mentions a topic (e.g., corporate accounts, candidates), follow-up like "list those", "show details", "tell me more" should route to the same topic's intent
16. **BATCH/GROUP/PROGRAM queries**: "summarize batch X", "group summary", "strengths of batch X", "readiness levels for group", "list groups/batches", "program summary", "principal version report for program X", "School Students Program" → data_query. NEVER treat program/batch/group names like "School Students Program" or "KIOTstudents" as person names.

Query: "${question}"
JSON:`;

    try {
      const startTime = Date.now();
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'RAG query understanding',
        invokePrimary: () => this.getLlm().invoke([new SystemMessage(prompt)]),
        invokeFallback: () => this.getFallbackLlm().invoke([new SystemMessage(prompt)]),
      });
      const elapsed = Date.now() - startTime;
      this.logger.log(`🤖 LLM query understanding took ${elapsed}ms`);

      const jsonStr = response.content.toString().trim();
      // Extract JSON if wrapped in markdown code block
      const cleanJson = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      let result = {
        intent: parsed.intent || 'general_knowledge',
        searchTerm: parsed.searchTerm || null,
        table: parsed.table || 'none',
        includePersonality: parsed.includePersonality || false,
      };

      // ══════════════════════════════════════════════════════
      // POST-CLASSIFICATION SAFETY NET
      // Override misclassified intents based on domain keywords
      // ══════════════════════════════════════════════════════
      result = this.applyDomainOverrides(question, result);

      this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
      if (this.queryCache.size > 200) this.cleanCache();
      return result;
    } catch (error) {
      this.logger.warn(`Query interpretation failed: ${error.message}`);
      const fallback = this.fastLocalMatch(question) || {
        intent: 'general_knowledge',
        searchTerm: null,
        table: 'none',
        includePersonality: false,
      };
      return this.applyDomainOverrides(question, fallback);
    }
  }

  private applyDomainOverrides(
    question: string,
    result: {
      intent: string;
      searchTerm: string | null;
      table: string;
      includePersonality: boolean;
    },
  ): {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
  } {
    const q = question.toLowerCase();

    if (result.intent.startsWith('affiliate_') || /\baffiliate|referral|commission|settlement|payout\b/.test(q)) {
      // Determine the best affiliate sub-intent
      if (/\bstudents?\b/.test(q)) {
        return { ...result, intent: 'affiliate_students', table: 'affiliate_referral_transactions' };
      }
      if (/\b(dashboard|overview|summary)\b/.test(q)) {
        return { ...result, intent: 'affiliate_dashboard', table: 'affiliate_accounts' };
      }
      if (/\breferral\b/.test(q) && /\b(list|show|get|transaction|details?)\b/.test(q)) {
        return { ...result, intent: 'affiliate_referrals', table: 'affiliate_referral_transactions' };
      }
      if (/\b(earning|commission|total\s*earn)\b/.test(q)) {
        return { ...result, intent: 'affiliate_earnings', table: 'affiliate_accounts' };
      }
      if (/\b(payment|settlement|payout)\b/.test(q)) {
        return { ...result, intent: 'affiliate_payments', table: 'affiliate_settlement_transactions' };
      }
      if (/\b(detail|info|profile|status|lookup)\b/.test(q) && result.searchTerm) {
        return { ...result, intent: 'affiliate_lookup', table: 'affiliate_accounts' };
      }
      // Default to affiliate_list
      return { ...result, intent: 'affiliate_list', table: 'affiliate_accounts' };
    }

    // If query asks about "corporate" data but got list_users → correct to list_candidates or keep
    // ═══════════════════════════════════════════════════════════════
    // CORPORATE/COMPANY DOMAIN OVERRIDE
    // If query mentions companies/corporates and LLM returned a misrouted intent,
    // reroute to corporate_details or data_query to prevent web data leakage
    // Also catches career_guidance that should be corporate queries
    // ═══════════════════════════════════════════════════════════════
    const companyKeywords = /\b(companies|corporates?|company|organization|employer|business)\b/i;
    const misroutedIntents = ['general_knowledge', 'list_users', 'person_lookup', 'career_guidance'];

    if (companyKeywords.test(q) && misroutedIntents.includes(result.intent)) {
      this.logger.warn(
        `🔄 Domain override: LLM returned "${result.intent}" for company/corporate query, correcting...`,
      );

      // Try to extract a specific company name from the query
      const companyNameMatch = q.match(/\b(?:tell|know|learn|about|bout)\s+(?:me\s+)?(?:about|bout)?\s*(?:the\s+)?(.+?)\s+(?:company|corporate|organization|business)\b/i)
        || q.match(/\babout\s+(?:the\s+)?(.+?)\s+(?:company|corporate|organization|business)\b/i);
      let extractedCompanyName: string | null = null;
      if (companyNameMatch && companyNameMatch[1]) {
        const rawName = companyNameMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
        // Avoid domain terms as company names
        const domainWords = new Set(['all', 'the', 'my', 'our', 'your', 'their', 'this', 'that', 'any', 'some', 'list', 'show', 'get', 'display']);
        if (rawName && rawName.length >= 2 && !domainWords.has(rawName.toLowerCase())) {
          extractedCompanyName = rawName;
        }
      }

      if (/\b(how many|count|total|number)\b/i.test(q)) {
        return { ...result, intent: 'data_query', table: 'corporate_accounts', searchTerm: null };
      }
      // Route to corporate_details, preserving company name if found
      return { ...result, intent: 'corporate_details', table: 'corporate_accounts', searchTerm: extractedCompanyName };
    }

    // ═══════════════════════════════════════════════════════════════
    // CRITICAL SAFETY NET: Strip domain words from searchTerm
    // The LLM sometimes puts "all candidate", "my employee", "full stack development"
    // as searchTerm when it should be null. This catches those cases.
    // ═══════════════════════════════════════════════════════════════
    if (result.searchTerm) {
      const domainTerms = new Set([
        'candidate', 'candidates', 'employee', 'employees', 'student', 'students',
        'resource', 'resources', 'member', 'members', 'staff', 'worker', 'workers',
        'people', 'person', 'team', 'everyone', 'everybody',
        'user', 'users', 'account', 'accounts', 'registration', 'registrations',
        'all', 'my', 'the', 'our', 'their', 'your', 'every', 'each',
        'development', 'developer', 'engineering', 'full', 'stack', 'frontend', 'backend',
        'manager', 'lead', 'senior', 'junior', 'role', 'position', 'job',
        'report', 'reports', 'result', 'results', 'score', 'scores',
        'assessment', 'data', 'details', 'info', 'information',
        'company', 'organization', 'department', 'performance', 'performer', 'performers',
        'analyst', 'analysts', 'engineer', 'engineers', 'scientist', 'scientists',
        'architect', 'architects', 'consultant', 'consultants', 'specialist', 'specialists',
        'career', 'careers', 'path', 'paths', 'skills',
      ]);

      const searchWords = result.searchTerm.toLowerCase().split(/\s+/);
      const allDomainWords = searchWords.every(w => domainTerms.has(w));

      if (allDomainWords) {
        this.logger.warn(
          `🔄 Domain override: searchTerm "${result.searchTerm}" is all domain words — nullifying and reclassifying`,
        );
        result.searchTerm = null;

        // Reclassify intent based on the query content
        if (result.intent === 'person_lookup') {
          // Figure out what they ACTUALLY want
          if (/\b(report|overall|summary|placement)\b/.test(q)) {
            result.intent = 'overall_report';
            result.table = 'assessment_attempts';
            result.includePersonality = true;
          } else if (/\b(list|show|get|all|every)\b/.test(q) && /\b(candidate|registration|student)\b/.test(q)) {
            result.intent = 'list_candidates';
            result.table = 'registrations';
            result.includePersonality = false;
          } else if (/\b(list|show|get|all|every)\b/.test(q) && /\buser\b/.test(q)) {
            result.intent = 'list_users';
            result.table = 'users';
            result.includePersonality = false;
          } else if (/\b(best|top|highest|performer)\b/.test(q)) {
            result.intent = 'best_performer';
            result.table = 'assessment_attempts';
            result.includePersonality = true;
          } else if (/\b(count|how many|total|number)\b/.test(q)) {
            result.intent = 'count';
            result.table = /\buser\b/.test(q) ? 'users' : 'registrations';
            result.includePersonality = false;
          } else {
            // Default: if they say "candidate" → list_candidates, otherwise general_knowledge
            if (/\bcandidate\b/.test(q)) {
              result.intent = 'list_candidates';
              result.table = 'registrations';
              result.includePersonality = false;
            } else {
              result.intent = 'general_knowledge';
              result.table = 'none';
              result.includePersonality = false;
            }
          }
          this.logger.log(`🎯 Reclassified to: ${result.intent}`);
        }
      }
    }

    // Advanced guardrail: role/topic phrase should not stay in person_lookup.
    if (result.intent === 'person_lookup' && result.searchTerm && this.isLikelyRoleOrTopicPhrase(result.searchTerm)) {
      const looksLikeCandidateMatching = /\b(candidate|candidates|people|person)\b/i.test(q) && /\b(for|suitable|fit|match)\b/i.test(q);
      this.logger.warn(`🔄 Domain override: person_lookup searchTerm "${result.searchTerm}" looks like a role/topic phrase`);
      if (looksLikeCandidateMatching) {
        return {
          ...result,
          intent: 'jd_candidate_match',
          searchTerm: null,
          table: 'assessment_attempts',
          includePersonality: true,
        };
      }
      return {
        ...result,
        intent: 'general_knowledge',
        searchTerm: null,
        table: 'none',
        includePersonality: false,
      };
    }

    // Final guardrail: if person_lookup is triggered for a clear informational query,
    // reroute to general_knowledge and clear searchTerm.
    if (result.intent === 'person_lookup' &&
      (/\bskills?\s+(for|to|needed|required|of|in)\b/.test(q) ||
        /\bcareer\s*paths?\b/.test(q) ||
        /\b(ask|tell)\s+me\s+about\b/.test(q)) &&
      !/\b(my|candidate|registration|student|user|employee|resource|company|corporate|organization|score|result|assessment|test|report)\b/.test(q)) {
      this.logger.warn('🔄 Domain override: informational career/skills query misrouted to person_lookup, correcting to general_knowledge');
      return {
        ...result,
        intent: 'general_knowledge',
        searchTerm: null,
        table: 'none',
        includePersonality: false,
      };
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART FOLLOW-UP CONTEXT RESOLVER
  // Resolves generic follow-ups like "list the details" / "show those" / 
  // "give details" by mapping the previous intent to the right detail intent.
  // ═══════════════════════════════════════════════════════════════════════════
  private resolveFollowUpIntent(
    sessionId: string,
    question: string,
    userRole: string,
  ): { intent: string; searchTerm: string | null; table: string; includePersonality: boolean } | null {
    const q = question.toLowerCase().trim();

    // Only trigger on generic follow-up patterns (no specific subject mentioned)
    const isGenericFollowUp = /^(list|show|get|give|display|tell)\s+(all\s+)?(the|those|these|them|me\s+the|me\s+those)?\s*(detail|info|data|accounts?|name|list|record|more)s?\s*\??$/i.test(q)
      || /^(list|show|tell\s+me)\s+(all\s+)?(the|those|these|them)\s*(detail|info|data|record|more)s?\s*\??$/i.test(q)
      || /^(list|show|tell\s+me)\s+(the|those|these|all|them)\s*\??$/i.test(q)
      || /^(what|who)\s+are\s+(they|those|them)\s*\??$/i.test(q)
      || /^(detail|details|more\s+details?|full\s+details?)\s*\??$/i.test(q)
      || /^(list|show)\s+(all\s+)?(the|their|those)?\s*(details|info|names?)?\s*\??$/i.test(q)
      || /^(give|tell)\s+(me\s+)?(all\s+)?(the\s+|those\s+)?(detail|info|data|name)s?\s*\??$/i.test(q)
      // Extended follow-ups: "show their list along with X", "list them with education", "show their details with scores"
      || /^(show|list|get|display)\s+(their|them|those|the)\s+(list|details?|info|data|names?)\b/i.test(q)
      || /^(list|show)\s+(them|those)\b/i.test(q)
      // Pronoun + data qualifier: "their education qualification", "their scores", "their details with education"
      || /\btheir\b/i.test(q) && /\b(education|qualification|score|marks|assessment|personality|department|degree|experience|gender|age|email|mobile|phone|board|stream|level)s?\b/i.test(q)
      // Standalone data qualifier as follow-up: "education qualification", "show scores"
      || /^(show|list|get|display|tell|give)?\s*(me\s+)?(all\s+)?(the\s+|their\s+|those\s+)?(education|qualification|score|marks|assessment|department|degree|experience)s?\b/i.test(q) && q.split(/\s+/).length <= 5;

    if (!isGenericFollowUp) return null;

    // Get conversation context
    const session = this.conversationService.getSession(sessionId);
    const lastIntent = session?.currentContext?.lastIntent;

    if (!lastIntent) return null;

    this.logger.log(`🔁 Generic follow-up detected: "${question}" | lastIntent: ${lastIntent}`);

    // If the follow-up mentions specific data qualifiers (education, scores, etc.),
    // route to data_query which can use text-to-SQL for flexible column selection
    const hasDataQualifier = /\b(education|qualification|score|marks|assessment|personality|department|degree|experience|gender|age|email|mobile|phone|board|stream|level)\b/i.test(q);
    if (hasDataQualifier) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // Map lastIntent → detail intent
    const intentMapping: Record<string, { intent: string; table: string; includePersonality: boolean }> = {
      // After counting roles (CORPORATE: 6) → list corporate accounts
      'count_by_role': { intent: 'corporate_details', table: 'corporate_accounts', includePersonality: false },
      // After counting candidates → list candidates
      'count': { intent: 'list_candidates', table: 'registrations', includePersonality: false },
      // After listing candidates → show test results
      'list_candidates': { intent: 'test_results', table: 'assessment_attempts', includePersonality: true },
      // After test results → show detailed results
      'test_results': { intent: 'test_results', table: 'assessment_attempts', includePersonality: true },
      // After corporate details → show candidates per corporate
      'corporate_details': { intent: 'list_candidates', table: 'registrations', includePersonality: false },
      // After best performer → show their details
      'best_performer': { intent: 'test_results', table: 'assessment_attempts', includePersonality: true },
      // After career roles → keep showing career roles
      'career_roles': { intent: 'career_roles', table: 'career_roles', includePersonality: false },
      // After affiliate dashboard → show referrals
      'affiliate_dashboard': { intent: 'affiliate_referrals', table: 'affiliate_referral_transactions', includePersonality: false },
      'affiliate_referrals': { intent: 'affiliate_referrals', table: 'affiliate_referral_transactions', includePersonality: false },
      'affiliate_earnings': { intent: 'affiliate_referrals', table: 'affiliate_referral_transactions', includePersonality: false },
      // After listing users → list users again (different page)
      'list_users': { intent: 'list_users', table: 'users', includePersonality: false },
    };

    // Check conversation history for more context
    const lastMessages = session.messages.slice(-4).map(m => m.content.toLowerCase()).join(' ');

    // Smart override: if last response mentioned "corporate" but lastIntent was count_by_role
    if (lastIntent === 'count_by_role' && lastMessages.includes('corporate')) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // If last response mentioned "candidate" or "student"
    if ((lastIntent === 'count_by_role' || lastIntent === 'count') && (lastMessages.includes('candidate') || lastMessages.includes('student') || lastMessages.includes('registration'))) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // If last response mentioned "affiliate"
    if (lastIntent === 'count_by_role' && lastMessages.includes('affiliate')) {
      return { intent: 'affiliate_referrals', searchTerm: null, table: 'affiliate_referral_transactions', includePersonality: false };
    }

    const mapped = intentMapping[lastIntent];
    if (mapped) {
      return { ...mapped, searchTerm: null };
    }

    return null;
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

    // ═══════════════════════════════════════════════════════════════
    // PHASE 0: Domain-keyword detection
    // Detect domain-specific keywords FIRST to route to the correct
    // intent family and prevent generic patterns from mis-matching.
    // ═══════════════════════════════════════════════════════════════
    const isAffiliateDomain = /\b(affiliate|referral|commission|settlement|payout)\b/.test(q);

    // Greetings
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)\b/.test(q)) {
      return { intent: 'greeting', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Help
    if (/^(help|what can you do|what can you help)\b/.test(q)) {
      return { intent: 'help', searchTerm: null, table: 'none', includePersonality: false };
    }

    // ═══════════════════════════════════════════════════════════════
    // EARLY CATCH: Common corporate/admin queries that often get misrouted
    // These run AFTER normalizeQuery (employee→candidate etc.)
    // ═══════════════════════════════════════════════════════════════

    // "all person report" / "all candidate report" / "all report" → overall_report
    if (/\b(all|every|overall|complete|full)\s+(candidate|person|student|user)?\s*(report|summary|overview|dashboard)\b/.test(q)) {
      return { intent: 'overall_report', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // ═══════════════════════════════════════════════════════════════
    // PRONOUN-BASED FOLLOW-UPS — "show their list", "list them",
    // "show them with education", "their list along with qualification"
    // These refer to previously mentioned candidates — route to data_query
    // so the text-to-SQL engine can include requested columns.
    // ═══════════════════════════════════════════════════════════════
    // Check for data qualifiers (education, score, etc.) — these turn any pronoun follow-up into data_query
    const hasDataQualifier = /\b(education|qualification|score|marks|assessment|personality|department|degree|experience|gender|age|email|mobile|phone|board|stream|level)s?\b/i.test(q);

    if (/\b(show|list|get|display)\s+(their|them|those)\s+(list|details?|info|data|names?|education|qualification|score)s?\b/i.test(q) ||
        /\b(show|list|get|display)\s+(them|those)\b/i.test(q) ||
        /\btheir\s+(list|details?|info|names?|education|qualification|score)s?\b/i.test(q) ||
        // Standalone pronoun + data qualifier: "their education qualification", "their scores"
        /\btheir\b/i.test(q) && hasDataQualifier) {
      if (hasDataQualifier) {
        return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
      }
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }

    // Standalone data qualifier as follow-up: "education qualification", "their scores", "show scores"
    if (hasDataQualifier && /^(show|list|get|display|tell|give)?\s*(me\s+)?(all\s+)?(the\s+|their\s+|those\s+)?/i.test(q) && q.split(/\s+/).length <= 6) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "best candidate for [role]" → jd_candidate_match (role-specific matching, NOT generic best_performer)
    if (/\b(best|top|ideal)\s+(candidate|performer|person|employee|resource)s?\s+(for|to)\s+\w/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "best employee" / "best candidate" / "top performer" / "best performer" (generic, no role specified)
    if (/\b(best|top|highest)\s+(candidate|performer|student|person|scorer)\b/.test(q)) {
      return { intent: 'best_performer', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "show my employees" / "list my resources" / "my staff" / "my candidates"
    if (/\b(show|list|get|display|view)\s+(my|our)\s+(candidate|candidates|student|students)\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }

    // "list my resource" (even before normalizeQuery — catches if synonym mapping missed)
    if (/\b(list|show|get|display|view)\s+(my|our)\s+(resource|resources|employee|employees|staff|member|members|worker|workers|people|team)\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }

    // ═══════════════════════════════════════════════════════════════
    // FOLLOW-UP & GENDER PATTERNS — prevent "male"/"female" from
    // being treated as person names in follow-up queries
    // ═══════════════════════════════════════════════════════════════

    // "what about male?" / "how about female?" / "and male?" / "and female?"
    if (/\b(what\s+about|how\s+about|and|and\s+the)\s+(male|female|males|females|boys?|girls?|men|women)\b/.test(q)) {
      const gender = /\b(female|females|girls?|women)\b/i.test(q) ? 'FEMALE' : 'MALE';
      return { intent: 'count', searchTerm: null, table: 'registrations', includePersonality: false, gender } as any;
    }

    // Standalone "male" / "female" (likely follow-up to a count query)
    if (/^(male|female|males|females)\s*\??$/i.test(q.trim())) {
      const gender = /^(female|females)/i.test(q.trim()) ? 'FEMALE' : 'MALE';
      return { intent: 'count', searchTerm: null, table: 'registrations', includePersonality: false, gender } as any;
    }

    // "how many male/female candidates/resources?" / "male count" / "total male"
    if (/\b(how\s+many|count|total|number\s+of)\s+(male|female)\b/.test(q)) {
      const gender = /\bfemale\b/i.test(q) ? 'FEMALE' : 'MALE';
      return { intent: 'count', searchTerm: null, table: 'registrations', includePersonality: false, gender } as any;
    }

    // "im asking about toal male resources?" → after normalizeQuery → "i am asking about total male candidate?"
    if (/\b(asking\s+about|tell\s+me\s+about|about)\s+(total\s+)?(male|female)\b/.test(q)) {
      const gender = /\bfemale\b/i.test(q) ? 'FEMALE' : 'MALE';
      return { intent: 'count', searchTerm: null, table: 'registrations', includePersonality: false, gender } as any;
    }

    // Chat profile report (contains structured "Name:", "Current Role:", etc.)
    if (/name\s*:/i.test(q) && (/current\s*role\s*:/i.test(q) || /experience\s*:/i.test(q) || /industry\s*:/i.test(q))) {
      return { intent: 'chat_profile_report', searchTerm: null, table: 'none', includePersonality: false };
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: AFFILIATE / REFERRAL DOMAIN (checked BEFORE generic patterns)
    // If query contains affiliate/referral/commission/settlement,
    // route to affiliate intents to prevent generic mis-matches.
    // ═══════════════════════════════════════════════════════════════
    if (isAffiliateDomain) {
      // "students on affiliate", "students referred by", "affiliate students"
      if (/\bstudents?\b/.test(q)) {
        const name = this.extractName(question);
        return { intent: 'affiliate_students', searchTerm: name, table: 'affiliate_referral_transactions', includePersonality: false };
      }

      // Affiliate dashboard: "affiliate dashboard", "referral dashboard", "affiliate overview"
      if (/\b(dashboard|overview|summary)\b/.test(q)) {
        return { intent: 'affiliate_dashboard', searchTerm: null, table: 'affiliate_accounts', includePersonality: false };
      }

      // Affiliate referrals: "referral list", "show referrals", "how many referrals", "referral transactions"
      if (/\breferral/i.test(q) && /\b(list|show|get|all|details?|transaction|count|how\s*many|recent)\b/.test(q)) {
        return { intent: 'affiliate_referrals', searchTerm: null, table: 'affiliate_referral_transactions', includePersonality: false };
      }

      // Affiliate earnings: "commission details", "earnings", "total earned", "pending commission"
      if (/\b(earning|commission|total\s*earn|pending\s*commission)\b/.test(q)) {
        return { intent: 'affiliate_earnings', searchTerm: null, table: 'affiliate_accounts', includePersonality: false };
      }

      // Affiliate payments: "payment status", "settlement history", "payout", "settled amount"
      if (/\b(payment|settlement|payout|settled\s*amount|paid\s*amount)\b/.test(q)) {
        return { intent: 'affiliate_payments', searchTerm: null, table: 'affiliate_settlement_transactions', includePersonality: false };
      }

      // Affiliate lookup: "affiliate details for [name]", "[name]'s affiliate info", "affiliate info"
      if (/\b(detail|info|profile|status|lookup)\b/.test(q)) {
        const name = this.extractName(question);
        return { intent: 'affiliate_lookup', searchTerm: name, table: 'affiliate_accounts', includePersonality: false };
      }

      // Catch-all: any "list/show/get affiliate..." or "affiliate list/accounts/users/details"
      if (/\b(list|show|get|all|display)\b/.test(q) || /\b(accounts?|list|all|users?|details?|data|members?)\b/.test(q)) {
        return { intent: 'affiliate_list', searchTerm: null, table: 'affiliate_accounts', includePersonality: false };
      }

      // If it's still affiliate-domain but no sub-pattern matched, default to affiliate_list for listing or affiliate_dashboard
      if (/\b(how\s*many|count|total)\b/.test(q)) {
        return { intent: 'count', searchTerm: null, table: 'affiliate_accounts', includePersonality: false };
      }

      return { intent: 'affiliate_list', searchTerm: null, table: 'affiliate_accounts', includePersonality: false };
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

    // ═══════════════════════════════════════════════════════════════
    // "[Group name] count" — e.g. "kiot aids count", "kiot it count"
    // These lack the word batch/group/program but user wants the count for a specific group.
    // Must come BEFORE the batchGroupProgramGuard block.
    // ═══════════════════════════════════════════════════════════════
    if (/\b(count|total)\s*$/i.test(q) && !/(how\s+many|list|show|all|batch|group|program)/i.test(q)) {
      const nameBeforeCount = question
        .replace(/\b(count|total)\s*$/i, '')
        .replace(/\b(candidates?|students?|users?|members?|of\s+the|in)\b/gi, '')
        .trim();
      if (nameBeforeCount.length >= 2) {
        return { intent: 'batch_group_query', searchTerm: nameBeforeCount, table: 'groups', includePersonality: false };
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // BATCH / GROUP / PROGRAM QUERIES — MUST come BEFORE career_report
    // because "generate report for School Students Program" contains "generate.*report"
    // which would otherwise be intercepted by the career_report pattern
    // ═══════════════════════════════════════════════════════════════
    const batchGroupProgramGuard = /\b(batch|group|program)\b/i;
    if (batchGroupProgramGuard.test(q)) {
      // Summarize / overview / analyze a batch/group
      if (/\b(summarize|summary|overview|analyze|analyse|report|stats?|statistics|performance|strengths?|risks?|readiness)\b/i.test(q) &&
          /\b(batch|group)\b/i.test(q)) {
        let groupName: string | null = null;
        const pm = question.match(/\(([^)]+)\)?/);  // handle both (X) and (X without closing
        if (pm) groupName = pm[1].trim();
        if (!groupName) {
          const nm = question.match(/\b(?:batch|group)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+(?:\s+[A-Za-z0-9_\-]+)*)["']?/i);
          if (nm) {
            let n = nm[1].replace(/\b(summary|summarize|report|strengths|risks|readiness|overview|stats|statistics|performance|analysis)\b/gi, '').trim();
            if (n.length >= 2) groupName = n;
          }
        }
        return { intent: 'batch_group_query', searchTerm: groupName, table: 'groups', includePersonality: true };
      }
      // List groups/batches
      if (/\b(list|show|get|display|all)\s+(the\s+)?(groups?|batches?)\b/i.test(q) || /^(groups?|batches?)\s*\??$/i.test(q)) {
        return { intent: 'batch_group_query', searchTerm: null, table: 'groups', includePersonality: false };
      }
      // Program summary / report / overview
      if (/\bprogram\b/i.test(q) && /\b(summarize|summary|overview|report|generate|principal|version|school|stats?|strengths?|risks?|readiness)\b/i.test(q)) {
        let programName: string | null = null;
        const forM = question.match(/\bfor\s+(.+?)(?:\s*$|\s*\?)/i);
        if (forM) {
          let pn = forM[1].replace(/\b(program|report|summary|version|principal|generate|no\s+disc\s+naming)\b/gi, '').trim();
          if (pn.length >= 2) programName = pn;
        }
        if (!programName) {
          const pnM = question.match(/\bprogram\s+["']?(.+?)["']?\s*(?:$|\?|summary|report)/i);
          if (pnM) {
            let pn = pnM[1].replace(/\b(report|summary|version|principal|generate)\b/gi, '').trim();
            if (pn.length >= 2) programName = pn;
          }
        }
        // Also try extracting from "School Students Program" as-is
        if (!programName) {
          const fullProgMatch = question.match(/["']?([A-Z][A-Za-z\s]+Program)["']?/i);
          if (fullProgMatch) programName = fullProgMatch[1].trim();
        }
        return { intent: 'batch_group_query', searchTerm: programName, table: 'programs', includePersonality: true };
      }
      // List programs
      if (/\b(list|show|get|display|all)\s+(the\s+)?(programs?)\b/i.test(q) || /^programs?\s*\??$/i.test(q)) {
        return { intent: 'batch_group_query', searchTerm: null, table: 'programs', includePersonality: false };
      }
      // Any remaining query mentioning "batch/group/program" with analytical intent
      if (/\b(batch|group)\b/i.test(q) && /\b(candidate|student|member|score|assessment|completed?|total|count|detail|info|who|how|many|result|age|gender|male|female)\b/i.test(q)) {
        let groupName: string | null = null;
        const pm = question.match(/\(([^)]+)\)?/);
        if (pm) groupName = pm[1].trim();
        if (!groupName) {
          const nm = question.match(/\b(?:batch|group)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+)["']?/i);
          if (nm) groupName = nm[1].trim();
        }
        return { intent: 'batch_group_query', searchTerm: groupName, table: 'groups', includePersonality: true };
      }
      // "how many candidates in batch X", "total students in group Y", "candidates in program Z"
      if (/\b(how\s+many|total|count)\b/i.test(q) && /\b(batch|group|program)\b/i.test(q)) {
        let name: string | null = null;
        const pm = question.match(/\(([^)]+)\)?/);
        if (pm) name = pm[1].trim();
        if (!name) {
          const nm = question.match(/\b(?:batch|group|program)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+)["']?/i);
          if (nm) name = nm[1].trim();
        }
        const tbl = /\bprogram\b/i.test(q) ? 'programs' : 'groups';
        return { intent: 'batch_group_query', searchTerm: name, table: tbl, includePersonality: false };
      }
      // "who scored highest in batch X", "top performers in group Y"
      if (/\b(top|best|highest|lowest|worst)\b/i.test(q) && /\b(batch|group|program)\b/i.test(q)) {
        let name: string | null = null;
        const pm = question.match(/\(([^)]+)\)?/);
        if (pm) name = pm[1].trim();
        if (!name) {
          const nm = question.match(/\b(?:batch|group|program)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+)["']?/i);
          if (nm) name = nm[1].trim();
        }
        return { intent: 'batch_group_query', searchTerm: name, table: 'groups', includePersonality: true };
      }
      // "compare batches", "batch comparison", "group vs group"
      if (/\b(compare|comparison|vs|versus|between)\b/i.test(q) && /\b(batch|group|program)\b/i.test(q)) {
        return { intent: 'batch_group_query', searchTerm: null, table: 'groups', includePersonality: true };
      }
      // Catch-all: any remaining query with batch/group/program that wasn't handled above
      // Route to batch handler which has a text-to-sql fallback
      {
        let name: string | null = null;
        const pm = question.match(/\(([^)]+)\)?/);
        if (pm) name = pm[1].trim();
        if (!name) {
          const nm = question.match(/\b(?:batch|group|program)\s+(?:named?\s+)?["']?([A-Za-z0-9_\-]+)["']?/i);
          if (nm) name = nm[1].trim();
        }
        const tbl = /\bprogram\b/i.test(q) ? 'programs' : 'groups';
        return { intent: 'batch_group_query', searchTerm: name, table: tbl, includePersonality: true };
      }
    }

    // Career report for someone
    // SAFETY: Exclude program/batch/group queries (already handled above)
    if (/\b(career\s*report|future\s*role|role\s*readiness)\b/.test(q) ||
        (/\bgenerate.*report\b/.test(q) && !batchGroupProgramGuard.test(q))) {
      const name = this.extractName(question);
      return { intent: 'career_report', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
    }

    // "report for [name]" / "test report for [name]" / "assessment report for [name]"
    // Priority: extract the person's name AFTER "for" keyword
    if (/\breport\b/i.test(q) && /\b(for|of|about)\s+/i.test(q)) {
      const name = this.extractName(question);
      if (name) {
        // Only route to person_lookup if explicitly asking for test RESULTS/SCORES (not just "test report")
        const isTestResults = /\b(test\s+results?|test\s+scores?|assessment\s+results?|exam\s+results?|exam\s+scores?|score\s+details?)\b/i.test(q);
        return {
          intent: isTestResults ? 'person_lookup' : 'career_report',
          searchTerm: name,
          table: 'assessment_attempts',
          includePersonality: true,
        };
      }
    }

    // "[Name(s)] report" — e.g. "DINESH S J and PRAKASH B report", "dinesh report"
    if (/\breport\b/i.test(q)) {
      // First try extractName which is smarter about finding actual person names
      const nameFromExtract = this.extractName(question);
      if (nameFromExtract) {
        const isTestResults = /\b(test\s+results?|test\s+scores?|assessment\s+results?|exam\s+results?|exam\s+scores?|score\s+details?)\b/i.test(q);
        return {
          intent: isTestResults ? 'person_lookup' : 'career_report',
          searchTerm: nameFromExtract,
          table: 'assessment_attempts',
          includePersonality: true,
        };
      }

      // Fallback: extract text before "report" as the name
      const beforeReport = question.replace(/\s*report\b.*/i, '').trim();
      // Filter out question phrases like "what is the", "what are the", "show me the", etc.
      let cleanedBeforeReport = beforeReport
        .replace(/^(what\s+(is|are)\s+(the|a|an)?\s*)/i, '')
        .replace(/^(show\s+me\s+(the)?\s*)/i, '')
        .replace(/^(give\s+me\s+(the)?\s*)/i, '')
        .replace(/^(tell\s+me\s+(the)?\s*)/i, '')
        .replace(/^(i\s+(want|need)\s+(the|a)?\s*)/i, '')
        .replace(/^(can\s+(you|i)\s+(get|show|see)\s+(the)?\s*)/i, '')
        .trim();
      // Strip trailing domain/stop words that aren't names (e.g. "sriharan test" → "sriharan")
      const trailingStopWords = /\s+(test|exam|assessment|career|score|result|results|detail|details|data|profile|information|info|the|a|an|for|of|about)$/i;
      while (trailingStopWords.test(cleanedBeforeReport)) {
        cleanedBeforeReport = cleanedBeforeReport.replace(trailingStopWords, '').trim();
      }
      // Also strip leading stop words
      const leadingStopWords = /^(test|exam|assessment|career|score|result|results|detail|details|the|a|an)\s+/i;
      while (leadingStopWords.test(cleanedBeforeReport)) {
        cleanedBeforeReport = cleanedBeforeReport.replace(leadingStopWords, '').trim();
      }
      if (cleanedBeforeReport.length >= 2 && !/^(show|get|list|create|generate|overall|custom|my|test|exam|assessment)$/i.test(cleanedBeforeReport)) {
        const isTestResults = /\b(test\s+results?|test\s+scores?|assessment\s+results?|exam\s+results?|exam\s+scores?|score\s+details?)\b/i.test(q);
        return {
          intent: isTestResults ? 'person_lookup' : 'career_report',
          searchTerm: cleanedBeforeReport,
          table: 'assessment_attempts',
          includePersonality: true,
        };
      }
    }

    // "best/top candidate for [role]" → jd_candidate_match (role-specific)
    if (/\b(best|top|ideal)\s*(candidate|performer|person|employee|resource|member)s?\s+(for|to)\s+\w/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Best/top performer (generic, no specific role)
    if (/\b(best|top|highest)\s*(performer|score|candidate|student|result|employee|resource|member)s?\b/i.test(q) ||
      /\b(show|list|get)\s*(top|best)\b/i.test(q) ||
      /\b(best|top)\s*(employee|resource|member)s?\b/i.test(q) ||
      /\btop\s*\d+\b/.test(q)) {
      return { intent: 'best_performer', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Count — "how many users/candidates/students/male/female/corporate/admin" / "total candidates" / "total male and female"
    // GUARD: If asking "how many [people] suit/fit for [role]" → jd_candidate_match, not count
    if (/\b(how\s*many|count|total)\b/i.test(q) && /\b(suits?|fit|suitable|suited|eligible|qualified|ready|right|ideal|match)\b/i.test(q) && /\b(for|to)\s+\w/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }
    if (/\b(how\s*many|count|total\s*number)\b/.test(q) || /\btotal\s+(candidate|candidates|student|students|user|users|male|female|people|resource|employee|member|registration|count|number)s?\b/i.test(q)) {
      // Detect role-based count (corporate, admin, student breakdown)
      const rolesRequested: string[] = [];
      if (/\b(corporate|corporates|company|companies)\b/i.test(q)) rolesRequested.push('CORPORATE');
      if (/\badmin\b/i.test(q)) rolesRequested.push('ADMIN');
      if (/\bstudent\b/i.test(q)) rolesRequested.push('STUDENT');
      if (/\baffiliate\b/i.test(q)) rolesRequested.push('AFFILIATE');
      if (rolesRequested.length > 0) {
        const result: any = { intent: 'count_by_role', searchTerm: null, table: 'users', includePersonality: false };
        result.roles = rolesRequested;
        return result;
      }

      // Detect "corporate logins/accounts" or "company accounts" specifically
      if (/\b(corporate|company)\s*(login|account|user)s?\b/i.test(q)) {
        const result: any = { intent: 'count_by_role', searchTerm: null, table: 'users', includePersonality: false };
        result.roles = ['CORPORATE'];
        return result;
      }

      const table = /user|login|account/i.test(q) ? 'users' : /candidate|registration|student|resource|employee|people|member/i.test(q) ? 'registrations' : 'registrations';
      // Extract gender filter
      const hasMale = /\b(male|boys?|men)\b/i.test(q);
      const hasFemale = /\b(female|girls?|women)\b/i.test(q);
      const result: any = { intent: 'count', searchTerm: null, table, includePersonality: false };
      if (hasMale && hasFemale) {
        result.genderBreakdown = true;
        result.table = 'registrations';
      } else if (hasMale) {
        result.gender = 'MALE';
      } else if (hasFemale) {
        result.gender = 'FEMALE';
      }
      return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // SYNONYM-AWARE PATTERNS (after normalizeQuery: employee→candidate)
    // ═══════════════════════════════════════════════════════════════
    // "my candidate(s)" / "about my candidate(s)" / "know about my candidate(s)"
    if (/\b(my|about\s+my|know\s+about\s+my|need\s+to\s+know\s+about\s+my)\s+candidates?\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // "my resource(s)" / "my employee(s)" / "my people" / "my team" / "my staff"
    if (/\b(my\s+resources?|my\s+employees?|my\s+people|my\s+team|my\s+staff|my\s+members?)\b/i.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // "list resource(s)" / "show resource(s)" / "list employees" / "show employees"
    if (/\b(list|show|get|display)\s+(all\s+)?(resource|employee|member|staff|people)s?\b/i.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // "about candidate(s)" / "know about candidate(s)" (without a specific name)
    if (/\b(about|know\s+about|tell\s+me\s+about|information\s+about)\s+candidates?\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // "list of candidate(s)" / "list of the candidate(s)"
    if (/\blist\s+(?:of\s+)?(?:the\s+)?candidates?\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }
    // "candidate(s) for [role]" / "candidate's for [role]" — find matching candidates
    if (/\bcandidates?(?:'s)?\s+(?:for|fit\s+for|suitable\s+for)\s+/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // List users (but NOT if the query has domain words — already handled above)
    if ((/\b(list|show|get)\b.*\busers?\b/.test(q) || /^users?\b/.test(q))) {
      return { intent: 'list_users', searchTerm: null, table: 'users', includePersonality: false };
    }

    // List candidates/students/registrations
    if (/\b(list|show|get)\b.*\b(candidate|registration|student)s?\b/.test(q) || /^candidates?\b/.test(q)) {
      return { intent: 'list_candidates', searchTerm: null, table: 'registrations', includePersonality: false };
    }

    // Career roles
    if (/\b(career\s*roles?|job\s*roles?)\b/.test(q) && !/\b(my|eligible|suitable|fit)\b/.test(q)) {
      return { intent: 'career_roles', searchTerm: null, table: 'career_roles', includePersonality: false };
    }

    // ═══════════════════════════════════════════════════════════════
    // CORPORATE DETAILS — List/show corporate accounts/companies
    // ═══════════════════════════════════════════════════════════════
    // "list corporates", "corporate accounts", "show companies", "corporate details"
    if (/\b(list|show|get|display)\s+(all\s+)?(the\s+)?(corporate|company|companies|corporates|corporate\s+account)/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // Bare "companies" or "the companies" or "all companies"
    if (/^(the\s+)?companies\s*\??$/i.test(q) || /^(all\s+)?companies\s*$/i.test(q) || /^corporates\s*\??$/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "what are the companies", "what companies are there", "which companies", "what are the companies are there"
    if (/\b(what|which)\b.*\b(companies|corporates?|organizations?)\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "tell about [name] company", "about [name] company/corporate/organization"
    // Extract company name and route to corporate_details with searchTerm
    {
      const companyNameMatch = q.match(/\b(?:tell|know|learn|inform)\s+(?:me\s+)?(?:about|bout)\s+(?:the\s+)?(.+?)\s+(?:company|corporate|organization|business)\b/i)
        || q.match(/\babout\s+(?:the\s+)?(.+?)\s+(?:company|corporate|organization|business)\b/i);
      if (companyNameMatch && companyNameMatch[1]) {
        const companyName = companyNameMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
        if (companyName && companyName.length >= 2) {
          return { intent: 'corporate_details', searchTerm: companyName, table: 'corporate_accounts', includePersonality: false };
        }
      }
    }
    // "[name] company details", "[name] company info"
    {
      const companyInfoMatch = q.match(/^(.+?)\s+(?:company|corporate)\s+(?:detail|info|data|profile)s?\b/i);
      if (companyInfoMatch && companyInfoMatch[1]) {
        const companyName = companyInfoMatch[1].replace(/^(the|a|an|about|tell|show|get)\s+/gi, '').trim();
        if (companyName && companyName.length >= 2) {
          return { intent: 'corporate_details', searchTerm: companyName, table: 'corporate_accounts', includePersonality: false };
        }
      }
    }
    // "how many companies", "total companies", "number of companies"
    if (/\b(how\s+many|count|total|number\s+of)\s+(companies|corporates|corporate\s+accounts?)\b/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "corporate details", "company details", "corporate info"
    if (/\b(corporate|company|companies)\s+(detail|info|account|data|profile)s?\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "what is our company", "what is my company", "tell me about our company"
    if (/\b(what\s+is|what's|tell\s+me\s+about|about)\s+(my|our)\s+(company|corporate|organization|business)\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "my company", "my corporate", "my organization" (for corporate users)
    if (/\b(my\s+company|my\s+corporate|my\s+organization|my\s+business)\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "company details", "my company details", "our company", "our organization"
    if (/\b(our\s+company|our\s+organization|our\s+corporate|company\s+profile|company\s+information)\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }
    // "how many credits", "credit balance", "available credits" — corporate credit queries
    if (/\b(credit|credits)\s*(balance|available|remaining|total|left)?\b/i.test(q) || /\b(available|remaining|total)\s+credits?\b/i.test(q)) {
      return { intent: 'corporate_details', searchTerm: null, table: 'corporate_accounts', includePersonality: false };
    }

    // Personal info: "my name", "my profile", "who am I"
    if (/\b(my\s*name|my\s*profile|who\s*am\s*i)\b/.test(q)) {
      return { intent: 'personal_info', searchTerm: null, table: 'none', includePersonality: false };
    }

    // My results / my score / my details — dedicated self_results intent
    if (/\b(my\s*result|my\s*score|my\s*test|my\s*assessment|my\s*exam|my\s*data|my\s*details?|my\s*report)\b/.test(q)) {
      return { intent: 'self_results', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "show me my ..." or "what are my ..." (student self-queries)
    if (/\b(show|get|display|what\s+are)\b.*\bmy\s+(result|score|test|assessment|detail|data)\b/.test(q)) {
      return { intent: 'self_results', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // Guardrail: career/skills informational queries must NEVER become person lookup.
    if ((/\bskills?\s+(for|to|needed|required|of|in)\b/.test(q) ||
      /\bcareer\s*paths?\b/.test(q) ||
      /\b(ask|tell)\s+me\s+about\b/.test(q)) &&
      !/\b(my|candidate|registration|student|user|employee|resource|company|corporate|organization|score|result|assessment|test|list|show|get|count|how\s+many)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // Test results / test report for a specific person
    if (/\b(test|exam|assessment)\s*(result|score|report)s?\b/.test(q) || /\bresults?\b/.test(q)) {
      const name = this.extractName(question);
      return { intent: name ? 'person_lookup' : 'test_results', searchTerm: name, table: 'assessment_attempts', includePersonality: true };
    }

    // Person lookup: "[name]'s score" or "show [name]" or "[name] report"
    const possibleName = this.extractName(question);
    if (possibleName && /\b(score|result|detail|profile|report)\b/.test(q)) {
      return { intent: 'person_lookup', searchTerm: possibleName, table: 'assessment_attempts', includePersonality: true };
    }

    // ═══════════════════════════════════════════════════════════════
    // DATA_QUERY — Dynamic SQL questions that don't fit fixed intents
    // Complex filters, aggregations, comparisons, date ranges, etc.
    // ═══════════════════════════════════════════════════════════════

    // "average score", "mean score", "score distribution", "score breakdown"
    if (/\b(average|mean|median|sum|min|max|total|distribution|breakdown|range)\s+(score|marks?|result|rating|percentage|attempt)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "candidates who scored above/below X", "score greater than X"
    if (/\b(score[ds]?\s+(above|below|more|less|greater|over|under|between|higher|lower))\b/i.test(q) ||
        /\b(above|below|more\s+than|less\s+than|greater\s+than|over|under|between)\s+\d+/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "female candidates who...", "male candidates with...", gender + filter combos
    if (/\b(male|female)\s+(candidate|student|user|people|person)s?\s+(who|with|that|having|above|below|scored)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "completed last week/month", "registered this month", "joined between"
    if (/\b(completed|registered|joined|created|started|finished|attempted)\s+(last|this|in|between|during|before|after|since|from)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "group by personality", "by department", "per corporate", "by gender"
    if (/\b(group\s+by|grouped\s+by|per|by\s+each|breakdown\s+by|categorize|split\s+by|segment\s+by)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "compare scores", "comparison between", "difference in scores"
    if (/\b(compare|comparison|difference\s+in|contrast)\b.*\b(score|result|candidate|personality|group|department|corporate)\b/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "which department/corporate/group has the most/least candidates"
    if (/\b(which|what)\s+(department|corporate|group|company|organization)\s+(has|have|had|with)\s+(the\s+)?(most|least|highest|lowest|maximum|minimum)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "personality type distribution", "personality breakdown", "OCEAN scores"
    if (/\b(personality|trait|OCEAN|openness|conscientiousness|extraversion|agreeableness|neuroticism)\s+(type|distribution|breakdown|analysis|pattern|score)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "candidates with/without email", "users who have/haven't", complex filters
    if (/\b(candidate|student|user|registration)s?\s+(with|without|who\s+have|who\s+haven't|that\s+have|that\s+don't|having|lacking|missing)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "percentage of", "ratio of", "proportion of"
    if (/\b(percentage|ratio|proportion|rate)\s+of\b/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // ═══════════════════════════════════════════════════════════════
    // DATA_QUERY — Additional patterns for real-world user questions
    // Covers common ways admins, corporate users, and students ask
    // ═══════════════════════════════════════════════════════════════

    // "who completed", "who registered", "who scored", "who passed", "who failed"
    if (/\bwho\s+(completed|registered|scored|passed|failed|attempted|took|finished|signed)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "list candidates suitable for X / fit for X" — with typo tolerance (already corrected by normalizeQuery)
    if (/\b(suitable|fit|eligible|qualified|ready)\s+(for|to)\s+\w+/i.test(q) && /\b(candidate|student|people|person)/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "find candidates for [role]", "match candidates to [role]"
    if (/\b(find|match|identify|suggest|recommend)\s+(candidate|student|people|person)s?\s+(for|to|who|that|suitable)/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "which candidate is suitable for X", "who is suitable for X"
    if (/\b(which|who)\s+(candidate|student|person|people)\s+(is|are)\s+(suitable|fit|eligible|qualified|best|good|ready)\s+(for|to)/i.test(q)) {
      return { intent: 'jd_candidate_match', searchTerm: null, table: 'assessment_attempts', includePersonality: true };
    }

    // "today's registrations", "weekly stats", "monthly report", "this week candidates"
    if (/\b(today|yesterday|this\s+week|last\s+week|this\s+month|last\s+month|this\s+year)\b/i.test(q) &&
        /\b(registration|candidate|user|assessment|completed|score|count|stat|report|data)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "show stats", "show analytics", "show dashboard", "show summary", "give me overview"
    if (/\b(show|give|get|display)\s+(me\s+)?(stats|statistics|analytics|dashboard|summary|overview|metrics|numbers|data)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "latest candidates", "recent registrations", "newest users", "last 10 candidates"
    if (/\b(latest|recent|newest|last\s+\d+|first\s+\d+|top\s+\d+)\s+(candidate|registration|user|assessment|student|attempt|result)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "age distribution", "age wise", "age group", "age range"
    if (/\bage\s+(distribution|wise|group|range|breakdown|analysis)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "gender distribution", "gender ratio", "gender breakdown", "male vs female"
    if (/\b(gender|male\s+vs\s+female|male.*female|female.*male)\s*(distribution|ratio|breakdown|split|comparison|count)?/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // "inactive candidates", "pending assessments", "incomplete assessments"
    if (/\b(inactive|pending|incomplete|unfinished|not\s+completed|abandoned)\s+(candidate|assessment|registration|student|attempt)/i.test(q)) {
      return { intent: 'data_query', searchTerm: null, table: 'registrations', includePersonality: true };
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERAL KNOWLEDGE / EDUCATION / HOW-TO QUESTIONS
    // These must NEVER hit the database — route to LLM directly
    // ═══════════════════════════════════════════════════════════════

    // "what is X", "what are X", "what does X mean"
    if (/^(what|who|why|when|where)\s+(is|are|does|do|was|were|would|could|should|can|will)\b/.test(q) &&
      !/\b(my |user|candidate|registration|result|score|attempt|corporate|corporates|company|companies|organization|list|show|get|count|how many)\b/.test(q)) {
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
      (/\btell\s+me\s+about\b/.test(q) && !/\b(my|his|her|their|candidate|user|company|companies|corporate|corporates|organization|\w+'s)\b/.test(q))) {
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

    // "ask me about X" — informational request, not a person lookup
    if (/\b(ask|tell)\s+me\s+about\b/.test(q) &&
      !/\b(my|his|her|their|candidate|user|company|companies|corporate|corporates|organization|\w+'s)\b/.test(q)) {
      return { intent: 'general_knowledge', searchTerm: null, table: 'none', includePersonality: false };
    }

    // "salary of", "job market", "industry trends", "career path(s)"
    if (/\b(salary|compensation|pay|job\s*market|industry\s*trends?|career\s*paths?|career\s*options?|job\s*prospects?|job\s*opportunities|future\s+of|scope\s+of|demand\s+for|interview\s+questions?|resume\s+tips?)\b/.test(q)) {
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

  private shouldBypassResponseCache(question: string): boolean {
    const q = (question || '').toLowerCase().trim();
    if (!q) return true;
    if (q.length <= 3) return true;
    if (q.includes('@')) return true;

    // Personal/self and person-specific report queries should not be cached,
    // because they are identity/context-sensitive and stale cache causes wrong answers.
    if (/\bwhat is my name\b|\bwho am i\b|\bmy email\b|\bmy profile\b|\bmy account\b/.test(q)) return true;
    if (/\breport\b|\bprofile\b|\bdetails\b|\bresults\b/.test(q) && /\b(my|for|about)\b|^[a-z][a-z\s.'-]{1,40}\s+report\b/.test(q)) return true;

    return false;
  }

  /**
   * Detect role/topic phrases that can be mistaken for person names.
   */
  private isLikelyRoleOrTopicPhrase(text: string): boolean {
    const value = (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!value) return false;

    const roleIndicators = [
      'analyst', 'engineer', 'developer', 'manager', 'architect', 'consultant',
      'specialist', 'scientist', 'designer', 'administrator', 'officer', 'executive',
      'lead', 'intern', 'cfo', 'ceo', 'cto', 'coo', 'hr',
    ];
    const domainIndicators = [
      'data', 'business', 'financial', 'software', 'network', 'security', 'cloud',
      'marketing', 'sales', 'operations', 'product', 'project', 'frontend', 'backend',
      'full stack', 'devops', 'machine learning', 'artificial intelligence', 'ai',
      'career', 'skills', 'path', 'paths', 'job', 'role', 'technology',
    ];

    const hasRoleIndicator = roleIndicators.some((k) => value.includes(k));
    const hasDomainIndicator = domainIndicators.some((k) => value.includes(k));
    const words = value.split(' ').filter(Boolean);

    if (hasRoleIndicator && hasDomainIndicator) return true;
    if (hasRoleIndicator && words.length <= 4) return true;
    if (/\bcareer\s+paths?\b/.test(value) || /\bskills?\s+for\b/.test(value)) return true;

    return false;
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

    // Guardrail: keep informational skill/career prompts in general knowledge.
    if (qLowerUniq.match(/\bskills?\s+(for|to|needed|required|of|in)\b/) ||
      qLowerUniq.match(/\bcareer\s*paths?\b/) ||
      qLowerUniq.match(/\b(ask|tell)\s+me\s+about\b/)) {
      return {
        intent: 'general_knowledge',
        searchTerm: null,
        table: 'none',
        includePersonality: false,
      };
    }

    // Default - try to find a name
    const name = this.extractName(question);
    if (name && !this.isLikelyRoleOrTopicPhrase(name)) {
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
      // "for Jaya Krishna Reddy #1" → "Jaya Krishna Reddy #1"
      /(?:for|about|bout|of)\s+((?:[A-Za-z]+\.?\s*){1,4}(?:\s*#\s*\d+)?)/i,
      // "Jaya Krishna's score" → "Jaya Krishna"
      /((?:[A-Za-z]+\.?\s+){0,3}[A-Za-z]+)'s?\s+(?:test|exam|score|result|detail|report|profile|data)/i,
      // "show Jaya Krishna" → "Jaya Krishna"
      /(?:show|get|find|search|display)\s+((?:[A-Za-z]+\.?\s*){1,4})(?:'s)?/i,
      // "results of S. Rajesh" → "S. Rajesh"
      /(?:results?|scores?|details?|report|profile|data)\s+(?:of|for)\s+((?:[A-Z]\.?\s*)?(?:[A-Za-z]+\s*){1,3})/i,
      // "know about jai" → "jai"
      /(?:know|tell|learn)\s+(?:about|bout)\s+((?:[A-Za-z]+\.?\s*){1,4})/i,
      // Simple: "for ajay" → "ajay" (single word fallback)
      /(?:for|about|bout|of)\s+([A-Za-z]+(?:\s*#\s*\d+)?)/i,
    ];

    const stopWords = new Set([
      'test', 'exam', 'score', 'result', 'results', 'user', 'users',
      'all', 'the', 'show', 'get', 'list', 'find', 'best', 'top',
      'my', 'their', 'our', 'your', 'his', 'her', 'its',
      'this', 'that', 'these', 'those', 'some', 'any',
      'career', 'report', 'details', 'data', 'profile',
      'candidate', 'candidates', 'student', 'students',
      'assessment', 'overall', 'custom', 'placement',
      // Domain terms that should NEVER be treated as person names
      'employee', 'employees', 'resource', 'resources',
      'member', 'members', 'staff', 'worker', 'workers',
      'people', 'person', 'team', 'everyone', 'everybody',
      'company', 'organization', 'organisation', 'department',
      'corporate', 'business', 'employer', 'companies', 'corporates',
      'development', 'developer', 'engineering', 'full', 'stack',
      'frontend', 'backend', 'manager', 'lead', 'senior', 'junior',
      'analyst', 'analysts', 'engineer', 'engineers', 'scientist', 'scientists',
      'architect', 'architects', 'consultant', 'consultants', 'specialist', 'specialists',
      'role', 'position', 'job', 'work', 'tasks', 'skill', 'skills',
      'information', 'info', 'help', 'status', 'count',
      // Gender terms — NOT person names
      'male', 'female', 'males', 'females', 'boys', 'girls', 'men', 'women',
      'boy', 'girl', 'man', 'woman',
      // Program / batch / group / report terms — NOT person names
      'program', 'programs', 'batch', 'batches', 'group', 'groups',
      'summary', 'summarize', 'report', 'version', 'principal', 'generate',
      'readiness', 'strengths', 'risks', 'overview', 'students', 'school',
      // Follow-up / structural words — NOT person names
      'along', 'with', 'without', 'including', 'education', 'qualification',
      'qualifications', 'experience', 'details', 'detail', 'score', 'scores',
      'path', 'paths', 'career', 'careers',
    ]);

    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        // Clean up: trim trailing punctuation and whitespace
        let name = match[1].replace(/[.,;:!?]+$/, '').trim();
        // Remove trailing stop words (e.g. "show Anjaly details" → "Anjaly")
        const words = name.split(/\s+/);
        while (words.length > 0 && stopWords.has(words[words.length - 1].toLowerCase())) {
          words.pop();
        }
        // Remove leading articles/stop words (e.g. "the touchmark" → "touchmark")
        while (words.length > 0 && stopWords.has(words[0].toLowerCase())) {
          words.shift();
        }
        name = words.join(' ').trim();

        // SAFETY: If the original query contains company/corporate/organization after the extracted name,
        // this is a company query, NOT a person query — return null
        if (/\b(company|corporate|organization|business|employer)\b/i.test(question)) {
          return null;
        }

        // SAFETY: If the query contains program/batch/group keywords, it's about a program/group, NOT a person
        if (/\b(program|batch|group|summarize|summary|readiness|strengths|risks|principal\s+version)\b/i.test(question)) {
          return null;
        }

        if (name && !stopWords.has(name.toLowerCase()) && name.length >= 2 && !this.isLikelyRoleOrTopicPhrase(name)) {
          return name;
        }
      }
    }
    return null;
  }

  /**
   * Determines if the query is asking about a specific person
   * (as opposed to a generic concept question like "what is a CFO?").
   * Uses pronoun signals, conversation context, and name detection.
   */
  /**
   * Check if searchTerm matches as a complete word/token in any result's name.
   * Returns true if at least one result contains the search term as a whole word.
   * Used to distinguish exact matches ("jai" in "JAI KUMAR") from fuzzy substring
   * matches ("jai" in "JAISHREE M") when falling back to ILIKE.
   */
  private hasExactTokenMatch(searchTerm: string, results: any[], nameField = 'full_name'): boolean {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return results.some(r => regex.test(r[nameField]));
  }

  /**
   * Build a "Did you mean?" disambiguation response for fuzzy ILIKE matches.
   */
  private buildFuzzyDisambiguation(searchTerm: string, results: any[], searchType: string): QueryResult {
    let response = `**🔍 No exact match found for "${searchTerm}".**\n\n`;
    if (results.length === 1) {
      response += `Did you mean **${results[0].full_name}**?\n\n`;
      response += `If yes, try: *"${searchTerm === results[0].full_name ? searchTerm : results[0].full_name}"*\n`;
      response += `Or use the full name for a precise match.`;
    } else {
      response += `These candidates have similar names:\n\n`;
      results.slice(0, 5).forEach((person: any, index: number) => {
        const email = person.email ? ` | ${person.email}` : '';
        response += `**${index + 1}.** ${person.full_name}${email}\n`;
      });
      response += `\nPlease use the **full name** or reply with the number (e.g. **1** or **2**).`;
    }
    return { answer: response, searchType, confidence: 0.6 };
  }

  private isPersonSpecificQuery(question: string, ctx: any): boolean {
    const q = question.toLowerCase();

    // ── Domain terms that are NEVER person names ──
    // If the "name" extracted from the query is one of these, it's a domain question, NOT person-specific.
    const domainTerms = new Set([
      'employee', 'employees', 'candidate', 'candidates', 'student', 'students',
      'resource', 'resources', 'member', 'members', 'staff', 'worker', 'workers',
      'people', 'person', 'team', 'everyone', 'everybody',
      'company', 'organization', 'organisation', 'department',
      'corporate', 'business', 'employer', 'companies', 'corporates',
      // Batch / group / program terms
      'batch', 'batches', 'group', 'groups', 'program', 'programs',
      'summary', 'summarize', 'overview', 'readiness', 'strengths', 'risks',
      'principal', 'version', 'generate', 'school',
      'development', 'developer', 'engineering', 'full stack', 'frontend', 'backend',
      'manager', 'lead', 'senior', 'junior', 'role', 'position', 'job',
      'skill', 'skills', 'information', 'info', 'help', 'status', 'assessment',
      'result', 'results', 'score', 'scores', 'report', 'data', 'details',
      'career', 'work', 'performance', 'performer', 'performers',
      'user', 'users', 'account', 'accounts', 'registration', 'registrations',
    ]);

    // Helper: check if the text after "about/for" is a domain term, not a person
    const getObjectOfPrep = (text: string): string | null => {
      const match = text.match(/\b(?:about|bout|regarding|for|of)\s+((?:\w+\s*){1,4})/i);
      return match ? match[1].trim().toLowerCase() : null;
    };

    const objectText = getObjectOfPrep(q);
    if (objectText) {
      // Check each word and the full phrase against domain terms
      const objectWords = objectText.split(/\s+/);
      const allAreDomainTerms = objectWords.every(w => domainTerms.has(w));
      if (allAreDomainTerms) {
        this.logger.log(`🛡️ Person guard skipped: "${objectText}" is a domain term, not a person name`);
        return false;
      }
      // Also check combined phrases like "full stack development"
      if (domainTerms.has(objectText)) {
        this.logger.log(`🛡️ Person guard skipped: "${objectText}" is a domain term`);
        return false;
      }
      // Check if it starts with "my" + domain term (e.g., "my employee", "my candidate")
      if (/^my\s+/i.test(objectText)) {
        const afterMy = objectText.replace(/^my\s+/i, '').trim();
        if (domainTerms.has(afterMy) || domainTerms.has(afterMy + 's')) {
          this.logger.log(`🛡️ Person guard skipped: "my ${afterMy}" is a domain reference, not a person name`);
          return false;
        }
      }
    }

    // Pronoun references to a person in conversation
    const pronounPatterns = /\b(him|her|his|hers|he|she|that person|that candidate|that student|this person)\b/i;
    if (pronounPatterns.test(q)) return true;

    // "know about/bout" or "want to know about" patterns — but ONLY if followed by a likely person name
    if (/\b(know|tell|learn|inform)\s+(about|bout|regarding)\b/i.test(q)) {
      // Check if what follows is NOT a domain concept
      if (objectText && !objectText.split(/\s+/).every(w => domainTerms.has(w))) {
        return true;
      }
      return false;
    }
    if (/\b(want|need|like)\s+to\s+know\b/i.test(q)) {
      if (objectText && !objectText.split(/\s+/).every(w => domainTerms.has(w))) {
        return true;
      }
      return false;
    }
    if (/\bwhat[s']?\s+.*\b(about|bout)\s+/i.test(q)) {
      if (objectText && !objectText.split(/\s+/).every(w => domainTerms.has(w))) {
        return true;
      }
      return false;
    }

    // Explicit "about <name>" or "asking about" patterns
    if (/\b(about|bout|regarding|for)\s+[A-Z][a-z]+/i.test(question)) {
      // Exclude generic concept queries like "about becoming a CFO"
      if (/\b(about|regarding)\s+(becoming|being|working|learning|studying|getting)/i.test(q)) return false;
      // Exclude domain term references
      if (objectText && objectText.split(/\s+/).every(w => domainTerms.has(w))) return false;
      return true;
    }

    // "does it suit him/her" or "is he/she suitable" patterns
    if (/\b(suit|suitable|fit|good for|ready for)\s+(him|her|them)\b/i.test(q)) return true;
    if (/\b(is|does)\s+(he|she)\b/i.test(q)) return true;

    // Conversation context has a person being discussed
    if (ctx?.lastPersonMentioned) {
      // Check if question references qualitative traits about a person
      if (/\b(make|become|role|position|suited|career|job|fitment|readiness)\b/i.test(q)) return true;
    }

    // "I'm asking about <name>" pattern
    if (/\b(asking|talking|enquiring|inquiring)\s+(about|bout|regarding)\b/i.test(q)) {
      if (objectText && !objectText.split(/\s+/).every(w => domainTerms.has(w))) {
        return true;
      }
      return false;
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOTAL COUNT FOR PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════
  private async getTotalCount(
    interpretation: { intent: string; table: string; searchTerm?: string | null },
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
        case 'self_results':
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
        case 'affiliate_referrals':
          if (userRole !== 'ADMIN') return 0;
          sql = `SELECT COUNT(*) as count FROM affiliate_referral_transactions`;
          break;
        case 'affiliate_payments':
          if (userRole !== 'ADMIN') return 0;
          sql = `SELECT COUNT(*) as count FROM affiliate_settlement_transactions`;
          break;
        case 'affiliate_list':
          if (userRole !== 'ADMIN') return 0;
          sql = `SELECT COUNT(*) as count FROM affiliate_accounts`;
          break;
        case 'affiliate_earnings':
          if (userRole !== 'ADMIN') return 0;
          sql = `SELECT COUNT(*) as count FROM affiliate_accounts WHERE is_active = true`;
          break;
        case 'affiliate_students':
          if (userRole !== 'ADMIN') return 0;
          if (interpretation.searchTerm) {
            sql = `SELECT COUNT(*) as count FROM affiliate_referral_transactions art JOIN affiliate_accounts aa ON art.affiliate_account_id = aa.id WHERE aa.name ILIKE $1`;
            params.push(`%${interpretation.searchTerm}%`);
          } else {
            sql = `SELECT COUNT(*) as count FROM affiliate_referral_transactions`;
          }
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
          sql = `SELECT full_name, gender, mobile_number, status FROM registrations WHERE is_deleted = false ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `SELECT full_name, gender, mobile_number, status FROM registrations WHERE is_deleted = false AND corporate_account_id = $1 ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
          params.push(corporateId);
        } else {
          sql = `SELECT full_name, gender, mobile_number, status FROM registrations WHERE is_deleted = false AND user_id = $1 LIMIT ${limit}`;
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
        } else if (userId && userId > 0) {
          sql = `${baseTestSql} AND registrations.user_id = $1 LIMIT ${limit} OFFSET ${offset}`;
          params.push(userId);
        } else if (user?.email) {
          // Fallback: email-based lookup when userId is 0
          sql = `${baseTestSql} AND registrations.user_id = (SELECT id FROM users WHERE email = $1 LIMIT 1) LIMIT ${limit} OFFSET ${offset}`;
          params.push(user.email);
        } else {
          this.logger.log('⚠️ test_results: No userId or email for student scoping');
          return [];
        }
        break;
      }

      case 'self_results': {
        // Dedicated intent for "my results" / "my score" — always user-scoped
        // Joins assessment_answers for detailed per-question stats
        const selfSincFields = this.getSinceritySelectFields('assessment_attempts');
        const selfResultSql = `
          SELECT 
            registrations.full_name,
            registrations.registration_source,
            assessment_attempts.id as attempt_id,
            assessment_attempts.total_score,
            assessment_attempts.max_score_snapshot,
            ${selfSincFields},
            assessment_attempts.status,
            assessment_attempts.completed_at,
            assessment_attempts.started_at,
            personality_traits.blended_style_name as behavioral_style,
            personality_traits.blended_style_desc as behavior_description,
            programs.name as program_name,
            (SELECT COUNT(*) FROM assessment_answers WHERE assessment_attempt_id = assessment_attempts.id) as total_questions,
            (SELECT COUNT(*) FROM assessment_answers WHERE assessment_attempt_id = assessment_attempts.id AND status = 'ANSWERED') as answered_questions,
            (SELECT COALESCE(SUM(answer_score), 0) FROM assessment_answers WHERE assessment_attempt_id = assessment_attempts.id) as total_answer_score,
            (SELECT COALESCE(SUM(time_spent_seconds), 0) FROM assessment_answers WHERE assessment_attempt_id = assessment_attempts.id) as total_time_spent_seconds,
            (SELECT COUNT(*) FROM assessment_answers WHERE assessment_attempt_id = assessment_attempts.id AND answer_score > 0) as correct_answers
          FROM assessment_attempts
          JOIN registrations ON assessment_attempts.registration_id = registrations.id
          LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
          LEFT JOIN programs ON assessment_attempts.program_id = programs.id
          WHERE assessment_attempts.status = 'COMPLETED' AND registrations.is_deleted = false`;

        if (userId && userId > 0) {
          sql = `${selfResultSql} AND registrations.user_id = $1 ORDER BY assessment_attempts.completed_at DESC LIMIT 5`;
          params.push(userId);
        } else if (user?.email) {
          // Fallback: use email when userId is 0
          sql = `${selfResultSql} AND registrations.user_id = (SELECT id FROM users WHERE email = $1 LIMIT 1) ORDER BY assessment_attempts.completed_at DESC LIMIT 5`;
          params.push(user.email);
        } else {
          this.logger.log('⚠️ self_results: No userId or email — cannot scope');
          return [];
        }
        break;
      }

      case 'person_lookup': {
        // If person_lookup but no searchTerm, ask for clarification instead of returning broad data
        if (!interpretation.searchTerm) {
          this.logger.log('⚠️ person_lookup with no searchTerm — returning clarification');
          return [];
        }
        const searchName = interpretation.searchTerm || '';
        const lookupSincFields = this.getSinceritySelectFields('assessment_attempts');
        const baseLookupSql = `
          SELECT 
            registrations.id as reg_id,
            registrations.full_name,
            registrations.gender,
            registrations.mobile_number,
            assessment_attempts.total_score,
            ${lookupSincFields},
            assessment_attempts.status,
            assessment_attempts.completed_at,
            personality_traits.blended_style_name as behavioral_style,
            personality_traits.blended_style_desc as behavior_description,
            programs.name as program_name,
            users.email
          FROM registrations
          LEFT JOIN users ON registrations.user_id = users.id
          LEFT JOIN assessment_attempts ON assessment_attempts.registration_id = registrations.id
            AND assessment_attempts.status = 'COMPLETED'
          LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
          LEFT JOIN programs ON assessment_attempts.program_id = programs.id
          WHERE registrations.is_deleted = false`;

        // Use word-boundary regex for precise name matching (prevents "jai" → "JAISHREE")
        if (userRole === 'ADMIN') {
          sql = `${baseLookupSql} AND registrations.full_name ~* $1 ORDER BY registrations.full_name, assessment_attempts.completed_at DESC NULLS LAST LIMIT 20`;
          params.push(`\\m${searchName}\\M`);
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `${baseLookupSql} AND registrations.full_name ~* $1 AND registrations.corporate_account_id = $2 ORDER BY registrations.full_name, assessment_attempts.completed_at DESC NULLS LAST LIMIT 20`;
          params.push(`\\m${searchName}\\M`, corporateId);
        } else {
          // Students can only see themselves — ignore search term
          sql = `${baseLookupSql} AND registrations.user_id = $1 LIMIT 1`;
          params.push(userId);
        }

        // Execute the word-boundary query
        try {
          const exactResults = await this.executeDatabaseQuery(sql, params);
          if (exactResults.length > 0) return exactResults;
        } catch (e) {
          this.logger.warn(`Word-boundary search failed: ${e.message}`);
        }

        // Fallback: ILIKE fuzzy match if word-boundary returned 0
        this.logger.log(`🔄 person_lookup: word-boundary match for "${searchName}" returned 0, falling back to ILIKE`);
        params.length = 0;
        if (userRole === 'ADMIN') {
          sql = `${baseLookupSql} AND registrations.full_name ILIKE $1 ORDER BY registrations.full_name, assessment_attempts.completed_at DESC NULLS LAST LIMIT 20`;
          params.push(`%${searchName}%`);
        } else if (userRole === 'CORPORATE' && corporateId) {
          sql = `${baseLookupSql} AND registrations.full_name ILIKE $1 AND registrations.corporate_account_id = $2 ORDER BY registrations.full_name, assessment_attempts.completed_at DESC NULLS LAST LIMIT 20`;
          params.push(`%${searchName}%`, corporateId);
        } else {
          sql = `${baseLookupSql} AND registrations.user_id = $1 LIMIT 1`;
          params.push(userId);
        }
        break;
      }

      case 'career_roles':
        sql = `SELECT career_role_name, short_description FROM career_roles WHERE is_deleted = false AND is_active = true ORDER BY career_role_name ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'count': {
        // Extract gender filter from searchTerm (set by ask() method)
        const genderFilter = (interpretation as any).gender;
        const genderBreakdown = (interpretation as any).genderBreakdown;
        let genderClause = '';

        // ── Gender breakdown: "total male and female" → return both counts ──
        if (genderBreakdown) {
          if (userRole === 'ADMIN') {
            sql = `SELECT gender, COUNT(*) as count FROM registrations WHERE is_deleted = false AND gender IS NOT NULL GROUP BY gender ORDER BY gender`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            params.push(corporateId);
            sql = `SELECT gender, COUNT(*) as count FROM registrations WHERE is_deleted = false AND corporate_account_id = $${params.length} AND gender IS NOT NULL GROUP BY gender ORDER BY gender`;
          } else {
            params.push(userId);
            sql = `SELECT gender, COUNT(*) as count FROM registrations WHERE is_deleted = false AND user_id = $${params.length} AND gender IS NOT NULL GROUP BY gender ORDER BY gender`;
          }
          break;
        }

        if (genderFilter) {
          params.push(genderFilter);
          genderClause = ` AND gender = $${params.length}`;
        }

        if (interpretation.table === 'users') {
          if (userRole !== 'ADMIN') {
            return [{ count: 0 }];
          }
          sql = `SELECT COUNT(*) as count FROM users`;
        } else if (interpretation.table === 'registrations') {
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false${genderClause}`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            params.push(corporateId);
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND corporate_account_id = $${params.length}${genderClause}`;
          } else {
            params.push(userId);
            sql = `SELECT COUNT(*) as count FROM registrations WHERE is_deleted = false AND user_id = $${params.length}${genderClause}`;
          }
        } else {
          if (userRole === 'ADMIN') {
            sql = `SELECT COUNT(*) as count FROM assessment_attempts aa JOIN registrations r ON aa.registration_id = r.id WHERE aa.status = 'COMPLETED' AND r.is_deleted = false${genderClause ? genderClause.replace('gender', 'r.gender') : ''}`;
          } else if (userRole === 'CORPORATE' && corporateId) {
            params.push(corporateId);
            sql = `SELECT COUNT(*) as count FROM assessment_attempts aa JOIN registrations r ON aa.registration_id = r.id WHERE aa.status = 'COMPLETED' AND r.is_deleted = false AND r.corporate_account_id = $${params.length}${genderClause ? genderClause.replace('gender', 'r.gender') : ''}`;
          } else {
            params.push(userId);
            sql = `SELECT COUNT(*) as count FROM assessment_attempts WHERE status = 'COMPLETED' AND user_id = $${params.length}`;
          }
        }
        break;
      }

      case 'count_by_role': {
        // Role-based user count breakdown (admin only for full view)
        if (userRole !== 'ADMIN') {
          return [{ role: userRole, count: 1, note: 'Only admins can view role breakdown' }];
        }
        const requestedRoles = (interpretation as any).roles as string[] || ['ADMIN', 'CORPORATE', 'STUDENT'];

        // For CORPORATE counts, use corporate_accounts (is_active = true) for accuracy
        // For other roles, use the users table
        if (requestedRoles.length === 1 && requestedRoles[0] === 'CORPORATE') {
          sql = `SELECT 'CORPORATE' as role, COUNT(*) as count FROM corporate_accounts WHERE is_active = true`;
        } else if (requestedRoles.includes('CORPORATE') && requestedRoles.length > 1) {
          // Mixed: union corporate_accounts count with users count for other roles
          const otherRoles = requestedRoles.filter(r => r !== 'CORPORATE');
          const otherPlaceholders = otherRoles.map((_: string, i: number) => `$${i + 1}`).join(', ');
          sql = `SELECT role, COUNT(*) as count FROM users WHERE role IN (${otherPlaceholders}) GROUP BY role
                 UNION ALL
                 SELECT 'CORPORATE' as role, COUNT(*) as count FROM corporate_accounts WHERE is_active = true
                 ORDER BY role`;
          params.push(...otherRoles);
        } else {
          const rolePlaceholders = requestedRoles.map((_: string, i: number) => `$${i + 1}`).join(', ');
          sql = `SELECT role, COUNT(*) as count FROM users WHERE role IN (${rolePlaceholders}) GROUP BY role ORDER BY role`;
          params.push(...requestedRoles);
        }
        break;
      }

      // ═══════════════════════════════════════════════════════════════
      // CORPORATE DETAILS — List corporate/company accounts
      // Supports: name search, RBAC scoping, corporateId fallback
      // ═══════════════════════════════════════════════════════════════
      case 'corporate_details': {
        const companySearchTerm = interpretation.searchTerm;

        if (userRole === 'ADMIN') {
          if (companySearchTerm) {
            // Admin searching for a specific company by name
            params.push(`%${companySearchTerm.toLowerCase()}%`);
            sql = `SELECT ca.id, ca.company_name, ca.full_name AS contact_person, ca.mobile_number,
                     ca.sector_code AS industry, ca.job_title, ca.gender, ca.business_locations,
                     ca.total_credits, ca.available_credits, ca.is_active, u.email, ca.created_at
                   FROM corporate_accounts ca
                   LEFT JOIN users u ON ca.user_id = u.id
                   WHERE ca.is_active = true AND LOWER(ca.company_name) LIKE $1
                   ORDER BY ca.company_name ASC
                   LIMIT ${limit}`;
          } else {
            sql = `SELECT ca.id, ca.company_name, ca.full_name AS contact_person, ca.mobile_number,
                     ca.sector_code AS industry, ca.job_title, ca.gender, ca.business_locations,
                     ca.total_credits, ca.available_credits, ca.is_active, u.email, ca.created_at
                   FROM corporate_accounts ca
                   LEFT JOIN users u ON ca.user_id = u.id
                   WHERE ca.is_active = true
                   ORDER BY ca.company_name ASC
                   LIMIT ${limit} OFFSET ${offset}`;
          }
        } else if (userRole === 'CORPORATE') {
          // CORPORATE RBAC: Always show only their own company
          let resolvedCorporateId = corporateId;

          // Fallback: If corporateId is not set, try to resolve from database
          if (!resolvedCorporateId && userId) {
            try {
              const corpLookup = await this.dataSource.query(
                `SELECT ca.id FROM corporate_accounts ca JOIN users u ON ca.user_id = u.id WHERE u.id = $1 LIMIT 1`,
                [userId]
              );
              if (corpLookup?.length > 0) {
                resolvedCorporateId = corpLookup[0].id;
                this.logger.log(`🏢 RBAC fallback: resolved corporateId=${resolvedCorporateId} from userId=${userId}`);
              }
            } catch (e) {
              this.logger.warn(`Failed to resolve corporateId for userId=${userId}: ${e.message}`);
            }
          }

          if (resolvedCorporateId) {
            params.push(resolvedCorporateId);
            sql = `SELECT ca.id, ca.company_name, ca.full_name AS contact_person, ca.mobile_number,
                     ca.sector_code AS industry, ca.job_title, ca.gender, ca.business_locations,
                     ca.total_credits, ca.available_credits, ca.is_active, u.email, ca.created_at
                   FROM corporate_accounts ca
                   LEFT JOIN users u ON ca.user_id = u.id
                   WHERE ca.id = $1
                   LIMIT 1`;
          } else {
            this.logger.warn(`⚠️ RBAC: CORPORATE user has no corporateId and fallback failed — showing error`);
            return [{ message: 'Unable to determine your corporate account. Please contact support.' }];
          }
        } else {
          return [{ message: 'Corporate account details are only available to admin and corporate users.' }];
        }
        break;
      }

      // ═══════════════════════════════════════════════════════════════
      // AFFILIATE / REFERRAL INTENTS
      // ═══════════════════════════════════════════════════════════════

      case 'affiliate_dashboard': {
        // Admin only: overall affiliate program stats
        if (userRole !== 'ADMIN') return [];
        sql = `SELECT
                 COUNT(*) as total_affiliates,
                 SUM(referral_count) as total_referrals,
                 CAST(SUM(total_earned_commission) AS FLOAT) as total_earned,
                 CAST(SUM(total_settled_commission) AS FLOAT) as total_settled,
                 CAST(SUM(total_pending_commission) AS FLOAT) as total_pending
               FROM affiliate_accounts WHERE is_active = true`;
        break;
      }

      case 'affiliate_referrals': {
        if (userRole !== 'ADMIN') return [];
        sql = `SELECT
                 art.id,
                 aa.name as affiliate_name,
                 r.full_name as referred_name,
                 CAST(art.registration_amount AS FLOAT) as registration_amount,
                 art.commission_percentage,
                 CAST(art.earned_commission_amount AS FLOAT) as earned_commission,
                 art.settlement_status,
                 art.created_at as referred_at
               FROM affiliate_referral_transactions art
               JOIN affiliate_accounts aa ON art.affiliate_account_id = aa.id
               LEFT JOIN registrations r ON art.registration_id = r.id
               ORDER BY art.created_at DESC
               LIMIT ${limit} OFFSET ${offset}`;
        break;
      }

      case 'affiliate_earnings': {
        if (userRole !== 'ADMIN') return [];
        // Admin: earnings summary across all affiliates
        sql = `SELECT
                 aa.name,
                 aa.email,
                 aa.referral_count,
                 aa.commission_percentage,
                 CAST(aa.total_earned_commission AS FLOAT) as total_earned,
                 CAST(aa.total_settled_commission AS FLOAT) as total_settled,
                 CAST(aa.total_pending_commission AS FLOAT) as total_pending
               FROM affiliate_accounts aa
               WHERE aa.is_active = true
               ORDER BY aa.total_earned_commission DESC
               LIMIT ${limit} OFFSET ${offset}`;
        break;
      }

      case 'affiliate_payments': {
        if (userRole !== 'ADMIN') return [];
        sql = `SELECT
                 ast.id,
                 aa.name as affiliate_name,
                 CAST(ast.settle_amount AS FLOAT) as settle_amount,
                 ast.transaction_mode,
                 ast.settlement_transaction_id as transaction_ref,
                 ast.payment_date
               FROM affiliate_settlement_transactions ast
               JOIN affiliate_accounts aa ON ast.affiliate_account_id = aa.id
               ORDER BY ast.payment_date DESC
               LIMIT ${limit} OFFSET ${offset}`;
        break;
      }

      case 'affiliate_list': {
        // Admin only: list all affiliate accounts
        if (userRole !== 'ADMIN') return [];
        sql = `SELECT
                 aa.name,
                 aa.email,
                 aa.referral_code,
                 aa.referral_count,
                 aa.commission_percentage,
                 CAST(aa.total_earned_commission AS FLOAT) as total_earned,
                 CAST(aa.total_pending_commission AS FLOAT) as total_pending,
                 aa.is_active,
                 aa.created_at
               FROM affiliate_accounts aa
               ORDER BY aa.created_at DESC
               LIMIT ${limit} OFFSET ${offset}`;
        break;
      }

      case 'affiliate_lookup': {
        const searchName = interpretation.searchTerm || '';
        if (!searchName) {
          this.logger.log('⚠️ affiliate_lookup with no searchTerm — returning empty');
          return [];
        }
        if (userRole === 'ADMIN') {
          sql = `SELECT
                   aa.name,
                   aa.email,
                   aa.referral_code,
                   aa.referral_count,
                   aa.commission_percentage,
                   CAST(aa.total_earned_commission AS FLOAT) as total_earned,
                   CAST(aa.total_settled_commission AS FLOAT) as total_settled,
                   CAST(aa.total_pending_commission AS FLOAT) as total_pending,
                   aa.is_active,
                   aa.mobile_number,
                   aa.created_at
                 FROM affiliate_accounts aa
                 WHERE aa.name ILIKE $1
                 LIMIT 10`;
          params.push(`%${searchName}%`);
        } else {
          return [];
        }
        break;
      }

      case 'affiliate_students': {
        // Admin only: students referred by a specific affiliate (or all affiliates)
        if (userRole !== 'ADMIN') return [];
        const searchName = interpretation.searchTerm || '';
        if (searchName) {
          sql = `SELECT
                   r.full_name as student_name,
                   r.email,
                   r.mobile_number,
                   r.registration_source,
                   r.gender,
                   aa.name as affiliate_name,
                   aa.referral_code,
                   CAST(art.registration_amount AS FLOAT) as registration_amount,
                   CAST(art.earned_commission_amount AS FLOAT) as commission_earned,
                   art.settlement_status,
                   art.created_at as referred_at
                 FROM affiliate_referral_transactions art
                 JOIN affiliate_accounts aa ON art.affiliate_account_id = aa.id
                 LEFT JOIN registrations r ON art.registration_id = r.id
                 WHERE aa.name ILIKE $1
                 ORDER BY art.created_at DESC
                 LIMIT ${limit} OFFSET ${offset}`;
          params.push(`%${searchName}%`);
        } else {
          // No specific affiliate — show all referred students
          sql = `SELECT
                   r.full_name as student_name,
                   r.email,
                   r.mobile_number,
                   aa.name as affiliate_name,
                   aa.referral_code,
                   CAST(art.registration_amount AS FLOAT) as registration_amount,
                   art.settlement_status,
                   art.created_at as referred_at
                 FROM affiliate_referral_transactions art
                 JOIN affiliate_accounts aa ON art.affiliate_account_id = aa.id
                 LEFT JOIN registrations r ON art.registration_id = r.id
                 ORDER BY art.created_at DESC
                 LIMIT ${limit} OFFSET ${offset}`;
        }
        break;
      }

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
      // Contextual no-data messages
      if (interpretation.intent.startsWith('affiliate_')) {
        return `No affiliate data found. Try:\n• "list affiliates"\n• "show referrals"\n• "affiliate earnings"\n• "affiliate payment status"\n• "students on affiliate [name]"`;
      }
      return `No results found. Try:\n• "list users"\n• "show test results"\n• "candidates"\n• "[name]'s score"`;
    }

    let body = '';
    switch (interpretation.intent) {
      case 'self_results':
        body = this.formatSelfResults(data);
        break;

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

      case 'corporate_details':
        body = this.formatCorporateDetails(data, offset);
        break;

      case 'count': {
        // Gender breakdown: "total male and female" → show both
        if ((interpretation as any).genderBreakdown && data.length > 0 && data[0].gender) {
          let gBody = '**👥 Gender Breakdown:**\n\n';
          let total = 0;
          for (const row of data) {
            const c = parseInt(row.count) || 0;
            total += c;
            const icon = row.gender === 'MALE' ? '👨' : row.gender === 'FEMALE' ? '👩' : '🧑';
            gBody += `${icon} **${row.gender}**: ${c}\n`;
          }
          gBody += `\n**Total: ${total}**`;
          return gBody;
        }
        const cnt = data[0]?.count || 0;
        const gLabel = (interpretation as any).gender;
        if (gLabel === 'MALE') return `👨 **Male: ${cnt}**`;
        if (gLabel === 'FEMALE') return `👩 **Female: ${cnt}**`;
        return `**${cnt} candidates total.**`;
      }

      case 'count_by_role': {
        let roleBody = '**Account Breakdown:**\n\n';
        let total = 0;
        for (const row of data) {
          const count = parseInt(row.count) || 0;
          total += count;
          roleBody += `• **${row.role}**: ${count}\n`;
        }
        roleBody += `\n**Total: ${total}**`;
        return roleBody;
      }

      // ── Affiliate intents ──
      case 'affiliate_dashboard':
        body = this.formatAffiliateDashboard(data, true);
        break;

      case 'affiliate_referrals':
        body = this.formatAffiliateReferrals(data, offset, true);
        break;

      case 'affiliate_earnings':
        body = this.formatAffiliateEarnings(data, true);
        break;

      case 'affiliate_payments':
        body = this.formatAffiliatePayments(data, offset, true);
        break;

      case 'affiliate_list':
        body = this.formatAffiliateList(data, offset);
        break;

      case 'affiliate_lookup':
        body = this.formatAffiliateLookup(data);
        break;

      case 'affiliate_students':
        body = this.formatAffiliateStudents(data, offset);
        break;

      default:
        body = this.formatGenericList(data, offset);
        break;
    }

    // ── Append pagination footer ──
    if (totalCount > 0 && ['list_users', 'list_candidates', 'test_results', 'best_performer', 'career_roles', 'affiliate_referrals', 'affiliate_payments', 'affiliate_list', 'affiliate_earnings', 'affiliate_students'].includes(interpretation.intent)) {
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

  /**
   * Personal dashboard format for "my results" / "my score" queries.
   * Shows a personalized card instead of a generic table.
   */
  private formatSelfResults(data: any[]): string {
    if (!data.length) {
      return `You don't have any completed assessments yet. Complete an assessment to see your personalized results here!`;
    }

    const latest = data[0];
    const name = latest.full_name || 'there';
    const scoreNum = latest.total_score ? parseFloat(latest.total_score) : NaN;
    const maxScore = latest.max_score_snapshot ? parseInt(latest.max_score_snapshot) : null;
    const isSelf = (latest.registration_source || '').toUpperCase() === 'SELF';

    let response = `**🎯 Your Assessment Results, ${name}**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (isSelf) {
      response += `📌 **Registration Type:** Self-registered student\n\n`;
    }

    if (latest.behavioral_style) {
      response += `📋 **Personality Style:** ${latest.behavioral_style}\n`;
      if (latest.behavior_description) {
        response += `   _${latest.behavior_description}_\n\n`;
      }
    }

    if (!isNaN(scoreNum)) {
      const agile = this.getAgileLevel(scoreNum);
      const maxStr = maxScore ? `/${maxScore}` : '/100';
      response += `🎯 **Agile Score:** ${scoreNum.toFixed(1)}${maxStr} — **${agile.name}**\n`;
      response += `   _${agile.desc}_\n\n`;
    }

    // Assessment answer details (from assessment_answers table)
    const totalQ = parseInt(latest.total_questions || '0');
    const answeredQ = parseInt(latest.answered_questions || '0');
    const correctQ = parseInt(latest.correct_answers || '0');
    const totalTime = parseInt(latest.total_time_spent_seconds || '0');

    if (totalQ > 0) {
      response += `📝 **Exam Breakdown:**\n`;
      response += `   • Total Questions: ${totalQ}\n`;
      response += `   • Answered: ${answeredQ} / ${totalQ}`;
      if (totalQ > 0) response += ` (${Math.round((answeredQ / totalQ) * 100)}%)`;
      response += `\n`;
      response += `   • Correct Answers: ${correctQ}`;
      if (answeredQ > 0) response += ` (${Math.round((correctQ / answeredQ) * 100)}% accuracy)`;
      response += `\n`;
      if (totalTime > 0) {
        const mins = Math.floor(totalTime / 60);
        const secs = totalTime % 60;
        response += `   • Time Spent: ${mins}m ${secs}s\n`;
      }
      response += `\n`;
    }

    // Sincerity info
    if (latest.sincerity_index) {
      const sincIdx = parseFloat(latest.sincerity_index);
      response += `🔍 **Sincerity Index:** ${sincIdx.toFixed(1)}%`;
      if (latest.sincerity_class) response += ` (${latest.sincerity_class})`;
      response += `\n\n`;
    }

    if (latest.program_name) {
      response += `📝 **Program:** ${latest.program_name}\n`;
    }
    if (latest.started_at && latest.completed_at) {
      const start = new Date(latest.started_at);
      const end = new Date(latest.completed_at);
      const durationMs = end.getTime() - start.getTime();
      const durationMins = Math.round(durationMs / 60000);
      response += `📅 **Completed:** ${end.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      if (durationMins > 0) response += ` (Duration: ${durationMins} min)`;
      response += `\n`;
    } else if (latest.completed_at) {
      const completedDate = new Date(latest.completed_at);
      response += `📅 **Completed:** ${completedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    }

    // Show additional attempts if multiple
    if (data.length > 1) {
      response += `\n**📊 All Attempts (${data.length}):**\n`;
      data.forEach((row, i) => {
        const score = row.total_score ? parseFloat(row.total_score).toFixed(1) : 'N/A';
        const prog = row.program_name || 'Assessment';
        const date = row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '';
        const tq = parseInt(row.total_questions || '0');
        const aq = parseInt(row.answered_questions || '0');
        const answerInfo = tq > 0 ? ` · ${aq}/${tq} answered` : '';
        response += `  ${i + 1}. ${prog} — Score: ${score}${answerInfo} ${date ? `(${date})` : ''}\n`;
      });
    }

    response += `\n💡 **Want more?** Ask me:\n`;
    response += `  • "Generate my career report"\n`;
    response += `  • "What careers suit my personality?"\n`;
    response += `  • "Am I eligible for project manager?"`;

    return response;
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
    response += '| # | Name | Gender | Mobile | Status |\n';
    response += '|---|------|--------|--------|--------|\n';
    data.forEach((row, i) => {
      const num = offset + i + 1;
      const mobile = row.mobile_number || '-';
      response += `| ${num} | ${row.full_name} | ${row.gender || 'N/A'} | ${mobile} | ${row.status} |\n`;
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

  private formatCorporateDetails(data: any[], offset: number = 0): string {
    if (data.length === 0) return 'No corporate accounts found.';

    // Single corporate (corporate user viewing their own)
    if (data.length === 1 && data[0].company_name) {
      const row = data[0];
      let response = `**🏢 Corporate Account Details**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      response += `**Company:** ${row.company_name || 'N/A'}\n`;
      response += `**Contact Person:** ${row.contact_person || 'N/A'}\n`;
      if (row.email) response += `**Email:** ${row.email}\n`;
      if (row.job_title) response += `**Job Title:** ${row.job_title}\n`;
      if (row.industry) response += `**Industry:** ${row.industry}\n`;
      if (row.gender) response += `**Gender:** ${row.gender}\n`;
      if (row.business_locations) response += `**Locations:** ${row.business_locations}\n`;
      response += `**Total Credits:** ${row.total_credits || 0}\n`;
      response += `**Available Credits:** ${row.available_credits || 0}\n`;
      response += `**Status:** ${row.is_active ? '✅ Active' : '❌ Inactive'}\n`;
      if (row.mobile_number) response += `**Mobile:** ${row.mobile_number}\n`;
      if (row.created_at) response += `**Registered:** ${new Date(row.created_at).toLocaleDateString()}\n`;
      return response;
    }

    // Multiple corporates (admin view)
    let response = `**🏢 Corporate Accounts (${data.length})**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    response += '| # | Company | Contact | Industry | Credits | Status |\n';
    response += '|---|---------|---------|----------|---------|--------|\n';
    data.forEach((row, i) => {
      const num = offset + i + 1;
      const status = row.is_active ? '✅' : '❌';
      const contact = row.mobile_number || row.contact_person || 'N/A';
      response += `| ${num} | **${row.company_name || 'N/A'}** | ${contact} | ${row.industry || 'N/A'} | ${row.available_credits || 0}/${row.total_credits || 0} | ${status} |\n`;
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
  // AFFILIATE / REFERRAL FORMATTERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Format affiliate dashboard — personalized overview card
   */
  private formatAffiliateDashboard(data: any[], isAdmin: boolean): string {
    if (!data.length) return 'No affiliate data found.';
    const row = data[0];

    if (isAdmin) {
      // Admin sees aggregate stats
      return `**📊 Affiliate Program Overview**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👥 **Total Affiliates:** ${row.total_affiliates || 0}\n` +
        `🔗 **Total Referrals:** ${row.total_referrals || 0}\n\n` +
        `💰 **Commission Summary:**\n` +
        `   • Total Earned: **₹${this.formatCurrency(row.total_earned)}**\n` +
        `   • Total Settled: **₹${this.formatCurrency(row.total_settled)}**\n` +
        `   • Total Pending: **₹${this.formatCurrency(row.total_pending)}**\n\n` +
        `💡 Say **"list affiliates"** to see individual accounts or **"show payments"** for settlement history.`;
    }

    // Affiliate's personal dashboard
    const name = row.name || 'Partner';
    return `**📊 Your Referral Dashboard, ${name}**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔗 **Referral Code:** \`${row.referral_code}\`\n` +
      `👥 **Total Referrals:** ${row.referral_count || 0}\n` +
      `📈 **Commission Rate:** ${row.commission_percentage}%\n\n` +
      `💰 **Earnings Summary:**\n` +
      `   • Total Earned: **₹${this.formatCurrency(row.total_earned)}**\n` +
      `   • Settled: **₹${this.formatCurrency(row.total_settled)}** ✅\n` +
      `   • Pending: **₹${this.formatCurrency(row.total_pending)}** ⏳\n\n` +
      `📋 **Transaction Status:**\n` +
      `   • Unsettled: ${row.unsettled_count || 0}\n` +
      `   • Processing: ${row.processing_count || 0}\n` +
      `   • Settled: ${row.settled_count || 0}\n\n` +
      `💡 Try: **"my referrals"** · **"my earnings"** · **"payment history"**`;
  }

  /**
   * Format affiliate referral transactions list
   */
  private formatAffiliateReferrals(data: any[], offset: number = 0, isAdmin: boolean = false): string {
    if (!data.length) return 'No referral transactions found yet. Share your referral link to start earning!';

    const statusLabels: Record<number, string> = { 0: '🔴 Not Settled', 1: '🟡 Processing', 2: '🟢 Settled' };
    let response = `**🔗 ${isAdmin ? 'All ' : 'Your '}Referral Transactions**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    data.forEach((row, i) => {
      const num = offset + i + 1;
      const name = row.referred_name || row.referred_email || 'Unknown';
      const status = statusLabels[row.settlement_status] || '⚪ Unknown';
      const date = row.referred_at ? new Date(row.referred_at).toLocaleDateString('en-IN') : 'N/A';

      response += `**${num}.** ${isAdmin && row.affiliate_name ? `[${row.affiliate_name}] → ` : ''}**${name}**\n`;
      response += `   💵 Amount: ₹${this.formatCurrency(row.registration_amount)} · Commission: ₹${this.formatCurrency(row.earned_commission)} (${row.commission_percentage}%)\n`;
      response += `   ${status} · ${date}\n\n`;
    });

    return response;
  }

  /**
   * Format affiliate earnings/commission details
   */
  private formatAffiliateEarnings(data: any[], isAdmin: boolean = false): string {
    if (!data.length) return 'No earnings data found.';

    if (isAdmin) {
      // Admin: table of all affiliates' earnings
      let response = `**💰 Affiliate Earnings Overview**\n`;
      response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      data.forEach((row, i) => {
        response += `**${i + 1}.** **${row.name}** (${row.email})\n`;
        response += `   📈 Rate: ${row.commission_percentage}% · Referrals: ${row.referral_count}\n`;
        response += `   💰 Earned: ₹${this.formatCurrency(row.total_earned)} · Settled: ₹${this.formatCurrency(row.total_settled)} · Pending: ₹${this.formatCurrency(row.total_pending)}\n\n`;
      });
      return response;
    }

    // Affiliate's detailed earnings
    const row = data[0];
    return `**💰 Your Earnings Detail**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 **${row.name}** · Commission Rate: **${row.commission_percentage}%**\n` +
      `🔗 Total Referrals: **${row.referral_count}**\n\n` +
      `📊 **Commission Breakdown:**\n` +
      `   ┌──────────────────────────────────┐\n` +
      `   │ 💵 Total Earned:    ₹${this.formatCurrency(row.total_earned).padStart(10)}\n` +
      `   │ ✅ Settled:         ₹${this.formatCurrency(row.settled_amount).padStart(10)}\n` +
      `   │ 🟡 Processing:     ₹${this.formatCurrency(row.processing_amount).padStart(10)}\n` +
      `   │ ⏳ Unsettled:      ₹${this.formatCurrency(row.unsettled_amount).padStart(10)}\n` +
      `   │ 💰 Net Pending:    ₹${this.formatCurrency(row.total_pending).padStart(10)}\n` +
      `   └──────────────────────────────────┘\n\n` +
      `💡 Say **"payment history"** to see settlement transactions or **"my referrals"** for details.`;
  }

  /**
   * Format affiliate payment/settlement history
   */
  private formatAffiliatePayments(data: any[], offset: number = 0, isAdmin: boolean = false): string {
    if (!data.length) return 'No payment settlements found yet. Payments are processed once your commissions reach the settlement threshold.';

    let response = `**💳 ${isAdmin ? 'All ' : 'Your '}Payment History**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    data.forEach((row, i) => {
      const num = offset + i + 1;
      const date = row.payment_date ? new Date(row.payment_date).toLocaleDateString('en-IN') : 'N/A';
      const mode = row.transaction_mode || 'N/A';
      const ref = row.transaction_ref || 'N/A';

      response += `**${num}.** ${isAdmin && row.affiliate_name ? `**${row.affiliate_name}** · ` : ''}₹${this.formatCurrency(row.settle_amount)}\n`;
      response += `   📅 ${date} · 🏦 ${mode} · Ref: \`${ref}\`\n\n`;
    });

    return response;
  }

  /**
   * Format affiliate list (Admin view)
   */
  private formatAffiliateList(data: any[], offset: number = 0): string {
    if (!data.length) return 'No affiliate accounts found.';

    let response = `**👥 Affiliate Accounts**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    data.forEach((row, i) => {
      const num = offset + i + 1;
      const status = row.is_active ? '🟢 Active' : '🔴 Inactive';
      const joined = row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : 'N/A';

      response += `**${num}.** **${row.name}** (${row.email})\n`;
      response += `   🔗 Code: \`${row.referral_code}\` · Referrals: ${row.referral_count} · Rate: ${row.commission_percentage}%\n`;
      response += `   💰 Earned: ₹${this.formatCurrency(row.total_earned)} · Pending: ₹${this.formatCurrency(row.total_pending)}\n`;
      response += `   ${status} · Joined: ${joined}\n\n`;
    });

    return response;
  }

  /**
   * Format affiliate lookup (specific affiliate details — Admin view)
   */
  private formatAffiliateLookup(data: any[]): string {
    if (!data.length) return 'No affiliate found with that name. Try "list affiliates" to see all accounts.';

    let response = `**🔍 Affiliate Details**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    data.forEach((row) => {
      const status = row.is_active ? '🟢 Active' : '🔴 Inactive';
      const joined = row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : 'N/A';

      response += `👤 **${row.name}** · ${row.email}\n`;
      response += `📱 ${row.mobile_number || 'N/A'} · ${status}\n\n`;
      response += `🔗 **Referral Code:** \`${row.referral_code}\`\n`;
      response += `👥 **Referrals:** ${row.referral_count} · Rate: ${row.commission_percentage}%\n\n`;
      response += `💰 **Financials:**\n`;
      response += `   • Earned: ₹${this.formatCurrency(row.total_earned)}\n`;
      response += `   • Settled: ₹${this.formatCurrency(row.total_settled)}\n`;
      response += `   • Pending: ₹${this.formatCurrency(row.total_pending)}\n\n`;
      response += `📅 Joined: ${joined}\n`;
    });

    return response;
  }

  /**
   * Format students referred by affiliate(s).
   */
  private formatAffiliateStudents(data: any[], offset: number = 0): string {
    if (!data.length) return 'No students found for this affiliate. The affiliate may not have any referrals yet.';

    const affiliateName = data[0]?.affiliate_name;
    let response = affiliateName
      ? `**👥 Students Referred by ${affiliateName}**\n`
      : `**👥 All Affiliate-Referred Students**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    data.forEach((row, i) => {
      const num = offset + i + 1;
      const studentName = row.student_name || 'Unknown';
      const email = row.email || 'N/A';
      const mobile = row.mobile_number || '';
      const affName = row.affiliate_name || 'N/A';
      const referralCode = row.referral_code || '';
      const regAmount = row.registration_amount ? `₹${this.formatCurrency(row.registration_amount)}` : 'N/A';
      const commission = row.commission_earned ? `₹${this.formatCurrency(row.commission_earned)}` : '';
      const status = row.settlement_status === 2 ? '✅ Settled'
        : row.settlement_status === 1 ? '⏳ Processing'
          : row.settlement_status === 0 ? '🔴 Not Settled' : '';
      const referredAt = row.referred_at ? new Date(row.referred_at).toLocaleDateString('en-IN') : '';

      response += `**${num}.** **${studentName}** · ${email}`;
      if (mobile) response += ` · 📱 ${mobile}`;
      response += `\n`;
      if (!affiliateName) response += `   🔗 Affiliate: ${affName} (${referralCode})\n`;
      response += `   💳 Reg Amount: ${regAmount}`;
      if (commission) response += ` · Commission: ${commission}`;
      if (status) response += ` · ${status}`;
      response += `\n`;
      if (referredAt) response += `   📅 Referred: ${referredAt}\n`;
      response += `\n`;
    });

    return response;
  }

  /**
   * Format currency amount with commas (Indian numbering)
   */
  private formatCurrency(amount: number | string | null | undefined): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW-UP SUGGESTION GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════
  generateFollowUpSuggestions(question: string, answer: string, searchType: string): string[] {
    const q = question.toLowerCase();
    const a = answer.toLowerCase();
    const suggestions: string[] = [];

    // Context-aware suggestions based on search type
    switch (searchType) {

      // ── AI COUNSELLOR MODE — context-driven follow-ups ──
      case 'ai_counsellor': {
        // Detect what topic was discussed and suggest natural follow-ups

        const talkedAboutCareer = q.includes('career') || q.includes('job') || q.includes('role') || a.includes('career') || a.includes('job role');
        const talkedAboutSkills = q.includes('skill') || q.includes('learn') || q.includes('course') || a.includes('skill') || a.includes('develop');
        const talkedAboutPersonality = q.includes('personality') || q.includes('trait') || q.includes('style') || a.includes('personality') || a.includes('disc') || a.includes('strength');
        const talkedAboutAssessment = q.includes('score') || q.includes('assessment') || q.includes('result') || q.includes('test') || a.includes('assessment') || a.includes('score');
        const talkedAboutSalary = q.includes('salary') || q.includes('pay') || q.includes('package') || a.includes('salary') || a.includes('lpa') || a.includes('package');
        const talkedAboutRoadmap = q.includes('roadmap') || q.includes('plan') || q.includes('steps') || q.includes('how to') || a.includes('roadmap') || a.includes('step');
        const talkedAboutInterview = q.includes('interview') || q.includes('resume') || q.includes('cv') || a.includes('interview') || a.includes('resume');

        if (talkedAboutCareer && talkedAboutSkills) {
          suggestions.push('What certifications will help me the most?');
          suggestions.push('How long will it take to be job-ready?');
          suggestions.push('What projects should I build for my portfolio?');
        } else if (talkedAboutCareer) {
          suggestions.push('What skills do I need for this career?');
          suggestions.push('What is the salary range for this role?');
          suggestions.push('How do I get started in this field?');
        } else if (talkedAboutPersonality) {
          suggestions.push('What careers best match my personality?');
          suggestions.push('How can I use my strengths at work?');
          suggestions.push('What work environments suit me?');
        } else if (talkedAboutAssessment) {
          suggestions.push('What do my assessment scores say about me?');
          suggestions.push('How can I improve my weak areas?');
          suggestions.push('Which careers match my assessment profile?');
        } else if (talkedAboutSkills) {
          suggestions.push('Show me a learning roadmap');
          suggestions.push('Which online platforms do you recommend?');
          suggestions.push('How can I practice these skills?');
        } else if (talkedAboutSalary) {
          suggestions.push('Which skills command higher salaries?');
          suggestions.push('How do I negotiate a better offer?');
          suggestions.push('What is the career growth trajectory?');
        } else if (talkedAboutRoadmap) {
          suggestions.push('What should I focus on this month?');
          suggestions.push('How do I stay on track with my goals?');
          suggestions.push('Who can mentor me in this field?');
        } else if (talkedAboutInterview) {
          suggestions.push('What are common interview questions?');
          suggestions.push('How do I write a strong resume?');
          suggestions.push('How should I prepare for my first interview?');
        } else {
          // General counsellor follow-ups
          suggestions.push('What careers match my profile?');
          suggestions.push('What are my strongest skills?');
          suggestions.push('How do I plan my career path?');
        }
        break;
      }

      case 'list_candidates':
      case 'list_registrations':
        suggestions.push('Show top performers');
        suggestions.push('How many candidates completed assessments?');
        suggestions.push('Generate career report for a candidate');
        break;
      case 'person_lookup':
      case 'career_report':
        suggestions.push('Show their personality traits');
        suggestions.push('What careers suit this person?');
        suggestions.push('Generate a detailed career report');
        break;
      case 'test_results':
        suggestions.push('Who are the top scorers?');
        suggestions.push('Show average scores');
        suggestions.push('Compare performance across groups');
        break;
      case 'career_guidance':
        suggestions.push('What skills should I develop?');
        suggestions.push('Show recommended courses');
        suggestions.push('What certifications are valuable?');
        break;
      case 'intelligent_response':
      case 'general_knowledge':
        if (q.includes('skill') || q.includes('learn') || q.includes('course')) {
          suggestions.push('Show me a learning roadmap');
          suggestions.push('What certifications should I get?');
          suggestions.push('Compare online learning platforms');
        } else if (q.includes('career') || q.includes('job') || q.includes('role')) {
          suggestions.push('What skills are needed?');
          suggestions.push('Show salary ranges');
          suggestions.push('How to prepare for interviews?');
        } else if (q.includes('technology') || q.includes('programming') || q.includes('framework')) {
          suggestions.push('Show me a getting started guide');
          suggestions.push('What projects should I build?');
          suggestions.push('Compare with alternatives');
        } else {
          suggestions.push('Tell me more about this');
          suggestions.push('How can I apply this?');
          suggestions.push('What are the next steps?');
        }
        break;
      case 'list_users':
        suggestions.push('Show active users');
        suggestions.push('How many admins are there?');
        suggestions.push('Show user activity summary');
        break;
      case 'count_by_role':
        suggestions.push('List all corporate accounts');
        suggestions.push('Show all candidates');
        suggestions.push('How many completed assessments?');
        break;
      case 'corporate_details':
        suggestions.push('How many candidates in each corporate?');
        suggestions.push('Show active corporates');
        suggestions.push('Which corporate has the most candidates?');
        break;
      default:
        suggestions.push('List all candidates');
        suggestions.push('Show top performers');
        suggestions.push('Ask me about career paths');
        break;
    }

    return suggestions.slice(0, 3);
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
      name: 'Ask BI',
      version: '3.0.0-jarvis',
      description: 'Ask BI — OriginBI Intelligent Assistant (Jarvis Edition)',
      features: [
        'corporate_scoped_intelligence',
        'personalized_career_guidance',
        'job_eligibility_analysis',
        'higher_studies_recommendations',
        'user_memory',
        'any_question_intelligent',
        'conversation_context',
        'llm_powered',
        'strict_db_only_person_data',
        'smart_name_disambiguation',
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
