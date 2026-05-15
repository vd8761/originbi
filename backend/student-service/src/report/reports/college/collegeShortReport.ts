import * as fs from 'fs';
import * as path from 'path';
import { CollegeData } from '../../types/types';
import { BaseReport } from '../BaseReport';
import { MAPPING, blendedTraits } from './collegeConstants';
import { logger } from '../../helpers/logger';
import {
  CareerRoleData,
  getCareerGuidanceByTrait,
} from '../../helpers/sqlHelper';

type DiscTrait = 'D' | 'I' | 'S' | 'C';

interface TraitSummary {
  roleSuggestion: string;
  focusArea: string;
}

export class CollegeShortReport extends BaseReport {
  private data: CollegeData;
  private compact: boolean = false;
  private careerGuidance: CareerRoleData[] = [];
  private readonly CONTENT_X = this.MARGIN_STD;
  private readonly CONTENT_W = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
  private readonly C_MUTED = '#5D5D70';

  constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info('[College Short REPORT] Starting PDF Generation...');
    await this.preloadCareerGuidance();

    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    this.generateSinglePageReport();

    this.doc.end();
    await streamFinished;
    logger.info('[College Short REPORT] PDF Generation completed.');
  }

  private async preloadCareerGuidance(): Promise<void> {
    const [primaryTrait, secondaryTrait] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const traitCode = `${primaryTrait}${secondaryTrait}`;

    try {
      this.careerGuidance = await getCareerGuidanceByTrait(
        traitCode,
        this.data.department_deg_id,
      );
    } catch (err) {
      logger.warn(
        '[College Short REPORT] Failed to fetch career guidance data.',
        err,
      );
      this.careerGuidance = [];
    }
  }

  private generateSinglePageReport(): void {
    this._useStdMargins = false;
    this._currentBackground = null;
    this.drawPageFrame();

    const [primaryTrait, secondaryTrait] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    ) as [DiscTrait, DiscTrait];
    const traitCode = `${primaryTrait}${secondaryTrait}`;

    // ── One-page enforcement: measure approximate height first ──
    // Estimate total content height; if too large, use compact spacing.
    // Each section has a rough fixed cost plus dynamic text cost.
    const pageUsable = this.PAGE_HEIGHT - 2 * this.MARGIN_STD - 40; // ~672pt
    const fixedCosts = 80 + 66 + 76 + 250 + 190 + 55; // header+about+profile+career+tech+disclaimer
    this.compact = fixedCosts > pageUsable;

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawAboutReportCard(y + 14, traitCode);
    y = this.drawProfileCard(y, traitCode);
    y = this.drawCareerGuidanceCard(y, traitCode);
    y = this.drawTechTimelineCard(y, traitCode);

    const DISCLAIMER_H = 56;
    const disclaimerY = Math.min(
      y + 22,
      this.PAGE_HEIGHT - 32 - DISCLAIMER_H - 8,
    );
    this.drawDisclaimer(disclaimerY, DISCLAIMER_H);

    this.drawFooterStrip();

    // If content overflowed the safe zone, log for debugging
    const safeBottom = this.PAGE_HEIGHT - this.MARGIN_STD - 40;
    if (y > safeBottom) {
      logger.warn(
        `[College Short REPORT] Content exceeded page safe zone. Final y=${y.toFixed(1)}, safeBottom=${safeBottom.toFixed(1)}`,
      );
    }
  }

  private resolveBackgroundPath(): string | null {
    const candidates = [
      path.resolve(
        process.cwd(),
        'public/assets/images/Watermark_Background.jpg',
      ),
      path.resolve(process.cwd(), 'frontend/public/Watermark_Background.jpg'),
      path.resolve(
        process.cwd(),
        '../../frontend/public/Watermark_Background.jpg',
      ),
      path.resolve(
        process.cwd(),
        '../../backend/student-service/public/assets/images/Watermark_Background.jpg',
      ),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
  }

  private drawPageFrame(): void {
    const backgroundPath = this.resolveBackgroundPath();

    if (backgroundPath && fs.existsSync(backgroundPath)) {
      this.doc.image(backgroundPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    } else {
      this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#FFFFFF');
    }

    this.doc.rect(0, 0, this.PAGE_WIDTH, 6).fill(this.COLOR_DEEP_BLUE);
    this.doc
      .rect(0, this.PAGE_HEIGHT - 6, this.PAGE_WIDTH, 6)
      .fill(this.COLOR_DEEP_BLUE);
  }

  private drawHeader(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Report Snapshot', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(20)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.data.report_title || 'Origin BI ClarityFit', x, y + 14, {
        width: w * 0.62,
        lineBreak: false,
        ellipsis: true,
      });

    const metaX = x + w * 0.62;
    const metaW = w * 0.38;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_BLACK)
      .text(this.data.full_name || '-', metaX, y + 14, {
        width: metaW,
        align: 'right',
        lineBreak: false,
        ellipsis: true,
      });

    const dateString = this.data.exam_start
      ? new Date(this.data.exam_start).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor(this.C_MUTED)
      .text(`${this.data.email_id || ''}   •   ${dateString}`, metaX, y + 34, {
        width: metaW,
        align: 'right',
        lineBreak: false,
      });

    this.doc
      .lineWidth(0.6)
      .strokeColor('#DCDCE4')
      .moveTo(x, y + 52)
      .lineTo(x + w, y + 52)
      .stroke();

    return y + 52;
  }

  private drawAboutReportCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const blended = blendedTraits[traitCode];
    const styleName = this.truncate(
      blended?.name || `${traitCode} profile`,
      24,
    );
    const aboutText =
      `This short report gives you a quick snapshot of your college direction. ` +
      `It highlights your ${styleName} style, suggested role options, and your 2027 – 2035 readiness map. ` +
      'Use this as a concise guide and refer to the full Origin BI report for complete insights.';

    const aboutTextFitted = this.fitTextToHeight(aboutText, width, 50, 10, 1.2);
    this.doc.font(this.FONT_REGULAR).fontSize(10);
    const textHeight = this.doc.heightOfString(aboutTextFitted, {
      width,
      lineGap: 1.2,
    });
    const sectionHeight = 20 + textHeight;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('About This Report', left, y);

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#000000')
      .text(aboutTextFitted, left, y + 26, {
        width,
        lineGap: 1.2,
      });

    return y + sectionHeight + 14;
  }

  private drawProfileCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const blended = blendedTraits[traitCode];
    const styleName = blended?.name || `${traitCode} Profile`;
    const descriptionWidth = width;

    const rawDescription = this.extractPrimaryDescription(
      blended?.description || '',
    );
    const description = this.fitTextToHeight(
      rawDescription,
      descriptionWidth,
      52,
      10,
      1.1,
    );
    this.doc.font(this.FONT_REGULAR).fontSize(10);
    const descriptionHeight = this.doc.heightOfString(description, {
      width: descriptionWidth,
      lineGap: 1.1,
    });
    const sectionHeight = 40 + descriptionHeight;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Characteristic', left, y);

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor('#000000')
      .text(`You are ${this.truncate(styleName, 34)}`, left, y + 26, {
        width: descriptionWidth,
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#000000')
      .text(description, left, y + 46, {
        width: descriptionWidth,
        lineGap: 1.1,
      });

    return y + sectionHeight + 16;
  }

  private drawCareerGuidanceCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const summary = this.getTraitSummary(traitCode);
    const dominantTraits = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const discColors: Record<string, string> = {
      D: '#D82A29',
      I: '#FEDD10',
      C: '#01AADB',
      S: '#4FB965',
    };
    const discTextColors: Record<string, string> = {
      D: '#FFFFFF',
      I: '#000000',
      C: '#FFFFFF',
      S: '#FFFFFF',
    };
    const fallbackTools = this.getFallbackRoadmapTools(summary.focusArea);
    const fallbackRoles = this.getCareerRoleSuggestions(traitCode).map(
      (roleName) => ({
        roleName,
        tools: fallbackTools,
      }),
    );
    const roadmapRoles = (
      this.careerGuidance.length > 0 ? this.careerGuidance : fallbackRoles
    ).slice(0, 2);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Career Guidance & Roadmap', left, y);

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#000000')
      .text(
        'Two role pathways adapted from the full report, with the first tools to build toward each role.',
        left,
        y + 24,
        { width },
      );

    const boardGap = 18;
    const boardWidth = (width - boardGap) / 2;
    const boardY = y + 66;

    roadmapRoles.forEach((role, index) => {
      const traitKey = dominantTraits[index % 2] || 'D';
      this.drawRoleToolBoard(
        left + index * (boardWidth + boardGap),
        boardY,
        boardWidth,
        `Suggestion ${index + 1}`,
        role.roleName,
        (role.tools || fallbackTools).slice(0, 4),
        discColors[traitKey] || this.COLOR_DEEP_BLUE,
        discTextColors[traitKey] || '#FFFFFF',
      );
    });

    return boardY + 214;
  }

  private drawRoleToolBoard(
    x: number,
    y: number,
    width: number,
    label: string,
    roleName: string,
    tools: string[],
    roleColor: string,
    roleTextColor: string,
  ): void {
    const circleR = 33;
    const centerX = x + 56;
    const toolsX = x + 144;
    const toolsY = y + 64;
    const railX = toolsX - 22;
    const toolList = (
      tools.length > 0
        ? tools
        : ['Domain basics', 'Applied projects', 'Portfolio', 'Interview prep']
    ).slice(0, 4);
    const toolWidth = Math.max(92, width - (toolsX - x));
    const rowGap = 38;
    const railTopY = toolsY + 4;
    const railBottomY = toolsY + rowGap * (toolList.length - 1) + 4;
    const railCenterY = (railTopY + railBottomY) / 2;
    const centerY = railCenterY;

    this.doc
      .save()
      .lineWidth(0.7)
      .strokeColor('#D8DCE8')
      .moveTo(x, y + 26)
      .lineTo(x + width, y + 26)
      .stroke()
      .restore();

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(10.5)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(label, x, y, {
        width,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.1)
      .fillColor(this.C_MUTED)
      .text('Role target', x, y + 44, {
        width: 100,
        align: 'center',
        lineBreak: false,
      });

    this.doc.circle(centerX, centerY, circleR).fill(roleColor);

    const roleTypography = this.getCircleRoleTypography(roleName, circleR);
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(roleTypography.fontSize)
      .fillColor(roleTextColor);
    let textY =
      centerY - (roleTypography.lines.length * roleTypography.lineHeight) / 2;
    const roleTextWidth = circleR * 2 - 8;
    roleTypography.lines.forEach((line) => {
      this.doc.text(line, centerX - roleTextWidth / 2, textY, {
        width: roleTextWidth,
        align: 'center',
        lineBreak: false,
      });
      textY += roleTypography.lineHeight;
    });

    this.doc
      .save()
      .lineWidth(0.8)
      .strokeColor('#B9BFCC')
      .moveTo(centerX + circleR - 0.5, centerY)
      .bezierCurveTo(
        centerX + circleR + 22,
        centerY,
        railX - 26,
        railCenterY,
        railX,
        railCenterY,
      )
      .stroke()
      .restore();

    this.doc
      .save()
      .lineWidth(0.8)
      .strokeColor('#C7CCD8')
      .dash(2, { space: 2.5 })
      .moveTo(railX, railTopY)
      .lineTo(railX, railBottomY)
      .stroke()
      .restore();

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7.4)
      .fillColor(this.C_MUTED)
      .text('Key tools to build', toolsX, y + 38, {
        width: toolWidth,
        lineBreak: false,
      });

    toolList.forEach((toolName, index) => {
      const rowY = toolsY + index * rowGap;
      const label = this.fitPhraseToLength(this.cleanRoleLabel(toolName), 30);

      this.doc.circle(railX, rowY + 4, 4.4).fillAndStroke('#FFFFFF', '#8B93A3');

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(7.7)
        .fillColor('#111111')
        .text(label, toolsX, rowY - 2, {
          width: toolWidth,
          lineBreak: false,
        });

      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(6.5)
        .fillColor(this.C_MUTED)
        .text('(Skill/Tool)', toolsX, rowY + 8, {
          width: toolWidth,
          lineBreak: false,
        });
    });
  }

  private getCircleRoleTypography(
    roleName: string,
    circleR: number,
  ): { fontSize: number; lineHeight: number; lines: string[] } {
    const label = this.getCircleDisplayRole(roleName);
    const maxWidth = circleR * 2 - 8;
    const maxHeight = circleR * 2 - 16;
    const sizes = [9.2, 8.6, 8, 7.4, 6.8, 6.2, 5.8];

    for (const fontSize of sizes) {
      this.doc.font(this.FONT_SORA_BOLD).fontSize(fontSize);
      const lines = this.buildCircleRoleLinesExact(label, maxWidth, 3);
      if (!lines) continue;

      const lineHeight = fontSize + 0.9;
      const textHeight = lines.length * lineHeight;
      const widestLine = Math.max(
        ...lines.map((line) => this.doc.widthOfString(line)),
      );

      if (widestLine <= maxWidth && textHeight <= maxHeight) {
        return { fontSize, lineHeight, lines };
      }
    }

    this.doc.font(this.FONT_SORA_BOLD).fontSize(6.4);
    const exactFallback = this.buildCircleRoleLinesExact(label, maxWidth, 4);
    if (exactFallback) {
      return {
        fontSize: 6.4,
        lineHeight: 7.2,
        lines: exactFallback,
      };
    }

    return {
      fontSize: 6.4,
      lineHeight: 7.2,
      lines: this.buildCircleRoleLines(label, maxWidth, 3),
    };
  }

  private buildCircleRoleLinesExact(
    value: string,
    maxWidthPerLine: number,
    maxLines: number,
  ): string[] | null {
    const clean = this.cleanRoleLabel(value);
    const words = clean.split(' ').filter(Boolean);
    if (!words.length) return ['Role'];

    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      if (this.doc.widthOfString(word) > maxWidthPerLine) return null;

      const candidate = current ? `${current} ${word}` : word;
      if (this.doc.widthOfString(candidate) <= maxWidthPerLine) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);
      if (lines.length >= maxLines) return null;
      current = word;
    }

    if (current) lines.push(current);
    return lines.length <= maxLines ? lines : null;
  }

  private getFallbackRoadmapTools(raw: string): string[] {
    const tools = String(raw || '')
      .split(/,|\/|\||;|\band\b/gi)
      .map((item) => this.cleanRoleLabel(item))
      .filter(Boolean);

    return [
      ...tools,
      'Applied projects',
      'Portfolio building',
      'Communication tools',
      'Interview prep',
    ].slice(0, 4);
  }
  private drawTechTimelineCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const skills = this.getTechSkills(traitCode).slice(0, 6);
    const years = [25, 27, 29, 31, 33, 35];
    const titleX = left;
    const chartLeft = left + 208;
    const chartWidth = width - 236;
    const boxWidth = chartWidth / years.length;
    const rowHeight = 22;
    const headingY = y;
    const rowStartY = y + 46;
    const contentHeight = rowStartY + skills.length * rowHeight - y + 10;
    const cardHeight = Math.max(164, contentHeight);
    const legendX = left + width - 145;
    const legendY = y;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Emerging Technologies In 2027 – 2035', titleX, headingY, {
        width: legendX - titleX - 8,
        lineBreak: false,
      });

    this.drawTechLegend(legendX, legendY);

    this.doc.font(this.FONT_SORA_REGULAR).fontSize(10).fillColor('#1F1F1F');
    years.forEach((year, index) => {
      this.doc.text(
        String(year),
        chartLeft + index * boxWidth,
        rowStartY - 15,
        {
          width: boxWidth,
          align: 'center',
        },
      );
    });

    skills.forEach((skill, index) => {
      const rowY = rowStartY + index * rowHeight;
      const centerY = rowY + 6;

      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(11.3)
        .fillColor('#111111')
        .text(this.truncate(skill.label, 33), titleX, rowY + 1.5, {
          width: chartLeft - titleX - 10,
          align: 'right',
        });

      years.forEach((_, yearIndex) => {
        const cellX = chartLeft + yearIndex * boxWidth;
        this.drawTransparentRect(cellX, rowY, boxWidth, 12, '#D8D8D8', 0.52);
        this.doc
          .rect(cellX, rowY, boxWidth, 12)
          .lineWidth(0.35)
          .strokeColor('#FFFFFF')
          .stroke();
      });

      const startX = this.mapTimelineYearToX(
        skill.start,
        chartLeft,
        chartWidth,
        boxWidth,
      );
      const endX = this.mapTimelineYearToX(
        skill.end,
        chartLeft,
        chartWidth,
        boxWidth,
      );

      this.doc
        .moveTo(startX, centerY)
        .lineTo(endX - 6, centerY)
        .lineWidth(0.6)
        .strokeColor('#1E1E1E')
        .stroke();

      this.doc
        .polygon(
          [endX, centerY],
          [endX - 7, centerY - 3.2],
          [endX - 7, centerY + 3.2],
        )
        .fillColor('#1E1E1E')
        .fill();

      this.doc.circle(startX, centerY, 3.8).fillAndStroke('#F3F3F3', '#1E1E1E');
      this.doc.circle(endX + 4, centerY, 3.8).fill(this.COLOR_DEEP_BLUE);
    });

    return y + cardHeight + 9;
  }

  private drawDisclaimer(y: number, h: number): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const text =
      'This short report is a quick summary and should support, not replace, your final career decision. ' +
      'Please refer to the full Origin BI report for detailed trait insights, role comparisons, and guidance on next steps.';

    const fittedText = this.fitTextToHeight(text, width, h - 24, 9, 1.2);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Disclaimer', left, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor('#3A3A46')
      .text(fittedText, left, y + 26, {
        width,
        lineGap: 1.2,
      });

    return y + h;
  }

  private drawTechLegend(x: number, y: number): void {
    const circleY = y + 5;
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('#1F1F1F')
      .text('2027', x, y, { width: 32, align: 'right', lineBreak: false });

    this.doc.circle(x + 52, circleY, 4).fillAndStroke('#FFFFFF', '#B4B4B4');
    this.doc
      .moveTo(x + 56, circleY)
      .lineTo(x + 92, circleY)
      .lineWidth(0.55)
      .strokeColor('#B4B4B4')
      .stroke();
    this.doc.circle(x + 98, circleY, 4).fill('#AAAAAF');

    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('#1F1F1F')
      .text('2035', x + 110, y, { width: 32, lineBreak: false });
  }

  private drawFooterStrip(): void {
    const y = this.PAGE_HEIGHT - 32;
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .lineWidth(0.5)
      .strokeColor('#DCDCE4')
      .moveTo(x, y)
      .lineTo(x + w, y)
      .stroke();

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Origin BI', x, y + 8, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor('#444')
      .text(`#${this.data.exam_ref_no || ''}`, x, y + 9, {
        width: w,
        align: 'right',
        lineBreak: false,
      });
  }

  private getTraitSummary(traitCode: string): TraitSummary {
    const blended = blendedTraits[traitCode];
    const mapping =
      blended?.trait_mapping1?.[0] || blended?.trait_mapping2?.[0];

    return {
      roleSuggestion: String(
        mapping?.[1] ||
          blended?.suggestions ||
          'Career Strategist, Domain Specialist',
      )
        .replace(/\s+/g, ' ')
        .trim(),
      focusArea: String(
        mapping?.[3] ||
          'Domain depth, applied projects, and future-ready capabilities',
      )
        .replace(/\s+/g, ' ')
        .trim(),
    };
  }

  private getCareerRoleSuggestions(traitCode: string): string[] {
    const summary = this.getTraitSummary(traitCode);
    const parts = summary.roleSuggestion
      .split(/,|\/|\||;|\band\b/gi)
      .map((part) => this.cleanRoleLabel(part))
      .filter(Boolean);

    const unique: string[] = [];
    parts.forEach((role) => {
      if (!unique.some((item) => item.toLowerCase() === role.toLowerCase())) {
        unique.push(role);
      }
    });

    const fallback = [
      'Data Engineer',
      'Machine Learning Engineer',
      'Data Quality Analyst',
    ];

    fallback.forEach((role) => {
      if (!unique.some((item) => item.toLowerCase() === role.toLowerCase())) {
        unique.push(role);
      }
    });

    return unique.slice(0, 3);
  }

  private cleanRoleLabel(value: string): string {
    return String(value || '')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^A-Za-z0-9&+\- ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getCircleDisplayRole(value: string): string {
    const clean = this.cleanRoleLabel(value);
    if (!clean) return 'Role';

    const words = clean.split(' ').filter(Boolean);
    if (words.length <= 3) {
      return words.join(' ');
    }

    const threeWords = words.slice(0, 3).join(' ');
    return this.fitPhraseToLength(threeWords, 30);
  }

  private buildCircleRoleLines(
    value: string,
    maxWidthPerLine: number,
    maxLines: number,
  ): string[] {
    const clean = this.cleanRoleLabel(value);
    const words = clean.split(' ').filter(Boolean);
    if (!words.length) return ['Role'];

    const lines: string[] = [];
    let current = '';

    words.forEach((word) => {
      if (lines.length >= maxLines) return;

      const candidate = current ? `${current} ${word}` : word;
      if (this.doc.widthOfString(candidate) <= maxWidthPerLine) {
        current = candidate;
        return;
      }

      if (current) {
        lines.push(current);
        current = '';
      }

      if (this.doc.widthOfString(word) <= maxWidthPerLine) {
        current = word;
      } else {
        lines.push(this.fitPhraseToLength(word, 10));
      }
    });

    if (current && lines.length < maxLines) {
      lines.push(current);
    }

    return lines.slice(0, maxLines);
  }

  private buildCompactListLine(
    raw: string,
    maxChars: number,
    maxItems: number,
  ): string {
    const items = String(raw || '')
      .split(/,|\/|\||;|\band\b/gi)
      .map((item) => this.cleanRoleLabel(item))
      .filter(Boolean);

    if (!items.length) {
      return this.fitPhraseToLength(String(raw || '').trim(), maxChars);
    }

    const limit = Math.max(1, Math.min(maxItems, items.length));
    for (let count = limit; count >= 1; count -= 1) {
      const line = items.slice(0, count).join(', ');
      if (line.length <= maxChars) return line;
    }

    return this.fitPhraseToLength(items[0], maxChars);
  }

  private normalizeSummaryList(raw: string): string {
    const items = String(raw || '')
      .split(/,|\/|\||;|\band\b/gi)
      .map((item) => this.cleanRoleLabel(item))
      .filter(Boolean);

    return items.length
      ? items.join(', ')
      : this.cleanRoleLabel(String(raw || ''));
  }

  private fitTextToHeight(
    value: string,
    width: number,
    maxHeight: number,
    fontSize: number,
    lineGap: number,
  ): string {
    const clean = String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return '';

    this.doc.font(this.FONT_REGULAR).fontSize(fontSize);
    if (this.doc.heightOfString(clean, { width, lineGap }) <= maxHeight) {
      return clean;
    }

    const words = clean.split(' ').filter(Boolean);
    let out = '';
    for (const word of words) {
      const candidate = out ? `${out} ${word}` : word;
      if (this.doc.heightOfString(candidate, { width, lineGap }) > maxHeight) {
        break;
      }
      out = candidate;
    }

    return out || this.fitPhraseToLength(clean, 22);
  }

  private extractPrimaryDescription(value: string): string {
    const source = String(value || '');
    const lines = source
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    if (lines.length > 0) {
      return lines[0];
    }

    return this.extractFirstSentence(source);
  }

  private fitPhraseToLength(value: string, maxChars: number): string {
    const clean = String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length <= maxChars) return clean;

    const words = clean.split(' ').filter(Boolean);
    let out = '';
    for (const word of words) {
      const candidate = out ? `${out} ${word}` : word;
      if (candidate.length > maxChars) break;
      out = candidate;
    }

    if (out) return out;
    return clean.slice(0, maxChars).trim();
  }

  private getDiscCircleStyle(trait: DiscTrait): { fill: string; text: string } {
    switch (trait) {
      case 'D':
        return { fill: '#D82A29', text: '#FFFFFF' };
      case 'I':
        return { fill: '#FEDD10', text: '#111111' };
      case 'S':
        return { fill: '#4FB965', text: '#FFFFFF' };
      case 'C':
      default:
        return { fill: '#01AADB', text: '#FFFFFF' };
    }
  }

  private getTechSkills(traitCode: string) {
    return (
      MAPPING[traitCode] || [
        { label: 'AI-enabled workflows', start: 27, end: 35 },
        { label: 'Data interpretation', start: 25, end: 33 },
        { label: 'Digital collaboration', start: 27, end: 35 },
        { label: 'Domain specialization', start: 29, end: 35 },
      ]
    );
  }

  private mapTimelineYearToX(
    year: number,
    chartX: number,
    chartWidth: number,
    boxWidth: number,
  ): number {
    const normalizedYear = this.clamp(year, 25, 35);
    const offset = ((normalizedYear - 25) / 2) * boxWidth + boxWidth / 2;
    return this.clamp(
      chartX + offset,
      chartX + boxWidth / 2,
      chartX + chartWidth - boxWidth / 2,
    );
  }

  private drawInfoBox(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
  ): void {
    this.drawTransparentRect(x, y, width, height, '#FFFFFF', 0.28);
    this.doc
      .roundedRect(x, y, width, height, 6)
      .lineWidth(0.45)
      .strokeColor('#DDE1EC')
      .stroke();
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7.4)
      .fillColor('#6E7289')
      .text(label, x + 8, y + 5, {
        width: width - 16,
        lineBreak: false,
      });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.7)
      .fillColor('#394057')
      .text(value, x + 8, y + 15, {
        width: width - 16,
        height: height - 17,
        lineGap: 0.2,
      });
  }

  private drawGuidanceDetailBox(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
  ): void {
    this.drawTransparentRect(x, y, width, height, '#FFFFFF', 0.32);
    this.doc
      .roundedRect(x, y, width, height, 7)
      .lineWidth(0.75)
      .strokeColor('#D6DBE9')
      .stroke();

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8.5)
      .fillColor('#6E7289')
      .text(label, x + 9, y + 6, {
        width: width - 18,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.9)
      .fillColor('#394057')
      .text(value, x + 9, y + 18, {
        width: width - 18,
        lineGap: 0.8,
      });
  }

  private drawCard(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    strokeColor: string,
  ): void {
    this.drawTransparentRect(x, y, width, height, fillColor, 0.52);
    this.doc
      .roundedRect(x, y, width, height, 8)
      .lineWidth(0.75)
      .strokeColor(strokeColor)
      .stroke();
  }

  private drawTransparentRect(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    opacity: number,
  ): void {
    this.doc.save();
    this.doc.opacity(opacity);
    this.doc.roundedRect(x, y, width, height, 6).fill(fillColor);
    this.doc.restore();
  }

  private extractFirstSentence(value: string): string {
    const plain = String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plain) {
      return 'Your profile highlights a focused college and career direction.';
    }

    const match = plain.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : plain;
  }

  private truncate(value: string, maxChars: number): string {
    const clean = String(value || '').trim();
    if (clean.length <= maxChars) return clean;
    return `${clean.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
