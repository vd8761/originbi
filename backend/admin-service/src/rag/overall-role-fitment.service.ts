import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PdfService } from '../common/pdf/pdf.service';
import { OverallReportData, CandidateProfile, SkillCategory } from '../common/pdf/overall-fitment-report';
import { CustomReportService } from './custom-report.service';

export interface GroupReportInput {
  groupId?: number;
  groupCode?: string;
  programId?: number;
  corporateId?: number;
  title?: string;
  // ── Advanced filters ──
  dateFrom?: string;       // ISO date string: "2024-01-15"
  dateTo?: string;         // ISO date string: "2024-01-31"
  collegeName?: string;    // Group name (college/batch) - fuzzy match
  affiliateName?: string;  // Affiliate who referred the students
  affiliateId?: number;
  schoolLevel?: string;    // 'SSLC' | 'HSC'
  schoolStream?: string;   // 'SCIENCE' | 'COMMERCE' | 'HUMANITIES'
  departmentName?: string; // Department/degree name - fuzzy match
  gender?: string;         // 'MALE' | 'FEMALE'
  registrationSource?: string; // 'SELF' | 'ADMIN' | 'CORPORATE' | 'RESELLER'
  limit?: number;          // Max students to include (default 50)
}

@Injectable()
export class OverallRoleFitmentService {
  private readonly logger = new Logger(OverallRoleFitmentService.name);

  // ── In-memory report cache (avoids double computation for chat → PDF) ──
  private reportCache = new Map<string, { data: OverallReportData; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 min

  constructor(
    private dataSource: DataSource,
    private pdfService: PdfService,
    private customReportService: CustomReportService
  ) { }

  private getCacheKey(input: GroupReportInput): string {
    const parts = [
      input.groupId || 'all',
      input.corporateId || 'all',
      input.title || '',
      input.dateFrom || '',
      input.dateTo || '',
      input.collegeName || '',
      input.affiliateName || input.affiliateId || '',
      input.schoolLevel || '',
      input.schoolStream || '',
      input.departmentName || '',
      input.gender || '',
    ];
    return parts.join('_');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async generateReport(
    input: GroupReportInput,
  ): Promise<OverallReportData> {
    // Check cache first
    const cacheKey = this.getCacheKey(input);
    const cached = this.reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log('✅ Using cached report data (avoids duplicate LLM calls)');
      return cached.data;
    }

    this.logger.log(`📊 Generating Overall Role Fitment Report`);

    // 1. Fetch unique students in the group
    const students = await this.fetchStudentsInGroup(input);

    if (!students.length) {
      throw new Error('No students found for the specified criteria');
    }

    this.logger.log(`Found ${students.length} students. Generating detailed profiles...`);

    // 2. Generate detailed profile for each student
    const candidates: CandidateProfile[] = [];

    for (const student of students) {
      try {
        // Use CustomReportService to get the full analysis for this user
        // We assume student.user_id exists and is valid
        if (!student.user_id) {
          this.logger.warn(`Student ${student.full_name} has no user_id, skipping.`);
          continue;
        }

        const individualReport = await this.customReportService.generateCareerFitmentData(student.user_id);

        // Map to Overall Report Candidate Profile
        const profile = this.mapToCandidateProfile(individualReport);
        candidates.push(profile);

      } catch (error) {
        this.logger.error(`Failed to generate profile for student ${student.full_name} (${student.id}): ${error.message}`);
        // Continue with other students (partial success)
      }
    }

    // Check if we have any candidates
    if (!candidates.length) {
      throw new Error('No valid candidate profiles could be generated. Please ensure students have completed assessments.');
    }

    // 3. Construct Final Report Data
    const reportData: OverallReportData = {
      reportId: this.generateReportId(input),
      title: input.title || 'Career Fitment & Future Role Readiness Report',
      subTitle: 'Infiniti Software Solutions', // Could be dynamic based on Corporate/Group
      generatedAt: new Date(),
      candidates: candidates,
    };

    // Cache the report to avoid re-computation on PDF download
    this.reportCache.set(cacheKey, { data: reportData, timestamp: Date.now() });

    return reportData;
  }

  async generatePdf(input: GroupReportInput): Promise<Buffer> {
    const reportData = await this.generateReport(input);
    return this.pdfService.generateOverallReport(reportData);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async fetchStudentsInGroup(input: GroupReportInput): Promise<any[]> {
    const joins: string[] = [];
    const conditions: string[] = ['r.is_deleted = false'];
    const params: any[] = [];

    // ── Basic filters ──
    if (input.groupId) {
      params.push(input.groupId);
      conditions.push(`r.group_id = $${params.length}`);
    }
    if (input.corporateId) {
      params.push(input.corporateId);
      conditions.push(`r.corporate_account_id = $${params.length}`);
    }
    if (input.programId) {
      params.push(input.programId);
      conditions.push(`r.program_id = $${params.length}`);
    }

    // ── Date-of-completion filter (needs assessment_attempts join) ──
    const needsAttemptJoin = !!(input.dateFrom || input.dateTo);
    if (needsAttemptJoin) {
      joins.push(`JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'`);
      if (input.dateFrom) {
        params.push(input.dateFrom);
        conditions.push(`aa.completed_at >= $${params.length}::date`);
      }
      if (input.dateTo) {
        params.push(input.dateTo);
        conditions.push(`aa.completed_at < ($${params.length}::date + interval '1 day')`);
      }
    }

    // ── College / Group name filter (fuzzy match on groups.name) ──
    if (input.collegeName) {
      joins.push(`JOIN groups g ON r.group_id = g.id`);
      params.push(`%${input.collegeName.toLowerCase()}%`);
      conditions.push(`LOWER(g.name) LIKE $${params.length}`);
    }

    // ── Affiliate referral filter ──
    if (input.affiliateId) {
      joins.push(`JOIN affiliate_referral_transactions art ON art.referred_user_id = r.user_id`);
      params.push(input.affiliateId);
      conditions.push(`art.affiliate_account_id = $${params.length}`);
    } else if (input.affiliateName) {
      joins.push(`JOIN affiliate_referral_transactions art ON art.referred_user_id = r.user_id`);
      joins.push(`JOIN affiliate_accounts aac ON art.affiliate_account_id = aac.id`);
      params.push(`%${input.affiliateName.toLowerCase()}%`);
      conditions.push(`LOWER(aac.full_name) LIKE $${params.length}`);
    }

    // ── School level (SSLC / HSC) ──
    if (input.schoolLevel) {
      params.push(input.schoolLevel.toUpperCase());
      conditions.push(`r.school_level = $${params.length}`);
    }

    // ── School stream (SCIENCE / COMMERCE / HUMANITIES) — only for HSC ──
    if (input.schoolStream) {
      params.push(input.schoolStream.toUpperCase());
      conditions.push(`r.school_stream = $${params.length}`);
    }

    // ── Department / Degree name filter ──
    if (input.departmentName) {
      joins.push(`JOIN department_degrees dd ON r.department_degree_id = dd.id`);
      joins.push(`JOIN departments dept ON dd.department_id = dept.id`);
      params.push(`%${input.departmentName.toLowerCase()}%`);
      conditions.push(`LOWER(dept.name) LIKE $${params.length}`);
    }

    // ── Gender filter ──
    if (input.gender) {
      params.push(input.gender.toUpperCase());
      conditions.push(`r.gender = $${params.length}`);
    }

    // ── Registration source ──
    if (input.registrationSource) {
      params.push(input.registrationSource.toUpperCase());
      conditions.push(`r.registration_source = $${params.length}`);
    }

    const maxStudents = input.limit || 50;
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const joinClause = joins.join('\n        ');

    const query = `
        SELECT DISTINCT ON (r.user_id)
            r.id,
            r.user_id,
            r.full_name,
            r.group_id,
            r.school_level,
            r.school_stream,
            r.department_degree_id
        FROM registrations r
        ${joinClause}
        ${whereClause}
        ORDER BY r.user_id, r.created_at DESC
        LIMIT ${maxStudents}
    `;

    this.logger.log(`🔍 Filtered student query with ${conditions.length} conditions, ${params.length} params`);
    return await this.dataSource.query(query, params);
  }

  private mapToCandidateProfile(report: any): CandidateProfile {
    // Helper to map 0-5 score to insight (unused in UI but good for data)

    const { profile, futureRoleReadiness, roleFitmentScore, skillCategories, behavioralSummary, overallSkillInsight, industrySuitability, transitionRequirements, executiveInsight } = report;

    // Determine Status Label
    let readinessStatus = 'Low Readiness (Red) - Significant gaps exist';
    if (futureRoleReadiness.readinessScore >= 80) readinessStatus = 'High Readiness (Green) - Ready for immediate transition';
    else if (futureRoleReadiness.readinessScore >= 60) readinessStatus = 'Moderate Readiness (Amber) - Transitionable with support';

    // Map Dimensions
    const readinessDimensions = futureRoleReadiness.dimensions.map((d: any) => ({
      dimension: d.name,
      alignment: d.alignment
    }));

    // Map Fitment Components
    const fitmentComponents = roleFitmentScore.components.map((c: any) => ({
      component: c.name,
      weight: `${c.weight}%`,
      score: c.score
    }));

    // Map Industry
    const suitability = industrySuitability.map((i: any) => ({
      industry: i.industry,
      suitability: i.suitability,
      description: i.idealFor
    }));

    // Map Skills (Ensure correct interface)
    const mappedSkills: SkillCategory[] = skillCategories.map((cat: any) => ({
      category: cat.category,
      skills: cat.skills.map((s: any) => ({
        name: s.name,
        score: s.score,
        insight: s.insight || ''
      }))
    }));

    return {
      name: profile.fullName,
      currentRole: profile.currentRole,
      totalExperience: `${profile.yearsOfExperience} Years`,
      relevantExperience: `${profile.relevantExperience || profile.yearsOfExperience + ' Years'}`,
      currentIndustry: profile.currentIndustry,
      expectedFutureRole: profile.expectedFutureRole,
      futureRoleReadinessScore: futureRoleReadiness.readinessScore,
      readinessStatus,
      behavioralSummary,
      skillCategories: mappedSkills,
      overallSkillInsight: {
        strengths: overallSkillInsight.highStrengthAreas,
        developable: overallSkillInsight.developableAreas
      },
      readinessDimensions,
      adjacencyType: futureRoleReadiness.adjacencyType,
      roleFitmentScore: roleFitmentScore.totalScore,
      fitmentComponents,
      fitmentVerdict: roleFitmentScore.verdict,
      industrySuitability: suitability,
      transitionRequirements,
      executiveInsight
    };
  }

  private generateReportId(input: GroupReportInput): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const groupCode = input.groupCode || 'G' + (input.groupId || '1');
    return `OBI-${groupCode}-${month}/${year}-OVERALL`;
  }

  // Format for chat display
  formatForChat(report: OverallReportData, input?: GroupReportInput): string {
    let summary = `**📊 Overall Career Fitment Report**\n\n`;
    summary += `**Report ID:** ${report.reportId}\n`;
    summary += `**Candidates Processed:** ${report.candidates.length}\n`;

    // Show active filters
    if (input) {
      const filters: string[] = [];
      if (input.dateFrom || input.dateTo) {
        const from = input.dateFrom || 'start';
        const to = input.dateTo || 'now';
        filters.push(`📅 Exam completed: ${from} to ${to}`);
      }
      if (input.collegeName) filters.push(`🏫 College: ${input.collegeName}`);
      if (input.affiliateName) filters.push(`🤝 Affiliate: ${input.affiliateName}`);
      if (input.schoolLevel) filters.push(`🎓 Level: ${input.schoolLevel}`);
      if (input.schoolStream) filters.push(`📚 Stream: ${input.schoolStream}`);
      if (input.departmentName) filters.push(`📋 Department: ${input.departmentName}`);
      if (input.gender) filters.push(`👤 Gender: ${input.gender}`);
      if (filters.length > 0) {
        summary += `**Filters Applied:** ${filters.join(' | ')}\n`;
      }
    }

    summary += `\n**Executive Summary:**\n`;

    report.candidates.slice(0, 5).forEach((c, i) => {
      summary += `${i + 1}. **${c.name}**: ${c.expectedFutureRole} (Score: ${c.futureRoleReadinessScore}%)\n`;
    });

    if (report.candidates.length > 5) {
      summary += `...and ${report.candidates.length - 5} more.\n`;
    }

    summary += `\n**Note:** Detailed analysis including behavioral summaries, skill gaps, and radar charts is available in the PDF report only.`;
    return summary;
  }
}
