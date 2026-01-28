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
    rawScore: number;       // 0-125 from total_score
    level: string;          // Naturalist, Adaptive, Learner, Resistant
    levelDescription: string;
    percentage: number;     // Normalized 0-100%
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
    adjacencyType: 'Near Adjacency' | 'Medium Stretch' | 'Far Stretch';
    dimensions: {
        name: string;
        alignment: 'High' | 'Medium' | 'Low';
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
    suitability: 'High' | 'Medium' | 'Low';
    idealFor: string;
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
        private readonly dataSource: DataSource,  // ADD: for raw SQL queries
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
        if (q.includes('career') && (q.includes('fitment') || q.includes('future') || q.includes('role'))) {
            return 'career_fitment';
        }
        if (q.includes('skill') && q.includes('gap')) {
            return 'skill_gap';
        }
        if (q.includes('team') && q.includes('analysis')) {
            return 'team_analysis';
        }
        return null;
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
            ORDER BY aa.completed_at DESC NULLS LAST
            LIMIT 1
        `;

        const [assessmentData] = await this.dataSource.query(assessmentQuery, [userId]);

        if (!assessmentData) {
            throw new NotFoundException(`No registration found for user ${userId}`);
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
        // STEP 6: Generate AI-based insights using REAL data
        // ═══════════════════════════════════════════════════════════════
        const skillCategories = await this.generateSkillScores(profile, discProfile, agileProfile);
        const behavioralSummary = await this.generateBehavioralSummary(profile, discProfile, agileProfile);

        // ═══════════════════════════════════════════════════════════════
        // STEP 7: Calculate scores using REAL assessment data
        // ═══════════════════════════════════════════════════════════════
        const futureRoleReadiness = this.calculateFutureRoleReadiness(profile, discProfile, skillCategories, agileProfile);
        const roleFitmentScore = this.calculateRoleFitmentScore(profile, discProfile, skillCategories, futureRoleReadiness, agileProfile);
        const industrySuitability = this.determineIndustrySuitability(profile, discProfile);

        // ═══════════════════════════════════════════════════════════════
        // STEP 8: Generate AI-powered insights
        // ═══════════════════════════════════════════════════════════════
        const transitionRequirements = await this.generateTransitionRequirements(profile);
        const executiveInsight = await this.generateExecutiveInsight(profile, roleFitmentScore, futureRoleReadiness, agileProfile);
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
- DISC Profile: Dominant ${disc.dominantTrait}
- Agile Level: ${agile.level} (Score: ${agile.percentage}%)

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
            const response = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const content = response.choices[0]?.message?.content || '';
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
            const response = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            });
            return response.choices[0]?.message?.content || this.getDefaultBehavioralSummary(disc);
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
Return ONLY the JSON array, no other text.`;

        try {
            const response = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            });
            const content = response.choices[0]?.message?.content || '';
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

Summarize their potential, key strengths, and what they need to focus on. Be encouraging but realistic. End with actionable positioning advice.`;

        try {
            const response = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            });
            return response.choices[0]?.message?.content || 'Based on current assessment, you show strong potential for role transition with focused development.';
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
}
