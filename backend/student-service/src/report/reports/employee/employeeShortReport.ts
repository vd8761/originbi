/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-return */
import * as fs from 'fs';
import { COLORS, EmployeeData } from '../../types/types';
import {
  BaseReport,
  FutureOutlookData,
  FutureOutlookOptions,
} from '../BaseReport';
import {
  EMPLOYEE_CONTENT,
} from './employeeConstants';
import {
  getCareerGuidanceByTrait,
  CareerRoleData,
} from '../../helpers/sqlHelper';
import { ACI, ACI_SCORE, DISCLAIMER } from '../BaseConstants';
import { logger } from '../../helpers/logger';

export class EmployeeShortReport extends BaseReport {
  private data: EmployeeData;

  constructor(data: EmployeeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  /**
   * Main Generation Method for Short Report (Single Page)
   * Generates a condensed one-page report for employees
   */
  public async generate(outputPath: string): Promise<void> {
    logger.info('[Employee Short REPORT] Starting PDF Generation...');
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Single page generation
    this.generateShortReportPage();

    this.doc.end();
    await streamFinished;
    logger.info('[Employee Short REPORT] PDF Generation completed.');
  }

  /**
   * Generates the single-page short report
   */
  private generateShortReportPage(): void {
    // Set page properties for single page
    this._currentBackground = 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    
    // Add header with basic info
    this.generateShortHeader();
    
    // Generate employee-specific content
    this.generateEmployeeShortContent();
    
    // Add footer
    this.addShortFooter();
  }

  /**
   * Generates short header section
   */
  private generateShortHeader(): void {
    const fullName = this.data.full_name || 'Employee';
    const department = this.data.group_name || 'N/A';
    
    // Title
    this.h1('Origin BI - Employee Short Discovery Report', {
      fontSize: 18,
      align: 'center',
      color: this.COLOR_DEEP_BLUE,
      gap: 10,
    });
    
    // Employee info
    this.p(`Name: ${fullName} | Department: ${department}`, {
      fontSize: 12,
      align: 'center',
      color: this.COLOR_BLACK,
      gap: 15,
    });
    
    // Add separator line
    this.drawSeparatorLine();
  }

  /**
   * Generates employee-specific short content
   */
  private generateEmployeeShortContent(): void {
    // Top traits summary
    this.generateTopTraitsSummary();
    
    // Key strengths (top 3)
    this.generateKeyStrengths();
    
    // ACI Score
    this.generateACIScore();
    
    // Career advancement suggestions (top 3)
    this.generateCareerAdvancementSuggestions();
    
    // Leadership potential
    this.generateLeadershipPotential();
  }

  /**
   * Generates top traits summary
   */
  private generateTopTraitsSummary(): void {
    this.h2('Your Top Traits', {
      fontSize: 14,
      color: this.COLOR_DEEP_BLUE,
      gap: 8,
    });
    
    const traits = this.getTopTwoTraits(this.data.most_answered_answer_type, this.data);
    const traitText = traits.join(' & ');
    
    this.p(`Primary Traits: ${traitText}`, {
      fontSize: 11,
      color: this.COLOR_BLACK,
      gap: 10,
    });
  }

  /**
   * Generates key strengths section
   */
  private generateKeyStrengths(): void {
    this.h2('Key Strengths', {
      fontSize: 14,
      color: this.COLOR_DEEP_BLUE,
      gap: 8,
    });
    
    // Get top 3 strengths based on trait scores
    const strengths = this.getTopStrengths();
    
    strengths.forEach((strength, index) => {
      this.p(`${index + 1}. ${strength}`, {
        fontSize: 10,
        color: this.COLOR_BLACK,
        gap: 4,
      });
    });
    
    this.ensureSpace(0.05);
  }

  /**
   * Generates ACI score section
   */
  private generateACIScore(): void {
    this.h2('Agile Compatibility Index', {
      fontSize: 14,
      color: this.COLOR_DEEP_BLUE,
      gap: 8,
    });
    
    const aciScore = this.calculateACIScore();
    const aciLevel = this.getACILevel(aciScore);
    
    this.p(`Score: ${aciScore}/100 (${aciLevel})`, {
      fontSize: 11,
      color: this.COLOR_BLACK,
      gap: 10,
    });
  }

  /**
   * Generates career advancement suggestions
   */
  private generateCareerAdvancementSuggestions(): void {
    this.h2('Career Advancement Paths', {
      fontSize: 14,
      color: this.COLOR_DEEP_BLUE,
      gap: 8,
    });
    
    const careers = this.getTopCareerPaths();
    
    careers.forEach((career, index) => {
      this.p(`${index + 1}. ${career}`, {
        fontSize: 10,
        color: this.COLOR_BLACK,
        gap: 4,
      });
    });
    
    this.ensureSpace(0.05);
  }

  /**
   * Generates leadership potential section
   */
  private generateLeadershipPotential(): void {
    this.h2('Leadership Potential', {
      fontSize: 14,
      color: this.COLOR_DEEP_BLUE,
      gap: 8,
    });
    
    const leadership = this.getLeadershipAssessment();
    
    this.p(`Leadership Style: ${leadership.style}`, {
      fontSize: 10,
      color: this.COLOR_BLACK,
      gap: 4,
    });
    
    this.p(`Development Focus: ${leadership.focus}`, {
      fontSize: 10,
      color: this.COLOR_BLACK,
      gap: 4,
    });
  }

  /**
   * Adds short footer
   */
  private addShortFooter(): void {
    this.ensureSpace(0.1);
    this.p('© Origin BI - Employee Short Report Summary', {
      fontSize: 9,
      align: 'center',
      color: this.COLOR_BLACK,
    });
  }

  /**
   * Draws a separator line
   */
  private drawSeparatorLine(): void {
    const y = this.doc.y;
    this.doc.moveTo(50, y)
      .lineTo(this.doc.page.width - 50, y)
      .lineWidth(0.5)
      .stroke(this.COLOR_BLACK);
    this.ensureSpace(0.03);
  }

  // Helper methods for data extraction
  
  protected getTopTwoTraits(mostAnswered: { ANSWER_TYPE: string; COUNT: number }[], scores: EmployeeData): [string, string] {
    // Implementation to get top two traits
    // This would be similar to the existing logic in employeeReport.ts
    return ['Strategic', 'Innovative']; // Placeholder
  }

  private getTopStrengths(): string[] {
    // Implementation to get top 3 strengths for employees
    return ['Problem Solving', 'Decision Making', 'Team Leadership']; // Placeholder
  }

  private calculateACIScore(): number {
    // Implementation to calculate ACI score
    return 82; // Placeholder
  }

  private getACILevel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Developing';
  }

  private getTopCareerPaths(): string[] {
    // Implementation to get top 3 career advancement paths
    return ['Senior Management', 'Team Lead', 'Specialist Track']; // Placeholder
  }

  private getLeadershipAssessment(): { style: string; focus: string } {
    // Implementation to assess leadership potential
    return {
      style: 'Transformational Leader',
      focus: 'Strategic Planning & Team Development'
    }; // Placeholder
  }
}
