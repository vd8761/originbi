import * as fs from 'fs';
import * as path from 'path';
import { AgileScore, CollegeData } from '../../types/types';
import { BaseReport, StyledRow, TableOptions } from '../BaseReport';
import { logger } from '../../helpers/logger';
import {
  BEHAVIORAL_ORIENTATION,
  detectDeclaredTrackCode,
  DiscTrait,
  fitLevelStyle,
  normalizeReadiness,
  rankSpecializations,
  READINESS_LABEL,
  READINESS_ORDER,
  ReadinessKey,
  readinessBand,
  SPECIALIZATIONS,
  SpecializationMeta,
  SpecRanking,
} from './mbaConstants';

/**
 * Origin BI MBA SpecFit - 2-page short report.
 *
 * Page 1: Profile snapshot + recommended specialization
 * Page 2: All-5 ranking, strengths/development, career chips, preparation plan
 *
 * Mirrors the page frame + header + footer system used by CollegeShortReport.
 */
export class CollegeMBAShortReport extends BaseReport {
  private data: CollegeData;

  private readonly CONTENT_X = this.MARGIN_STD;
  private readonly CONTENT_W = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
  private readonly C_MUTED = '#5D5D70';
  private readonly C_RULE = '#DCDCE4';
  private readonly C_INK = '#1B1B27';
  private readonly C_SUBTLE_BG = '#F6F6FB';

  private readinessPct: Record<ReadinessKey, number> = {
    commitment: 0,
    focus: 0,
    openness: 0,
    respect: 0,
    courage: 0,
  };
  private rankings: SpecRanking[] = [];
  private primaryTrait: DiscTrait = 'D';
  private secondaryTrait: DiscTrait = 'I';
  private behavioralOrientation = '';
  private recommendedSpec!: SpecializationMeta;
  private declaredTrack: string | null = null;
  /** Whether the student has usable ACI data driving the readiness profile. */
  private aciAvailable = false;

  constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info('[MBA Short REPORT] Starting PDF Generation...');
    this.computeProfile();

    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);
    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    this.renderPageOne();
    this.doc.addPage();
    this.renderPageTwo();

    this.doc.end();
    await streamFinished;
    logger.info('[MBA Short REPORT] PDF Generation completed.');
  }

  // Computation ────────────────────────────────────────────────────────────

  private computeProfile(): void {
    const [primary, secondary] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    ) as [DiscTrait, DiscTrait];
    this.primaryTrait = primary;
    this.secondaryTrait = secondary;

    this.behavioralOrientation =
      BEHAVIORAL_ORIENTATION[`${primary}${secondary}`] ||
      BEHAVIORAL_ORIENTATION[primary] ||
      'Balanced Professional';

    this.aciAvailable = this.hasAci(this.data.agile_scores);
    const agile: AgileScore = (this.data.agile_scores &&
      this.data.agile_scores[0]) || {
      commitment: 0,
      focus: 0,
      openness: 0,
      respect: 0,
      courage: 0,
    };
    this.readinessPct = {
      commitment: this.normalizeScore(agile.commitment),
      focus: this.normalizeScore(agile.focus),
      openness: this.normalizeScore(agile.openness),
      respect: this.normalizeScore(agile.respect),
      courage: this.normalizeScore(agile.courage),
    };

    // Shared ranking math (see mbaConstants.rankSpecializations) so the short
    // report and the MBA placement report stay perfectly consistent.
    this.rankings = rankSpecializations(this.readinessPct, primary);
    this.recommendedSpec = this.rankings[0].meta;

    this.declaredTrack = this.detectDeclaredTrack();
  }

  // Agile scores are documented as /25; some pipelines emit 0-100. Auto-detect.
  private normalizeScore(raw: unknown): number {
    return normalizeReadiness(raw);
  }

  private detectDeclaredTrack(): string | null {
    const code = detectDeclaredTrackCode(
      this.data.dept_code,
      this.data.group_name,
    );
    if (!code || code === this.recommendedSpec.code) return null;
    return SPECIALIZATIONS[code].name;
  }

  // Page rendering ─────────────────────────────────────────────────────────

  private renderPageOne(): void {
    this._useStdMargins = false;
    this._currentBackground = null;
    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawHeroRecommendationCard(y + 14);
    y = this.drawReadinessProfile(y + 16);
    y = this.drawWhyRecommendation(y + 14);
    this.drawSpecializationRanking(y + 16);

    this.drawFooterStrip(1);
  }

  private renderPageTwo(): void {
    this._useStdMargins = false;
    this._currentBackground = null;
    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawStrengthsAndDevelopment(y + 14);
    y = this.drawCareerChips(y + 14);
    y = this.drawPreparationPlan(y + 12);
    this.drawDisclaimer(y + 10);

    this.drawFooterStrip(2);
  }

  // Page frame + header + footer (mirrors CollegeShortReport) ──────────────

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
    return candidates.find((c) => fs.existsSync(c)) ?? null;
  }

  private drawPageFrame(): void {
    const bg = this.resolveBackgroundPath();
    if (bg && fs.existsSync(bg)) {
      this.doc.image(bg, 0, 0, {
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

  /** Label shown as the eyebrow in the header and on the left of the footer. */
  private readonly SNAPSHOT_LABEL = 'MBA Specialization Snapshot';

  private drawHeader(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    // ── Sizes ──
    const logoH = 22; // small logo
    const logoW = 78; // approximate rendered width at this height (covers "Origin BI" wordmark)
    const titleFontSize = 16;
    const nameSize = 15;
    const dateSize = 8.5;
    const metaGap = 4;

    // ── Right meta column (name + date stack) ──
    const metaX = x + w * 0.62;
    const metaW = w * 0.38;
    const metaH = nameSize + metaGap + dateSize;

    // ── Title geometry (left of meta, right of logo) ──
    const titleLeft = x + logoW + 12;
    const titleAvailW = metaX - titleLeft - 16; // 16pt safety gap to meta
    const titleText = 'MBA Pathway Fit Report';

    // Measure the rendered title height - adapts if it wraps to 2 lines.
    this.doc.font(this.FONT_SORA_BOLD).fontSize(titleFontSize);
    const titleH = this.doc.heightOfString(titleText, {
      width: titleAvailW,
    });

    // Band height = whichever element is tallest, plus a tiny padding.
    const contentH = Math.max(logoH, titleH, metaH);
    const bandH = contentH + 4;
    const midY = y + bandH / 2;

    // ── Logo (left, vertically centered to midY) ──
    const logoPath = this.resolveLogoPath();
    if (logoPath) {
      this.doc.image(logoPath, x, midY - logoH / 2, { height: logoH });
    }

    // ── Title (block vertically centered on midY - adapts to wrap) ──
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(titleFontSize)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(titleText, titleLeft, midY - titleH / 2, {
        width: titleAvailW,
        lineGap: 0,
      });

    // ── Meta (block vertically centered on midY) ──
    const metaTop = midY - metaH / 2;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(nameSize)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.data.full_name || '-', metaX, metaTop, {
        width: metaW,
        align: 'right',
        lineBreak: false,
        ellipsis: true,
      });

    const dateStr = this.data.exam_start
      ? new Date(this.data.exam_start).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '';

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(dateSize)
      .fillColor(this.C_MUTED)
      .text(
        `${this.data.email_id || ''}   •   ${dateStr}`,
        metaX,
        metaTop + nameSize + metaGap,
        {
          width: metaW,
          align: 'right',
          lineBreak: false,
        },
      );

    // ── Underline rule ──
    const ruleY = y + bandH + 4;
    this.doc
      .lineWidth(0.6)
      .strokeColor(this.C_RULE)
      .moveTo(x, ruleY)
      .lineTo(x + w, ruleY)
      .stroke();

    return ruleY;
  }

  private drawFooterStrip(pageNum: number): void {
    const y = this.PAGE_HEIGHT - 32;
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .lineWidth(0.5)
      .strokeColor(this.C_RULE)
      .moveTo(x, y)
      .lineTo(x + w, y)
      .stroke();

    // ── Snapshot label (replaces the old "Origin BI" text) ──
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.SNAPSHOT_LABEL, x, y + 8, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor('#444')
      .text(`Page ${pageNum} of 2`, x, y + 9, {
        width: w,
        align: 'center',
        lineBreak: false,
      });

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

  // Page 1 sections ────────────────────────────────────────────────────────

  private drawHeroRecommendationCard(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 132;
    const spec = this.recommendedSpec;
    const topRank = this.rankings[0];
    const fitStyle = fitLevelStyle(topRank.fit);

    // Fixed light-toned deep blue palette for the hero card (spec-agnostic).
    const heroFill = '#EDEDF7';
    const heroBorder = this.COLOR_DEEP_BLUE;
    const heroAccentBar = this.COLOR_DEEP_BLUE;
    const heroEyebrow = this.COLOR_DEEP_BLUE;

    this.doc.save();
    this.doc.roundedRect(x, y, w, h, 10).fill(heroFill);
    this.doc.restore();
    this.doc
      .lineWidth(1.2)
      .strokeColor(heroBorder)
      .roundedRect(x, y, w, h, 10)
      .stroke();

    // Left accent bar - inset from top & bottom by the corner radius so it
    // sits inside the rounded corners instead of overflowing the card.
    const accentR = 10;
    this.doc.save();
    this.doc.rect(x, y + accentR, 6, h - accentR * 2).fill(heroAccentBar);
    this.doc.restore();

    const innerX = x + 22;
    const innerY = y + 18;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9.5)
      .fillColor(heroEyebrow)
      .text('BEST-FIT MBA SPECIALIZATION', innerX, innerY, {
        characterSpacing: 0.6,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(28)
      .fillColor(this.C_INK)
      .text(spec.name, innerX, innerY + 14, {
        width: w * 0.55,
        lineBreak: false,
        ellipsis: true,
      });

    this.drawPill(
      innerX,
      innerY + 54,
      topRank.fit,
      fitStyle.bg,
      fitStyle.fg,
      fitStyle.dot,
    );

    const rightX = x + w * 0.62;
    const rightW = w - (rightX - x) - 22;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text('BEHAVIORAL ORIENTATION', rightX, innerY, {
        characterSpacing: 0.6,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(15)
      .fillColor(this.C_INK)
      .text(this.behavioralOrientation, rightX, innerY + 14, {
        width: rightW,
        lineGap: 1.2,
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#3A3A46')
      .text(spec.reasonOnePager, innerX, y + h - 28, {
        width: w - 44,
        lineBreak: false,
        ellipsis: true,
      });

    return y + h;
  }

  private drawPill(
    x: number,
    y: number,
    label: string,
    bg: string,
    fg: string,
    dot: string,
  ): void {
    this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(9.5);
    const textW = this.doc.widthOfString(label);
    const padX = 10;
    const dotR = 3;
    const dotGap = 6;
    const pillW = textW + padX * 2 + dotR * 2 + dotGap;
    const pillH = 20;
    this.doc.save();
    this.doc.roundedRect(x, y, pillW, pillH, pillH / 2).fill(bg);
    this.doc.restore();
    this.doc.circle(x + padX + dotR, y + pillH / 2, dotR).fill(dot);
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9.5)
      .fillColor(fg)
      .text(label, x + padX + dotR * 2 + dotGap, y + 5, {
        width: textW + 4,
        lineBreak: false,
      });
  }

  private drawReadinessProfile(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Work Readiness Profile', x, y, { lineBreak: false });

    // When ACI is not completed the readiness percentages are all zero, which
    // would render a misleading empty profile. Show a short explanatory note
    // instead and skip the bars entirely.
    if (!this.aciAvailable) {
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor(this.C_MUTED)
        .text(
          'Your Work Readiness Profile becomes available once you complete the ' +
            'Agile Compatibility Index (ACI) assessment. The recommendations ' +
            'above are based on your behavioural (DISC) profile.',
          x,
          y + 18,
          { width: w },
        );
      return this.doc.y + 8;
    }

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text(
        'How prepared you currently are across the five professional readiness areas.',
        x,
        y + 18,
        { width: w, lineBreak: false },
      );

    const barsY = y + 40;
    const rowH = 28;
    const labelW = 200;
    const valueW = 78;
    const barX = x + labelW + 8;
    const barW = w - labelW - valueW - 16;

    // Sort readiness indicators by percentage descending so the strongest
    // areas appear at the top - easier to scan than a fixed order.
    const sortedKeys = [...READINESS_ORDER].sort(
      (a, b) => this.readinessPct[b] - this.readinessPct[a],
    );

    sortedKeys.forEach((key, i) => {
      const rowY = barsY + i * rowH;
      const pct = this.readinessPct[key];
      const band = readinessBand(pct);

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor(this.C_INK)
        .text(READINESS_LABEL[key], x, rowY + 4, {
          width: labelW,
          lineBreak: false,
          ellipsis: true,
        });

      this.doc.save();
      this.doc.roundedRect(barX, rowY + 8, barW, 10, 5).fill('#ECECF1');
      this.doc.restore();

      const fillW = Math.max(4, (pct / 100) * barW);
      this.doc.save();
      this.doc.roundedRect(barX, rowY + 8, fillW, 10, 5).fill(band.color);
      this.doc.restore();

      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10)
        .fillColor(band.color)
        .text(`${Math.round(pct)}%`, x + w - valueW, rowY + 2, {
          width: valueW,
          align: 'right',
          lineBreak: false,
        });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8.5)
        .fillColor(this.C_MUTED)
        .text(band.level, x + w - valueW, rowY + 15, {
          width: valueW,
          align: 'right',
          lineBreak: false,
        });
    });

    return barsY + READINESS_ORDER.length * rowH;
  }

  private drawWhyRecommendation(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const spec = this.recommendedSpec;
    const firstName = this.firstName(this.data.full_name);

    const topReadiness = this.topReadinessLabels(2);
    const weakReadiness = this.bottomReadinessLabels(2);
    const traits = spec.bestSuitedFor.slice(0, 2).join(' and ').toLowerCase();

    let paragraph =
      `${firstName} shows a ${this.behavioralOrientation} profile, ` +
      `with particular strength in ${topReadiness}. ` +
      `This naturally aligns with the ${spec.name} specialization, which rewards ${traits}. ` +
      `Areas to develop before placement: ${weakReadiness}.`;

    if (this.declaredTrack) {
      paragraph +=
        ` You are currently in the ${this.declaredTrack} track; ` +
        `this assessment suggests ${spec.name} may be a stronger natural fit.`;
    }

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Why This Recommendation', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10.5)
      .fillColor(this.C_INK)
      .text(paragraph, x, y + 22, {
        width: w,
        lineGap: 2,
        align: 'justify',
      });

    const textH = this.doc.heightOfString(paragraph, {
      width: w,
      lineGap: 2,
      align: 'justify',
    });
    return y + 22 + textH;
  }

  // Page 2 sections ────────────────────────────────────────────────────────

  private drawSpecializationRanking(y: number): number {
    const x = this.CONTENT_X;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('All 5 Specializations - Suitability Ranking', x, y, {
        lineBreak: false,
      });

    const tableY = y + 22;

    const headers = ['Rank', 'Specialization', 'Fit Level', 'Score', 'Reason'];

    const rows: (StyledRow | (string | number | null | undefined)[])[] =
      this.rankings.map((r) => {
        const cells = [
          `${r.rank}`,
          r.meta.name,
          r.fit,
          `${Math.round(r.finalScore)}%`,
          r.meta.reasonOnePager,
        ];
        if (r.rank === 1) {
          const styled: StyledRow = {
            type: 'row',
            data: cells,
            fill: r.meta.accentSoft,
            color: this.C_INK,
            font: this.FONT_SORA_SEMIBOLD,
            fontSize: 8,
          };
          return styled;
        }
        return cells;
      });

    this.table(headers, rows, {
      y: tableY,
      x,
      width: this.CONTENT_W,
      fontSize: 8,
      headerFontSize: 8,
      headerColor: '#150089',
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      borderWidth: 0.5,
      cellPadding: 5,
      colWidths: ['fit', 'fit', 'fit', 'fit', 'fill'],
      headerAlign: ['center', 'left', 'left', 'center', 'left'],
      rowAlign: ['center', 'left', 'left', 'center', 'left'],
      verticalAlign: 'middle',
      headerVerticalAlign: 'middle',
    } as TableOptions);

    return this.doc.y;
  }

  private drawStrengthsAndDevelopment(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const colGap = 16;
    const colW = (w - colGap) / 2;

    const strengths = this.topReadinessKeys(3);
    const dev = this.bottomReadinessKeys(2);

    const titleH = 22;
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Strength Areas', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Development Focus', x + colW + colGap, y, { lineBreak: false });

    const itemsY = y + titleH;

    const strengthExplain: Record<ReadinessKey, string> = {
      commitment:
        'Takes assigned work seriously and completes tasks with ownership.',
      focus: 'Stays consistent and goal-oriented even over long stretches.',
      openness: 'Adapts quickly to feedback, new tools, and changing context.',
      respect: 'Works respectfully with peers and seniors across functions.',
      courage:
        'Speaks up, takes initiative, and decides confidently under pressure.',
    };
    const devExplain: Record<ReadinessKey, string> = {
      commitment: 'Needed to take full responsibility through to closure.',
      focus: 'Needed to maintain consistency across long-running tasks.',
      openness: 'Needed for adapting to new tools, feedback, and roles.',
      respect:
        'Needed for cross-functional collaboration and conflict handling.',
      courage:
        'Needed for interviews, presentations, and leadership communication.',
    };

    const titleSize = 10.2;
    const bodySize = 9;
    const itemGap = 10; // vertical gap between items in a column

    const drawItem = (
      colX: number,
      itemY: number,
      titleText: string,
      bodyText: string,
      accent: string,
    ): number => {
      // Measure body height to position correctly and size the accent bar
      const bodyH = this.doc
        .font(this.FONT_REGULAR)
        .fontSize(bodySize)
        .heightOfString(bodyText, { width: colW - 12, lineGap: 1 });
      const titleH = this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(titleSize)
        .heightOfString(titleText);

      const totalH = titleH + 2 + bodyH;

      // Left accent bar - spans the full item height
      this.doc.save();
      this.doc.rect(colX, itemY + 2, 3, totalH).fill(accent);
      this.doc.restore();

      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(titleSize)
        .fillColor(this.C_INK)
        .text(titleText, colX + 10, itemY, {
          width: colW - 12,
          lineBreak: false,
          ellipsis: true,
        });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(bodySize)
        .fillColor(this.C_MUTED)
        .text(bodyText, colX + 10, itemY + titleH + 2, {
          width: colW - 12,
          lineGap: 1,
        });

      return itemY + totalH + itemGap;
    };

    let leftY = itemsY;
    strengths.forEach((k) => {
      leftY = drawItem(
        x,
        leftY,
        READINESS_LABEL[k],
        strengthExplain[k],
        '#2E7D32',
      );
    });

    let rightY = itemsY;
    dev.forEach((k) => {
      rightY = drawItem(
        x + colW + colGap,
        rightY,
        READINESS_LABEL[k],
        devExplain[k],
        '#ED6C02',
      );
    });

    return Math.max(leftY, rightY) - itemGap;
  }

  private drawCareerChips(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const spec = this.recommendedSpec;

    // Normalise roles to { name, description } objects
    const allRoles = spec.defaultRoles.map((r) =>
      typeof r === 'string' ? { name: r, description: '' } : r,
    );
    const top = allRoles[0];
    const others = allRoles.slice(1, 5); // up to 4 supporting cards

    // ── Title + subtitle ──
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Recommended Career Paths', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text(
        `Roles where your ${spec.name} strengths translate into immediate workplace value.`,
        x,
        y + 18,
        { width: w, lineBreak: false },
      );

    // ── Top Career Match hero card ──
    const heroY = y + 40;
    const heroH = 70;
    const iconGutter = 80; // reserved right area for the trophy emblem
    const textW = w - 32 - iconGutter;

    this.doc.save();
    this.doc.roundedRect(x, heroY, w, heroH, 8).fill(spec.accent);
    this.doc.restore();

    // Universal "top pick" mark - prefer the PNG asset; fall back to the
    // drawn target if the file isn't present.
    const iconSize = heroH - 20;
    const iconCx = x + w - iconGutter / 2 - 6;
    const iconCy = heroY + heroH / 2;
    // Prefer the pre-inverted white version; fall back to the black source,
    // then to the drawn target. Rendered translucent so it reads as a
    // watermark, not as a competing focal point with the role name.
    const iconPath =
      this.resolveIconPath('top-career-match-white.png') ||
      this.resolveIconPath('top-career-match.png');
    if (iconPath) {
      this.doc.save();
      this.doc.opacity(0.35);
      this.doc.image(iconPath, iconCx - iconSize / 2, iconCy - iconSize / 2, {
        width: iconSize,
        height: iconSize,
      });
      this.doc.restore();
      this.doc.opacity(1);
    } else {
      this.drawTargetIcon(iconCx, iconCy, iconSize / 2, '#FFFFFF', 0.35);
    }

    const eyebrowH = this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .heightOfString('TOP CAREER MATCH');
    const nameH = this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(18)
      .heightOfString(top?.name || '-');
    const descH = top?.description
      ? this.doc
          .font(this.FONT_REGULAR)
          .fontSize(9.5)
          .heightOfString(top.description, { width: textW })
      : 0;
    const stackH = eyebrowH + 4 + nameH + (descH ? 4 + descH : 0);
    const stackTop = heroY + (heroH - stackH) / 2;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .fillColor('#FFFFFF')
      .text('TOP CAREER MATCH', x + 16, stackTop, {
        characterSpacing: 1.2,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(18)
      .fillColor('#FFFFFF')
      .text(top?.name || '-', x + 16, stackTop + eyebrowH + 4, {
        width: textW,
        lineBreak: false,
        ellipsis: true,
      });

    if (top?.description) {
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor('#FFFFFF')
        .text(top.description, x + 16, stackTop + eyebrowH + 4 + nameH + 4, {
          width: textW,
        });
    }

    let cursorY = heroY + heroH + 14;

    // ── OTHER STRONG MATCHES eyebrow ──
    if (others.length > 0) {
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8)
        .fillColor(this.C_MUTED)
        .text('OTHER STRONG MATCHES', x, cursorY, {
          characterSpacing: 1.2,
          lineBreak: false,
        });
      cursorY += 16;

      // ── 2×2 grid of role cards ──
      const colGap = 12;
      const rowGap = 10;
      const cardW = (w - colGap) / 2;
      const cardH = 52;

      others.forEach((role, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = x + col * (cardW + colGap);
        const cardY = cursorY + row * (cardH + rowGap);

        // Fill + thin border
        this.doc.save();
        this.doc
          .roundedRect(cardX, cardY, cardW, cardH, 6)
          .fill(spec.accentSoft);
        this.doc.restore();
        this.doc
          .lineWidth(0.6)
          .strokeColor(spec.accent)
          .roundedRect(cardX, cardY, cardW, cardH, 6)
          .stroke();

        const padX = 12;
        const padY = 10;
        this.doc
          .font(this.FONT_SORA_BOLD)
          .fontSize(10.5)
          .fillColor(this.C_INK)
          .text(role.name, cardX + padX, cardY + padY, {
            width: cardW - padX * 2,
            lineBreak: false,
            ellipsis: true,
          });

        if (role.description) {
          this.doc
            .font(this.FONT_REGULAR)
            .fontSize(8.5)
            .fillColor(this.C_MUTED)
            .text(role.description, cardX + padX, cardY + padY + 16, {
              width: cardW - padX * 2,
              lineGap: 1,
            });
        }
      });

      const rows = Math.ceil(others.length / 2);
      cursorY += rows * cardH + (rows - 1) * rowGap;
    }

    return cursorY;
  }

  /**
   * "Your Preparation Plan" - numbered timeline (01 → 02 → 03 → 04).
   *
   * Each step is a rounded numbered tile in the specialization's accent
   * colour, connected by a thin vertical line so the reader perceives
   * the steps as a sequence rather than a flat checklist.
   */
  private drawPreparationPlan(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const spec = this.recommendedSpec;
    const items = spec.preparation.slice(0, 4);

    // ── Title + subtitle ──
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Preparation Plan', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text(
        `Sequenced next steps tailored to a ${spec.name} direction.`,
        x,
        y + 18,
        { width: w, lineBreak: false },
      );

    // ── Numbered timeline ──
    const tileSize = 24;
    const tileGap = 14; // gap from tile to text
    const itemGap = 12; // vertical gap between items
    const textFontSize = 10;
    const tileCenterX = x + tileSize / 2;
    const textX = x + tileSize + tileGap;
    const textW = w - (textX - x) - 4;

    let curY = y + 42;

    items.forEach((item, i) => {
      // Measure item text to determine row height
      this.doc.font(this.FONT_REGULAR).fontSize(textFontSize);
      const textH = this.doc.heightOfString(item, {
        width: textW,
        lineGap: 1,
      });
      const rowH = Math.max(tileSize, textH);

      // Connector line above (skip for first item)
      if (i > 0) {
        this.doc
          .save()
          .lineWidth(2)
          .strokeColor(spec.accent)
          .moveTo(tileCenterX, curY - itemGap)
          .lineTo(tileCenterX, curY)
          .stroke()
          .restore();
      }

      // Tile (vertically centered to row)
      const tileY = curY + (rowH - tileSize) / 2;
      this.doc.save();
      this.doc.roundedRect(x, tileY, tileSize, tileSize, 6).fill(spec.accent);
      this.doc.restore();

      // Number "01", "02", …
      const numStr = String(i + 1).padStart(2, '0');
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10)
        .fillColor(spec.accentOn)
        .text(numStr, x, tileY + 7, {
          width: tileSize,
          align: 'center',
          lineBreak: false,
        });

      // Item text (vertically centered to row)
      const itemTextY = curY + (rowH - textH) / 2;
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(textFontSize)
        .fillColor(this.C_INK)
        .text(item, textX, itemTextY, { width: textW, lineGap: 1 });

      curY += rowH + itemGap;
    });

    return curY - itemGap + 4;
  }

  private drawDisclaimer(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const text =
      'This short report is a quick summary and should support, not replace, your final specialization decision. ' +
      'Please refer to the full Origin BI MBA report for detailed indicator interpretations, role comparisons, and next steps.';

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Disclaimer', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor('#3A3A46')
      .text(text, x, y + 16, { width: w, lineGap: 1.2 });

    return y + 48;
  }

  // Helpers ────────────────────────────────────────────────────────────────

  private topReadinessKeys(count: number): ReadinessKey[] {
    return [...READINESS_ORDER]
      .sort((a, b) => this.readinessPct[b] - this.readinessPct[a])
      .slice(0, count);
  }

  private bottomReadinessKeys(count: number): ReadinessKey[] {
    return [...READINESS_ORDER]
      .sort((a, b) => this.readinessPct[a] - this.readinessPct[b])
      .slice(0, count);
  }

  private topReadinessLabels(count: number): string {
    return this.joinReadable(
      this.topReadinessKeys(count).map((k) => READINESS_LABEL[k].toLowerCase()),
    );
  }

  private bottomReadinessLabels(count: number): string {
    return this.joinReadable(
      this.bottomReadinessKeys(count).map((k) =>
        READINESS_LABEL[k].toLowerCase(),
      ),
    );
  }

  private joinReadable(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  }

  private firstName(full: string | undefined): string {
    if (!full) return 'The student';
    const first = full.trim().split(/\s+/)[0];
    return first || 'The student';
  }

  private cleanLabel(value: string): string {
    return String(value || '')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Draws a translucent target/bullseye emblem centered at (cx, cy).
   * Universal "top pick" mark - same shape regardless of specialization.
   *
   * Geometry: 3 concentric rings (outer/middle stroked, inner filled) plus
   * 4 short crosshair tick marks extending just past the outer ring.
   *
   * @param cx       center x
   * @param cy       center y
   * @param r        outer radius
   * @param color    stroke/fill color (hex)
   * @param opacity  0..1 (use ~0.3-0.4 for a watermark - thin strokes need
   *                 slightly higher opacity than filled blobs to read)
   */
  private drawTargetIcon(
    cx: number,
    cy: number,
    r: number,
    color: string,
    opacity: number,
  ): void {
    this.doc.save();
    this.doc.strokeOpacity(opacity).fillOpacity(opacity);
    this.doc.strokeColor(color).fillColor(color);

    const ringW = Math.max(1.5, r * 0.12);
    this.doc.lineWidth(ringW);

    // Outer ring
    this.doc.circle(cx, cy, r).stroke();
    // Middle ring (≈ 65% radius)
    this.doc.circle(cx, cy, r * 0.62).stroke();
    // Inner filled dot (≈ 22% radius)
    this.doc.circle(cx, cy, r * 0.22).fill();

    // Crosshair ticks - short marks just outside the outer ring on the 4
    // cardinal axes, giving the bullseye a "scope" feel.
    const tickGap = r * 0.12;
    const tickLen = r * 0.28;
    const tickStart = r + tickGap;
    const tickEnd = tickStart + tickLen;
    this.doc.lineWidth(ringW * 0.9);
    // Top
    this.doc
      .moveTo(cx, cy - tickStart)
      .lineTo(cx, cy - tickEnd)
      .stroke();
    // Bottom
    this.doc
      .moveTo(cx, cy + tickStart)
      .lineTo(cx, cy + tickEnd)
      .stroke();
    // Left
    this.doc
      .moveTo(cx - tickStart, cy)
      .lineTo(cx - tickEnd, cy)
      .stroke();
    // Right
    this.doc
      .moveTo(cx + tickStart, cy)
      .lineTo(cx + tickEnd, cy)
      .stroke();

    this.doc.restore();
    // Reset opacity for subsequent draws.
    this.doc.fillOpacity(1).strokeOpacity(1);
  }
}
