/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { getTokenTrackerCallback } from './utils/token-tracker';
import { invokeWithFallback } from './utils/llm-fallback';

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
  behavioralStyle?: string;
  behavioralDescription?: string;
  agileScore?: number;
  totalScore?: number;
  sincerityIndex?: number;
  programName?: string;
  groupName?: string;
  gender?: string;
  attemptCount?: number;
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
  private llm: ChatGoogleGenerativeAI | null = null;
  private fallbackLlm: ChatGroq | null = null;

  private getLlm(): ChatGoogleGenerativeAI {
    if (!this.llm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      this.llm = new ChatGoogleGenerativeAI({
        apiKey,
          model: process.env.GEMINI_LLM_MODEL || 'gemini-2.5-flash',
        temperature: 0.3,
        maxOutputTokens: 2200,
        callbacks: [getTokenTrackerCallback('Future Role Report')],
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
        temperature: 0.3,
        maxTokens: 2200,
        callbacks: [getTokenTrackerCallback('Future Role Report (Groq Fallback)')],
      });
    }
    return this.fallbackLlm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async generateReport(profile: ProfileInput): Promise<FutureRoleReport> {
    this.logger.log(
      `📊 Generating Future Role Readiness Report for: ${profile.name}`,
    );

    const reportId = this.generateReportId(profile.name);
    const fullReportText = await this.generateFullReportWithAI(profile);

    return {
      reportId,
      generatedAt: new Date(),
      profileSnapshot: {
        name: profile.name,
        currentRole: profile.currentRole,
        totalExperience: profile.yearsOfExperience > 0 ? `${profile.yearsOfExperience} Years` : 'N/A',
        relevantExperience: profile.relevantExperience || 'N/A',
        currentIndustry: profile.currentIndustry,
        expectedFutureRole: profile.expectedFutureRole || 'Based on assessment analysis',
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
    const initials = name
      .split(' ')
      .map((n) => n[0]?.toUpperCase() || '')
      .join('');
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `CFRR-${initials}-${seq}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI-POWERED REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  private async generateFullReportWithAI(
    profile: ProfileInput,
  ): Promise<string> {
    const isStudent = profile.currentRole.toLowerCase().includes('student');
    const hasScore = profile.totalScore != null && profile.totalScore > 0;

    const systemPrompt = `You are an expert career strategist and behavioral analyst at Origin BI.
Generate a professional "Career Fitment & Future Role Readiness Report".

CRITICAL FORMATTING RULES:
1. Use **Markdown tables** (pipe | format) for ALL tabular data. NEVER use ASCII box-drawing characters (┌─┬─┐ │ └─┴─┘ ├ ┼ ┤).
2. Tables MUST have a header row, a separator row (| --- | --- |), and data rows.
3. Use ## for major section headings and ### for sub-sections.
4. Use **bold** for emphasis and key terms.
5. Keep the report clean, professional, and well-structured.

${isStudent ? `STUDENT CONTEXT:
This candidate is a STUDENT. Do NOT include:
- "Total Experience" or "Years of Experience" (they are a student with 0 experience)
- "Relevant Experience" field
- "Current Industry" as a corporate field
- Any corporate/professional jargon that doesn't apply to students

Instead, in the PROFILE SNAPSHOT, show ONLY:
- Name
- Status: Student
- Field of Study / Academic Background (from their role description)
- Program: (assessment program they took)
- Behavioral Profile: (their behavioral style)
- Assessment Score: (their score if available)
` : ''}

OUTPUT FORMAT (Use EXACTLY this structure with Markdown formatting):

# CAREER FITMENT & FUTURE ROLE READINESS REPORT

**Report ID:** CFRR-XXX
**Candidate:** [NAME]
**Status:** ${isStudent ? 'Student' : '[ROLE]'}

---

## 📋 Profile Snapshot

${isStudent ? `| Field | Details |
| --- | --- |
| **Name** | [Full Name] |
| **Status** | Student |
| **Academic Background** | [Field of study / department / stream] |
| **Program** | [Assessment program name] |
| **Behavioral Profile** | [Behavioral style] |
${hasScore ? '| **Assessment Score** | [Score] |' : ''}
` : `| Field | Details |
| --- | --- |
| **Name** | [Full Name] |
| **Current Role** | [Role] |
| **Industry** | [Industry] |
| **Behavioral Profile** | [Style] |
`}
---

## 1. Behavioral Alignment Summary

[3-4 paragraph detailed analysis of the candidate's behavioral profile. Explain their dominant traits, strengths, interpersonal style, work approach, and how these traits align with potential career paths. Be specific and insightful — reference their behavioral style characteristics directly.]

---

## 2. Skill-Wise Capability Assessment (Score out of 5)

### 📌 Communication Skills

| Skill | Score | Insight |
| --- | --- | --- |
| Verbal Communication | X.X | [specific insight based on behavioral profile] |
| Interpersonal Skills | X.X | [insight] |
| Presentation & Articulation | X.X | [insight] |
| Written Communication | X.X | [insight] |

### 📌 Analytical & Problem-Solving

| Skill | Score | Insight |
| --- | --- | --- |
| Critical Thinking | X.X | [insight] |
| Data-Driven Decision Making | X.X | [insight] |
| Strategic Planning | X.X | [insight] |
| Creative Problem Solving | X.X | [insight] |

### 📌 Leadership & Teamwork

| Skill | Score | Insight |
| --- | --- | --- |
| Team Collaboration | X.X | [insight] |
| Initiative & Ownership | X.X | [insight] |
| Conflict Resolution | X.X | [insight] |
| Adaptability | X.X | [insight] |

### 📌 ${isStudent ? 'Learning & Growth Potential' : 'Domain Expertise'}

| Skill | Score | Insight |
| --- | --- | --- |
| [Relevant skill 1] | X.X | [insight] |
| [Relevant skill 2] | X.X | [insight] |
| [Relevant skill 3] | X.X | [insight] |
| [Relevant skill 4] | X.X | [insight] |

---

## 3. Overall Skill Coverage Insight

- ✅ **High Strength Areas:** [list top 3-4 strengths]
- ⚡ **Moderate / Developable Areas:** [list 2-3 areas for growth]
- ⚠️ **Needs Attention:** [list 1-2 areas needing development]

[1-2 sentence summary of overall capability profile]

---

## 4. ${isStudent ? 'Career Readiness Assessment' : 'Future Role Readiness Mapping'}

| Dimension | Rating | Details |
| --- | --- | --- |
| ${isStudent ? 'Academic Readiness' : 'Responsibility Overlap'} | [High/Medium/Low] | [explanation] |
| Skill Transferability | [High/Medium/Low] | [explanation] |
| Behavioral Fit | [High/Medium/Low] | [explanation] |
| ${isStudent ? 'Growth Trajectory' : 'Industry Continuity'} | [High/Medium/Low] | [explanation] |

**🎯 ${isStudent ? 'Career' : 'Future Role'} Readiness Score:** [XX]%
**📊 Assessment:** [explanation of the score]

- 80-100%: **High Readiness** — Ready for career entry / role transition
- 60-79%: **Moderate Readiness** — Needs targeted development
- 0-59%: **Building Phase** — Significant development needed

---

## 5. Role Fitment Analysis (Out of 100)

| Component | Weight | Score |
| --- | --- | --- |
| Behavioral Alignment | 40% | [XX] |
| ${isStudent ? 'Academic Foundation' : 'Experience Readiness'} | 30% | [XX] |
| Skill Coverage | 20% | [XX] |
| Growth Potential | 10% | [XX] |

**🏆 Final Role Fitment Score:** [XX]%

**Verdict:** [STRONG FIT / CONDITIONAL STRONG FIT / MODERATE FIT / DEVELOPMENT NEEDED]
[1-2 sentence explanation]

---

## 6. ${isStudent ? 'Recommended Career Paths' : 'Industry-Specific Suitability'}

${isStudent ? `Based on the behavioral profile and assessment data, the following career paths are recommended:

### 🎯 Top Recommended Careers

| Career Path | Suitability | Why This Fits |
| --- | --- | --- |
| [Career 1] | High | [reason based on behavioral traits] |
| [Career 2] | High | [reason] |
| [Career 3] | Medium-High | [reason] |
| [Career 4] | Medium | [reason] |
| [Career 5] | Medium | [reason] |
` : `| Industry | Suitability | Best For |
| --- | --- | --- |
| [Industry 1] | High | [specifics] |
| [Industry 2] | Medium | [specifics] |
`}
---

## 7. ${isStudent ? 'Development Roadmap' : 'Key Transition Requirements'}

${isStudent ? `To maximize career readiness, the following development areas are recommended:` : `To transition effectively, the following shifts are required:`}

- ➡️ [Development area 1 with specific actionable advice]
- ➡️ [Development area 2 with specific actionable advice]
- ➡️ [Development area 3 with specific actionable advice]
- ➡️ [Development area 4 with specific actionable advice]
- ➡️ [Development area 5 with specific actionable advice]

---

## 8. Origin BI Executive Insight

[2-3 paragraph personalized executive summary. Highlight the candidate's unique strengths, potential career trajectory, and specific actionable recommendations. ${isStudent ? 'Focus on academic development, skill-building resources, and career preparation steps suitable for a student.' : 'Focus on professional development and role transition strategy.'}]

---

IMPORTANT RULES:
1. Be specific and analytical — use real insights derived from the behavioral profile data provided
2. Skill scores should range from 2.5 to 5.0, be realistic and VARIED (not all similar)
3. Provide actionable, practical insights — not generic advice
4. ALL tables MUST use Markdown pipe format (| col1 | col2 |) — NEVER ASCII box characters
5. Do NOT mention assessment methodology names like "DISC" or "Agile ACI" directly
6. NEVER include dates in the report
7. ${isStudent ? 'Do NOT include experience-related fields. This is a STUDENT. Focus on potential, growth, and career direction.' : 'Customize for the professional context.'}
8. Make skill category names relevant to the candidate's background and career potential`;

    // Build assessment data section for the prompt
    const assessmentLines: string[] = [];
    if (hasScore) assessmentLines.push(`Assessment Score: ${profile.totalScore}`);
    if (profile.agileScore) assessmentLines.push(`Agile Score: ${profile.agileScore}`);
    if (profile.sincerityIndex) assessmentLines.push(`Sincerity Index: ${profile.sincerityIndex}`);
    if (profile.attemptCount) assessmentLines.push(`Assessment Attempts: ${profile.attemptCount}`);

    const userPrompt = `Generate a complete Career Fitment & Future Role Readiness Report for:

**CANDIDATE PROFILE:**
- Name: ${profile.name}
- Current Role: ${profile.currentRole}
- Background: ${profile.currentJobDescription}
${profile.currentIndustry ? `- Field: ${profile.currentIndustry}` : ''}
${profile.programName ? `- Assessment Program: ${profile.programName}` : ''}
${profile.groupName ? `- Group/Batch: ${profile.groupName}` : ''}
${profile.gender ? `- Gender: ${profile.gender}` : ''}
${profile.behavioralStyle ? `- Behavioral Style: ${profile.behavioralStyle}` : ''}
${profile.behavioralDescription ? `- Behavioral Description: ${profile.behavioralDescription}` : ''}
${assessmentLines.length > 0 ? `\n**ASSESSMENT DATA:**\n${assessmentLines.map(l => `- ${l}`).join('\n')}` : ''}

Generate the COMPLETE report now using Markdown tables (pipe format). Do NOT use ASCII box-drawing characters.`;

    try {
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'Future role report generation',
        invokePrimary: () =>
          this.getLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
          ]),
        invokeFallback: () =>
          this.getFallbackLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
          ]),
      });

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
    return `**📊 Career Fitment Report Generated**\n\n**Report ID:** ${report.reportId}\n**Candidate:** ${report.profileSnapshot.name}\n\n---\n\n${report.fullReportText}`;
  }
}
