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
}

@Injectable()
export class OverallRoleFitmentService {
  private readonly logger = new Logger(OverallRoleFitmentService.name);

  constructor(
    private dataSource: DataSource,
    private pdfService: PdfService,
    private customReportService: CustomReportService
  ) { }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async generateReport(
    input: GroupReportInput,
  ): Promise<OverallReportData> {
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
    let whereClause = 'WHERE r.is_deleted = false';
    const params: any[] = [];

    if (input.groupId) {
      whereClause += ` AND r.group_id = ${input.groupId}`;
    }
    if (input.corporateId) {
      whereClause += ` AND r.corporate_account_id = ${input.corporateId}`;
    }

    // Select distinct users to avoid duplicates
    const query = `
        SELECT DISTINCT ON (r.user_id)
            r.id,
            r.user_id,
            r.full_name,
            r.group_id
        FROM registrations r
        ${whereClause}
        ORDER BY r.user_id, r.created_at DESC
    `;

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
  formatForChat(report: OverallReportData): string {
    let summary = `**📊 Overall Career Fitment Report**\n\n`;
    summary += `**Report ID:** ${report.reportId}\n`;
    summary += `**Candidates Processed:** ${report.candidates.length}\n\n`;

    summary += `**Executive Summary:**\n`;

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
