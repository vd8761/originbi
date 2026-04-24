/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import * as fs from 'fs';
import * as path from 'path';
import { CollegeData } from '../../types/types';
import { BaseReport } from '../BaseReport';
import { MAPPING, blendedTraits } from './collegeConstants';
import { logger } from '../../helpers/logger';

type DiscTrait = 'D' | 'I' | 'S' | 'C';

interface TraitSummary {
  roleSuggestion: string;
  focusArea: string;
}

export class CollegeShortReport extends BaseReport {
  private data: CollegeData;
  private compact: boolean = false;

  constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info('[College Short REPORT] Starting PDF Generation...');
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

  private generateSinglePageReport(): void {
    const backgroundPath = this.resolveBackgroundPath();
    this._currentBackground =
      backgroundPath ?? 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    this.applyInitialPageLayout(backgroundPath);

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

    let y = this.drawHeader();
    y = this.drawAboutReportCard(y, traitCode);
    y = this.drawProfileCard(y, traitCode);
    y = this.drawCareerGuidanceCard(y, traitCode);
    y = this.drawTechTimelineCard(y, traitCode);
    y = this.drawShortDisclaimerCard(y);
    this.drawFooter();

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
      path.resolve(process.cwd(), 'public/assets/images/Watermark_Background.jpg'),
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

  private applyInitialPageLayout(backgroundPath: string | null): void {
    if (backgroundPath && fs.existsSync(backgroundPath)) {
      this.doc.image(backgroundPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    }

    this.doc.page.margins = {
      top: this.MARGIN_STD,
      bottom: this.MARGIN_STD,
      left: this.MARGIN_STD,
      right: this.MARGIN_STD,
    };
    this.doc.x = this.MARGIN_STD;
    this.doc.y = this.MARGIN_STD;
  }

  private drawHeader(): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const right = left + width;
    const examDate = new Date(
      this.data.exam_start || Date.now(),
    ).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const userEmail = this.data.email_id || this.data.exam_ref_no || 'NA';

    // Top accent bar
    this.doc.rect(0, 0, this.PAGE_WIDTH, 6).fill('#2F1D95');

    const startY = 18;
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor('#150089')
      .text('College · Short Summary', left, startY, {
        width: width * 0.52,
      });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(20)
      .fillColor('#150089')
      .text('College Personalized Report', left, startY + 17, {
        width: width * 0.7,
      });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(12)
      .fillColor('#1E1E1E')
      .text(
        this.truncate(this.data.full_name || 'Student', 26),
        right - 200,
        startY + 4,
        {
          width: 200,
          align: 'right',
        },
      );

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#7C8094')
      .text(`${userEmail}   |   ${examDate}`, right - 250, startY + 26, {
        width: 250,
        align: 'right',
        lineBreak: false,
      });

    // Separator — pushed lower to give more breathing room below the big title
    const separatorY = startY + 56;
    this.doc
      .moveTo(left, separatorY)
      .lineTo(right, separatorY)
      .lineWidth(0.8)
      .strokeColor('#D6DAE6')
      .stroke();

    return separatorY + 14;
  }

  private drawAboutReportCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const blended = blendedTraits[traitCode];
    const styleName = this.truncate(blended?.name || `${traitCode} profile`, 24);
    const aboutText =
      `This short report gives you a quick snapshot of your college direction. ` +
      `It highlights your ${styleName} style, suggested role options, and your 2027 – 2035 readiness map. ` +
      'Use this as a concise guide and refer to the full Origin BI report for complete insights.';

    const aboutTextFitted = this.fitTextToHeight(
      aboutText,
      width,
      50,
      10,
      1.2,
    );
    this.doc.font(this.FONT_REGULAR).fontSize(10);
    const textHeight = this.doc.heightOfString(aboutTextFitted, {
      width,
      lineGap: 1.2,
    });
    const sectionHeight = 20 + textHeight;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor('#150089')
      .text('About This Report', left, y + 4);

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

  private drawProfileCard(
    y: number,
    traitCode: string,
  ): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const blended = blendedTraits[traitCode];
    const styleName = blended?.name || `${traitCode} Profile`;
    const descriptionWidth = width;

    const rawDescription = this.extractPrimaryDescription(blended?.description || '');
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
      .fillColor('#150089')
      .text('Your Characteristic', left, y + 4);

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
    const roleSuggestions = this.getCareerRoleSuggestions(traitCode);
    
    // Get all unique roles from DB and remove the first 3 (which are shown in the circles)
    const allUniqueRoles = summary.roleSuggestion
      .split(/,|\/|\||;|\band\b/gi)
      .map((part) => this.cleanRoleLabel(part))
      .filter(Boolean)
      .reduce((acc: string[], role) => {
        if (!acc.some((item) => item.toLowerCase() === role.toLowerCase())) acc.push(role);
        return acc;
      }, []);
      
    let roleSummary = allUniqueRoles.slice(3).join(', ');
    if (!roleSummary) {
      roleSummary = 'Refer to the full Origin BI report for additional role suggestions';
    }
    if (roleSummary && !roleSummary.endsWith('.')) roleSummary += '.';

    let focusSummary = this.normalizeSummaryList(summary.focusArea);
    if (focusSummary && !focusSummary.endsWith('.')) focusSummary += '.';
    
    const primaryTrait = (traitCode[0] as DiscTrait) || 'D';
    const secondaryTrait = (traitCode[1] as DiscTrait) || primaryTrait;
    const roleTraits: DiscTrait[] = [primaryTrait, secondaryTrait, primaryTrait];
    const itemsY = y + 62;
    const itemGap = 10;
    const itemW = (width - itemGap * 2) / 3;
    const itemH = 120;
    const circleRadius = 32;
    const detailsY = itemsY + itemH + 14;
    const detailsWidth = width;

    const roleSummaryText = this.fitTextToHeight(
      roleSummary,
      detailsWidth,
      30,
      10,
      1.1,
    );
    const focusSummaryText = this.fitTextToHeight(
      focusSummary,
      detailsWidth,
      28,
      10,
      1.1,
    );

    this.doc.font(this.FONT_REGULAR).fontSize(10);
    const roleSummaryHeight = this.doc.heightOfString(roleSummaryText, {
      width: detailsWidth,
      lineGap: 1.1,
    });
    const focusSummaryHeight = this.doc.heightOfString(focusSummaryText, {
      width: detailsWidth,
      lineGap: 1.1,
    });

    const roleLabelY = detailsY;
    const roleTextY = roleLabelY + 18;
    const focusLabelY = roleTextY + roleSummaryHeight + 14;
    const focusTextY = focusLabelY + 18;
    const cardHeight = focusTextY + focusSummaryHeight - y + 12;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor('#150089')
      .text('Career Guidance', left, y + 2);

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor('#000000')
      .text('Role roadmap and tool path', left, y + 24);

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#000000')
      .text(
        'Roadmaps are generated from the same trait and department logic used in the full report.',
        left,
        y + 42,
        { width },
      );

    roleSuggestions.forEach((role, index) => {
      const itemX = left + index * (itemW + itemGap);
      const centerX = itemX + itemW / 2;
      const centerY = itemsY + 66;
      const style = this.getDiscCircleStyle(roleTraits[index] || primaryTrait);

      this.drawTransparentRect(itemX, itemsY, itemW, itemH, '#FFFFFF', 0.24);
      this.doc
        .roundedRect(itemX, itemsY, itemW, itemH, 8)
        .lineWidth(0.7)
        .strokeColor('#D6DBE9')
        .stroke();

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(7.9)
        .fillColor('#000000')
        .text(`Suggestion ${index + 1}`, itemX, itemsY + 7, {
          width: itemW,
          align: 'center',
        });

      this.doc.circle(centerX, centerY, circleRadius).fill(style.fill);

      const roleTitle = this.getCircleDisplayRole(role);
      const roleTextWidth = circleRadius * 2 - 10;
      this.doc.font(this.FONT_SORA_BOLD).fontSize(9.8).fillColor(style.text);
      const roleLines = this.buildCircleRoleLines(roleTitle, roleTextWidth, 3);
      const lineHeight = 9.8;
      const totalTextHeight = roleLines.length * lineHeight;
      let textY = centerY - totalTextHeight / 2 + 0.1;

      roleLines.forEach((line) => {
        this.doc
          .font(this.FONT_SORA_BOLD)
          .fontSize(9.8)
          .fillColor(style.text)
          .text(line, centerX - roleTextWidth / 2, textY, {
            width: roleTextWidth,
            align: 'center',
            lineBreak: false,
          });
        textY += lineHeight;
      });
    });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor('#000000')
      .text('Role Suggestion', left, roleLabelY, {
        width: detailsWidth,
        lineBreak: false,
      });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#000000')
      .text(roleSummaryText, left, roleTextY, {
        width: detailsWidth,
        lineGap: 1.1,
      });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11)
      .fillColor('#000000')
      .text('Focus Area', left, focusLabelY, {
        width: detailsWidth,
        lineBreak: false,
      });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#000000')
      .text(focusSummaryText, left, focusTextY, {
        width: detailsWidth,
        lineGap: 1.1,
      });

    return y + cardHeight + 6;
  }

  private drawTechTimelineCard(y: number, traitCode: string): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const skills = this.getTechSkills(traitCode).slice(0, 6);
    const years = [25, 27, 29, 31, 33, 35];
    const titleX = left + 12;
    const chartLeft = left + 208;
    const chartWidth = width - 236;
    const boxWidth = chartWidth / years.length;
    const rowHeight = 22;
    const headingY = y + 14;
    const rowStartY = y + 60;
    const contentHeight = rowStartY + skills.length * rowHeight - y + 10;
    const cardHeight = Math.max(178, contentHeight);
    const legendX = left + width - 145;
    const legendY = y + 14;

    this.drawCard(left, y, width, cardHeight, '#FFFFFF', '#D8DEE9');

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor('#150089')
      .text('Emerging Technologies In 2027 – 2035', titleX, headingY, {
        width: legendX - titleX - 8,
        lineBreak: false,
      });

    this.drawTechLegend(legendX, legendY);

    this.doc.font(this.FONT_SORA_REGULAR).fontSize(10).fillColor('#1F1F1F');
    years.forEach((year, index) => {
      this.doc.text(String(year), chartLeft + index * boxWidth, rowStartY - 15, {
        width: boxWidth,
        align: 'center',
      });
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

  private drawShortDisclaimerCard(y: number): number {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const text =
      'This short report is a quick summary and should support, not replace, your final career decision. ' +
      'Please refer to the full Origin BI report for detailed trait insights, role comparisons, and guidance on next steps.';

    const footerSafeTop = this.PAGE_HEIGHT - 32;
    const availableHeight = footerSafeTop - y;
    if (availableHeight < 42) {
      return y;
    }

    const fittedText = this.fitTextToHeight(
      text,
      width - 28,
      Math.max(14, availableHeight - 30),
      8.9,
      1,
    );
    this.doc.font(this.FONT_REGULAR).fontSize(8.9);
    const textHeight = this.doc.heightOfString(fittedText, {
      width: width - 28,
      lineGap: 1,
    });
    const sectionHeight = Math.min(availableHeight, Math.max(24, textHeight + 16));

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor('#150089')
      .text('Short Disclaimer', left, y + 4);

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#000000')
      .text(fittedText, left, y + 26, {
        width,
        lineGap: 1.1,
      });

    return y + sectionHeight + 10;
  }

  private drawTechLegend(x: number, y: number): void {
    const circleY = y + 5;
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('#1F1F1F')
      .text('2027', x, y, { width: 32, align: 'right', lineBreak: false });

    this.doc
      .circle(x + 52, circleY, 4)
      .fillAndStroke('#FFFFFF', '#B4B4B4');
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

  private drawFooter(): void {
    const left = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const footerLineY = this.PAGE_HEIGHT - 30;
    const footerTextY = this.PAGE_HEIGHT - 20;
    const savedMargins = { ...this.doc.page.margins };

    this.doc.save();
    this.doc.page.margins = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };

    this.doc
      .moveTo(left, footerLineY)
      .lineTo(left + width, footerLineY)
      .lineWidth(0.6)
      .strokeColor('#D0D4E2')
      .stroke();

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor('#2F1D95')
      .text('Origin BI', left, footerTextY, {
        width: 70,
        lineBreak: false,
        baseline: 'top',
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#8A90A6')
      .text('© All rights reserved', left + 75, footerTextY, {
        width: 160,
        lineBreak: false,
        baseline: 'top',
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#8A90A6')
      .text(`#${this.data.exam_ref_no || 'NA'}`, left + 200, footerTextY, {
        width: width - 240 + left,
        align: 'right',
        lineBreak: false,
        baseline: 'top',
      });

    this.doc.restore();
    this.doc.page.margins = savedMargins;
  }

  private getTraitSummary(traitCode: string): TraitSummary {
    const blended = blendedTraits[traitCode];
    const mapping = blended?.trait_mapping1?.[0] || blended?.trait_mapping2?.[0];

    return {
      roleSuggestion: String(
        mapping?.[1] || blended?.suggestions || 'Career Strategist, Domain Specialist',
      )
        .replace(/\s+/g, ' ')
        .trim(),
      focusArea: String(
        mapping?.[3] || 'Domain depth, applied projects, and future-ready capabilities',
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

  private buildCompactListLine(raw: string, maxChars: number, maxItems: number): string {
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

    return items.length ? items.join(', ') : this.cleanRoleLabel(String(raw || ''));
  }

  private fitTextToHeight(
    value: string,
    width: number,
    maxHeight: number,
    fontSize: number,
    lineGap: number,
  ): string {
    const clean = String(value || '').replace(/\s+/g, ' ').trim();
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
    const clean = String(value || '').replace(/\s+/g, ' ').trim();
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
