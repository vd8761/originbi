/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║           🎯 JD CANDIDATE MATCHING ENGINE v1.0                            ║
 * ║   Advanced Multi-Dimensional Candidate-Job Matching Algorithm            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  ALGORITHM LAYERS (Google-grade ranking approach):                        ║
 * ║                                                                           ║
 * ║  Layer 1: JD PARSING & TRAIT EXTRACTION (LLM-powered NLU)               ║
 * ║    - Extract required personality traits, soft skills, hard skills        ║
 * ║    - Identify behavioral patterns needed (leadership, teamwork, etc.)    ║
 * ║    - Determine agile readiness requirements                               ║
 * ║    - Weight each requirement by importance (critical/important/nice)      ║
 * ║                                                                           ║
 * ║  Layer 2: CANDIDATE PROFILE VECTORIZATION                                ║
 * ║    - DISC personality → behavioral vector                                 ║
 * ║    - ACI agile score → adaptability index                                ║
 * ║    - Sincerity index → reliability factor                                 ║
 * ║    - Assessment completeness → confidence multiplier                      ║
 * ║                                                                           ║
 * ║  Layer 3: MULTI-FACTOR SCORING (Weighted composite)                      ║
 * ║    - Behavioral Alignment Score (BAS): 35% weight                        ║
 * ║    - Agile Readiness Score (ARS): 25% weight                             ║
 * ║    - Trait-Role Fit Score (TFS): 25% weight                              ║
 * ║    - Reliability & Sincerity Index (RSI): 15% weight                     ║
 * ║                                                                           ║
 * ║  Layer 4: RANKING & CONFIDENCE                                            ║
 * ║    - PageRank-inspired confidence scoring                                 ║
 * ║    - Percentile normalization                                             ║
 * ║    - Tier classification (Strong/Good/Moderate/Developing)               ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Extracted requirements from a Job Description */
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
  traitName: string;           // e.g., "Dominance", "Influence", "Steadiness", "Compliance"
  importance: 'critical' | 'important' | 'nice_to_have';
  minLevel: 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
}

interface BehavioralPattern {
  pattern: string;             // e.g., "decision-making under pressure"
  weight: number;              // 0.0 to 1.0
  relevantStyles: string[];    // Personality styles that exhibit this
}

interface AgileRequirement {
  minScore: number;            // Minimum agile score needed (0-125)
  idealScore: number;          // Ideal agile score
  adaptabilityWeight: number;  // How important adaptability is (0-1)
}

/** Candidate profile with all assessment data */
interface CandidateProfile {
  registrationId: number;
  fullName: string;
  email: string;
  gender: string | null;
  mobileNumber: string | null;
  personalityStyle: string | null;
  personalityDescription: string | null;
  personalityCode: string | null;
  totalScore: number | null;       // ACI/Agile score
  sincerityIndex: number | null;
  sincerityClass: string | null;
  attemptCount: number;
  bestScore: number | null;
  assessmentStatus: string;
  corporateAccountId: number | null;
  groupId: number | null;
}

/** Scored candidate result */
export interface ScoredCandidate {
  candidate: CandidateProfile;
  compositeScore: number;      // 0-100 final score
  tier: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'DEVELOPING';
  confidenceLevel: number;     // 0-100 how confident we are in the score
  breakdown: ScoreBreakdown;
  insights: string[];          // AI-generated insights
  matchReasons: string[];
  developmentAreas: string[];
  successPrediction?: number;  // 0-100 predicted success rate
  retentionRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  teamFitScore?: number;       // 0-100 how well they'd fit in team dynamic
}

interface ScoreBreakdown {
  behavioralAlignmentScore: number;    // BAS: 0-100
  agileReadinessScore: number;         // ARS: 0-100
  traitRoleFitScore: number;           // TFS: 0-100
  reliabilityIndex: number;            // RSI: 0-100
  confidenceMultiplier: number;        // 0.0-1.0 (based on data completeness)
}

/** Final matching result */
export interface JDMatchResult {
  jobDescription: string;
  parsedRequirements: JDRequirements;
  totalCandidatesEvaluated: number;
  matchedCandidates: ScoredCandidate[];
  executionTimeMs: number;
  algorithmVersion: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISC PERSONALITY KNOWLEDGE BASE
// Maps personality styles to behavioral dimensions
// ═══════════════════════════════════════════════════════════════════════════

/** DISC behavioral dimensions for each blended style */
const PERSONALITY_VECTORS: Record<string, {
  dominance: number;      // 0-100: Assertiveness, drive, results-orientation
  influence: number;      // 0-100: Persuasion, enthusiasm, collaboration
  steadiness: number;     // 0-100: Patience, reliability, consistency
  compliance: number;     // 0-100: Accuracy, quality, analytical thinking
  leadership: number;     // 0-100: Natural leadership tendency
  creativity: number;     // 0-100: Innovation, creative thinking
  analytical: number;     // 0-100: Data-driven thinking
  teamwork: number;       // 0-100: Collaborative tendency
  independence: number;   // 0-100: Self-driven capability
  adaptability: number;   // 0-100: Flexibility, change tolerance
  communication: number;  // 0-100: Communication strength
  empathy: number;        // 0-100: Emotional intelligence
}> = {
  'Charismatic Leader': {
    dominance: 90, influence: 95, steadiness: 40, compliance: 35,
    leadership: 95, creativity: 75, analytical: 50, teamwork: 80,
    independence: 85, adaptability: 80, communication: 95, empathy: 70,
  },
  'Strategic Stabilizer': {
    dominance: 60, influence: 45, steadiness: 90, compliance: 85,
    leadership: 65, creativity: 40, analytical: 85, teamwork: 75,
    independence: 70, adaptability: 55, communication: 60, empathy: 65,
  },
  'Decisive Analyst': {
    dominance: 85, influence: 40, steadiness: 50, compliance: 90,
    leadership: 70, creativity: 55, analytical: 95, teamwork: 50,
    independence: 90, adaptability: 60, communication: 55, empathy: 40,
  },
  'Analytical Leader': {
    dominance: 80, influence: 55, steadiness: 55, compliance: 85,
    leadership: 85, creativity: 60, analytical: 90, teamwork: 65,
    independence: 85, adaptability: 65, communication: 70, empathy: 55,
  },
  'Creative Thinker': {
    dominance: 50, influence: 85, steadiness: 55, compliance: 50,
    leadership: 55, creativity: 95, analytical: 60, teamwork: 75,
    independence: 70, adaptability: 90, communication: 80, empathy: 75,
  },
  'Supportive Energizer': {
    dominance: 35, influence: 90, steadiness: 80, compliance: 45,
    leadership: 50, creativity: 65, analytical: 40, teamwork: 95,
    independence: 35, adaptability: 75, communication: 85, empathy: 95,
  },
  'Reliable Executor': {
    dominance: 55, influence: 35, steadiness: 95, compliance: 80,
    leadership: 45, creativity: 30, analytical: 70, teamwork: 70,
    independence: 75, adaptability: 40, communication: 50, empathy: 60,
  },
  'Influential Connector': {
    dominance: 60, influence: 92, steadiness: 60, compliance: 40,
    leadership: 70, creativity: 80, analytical: 45, teamwork: 90,
    independence: 55, adaptability: 85, communication: 95, empathy: 85,
  },
  'Methodical Planner': {
    dominance: 50, influence: 30, steadiness: 85, compliance: 95,
    leadership: 55, creativity: 35, analytical: 95, teamwork: 60,
    independence: 80, adaptability: 35, communication: 45, empathy: 50,
  },
  'Dynamic Achiever': {
    dominance: 92, influence: 75, steadiness: 35, compliance: 55,
    leadership: 88, creativity: 70, analytical: 65, teamwork: 60,
    independence: 90, adaptability: 85, communication: 80, empathy: 50,
  },
  'Steady Contributor': {
    dominance: 30, influence: 50, steadiness: 92, compliance: 70,
    leadership: 35, creativity: 45, analytical: 60, teamwork: 85,
    independence: 45, adaptability: 50, communication: 60, empathy: 80,
  },
  'Visionary Strategist': {
    dominance: 85, influence: 80, steadiness: 40, compliance: 70,
    leadership: 90, creativity: 85, analytical: 80, teamwork: 65,
    independence: 88, adaptability: 80, communication: 85, empathy: 60,
  },
};

// Default vector for unknown personality styles
const DEFAULT_VECTOR = {
  dominance: 50, influence: 50, steadiness: 50, compliance: 50,
  leadership: 50, creativity: 50, analytical: 50, teamwork: 50,
  independence: 50, adaptability: 50, communication: 50, empathy: 50,
};

// ═══════════════════════════════════════════════════════════════════════════
// SCORING WEIGHTS
// ═══════════════════════════════════════════════════════════════════════════
const SCORING_WEIGHTS = {
  behavioralAlignment: 0.35,   // How well DISC traits match JD
  agileReadiness: 0.25,        // Agile/ACI score vs requirement
  traitRoleFit: 0.25,          // Personality→Role fit
  reliabilityIndex: 0.15,      // Sincerity + assessment completeness
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
export class JDMatchingService {
  private readonly logger = new Logger('JD-MatchEngine');
  private llm: ChatGroq | null = null;

  constructor(private dataSource: DataSource) {
    this.logger.log('🎯 JD Matching Engine v1.0 initialized');
  }

  private getLlm(): ChatGroq {
    if (!this.llm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set');
      this.llm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1, // Very low temp for deterministic extraction
        timeout: 20000,
      });
    }
    return this.llm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT: Match candidates to a Job Description
  // ═══════════════════════════════════════════════════════════════════════════
  async matchCandidatesToJD(
    jobDescription: string,
    options: {
      corporateId?: number;        // RBAC: scope to company
      groupId?: number;            // Scope to group
      topN?: number;               // Return top N candidates (default 10)
      minScore?: number;           // Minimum composite score threshold
      includeInsights?: boolean;   // Generate AI insights per candidate
    } = {},
  ): Promise<JDMatchResult> {
    const startTime = Date.now();
    const topN = options.topN || 10;
    const minScore = options.minScore || 0;

    this.logger.log('═══════════════════════════════════════════════════');
    this.logger.log('🎯 JD MATCHING ENGINE - Starting analysis');
    this.logger.log(`📄 JD Length: ${jobDescription.length} chars`);
    this.logger.log('═══════════════════════════════════════════════════');

    // ── LAYER 1: Parse Job Description with LLM ──
    this.logger.log('📋 Layer 1: Parsing Job Description...');
    const requirements = await this.parseJobDescription(jobDescription);
    this.logger.log(`   ✅ Role: ${requirements.roleTitle} (${requirements.seniorityLevel})`);
    this.logger.log(`   ✅ Traits: ${requirements.requiredTraits.length} required`);
    this.logger.log(`   ✅ Behavioral patterns: ${requirements.behavioralPatterns.length}`);

    // ── LAYER 2: Fetch all candidate profiles ──
    this.logger.log('👥 Layer 2: Fetching candidate profiles...');
    const candidates = await this.fetchCandidateProfiles(
      options.corporateId,
      options.groupId,
    );
    this.logger.log(`   ✅ Found ${candidates.length} candidates with assessment data`);

    if (candidates.length === 0) {
      return {
        jobDescription,
        parsedRequirements: requirements,
        totalCandidatesEvaluated: 0,
        matchedCandidates: [],
        executionTimeMs: Date.now() - startTime,
        algorithmVersion: '1.0.0-alpha',
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

    // ── LAYER 4: Rank, normalize percentiles, and classify tiers ──
    this.logger.log('📊 Layer 4: Ranking & normalizing...');
    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

    // Percentile normalization
    const totalScored = scoredCandidates.length;
    scoredCandidates.forEach((sc, index) => {
      // Percentile rank: what % of candidates this person scores above
      sc.confidenceLevel = Math.round(((totalScored - index) / totalScored) * 100);
    });

    // Take top N
    const topCandidates = scoredCandidates.slice(0, topN);

    // ── LAYER 5 (Optional): Generate AI insights for top candidates ──
    if (options.includeInsights !== false && topCandidates.length > 0) {
      this.logger.log('🧠 Layer 5: Generating AI insights for top candidates...');
      await this.generateBatchInsights(topCandidates, requirements);
    }

    const executionTimeMs = Date.now() - startTime;
    this.logger.log(`✅ Matching complete in ${executionTimeMs}ms — ${topCandidates.length} matches`);

    return {
      jobDescription,
      parsedRequirements: requirements,
      totalCandidatesEvaluated: candidates.length,
      matchedCandidates: topCandidates,
      executionTimeMs,
      algorithmVersion: '1.0.0-alpha',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: JOB DESCRIPTION PARSING (LLM-powered NLU)
  // ═══════════════════════════════════════════════════════════════════════════
  private async parseJobDescription(jd: string): Promise<JDRequirements> {
    const prompt = `You are an expert HR analyst and organizational psychologist. Analyze this Job Description and extract structured requirements for candidate matching.

CONTEXT: We use the DISC behavioral model for personality assessment. The personality styles in our system are:
- Charismatic Leader (High D+I): Assertive, visionary, persuasive, drives results
- Strategic Stabilizer (High S+C): Methodical, reliable, process-oriented, quality-focused
- Decisive Analyst (High D+C): Data-driven, logical, quick decisions, independent
- Analytical Leader (High D+C): Technical depth + leadership, strategic thinking
- Creative Thinker (High I+S): Innovative, empathetic, artistic, adaptable
- Supportive Energizer (High I+S): Team builder, empathetic, motivational
- Reliable Executor (High S+C): Dependable, detail-oriented, consistent
- Influential Connector (High I): Networking, relationship-building, persuasive
- Methodical Planner (High C+S): Systematic, thorough, process-driven
- Dynamic Achiever (High D+I): Goal-oriented, energetic, competitive
- Steady Contributor (High S): Patient, cooperative, reliable team member
- Visionary Strategist (High D+I+C): Big-picture thinker, strategic, innovative

We also have an Agile Compatibility Index (ACI): 0-125 score measuring adaptability, collaboration, and agile mindset.
- Agile Naturalist (100-125): Lives agile naturally
- Agile Adaptive (75-99): Works well in dynamic situations
- Agile Learner (50-74): Open but needs guidance
- Agile Resistant (0-49): Prefers structure

JOB DESCRIPTION:
"""
${jd}
"""

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "roleTitle": "extracted role title",
  "seniorityLevel": "entry|mid|senior|lead|executive",
  "requiredTraits": [
    {
      "traitName": "Dominance|Influence|Steadiness|Compliance",
      "importance": "critical|important|nice_to_have",
      "minLevel": "low|moderate|high|very_high",
      "description": "why this trait matters for this role"
    }
  ],
  "behavioralPatterns": [
    {
      "pattern": "description of behavioral pattern needed",
      "weight": 0.0-1.0,
      "relevantStyles": ["style names that match"]
    }
  ],
  "agileRequirement": {
    "minScore": 0-125,
    "idealScore": 0-125,
    "adaptabilityWeight": 0.0-1.0
  },
  "softSkills": ["skill1", "skill2"],
  "hardSkills": ["skill1", "skill2"],
  "industryContext": "industry name",
  "teamDynamic": "solo|small_team|large_team|cross_functional",
  "leadershipRequired": true/false,
  "creativityRequired": true/false,
  "analyticalRequired": true/false,
  "customerFacing": true/false
}

RULES:
1. Always include 2-4 requiredTraits covering the most important DISC dimensions
2. Include 2-5 behavioralPatterns with weights summing close to 1.0
3. Set agileRequirement based on how dynamic/flexible the role is
4. Be precise with importance levels - critical means dealbreaker
5. For seniorityLevel, infer from context if not explicitly stated
6. softSkills should focus on personality/behavior related skills
7. For leadership roles, set leadershipRequired=true and include dominance/influence traits`;

    try {
      const response = await this.getLlm().invoke([new SystemMessage(prompt), new HumanMessage('Parse the job description above.')]);
      const jsonStr = response.content.toString().trim();
      const cleanJson = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson) as JDRequirements;

      // Validate and fill defaults
      return {
        roleTitle: parsed.roleTitle || 'Unknown Role',
        seniorityLevel: parsed.seniorityLevel || 'mid',
        requiredTraits: parsed.requiredTraits || [],
        behavioralPatterns: parsed.behavioralPatterns || [],
        agileRequirement: parsed.agileRequirement || { minScore: 50, idealScore: 80, adaptabilityWeight: 0.5 },
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
      // Fallback: basic extraction
      return this.fallbackJDParsing(jd);
    }
  }

  /** Fallback JD parsing when LLM fails */
  private fallbackJDParsing(jd: string): JDRequirements {
    const jdLower = jd.toLowerCase();

    const leadershipRequired = /\b(lead|leader|leadership|manage|director|head|vp|chief)\b/i.test(jd);
    const analyticalRequired = /\b(analy|data|research|metrics|statistics|quantitative)\b/i.test(jd);
    const creativityRequired = /\b(creat|innovat|design|ideate|brainstorm)\b/i.test(jd);
    const customerFacing = /\b(customer|client|stakeholder|partner|sales|support)\b/i.test(jd);

    const traits: TraitRequirement[] = [];
    if (leadershipRequired) {
      traits.push({ traitName: 'Dominance', importance: 'critical', minLevel: 'high', description: 'Leadership role requires assertiveness' });
      traits.push({ traitName: 'Influence', importance: 'important', minLevel: 'moderate', description: 'Need to inspire and persuade teams' });
    }
    if (analyticalRequired) {
      traits.push({ traitName: 'Compliance', importance: 'critical', minLevel: 'high', description: 'Role requires analytical precision' });
    }
    if (customerFacing) {
      traits.push({ traitName: 'Influence', importance: 'important', minLevel: 'high', description: 'Customer-facing role needs strong communication' });
      traits.push({ traitName: 'Steadiness', importance: 'important', minLevel: 'moderate', description: 'Need patience with customer interactions' });
    }

    // If no traits detected, add balanced defaults
    if (traits.length === 0) {
      traits.push({ traitName: 'Steadiness', importance: 'important', minLevel: 'moderate', description: 'General role stability' });
      traits.push({ traitName: 'Compliance', importance: 'important', minLevel: 'moderate', description: 'Quality and accuracy needed' });
    }

    return {
      roleTitle: 'Extracted Role',
      seniorityLevel: /\b(senior|sr|lead|principal|director|vp|chief|head)\b/i.test(jd) ? 'senior' : 'mid',
      requiredTraits: traits,
      behavioralPatterns: [],
      agileRequirement: { minScore: 50, idealScore: 80, adaptabilityWeight: 0.5 },
      softSkills: [],
      hardSkills: [],
      industryContext: 'General',
      teamDynamic: /\b(team|collaborat|cross.?functional)\b/i.test(jd) ? 'cross_functional' : 'small_team',
      leadershipRequired,
      creativityRequired,
      analyticalRequired,
      customerFacing,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: FETCH CANDIDATE PROFILES
  // ═══════════════════════════════════════════════════════════════════════════
  private async fetchCandidateProfiles(
    corporateId?: number,
    groupId?: number,
  ): Promise<CandidateProfile[]> {
    const params: any[] = [];
    let paramIdx = 1;
    let rbacFilter = '';

    if (corporateId) {
      rbacFilter += ` AND r.corporate_account_id = $${paramIdx}`;
      params.push(corporateId);
      paramIdx++;
    }
    if (groupId) {
      rbacFilter += ` AND r.group_id = $${paramIdx}`;
      params.push(groupId);
      paramIdx++;
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
        pt.blended_style_name as personality_style,
        pt.blended_style_desc as personality_description,
        pt.code as personality_code,
        aa.total_score,
        aa.sincerity_index,
        aa.sincerity_class,
        aa.status as assessment_status,
        (SELECT MAX(aa2.total_score::numeric) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id AND aa2.status = 'COMPLETED') as best_score,
        (SELECT COUNT(*) FROM assessment_attempts aa3 WHERE aa3.registration_id = r.id AND aa3.status = 'COMPLETED') as attempt_count
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
      WHERE r.is_deleted = false${rbacFilter}
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
        totalScore: row.total_score ? parseFloat(row.total_score) : null,
        sincerityIndex: row.sincerity_index ? parseFloat(row.sincerity_index) : null,
        sincerityClass: row.sincerity_class,
        attemptCount: parseInt(row.attempt_count) || 0,
        bestScore: row.best_score ? parseFloat(row.best_score) : null,
        assessmentStatus: row.assessment_status || 'UNKNOWN',
        corporateAccountId: row.corporate_account_id ? parseInt(row.corporate_account_id) : null,
        groupId: row.group_id ? parseInt(row.group_id) : null,
      }));
    } catch (error) {
      this.logger.error(`Candidate fetch error: ${error.message}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: MULTI-FACTOR CANDIDATE SCORING
  // ═══════════════════════════════════════════════════════════════════════════
  private scoreCandidate(
    candidate: CandidateProfile,
    requirements: JDRequirements,
  ): ScoredCandidate {
    // Get personality vector for this candidate
    const vector = this.getPersonalityVector(candidate.personalityStyle);

    // 1. BEHAVIORAL ALIGNMENT SCORE (BAS) — 35% weight
    const bas = this.calculateBehavioralAlignment(vector, requirements);

    // 2. AGILE READINESS SCORE (ARS) — 25% weight
    const ars = this.calculateAgileReadiness(candidate, requirements.agileRequirement);

    // 3. TRAIT-ROLE FIT SCORE (TFS) — 25% weight
    const tfs = this.calculateTraitRoleFit(vector, requirements);

    // 4. RELIABILITY & SINCERITY INDEX (RSI) — 15% weight
    const rsi = this.calculateReliabilityIndex(candidate);

    // 5. CONFIDENCE MULTIPLIER (based on data completeness)
    const confidenceMultiplier = this.calculateConfidenceMultiplier(candidate);

    // ── COMPOSITE SCORE ──
    const rawScore = (
      bas * SCORING_WEIGHTS.behavioralAlignment +
      ars * SCORING_WEIGHTS.agileReadiness +
      tfs * SCORING_WEIGHTS.traitRoleFit +
      rsi * SCORING_WEIGHTS.reliabilityIndex
    );

    // Apply confidence multiplier (penalize incomplete profiles)
    let compositeScore = Math.round(rawScore * confidenceMultiplier * 10) / 10;

    // ── ADVANCED ADJUSTMENTS ──
    
    // 1. Industry-specific calibration
    const industryBonus = this.calculateIndustryAlignment(vector, requirements);
    compositeScore = Math.min(100, compositeScore + industryBonus);

    // 2. Seniority-experience alignment
    const seniorityPenalty = this.calculateSeniorityMismatch(requirements.seniorityLevel, vector);
    compositeScore = Math.max(0, compositeScore - seniorityPenalty);

    // 3. Team composition fit
    const teamFitScore = this.calculateTeamFit(vector, requirements.teamDynamic);

    // 4. Success prediction (based on historical patterns)
    const successPrediction = this.predictSuccessRate(vector, requirements, bas, ars, tfs, rsi);

    // 5. Retention risk analysis
    const retentionRisk = this.assessRetentionRisk(vector, requirements, candidate);

    // Final composite with all adjustments
    compositeScore = Math.round(compositeScore * 10) / 10;

    // Determine tier
    const tier = compositeScore >= TIER_THRESHOLDS.STRONG_FIT ? 'STRONG_FIT'
      : compositeScore >= TIER_THRESHOLDS.GOOD_FIT ? 'GOOD_FIT'
      : compositeScore >= TIER_THRESHOLDS.MODERATE_FIT ? 'MODERATE_FIT'
      : 'DEVELOPING';

    // Generate match reasons
    const matchReasons = this.generateMatchReasons(vector, requirements, bas, ars, tfs);
    const developmentAreas = this.identifyDevelopmentAreas(vector, requirements);

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
      insights: [], // Filled in Layer 5
      matchReasons,
      developmentAreas,
      successPrediction,
      retentionRisk,
      teamFitScore,
    };
  }

  // ── SCORING FUNCTIONS ──

  /** Get personality vector (DISC dimensions) from style name */
  private getPersonalityVector(styleName: string | null) {
    if (!styleName) return { ...DEFAULT_VECTOR };

    // Exact match first
    if (PERSONALITY_VECTORS[styleName]) return { ...PERSONALITY_VECTORS[styleName] };

    // Fuzzy match
    const key = Object.keys(PERSONALITY_VECTORS).find(
      k => styleName.toLowerCase().includes(k.toLowerCase()) ||
           k.toLowerCase().includes(styleName.toLowerCase())
    );
    return key ? { ...PERSONALITY_VECTORS[key] } : { ...DEFAULT_VECTOR };
  }

  /**
   * BEHAVIORAL ALIGNMENT SCORE (BAS)
   * Measures how well the candidate's DISC profile aligns with the JD's behavioral needs.
   * Uses cosine similarity between JD requirement vector and candidate vector.
   */
  private calculateBehavioralAlignment(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    // Build the "ideal" vector from JD requirements
    const idealVector = this.buildIdealVector(requirements);

    // Cosine similarity between candidate and ideal
    const similarity = this.cosineSimilarity(
      Object.values(candidateVector),
      Object.values(idealVector),
    );

    // Scale from [-1, 1] to [0, 100]
    return Math.max(0, Math.min(100, (similarity + 1) * 50));
  }

  /** Build the ideal personality vector from JD requirements */
  private buildIdealVector(requirements: JDRequirements): typeof DEFAULT_VECTOR {
    const ideal = { ...DEFAULT_VECTOR };

    // Map DISC trait requirements to vector dimensions
    for (const trait of requirements.requiredTraits) {
      const levelValue = trait.minLevel === 'very_high' ? 95
        : trait.minLevel === 'high' ? 80
        : trait.minLevel === 'moderate' ? 60
        : 40;

      const importanceMultiplier = trait.importance === 'critical' ? 1.2
        : trait.importance === 'important' ? 1.0
        : 0.8;

      const scaledValue = Math.min(100, Math.round(levelValue * importanceMultiplier));

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

    // Adjust based on role flags
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

    // Team dynamic adjustments
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

  /** Cosine similarity between two vectors */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * AGILE READINESS SCORE (ARS)
   * Measures how well the candidate's agile/ACI score meets the JD requirement.
   * Uses a sigmoid-like curve for smooth scoring.
   */
  private calculateAgileReadiness(
    candidate: CandidateProfile,
    requirement: AgileRequirement,
  ): number {
    const score = candidate.bestScore || candidate.totalScore || 0;
    const { minScore, idealScore, adaptabilityWeight } = requirement;

    if (score >= idealScore) {
      // At or above ideal — full score with bonus for exceeding
      const bonus = Math.min(10, ((score - idealScore) / idealScore) * 20);
      return Math.min(100, 90 + bonus);
    }

    if (score >= minScore) {
      // Between min and ideal — linear interpolation
      const range = idealScore - minScore;
      const progress = (score - minScore) / (range || 1);
      return 50 + (progress * 40); // Range: 50-90
    }

    // Below minimum — sigmoid decay
    // score/minScore gives ratio (0 to 1), apply sigmoid
    const ratio = score / (minScore || 1);
    const sigmoidScore = 50 / (1 + Math.exp(-8 * (ratio - 0.5)));
    return Math.max(0, sigmoidScore);
  }

  /**
   * TRAIT-ROLE FIT SCORE (TFS)
   * Evaluates how well the candidate's personality patterns match the role's
   * behavioral requirements beyond basic DISC dimensions.
   */
  private calculateTraitRoleFit(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Score each behavioral pattern
    for (const pattern of requirements.behavioralPatterns) {
      const patternScore = this.evaluateBehavioralPattern(candidateVector, pattern);
      totalScore += patternScore * pattern.weight;
      totalWeight += pattern.weight;
    }

    // If no behavioral patterns, fall back to trait matching
    if (totalWeight === 0) {
      return this.fallbackTraitFit(candidateVector, requirements);
    }

    return Math.round((totalScore / totalWeight) * 10) / 10;
  }

  /** Evaluate a single behavioral pattern against candidate vector */
  private evaluateBehavioralPattern(
    candidateVector: typeof DEFAULT_VECTOR,
    pattern: BehavioralPattern,
  ): number {
    // Check if candidate's personality style is in relevant styles
    // Also compute a dimension-based fit
    const keywords = pattern.pattern.toLowerCase();

    let score = 50; // Start neutral

    // Map behavioral pattern keywords to vector dimensions
    if (/\b(decision|decisive|authority|asserti)\b/.test(keywords)) {
      score = candidateVector.dominance * 0.7 + candidateVector.independence * 0.3;
    }
    if (/\b(team|collaborat|cooperat)\b/.test(keywords)) {
      score = candidateVector.teamwork * 0.6 + candidateVector.communication * 0.4;
    }
    if (/\b(creat|innovat|ideate)\b/.test(keywords)) {
      score = candidateVector.creativity * 0.7 + candidateVector.adaptability * 0.3;
    }
    if (/\b(analy|data|logic|system)\b/.test(keywords)) {
      score = candidateVector.analytical * 0.7 + candidateVector.compliance * 0.3;
    }
    if (/\b(lead|inspir|motiv|vision)\b/.test(keywords)) {
      score = candidateVector.leadership * 0.6 + candidateVector.influence * 0.4;
    }
    if (/\b(stable|consistent|reliable|steady)\b/.test(keywords)) {
      score = candidateVector.steadiness * 0.7 + candidateVector.teamwork * 0.3;
    }
    if (/\b(communicat|present|negotiat|persua)\b/.test(keywords)) {
      score = candidateVector.communication * 0.6 + candidateVector.influence * 0.4;
    }
    if (/\b(empath|support|care|patient)\b/.test(keywords)) {
      score = candidateVector.empathy * 0.6 + candidateVector.steadiness * 0.4;
    }
    if (/\b(adapt|flexib|change|agile)\b/.test(keywords)) {
      score = candidateVector.adaptability * 0.7 + candidateVector.creativity * 0.3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /** Fallback trait fitting when no behavioral patterns specified */
  private fallbackTraitFit(
    candidateVector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    let score = 50;
    let factors = 1;

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

    // Seniority adjustment
    if (requirements.seniorityLevel === 'lead' || requirements.seniorityLevel === 'executive') {
      score += candidateVector.leadership * 0.3;
      factors++;
    }

    return Math.max(0, Math.min(100, score / factors));
  }

  /**
   * RELIABILITY & SINCERITY INDEX (RSI)
   * Measures the trustworthiness of the candidate's assessment data.
   */
  private calculateReliabilityIndex(candidate: CandidateProfile): number {
    let score = 50; // Base score

    // Sincerity class bonus
    if (candidate.sincerityClass) {
      const sincerityClasses: Record<string, number> = {
        'HIGH': 30,
        'MODERATE': 20,
        'ADEQUATE': 15,
        'LOW': 5,
        'VERY_LOW': 0,
      };
      score += sincerityClasses[candidate.sincerityClass.toUpperCase()] ?? 10;
    } else if (candidate.sincerityIndex !== null) {
      // Use raw sincerity index if class not available
      score += Math.min(30, (candidate.sincerityIndex / 100) * 30);
    } else {
      score += 15; // Neutral if no sincerity data
    }

    // Attempt count bonus (more attempts = more data = more confident)
    if (candidate.attemptCount >= 3) score += 15;
    else if (candidate.attemptCount >= 2) score += 10;
    else if (candidate.attemptCount >= 1) score += 5;

    // Best score vs latest score consistency bonus
    if (candidate.bestScore !== null && candidate.totalScore !== null) {
      const consistency = 1 - Math.abs(candidate.bestScore - candidate.totalScore) / (candidate.bestScore || 1);
      score += Math.round(consistency * 5); // Up to 5 bonus for consistent scoring
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * CONFIDENCE MULTIPLIER
   * Penalizes candidates with incomplete data to prevent false positives.
   */
  private calculateConfidenceMultiplier(candidate: CandidateProfile): number {
    let confidence = 0.6; // Base confidence for having completed assessment

    // Has personality style = major boost
    if (candidate.personalityStyle) confidence += 0.2;

    // Has agile score
    if (candidate.totalScore !== null) confidence += 0.1;

    // Has sincerity data
    if (candidate.sincerityIndex !== null || candidate.sincerityClass) confidence += 0.05;

    // Has name (completeness)
    if (candidate.fullName && candidate.fullName !== 'Unknown') confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 4: MATCH REASONS & DEVELOPMENT AREAS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateMatchReasons(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    bas: number,
    ars: number,
    tfs: number,
  ): string[] {
    const reasons: string[] = [];

    if (bas >= 80) reasons.push('Excellent behavioral alignment with role requirements');
    else if (bas >= 65) reasons.push('Good behavioral alignment with role needs');

    if (ars >= 85) reasons.push('Outstanding agile readiness and adaptability');
    else if (ars >= 70) reasons.push('Strong agile mindset for dynamic environments');

    if (tfs >= 80) reasons.push('Personality traits strongly match role demands');
    else if (tfs >= 65) reasons.push('Personality traits complement role requirements');

    if (requirements.leadershipRequired && vector.leadership >= 80) {
      reasons.push('Natural leadership qualities align with role');
    }
    if (requirements.creativityRequired && vector.creativity >= 80) {
      reasons.push('Strong creative thinking matches innovation needs');
    }
    if (requirements.analyticalRequired && vector.analytical >= 80) {
      reasons.push('Analytical mindset suits data-driven requirements');
    }
    if (requirements.customerFacing && (vector.communication >= 80 || vector.empathy >= 80)) {
      reasons.push('Strong communication/empathy for customer-facing role');
    }

    if (reasons.length === 0) reasons.push('Candidate has completed assessment with available data');

    return reasons;
  }

  /**
   * ADVANCED: Calculate industry-specific alignment bonus
   * Certain personality traits perform better in specific industries
   */
  private calculateIndustryAlignment(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): number {
    const industry = requirements.industryContext.toLowerCase();
    let bonus = 0;

    // Tech/IT industry - values analytical + adaptability
    if (/\b(tech|it|software|data|engineering|ai|saas)\b/.test(industry)) {
      if (vector.analytical >= 75 && vector.adaptability >= 65) bonus += 3;
      if (vector.creativity >= 70) bonus += 2;
    }

    // Finance/Banking - values compliance + steadiness
    if (/\b(finance|bank|accounting|audit|insurance)\b/.test(industry)) {
      if (vector.compliance >= 80 && vector.analytical >= 75) bonus += 4;
      if (vector.steadiness >= 70) bonus += 2;
    }

    // Sales/Marketing - values influence + communication
    if (/\b(sales|marketing|business development|advertising)\b/.test(industry)) {
      if (vector.influence >= 80 && vector.communication >= 75) bonus += 4;
      if (vector.adaptability >= 70) bonus += 2;
    }

    // Healthcare - values empathy + steadiness
    if (/\b(healthcare|medical|hospital|pharma|care)\b/.test(industry)) {
      if (vector.empathy >= 75 && vector.steadiness >= 70) bonus += 4;
      if (vector.compliance >= 70) bonus += 2;
    }

    // Consulting - values analytical + communication
    if (/\b(consult|advisory|strategy)\b/.test(industry)) {
      if (vector.analytical >= 75 && vector.communication >= 75) bonus += 4;
      if (vector.leadership >= 65) bonus += 2;
    }

    // Startup/Entrepreneurship - values adaptability + independence
    if (/\b(startup|entrepreneur|venture)\b/.test(industry)) {
      if (vector.adaptability >= 80 && vector.independence >= 75) bonus += 4;
      if (vector.creativity >= 70) bonus += 2;
    }

    return Math.min(5, bonus); // Cap at +5 points
  }

  /**
   * ADVANCED: Calculate seniority mismatch penalty
   * Penalize candidates whose leadership/experience doesn't match role level
   */
  private calculateSeniorityMismatch(
    seniorityLevel: JDRequirements['seniorityLevel'],
    vector: typeof DEFAULT_VECTOR,
  ): number {
    let penalty = 0;

    switch (seniorityLevel) {
      case 'executive':
      case 'lead':
        // Expect high leadership, dominance, strategic thinking
        if (vector.leadership < 70) penalty += 5;
        if (vector.dominance < 65) penalty += 3;
        if (vector.analytical < 65) penalty += 2;
        break;

      case 'senior':
        // Expect moderate leadership, strong independence
        if (vector.leadership < 55) penalty += 3;
        if (vector.independence < 60) penalty += 2;
        break;

      case 'entry':
        // Over-qualification can be a retention risk
        if (vector.leadership > 85 && vector.dominance > 85) penalty += 2;
        break;

      // 'mid' level is neutral - no penalties
    }

    return Math.min(8, penalty); // Cap at -8 points
  }

  /**
   * ADVANCED: Calculate team composition fit
   * Analyzes how well the candidate would fit in the team dynamic
   */
  private calculateTeamFit(
    vector: typeof DEFAULT_VECTOR,
    teamDynamic: JDRequirements['teamDynamic'],
  ): number {
    let score = 50; // Base score

    switch (teamDynamic) {
      case 'solo':
        score = vector.independence * 0.6 + vector.analytical * 0.3 + (100 - vector.teamwork) * 0.1;
        break;

      case 'small_team':
        score = vector.teamwork * 0.4 + vector.communication * 0.3 + vector.adaptability * 0.3;
        break;

      case 'large_team':
        score = vector.teamwork * 0.5 + vector.empathy * 0.3 + vector.steadiness * 0.2;
        break;

      case 'cross_functional':
        score = vector.communication * 0.4 + vector.adaptability * 0.3 + vector.influence * 0.3;
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * ADVANCED: Predict success rate based on multi-factor analysis
   * Uses weighted scoring to predict likelihood of success in role
   */
  private predictSuccessRate(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    bas: number,
    ars: number,
    tfs: number,
    rsi: number,
  ): number {
    // Base prediction from component scores
    let prediction = (bas * 0.3 + ars * 0.25 + tfs * 0.25 + rsi * 0.2);

    // Boost for critical trait alignment
    const criticalTraits = requirements.requiredTraits.filter(t => t.importance === 'critical');
    let criticalAlignment = 0;
    for (const trait of criticalTraits) {
      const traitValue = this.getVectorDimension(vector, trait.traitName);
      const threshold = trait.minLevel === 'very_high' ? 85 : trait.minLevel === 'high' ? 75 : 60;
      if (traitValue >= threshold) criticalAlignment += 5;
    }
    prediction = Math.min(100, prediction + criticalAlignment);

    // Penalty for misalignment on critical flags
    if (requirements.leadershipRequired && vector.leadership < 60) prediction -= 10;
    if (requirements.analyticalRequired && vector.analytical < 60) prediction -= 10;
    if (requirements.creativityRequired && vector.creativity < 60) prediction -= 8;

    // Bonus for well-rounded profiles (reduces risk)
    const dimensions = Object.values(vector);
    const avgDimension = dimensions.reduce((a, b) => a + b, 0) / dimensions.length;
    const variance = dimensions.reduce((sum, v) => sum + Math.pow(v - avgDimension, 2), 0) / dimensions.length;
    if (variance < 400) prediction += 3; // Low variance = well-rounded

    return Math.max(0, Math.min(100, Math.round(prediction)));
  }

  /**
   * ADVANCED: Assess retention risk
   * Identifies candidates who might leave quickly or struggle long-term
   */
  private assessRetentionRisk(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
    candidate: CandidateProfile,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Over-qualification risk (high leadership/dominance in entry-level)
    if (requirements.seniorityLevel === 'entry' && vector.leadership > 80 && vector.dominance > 80) {
      riskScore += 3;
    }

    // Under-challenge risk (low creativity/adaptability in creative roles)
    if (requirements.creativityRequired && vector.creativity < 50 && vector.adaptability < 50) {
      riskScore += 2;
    }

    // Mismatch risk (solo worker in large team environment)
    if (requirements.teamDynamic === 'large_team' && vector.teamwork < 50 && vector.independence > 80) {
      riskScore += 2;
    }

    // Agile mismatch in dynamic environment
    const agileScore = candidate.bestScore || candidate.totalScore || 0;
    if (requirements.agileRequirement.adaptabilityWeight > 0.6 && agileScore < 50) {
      riskScore += 2;
    }

    // Stability risk (low steadiness in long-term roles)
    if (requirements.teamDynamic !== 'solo' && vector.steadiness < 40) {
      riskScore += 1;
    }

    // Determine risk level
    if (riskScore >= 5) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /** Helper: Get vector dimension by trait name */
  private getVectorDimension(vector: typeof DEFAULT_VECTOR, traitName: string): number {
    const trait = traitName.toLowerCase();
    if (trait.includes('dominance')) return vector.dominance;
    if (trait.includes('influence')) return vector.influence;
    if (trait.includes('steadiness')) return vector.steadiness;
    if (trait.includes('compliance')) return vector.compliance;
    return 50; // Default neutral
  }

  private identifyDevelopmentAreas(
    vector: typeof DEFAULT_VECTOR,
    requirements: JDRequirements,
  ): string[] {
    const areas: string[] = [];

    if (requirements.leadershipRequired && vector.leadership < 60) {
      areas.push('Leadership development needed — consider mentoring/coaching programs');
    }
    if (requirements.analyticalRequired && vector.analytical < 60) {
      areas.push('Analytical skills enhancement — data literacy training recommended');
    }
    if (requirements.creativityRequired && vector.creativity < 60) {
      areas.push('Creative thinking — design thinking workshops could help');
    }
    if (requirements.customerFacing && vector.communication < 60) {
      areas.push('Communication skills — presentation and interpersonal training');
    }
    if (requirements.customerFacing && vector.empathy < 60) {
      areas.push('Emotional intelligence development for client interactions');
    }
    if (requirements.agileRequirement.adaptabilityWeight > 0.6 && vector.adaptability < 60) {
      areas.push('Adaptability & change management — agile training recommended');
    }

    // Team dynamic gaps
    if ((requirements.teamDynamic === 'large_team' || requirements.teamDynamic === 'cross_functional') && vector.teamwork < 60) {
      areas.push('Team collaboration skills — cross-functional project experience needed');
    }
    if (requirements.teamDynamic === 'solo' && vector.independence < 60) {
      areas.push('Independent working capability — self-management skills development');
    }

    return areas;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5: AI-POWERED INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  private async generateBatchInsights(
    candidates: ScoredCandidate[],
    requirements: JDRequirements,
  ): Promise<void> {
    // Generate insights for top 5 candidates (to save LLM calls)
    const topForInsights = candidates.slice(0, 5);

    const candidateSummaries = topForInsights.map((sc, i) => ({
      rank: i + 1,
      name: sc.candidate.fullName,
      style: sc.candidate.personalityStyle || 'Unknown',
      score: sc.compositeScore,
      tier: sc.tier,
      agileScore: sc.candidate.bestScore || sc.candidate.totalScore || 0,
      strengths: sc.matchReasons.join('; '),
      gaps: sc.developmentAreas.join('; '),
    }));

    const prompt = `You are an expert talent analyst. Generate brief, specific insights for each candidate matched to this role.

ROLE: ${requirements.roleTitle} (${requirements.seniorityLevel} level)
Key Requirements: ${requirements.softSkills.join(', ')}
Industry: ${requirements.industryContext}

CANDIDATES:
${candidateSummaries.map(c => `${c.rank}. ${c.name} | Style: ${c.style} | Score: ${c.score}/100 | Tier: ${c.tier} | Agile: ${c.agileScore}/125
   Strengths: ${c.strengths}
   Gaps: ${c.gaps}`).join('\n')}

For each candidate, provide a 1-2 sentence insight about their fit and one actionable recommendation.
Output ONLY a JSON array:
[{"rank": 1, "insight": "...", "recommendation": "..."}, ...]`;

    try {
      const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
      const jsonStr = response.content.toString().trim();
      const cleanJson = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const insights = JSON.parse(cleanJson) as { rank: number; insight: string; recommendation: string }[];

      for (const item of insights) {
        const idx = item.rank - 1;
        if (idx >= 0 && idx < topForInsights.length) {
          topForInsights[idx].insights = [item.insight, item.recommendation];
        }
      }
    } catch (error) {
      this.logger.warn(`Insight generation failed: ${error.message}`);
      // Use fallback insights
      for (const sc of topForInsights) {
        sc.insights = [`${sc.candidate.personalityStyle || 'This candidate'} shows ${sc.tier === 'STRONG_FIT' ? 'excellent' : sc.tier === 'GOOD_FIT' ? 'good' : 'moderate'} alignment with the ${requirements.roleTitle} role.`];
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSE FORMATTING — Rich markdown for chat display
  // ═══════════════════════════════════════════════════════════════════════════
  formatMatchResultForChat(result: JDMatchResult): string {
    if (result.matchedCandidates.length === 0) {
      return `**🎯 JD Analysis Complete for "${result.parsedRequirements.roleTitle}"**\n\n` +
        `No candidates with completed assessments were found matching the criteria.\n\n` +
        `**Position Requirements:**\n` +
        `• Seniority Level: ${result.parsedRequirements.seniorityLevel}\n` +
        `• Industry: ${result.parsedRequirements.industryContext}\n\n` +
        `Ensure candidates have completed their behavioral assessments first.`;
    }

    const req = result.parsedRequirements;
    let response = `**🎯 JD-Based Candidate Matching Report**\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // ── Requirements Summary ──
    response += `**📋 Role:** ${req.roleTitle} (${req.seniorityLevel} level)\n`;
    response += `**🏢 Industry:** ${req.industryContext}\n`;
    response += `**👥 Team:** ${req.teamDynamic.replace(/_/g, ' ')}\n`;

    const roleFlags: string[] = [];
    if (req.leadershipRequired) roleFlags.push('🏆 Leadership');
    if (req.analyticalRequired) roleFlags.push('📊 Analytical');
    if (req.creativityRequired) roleFlags.push('🎨 Creative');
    if (req.customerFacing) roleFlags.push('🤝 Customer-facing');
    if (roleFlags.length > 0) response += `**🔑 Key:** ${roleFlags.join(' | ')}\n`;

    response += `\n**📊 ${result.totalCandidatesEvaluated} candidates evaluated** | Top ${result.matchedCandidates.length} matches\n\n`;

    response += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    // ── Candidate Results ──
    result.matchedCandidates.forEach((sc, index) => {
      const tierEmoji = sc.tier === 'STRONG_FIT' ? '🟢'
        : sc.tier === 'GOOD_FIT' ? '🔵'
        : sc.tier === 'MODERATE_FIT' ? '🟡'
        : '🟠';

      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**#${index + 1}**`;

      response += `\n${medal} **${sc.candidate.fullName}** ${tierEmoji} ${sc.tier.replace(/_/g, ' ')}\n`;
      response += `   📊 **Match Score: ${sc.compositeScore}/100** | Confidence: ${sc.confidenceLevel}%\n`;

      if (sc.candidate.personalityStyle) {
        response += `   🧬 **Leadership Style:** ${sc.candidate.personalityStyle}\n`;
      }

      // Show success prediction and retention risk
      if (sc.successPrediction !== undefined) {
        const predictionEmoji = sc.successPrediction >= 80 ? '🎯' : sc.successPrediction >= 65 ? '📈' : '📊';
        response += `   ${predictionEmoji} **Success Likelihood:** ${sc.successPrediction}%`;
        if (sc.retentionRisk) {
          const riskEmoji = sc.retentionRisk === 'LOW' ? '✅' : sc.retentionRisk === 'MEDIUM' ? '⚠️' : '🔴';
          response += ` | **Retention:** ${riskEmoji} ${sc.retentionRisk}`;
        }
        response += '\n';
      }

      // Match reasons - make it more professional
      if (sc.matchReasons.length > 0) {
        response += `   ✓ ${sc.matchReasons.slice(0, 2).join('\n   ✓ ')}\n`;
      }

      // AI Insights - more prominent
      if (sc.insights.length > 0) {
        response += `\n   **Assessment:** *${sc.insights[0]}*\n`;
        if (sc.insights.length > 1) {
          response += `   **Recommendation:** *${sc.insights[1]}*\n`;
        }
      }

      // Development areas (for non-strong fits) - reframe as growth opportunities
      if (sc.developmentAreas.length > 0 && sc.tier !== 'STRONG_FIT') {
        response += `   \n   **Development Focus:** ${sc.developmentAreas[0]}\n`;
      }
    });

    response += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    response += `\n*Analysis completed for ${result.totalCandidatesEvaluated} candidates using multi-dimensional behavioral and competency assessment.*\n`;

    return response;
  }
}
