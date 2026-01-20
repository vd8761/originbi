
import { Injectable, Logger } from '@nestjs/common';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║    FUTURE ROLE READINESS REPORT GENERATOR                                  ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Generates comprehensive Career Fitment & Future Role Readiness Reports   ║
 * ║  using AI analysis based on profile data and behavioral insights          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export interface ProfileInput {
    name: string;
    currentRole: string;
    currentJobDescription: string;
    yearsOfExperience: number;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
    behavioralStyle?: string;        // From DISC assessment
    behavioralDescription?: string;  // From personality_traits
    agileScore?: number;             // From assessment_attempts.total_score
}

export interface FutureRoleReport {
    reportId: string;
    generatedAt: Date;
    profileSnapshot: ProfileSnapshot;
    behavioralAlignment: string;
    skillAssessment: SkillCategory[];
    overallInsight: string;
    futureRoleReadiness: RoleReadiness;
    roleFitmentScore: RoleFitment;
    industrySuitability: IndustrySuitability[];
    transitionRequirements: string[];
    executiveInsight: string;
    fullReportText: string;
}

interface ProfileSnapshot {
    name: string;
    currentRole: string;
    totalExperience: string;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
}

interface SkillCategory {
    category: string;
    skills: SkillScore[];
}

interface SkillScore {
    skill: string;
    score: number;
    insight: string;
}

interface RoleReadiness {
    score: number;
    adjacencyType: string;
    dimensions: { name: string; alignment: string }[];
}

interface RoleFitment {
    score: number;
    verdict: string;
    components: { name: string; weight: number; score: number }[];
}

interface IndustrySuitability {
    industry: string;
    suitability: string;
    idealFor: string;
}

@Injectable()
export class FutureRoleReportService {
    private readonly logger = new Logger(FutureRoleReportService.name);
    private llm: ChatGroq | null = null;

    private getLlm(): ChatGroq {
        if (!this.llm) {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error('GROQ_API_KEY not set');
            this.llm = new ChatGroq({
                apiKey,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
            });
        }
        return this.llm;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN REPORT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    async generateReport(profile: ProfileInput): Promise<FutureRoleReport> {
        this.logger.log(`📊 Generating Future Role Readiness Report for: ${profile.name}`);

        const reportId = this.generateReportId(profile.name);
        const fullReportText = await this.generateFullReportWithAI(profile);

        return {
            reportId,
            generatedAt: new Date(),
            profileSnapshot: {
                name: profile.name,
                currentRole: profile.currentRole,
                totalExperience: `${profile.yearsOfExperience} Years`,
                relevantExperience: profile.relevantExperience,
                currentIndustry: profile.currentIndustry,
                expectedFutureRole: profile.expectedFutureRole,
            },
            behavioralAlignment: '',
            skillAssessment: [],
            overallInsight: '',
            futureRoleReadiness: { score: 0, adjacencyType: '', dimensions: [] },
            roleFitmentScore: { score: 0, verdict: '', components: [] },
            industrySuitability: [],
            transitionRequirements: [],
            executiveInsight: '',
            fullReportText,
        };
    }

    private generateReportId(name: string): string {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        const initials = name.split(' ').map(n => n[0]?.toUpperCase() || '').join('');
        const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
        return `OBI-G1-${month}/${year}-${initials}-${seq}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI-POWERED REPORT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    private async generateFullReportWithAI(profile: ProfileInput): Promise<string> {
        const systemPrompt = `You are an expert HR consultant and career strategist at Origin BI. 
Generate a comprehensive "Career Fitment & Future Role Readiness Report" based on the candidate profile.

OUTPUT FORMAT (Use EXACTLY this structure):

═══════════════════════════════════════════════════════════════════════════════
                    CAREER FITMENT & FUTURE ROLE READINESS REPORT
                                   Report ID: [GENERATE]
                                     [CANDIDATE NAME]
                                  Future Role Readiness
═══════════════════════════════════════════════════════════════════════════════

📋 PROFILE SNAPSHOT
─────────────────────────────────────────────────────────────────────────────
Current Role: [ROLE]
Total Experience: [X] Years
Relevant Experience: [DETAILS]
Current Industry: [INDUSTRY]
Expected Future Role: [TARGET ROLE]

═══════════════════════════════════════════════════════════════════════════════
1. BEHAVIORAL ALIGNMENT SUMMARY
═══════════════════════════════════════════════════════════════════════════════
[3-4 paragraph analysis of behavioral profile and how it aligns with the target role]

═══════════════════════════════════════════════════════════════════════════════
2. SKILL-WISE CAPABILITY ASSESSMENT (Score out of 5)
═══════════════════════════════════════════════════════════════════════════════

📌 COMMUNICATION SKILLS
┌─────────────────────────────┬───────┬──────────────────────────────────────┐
│ Skill                       │ Score │ Insight                              │
├─────────────────────────────┼───────┼──────────────────────────────────────┤
│ Management Communication    │ X.X   │ [insight]                            │
│ Employee Communication      │ X.X   │ [insight]                            │
│ Stakeholder Negotiation     │ X.X   │ [insight]                            │
│ Policy & Change Comm.       │ X.X   │ [insight]                            │
└─────────────────────────────┴───────┴──────────────────────────────────────┘

📌 [RELEVANT DOMAIN SKILLS - based on target role]
[Generate 4-5 relevant skill categories with 3-5 skills each]

📌 LEADERSHIP & STRATEGY
[Skills relevant to target role]

═══════════════════════════════════════════════════════════════════════════════
3. OVERALL SKILL COVERAGE INSIGHT
═══════════════════════════════════════════════════════════════════════════════
✅ High Strength Areas: [list]
⚡ Moderate / Developable Areas: [list]
[1 sentence summary]

═══════════════════════════════════════════════════════════════════════════════
4. FUTURE ROLE READINESS MAPPING ([CURRENT] → [TARGET])
═══════════════════════════════════════════════════════════════════════════════
┌─────────────────────────────┬────────────────────────────────────────────────┐
│ Dimension                   │ Alignment                                      │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Responsibility Overlap      │ [High/Medium/Low]                              │
│ Skill Transferability       │ [High/Medium/Low]                              │
│ Behavioral Fit              │ [High/Medium/Low]                              │
│ Industry Continuity         │ [High/Medium/Low] ([reason])                   │
└─────────────────────────────┴────────────────────────────────────────────────┘

🎯 Future Role Readiness Score: [XX]%
📊 Adjacency Type: [Near/Moderate/Distant] Adjacency - [explanation]

Score Interpretation:
• 80-100%: High Readiness (Green) - Ready for immediate transition
• 60-79%: Moderate Readiness (Amber) - Transitionable with support
• 0-59%: Low Readiness (Red) - Significant gaps exist

═══════════════════════════════════════════════════════════════════════════════
5. ROLE FITMENT SCORE - [TARGET ROLE] (Out of 100)
═══════════════════════════════════════════════════════════════════════════════
┌─────────────────────────────┬────────┬───────┐
│ Component                   │ Weight │ Score │
├─────────────────────────────┼────────┼───────┤
│ Behavioral Alignment        │ 40%    │ [XX]  │
│ Experience Readiness        │ 30%    │ [XX]  │
│ Skill Coverage              │ 20%    │ [XX]  │
│ Growth Feasibility          │ 10%    │ [XX]  │
└─────────────────────────────┴────────┴───────┘

🏆 Final Role Fitment Score: [XX]%

VERDICT: [STRONG FIT / CONDITIONAL STRONG FIT / MODERATE FIT / DEVELOPMENT NEEDED]
[1-2 sentence explanation of verdict]

═══════════════════════════════════════════════════════════════════════════════
6. INDUSTRY-SPECIFIC SUITABILITY
═══════════════════════════════════════════════════════════════════════════════
🏢 [Target Industry 1]
   Suitability: [High/Medium/Low]
   Ideal for: [specific areas]

🏢 [Target Industry 2]
   Suitability: [High/Medium/Low]
   Requires: [development areas]

═══════════════════════════════════════════════════════════════════════════════
7. KEY TRANSITION REQUIREMENTS (Critical for [TARGET ROLE] Readiness)
═══════════════════════════════════════════════════════════════════════════════
To move from [CURRENT ROLE] → [TARGET ROLE], the following shifts are required:

➡️ From [current capability] → [required capability]
➡️ From [current capability] → [required capability]
➡️ From [current capability] → [required capability]
➡️ From [current capability] → [required capability]
➡️ From [current capability] → [required capability]

═══════════════════════════════════════════════════════════════════════════════
8. ORIGIN BI EXECUTIVE INSIGHT
═══════════════════════════════════════════════════════════════════════════════
[2-3 paragraph personalized executive summary with actionable recommendations]

═══════════════════════════════════════════════════════════════════════════════
                              Powered by Origin BI
═══════════════════════════════════════════════════════════════════════════════

IMPORTANT RULES:
1. Be specific and analytical - use real insights based on the role transition
2. Generate realistic skill scores (3.0 - 5.0 range typically)
3. Provide actionable, practical insights
4. The readiness score should realistically reflect the gap between current and target role
5. Customize skill categories based on the TARGET role requirements
6. Do NOT mention assessment methodologies like DISC or Agile ACI
7. NEVER include any dates in the report - no month, year, or day references`;

        const userPrompt = `Generate a complete Career Fitment & Future Role Readiness Report for:

CANDIDATE PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${profile.name}
Current Role: ${profile.currentRole}
Current Job Description: ${profile.currentJobDescription}
Years of Experience: ${profile.yearsOfExperience}
Relevant Experience: ${profile.relevantExperience}
Current Industry: ${profile.currentIndustry}
Expected Future Role: ${profile.expectedFutureRole}
${profile.behavioralStyle ? `Behavioral Style: ${profile.behavioralStyle}` : ''}
${profile.behavioralDescription ? `Behavioral Description: ${profile.behavioralDescription}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate the COMPLETE report now:`;

        try {
            const response = await this.getLlm().invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt),
            ]);

            return response.content.toString();
        } catch (error) {
            this.logger.error(`Report generation failed: ${error.message}`);
            throw new Error('Failed to generate report');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORMAT FOR CHAT DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════
    formatForChat(report: FutureRoleReport): string {
        return `**📊 Career Fitment Report Generated**\n\n**Report ID:** ${report.reportId}\n**Candidate:** ${report.profileSnapshot.name}\n**Generated:** ${report.generatedAt.toLocaleDateString()}\n\n---\n\n${report.fullReportText}`;
    }
}
