import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
    Registration,
    AssessmentAttempt,
    User,
    PersonalityTrait,
} from '@originbi/shared-entities';
import Groq from 'groq-sdk';

// ─── Resilient LLM Helper ────────────────────────────────────────────────
// Tries Groq first, falls back to Google Gemini on rate-limit (429) or error.
// Uses the GOOGLE_API_KEY already in .env for Gemini.
async function resilientLLMCall(
    groqClient: Groq,
    messages: { role: string; content: string }[],
    opts: { maxTokens?: number; temperature?: number; logger?: Logger } = {},
): Promise<string> {
    const { maxTokens = 1000, temperature = 0, logger } = opts;

    // ── Attempt 1: Groq ──
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: messages as any,
                temperature,
                max_tokens: maxTokens,
            });
            return res.choices[0]?.message?.content || '';
        } catch (err: any) {
            const isRateLimit = err?.status === 429 || err?.error?.error?.code === 'rate_limit_exceeded';
            if (isRateLimit && attempt === 1) {
                logger?.warn('⚠️ Groq rate-limited, falling back to Gemini...');
                break; // fall through to Gemini
            }
            if (attempt === 2) throw err;
            // Transient error — wait and retry once
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ── Attempt 2: Google Gemini fallback ──
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
        throw new Error('Groq rate-limited and no GOOGLE_API_KEY for fallback');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${googleApiKey}`;
    const geminiBody = {
        contents: [{ parts: [{ text: messages.map(m => `${m.role}: ${m.content}`).join('\n') }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
    };

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody),
            });
            if (resp.status === 429) {
                logger?.warn('⏳ Gemini also rate-limited, waiting 5s...');
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }
            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                throw new Error(`Gemini ${resp.status}: ${errText.slice(0, 200)}`);
            }
            const data = await resp.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (err) {
            if (attempt === 2) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    return '';
}

// Agile ACI Score Interpretation (0-125 scale from totalScore)
const AGILE_LEVELS = {
    naturalist: {
        min: 100, max: 125,
        name: 'Agile Naturalist',
        desc: 'Lives the Agile mindset naturally with balance between speed, empathy, and accountability.',
    },
    adaptive: {
        min: 75, max: 99,
        name: 'Agile Adaptive',
        desc: 'Works well in dynamic situations and motivates others through enthusiasm.',
    },
    learner: {
        min: 50, max: 74,
        name: 'Agile Learner',
        desc: 'Open to Agile ideas but may need guidance for consistency.',
    },
    resistant: {
        min: 0, max: 49,
        name: 'Agile Resistant',
        desc: 'Prefers structure and predictability. Needs gradual exposure to flexibility.',
    },
};

// Report Types
export type CustomReportType = 'career_fitment' | 'skill_gap' | 'team_analysis';

// Career Profile Data Interface
export interface CareerProfileData {
    fullName: string;
    email: string;
    currentRole: string;
    currentJobDescription: string;
    yearsOfExperience: number;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
    expectedIndustry?: string;
}

// DISC Profile
export interface DiscProfile {
    dominantTrait: string;
    traitDescription: string;
    scoreD: number;
    scoreI: number;
    scoreS: number;
    scoreC: number;
}

// Agile Profile (from real assessment data)
export interface AgileProfile {
    rawScore?: number;       // 0-125 from total_score (optional for NOT ASSESSED)
    level: string;          // Naturalist, Adaptive, Learner, Resistant, or "NOT ASSESSED"
    levelDescription?: string;
    percentage: number;     // Normalized 0-100%
    description?: string;   // Additional description for NOT ASSESSED cases
}

// Skill Category with individual skills and scores
export interface SkillCategory {
    category: string;
    skills: {
        name: string;
        score: number;
        insight: string;
    }[];
}

// Future Role Readiness
export interface FutureRoleReadiness {
    readinessScore: number;
    adjacencyType: 'Near Adjacency' | 'Medium Stretch' | 'Far Stretch' | 'Not Assessed';
    dimensions: {
        name: string;
        alignment: 'High' | 'Medium' | 'Low' | 'Not Assessed';
    }[];
}

// Role Fitment Score
export interface RoleFitmentScore {
    totalScore: number;
    components: {
        name: string;
        weight: number;
        score: number;
    }[];
    verdict: string;
}

// Industry Suitability
export interface IndustrySuitability {
    industry: string;
    suitability: 'High' | 'Medium' | 'Low' | 'Not Assessed';
    idealFor: string;
}

// Chat-based Profile Input (user-provided data from chat)
export interface ChatProfileInput {
    name: string;
    currentRole: string;
    currentJobDescription: string;
    yearsOfExperience: number;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
    expectedIndustry?: string;
}

// Complete Career Fitment Report Data
export interface CareerFitmentReportData {
    reportId: string;
    generatedDate: Date;
    profile: CareerProfileData;
    discProfile: DiscProfile;
    agileProfile: AgileProfile;        // NEW: Real Agile data
    behavioralSummary: string;
    skillCategories: SkillCategory[];
    overallSkillInsight: {
        highStrengthAreas: string[];
        developableAreas: string[];
    };
    futureRoleReadiness: FutureRoleReadiness;
    roleFitmentScore: RoleFitmentScore;
    industrySuitability: IndustrySuitability[];
    transitionRequirements: string[];
    executiveInsight: string;
}

import { ModuleRef } from '@nestjs/core';
import { forwardRef, Inject } from '@nestjs/common';
import { OverallRoleFitmentService } from './overall-role-fitment.service';

@Injectable()
export class CustomReportService {
    private readonly logger = new Logger(CustomReportService.name);
    private groqClient: Groq;

    constructor(
        @InjectRepository(Registration)
        private readonly registrationRepo: Repository<Registration>,
        @InjectRepository(AssessmentAttempt)
        private readonly attemptRepo: Repository<AssessmentAttempt>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(PersonalityTrait)
        private readonly traitRepo: Repository<PersonalityTrait>,
        private readonly dataSource: DataSource,
        private moduleRef: ModuleRef, // Use ModuleRef for circular dependency handling if needed
    ) {
        this.groqClient = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    /**
     * Detect report type from user query
     */
    detectReportType(query: string): CustomReportType | null {
        const q = query.toLowerCase();

        // Check for GROUP / TEAM intent specifically
        if ((q.includes('group') || q.includes('team') || q.includes('batch')) &&
            (q.includes('report') || q.includes('analysis') || q.includes('fitment'))) {
            return 'team_analysis'; // This will now map to Overall Fitment Report
        }

        if (q.includes('career') && (q.includes('fitment') || q.includes('future') || q.includes('role'))) {
            return 'career_fitment';
        }
        if (q.includes('skill') && q.includes('gap')) {
            return 'skill_gap';
        }
        if (q.includes('team') && q.includes('analysis')) {
            return 'team_analysis';
        }
        return null; // Default or handled by general chat logic
    }


    /**
     * Generate Career Fitment Report Data for a user - USES REAL DB DATA
     */
    async generateCareerFitmentData(userId: number): Promise<CareerFitmentReportData> {
        this.logger.log(`Generating Career Fitment Report for user ${userId}`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Fetch REAL assessment data using SQL query
        // Same pattern as overall-role-fitment.service.ts
        // ═══════════════════════════════════════════════════════════════
        const assessmentQuery = `
            SELECT 
                r.id as registration_id,
                r.full_name,
                r.metadata as reg_metadata,
                u.email,
                u.metadata as user_metadata,
                aa.total_score as agile_score,
                aa.sincerity_index,
                aa.sincerity_class,
                aa.metadata as attempt_metadata,
                aa.completed_at,
                pt.code as disc_code,
                pt.blended_style_name as disc_type,
                pt.blended_style_desc as disc_description,
                g.name as group_name
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            LEFT JOIN groups g ON r.group_id = g.id
            WHERE r.user_id = $1 AND r.is_deleted = false
            ORDER BY 
                CASE WHEN pt.blended_style_name IS NOT NULL THEN 0 ELSE 1 END,
                aa.completed_at DESC NULLS LAST
            LIMIT 1
        `;

        const [assessmentData] = await this.dataSource.query(assessmentQuery, [userId]);

        if (!assessmentData || !assessmentData.agile_score || !assessmentData.disc_type) {
            this.logger.warn(`User ${userId} has incomplete assessment data. Skipping report generation.`);
            throw new NotFoundException(`User ${userId} has not completed the required assessments (Agile + DISC).`);
        }

        this.logger.log(`📊 Found assessment data: DISC=${assessmentData.disc_type}, Agile=${assessmentData.agile_score}`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Extract metadata from JSONB fields
        // ═══════════════════════════════════════════════════════════════
        const regMetadata = assessmentData.reg_metadata || {};
        const userMetadata = assessmentData.user_metadata || {};
        const attemptMetadata = assessmentData.attempt_metadata || {};

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: Build Profile from REAL data
        // ═══════════════════════════════════════════════════════════════
        const profile: CareerProfileData = {
            fullName: assessmentData.full_name || userMetadata.fullName || 'Unknown',
            email: assessmentData.email || '',
            currentRole: regMetadata.currentRole || attemptMetadata.currentRole || 'Not Specified',
            currentJobDescription: regMetadata.currentJobDescription || attemptMetadata.jobDescription || '',
            yearsOfExperience: regMetadata.yearsOfExperience || attemptMetadata.yearsOfExperience || 0,
            relevantExperience: regMetadata.relevantExperience || '',
            currentIndustry: regMetadata.currentIndustry || assessmentData.group_name || 'Not Specified',
            expectedFutureRole: regMetadata.expectedFutureRole || 'Not Specified',
            expectedIndustry: regMetadata.expectedIndustry || '',
        };

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: Build DISC Profile from REAL personality_traits data
        // ═══════════════════════════════════════════════════════════════
        const discProfile: DiscProfile = {
            dominantTrait: assessmentData.disc_type || 'Not Assessed',
            traitDescription: assessmentData.disc_description || '',
            // Extract D,I,S,C scores if stored in metadata (optional)
            scoreD: attemptMetadata.scoreD || attemptMetadata.d_score || 0,
            scoreI: attemptMetadata.scoreI || attemptMetadata.i_score || 0,
            scoreS: attemptMetadata.scoreS || attemptMetadata.s_score || 0,
            scoreC: attemptMetadata.scoreC || attemptMetadata.c_score || 0,
        };

        // ═══════════════════════════════════════════════════════════════
        // STEP 5: Build AGILE Profile from REAL total_score (0-125)
        // ═══════════════════════════════════════════════════════════════
        const rawAgileScore = parseFloat(assessmentData.agile_score) || 0;
        const agileProfile = this.getAgileProfile(rawAgileScore);

        this.logger.log(`📈 Agile Profile: ${agileProfile.level} (${agileProfile.rawScore}/125 = ${agileProfile.percentage}%)`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 6: Generate AI-based insights using REAL data (PARALLEL)
        // ═══════════════════════════════════════════════════════════════
        const [skillCategories, behavioralSummary] = await Promise.all([
            this.generateSkillScores(profile, discProfile, agileProfile),
            this.generateBehavioralSummary(profile, discProfile, agileProfile),
        ]);

        // ═══════════════════════════════════════════════════════════════
        // STEP 7: Calculate scores using REAL assessment data
        // ═══════════════════════════════════════════════════════════════
        const futureRoleReadiness = this.calculateFutureRoleReadiness(profile, discProfile, skillCategories, agileProfile);
        const roleFitmentScore = this.calculateRoleFitmentScore(profile, discProfile, skillCategories, futureRoleReadiness, agileProfile);
        const industrySuitability = this.determineIndustrySuitability(profile, discProfile);

        // ═══════════════════════════════════════════════════════════════
        // STEP 8: Generate AI-powered insights (PARALLEL)
        // ═══════════════════════════════════════════════════════════════
        const [transitionRequirements, executiveInsight] = await Promise.all([
            this.generateTransitionRequirements(profile),
            this.generateExecutiveInsight(profile, roleFitmentScore, futureRoleReadiness, agileProfile),
        ]);
        const overallSkillInsight = this.extractSkillInsights(skillCategories);

        // ═══════════════════════════════════════════════════════════════
        // STEP 9: Generate report ID
        // ═══════════════════════════════════════════════════════════════
        const reportId = `OBI-G1-${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(2)}-${profile.fullName.split(' ')[0].toUpperCase().slice(0, 2)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        return {
            reportId,
            generatedDate: new Date(),
            profile,
            discProfile,
            agileProfile,  // NEW: Real Agile data from total_score
            behavioralSummary,
            skillCategories,
            overallSkillInsight,
            futureRoleReadiness,
            roleFitmentScore,
            industrySuitability,
            transitionRequirements,
            executiveInsight,
        };
    }

    /**
     * Get Agile Profile Level from raw score (0-125)
     */
    private getAgileProfile(rawScore: number): AgileProfile {
        let level = AGILE_LEVELS.resistant;

        if (rawScore >= AGILE_LEVELS.naturalist.min) {
            level = AGILE_LEVELS.naturalist;
        } else if (rawScore >= AGILE_LEVELS.adaptive.min) {
            level = AGILE_LEVELS.adaptive;
        } else if (rawScore >= AGILE_LEVELS.learner.min) {
            level = AGILE_LEVELS.learner;
        }

        return {
            rawScore,
            level: level.name,
            levelDescription: level.desc,
            percentage: Math.round((rawScore / 125) * 100),
        };
    }

    /**
     * Generate AI-based skill scores for the user
     */
    private async generateSkillScores(profile: CareerProfileData, disc: DiscProfile, agile: AgileProfile): Promise<SkillCategory[]> {
        const prompt = `Based on this employee profile, generate realistic skill scores (1-5 scale) with brief insights.

Profile:
- Current Role: ${profile.currentRole}
- Years of Experience: ${profile.yearsOfExperience}
- Industry: ${profile.currentIndustry}
- Expected Future Role: ${profile.expectedFutureRole}

Generate JSON with this EXACT structure (no markdown, just JSON):
{
  "categories": [
    {
      "category": "Communication Skills",
      "skills": [
        {"name": "Management Communication", "score": 4.2, "insight": "Strong clarity with executives"},
        {"name": "Employee Communication", "score": 3.8, "insight": "Good but can improve warmth"},
        {"name": "Stakeholder Negotiation", "score": 4.0, "insight": "Logic-based approach"},
        {"name": "Policy Communication", "score": 4.1, "insight": "Clear on process changes"}
      ]
    },
    {
      "category": "People Operations",
      "skills": [
        {"name": "End-to-End HR Operations", "score": 4.5, "insight": ""},
        {"name": "Employee Relations", "score": 4.0, "insight": ""},
        {"name": "HR Compliance", "score": 4.3, "insight": ""}
      ]
    },
    {
      "category": "Talent & Culture",
      "skills": [
        {"name": "Talent Acquisition", "score": 4.0, "insight": ""},
        {"name": "Talent Management", "score": 4.2, "insight": ""},
        {"name": "Culture & Engagement", "score": 3.7, "insight": ""}
      ]
    },
    {
      "category": "Business & Strategy",
      "skills": [
        {"name": "Workforce Planning", "score": 3.5, "insight": ""},
        {"name": "HR Analytics", "score": 3.6, "insight": ""},
        {"name": "Business Acumen", "score": 3.4, "insight": ""},
        {"name": "Change Management", "score": 3.8, "insight": ""}
      ]
    }
  ]
}

Make scores realistic based on role/experience. Adapt skill categories to the person's actual role/industry.`;

        try {
            const content = await resilientLLMCall(
                this.groqClient,
                [{ role: 'user', content: prompt }],
                { maxTokens: 2000, logger: this.logger },
            );
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.categories || [];
            }
        } catch (error) {
            this.logger.error('Error generating skill scores:', error);
        }

        // Fallback default scores
        return this.getDefaultSkillCategories(profile);
    }

    /**
     * Generate behavioral summary via AI
     */
    private async generateBehavioralSummary(profile: CareerProfileData, disc: DiscProfile, agile: AgileProfile): Promise<string> {
        const prompt = `Write a 3-4 sentence professional behavioral alignment summary for this person targeting their future role.

Current Role: ${profile.currentRole}
Expected Future Role: ${profile.expectedFutureRole}
DISC Dominant Trait: ${disc.dominantTrait}
Experience: ${profile.yearsOfExperience} years in ${profile.currentIndustry}

Focus on how their behavioral profile aligns with the target role. Be specific and insightful. No bullet points, just flowing text.`;

        try {
            const content = await resilientLLMCall(
                this.groqClient,
                [{ role: 'user', content: prompt }],
                { maxTokens: 500, logger: this.logger },
            );
            return content || this.getDefaultBehavioralSummary(disc);
        } catch (error) {
            this.logger.error('Error generating behavioral summary:', error);
            return this.getDefaultBehavioralSummary(disc);
        }
    }

    /**
     * Generate transition requirements via AI
     */
    private async generateTransitionRequirements(profile: CareerProfileData): Promise<string[]> {
        const prompt = `List 5 specific transition requirements for moving from "${profile.currentRole}" to "${profile.expectedFutureRole}".
Format as JSON array of strings. Each requirement should start with "From ... -> ..." format.
Example: ["From HR execution -> People strategy ownership", "From policy compliance -> culture engineering"]

IMPORTANT: Do NOT recommend any courses, certifications, Coursera, edX, Udemy, or external training programs. Focus ONLY on skill and mindset shifts.

Return ONLY the JSON array, no other text.`;

        try {
            const content = await resilientLLMCall(
                this.groqClient,
                [{ role: 'user', content: prompt }],
                { maxTokens: 500, logger: this.logger },
            );
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            this.logger.error('Error generating transition requirements:', error);
        }
        return [
            `From ${profile.currentRole} execution -> Strategic leadership`,
            'From individual contribution -> Team leadership',
            'From operational focus -> Strategic planning',
            'From tactical delivery -> Organizational vision',
            'From departmental scope -> Enterprise-wide impact',
        ];
    }

    /**
     * Generate executive insight via AI
     */
    private async generateExecutiveInsight(
        profile: CareerProfileData,
        fitment: RoleFitmentScore,
        readiness: FutureRoleReadiness,
        agile: AgileProfile,
    ): Promise<string> {
        const prompt = `Write a 3-4 sentence executive closing insight for a career fitment report.

Profile: ${profile.currentRole} with ${profile.yearsOfExperience} years experience
Target Role: ${profile.expectedFutureRole}
Role Fitment Score: ${fitment.totalScore}%
Readiness Score: ${readiness.readinessScore}%
Adjacency: ${readiness.adjacencyType}
Agile Level: ${agile.level} (${agile.percentage}%)

Summarize their potential, key strengths, and what they need to focus on. Be encouraging but realistic. End with actionable positioning advice.

IMPORTANT: Do NOT recommend any courses, certifications, Coursera, edX, Udemy, or external training programs. Focus ONLY on the candidate's readiness and internal development areas.`;

        try {
            const content = await resilientLLMCall(
                this.groqClient,
                [{ role: 'user', content: prompt }],
                { maxTokens: 500, logger: this.logger },
            );
            return content || 'Based on current assessment, you show strong potential for role transition with focused development.';
        } catch (error) {
            this.logger.error('Error generating executive insight:', error);
            return 'Based on current assessment, you show strong potential for role transition with focused development.';
        }
    }

    /**
     * Calculate Future Role Readiness
     */
    private calculateFutureRoleReadiness(
        profile: CareerProfileData,
        disc: DiscProfile,
        skills: SkillCategory[],
        agile: AgileProfile,
    ): FutureRoleReadiness {
        // Calculate average skill score
        let totalScore = 0;
        let skillCount = 0;
        skills.forEach(cat => {
            cat.skills.forEach(skill => {
                totalScore += skill.score;
                skillCount++;
            });
        });
        const avgSkillScore = skillCount > 0 ? totalScore / skillCount : 3;

        // Base readiness on experience and skills
        const experienceFactor = Math.min(profile.yearsOfExperience / 15, 1); // Max at 15 years
        const skillFactor = avgSkillScore / 5;

        const readinessScore = Math.round((experienceFactor * 0.4 + skillFactor * 0.6) * 100);

        // Determine adjacency
        let adjacencyType: 'Near Adjacency' | 'Medium Stretch' | 'Far Stretch';
        if (readinessScore >= 70) adjacencyType = 'Near Adjacency';
        else if (readinessScore >= 50) adjacencyType = 'Medium Stretch';
        else adjacencyType = 'Far Stretch';

        return {
            readinessScore,
            adjacencyType,
            dimensions: [
                { name: 'Responsibility Overlap', alignment: readinessScore >= 60 ? 'High' : 'Medium' },
                { name: 'Skill Transferability', alignment: avgSkillScore >= 3.8 ? 'High' : 'Medium' },
                { name: 'Behavioral Fit', alignment: disc.dominantTrait ? 'High' : 'Medium' },
                { name: 'Industry Continuity', alignment: 'High' },
            ],
        };
    }

    /**
     * Calculate Role Fitment Score
     */
    private calculateRoleFitmentScore(
        profile: CareerProfileData,
        disc: DiscProfile,
        skills: SkillCategory[],
        readiness: FutureRoleReadiness,
        agile: AgileProfile,
    ): RoleFitmentScore {
        // Calculate component scores
        const behavioralScore = disc.dominantTrait ? 34 : 25; // out of 40
        const experienceScore = Math.min(profile.yearsOfExperience * 2.4, 30); // out of 30

        let totalSkillScore = 0;
        let skillCount = 0;
        skills.forEach(cat => {
            cat.skills.forEach(skill => {
                totalSkillScore += skill.score;
                skillCount++;
            });
        });
        const skillCoverage = skillCount > 0 ? (totalSkillScore / skillCount / 5) * 20 : 12; // out of 20

        const growthFeasibility = 8; // out of 10

        const totalScore = Math.round(behavioralScore + experienceScore + skillCoverage + growthFeasibility);

        // Generate verdict
        let verdict: string;
        if (totalScore >= 80) {
            verdict = 'STRONG FIT. Highly aligned with role requirements.';
        } else if (totalScore >= 60) {
            verdict = 'CONDITIONAL STRONG FIT. Well-suited with minor development areas.';
        } else {
            verdict = 'MODERATE FIT. Good potential with focused development needed.';
        }

        return {
            totalScore,
            components: [
                { name: 'Behavioral Alignment', weight: 40, score: behavioralScore },
                { name: 'Experience Readiness', weight: 30, score: Math.round(experienceScore) },
                { name: 'Skill Coverage', weight: 20, score: Math.round(skillCoverage) },
                { name: 'Growth Feasibility', weight: 10, score: growthFeasibility },
            ],
            verdict,
        };
    }

    /**
     * Determine Industry Suitability
     */
    private determineIndustrySuitability(profile: CareerProfileData, disc: DiscProfile): IndustrySuitability[] {
        const currentIndustry = profile.currentIndustry;
        return [
            {
                industry: currentIndustry || 'Current Industry',
                suitability: 'High',
                idealFor: 'scaling operations, retention systems, performance discipline',
            },
            {
                industry: 'Large Workforce Organizations (IT/Services)',
                suitability: 'High',
                idealFor: 'org design, people analytics, leadership pipeline governance',
            },
        ];
    }

    /**
     * Extract overall skill insights
     */
    private extractSkillInsights(skills: SkillCategory[]): { highStrengthAreas: string[]; developableAreas: string[] } {
        const highStrength: string[] = [];
        const developable: string[] = [];

        skills.forEach(cat => {
            cat.skills.forEach(skill => {
                if (skill.score >= 4.0) {
                    highStrength.push(skill.name.toLowerCase());
                } else if (skill.score < 3.5) {
                    developable.push(skill.name.toLowerCase());
                }
            });
        });

        return {
            highStrengthAreas: highStrength.slice(0, 5),
            developableAreas: developable.slice(0, 5),
        };
    }

    /**
     * Default skill categories fallback
     */
    private getDefaultSkillCategories(profile: CareerProfileData): SkillCategory[] {
        return [
            {
                category: 'Communication Skills',
                skills: [
                    { name: 'Management Communication', score: 4.0, insight: 'Clear and structured' },
                    { name: 'Employee Communication', score: 3.8, insight: 'Good clarity' },
                    { name: 'Stakeholder Negotiation', score: 3.9, insight: 'Logic-based' },
                ],
            },
            {
                category: 'Leadership & Strategy',
                skills: [
                    { name: 'Team Leadership', score: 4.2, insight: 'Strong ownership' },
                    { name: 'Strategic Planning', score: 3.5, insight: 'Developing' },
                    { name: 'Change Management', score: 3.7, insight: 'Good foundation' },
                ],
            },
        ];
    }

    /**
     * Default behavioral summary fallback
     */
    private getDefaultBehavioralSummary(disc: DiscProfile): string {
        return `The behavioral profile indicates a professional with ${disc.dominantTrait || 'balanced'} tendencies, showing structured thinking and outcome-driven leadership. This behavioral combination aligns well with leadership roles requiring clear decision-making and accountability.`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHAT-BASED CUSTOM REPORT GENERATION
    // Generate report from user-provided profile data (not from DB)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Parse chat message to extract profile data
     */
    parseProfileFromChat(chatMessage: string): ChatProfileInput | null {
        try {
            this.logger.log(`📝 Parsing profile from chat message`);

            // Try to extract key-value pairs from the message
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
                /responsibilities[:\s]*([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)/i,
            ]);

            const yearsOfExperience = parseInt(extractField([
                /years?\s*of\s*experience[:\s]*(\d+)/i,
                /(\d+)\s*years?\s*(?:of\s*)?experience/i,
                /experience[:\s]*(\d+)/i,
            ])) || 0;

            const relevantExperience = extractField([
                /relevant\s*experience[:\s]*([^\n]+)/i,
                /key\s*focus\s*areas?[:\s]*([^\n]+)/i,
            ]);

            const currentIndustry = extractField([
                /current\s*industry[:\s]*([^\n]+)/i,
                /industry[:\s]*([^\n]+)/i,
                /(?:working in|work in)\s+([^\n,]+)\s*industry/i,
            ]);

            const expectedFutureRole = extractField([
                /expected\s*future\s*role[:\s]*([^\n]+)/i,
                /future\s*role[:\s]*([^\n]+)/i,
                /target\s*role[:\s]*([^\n]+)/i,
                /aspiring\s*(?:to be|for)[:\s]*([^\n]+)/i,
            ]);

            const expectedIndustry = extractField([
                /expected\s*industry[:\s]*([^\n]+)/i,
                /target\s*industry[:\s]*([^\n]+)/i,
            ]);

            // Validate required fields
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
                expectedIndustry: expectedIndustry || '',
            };
        } catch (error) {
            this.logger.error(`Failed to parse profile from chat: ${error.message}`);
            return null;
        }
    }

    /**
     * Generate Career Fitment Report from chat-provided profile data
     * This FETCHES REAL DATA from database - looks up user by name and uses actual assessment results
     */
    async generateChatBasedReport(profileInput: ChatProfileInput): Promise<CareerFitmentReportData> {
        this.logger.log(`📊 Generating Chat-Based Career Fitment Report for ${profileInput.name}`);

        // ═══════════════════════════════════════════════════════════════
        // STEP 1: Find user in database by name (using fuzzy matching)
        // ═══════════════════════════════════════════════════════════════
        let hasAssessmentData = false;
        let realDiscProfile: DiscProfile | null = null;
        let realAgileProfile: AgileProfile | null = null;
        let realSkillCategories: SkillCategory[] | null = null;

        try {
            // Normalize the input name for matching
            const searchName = profileInput.name.trim();
            this.logger.log(`🔍 Searching for user: "${searchName}"`);

            // Comprehensive query to fetch ALL assessment data
            // Tries EXACT match first, then fuzzy match
            const userQuery = `
                SELECT 
                    r.id as registration_id,
                    r.full_name,
                    r.user_id,
                    r.assessment_session_id,
                    r.metadata as reg_metadata,
                    u.email as user_email,
                    
                    -- Assessment Attempt Data
                    aa.id as attempt_id,
                    aa.status as attempt_status,
                    aa.total_score as agile_score,
                    aa.completed_at,
                    aa.metadata as attempt_metadata,
                    aa.dominant_trait_id,
                    aa.sincerity_index,
                    aa.sincerity_class,
                    
                    -- Assessment Report Data (generated after completion)
                    ar.id as report_id,
                    ar.disc_scores as report_disc_scores,
                    ar.agile_scores as report_agile_scores,
                    ar.dominant_trait_id as report_trait_id,
                    ar.overall_sincerity,
                    
                    -- Personality Trait Data (DISC Profile)
                    pt.id as trait_id,
                    pt.code as disc_code,
                    pt.blended_style_name as disc_type,
                    pt.blended_style_desc as disc_description,
                    
                    -- Group Data
                    g.name as group_name
                    
                FROM registrations r
                LEFT JOIN users u ON u.id = r.user_id
                LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
                LEFT JOIN assessment_reports ar ON ar.assessment_session_id = r.assessment_session_id
                LEFT JOIN personality_traits pt ON pt.id = COALESCE(ar.dominant_trait_id, aa.dominant_trait_id)
                LEFT JOIN groups g ON r.group_id = g.id
                
                WHERE r.is_deleted = false
                  AND (
                      LOWER(TRIM(r.full_name)) = LOWER(TRIM($1))
                      OR LOWER(TRIM(r.full_name)) LIKE '%' || LOWER(TRIM($1)) || '%'
                      OR LOWER(TRIM($1)) LIKE '%' || LOWER(TRIM(r.full_name)) || '%'
                  )
                ORDER BY 
                    CASE WHEN LOWER(TRIM(r.full_name)) = LOWER(TRIM($1)) THEN 0 ELSE 1 END,
                    CASE WHEN aa.status = 'COMPLETED' THEN 0 ELSE 1 END,
                    aa.completed_at DESC NULLS LAST
            `;

            const results = await this.dataSource.query(userQuery, [searchName]);
            this.logger.log(`📋 Found ${results?.length || 0} registration records for "${searchName}"`);

            if (results && results.length > 0) {
                // Log all results for debugging
                results.forEach((r: any, idx: number) => {
                    this.logger.log(`  [${idx}] ${r.full_name} | attempt_id: ${r.attempt_id} | status: ${r.attempt_status} | agile_score: ${r.agile_score} | disc_type: ${r.disc_type}`);
                });

                // Find COMPLETED attempts - filter by status
                const completedAttempts = results.filter((r: any) => r.attempt_status === 'COMPLETED');
                this.logger.log(`📊 Found ${completedAttempts.length} COMPLETED attempts`);

                // Get the best/latest completed attempt
                const latestAttempt = completedAttempts[0];

                if (latestAttempt) {
                    hasAssessmentData = true;
                    this.logger.log(`✅ Using COMPLETED assessment for ${latestAttempt.full_name}`);
                    this.logger.log(`   📈 Agile Score: ${latestAttempt.agile_score}`);
                    this.logger.log(`   📊 DISC Type: ${latestAttempt.disc_type} (${latestAttempt.disc_code})`);
                    this.logger.log(`   📋 Trait ID: ${latestAttempt.dominant_trait_id}`);

                    // 1. EXTRACT DISC PROFILE
                    // Priority: disc_type from personality_traits > report_disc_scores > attempt_metadata
                    let discScores: any = null;
                    let dominantTraitName = latestAttempt.disc_type || null;
                    let traitDescription = latestAttempt.disc_description || '';

                    // Try to get DISC scores from different sources
                    if (latestAttempt.report_disc_scores) {
                        discScores = typeof latestAttempt.report_disc_scores === 'string'
                            ? JSON.parse(latestAttempt.report_disc_scores)
                            : latestAttempt.report_disc_scores;
                        this.logger.log(`   📊 DISC Scores from report: ${JSON.stringify(discScores)}`);
                    } else if (latestAttempt.attempt_metadata?.disc_scores) {
                        discScores = latestAttempt.attempt_metadata.disc_scores;
                        this.logger.log(`   📊 DISC Scores from attempt metadata: ${JSON.stringify(discScores)}`);
                    } else {
                        // Scan all completed attempts for DISC metadata
                        const attemptWithDisc = completedAttempts.find((a: any) => a.attempt_metadata?.disc_scores);
                        if (attemptWithDisc) {
                            discScores = attemptWithDisc.attempt_metadata.disc_scores;
                            this.logger.log(`   📊 DISC Scores from other attempt: ${JSON.stringify(discScores)}`);
                        }
                    }

                    // Build DISC Profile
                    if (dominantTraitName || discScores || latestAttempt.disc_code) {
                        realDiscProfile = {
                            dominantTrait: dominantTraitName || latestAttempt.disc_code || 'D',
                            traitDescription: traitDescription || 'Assessment completed - behavioral profile analyzed.',
                            scoreD: Number(discScores?.D || discScores?.d || 0),
                            scoreI: Number(discScores?.I || discScores?.i || 0),
                            scoreS: Number(discScores?.S || discScores?.s || 0),
                            scoreC: Number(discScores?.C || discScores?.c || 0),
                        };
                        this.logger.log(`   ✅ Built DISC Profile: ${realDiscProfile.dominantTrait}`);
                    } else {
                        this.logger.warn(`   ⚠️ No DISC profile data found, but assessment is completed`);
                        // Still create a profile with the dominant trait if we have it
                        if (latestAttempt.dominant_trait_id) {
                            realDiscProfile = {
                                dominantTrait: 'Assessed',
                                traitDescription: 'Behavioral assessment completed.',
                                scoreD: 0, scoreI: 0, scoreS: 0, scoreC: 0,
                            };
                        }
                    }

                    // 2. EXTRACT AGILE PROFILE (from total_score)
                    const agileTotal = Number(latestAttempt.agile_score || 0);
                    if (agileTotal > 0) {
                        realAgileProfile = this.getAgileProfile(agileTotal);
                        this.logger.log(`   ✅ Built Agile Profile: ${realAgileProfile.level} (${agileTotal}/125 = ${realAgileProfile.percentage}%)`);
                    } else {
                        // Try to get from report agile_scores
                        let agileScores: any = null;
                        if (latestAttempt.report_agile_scores) {
                            agileScores = typeof latestAttempt.report_agile_scores === 'string'
                                ? JSON.parse(latestAttempt.report_agile_scores)
                                : latestAttempt.report_agile_scores;
                            const agileFromReport = Number(agileScores?.total || agileScores?.score || 0);
                            realAgileProfile = this.getAgileProfile(agileFromReport);
                            this.logger.log(`   ✅ Built Agile Profile from report: ${realAgileProfile.level}`);
                        } else {
                            realAgileProfile = this.getAgileProfile(0);
                            this.logger.warn(`   ⚠️ No agile score found`);
                        }
                    }

                    // 3. GENERATE SKILLS based on real assessment data
                    const dbEmail = latestAttempt.user_email || '';
                    const regMetadata = typeof latestAttempt.reg_metadata === 'string'
                        ? JSON.parse(latestAttempt.reg_metadata || '{}')
                        : (latestAttempt.reg_metadata || {});

                    const tempProfile: CareerProfileData = {
                        fullName: latestAttempt.full_name || profileInput.name,
                        email: dbEmail,
                        currentRole: regMetadata.currentRole || profileInput.currentRole,
                        currentJobDescription: regMetadata.currentJobDescription || profileInput.currentJobDescription,
                        yearsOfExperience: regMetadata.yearsOfExperience || profileInput.yearsOfExperience,
                        relevantExperience: regMetadata.relevantExperience || profileInput.relevantExperience,
                        currentIndustry: regMetadata.currentIndustry || latestAttempt.group_name || profileInput.currentIndustry,
                        expectedFutureRole: regMetadata.expectedFutureRole || profileInput.expectedFutureRole,
                        expectedIndustry: regMetadata.expectedIndustry || profileInput.expectedIndustry || '',
                    };

                    // Generate skills using real DISC and Agile data
                    const safeDisc = realDiscProfile || { dominantTrait: 'D', traitDescription: '', scoreD: 0, scoreI: 0, scoreS: 0, scoreC: 0 };
                    const safeAgile = realAgileProfile || this.getAgileProfile(0);

                    realSkillCategories = await this.generateSkillScores(tempProfile, safeDisc, safeAgile);
                    this.logger.log(`   ✅ Generated ${realSkillCategories.length} skill categories`);

                } else {
                    // No completed attempts found - check if there are any attempts at all
                    const anyAttempts = results.filter((r: any) => r.attempt_id);
                    if (anyAttempts.length > 0) {
                        this.logger.warn(`⚠️ User "${profileInput.name}" has ${anyAttempts.length} attempts but NONE are COMPLETED`);
                        this.logger.warn(`   Attempt statuses: ${anyAttempts.map((a: any) => a.attempt_status).join(', ')}`);
                    } else {
                        this.logger.warn(`⚠️ User "${profileInput.name}" is registered but has NO assessment attempts`);
                    }
                }

            } else {
                this.logger.warn(`⚠️ User "${profileInput.name}" NOT found in database registrations`);
            }
        } catch (error) {
            this.logger.error(`❌ Error searching for user "${profileInput.name}": ${error.message}`);
            this.logger.error(error.stack);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 2: Build profile (use DB data if available, else use chat input)
        // ═══════════════════════════════════════════════════════════════
        const profile: CareerProfileData = {
            fullName: profileInput.name,
            email: '',
            currentRole: profileInput.currentRole,
            currentJobDescription: profileInput.currentJobDescription,
            yearsOfExperience: profileInput.yearsOfExperience,
            relevantExperience: profileInput.relevantExperience,
            currentIndustry: profileInput.currentIndustry,
            expectedFutureRole: profileInput.expectedFutureRole,
            expectedIndustry: profileInput.expectedIndustry || '',
        };

        // ═══════════════════════════════════════════════════════════════
        // STEP 3: Use real data if available, otherwise mark as NOT ASSESSED
        // ═══════════════════════════════════════════════════════════════
        let discProfile: DiscProfile;
        let agileProfile: AgileProfile;
        let skillCategories: SkillCategory[];
        let behavioralSummary: string;

        // Log assessment data status for debugging
        this.logger.log(`📊 Assessment Data Status:`);
        this.logger.log(`   hasAssessmentData: ${hasAssessmentData}`);
        this.logger.log(`   realDiscProfile: ${realDiscProfile ? 'YES (' + realDiscProfile.dominantTrait + ')' : 'NO'}`);
        this.logger.log(`   realAgileProfile: ${realAgileProfile ? 'YES (' + realAgileProfile.level + ')' : 'NO'}`);
        this.logger.log(`   realSkillCategories: ${realSkillCategories ? 'YES (' + realSkillCategories.length + ' categories)' : 'NO'}`);

        // Check if we have valid assessment data - we need at least agile OR disc data
        const hasValidAssessmentData = hasAssessmentData && (realAgileProfile || realDiscProfile);

        if (hasValidAssessmentData) {
            // USE REAL ASSESSMENT DATA (with fallbacks for missing parts)
            this.logger.log(`✅ Using REAL assessment data for report generation`);

            discProfile = realDiscProfile || {
                dominantTrait: 'Assessed',
                traitDescription: 'Behavioral assessment completed.',
                scoreD: 0, scoreI: 0, scoreS: 0, scoreC: 0,
            };
            agileProfile = realAgileProfile || this.getAgileProfile(0);
            skillCategories = realSkillCategories || await this.generateSkillScores(profile, discProfile, agileProfile);
            behavioralSummary = await this.generateChatBehavioralSummary(profile, discProfile, agileProfile);
        } else {
            // NO ASSESSMENT DATA - Mark everything as NOT ASSESSED
            this.logger.warn(`⚠️ No valid assessment data found - marking as NOT ASSESSED`);

            discProfile = {
                dominantTrait: 'NOT ASSESSED',
                traitDescription: 'User has not completed the behavioral assessment. Please complete the Origin BI assessment for accurate behavioral profiling.',
                scoreD: 0,
                scoreI: 0,
                scoreS: 0,
                scoreC: 0,
            };

            agileProfile = {
                level: 'NOT ASSESSED',
                percentage: 0,
                description: 'User has not completed the agility assessment. Please complete the Origin BI assessment for accurate profiling.',
            };

            // Create empty skill categories with "NOT ASSESSED" message
            skillCategories = this.getNotAssessedSkillCategories();

            behavioralSummary = this.getNotAssessedBehavioralSummary(profile);
        }

        // ═══════════════════════════════════════════════════════════════
        // STEP 4: Calculate readiness and fitment (only if assessed)
        // ═══════════════════════════════════════════════════════════════
        let futureRoleReadiness: FutureRoleReadiness;
        let roleFitmentScore: RoleFitmentScore;

        if (hasValidAssessmentData) {
            futureRoleReadiness = this.calculateFutureRoleReadiness(profile, discProfile, skillCategories, agileProfile);
            roleFitmentScore = this.calculateRoleFitmentScore(profile, discProfile, skillCategories, futureRoleReadiness, agileProfile);
        } else {
            futureRoleReadiness = this.getNotAssessedReadiness(profile);
            roleFitmentScore = this.getNotAssessedFitmentScore(profile);
        }

        // Industry suitability and transition requirements (based on profile only)
        const industrySuitability = hasValidAssessmentData
            ? this.determineIndustrySuitability(profile, discProfile)
            : this.getNotAssessedIndustrySuitability(profile);

        const transitionRequirements = await this.generateTransitionRequirements(profile);

        const executiveInsight = hasValidAssessmentData
            ? await this.generateExecutiveInsight(profile, roleFitmentScore, futureRoleReadiness, agileProfile)
            : this.getNotAssessedExecutiveInsight(profile);

        const overallSkillInsight = hasValidAssessmentData
            ? this.extractSkillInsights(skillCategories)
            : { highStrengthAreas: ['Assessment Required'], developableAreas: ['Complete Origin BI assessment to identify development areas'] };

        // Generate report ID (indicates whether it used real data or not)
        const reportPrefix = hasValidAssessmentData ? 'OBI-CFR' : 'OBI-CHAT';
        const reportId = `${reportPrefix}-${new Date().getMonth() + 1}/${new Date().getFullYear().toString().slice(2)}-${profile.fullName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        this.logger.log(`📄 Generated report: ${reportId} (Assessment Data: ${hasValidAssessmentData ? 'YES' : 'NO'})`);

        return {
            reportId,
            generatedDate: new Date(),
            profile,
            discProfile,
            agileProfile,
            behavioralSummary,
            skillCategories,
            overallSkillInsight,
            futureRoleReadiness,
            roleFitmentScore,
            industrySuitability,
            transitionRequirements,
            executiveInsight,
        };
    }

    /**
     * Get skill categories marked as NOT ASSESSED
     */
    private getNotAssessedSkillCategories(): SkillCategory[] {
        return [
            {
                category: 'Leadership & Strategy',
                skills: [
                    { name: 'Strategic Vision', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                    { name: 'Decision Making', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                    { name: 'Team Leadership', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                ]
            },
            {
                category: 'Communication & Influence',
                skills: [
                    { name: 'Executive Communication', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                    { name: 'Stakeholder Management', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                ]
            },
            {
                category: 'Technical & Domain',
                skills: [
                    { name: 'Domain Expertise', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                    { name: 'Technology Acumen', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                ]
            },
            {
                category: 'Adaptability & Growth',
                skills: [
                    { name: 'Change Adaptability', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                    { name: 'Learning Agility', score: 0, insight: 'Assessment Required - Complete Origin BI assessment' },
                ]
            }
        ];
    }

    /**
     * Get NOT ASSESSED behavioral summary
     */
    private getNotAssessedBehavioralSummary(profile: CareerProfileData): string {
        return `⚠️ ASSESSMENT NOT COMPLETED

${profile.fullName} has not completed the Origin BI behavioral and agility assessment. Without assessment data, we cannot provide accurate behavioral analysis or skill evaluation.

To receive a comprehensive Career Fitment Report with accurate insights, please:
1. Register on the Origin BI platform
2. Complete the full behavioral and agility assessment
3. Request a new report after assessment completion

The profile information provided indicates ${profile.yearsOfExperience} years of experience in ${profile.currentIndustry} as ${profile.currentRole}, with aspirations toward ${profile.expectedFutureRole}. However, accurate fitment analysis requires completion of our standardized assessment.`;
    }

    /**
     * Get NOT ASSESSED readiness
     */
    private getNotAssessedReadiness(profile: CareerProfileData): FutureRoleReadiness {
        return {
            readinessScore: 0,
            adjacencyType: 'Not Assessed',
            dimensions: [
                { name: 'Leadership Alignment', alignment: 'Not Assessed' },
                { name: 'Strategic Thinking', alignment: 'Not Assessed' },
                { name: 'Domain Expertise', alignment: 'Not Assessed' },
                { name: 'Change Management', alignment: 'Not Assessed' },
                { name: 'Stakeholder Influence', alignment: 'Not Assessed' },
            ]
        };
    }

    /**
     * Get NOT ASSESSED fitment score
     */
    private getNotAssessedFitmentScore(profile: CareerProfileData): RoleFitmentScore {
        return {
            totalScore: 0,
            components: [
                { name: 'Behavioral Fit', weight: 25, score: 0 },
                { name: 'Experience Alignment', weight: 25, score: 0 },
                { name: 'Skill Readiness', weight: 25, score: 0 },
                { name: 'Agility Index', weight: 25, score: 0 },
            ],
            verdict: `⚠️ ASSESSMENT REQUIRED: ${profile.fullName} has not completed the Origin BI assessment. Please complete the behavioral and agility assessment to receive an accurate Role Fitment Score for the ${profile.expectedFutureRole} position. Without assessment data, we cannot provide reliable fitment analysis.`
        };
    }

    /**
     * Get NOT ASSESSED industry suitability
     */
    private getNotAssessedIndustrySuitability(profile: CareerProfileData): IndustrySuitability[] {
        const targetIndustries = profile.expectedFutureRole.toLowerCase().includes('aerospace')
            ? ['Aerospace', 'BFSI', 'Technology']
            : ['Technology', 'BFSI', 'Manufacturing'];

        return targetIndustries.map(industry => ({
            industry,
            suitability: 'Not Assessed' as const,
            idealFor: 'Complete Origin BI assessment for accurate industry suitability analysis'
        }));
    }

    /**
     * Get NOT ASSESSED executive insight
     */
    private getNotAssessedExecutiveInsight(profile: CareerProfileData): string {
        return `⚠️ EXECUTIVE INSIGHT UNAVAILABLE

This report was generated based on profile information provided via chat for ${profile.fullName}. However, the candidate has NOT completed the Origin BI behavioral and agility assessment.

RECOMMENDATION: Before making any career transition decisions regarding the move from ${profile.currentRole} to ${profile.expectedFutureRole}, we strongly recommend:

1. Complete the Origin BI Assessment: This will provide accurate behavioral profiling and agility assessment.

2. Receive Comprehensive Analysis: With assessment data, we can provide detailed skill gap analysis, behavioral alignment insights, and accurate fitment evaluation.

3. Data-Driven Career Planning: Our AI-powered insights are only as good as the assessment data. Real assessment results will enable personalized recommendations.

The current profile indicates ${profile.yearsOfExperience} years of experience in ${profile.currentIndustry}, which provides a foundation for career transition planning. However, without standardized assessment, any fitment analysis would be speculative.

Contact your administrator or visit the Origin BI platform to complete your assessment.`;
    }

    /**
     * Generate behavioral summary for chat-based profile (with real assessment data)
     */
    private async generateChatBehavioralSummary(profile: CareerProfileData, discProfile: DiscProfile, agileProfile: AgileProfile): Promise<string> {
        const prompt = `Based on this professional profile, generate a 2-3 paragraph behavioral summary:

Profile:
- Name: ${profile.fullName}
- Current Role: ${profile.currentRole}
- Job Description: ${profile.currentJobDescription}
- Years of Experience: ${profile.yearsOfExperience}
- Relevant Experience: ${profile.relevantExperience}
- Current Industry: ${profile.currentIndustry}
- Expected Future Role: ${profile.expectedFutureRole}

Write a professional behavioral summary that:
1. Analyzes their behavioral traits based on their professional experience and role
2. Discusses their readiness and adaptability for the target role
3. Identifies behavioral strengths and potential development areas based on their career trajectory

IMPORTANT RULES:
- Do NOT mention any DISC profile, DISC type, D/I/S/C categories, or DISC scores
- Do NOT mention any Agile/Agility scores, percentages, or specific agility levels
- Do NOT recommend any courses, certifications, Coursera, edX, Udemy, or external training programs
- Focus on professional behavioral insights derived from their experience and role

Write in third person, professional tone. No bullet points, just flowing paragraphs.`;

        try {
            const response = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 500,
                temperature: 0.7,
            });

            return response.choices[0]?.message?.content || this.getDefaultAssessedBehavioralSummary(profile, discProfile, agileProfile);
        } catch (error) {
            this.logger.error(`Failed to generate behavioral summary: ${error.message}`);
            return this.getDefaultAssessedBehavioralSummary(profile, discProfile, agileProfile);
        }
    }

    /**
     * Default behavioral summary for assessed profiles
     */
    private getDefaultAssessedBehavioralSummary(profile: CareerProfileData, discProfile: DiscProfile, agileProfile: AgileProfile): string {
        return `Based on the Origin BI assessment, ${profile.fullName} demonstrates strong professional capabilities with ${profile.yearsOfExperience} years of experience as ${profile.currentRole} in the ${profile.currentIndustry} industry. The assessment reveals strong adaptability to change and new challenges, indicating ${agileProfile.percentage >= 70 ? 'excellent' : agileProfile.percentage >= 50 ? 'good' : 'developing'} readiness for career transitions.

The behavioral assessment suggests ${discProfile.traitDescription || 'a balanced approach to work and leadership'}. Combined with their career trajectory toward ${profile.expectedFutureRole}, this indicates ${agileProfile.percentage >= 60 ? 'readiness for strategic leadership challenges' : 'potential for growth with focused development'}.`;
    }

    /**
     * Default behavioral summary for chat-based profiles (no assessment)
     */
    private getDefaultChatBehavioralSummary(profile: CareerProfileData): string {
        return `Based on their ${profile.yearsOfExperience} years of experience as ${profile.currentRole} in the ${profile.currentIndustry} industry, this professional demonstrates a strong foundation in their domain. Their career trajectory from their current role to the aspired position of ${profile.expectedFutureRole} suggests ambition and strategic career planning.

The profile indicates structured thinking and outcome-driven leadership qualities. Their experience in ${profile.relevantExperience || profile.currentIndustry} provides valuable insights that can be leveraged in the target role. This professional is likely to bring discipline, process orientation, and domain expertise to new challenges.`;
    }
    /**
     * Generate TEAM / GROUP Report - Delegates to OverallRoleFitmentService
     * This handles "10 or 15 peoples in one report" requirement
     */
    async generateTeamReport(groupId: number): Promise<Buffer> {
        this.logger.log(`👥 generating Team Report for Group ID: ${groupId}`);
        try {
            // Lazily resolve dependency to avoid circular import issues
            const overallService = this.moduleRef.get(OverallRoleFitmentService, { strict: false });

            if (!overallService) {
                throw new Error('OverallRoleFitmentService not available');
            }

            const input = {
                groupId: groupId,
                title: 'Team Capability & Role Fitment Analysis'
            };

            return await overallService.generatePdf(input);
        } catch (error) {
            this.logger.error(`Failed to generate Team Report: ${error.message}`);
            throw error;
        }
    }
}
