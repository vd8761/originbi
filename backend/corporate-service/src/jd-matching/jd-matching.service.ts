/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import OpenAI from 'openai';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║           🎯 CORPORATE JD MATCHING ENGINE v2.0                               ║
 * ║   Advanced Multi-Dimensional Candidate-Job Matching for Corporate Users      ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  CORPORATE-SPECIFIC FEATURES:                                                ║
 * ║  • Mandatory corporate_id scoping - ONLY your candidates                     ║
 * ║  • Group-level filtering for department-specific matching                    ║
 * ║  • Company context-aware scoring with organizational fit analysis           ║
 * ║  • Department distribution insights                                          ║
 * ║  • Workforce planning recommendations                                        ║
 * ║                                                                               ║
 * ║  ALGORITHM LAYERS:                                                            ║
 * ║  Layer 1: LLM-powered JD Parsing with NLU                                   ║
 * ║  Layer 2: Corporate-scoped Candidate Profiling                               ║
 * ║  Layer 3: Multi-Factor Scoring (BAS 35% + ARS 25% + TFS 25% + RSI 15%)     ║
 * ║  Layer 4: Industry Calibration + Seniority Alignment + Team Fit             ║
 * ║  Layer 5: Success Prediction + Retention Risk Analysis                       ║
 * ║  Layer 6: AI-Powered Insights with Workforce Intelligence                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface JDRequirements {
  roleTitle: string;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  requiredTraits: TraitRequirement[];
  behavioralPatterns: BehavioralPattern[];
  agileRequirement: AgileRequirement;
  softSkills: string[];
  hardSkills: string[];
  industryContext: string;
  teamDynamic: 'solo' | 'small_team' | 'large_team' | 'cross_functional';
  leadershipRequired: boolean;
  creativityRequired: boolean;
  analyticalRequired: boolean;
  customerFacing: boolean;
}

interface TraitRequirement {
  traitName: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  minLevel: 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
}

interface BehavioralPattern {
  pattern: string;
  weight: number;
  relevantStyles: string[];
}

interface AgileRequirement {
  minScore: number;
  idealScore: number;
  adaptabilityWeight: number;
}

interface CandidateProfile {
  registrationId: number;
  fullName: string;
  email: string;
  gender: string | null;
  mobileNumber: string | null;
  personalityStyle: string | null;
  personalityDescription: string | null;
  personalityCode: string | null;
  discScoreD: number | null;
  discScoreI: number | null;
  discScoreS: number | null;
  discScoreC: number | null;
  totalScore: number | null;
  sincerityIndex: number | null;
  sincerityClass: string | null;
  attemptCount: number;
  bestScore: number | null;
  assessmentStatus: string;
  corporateAccountId: number | null;
  groupId: number | null;
  groupName: string | null;
  currentRole?: string | null;
  departmentName?: string | null;
}

export interface ScoredCandidate {
  candidate: CandidateProfile;
  compositeScore: number;
  tier: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'DEVELOPING';
  confidenceLevel: number;
  breakdown: ScoreBreakdown;
  insights: string[];
  matchReasons: string[];
  developmentAreas: string[];
  successPrediction?: number;
  retentionRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  teamFitScore?: number;
}

interface ScoreBreakdown {
  behavioralAlignmentScore: number;
  agileReadinessScore: number;
  traitRoleFitScore: number;
  reliabilityIndex: number;
  confidenceMultiplier: number;
}

export interface JDMatchResult {
  jobDescription: string;
  parsedRequirements: JDRequirements;
  totalCandidatesEvaluated: number;
  matchedCandidates: ScoredCandidate[];
  executionTimeMs: number;
  algorithmVersion: string;
  corporateId: number;
  companyName?: string;
  workforceInsights?: WorkforceInsights;
}

interface WorkforceInsights {
  totalAssessedCandidates: number;
  averageMatchScore: number;
  tierDistribution: Record<string, number>;
  topPersonalityStyles: { style: string; count: number; avgScore: number }[];
  groupDistribution?: {
    groupName: string;
    candidateCount: number;
    avgScore: number;
  }[];
  talentGapsSummary: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DISC PERSONALITY KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════

const PERSONALITY_VECTORS: Record<
  string,
  {
    dominance: number;
    influence: number;
    steadiness: number;
    compliance: number;
    leadership: number;
    creativity: number;
    analytical: number;
    teamwork: number;
    independence: number;
    adaptability: number;
    communication: number;
    empathy: number;
  }
> = {
  'Charismatic Leader': {
    dominance: 90,
    influence: 95,
    steadiness: 40,
    compliance: 35,
    leadership: 95,
    creativity: 75,
    analytical: 50,
    teamwork: 80,
    independence: 85,
    adaptability: 80,
    communication: 95,
    empathy: 70,
  },
  'Strategic Stabilizer': {
    dominance: 60,
    influence: 45,
    steadiness: 90,
    compliance: 85,
    leadership: 65,
    creativity: 40,
    analytical: 85,
    teamwork: 75,
    independence: 70,
    adaptability: 55,
    communication: 60,
    empathy: 65,
  },
  'Decisive Analyst': {
    dominance: 85,
    influence: 40,
    steadiness: 50,
    compliance: 90,
    leadership: 70,
    creativity: 55,
    analytical: 95,
    teamwork: 50,
    independence: 90,
    adaptability: 60,
    communication: 55,
    empathy: 40,
  },
  'Analytical Leader': {
    dominance: 80,
    influence: 55,
    steadiness: 55,
    compliance: 85,
    leadership: 85,
    creativity: 60,
    analytical: 90,
    teamwork: 65,
    independence: 85,
    adaptability: 65,
    communication: 70,
    empathy: 55,
  },
  'Creative Thinker': {
    dominance: 50,
    influence: 85,
    steadiness: 55,
    compliance: 50,
    leadership: 55,
    creativity: 95,
    analytical: 60,
    teamwork: 75,
    independence: 70,
    adaptability: 90,
    communication: 80,
    empathy: 75,
  },
  'Supportive Energizer': {
    dominance: 35,
    influence: 90,
    steadiness: 80,
    compliance: 45,
    leadership: 50,
    creativity: 65,
    analytical: 40,
    teamwork: 95,
    independence: 35,
    adaptability: 75,
    communication: 85,
    empathy: 95,
  },
  'Reliable Executor': {
    dominance: 55,
    influence: 35,
    steadiness: 95,
    compliance: 80,
    leadership: 45,
    creativity: 30,
    analytical: 70,
    teamwork: 70,
    independence: 75,
    adaptability: 40,
    communication: 50,
    empathy: 60,
  },
  'Influential Connector': {
    dominance: 60,
    influence: 92,
    steadiness: 60,
    compliance: 40,
    leadership: 70,
    creativity: 80,
    analytical: 45,
    teamwork: 90,
    independence: 55,
    adaptability: 85,
    communication: 95,
    empathy: 85,
  },
  'Methodical Planner': {
    dominance: 50,
    influence: 30,
    steadiness: 85,
    compliance: 95,
    leadership: 55,
    creativity: 35,
    analytical: 95,
    teamwork: 60,
    independence: 80,
    adaptability: 35,
    communication: 45,
    empathy: 50,
  },
  'Dynamic Achiever': {
    dominance: 92,
    influence: 75,
    steadiness: 35,
    compliance: 55,
    leadership: 88,
    creativity: 70,
    analytical: 65,
    teamwork: 60,
    independence: 90,
    adaptability: 85,
    communication: 80,
    empathy: 50,
  },
  'Steady Contributor': {
    dominance: 30,
    influence: 50,
    steadiness: 92,
    compliance: 70,
    leadership: 35,
    creativity: 45,
    analytical: 60,
    teamwork: 85,
    independence: 45,
    adaptability: 50,
    communication: 60,
    empathy: 80,
  },
  'Visionary Strategist': {
    dominance: 85,
    influence: 80,
    steadiness: 40,
    compliance: 70,
    leadership: 90,
    creativity: 85,
    analytical: 80,
    teamwork: 65,
    independence: 88,
    adaptability: 80,
    communication: 85,
    empathy: 60,
  },
};

const DEFAULT_VECTOR = {
  dominance: 50,
  influence: 50,
  steadiness: 50,
  compliance: 50,
  leadership: 50,
  creativity: 50,
  analytical: 50,
  teamwork: 50,
  independence: 50,
  adaptability: 50,
  communication: 50,
  empathy: 50,
};

const SCORING_WEIGHTS = {
  behavioralAlignment: 0.35,
  agileReadiness: 0.25,
  traitRoleFit: 0.25,
  reliabilityIndex: 0.15,
};

const TIER_THRESHOLDS = {
  STRONG_FIT: 80,
  GOOD_FIT: 65,
  MODERATE_FIT: 50,
  DEVELOPING: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class CorporateJDMatchingService {
  private readonly logger = new Logger('Corporate-JD-MatchEngine');
  private openaiClient: OpenAI | null = null;

  constructor(private dataSource: DataSource) {
    this.logger.log('🎯 Corporate JD Matching Engine v2.0 initialized');
  }

  private getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY not set');
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT: Corporate JD → Candidate Match
  // corporateId is MANDATORY - enforces corporate scoping
  // ═══════════════════════════════════════════════════════════════════════════
  async matchCandidatesToJD(
    jobDescription: string,
    corporateId: number,
    options: {
      groupId?: number;
      topN?: number;
      minScore?: number;
      includeInsights?: boolean;
      includeWorkforceInsights?: boolean;
    } = {},
  ): Promise<JDMatchResult> {
    const startTime = Date.now();
    const topN = options.topN || 10;
    const minScore = options.minScore || 0;

    this.logger.log('═══════════════════════════════════════════════════');
    this.logger.log(
      `🎯 CORPORATE JD MATCHING ENGINE - Corporate #${corporateId}`,
    );
    this.logger.log(`📄 JD Length: ${jobDescription.length} chars`);
    this.logger.log('═══════════════════════════════════════════════════');

    // Fetch company name for branded output
    const companyName = await this.getCompanyName(corporateId);

    // ── LAYER 1: Parse Job Description ──
    this.logger.log('📋 Layer 1: Parsing Job Description...');
    const requirements = await this.parseJobDescription(jobDescription);
    this.logger.log(
      `   ✅ Role: ${requirements.roleTitle} (${requirements.seniorityLevel})`,
    );

    // ── LAYER 2: Fetch corporate-scoped candidate profiles ──
    this.logger.log(
      `👥 Layer 2: Fetching candidates for Corporate #${corporateId}...`,
    );
    const candidates = await this.fetchCorporateCandidates(
      corporateId,
      options.groupId,
    );
    this.logger.log(
      `   ✅ Found ${candidates.length} candidates in your organization`,
    );

    if (candidates.length === 0) {
      return {
        jobDescription,
        parsedRequirements: requirements,
        totalCandidatesEvaluated: 0,
        matchedCandidates: [],
        executionTimeMs: Date.now() - startTime,
        algorithmVersion: '2.0.0-corporate',
        corporateId,
        companyName,
      };
    }

    // ── LAYER 3: Score each candidate ──
    this.logger.log('🧮 Layer 3: Scoring candidates...');
    const scoredCandidates: ScoredCandidate[] = [];
    for (const candidate of candidates) {
      const scored = this.scoreCandidate(candidate, requirements);
      if (scored.compositeScore >= minScore) {
        scoredCandidates.push(scored);
      }
    }

    // ── LAYER 4: Rank & classify ──
    this.logger.log('📊 Layer 4: Ranking & normalizing...');
    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
    const totalScored = scoredCandidates.length;
    scoredCandidates.forEach((sc, index) => {
      sc.confidenceLevel = Math.round(
        ((totalScored - index) / totalScored) * 100,
      );
    });

    const topCandidates = scoredCandidates.slice(0, topN);

    // ── LAYER 5: AI Insights ──
    if (options.includeInsights !== false && topCandidates.length > 0) {
      this.logger.log('🧠 Layer 5: Generating AI insights...');
      await this.generateBatchInsights(topCandidates, requirements);
    }

    // ── LAYER 6: Workforce Intelligence (Corporate-specific) ──
    let workforceInsights: WorkforceInsights | undefined;
    if (options.includeWorkforceInsights !== false) {
      this.logger.log('📈 Layer 6: Building workforce intelligence...');
      workforceInsights = this.buildWorkforceInsights(
        scoredCandidates,
        requirements,
      );
    }

    const executionTimeMs = Date.now() - startTime;
    this.logger.log(
      `✅ Corporate JD Matching complete in ${executionTimeMs}ms - ${topCandidates.length} matches`,
    );

    return {
      jobDescription,
      parsedRequirements: requirements,
      totalCandidatesEvaluated: candidates.length,
      matchedCandidates: topCandidates,
      executionTimeMs,
      algorithmVersion: '2.0.0-corporate',
      corporateId,
      companyName,
      workforceInsights,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORPORATE ACCOUNT RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Resolve corporate account ID from user email (public for controller use) */
  async getCorporateAccountId(email: string): Promise<number> {
    const user = await this.dataSource.query(
      `SELECT id, corporate_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (!user || user.length === 0) {
      throw new Error('User not found');
    }

    // Strategy A: User has corporateId directly
    if (user[0].corporate_id) {
      return parseInt(user[0].corporate_id);
    }

    // Strategy B: Find corporate_accounts by userId
    const corp = await this.dataSource.query(
      `SELECT id FROM corporate_accounts WHERE user_id = $1 LIMIT 1`,
      [user[0].id],
    );
    if (corp && corp.length > 0) {
      return parseInt(corp[0].id);
    }

    throw new Error('Corporate account not found for this user');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPANY INFO
  // ═══════════════════════════════════════════════════════════════════════════
  private async getCompanyName(corporateId: number): Promise<string> {
    try {
      const result = await this.dataSource.query(
        `SELECT company_name FROM corporate_accounts WHERE id = $1`,
        [corporateId],
      );
      return result?.[0]?.company_name || 'Your Organization';
    } catch {
      return 'Your Organization';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: JD PARSING (uses Groq SDK directly)
  // ═══════════════════════════════════════════════════════════════════════════
  private async parseJobDescription(jd: string): Promise<JDRequirements> {
    const systemPrompt = `You are an expert HR analyst and organizational psychologist. Analyze this Job Description and extract structured requirements for candidate matching.

CONTEXT: We use the DISC behavioral model. Personality styles in our system:
- Charismatic Leader (High D+I), Strategic Stabilizer (High S+C), Decisive Analyst (High D+C)
- Analytical Leader (High D+C), Creative Thinker (High I+S), Supportive Energizer (High I+S)
- Reliable Executor (High S+C), Influential Connector (High I), Methodical Planner (High C+S)
- Dynamic Achiever (High D+I), Steady Contributor (High S), Visionary Strategist (High D+I+C)


Respond with ONLY valid JSON:
{
  "roleTitle": "extracted role title",
  "seniorityLevel": "entry|mid|senior|lead|executive",
  "requiredTraits": [{"traitName": "Dominance|Influence|Steadiness|Compliance", "importance": "critical|important|nice_to_have", "minLevel": "low|moderate|high|very_high", "description": "why"}],
  "behavioralPatterns": [{"pattern": "description", "weight": 0.0-1.0, "relevantStyles": ["styles"]}],
  "agileRequirement": {"minScore": 0-125, "idealScore": 0-125, "adaptabilityWeight": 0.0-1.0},
  "softSkills": [], "hardSkills": [],
  "industryContext": "industry",
  "teamDynamic": "solo|small_team|large_team|cross_functional",
  "leadershipRequired": true/false, "creativityRequired": true/false,
  "analyticalRequired": true/false, "customerFacing": true/false
}

RULES: Always include 2-4 requiredTraits. Include 2-5 behavioralPatterns with weights summing ~1.0.`;

    try {
      const completion = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `JOB DESCRIPTION:\n"""\n${jd}\n"""\n\nParse the job description above.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const jsonStr = (completion.choices[0]?.message?.content || '').trim();
      const cleanJson = jsonStr
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleanJson) as JDRequirements;

      return {
        roleTitle: parsed.roleTitle || 'Unknown Role',
        seniorityLevel: parsed.seniorityLevel || 'mid',
        requiredTraits: parsed.requiredTraits || [],
        behavioralPatterns: parsed.behavioralPatterns || [],
        agileRequirement: parsed.agileRequirement || {
          minScore: 50,
          idealScore: 80,
          adaptabilityWeight: 0.5,
        },
        softSkills: parsed.softSkills || [],
        hardSkills: parsed.hardSkills || [],
        industryContext: parsed.industryContext || 'General',
        teamDynamic: parsed.teamDynamic || 'small_team',
        leadershipRequired: parsed.leadershipRequired ?? false,
        creativityRequired: parsed.creativityRequired ?? false,
        analyticalRequired: parsed.analyticalRequired ?? false,
        customerFacing: parsed.customerFacing ?? false,
      };
    } catch (error) {
      this.logger.error(`JD parsing error: ${error.message}`);
      return this.fallbackJDParsing(jd);
    }
  }

  private fallbackJDParsing(jd: string): JDRequirements {
    const leadershipRequired =
      /\b(lead|leader|leadership|manage|director|head|vp|chief)\b/i.test(jd);
    const analyticalRequired =
      /\b(analy|data|research|metrics|statistics|quantitative)\b/i.test(jd);
    const creativityRequired =
      /\b(creat|innovat|design|ideate|brainstorm)\b/i.test(jd);
    const customerFacing =
      /\b(customer|client|stakeholder|partner|sales|support)\b/i.test(jd);

    const traits: TraitRequirement[] = [];
    if (leadershipRequired) {
      traits.push({
        traitName: 'Dominance',
        importance: 'critical',
        minLevel: 'high',
        description: 'Leadership role requires assertiveness',
      });
      traits.push({
        traitName: 'Influence',
        importance: 'important',
        minLevel: 'moderate',
        description: 'Need to inspire and persuade teams',
      });
    }
    if (analyticalRequired) {
      traits.push({
        traitName: 'Compliance',
        importance: 'critical',
        minLevel: 'high',
        description: 'Role requires analytical precision',
      });
    }
    if (customerFacing) {
      traits.push({
        traitName: 'Influence',
        importance: 'important',
        minLevel: 'high',
        description: 'Customer-facing needs strong communication',
      });
      traits.push({
        traitName: 'Steadiness',
        importance: 'important',
        minLevel: 'moderate',
        description: 'Need patience with customer interactions',
      });
    }
    if (traits.length === 0) {
      traits.push({
        traitName: 'Steadiness',
        importance: 'important',
        minLevel: 'moderate',
        description: 'General role stability',
      });
      traits.push({
        traitName: 'Compliance',
        importance: 'important',
        minLevel: 'moderate',
        description: 'Quality and accuracy needed',
      });
    }

    return {
      roleTitle: 'Extracted Role',
      seniorityLevel:
        /\b(senior|sr|lead|principal|director|vp|chief|head)\b/i.test(jd)
          ? 'senior'
          : 'mid',
      requiredTraits: traits,
      behavioralPatterns: [],
      agileRequirement: {
        minScore: 50,
        idealScore: 80,
        adaptabilityWeight: 0.5,
      },
      softSkills: [],
      hardSkills: [],
      industryContext: 'General',
      teamDynamic: /\b(team|collaborat|cross.?functional)\b/i.test(jd)
        ? 'cross_functional'
        : 'small_team',
      leadershipRequired,
      creativityRequired,
      analyticalRequired,
      customerFacing,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: CORPORATE-SCOPED CANDIDATE FETCH
  // Only fetches candidates belonging to this corporate account
  // ═══════════════════════════════════════════════════════════════════════════
  private async fetchCorporateCandidates(
    corporateId: number,
    groupId?: number,
  ): Promise<CandidateProfile[]> {
    const params: any[] = [corporateId];
    let groupFilter = '';

    if (groupId) {
      groupFilter = ` AND r.group_id = $2`;
      params.push(groupId);
    }

    const sql = `
      SELECT 
        r.id as registration_id,
        r.full_name,
        u.email,
        r.gender,
        r.mobile_number,
        r.corporate_account_id,
        r.group_id,
        g.name as group_name,
        pt.blended_style_name as personality_style,
        pt.blended_style_desc as personality_description,
        pt.code as personality_code,
        aa.total_score,
        aa.sincerity_index,
        aa.sincerity_class,
        aa.status as assessment_status,
        (aa.metadata->'disc_scores'->>'D')::numeric as disc_d,
        (aa.metadata->'disc_scores'->>'I')::numeric as disc_i,
        (aa.metadata->'disc_scores'->>'S')::numeric as disc_s,
        (aa.metadata->'disc_scores'->>'C')::numeric as disc_c,
        (SELECT MAX(aa2.total_score::numeric) 
         FROM assessment_attempts aa2 
         WHERE aa2.registration_id = r.id AND aa2.status = 'COMPLETED') as best_score,
        (SELECT COUNT(*) 
         FROM assessment_attempts aa3 
         WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count,
        r.metadata->>'currentRole' as current_role,
        r.metadata->>'designation' as designation
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN assessment_attempts aa ON aa.registration_id = r.id 
        AND aa.status = 'COMPLETED'
        AND aa.id = (
          SELECT id FROM assessment_attempts 
          WHERE registration_id = r.id AND status = 'COMPLETED'
          ORDER BY completed_at DESC NULLS LAST
          LIMIT 1
        )
      LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
      LEFT JOIN groups g ON r.group_id = g.id
      WHERE r.is_deleted = false
        AND r.is_tech_assessment IN (0, 2)
        AND r.corporate_account_id = $1
        ${groupFilter}
      ORDER BY aa.total_score DESC NULLS LAST
    `;

    try {
      const rows = await this.dataSource.query(sql, params);
      return rows.map((row: any) => ({
        registrationId: parseInt(row.registration_id),
        fullName: row.full_name || 'Unknown',
        email: row.email || '',
        gender: row.gender,
        mobileNumber: row.mobile_number,
        personalityStyle: row.personality_style,
        personalityDescription: row.personality_description,
        personalityCode: row.personality_code,
        discScoreD: row.disc_d ? parseFloat(row.disc_d) : null,
        discScoreI: row.disc_i ? parseFloat(row.disc_i) : null,
        discScoreS: row.disc_s ? parseFloat(row.disc_s) : null,
        discScoreC: row.disc_c ? parseFloat(row.disc_c) : null,
        totalScore: row.total_score ? parseFloat(row.total_score) : null,
        sincerityIndex: row.sincerity_index ? parseFloat(row.sincerity_index) : null,
        sincerityClass: row.sincerity_class,
        attemptCount: parseInt(row.attempt_count) || 0,
        bestScore: row.best_score ? parseFloat(row.best_score) : null,
        assessmentStatus: row.assessment_status || 'UNKNOWN',
        corporateAccountId: row.corporate_account_id ? parseInt(row.corporate_account_id) : null,
        groupId: row.group_id ? parseInt(row.group_id) : null,
        groupName: row.group_name || null,
        currentRole: row.current_role || row.designation || null,
      }));
    } catch (error) {
      this.logger.error(`Corporate candidate fetch error: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: MULTI-FACTOR SCORING
  // ═══════════════════════════════════════════════════════════════════════════
  private scoreCandidate(
    candidate: CandidateProfile,
    requirements: JDRequirements,
  ): ScoredCandidate {
    const vector = this.getPersonalityVector(candidate.personalityStyle);

    const bas = this.calculateBehavioralAlignment(vector, requirements);
    const ars = this.calculateAgileReadiness(
      candidate,
      requirements.agileRequirement,
    );
    const tfs = this.calculateTraitRoleFit(vector, requirements);
    const rsi = this.calculateReliabilityIndex(candidate);
    const confidenceMultiplier = this.calculateConfidenceMultiplier(candidate);

    let compositeScore =
      (bas * SCORING_WEIGHTS.behavioralAlignment +
        ars * SCORING_WEIGHTS.agileReadiness +
        tfs * SCORING_WEIGHTS.traitRoleFit +
        rsi * SCORING_WEIGHTS.reliabilityIndex) *
      confidenceMultiplier;

    // Advanced adjustments
    const industryBonus = this.calculateIndustryAlignment(vector, requirements);
    compositeScore = Math.min(100, compositeScore + industryBonus);

    const seniorityPenalty = this.calculateSeniorityMismatch(
      requirements.seniorityLevel,
      vector,
    );
    compositeScore = Math.max(0, compositeScore - seniorityPenalty);

    const teamFitScore = this.calculateTeamFit(
      vector,
      requirements.teamDynamic,
    );
    const successPrediction = this.predictSuccessRate(
      vector,
      requirements,
      bas,
      ars,
      tfs,
      rsi,
    );
    const retentionRisk = this.assessRetentionRisk(
      vector,
      requirements,
      candidate,
    );

    compositeScore = Math.round(compositeScore * 10) / 10;

    const tier =
      compositeScore >= TIER_THRESHOLDS.STRONG_FIT
        ? 'STRONG_FIT'
        : compositeScore >= TIER_THRESHOLDS.GOOD_FIT
          ? 'GOOD_FIT'
          : compositeScore >= TIER_THRESHOLDS.MODERATE_FIT
            ? 'MODERATE_FIT'
            : 'DEVELOPING';

    const matchReasons = this.generateMatchReasons(
      vector,
      requirements,
      bas,
      ars,
      tfs,
    );
    const developmentAreas = this.identifyDevelopmentAreas(
      vector,
      requirements,
    );

    return {
      candidate,
      compositeScore,
      tier,
      confidenceLevel: Math.round(confidenceMultiplier * 100),
      breakdown: {
        behavioralAlignmentScore: Math.round(bas * 10) / 10,
        agileReadinessScore: Math.round(ars * 10) / 10,
        traitRoleFitScore: Math.round(tfs * 10) / 10,
        reliabilityIndex: Math.round(rsi * 10) / 10,
        confidenceMultiplier: Math.round(confidenceMultiplier * 100) / 100,
      },
      insights: [],
      matchReasons,
      developmentAreas,
      successPrediction,
      retentionRisk,
      teamFitScore,
    };
  }

  // ── PERSONALITY VECTOR LOOKUP ──

  private getPersonalityVector(styleName: string | null) {
    if (!styleName) return { ...DEFAULT_VECTOR };
    if (PERSONALITY_VECTORS[styleName])
      return { ...PERSONALITY_VECTORS[styleName] };
    const key = Object.keys(PERSONALITY_VECTORS).find(
      (k) =>
        styleName.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(styleName.toLowerCase()),
    );
    return key ? { ...PERSONALITY_VECTORS[key] } : { ...DEFAULT_VECTOR };
  }

  // ── BEHAVIORAL ALIGNMENT SCORE (BAS) - 35% ──

  private calculateBehavioralAlignment(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    const idealVector = this.buildIdealVector(requirements);
    const similarity = this.cosineSimilarity(
      Object.values(candidateVector),
      Object.values(idealVector),
    );
    return Math.max(0, Math.min(100, (similarity + 1) * 50));
  }

  private buildIdealVector(
    requirements: JDRequirements,
  ): typeof DEFAULT_VECTOR {
    const ideal = { ...DEFAULT_VECTOR };

    for (const trait of requirements.requiredTraits) {
      const levelValue =
        trait.minLevel === 'very_high'
          ? 95
          : trait.minLevel === 'high'
            ? 80
            : trait.minLevel === 'moderate'
              ? 60
              : 40;

      const importanceMultiplier =
        trait.importance === 'critical'
          ? 1.2
          : trait.importance === 'important'
            ? 1.0
            : 0.8;

      const scaledValue = Math.min(
        100,
        Math.round(levelValue * importanceMultiplier),
      );

      switch (trait.traitName.toLowerCase()) {
        case 'dominance':
          ideal.dominance = scaledValue;
          ideal.independence = Math.round(scaledValue * 0.85);
          break;
        case 'influence':
          ideal.influence = scaledValue;
          ideal.communication = Math.round(scaledValue * 0.9);
          ideal.empathy = Math.round(scaledValue * 0.7);
          break;
        case 'steadiness':
          ideal.steadiness = scaledValue;
          ideal.teamwork = Math.round(scaledValue * 0.85);
          break;
        case 'compliance':
          ideal.compliance = scaledValue;
          ideal.analytical = Math.round(scaledValue * 0.9);
          break;
      }
    }

    if (requirements.leadershipRequired) {
      ideal.leadership = Math.max(ideal.leadership, 80);
      ideal.dominance = Math.max(ideal.dominance, 75);
    }
    if (requirements.creativityRequired) {
      ideal.creativity = Math.max(ideal.creativity, 80);
      ideal.adaptability = Math.max(ideal.adaptability, 70);
    }
    if (requirements.analyticalRequired) {
      ideal.analytical = Math.max(ideal.analytical, 85);
      ideal.compliance = Math.max(ideal.compliance, 75);
    }
    if (requirements.customerFacing) {
      ideal.communication = Math.max(ideal.communication, 80);
      ideal.empathy = Math.max(ideal.empathy, 75);
      ideal.influence = Math.max(ideal.influence, 70);
    }

    switch (requirements.teamDynamic) {
      case 'solo':
        ideal.independence = Math.max(ideal.independence, 85);
        break;
      case 'large_team':
      case 'cross_functional':
        ideal.teamwork = Math.max(ideal.teamwork, 80);
        ideal.communication = Math.max(ideal.communication, 75);
        break;
    }

    return ideal;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // ── AGILE READINESS SCORE (ARS) - 25% ──

  private calculateAgileReadiness(
    candidate: CandidateProfile,
    requirement: AgileRequirement,
  ): number {
    const score = candidate.bestScore || candidate.totalScore || 0;
    const { minScore, idealScore } = requirement;

    if (score >= idealScore) {
      const bonus = Math.min(10, ((score - idealScore) / idealScore) * 20);
      return Math.min(100, 90 + bonus);
    }
    if (score >= minScore) {
      const range = idealScore - minScore;
      const progress = (score - minScore) / (range || 1);
      return 50 + progress * 40;
    }
    const ratio = score / (minScore || 1);
    const sigmoidScore = 50 / (1 + Math.exp(-8 * (ratio - 0.5)));
    return Math.max(0, sigmoidScore);
  }

  // ── TRAIT-ROLE FIT SCORE (TFS) - 25% ──

  private calculateTraitRoleFit(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    let totalScore = 0,
      totalWeight = 0;

    for (const pattern of requirements.behavioralPatterns) {
      const patternScore = this.evaluateBehavioralPattern(
        candidateVector,
        pattern,
      );
      totalScore += patternScore * pattern.weight;
      totalWeight += pattern.weight;
    }

    if (totalWeight === 0)
      return this.fallbackTraitFit(candidateVector, requirements);
    return Math.round((totalScore / totalWeight) * 10) / 10;
  }

  private evaluateBehavioralPattern(
    candidateVector: typeof DEFAULT_VECTOR,
    pattern: BehavioralPattern,
  ): number {
    const keywords = pattern.pattern.toLowerCase();
    let score = 50;

    if (/\b(decision|decisive|authority|asserti)\b/.test(keywords))
      score =
        candidateVector.dominance * 0.7 + candidateVector.independence * 0.3;
    if (/\b(team|collaborat|cooperat)\b/.test(keywords))
      score =
        candidateVector.teamwork * 0.6 + candidateVector.communication * 0.4;
    if (/\b(creat|innovat|ideate)\b/.test(keywords))
      score =
        candidateVector.creativity * 0.7 + candidateVector.adaptability * 0.3;
    if (/\b(analy|data|logic|system)\b/.test(keywords))
      score =
        candidateVector.analytical * 0.7 + candidateVector.compliance * 0.3;
    if (/\b(lead|inspir|motiv|vision)\b/.test(keywords))
      score =
        candidateVector.leadership * 0.6 + candidateVector.influence * 0.4;
    if (/\b(stable|consistent|reliable|steady)\b/.test(keywords))
      score = candidateVector.steadiness * 0.7 + candidateVector.teamwork * 0.3;
    if (/\b(communicat|present|negotiat|persua)\b/.test(keywords))
      score =
        candidateVector.communication * 0.6 + candidateVector.influence * 0.4;
    if (/\b(empath|support|care|patient)\b/.test(keywords))
      score = candidateVector.empathy * 0.6 + candidateVector.steadiness * 0.4;
    if (/\b(adapt|flexib|change|agile)\b/.test(keywords))
      score =
        candidateVector.adaptability * 0.7 + candidateVector.creativity * 0.3;

    return Math.max(0, Math.min(100, score));
  }

  private fallbackTraitFit(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    let score = 50,
      factors = 1;

    if (requirements.leadershipRequired) {
      score += candidateVector.leadership * 0.5;
      factors++;
    }
    if (requirements.creativityRequired) {
      score += candidateVector.creativity * 0.5;
      factors++;
    }
    if (requirements.analyticalRequired) {
      score += candidateVector.analytical * 0.5;
      factors++;
    }
    if (requirements.customerFacing) {
      score += (candidateVector.communication + candidateVector.empathy) * 0.25;
      factors++;
    }
    if (
      requirements.seniorityLevel === 'lead' ||
      requirements.seniorityLevel === 'executive'
    ) {
      score += candidateVector.leadership * 0.3;
      factors++;
    }

    return Math.max(0, Math.min(100, score / factors));
  }

  // ── RELIABILITY & SINCERITY INDEX (RSI) - 15% ──

  private calculateReliabilityIndex(candidate: CandidateProfile): number {
    let score = 50;

    if (candidate.sincerityClass) {
      const sincerityClasses: Record<string, number> = {
        HIGH: 30,
        MODERATE: 20,
        ADEQUATE: 15,
        LOW: 5,
        VERY_LOW: 0,
      };
      score += sincerityClasses[candidate.sincerityClass.toUpperCase()] ?? 10;
    } else if (candidate.sincerityIndex !== null) {
      score += Math.min(30, (candidate.sincerityIndex / 100) * 30);
    } else {
      score += 15;
    }

    if (candidate.attemptCount >= 3) score += 15;
    else if (candidate.attemptCount >= 2) score += 10;
    else if (candidate.attemptCount >= 1) score += 5;

    if (candidate.bestScore !== null && candidate.totalScore !== null) {
      const consistency =
        1 -
        Math.abs(candidate.bestScore - candidate.totalScore) /
          (candidate.bestScore || 1);
      score += Math.round(consistency * 5);
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateConfidenceMultiplier(candidate: CandidateProfile): number {
    let confidence = 0.6;
    if (candidate.personalityStyle) confidence += 0.2;
    if (candidate.totalScore !== null) confidence += 0.1;
    if (candidate.sincerityIndex !== null || candidate.sincerityClass)
      confidence += 0.05;
    if (candidate.fullName && candidate.fullName !== 'Unknown')
      confidence += 0.05;
    return Math.min(1.0, confidence);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED SCORING LAYERS
  // ═══════════════════════════════════════════════════════════════════════════

  private calculateIndustryAlignment(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    const industry = requirements.industryContext.toLowerCase();
    let bonus = 0;

    if (/\b(tech|it|software|data|engineering|ai|saas)\b/.test(industry)) {
      if (vector.analytical >= 75 && vector.adaptability >= 65) bonus += 3;
      if (vector.creativity >= 70) bonus += 2;
    }
    if (/\b(finance|bank|accounting|audit|insurance)\b/.test(industry)) {
      if (vector.compliance >= 80 && vector.analytical >= 75) bonus += 4;
      if (vector.steadiness >= 70) bonus += 2;
    }
    if (
      /\b(sales|marketing|business development|advertising)\b/.test(industry)
    ) {
      if (vector.influence >= 80 && vector.communication >= 75) bonus += 4;
      if (vector.adaptability >= 70) bonus += 2;
    }
    if (/\b(healthcare|medical|hospital|pharma|care)\b/.test(industry)) {
      if (vector.empathy >= 75 && vector.steadiness >= 70) bonus += 4;
      if (vector.compliance >= 70) bonus += 2;
    }
    if (/\b(consult|advisory|strategy)\b/.test(industry)) {
      if (vector.analytical >= 75 && vector.communication >= 75) bonus += 4;
      if (vector.leadership >= 65) bonus += 2;
    }
    if (/\b(startup|entrepreneur|venture)\b/.test(industry)) {
      if (vector.adaptability >= 80 && vector.independence >= 75) bonus += 4;
      if (vector.creativity >= 70) bonus += 2;
    }

    return Math.min(5, bonus);
  }

  private calculateSeniorityMismatch(
    seniorityLevel: JDRequirements['seniorityLevel'],
    vector: typeof DEFAULT_VECTOR,
  ): number {
    let penalty = 0;
    switch (seniorityLevel) {
      case 'executive':
      case 'lead':
        if (vector.leadership < 70) penalty += 5;
        if (vector.dominance < 65) penalty += 3;
        if (vector.analytical < 65) penalty += 2;
        break;
      case 'senior':
        if (vector.leadership < 55) penalty += 3;
        if (vector.independence < 60) penalty += 2;
        break;
      case 'entry':
        if (vector.leadership > 85 && vector.dominance > 85) penalty += 2;
        break;
    }
    return Math.min(8, penalty);
  }

  private calculateTeamFit(
    vector: typeof DEFAULT_VECTOR,
    teamDynamic: JDRequirements['teamDynamic'],
  ): number {
    let score = 50;
    switch (teamDynamic) {
      case 'solo':
        score =
          vector.independence * 0.6 +
          vector.analytical * 0.3 +
          (100 - vector.teamwork) * 0.1;
        break;
      case 'small_team':
        score =
          vector.teamwork * 0.4 +
          vector.communication * 0.3 +
          vector.adaptability * 0.3;
        break;
      case 'large_team':
        score =
          vector.teamwork * 0.5 +
          vector.empathy * 0.3 +
          vector.steadiness * 0.2;
        break;
      case 'cross_functional':
        score =
          vector.communication * 0.4 +
          vector.adaptability * 0.3 +
          vector.influence * 0.3;
        break;
    }
    return Math.max(0, Math.min(100, score));
  }

  private predictSuccessRate(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    bas: number,
    ars: number,
    tfs: number,
    rsi: number,
  ): number {
    let prediction = bas * 0.3 + ars * 0.25 + tfs * 0.25 + rsi * 0.2;

    const criticalTraits = requirements.requiredTraits.filter(
      (t) => t.importance === 'critical',
    );
    for (const trait of criticalTraits) {
      const traitValue = this.getVectorDimension(vector, trait.traitName);
      const threshold =
        trait.minLevel === 'very_high'
          ? 85
          : trait.minLevel === 'high'
            ? 75
            : 60;
      if (traitValue >= threshold) prediction += 5;
    }
    prediction = Math.min(100, prediction);

    if (requirements.leadershipRequired && vector.leadership < 60)
      prediction -= 10;
    if (requirements.analyticalRequired && vector.analytical < 60)
      prediction -= 10;
    if (requirements.creativityRequired && vector.creativity < 60)
      prediction -= 8;

    const dimensions = Object.values(vector);
    const avgDim = dimensions.reduce((a, b) => a + b, 0) / dimensions.length;
    const variance =
      dimensions.reduce((sum, v) => sum + Math.pow(v - avgDim, 2), 0) /
      dimensions.length;
    if (variance < 400) prediction += 3;

    return Math.max(0, Math.min(100, Math.round(prediction)));
  }

  private assessRetentionRisk(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    candidate: CandidateProfile,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    if (
      requirements.seniorityLevel === 'entry' &&
      vector.leadership > 80 &&
      vector.dominance > 80
    )
      riskScore += 3;
    if (
      requirements.creativityRequired &&
      vector.creativity < 50 &&
      vector.adaptability < 50
    )
      riskScore += 2;
    if (
      requirements.teamDynamic === 'large_team' &&
      vector.teamwork < 50 &&
      vector.independence > 80
    )
      riskScore += 2;

    const agileScore = candidate.bestScore || candidate.totalScore || 0;
    if (
      requirements.agileRequirement.adaptabilityWeight > 0.6 &&
      agileScore < 50
    )
      riskScore += 2;
    if (requirements.teamDynamic !== 'solo' && vector.steadiness < 40)
      riskScore += 1;

    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private getVectorDimension(
    vector: typeof DEFAULT_VECTOR,
    traitName: string,
  ): number {
    const trait = traitName.toLowerCase();
    if (trait.includes('dominance')) return vector.dominance;
    if (trait.includes('influence')) return vector.influence;
    if (trait.includes('steadiness')) return vector.steadiness;
    if (trait.includes('compliance')) return vector.compliance;
    return 50;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCH REASONS & DEVELOPMENT AREAS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateMatchReasons(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    bas: number,
    ars: number,
    tfs: number,
  ): string[] {
    const reasons: string[] = [];

    if (bas >= 80)
      reasons.push('Excellent behavioral alignment with role requirements');
    else if (bas >= 65)
      reasons.push('Good behavioral alignment with role needs');

    if (ars >= 85) reasons.push('Outstanding agile readiness and adaptability');
    else if (ars >= 70)
      reasons.push('Strong agile mindset for dynamic environments');

    if (tfs >= 80)
      reasons.push('Personality traits strongly match role demands');
    else if (tfs >= 65)
      reasons.push('Personality traits complement role requirements');

    if (requirements.leadershipRequired && vector.leadership >= 80)
      reasons.push('Natural leadership qualities align with role');
    if (requirements.creativityRequired && vector.creativity >= 80)
      reasons.push('Strong creative thinking matches innovation needs');
    if (requirements.analyticalRequired && vector.analytical >= 80)
      reasons.push('Analytical mindset suits data-driven requirements');
    if (
      requirements.customerFacing &&
      (vector.communication >= 80 || vector.empathy >= 80)
    )
      reasons.push('Strong communication/empathy for customer-facing role');

    if (reasons.length === 0)
      reasons.push('Candidate has completed assessment with available data');
    return reasons;
  }

  private identifyDevelopmentAreas(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): string[] {
    const areas: string[] = [];

    if (requirements.leadershipRequired && vector.leadership < 60)
      areas.push(
        'Leadership development needed - consider mentoring/coaching programs',
      );
    if (requirements.analyticalRequired && vector.analytical < 60)
      areas.push(
        'Analytical skills enhancement - data literacy training recommended',
      );
    if (requirements.creativityRequired && vector.creativity < 60)
      areas.push('Creative thinking - design thinking workshops could help');
    if (requirements.customerFacing && vector.communication < 60)
      areas.push(
        'Communication skills - presentation and interpersonal training',
      );
    if (requirements.customerFacing && vector.empathy < 60)
      areas.push('Emotional intelligence development for client interactions');
    if (
      requirements.agileRequirement.adaptabilityWeight > 0.6 &&
      vector.adaptability < 60
    )
      areas.push(
        'Adaptability & change management - agile training recommended',
      );
    if (
      (requirements.teamDynamic === 'large_team' ||
        requirements.teamDynamic === 'cross_functional') &&
      vector.teamwork < 60
    )
      areas.push(
        'Team collaboration skills - cross-functional project experience needed',
      );
    if (requirements.teamDynamic === 'solo' && vector.independence < 60)
      areas.push(
        'Independent working capability - self-management skills development',
      );

    return areas;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5: AI INSIGHTS (using Groq SDK)
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateBatchInsights(
    candidates: ScoredCandidate[],
    requirements: JDRequirements,
  ): Promise<void> {
    const topForInsights = candidates.slice(0, 5);

    const candidateSummaries = topForInsights.map((sc, i) => ({
      rank: i + 1,
      name: sc.candidate.fullName,
      style: sc.candidate.personalityStyle || 'Unknown',
      score: sc.compositeScore,
      tier: sc.tier,
      group: sc.candidate.groupName || 'General',
      strengths: sc.matchReasons.filter(r => !r.toLowerCase().includes('agile')).join('; '),
      gaps: sc.developmentAreas.filter(a => !a.toLowerCase().includes('agile')).join('; '),
    }));

    const prompt = `You are an expert talent analyst. Generate brief, specific insights for each candidate matched to this role.

ROLE: ${requirements.roleTitle} (${requirements.seniorityLevel} level)
Key Requirements: ${requirements.softSkills.join(', ')}
Industry: ${requirements.industryContext}

CANDIDATES:
${candidateSummaries
  .map(
    (
      c,
    ) => `${c.rank}. ${c.name} | Style: ${c.style} | Score: ${c.score}/100 | Tier: ${c.tier} | Group: ${c.group}
   Strengths: ${c.strengths}
   Gaps: ${c.gaps}`,
  )
  .join('\n')}

For each candidate, provide a 1-2 sentence insight about their fit and one actionable recommendation.
Output ONLY a JSON array:
[{"rank": 1, "insight": "...", "recommendation": "..."}, ...]`;

    try {
      const completion = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const jsonStr = (completion.choices[0]?.message?.content || '').trim();
      const cleanJson = jsonStr
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const insights = JSON.parse(cleanJson) as {
        rank: number;
        insight: string;
        recommendation: string;
      }[];

      for (const item of insights) {
        const idx = item.rank - 1;
        if (idx >= 0 && idx < topForInsights.length) {
          topForInsights[idx].insights = [item.insight, item.recommendation];
        }
      }
    } catch (error) {
      this.logger.warn(`Insight generation failed: ${error.message}`);
      for (const sc of topForInsights) {
        sc.insights = [
          `${sc.candidate.personalityStyle || 'This candidate'} shows ${sc.tier === 'STRONG_FIT' ? 'excellent' : sc.tier === 'GOOD_FIT' ? 'good' : 'moderate'} alignment with the ${requirements.roleTitle} role.`,
        ];
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 6: WORKFORCE INTELLIGENCE (Corporate-exclusive)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildWorkforceInsights(
    allScored: ScoredCandidate[],
    requirements: JDRequirements,
  ): WorkforceInsights {
    const totalAssessedCandidates = allScored.length;

    // Average match score
    const averageMatchScore =
      totalAssessedCandidates > 0
        ? Math.round(
            (allScored.reduce((sum, sc) => sum + sc.compositeScore, 0) /
              totalAssessedCandidates) *
              10,
          ) / 10
        : 0;

    // Tier distribution
    const tierDistribution: Record<string, number> = {
      STRONG_FIT: 0,
      GOOD_FIT: 0,
      MODERATE_FIT: 0,
      DEVELOPING: 0,
    };
    allScored.forEach((sc) => {
      tierDistribution[sc.tier]++;
    });

    // Top personality styles
    const styleMap: Record<string, { count: number; totalScore: number }> = {};
    for (const sc of allScored) {
      const style = sc.candidate.personalityStyle || 'Unknown';
      if (!styleMap[style]) styleMap[style] = { count: 0, totalScore: 0 };
      styleMap[style].count++;
      styleMap[style].totalScore += sc.compositeScore;
    }
    const topPersonalityStyles = Object.entries(styleMap)
      .map(([style, data]) => ({
        style,
        count: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Group distribution (corporate-specific)
    const groupMap: Record<string, { count: number; totalScore: number }> = {};
    for (const sc of allScored) {
      const group = sc.candidate.groupName || 'Unassigned';
      if (!groupMap[group]) groupMap[group] = { count: 0, totalScore: 0 };
      groupMap[group].count++;
      groupMap[group].totalScore += sc.compositeScore;
    }
    const groupDistribution = Object.entries(groupMap)
      .map(([groupName, data]) => ({
        groupName,
        candidateCount: data.count,
        avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Talent gaps
    const talentGapsSummary: string[] = [];
    const strongFitPct =
      totalAssessedCandidates > 0
        ? (tierDistribution.STRONG_FIT / totalAssessedCandidates) * 100
        : 0;

    if (strongFitPct < 5) {
      talentGapsSummary.push(
        `Critical gap: Only ${Math.round(strongFitPct)}% of your workforce is a strong fit for this role - consider external hiring or targeted development programs`,
      );
    } else if (strongFitPct < 15) {
      talentGapsSummary.push(
        `Moderate gap: ${Math.round(strongFitPct)}% strong fit rate - some development investment recommended`,
      );
    }

    if (requirements.leadershipRequired) {
      const leadersCount = allScored.filter((sc) => {
        const v = this.getPersonalityVector(sc.candidate.personalityStyle);
        return v.leadership >= 75;
      }).length;
      if (leadersCount < 3) {
        talentGapsSummary.push(
          `Leadership pipeline: Only ${leadersCount} candidates show strong natural leadership traits`,
        );
      }
    }

    if (requirements.analyticalRequired) {
      const analyticalCount = allScored.filter((sc) => {
        const v = this.getPersonalityVector(sc.candidate.personalityStyle);
        return v.analytical >= 75;
      }).length;
      if (analyticalCount < 3) {
        talentGapsSummary.push(
          `Analytical talent: Only ${analyticalCount} candidates demonstrate strong analytical capabilities`,
        );
      }
    }

    const highRetentionRisk = allScored.filter(
      (sc) => sc.retentionRisk === 'HIGH',
    ).length;
    if (highRetentionRisk > totalAssessedCandidates * 0.3) {
      talentGapsSummary.push(
        `Retention warning: ${highRetentionRisk} candidates (${Math.round((highRetentionRisk / totalAssessedCandidates) * 100)}%) show high retention risk for this role`,
      );
    }

    return {
      totalAssessedCandidates,
      averageMatchScore,
      tierDistribution,
      topPersonalityStyles,
      groupDistribution,
      talentGapsSummary,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE FORMATTING - Premium corporate-branded output
  // ═══════════════════════════════════════════════════════════════════════════

  formatMatchResultForChat(result: JDMatchResult): string {
    const company = result.companyName || 'Your Organization';

    if (result.matchedCandidates.length === 0) {
      return (
        `**🎯 Talent Match Report - ${company}**\n\n` +
        `No candidates matched the criteria for **${result.parsedRequirements.roleTitle}**.\n\n` +
        `**Position Details:**\n` +
        `• Seniority: ${result.parsedRequirements.seniorityLevel}\n` +
        `• Industry: ${result.parsedRequirements.industryContext}\n` +
        `• Team: ${result.parsedRequirements.teamDynamic.replace(/_/g, ' ')}\n\n` +
        `*Please ensure candidates have completed their behavioral assessments.*`
      );
    }

    const req = result.parsedRequirements;
    const strongCount = result.matchedCandidates.filter(
      (c) => c.tier === 'STRONG_FIT',
    ).length;
    const goodCount = result.matchedCandidates.filter(
      (c) => c.tier === 'GOOD_FIT',
    ).length;
    const moderateCount = result.matchedCandidates.filter(
      (c) => c.tier === 'MODERATE_FIT',
    ).length;

    let response = `**🎯 Talent Intelligence Report**\n`;
    response += `**${company}** - Internal Talent Match\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ── Role Overview ──
    response += `🏢 **Role:** ${req.roleTitle} *(${req.seniorityLevel} level)*\n`;
    response += `📍 **Industry:** ${req.industryContext}\n`;
    response += `👥 **Team:** ${req.teamDynamic.replace(/_/g, ' ')}\n\n`;

    // ── Competencies ──
    const competencies: string[] = [];
    if (req.leadershipRequired) competencies.push('Leadership');
    if (req.analyticalRequired) competencies.push('Analytical Thinking');
    if (req.creativityRequired) competencies.push('Creativity');
    if (req.customerFacing) competencies.push('Client-Facing');
    if (req.softSkills.length > 0)
      competencies.push(...req.softSkills.slice(0, 3));

    if (competencies.length > 0) {
      response += `🔑 **Core Competencies:** ${competencies.join(' · ')}\n\n`;
    }

    // ── Summary ──
    response += `📊 **${result.totalCandidatesEvaluated}** employees evaluated → **${result.matchedCandidates.length}** top matches\n`;
    const tierSummary: string[] = [];
    if (strongCount > 0) tierSummary.push(`🟢 ${strongCount} Strong`);
    if (goodCount > 0) tierSummary.push(`🔵 ${goodCount} Good`);
    if (moderateCount > 0) tierSummary.push(`🟡 ${moderateCount} Moderate`);
    if (tierSummary.length > 0) response += `${tierSummary.join('  •  ')}\n`;

    response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // ── Candidates ──
    result.matchedCandidates.forEach((sc, index) => {
      const tierDot =
        sc.tier === 'STRONG_FIT'
          ? '🟢'
          : sc.tier === 'GOOD_FIT'
            ? '🔵'
            : sc.tier === 'MODERATE_FIT'
              ? '🟡'
              : '🟠';

      const tierLabel =
        sc.tier === 'STRONG_FIT'
          ? 'Strong Fit'
          : sc.tier === 'GOOD_FIT'
            ? 'Good Fit'
            : sc.tier === 'MODERATE_FIT'
              ? 'Moderate Fit'
              : 'Developing';

      const rank = index + 1;
      const medal =
        rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

      response += `\n${medal} **${sc.candidate.fullName}** ${tierDot} *${tierLabel}*\n\n`;

      // Metrics
      response += `**Match Score: ${sc.compositeScore}/100** · Confidence: ${sc.confidenceLevel}%\n`;

      if (sc.candidate.personalityStyle) {
        response += `**Behavioral Profile:** ${sc.candidate.personalityStyle}\n`;
      }

      // Corporate Specific: Designation / Role / Group
      if (sc.candidate.currentRole) {
        response += `**Designation:** ${sc.candidate.currentRole}\n`;
      } else if (sc.candidate.groupName) {
        response += `**Group:** ${sc.candidate.groupName}\n`;
      }

      // Predictions
      if (sc.successPrediction !== undefined) {
        response += `\n**Predictions:**\n`;
        response += `• Success Rate - **${sc.successPrediction}%**`;
        if (sc.retentionRisk) {
          const riskIcon =
            sc.retentionRisk === 'LOW'
              ? '✅'
              : sc.retentionRisk === 'MEDIUM'
                ? '⚠️'
                : '🔴';
          response += `  ·  Retention Risk - ${riskIcon} ${sc.retentionRisk}`;
        }
        response += '\n';
        if (sc.teamFitScore !== undefined) {
          response += `• Team Compatibility - **${sc.teamFitScore}**/100\n`;
        }
      }

      // Strengths
      if (sc.matchReasons.length > 0) {
        response += `\n**Key Strengths:**\n`;
        sc.matchReasons.slice(0, 3).forEach((reason) => {
          response += `✓ ${reason}\n`;
        });
      }

      // AI Insights
      if (sc.insights.length > 0) {
        response += `\n💡 *${sc.insights[0]}*\n`;
        if (sc.insights.length > 1) {
          response += `📌 *${sc.insights[1]}*\n`;
        }
      }

      // Growth
      if (sc.developmentAreas.length > 0 && sc.tier !== 'STRONG_FIT') {
        response += `\n**Areas for Growth:**\n`;
        sc.developmentAreas.slice(0, 2).forEach((area) => {
          response += `→ ${area}\n`;
        });
      }

      if (index < result.matchedCandidates.length - 1) {
        response += `\n──────────────────────────\n`;
      }
    });

    // ── Workforce Intelligence (Corporate Exclusive) ──
    if (result.workforceInsights) {
      const wi = result.workforceInsights;
      response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      response += `\n**📈 Workforce Intelligence**\n\n`;

      const total = wi.totalAssessedCandidates;
      response += `**Talent Pool Distribution:**\n`;
      response += `🟢 Strong: ${wi.tierDistribution.STRONG_FIT} (${Math.round((wi.tierDistribution.STRONG_FIT / total) * 100)}%)`;
      response += `  •  🔵 Good: ${wi.tierDistribution.GOOD_FIT} (${Math.round((wi.tierDistribution.GOOD_FIT / total) * 100)}%)\n`;
      response += `🟡 Moderate: ${wi.tierDistribution.MODERATE_FIT} (${Math.round((wi.tierDistribution.MODERATE_FIT / total) * 100)}%)`;

      const gaps = wi.talentGapsSummary;
      if (gaps && gaps.length > 0) {
        response += `\n\n**Strategic Insights:**\n`;
        gaps.forEach((gap) => (response += `• ${gap}\n`));
      }
    }

    response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `*Multi-dimensional analysis of ${result.totalCandidatesEvaluated} employees*\n`;

    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY: Extract JD from user message
  // ═══════════════════════════════════════════════════════════════════════════

  extractJDFromMessage(message: string): string {
    const prefixPatterns = [
      /(?:find|match|search|identify|list|show|get|who)\s+(?:candidates?|people|users?|employees?|suitable)\s+(?:for|matching|suited\s+for|that\s+match|who\s+(?:fit|match|suit))\s*[:-]?\s*([\s\S]+)/i,
      /(?:job\s*description|jd)\s*[:-]?\s*([\s\S]+)/i,
      /(?:find|match|search)\s+(?:for|candidates?\s+for)\s*[:-]?\s*([\s\S]+)/i,
      /(?:who\s+(?:is|are)\s+(?:best|suitable|fit|right|ideal)\s+(?:for|candidate))\s*[:-]?\s*([\s\S]+)/i,
      /(?:suitable\s+(?:candidates?|employees?)\s+for)\s*[:-]?\s*([\s\S]+)/i,
      /(?:match\s+(?:my\s+)?(?:employees?|team|people)\s+(?:for|to|against|with))\s*[:-]?\s*([\s\S]+)/i,
    ];

    for (const pattern of prefixPatterns) {
      const match = message.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    // If no prefix pattern matched, use the whole message as JD
    return message.trim();
  }

  /** Check if a message looks like a JD matching request */
  isJDMatchingRequest(message: string): boolean {
    const patterns = [
      /\b(?:find|match|search|identify|list|show|get)\b.*\b(?:candidates?|people|employees?|suitable|talent)\b.*\b(?:for|matching|suited)\b/i,
      /\b(?:job\s*description|jd)\b.*\b(?:match|find|search|candidates?|suitable)\b/i,
      /\b(?:who|which)\b.*\b(?:suitable|fit|right|ideal|best)\b.*\b(?:for|candidate)\b/i,
      /\b(?:match|find)\b.*\b(?:employees?|people|candidates?|talent)\b.*\b(?:to|for|against|with)\b/i,
      /\b(?:talent\s*match|candidate\s*match|role\s*fit|jd\s*match)\b/i,
      /\b(?:suitable\s+for|best\s+fit\s+for|who\s+fits?)\b/i,
    ];

    return patterns.some((p) => p.test(message));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HR BRAIN: 14-Use-Case People Intelligence Engine
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Classify the user's query into one of 14 workforce intelligence intent categories.
   * Uses a lightweight GPT call to avoid hardcoded regex fragility.
   */
  private async classifyIntent(query: string): Promise<string> {
    const classificationPrompt = `You are an intent classifier for a People Intelligence platform. Classify the user's question into EXACTLY ONE of these intent keys. Respond with ONLY the key, no explanation.

INTENT KEYS:
- individual_profile    → Questions about a specific employee's personality, traits, character, working style
- role_fitment          → Whether someone is in the right role, internal mobility, who fits what role
- team_formation        → Building balanced teams, complementary profiles, who to put together
- project_team          → Recommending a specific N-member team for a project or goal
- manager_guidance      → How to manage, lead, communicate with, give feedback to a specific person
- team_dynamics         → Why employees clash, team conflict, interpersonal friction, collaboration issues
- succession_planning   → Future leaders, succession pipeline, who has leadership potential
- capability_mapping    → Overall workforce strengths/gaps, dominant traits across the org, skill map
- learning_dev          → Training needs, personal development plans, what to teach/develop in whom
- workforce_planning    → Can we launch X, do we have enough capability, strategic people planning
- recruitment_intel     → What to look for when hiring, what traits our top performers share
- people_strategy       → HR policy, communication frameworks, org-wide people practices
- general               → Anything else workforce-related that doesn't fit above categories

USER QUERY: "${query.replace(/"/g, "'")}"`; 

    try {
      const res = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: classificationPrompt }],
        temperature: 0,
        max_tokens: 30,
      });
      const intent = (res.choices[0]?.message?.content || 'general').trim().toLowerCase().replace(/[^a-z_]/g, '');
      this.logger.log(`🧭 Intent classified: ${intent}`);
      return intent;
    } catch {
      return 'general';
    }
  }

  /**
   * Build a compact employee data string for use in AI prompts.
   * Behaviorally rich but no raw numeric scores are exposed.
   */
  private buildEmployeeDataStr(candidates: CandidateProfile[]): string {
    return candidates.map(c => {
      const scores = [
        { label: 'Dominance (D)', val: c.discScoreD ?? 0 },
        { label: 'Influence (I)', val: c.discScoreI ?? 0 },
        { label: 'Steadiness (S)', val: c.discScoreS ?? 0 },
        { label: 'Compliance (C)', val: c.discScoreC ?? 0 },
      ].sort((a, b) => b.val - a.val);

      const level = (v: number | null) => v == null ? 'Unknown' : v >= 18 ? 'High' : v >= 12 ? 'Moderate' : 'Low';

      return `[${c.fullName}]
Style: ${c.personalityStyle || 'Unknown'} | Code: ${c.personalityCode || 'N/A'}
Description: ${c.personalityDescription || 'N/A'}
D-Dominance: ${level(c.discScoreD)} | I-Influence: ${level(c.discScoreI)} | S-Steadiness: ${level(c.discScoreS)} | C-Compliance: ${level(c.discScoreC)}
Trait Order: ${scores.map((s, i) => `${i + 1}. ${s.label}`).join(' → ')}
Group: ${c.groupName || 'Unassigned'} | Designation: ${c.currentRole || 'N/A'} | Gender: ${c.gender || 'N/A'}`;
    }).join('\n\n');
  }

  /** Shared corporate system role prefix injected into all specialized prompts */
  private readonly SYSTEM_ROLE_PREFIX = `You are the OriginBI People Intelligence Brain — an AI-powered Workforce Decision Advisor serving senior HR leaders and C-suite executives.

DISC MODEL (for your analysis only — never share raw scores):
- Dominance (D): Results-driven, decisive, assertive, competitive
- Influence (I): Persuasive, optimistic, collaborative, relationship-building
- Steadiness (S): Consistent, patient, loyal, empathetic, stable
- Compliance (C): Precise, analytical, quality-focused, systematic

RESPONSE RULES:
1. NEVER reveal raw scores, numbers, or DISC codes — speak in behavioral language only.
2. Maintain formal, boardroom-level tone. No casual phrasing.
3. Reference actual employee names from the data below.
4. Always close with a "Strategic Recommendation" the leader can act on.
5. Use bold headers and bullet points. Keep it executive-brief-style.
6. If a query is not workforce-related, decline professionally.`;

  // ─── MAIN ROUTING ENTRY POINT ───────────────────────────────────────────────

  async analyzeHRQuery(corporateId: number, query: string): Promise<string> {
    const startTime = Date.now();
    this.logger.log(`🧠 CORPORATE HR BRAIN v2 - Corporate #${corporateId}`);

    const candidates = await this.fetchCorporateCandidates(corporateId);
    if (candidates.length === 0) {
      return 'You currently have no employees registered in the system. I need employee behavioral data to answer your question.';
    }

    const intent = await this.classifyIntent(query);
    const employeeData = this.buildEmployeeDataStr(candidates);

    this.logger.log(`🎯 Routing to handler: ${intent} | ${candidates.length} employees`);

    let answer: string;
    switch (intent) {
      case 'individual_profile':
        answer = await this.handleIndividualProfile(query, candidates, employeeData);
        break;
      case 'role_fitment':
        answer = await this.handleRoleFitment(query, candidates, employeeData);
        break;
      case 'team_formation':
      case 'project_team':
        answer = await this.handleTeamFormation(query, candidates, employeeData);
        break;
      case 'manager_guidance':
        answer = await this.handleManagerGuidance(query, candidates, employeeData);
        break;
      case 'team_dynamics':
        answer = await this.handleTeamDynamics(query, candidates, employeeData);
        break;
      case 'succession_planning':
        answer = await this.handleSuccessionPlanning(query, candidates, employeeData);
        break;
      case 'capability_mapping':
        answer = await this.handleCapabilityMapping(query, candidates, employeeData);
        break;
      case 'learning_dev':
        answer = await this.handleLearningDev(query, candidates, employeeData);
        break;
      case 'workforce_planning':
        answer = await this.handleWorkforcePlanning(query, candidates, employeeData);
        break;
      case 'recruitment_intel':
        answer = await this.handleRecruitmentIntel(query, candidates, employeeData);
        break;
      case 'people_strategy':
        answer = await this.handlePeopleStrategy(query, candidates, employeeData);
        break;
      default:
        answer = await this.handleGeneralHRQuery(query, candidates, employeeData);
    }

    this.logger.log(`✅ HR Query [${intent}] processed in ${Date.now() - startTime}ms`);
    return answer;
  }

  // ─── UC1: INDIVIDUAL EMPLOYEE INTELLIGENCE ──────────────────────────────────

  private async handleIndividualProfile(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: INDIVIDUAL EMPLOYEE INTELLIGENCE ━━━
The leader is asking about a specific employee. Provide a deeply detailed behavioral intelligence brief covering:

1. **Core Behavioral Character** — Natural operating style, what drives this person, how they make decisions
2. **Communication Style** — How they prefer to give and receive information; their natural communication strengths
3. **Collaboration & Teamwork** — How they function in a group; their preferred team dynamics
4. **Stress & Pressure Response** — How this person behaves when under deadline, conflict, or heavy workload
5. **Leadership Potential** — Whether they show natural leadership indicators and what kind of leader they would be
6. **Ideal Working Environment** — What conditions allow this person to deliver their best work
7. **Development Areas** — Where behavioral growth would unlock the most professional value
8. **Strategic Recommendation** — One concrete, actionable suggestion for the manager regarding this employee

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC2: ROLE FITMENT & INTERNAL MOBILITY ──────────────────────────────────

  private async handleRoleFitment(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const roleContext = candidates.map(c => `${c.fullName}: ${c.currentRole || 'Role not specified'} | Group: ${c.groupName || 'N/A'}`).join('\n');

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: ROLE FITMENT & INTERNAL MOBILITY ━━━
The leader wants to understand whether employees are in the right roles and where internal mobility opportunities exist. Analyze using behavioral alignment:

FRAMEWORK FOR ROLE FITMENT:
- High-D profiles → Leadership, sales, business development, decision-making roles
- High-I profiles → Client-facing, marketing, training, communications, partnerships
- High-S profiles → Operations, customer service, HR support, process management
- High-C profiles → Finance, compliance, quality assurance, engineering, data analysis
- Blended profiles → Match based on the dominant-secondary combination

YOUR ANALYSIS SHOULD COVER:
1. **Behaviorally Well-Placed Employees** — Who appears to be in a role that naturally suits their character
2. **Potentially Underutilized Talent** — Employees whose behavioral profile suggests they could excel in higher-impact or different roles
3. **Role-Profile Mismatches** — Anyone showing indicators of behavioral misalignment with their current position (flight risk signals)
4. **Internal Mobility Opportunities** — Specific alternative roles within the organization that would better leverage certain employees' natural strengths
5. **Strategic Recommendation** — Priority action for the HR leader on talent deployment

CURRENT EMPLOYEE ROLES:
${roleContext}

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC4 & UC5: TEAM FORMATION & PROJECT TEAM RECOMMENDATION ────────────────

  private async handleTeamFormation(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: TEAM FORMATION INTELLIGENCE ━━━
The leader wants to build a behaviorally balanced team. Apply the following framework:

PRINCIPLES OF BEHAVIORAL TEAM ARCHITECTURE:
- Every high-performing team needs a mix of:
  • A Driver (High D) → Pushes for results, owns decisions, sets pace
  • A Connector (High I) → Maintains team morale, handles relationships, communicates externally
  • A Stabilizer (High S) → Ensures process consistency, team harmony, and reliable follow-through
  • An Analyzer (High C) → Maintains quality, spots risk, ensures compliance and accuracy

- Natural complements: D+I (action + people), S+C (stability + precision)
- Natural friction zones: High D vs High S (speed vs caution), High I vs High C (emotion vs logic)

YOUR ANALYSIS SHOULD COVER:
1. **Recommended Team Composition** — Name each person and the role they would naturally fill (Driver, Connector, Stabilizer, Analyzer)
2. **Why This Team Works** — The specific behavioral complementarity that makes this combination effective
3. **Potential Friction Points** — Any personality dynamics the team leader should proactively manage
4. **Team Operating Advice** — How this team should structure meetings, decisions, and conflict resolution based on their profiles
5. **Strategic Recommendation** — One structural or process suggestion to maximize team performance

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC6: MANAGER-TO-EMPLOYEE GUIDANCE ──────────────────────────────────────

  private async handleManagerGuidance(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: MANAGER COPILOT — EMPLOYEE GUIDANCE ━━━
The leader is seeking guidance on how to manage, communicate with, or approach a specific employee. Act as an executive-level Manager Copilot.

PROVIDE GUIDANCE ACROSS THESE DIMENSIONS:
1. **Communication Approach** — Exactly how to open the conversation, what tone and style to adopt, and what to avoid with this specific person
2. **Feedback Style** — How this employee receives constructive criticism best (directly, gently, with data, with vision, etc.)
3. **Motivation Levers** — What intrinsically motivates this person based on their behavioral profile; what demotivates them
4. **Delegation Strategy** — What kinds of tasks and responsibilities this person handles best; how much autonomy to give
5. **Conflict & Difficult Conversations** — Specific script guidance for navigating tension, performance discussions, or disagreements with this individual
6. **Recognition & Development** — What types of recognition resonate with this person; what growth opportunities to offer
7. **Strategic Recommendation** — One immediate action the manager should take based on this analysis

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC7: TEAM DYNAMICS & CONFLICT INTELLIGENCE ─────────────────────────────

  private async handleTeamDynamics(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: TEAM DYNAMICS & CONFLICT INTELLIGENCE ━━━
The leader wants to understand interpersonal friction, behavioral conflict, or team dynamics within the workforce.

DISC CONFLICT PATTERNS TO ANALYZE:
- D vs S: High-urgency driver clashes with patience-first stabilizer → friction around pace and risk tolerance
- D vs C: Results-focus vs quality-focus → disagreement on timelines vs standards
- I vs C: Emotion-led vs data-led → conflict on how decisions should be made
- I vs S: Enthusiasm vs caution → divergence on change tolerance
- D vs D: Two drivers competing for control → power struggles in leadership voids

YOUR ANALYSIS SHOULD COVER:
1. **Identified Conflict Dynamic** — Which employees are involved and what behavioral gap is creating friction
2. **Root Cause Analysis** — The underlying DISC contrast that drives the disagreement (explained in behavioral terms, not scores)
3. **Impact on Team** — How this dynamic affects team output, morale, and collaboration
4. **Mediation Strategy** — Specific, practical advice for the manager to bridge these behavioral differences
5. **Who Could Complement the Leader** — If asked, recommend who in the team would best complement a specific leader's behavioral gaps
6. **Structural Fix** — Any team or role structure change that would reduce this friction organically
7. **Strategic Recommendation** — Priority next step for the team leader

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC8: LEADERSHIP & SUCCESSION PLANNING ──────────────────────────────────

  private async handleSuccessionPlanning(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    // Pre-rank by leadership indicators (High D + High I in DISC = natural leadership signals)
    const leadershipRanked = [...candidates]
      .map(c => ({
        name: c.fullName,
        style: c.personalityStyle,
        group: c.groupName,
        role: c.currentRole,
        leaderScore: ((c.discScoreD ?? 0) * 0.5) + ((c.discScoreI ?? 0) * 0.3) + ((c.discScoreC ?? 0) * 0.2),
      }))
      .sort((a, b) => b.leaderScore - a.leaderScore)
      .slice(0, 8);

    const leadershipContext = leadershipRanked
      .map((e, i) => `${i + 1}. ${e.name} | Style: ${e.style || 'Unknown'} | Group: ${e.group || 'N/A'} | Role: ${e.role || 'N/A'}`)
      .join('\n');

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: LEADERSHIP IDENTIFICATION & SUCCESSION PLANNING ━━━
The leader wants to identify future leaders and build a succession pipeline from within the existing workforce.

BEHAVIORAL INDICATORS OF LEADERSHIP POTENTIAL:
- Natural authority and decisiveness (High Dominance behavioral character)
- Ability to inspire, persuade, and rally others (High Influence behavioral character)
- Strategic and quality thinking for structured leadership (High Compliance paired with D)
- Emotional intelligence and team cohesion for people-led leadership (High Steadiness paired with I)

LEADERSHIP ARCHETYPES TO IDENTIFY:
- The Commanding Leader → Drives results, commands rooms, takes ownership. Best for fast-growth or turnaround environments.
- The People Leader → Inspires loyalty, builds culture, coaches teams. Best for stable, relationship-intensive roles.
- The Strategic Leader → Combines vision with discipline. Best for complex, multi-stakeholder or analytical leadership roles.
- The Servant Leader → Prioritizes team development over personal glory. Best for long-term organizational stability.

PRE-ANALYZED LEADERSHIP CANDIDATES (internal ranking by behavioral leadership indicators):
${leadershipContext}

YOUR ANALYSIS SHOULD COVER:
1. **Strongest Leadership Candidates** — Top individuals by behavioral indicators of natural leadership character
2. **Leadership Archetype** — The specific type of leader each candidate would naturally be
3. **Readiness Assessment** — Who is behaviorally ready now vs who needs development before stepping up
4. **Succession Gaps** — Where critical roles currently have no strong internal successor
5. **Development Pathway** — What experiences or responsibilities to offer the top candidates to accelerate readiness
6. **Strategic Recommendation** — Priority succession action for the organization

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC9: CAPABILITY MAPPING ─────────────────────────────────────────────────

  private async handleCapabilityMapping(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    // Build a behavioral capability distribution summary
    const total = candidates.length;
    const highD = candidates.filter(c => (c.discScoreD ?? 0) >= 18).length;
    const highI = candidates.filter(c => (c.discScoreI ?? 0) >= 18).length;
    const highS = candidates.filter(c => (c.discScoreS ?? 0) >= 18).length;
    const highC = candidates.filter(c => (c.discScoreC ?? 0) >= 18).length;

    const styleMap: Record<string, number> = {};
    candidates.forEach(c => {
      const s = c.personalityStyle || 'Unknown';
      styleMap[s] = (styleMap[s] || 0) + 1;
    });
    const topStyles = Object.entries(styleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([style, count]) => `${style}: ${count} employees (${Math.round((count / total) * 100)}%)`)
      .join('\n');

    const groupMap: Record<string, number> = {};
    candidates.forEach(c => {
      const g = c.groupName || 'Unassigned';
      groupMap[g] = (groupMap[g] || 0) + 1;
    });
    const groupDist = Object.entries(groupMap)
      .map(([group, count]) => `${group}: ${count} employees`)
      .join('\n');

    const capabilityContext = `WORKFORCE BEHAVIORAL CAPABILITY SUMMARY (${total} employees total):
━━━ Behavioral Strength Distribution ━━━
• Results-Drivers (High Dominance): ${highD} employees (${Math.round((highD / total) * 100)}%)
• Relationship-Builders (High Influence): ${highI} employees (${Math.round((highI / total) * 100)}%)
• Stability-Anchors (High Steadiness): ${highS} employees (${Math.round((highS / total) * 100)}%)
• Precision-Thinkers (High Compliance): ${highC} employees (${Math.round((highC / total) * 100)}%)

━━━ Top Behavioral Archetypes ━━━
${topStyles}

━━━ Group Distribution ━━━
${groupDist}`;

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: ORGANIZATIONAL CAPABILITY MAPPING ━━━
The leader wants to understand the behavioral capability landscape of their workforce — what strengths exist, where gaps are, and what risk concentrations exist.

PRE-COMPUTED CAPABILITY SNAPSHOT:
${capabilityContext}

YOUR ANALYSIS SHOULD COVER:
1. **Dominant Organizational Character** — The overall behavioral "personality" of this workforce (e.g., "execution-heavy with limited strategic vision bandwidth")
2. **Behavioral Strengths** — What this workforce does exceptionally well based on its dominant traits
3. **Critical Capability Gaps** — What behavioral capabilities are scarce or missing, and what risks this creates
4. **Concentration Risk** — Whether any critical behavioral capability is concentrated in only 1-2 individuals (single points of failure)
5. **Team-Level Analysis** — Which groups/teams have well-rounded profiles vs which are behaviorally imbalanced
6. **Hidden Talent Identification** — Employees whose behavioral profile suggests significant underutilized potential
7. **Strategic Recommendation** — Specific workforce investment or restructuring suggestion to address the most critical gap

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 2000);
  }

  // ─── UC11: LEARNING & DEVELOPMENT RECOMMENDATIONS ───────────────────────────

  private async handleLearningDev(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: LEARNING & DEVELOPMENT RECOMMENDATIONS ━━━
The leader wants personalized development recommendations — either for a specific employee or for the organization.

L&D FRAMEWORK BY BEHAVIORAL PROFILE:
- High-D employees → Benefit from: executive leadership programs, strategic thinking, negotiation, emotional regulation training. Risk of stagnation if development is too slow.
- High-I employees → Benefit from: structured thinking, data literacy, project management, follow-through accountability. Risk of over-promising and under-delivering.
- High-S employees → Benefit from: change management, assertiveness training, presentation skills, decision-making under ambiguity. Risk of resistance to new responsibilities.
- High-C employees → Benefit from: leadership presence, stakeholder communication, big-picture thinking, tolerance for imperfection. Risk of analysis paralysis.

FOR INDIVIDUALS: Provide a 6-month development roadmap tailored to their specific profile and the next role they could realistically target.
FOR ORGANIZATION: Identify the top 3 capability development priorities that would have the greatest collective impact.

YOUR ANALYSIS SHOULD COVER:
1. **Development Priority** — The #1 behavioral growth area for the employee/organization
2. **Recommended Learning Interventions** — Specific training formats, programs, or experiences (not generic courses)
3. **Stretch Assignments** — Real on-the-job experiences that would accelerate behavioral development
4. **Mentoring Pairing** — If applicable, which colleague's behavioral profile would provide the ideal developmental contrast
5. **6-Month Development Roadmap** — Phased plan of actions, milestones, and expected behavioral shifts
6. **Strategic Recommendation** — How this development investment connects to a specific business outcome

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC12: WORKFORCE PLANNING ────────────────────────────────────────────────

  private async handleWorkforcePlanning(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const total = candidates.length;
    const highLeaders = candidates.filter(c => (c.discScoreD ?? 0) >= 18 && (c.discScoreI ?? 0) >= 14).length;
    const highExecutors = candidates.filter(c => (c.discScoreS ?? 0) >= 18).length;
    const highAnalysts = candidates.filter(c => (c.discScoreC ?? 0) >= 18).length;
    const highConnectors = candidates.filter(c => (c.discScoreI ?? 0) >= 18).length;

    const planningContext = `STRATEGIC WORKFORCE SNAPSHOT:
Total Workforce: ${total} behaviorally profiled employees
Natural Leaders/Drivers: ${highLeaders} (${Math.round((highLeaders / total) * 100)}%)
Execution/Operations Specialists: ${highExecutors} (${Math.round((highExecutors / total) * 100)}%)
Analytical/Technical Specialists: ${highAnalysts} (${Math.round((highAnalysts / total) * 100)}%)
Relationship/Client Specialists: ${highConnectors} (${Math.round((highConnectors / total) * 100)}%)`;

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: STRATEGIC WORKFORCE PLANNING ━━━
The leader wants to make a strategic workforce decision — such as launching a new business unit, entering a new market, or restructuring teams. Provide behavioral workforce planning intelligence.

WORKFORCE PLANNING ANALYSIS FRAMEWORK:
- Assess whether the current behavioral workforce composition can support the proposed initiative
- Identify which behavioral capabilities are abundantly available vs critically scarce
- Flag over-dependence on specific individuals (single points of failure)
- Determine whether the gap requires external hiring vs internal development vs redeployment

PRE-ANALYZED WORKFORCE COMPOSITION:
${planningContext}

YOUR ANALYSIS SHOULD COVER:
1. **Capability Assessment** — Does the current workforce have the behavioral foundation to support the stated initiative?
2. **Behavioral Gaps** — What critical behavioral capabilities are insufficient for the initiative to succeed?
3. **Redeployment Opportunities** — Which employees could be redeployed or given expanded scope to fill capability needs?
4. **Hiring Recommendations** — What behavioral profiles should be prioritized in external recruitment to fill the gaps?
5. **Concentration Risk** — Are any critical capabilities concentrated in too few people? What's the risk?
6. **Timeline Assessment** — Can internal development close the gap, or is the timeline too tight for organic growth?
7. **Strategic Recommendation** — A clear people-strategy decision recommendation with rationale

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC13: RECRUITMENT INTELLIGENCE ─────────────────────────────────────────

  private async handleRecruitmentIntel(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    // Identify the top performers behaviorally (highest total scores) to extract patterns
    const topPerformers = [...candidates]
      .filter(c => c.bestScore != null)
      .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0))
      .slice(0, 5);

    const topProfileContext = topPerformers.length > 0
      ? topPerformers.map(c =>
          `${c.fullName}: ${c.personalityStyle || 'Unknown'} | Group: ${c.groupName || 'N/A'} | D:${c.discScoreD ?? 'N/A'} I:${c.discScoreI ?? 'N/A'} S:${c.discScoreS ?? 'N/A'} C:${c.discScoreC ?? 'N/A'}`
        ).join('\n')
      : 'No scored performance data available — analysis will be based on behavioral profile distribution.';

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: RECRUITMENT INTELLIGENCE ━━━
The leader wants to use internal workforce intelligence to inform external hiring decisions. Analyze the behavioral patterns of the existing workforce — particularly top performers — to generate recruitment targeting insights.

TOP INTERNAL PERFORMERS (for pattern extraction):
${topProfileContext}

YOUR ANALYSIS SHOULD COVER:
1. **Behavioral Profile of Success** — What behavioral character traits are consistently present in the organization's highest performers?
2. **The Ideal Hire Profile** — Describe in behavioral terms the profile of a candidate most likely to succeed in this organization's culture
3. **Red Flag Profiles** — What behavioral indicators, based on current workforce data, suggest a candidate might struggle or disengage in this environment?
4. **Interview Intelligence** — What specific behavioral competencies and scenarios to probe in interviews to identify the right profile?
5. **Onboarding Guidance** — Given the existing team's behavioral dynamics, how should a new hire be onboarded for fastest integration?
6. **Cultural Fit Assessment** — What cultural characteristics emerge from the current workforce's behavioral makeup? What type of person would thrive vs clash?
7. **Strategic Recommendation** — Specific hiring criteria or behavioral assessment approach to strengthen the next recruitment cycle

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1800);
  }

  // ─── UC14: PEOPLE STRATEGY & POLICY ─────────────────────────────────────────

  private async handlePeopleStrategy(
    query: string,
    candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const total = candidates.length;
    const genderMap: Record<string, number> = {};
    const styleMap: Record<string, number> = {};
    candidates.forEach(c => {
      const g = c.gender || 'Unknown';
      genderMap[g] = (genderMap[g] || 0) + 1;
      const s = c.personalityStyle || 'Unknown';
      styleMap[s] = (styleMap[s] || 0) + 1;
    });

    const topStyles = Object.entries(styleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, n]) => `${s} (${n})`)
      .join(', ');

    const demographicContext = `WORKFORCE DEMOGRAPHIC & BEHAVIORAL SUMMARY:
Total: ${total} employees | Top Styles: ${topStyles}
Gender: ${Object.entries(genderMap).map(([g, n]) => `${g}: ${n}`).join(', ')}`;

    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR TASK: PEOPLE STRATEGY & POLICY INTELLIGENCE ━━━
The leader wants aggregate behavioral intelligence to inform HR policies, people programs, and organizational culture initiatives. All recommendations must be grounded in the actual behavioral makeup of this specific workforce — not generic HR best practices.

IMPORTANT: Individual psychometric data is used for internal analytical reference only. Policy recommendations are aggregated insights — not individual-level decisions.

AGGREGATE WORKFORCE CONTEXT:
${demographicContext}

YOUR ANALYSIS SHOULD COVER:
1. **Organizational Character** — The collective behavioral personality of this workforce and what it tells us about culture
2. **Communication Framework** — What communication style, cadence, and channels would resonate best with this workforce's dominant behavioral profile?
3. **Recognition & Engagement** — What types of recognition, incentives, and engagement programs align with the workforce's motivational drivers?
4. **Leadership Development Policy** — What should the organization invest in to build its next generation of leaders from within?
5. **Team Structure Recommendations** — How should teams ideally be structured given the behavioral distribution across the workforce?
6. **Wellbeing & Retention Risk** — What patterns suggest retention risk, and what policy levers exist to address them?
7. **Change Management Approach** — How should organizational change be communicated and led given the workforce's behavioral makeup?
8. **Strategic Recommendation** — The single most impactful people-strategy initiative this organization should prioritize based on behavioral intelligence

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 2000);
  }

  // ─── GENERAL FALLBACK ────────────────────────────────────────────────────────

  private async handleGeneralHRQuery(
    query: string,
    _candidates: CandidateProfile[],
    employeeData: string,
  ): Promise<string> {
    const systemPrompt = `${this.SYSTEM_ROLE_PREFIX}

━━━ YOUR ADVISORY CAPABILITIES ━━━
Answer any workforce or people intelligence question using behavioral data. You can:
- Profile individual employees in depth
- Advise on team composition and dynamics
- Guide managers in leading specific individuals
- Identify leadership potential and succession candidates
- Map organizational capabilities and gaps
- Recommend learning and development investments
- Support strategic workforce planning decisions
- Inform recruitment and onboarding strategies
- Design people policies grounded in behavioral intelligence

Always reference specific employees by name and anchor insights to their actual behavioral profile.
Always close with a "Strategic Recommendation."

━━━ PEOPLE INTELLIGENCE DATABASE ━━━
${employeeData}`;

    return this.callGPT(systemPrompt, query, 1500);
  }

  // ─── SHARED GPT CALLER ───────────────────────────────────────────────────────

  private async callGPT(systemPrompt: string, userQuery: string, maxTokens = 1500): Promise<string> {
    try {
      const completion = await this.getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      return completion.choices[0]?.message?.content || 'I could not process your request at this time.';
    } catch (error) {
      this.logger.error('OpenAI LLM Error:', error);
      return 'An error occurred while analyzing the employee profiles. Please try again.';
    }
  }
}
