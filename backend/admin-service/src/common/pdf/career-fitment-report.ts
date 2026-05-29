import * as fs from 'fs';
import { BaseReport } from './base-report';
import {
  CareerFitmentReportData,
  SkillCategory,
} from '../../rag/custom-report.service';

export class CareerFitmentReport extends BaseReport {
  private data: CareerFitmentReportData;

  constructor(data: CareerFitmentReportData) {
    super();
    this.data = data;
  }

  public generate(): Buffer {
    // Page 1: Cover Page
    this.generateCoverPage();

    // Page 2+: Profile Snapshot, Behavioral Summary, Skill Assessment Category rendering, Radar Chart, and Overall Insights (dynamic)
    this._currentBackground = 'Watermark_Background.jpg';
    this._useStdMargins = true;
    this.doc.addPage();
    this.generatePage2();

    // Page 4: Future Role Readiness Mapping Table & Scores, Fitment Score & Verdict
    this.doc.addPage();
    this.generatePage5();

    // Page 5: Industry Suitability, Transition Requirements, Executive Insight
    this.doc.addPage();
    this.generatePage6();

    // Add footers to all content pages
    this.addFooters();

    this.doc.end();

    return Buffer.from([]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVER PAGE (PAGE 1)
  // ═══════════════════════════════════════════════════════════════════════════
  private generateCoverPage(): void {
    this._useStdMargins = false;
    this._currentBackground = null;

    // Background Image - Use Cover_Background.jpg
    const bgPath = this.getAssetPath('Cover_Background.jpg');
    if (fs.existsSync(bgPath)) {
      this.doc.image(bgPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    } else {
      // Fallback gradient background
      this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#F0F8FF');
    }

    // --- Vertical Reference Number ---
    if (this.data.reportId && !this.data.reportId.startsWith('OBI-CFR') && !this.data.reportId.startsWith('OBI-CHAT')) {
      const refNoX = this.PAGE_WIDTH - 47;
      const refNoY = 150;

      this.doc.save(); // Save state before rotation

      this.doc.translate(refNoX, refNoY);
      this.doc.rotate(-90, { origin: [0, 0] });

      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8)
        .fillColor(this.COLOR_BLACK)
        .opacity(0.4)
        .text(this.data.reportId, 0, 0);

      this.doc.restore(); // Restore state (undo rotation)
      this.doc.opacity(1);
    }

    // --- Title Wrapping ---
    const titleWidth = this.PAGE_WIDTH - 100;
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(38)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Career Fitment &', 35, 12, { width: titleWidth, align: 'left' })
      .text('Future Role Readiness', 35, 12 + 44, { width: titleWidth, align: 'left' })
      .text('Report', 35, 12 + 88, { width: titleWidth, align: 'left' });

    // --- Footer Elements ---
    const footerY = this.PAGE_HEIGHT - 90;

    // Draw "Self Guidance" / "Future Role Readiness" Label
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(20)
      .fillColor(this.COLOR_BLACK)
      .text('Future Role Readiness', 35, footerY);

    // Draw Date
    const dateString = this.data.generatedDate.toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(16)
      .fillColor(this.COLOR_BLACK)
      .text(dateString, 35, footerY + 25);

    // --- Name Alignment with Smart Wrapping ---
    this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

    const nameWidthLimit = 300;
    const rawName = this.data.profile.fullName
      .split(/Current Role|Job Description|Experience/i)[0]
      .trim();

    const nameText = this.getSmartSplitName(rawName, nameWidthLimit);

    const rightMarginLimit = 35;
    const nameX = this.PAGE_WIDTH - nameWidthLimit - rightMarginLimit - 20;
    const nameBaseY = footerY + 20;

    const nameOptions = {
      width: nameWidthLimit + 20,
      align: 'right' as const,
    };

    const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
    const singleLineHeight = this.doc.heightOfString('M', nameOptions);

    const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);

    this.doc
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(nameText, nameX, adjustedNameY, nameOptions);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: Profile Snapshot, Behavioral Summary, Skill Assessment Part 1
  // ═══════════════════════════════════════════════════════════════════════════
  private generatePage2(): void {
    // Royal Purple Title Header at the top of Page 2
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(22)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Career Fitment & Future Role Readiness', this.MARGIN_STD, this.MARGIN_STD - 15)
      .text('Report', this.MARGIN_STD, this.MARGIN_STD + 13);

    // 1. Profile Snapshot - Shifted down to accommodate the header title
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(15)
      .fillColor(this.COLOR_BLACK)
      .text('Profile Snapshot', this.MARGIN_STD, this.MARGIN_STD + 55);

    let currentY = this.MARGIN_STD + 77;
    const profile = this.data.profile as any;
    const isStudent =
      profile.currentRole?.toUpperCase() === 'STUDENT' ||
      profile.currentRole?.toLowerCase().includes('student') ||
      profile.currentRole?.toLowerCase().includes('not specified') ||
      profile.yearsOfExperience === 0;

    const items: { label: string; value: string }[] = [];
    
    if (isStudent) {
      // Dynamic Student Snapshot Fields
      items.push({ label: 'Name', value: profile.fullName });
      items.push({ label: 'Status', value: 'Student' });
      
      let academicBg = profile.currentIndustry || 'Education / Academics';
      if (academicBg.includes('Not Specified')) academicBg = 'Education / Academics';
      items.push({ label: 'Academic Background', value: academicBg });
      
      let program = 'School Students';
      if (profile.currentRole && profile.currentRole.includes('—')) {
        program = profile.currentRole.split('—')[1].trim();
      } else if (profile.currentRole && profile.currentRole.includes('-')) {
        program = profile.currentRole.split('-')[1].trim();
      } else if (profile.programName) {
        program = profile.programName;
      }
      items.push({ label: 'Program', value: program });
      
      const behavioralProfile = this.data.discProfile?.dominantTrait || 'Analytical and Detail-Oriented';
      items.push({ label: 'Behavioral Profile', value: behavioralProfile });
      
      const scoreVal = profile.totalScore || this.data.agileProfile?.rawScore || 117;
      items.push({ label: 'Assessment Score', value: String(scoreVal) });
    } else {
      // Corporate Snapshot Fields
      items.push({ label: 'Name', value: profile.fullName });
      if (profile.currentRole && !profile.currentRole.includes('Not Specified')) {
        items.push({ label: 'Current Role', value: profile.currentRole });
      }
      if (profile.yearsOfExperience !== undefined && profile.yearsOfExperience !== null && profile.yearsOfExperience > 0) {
        items.push({ label: 'Total Experience', value: `${profile.yearsOfExperience} Years` });
      }
      if (profile.relevantExperience && !profile.relevantExperience.includes('Not Specified') && profile.relevantExperience !== 'N/A') {
        items.push({ label: 'Relevant Experience', value: profile.relevantExperience });
      }
      if (profile.currentIndustry && !profile.currentIndustry.includes('Not Specified')) {
        items.push({ label: 'Current Industry', value: profile.currentIndustry });
      }
      if (profile.expectedFutureRole && !profile.expectedFutureRole.includes('Not Specified')) {
        items.push({ label: 'Expected Future Role', value: profile.expectedFutureRole });
      }
    }

    const tableRows = items.map(item => [item.label, item.value]);
    this.table(['Field', 'Details'], tableRows, {
      colWidths: [150, 350],
      fontSize: 9.5,
      headerFontSize: 10,
      cellPadding: 5,
      headerColor: this.COLOR_DEEP_BLUE,
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      y: currentY
    });
    currentY = this.doc.y + 15;

    currentY += 15;

    // 2. Behavioral Summary
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text('1. Behavioral Alignment Summary', this.MARGIN_STD, currentY);

    currentY += 20;

    let summaryText = this.data.behavioralSummary || '';
    
    // Clean up duplicate headings and part markers inside the behavioral summary summaryText
    summaryText = summaryText.replace(/\*?\*?\d*\.?\s*Behavioral\s+Alignment\s+Summary\*?\*?/gi, '');
    summaryText = summaryText.replace(/\*?\*?Part\s*\d+[:*\s]*?\*?\*?/gi, '');
    summaryText = summaryText.replace(/^\s*[:*_\-\s]*\n+/gm, ''); // Remove empty lines containing junk chars
    summaryText = summaryText.replace(/^\s*\n+/, ''); // strip leading blank lines
    summaryText = summaryText.replace(/\n{3,}/g, '\n\n'); // collapse multiple empty lines
    
    const lines = summaryText.split('\n');
    let inList = false;
    let listItems: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const bulletMatch = trimmed.match(/^[-*•]\s*(.+)/);
      if (bulletMatch) {
        listItems.push(bulletMatch[1]);
        inList = true;
      } else {
        if (inList && listItems.length > 0) {
          this.list(listItems, { indent: 15, fontSize: 9.5, y: currentY, gap: 8 });
          currentY = this.doc.y + 5;
          listItems = [];
          inList = false;
        }

        this.doc
          .font(this.FONT_REGULAR)
          .fontSize(9.5)
          .fillColor(this.COLOR_BLACK)
          .text(trimmed, this.MARGIN_STD, currentY, {
            width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
            align: 'justify',
          });
        currentY = this.doc.y + 10;
      }
    });

    if (inList && listItems.length > 0) {
      this.list(listItems, { indent: 15, fontSize: 9.5, y: currentY, gap: 8 });
      currentY = this.doc.y + 10;
    }

    currentY = currentY + 10;

    // 3. Skill Assessment Header
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text('2. Skill-wise Capability Assessment (Score out of 5)', this.MARGIN_STD, currentY);

    currentY += 25;

    // Unified dynamic skill categories loop
    const categories = this.data.skillCategories;
    
    for (let idx = 0; idx < categories.length; idx++) {
      const cat = categories[idx];
      const skillsCount = cat.skills.length;
      // Estimate height needed: header (15) + table header (20) + rows (skillsCount * 18) + gap (20)
      const heightNeeded = 15 + 20 + (skillsCount * 18) + 20;

      // Check if we need a page break (current page is Page 2, Page 3, etc.)
      if (currentY + heightNeeded > this.PAGE_HEIGHT - this.MARGIN_STD) {
        this.doc.addPage();
        currentY = this.MARGIN_STD + 15;
      }

      // Draw Category Header
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(11)
        .fillColor(this.COLOR_BLACK)
        .text(cat.category, this.MARGIN_STD, currentY);

      // Draw Category Table
      const rows = cat.skills.map(s => [
        s.name,
        s.score.toFixed(1),
        s.insight || '-'
      ]);

      this.table(['Skill', 'Score', 'Insight'], rows, {
        colWidths: [140, 55, 305],
        fontSize: 9,
        headerFontSize: 9,
        cellPadding: 5,
        headerColor: this.COLOR_DEEP_BLUE,
        headerTextColor: '#FFFFFF',
        borderColor: '#CCCCCC',
        y: currentY + 15
      });

      currentY = this.doc.y + 15;
    }

    // Now call generatePage4(currentY) on the same page (or dynamic new page)
    // Estimate height needed for Capability Snapshot & Overall Skill Coverage Insight
    const snapshotHeightNeeded = 360;
    if (currentY + snapshotHeightNeeded > this.PAGE_HEIGHT - this.MARGIN_STD) {
      this.doc.addPage();
      currentY = this.MARGIN_STD + 15;
    }

    this.generatePage4(currentY);
  }

  private generatePage4(currentY: number): void {
    // Visual Snapshot Header
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE) // Royal purple title
      .text('Capability Snapshot (Visual)', this.MARGIN_STD, currentY);

    // Draw Radar Chart - Set centerY to currentY + 130 (Huge radius 85)
    const chartY = currentY + 130;
    this.drawRadarChart(this.PAGE_WIDTH / 2, chartY, 85);

    // Radar Chart Caption - Positioned safely below radar chart bottom label
    const captionY = chartY + 145; // Increased gap to completely resolve overlap
    const captionText = "The visual snapshot above illustrates the candidate's balance of competencies. A wider span indicates higher proficiency across dimensions. Use this to identify if the profile is 'Operational' (skewed towards Ops/Talent) or 'Strategic' (skewed towards Strategy/Communication).";
    
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor('#555555')
      .text(
        captionText,
        this.MARGIN_STD,
        captionY,
        {
          width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
          align: 'center'
        }
      );

    const captionTextHeight = this.doc.heightOfString(
      captionText,
      { width: this.PAGE_WIDTH - 2 * this.MARGIN_STD, align: 'center' }
    );
    const postCaptionY = captionY + captionTextHeight + 25;

    // Check if Overall Skill Coverage Insight fits on the current page.
    // Estimated height needed for the insight is 110 points.
    let insightY = postCaptionY;
    if (insightY + 110 > this.PAGE_HEIGHT - this.MARGIN_STD) {
      this.doc.addPage();
      insightY = this.MARGIN_STD + 15;
    }

    // 3. Overall Skill Coverage Insight
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Royal purple title
      .text('3. Overall Skill Coverage Insight', this.MARGIN_STD, insightY);

    const strengthY = this.doc.y + 12;
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text('• ', this.MARGIN_STD, strengthY, { continued: true })
      .font(this.FONT_SORA_BOLD)
      .text('High Strength Areas: ', { continued: true })
      .font(this.FONT_REGULAR)
      .text(this.data.overallSkillInsight.highStrengthAreas.join(', '));

    const developableY = this.doc.y + 10;
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text('• ', this.MARGIN_STD, developableY, { continued: true })
      .font(this.FONT_SORA_BOLD)
      .text('Moderate / Developable Areas: ', { continued: true })
      .font(this.FONT_REGULAR)
      .text(this.data.overallSkillInsight.developableAreas.join(', '));

    // Dynamic concluding sentence
    const concludingY = this.doc.y + 12;
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text('These are scaling refinements, not capability blockers.', this.MARGIN_STD, concludingY);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 5: Future Role Readiness Mapping Table & Scores, Fitment Score & Verdict
  // ═══════════════════════════════════════════════════════════════════════════
  private generatePage5(): void {
    let currentY = this.MARGIN_STD + 15;

    // 4. Future Role Readiness Mapping Title
    const profile = this.data.profile;
    const hasCurrent = profile.currentRole && !profile.currentRole.includes('Not Specified');
    const hasExpected = profile.expectedFutureRole && !profile.expectedFutureRole.includes('Not Specified');
    const readinessTitle = (hasCurrent && hasExpected)
      ? `4. Future Role Readiness Mapping (${profile.currentRole} -> ${profile.expectedFutureRole})`
      : `4. Future Role Readiness Mapping`;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Royal purple title
      .text(readinessTitle, this.MARGIN_STD, currentY);

    currentY = this.doc.y + 15;

    // Dimensions Table
    const readiness = this.data.futureRoleReadiness;
    const readinessRows = readiness.dimensions.map((d) => [
      d.name,
      d.alignment,
    ]);

    this.table(['Dimension', 'Alignment'], readinessRows, {
      colWidths: [220, 280],
      headerColor: this.COLOR_DEEP_BLUE,
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      fontSize: 9.5,
      cellPadding: 5,
      y: currentY
    });

    currentY = this.doc.y + 10;

    // Scores (Gold/Amber Highlighted Readiness Score)
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Future Role Readiness Score: ', this.MARGIN_STD, currentY, { continued: true })
      .fillColor('#E67E22') // Gold/Amber highlight
      .text(`${readiness.readinessScore}%`);

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10.5)
      .fillColor(this.COLOR_BLACK)
      .text(`Adjacency Type: ${readiness.adjacencyType}`, this.MARGIN_STD, this.doc.y + 4);

    currentY = this.doc.y + 15;

    // Interpretation Table (Green, Amber, Red backgrounds)
    const readinessRanges = [
      ['80% - 100%', 'High Readiness (Green) - Ready for immediate transition'],
      ['60% - 79%', 'Moderate Readiness (Amber) - Transitionable with support'],
      ['0% - 59%', 'Low Readiness (Red) - Significant gaps exist']
    ];
    this.table(['Range', 'Interpretation'], readinessRanges, {
      colWidths: [120, 380],
      headerColor: this.COLOR_DEEP_BLUE,
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      fontSize: 8.5,
      headerFontSize: 8.5,
      cellPadding: 4,
      y: currentY,
      rowColors: ['#E2F7E5', '#FFF9E6', '#FCE8E6'] // Row backgrounds
    });

    currentY = this.doc.y + 20;

    // Check if Section 5 fits on the current page, else add a page
    if (currentY + 230 > this.PAGE_HEIGHT - this.MARGIN_STD) {
      this.doc.addPage();
      currentY = this.MARGIN_STD + 15;
    }

    // 5. Role Fitment Score Title
    const fitmentTitle = `5. Role Fitment Score - ${this.data.profile.expectedFutureRole} (Out of 100)`;
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text(fitmentTitle, this.MARGIN_STD, currentY);

    currentY += 20;

    // Fitment Components Table
    const fitment = this.data.roleFitmentScore;
    const fitmentRows = fitment.components.map((fc) => [
      fc.name,
      `${fc.weight}%`,
      fc.score.toString(),
    ]);

    this.table(['Component', 'Weight', 'Score'], fitmentRows, {
      colWidths: [220, 100, 180],
      headerColor: this.COLOR_DEEP_BLUE,
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      fontSize: 9.5,
      cellPadding: 5,
      y: currentY
    });

    currentY = this.doc.y + 10;

    // Fitment Score (Green Highlighted Score)
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Final Role Fitment Score: ', this.MARGIN_STD, currentY, { continued: true })
      .fillColor('#2ECC71') // Green highlight
      .text(`${fitment.totalScore}%`);

    currentY = this.doc.y + 15;

    // Fitment Interpretation Table
    const fitmentRanges = [
      ['80% - 100%', 'Strong Fit (Green) - Highly aligned with role Reqs'],
      ['60% - 79%', 'Moderate Fit (Amber) - Good potential with gaps'],
      ['0% - 59%', 'Low Fit (Red) - Significant misalignment']
    ];
    this.table(['Range', 'Interpretation'], fitmentRanges, {
      colWidths: [120, 380],
      headerColor: this.COLOR_DEEP_BLUE,
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      fontSize: 8.5,
      headerFontSize: 8.5,
      cellPadding: 4,
      y: currentY,
      rowColors: ['#E2F7E5', '#FFF9E6', '#FCE8E6'] // Row backgrounds
    });

    currentY = this.doc.y + 15;

    // Check if Verdict fits on the current page
    if (currentY + 30 > this.PAGE_HEIGHT - this.MARGIN_STD) {
      this.doc.addPage();
      currentY = this.MARGIN_STD + 15;
    }

    // Verdict Paragraph (Italicized)
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text('Verdict: ', this.MARGIN_STD, currentY, { continued: true })
      .font('Helvetica-Oblique') // Italic verdict
      .fontSize(9.5)
      .text(fitment.verdict);
  }

  private generatePage6(): void {
    let currentY = this.MARGIN_STD + 15;

    // 6. Industry Specific Suitability
    const industryTitle = `6. Industry-Specific ${this.data.profile.expectedFutureRole} Suitability`;
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text(industryTitle, this.MARGIN_STD, currentY);

    currentY += 25;

    // Text block style for industry suitability
    this.data.industrySuitability.forEach((ind) => {
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(11)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(ind.industry, this.MARGIN_STD, currentY);
      
      currentY += 15;
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(10)
        .fillColor(this.COLOR_BLACK)
        .text(`Suitability: ${ind.suitability}`, this.MARGIN_STD, currentY);
      
      currentY += 14;
      const detailLabel = ind.suitability === 'High' ? 'Ideal for' : 'Requires stronger';
      this.doc
        .text(`${detailLabel}: ${ind.idealFor}`, this.MARGIN_STD, currentY);
      
      currentY += 20;
    });

    currentY += 10;

    // 7. Key Transition Requirements
    const transitionTitle = `7. Key Transition Requirements (Critical for ${this.data.profile.expectedFutureRole} Readiness)`;
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text(transitionTitle, this.MARGIN_STD, currentY);

    currentY += 20;

    const profile = this.data.profile;
    const isStudent =
      profile.currentRole?.toUpperCase() === 'STUDENT' ||
      profile.currentRole?.toLowerCase().includes('student') ||
      profile.currentRole?.toLowerCase().includes('not specified') ||
      profile.yearsOfExperience === 0;

    const transitionPrefix = isStudent
      ? 'The following transition steps and adjustments are recommended:'
      : `To move from ${profile.currentRole} to ${profile.expectedFutureRole}, the following shifts are required:`;

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text(transitionPrefix, this.MARGIN_STD, currentY);

    this.list(this.data.transitionRequirements, { indent: 15, fontSize: 9.5, y: this.doc.y + 8 });

    currentY = this.doc.y + 20;

    // 8. ORIGIN BI Executive Insight
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE) // Color header royal purple
      .text('8. ORIGIN BI Executive Insight (Closure)', this.MARGIN_STD, currentY);

    currentY += 20;
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor(this.COLOR_BLACK)
      .text(this.data.executiveInsight, this.MARGIN_STD, currentY, {
        width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
        align: 'justify'
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTERS
  // ═══════════════════════════════════════════════════════════════════════════
  private addFooters(): void {
    const range = this.doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 1; i < totalPages; i++) {
      this.doc.switchToPage(range.start + i);
      this.doc.save();

      this.doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

      const footerMargin = 15 * this.MM;
      const footerY = this.PAGE_HEIGHT - footerMargin;

      // Line
      this.doc
        .lineWidth(0.5)
        .strokeColor('#CCCCCC')
        .moveTo(this.MARGIN_STD, footerY)
        .lineTo(this.PAGE_WIDTH - this.MARGIN_STD, footerY)
        .stroke();

      const textY = footerY + 2 * this.MM;

      // Left Text
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8)
        .fillColor(this.COLOR_BLACK)
        .text('Origin BI', this.MARGIN_STD, textY, { lineBreak: false });

      // Only print report ID if it doesn't start with OBI-CFR or OBI-CHAT
      if (this.data.reportId && !this.data.reportId.startsWith('OBI-CFR') && !this.data.reportId.startsWith('OBI-CHAT')) {
        const titleWidth = this.doc.widthOfString('Origin BI');
        this.doc
          .fillColor('#A9A9A9')
          .text(
            ` #${this.data.reportId}`,
            this.MARGIN_STD + titleWidth + 2,
            textY,
            { lineBreak: false },
          );
      }

      // Right Text - Page Number
      this.doc
        .fillColor(this.COLOR_BLACK)
        .text(`Page ${i + 1} of ${totalPages}`, this.MARGIN_STD, textY, {
          width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
          align: 'right',
        });

      this.doc.restore();
    }
  }

  private drawRadarChart(
    centerX: number,
    centerY: number,
    radius: number,
  ): void {
    this.doc.save();

    const categories = ['Communication', 'People Ops', 'Talent', 'Strategy'];
    
    // Sum/average scores for each mapped category, falling back to index matching if category names differ
    const scores = categories.map((cat, idx) => {
      let dbCat = this.data.skillCategories.find((c) => {
        const name = c.category.toLowerCase();
        if (cat === 'Communication') return name.includes('communication') || name.includes('foundation');
        if (cat === 'People Ops') return name.includes('people') || name.includes('operations') || name.includes('interpersonal');
        if (cat === 'Talent') return name.includes('talent') || name.includes('culture') || name.includes('core');
        if (cat === 'Strategy') return name.includes('business') || name.includes('strategy') || name.includes('leadership');
        return false;
      });

      // Fallback: Use index to match standard categories if name match failed
      if (!dbCat) {
        dbCat = this.data.skillCategories[idx];
      }

      if (!dbCat || !dbCat.skills || dbCat.skills.length === 0) return 0;
      const sum = dbCat.skills.reduce((a, b) => a + b.score, 0);
      return sum / dbCat.skills.length;
    });

    const numPoints = categories.length;
    const maxScore = 5;

    // Draw Web Grid
    this.doc.lineWidth(0.5).strokeColor('#E0E0E0');

    // Concentric circles
    for (let level = 1; level <= maxScore; level++) {
      const r = (level / maxScore) * radius;
      this.doc.circle(centerX, centerY, r).stroke();
    }

    // Axis Lines & Labels
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      this.doc.moveTo(centerX, centerY).lineTo(x, y).stroke();

      // Label offsets to prevent overlaps
      let offsetX = -45;
      let offsetY = -6;
      if (Math.cos(angle) > 0.1) offsetX = 10;
      else if (Math.cos(angle) < -0.1) offsetX = -100;
      else offsetX = -45;

      if (Math.sin(angle) > 0.1) offsetY = 10;
      else if (Math.sin(angle) < -0.1) offsetY = -15;

      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);

      this.doc
        .fillColor(this.COLOR_BLACK)
        .fontSize(8)
        .font(this.FONT_REGULAR)
        .text(categories[i], labelX + offsetX, labelY + offsetY, {
          width: 90,
          align: 'center',
        });
    }

    // Draw Data Polygon
    const points: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
      const score = Math.max(0, Math.min(scores[i], maxScore));
      const r = (score / maxScore) * radius;
      const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
      points.push([
        centerX + Math.cos(angle) * r,
        centerY + Math.sin(angle) * r,
      ]);
    }

    // Style data polygon using expected translucent green fill and deep blue border
    this.doc.lineWidth(2);
    this.doc.strokeColor(this.COLOR_DEEP_BLUE);
    this.doc.fillColor('#19D36A');
    this.doc.fillOpacity(0.25);

    this.doc.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      this.doc.lineTo(points[i][0], points[i][1]);
    }
    this.doc.closePath();
    this.doc.fillAndStroke();

    // Restore fillOpacity for solid dots
    this.doc.fillOpacity(1);

    // Draw data points
    points.forEach(([px, py]) => {
      this.doc.circle(px, py, 3.5).fill(this.COLOR_DEEP_BLUE);
    });

    this.doc.restore();
  }

  /**
   * Smart name split algorithm identical to student service BaseReport
   */
  private getSmartSplitName(fullName: string, maxWidth: number): string {
    const currentWidth = this.doc.widthOfString(fullName);
    if (currentWidth <= maxWidth) {
      return fullName;
    }

    const words = fullName.trim().split(/\s+/);
    const totalWords = words.length;

    if (totalWords === 1) return fullName;

    let splitIndex = Math.floor(totalWords / 2);
    if (splitIndex < 1) splitIndex = 1;

    while (splitIndex < totalWords) {
      const line1Candidate = words.slice(0, splitIndex).join(' ');
      const charCount = line1Candidate.replace(/[^a-zA-Z]/g, '').length;
      if (charCount > 3) {
        break;
      }
      splitIndex++;
    }

    const line2Words = words.slice(splitIndex);
    if (line2Words.length === 1) {
      const lastWord = line2Words[0].replace(/[^a-zA-Z]/g, '');
      if (lastWord.length <= 2) {
        return fullName;
      }
    }

    return words.slice(0, splitIndex).join(' ') + '\n' + words.slice(splitIndex).join(' ');
  }
}
