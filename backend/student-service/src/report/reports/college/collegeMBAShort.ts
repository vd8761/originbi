import * as fs from 'fs';
import * as path from 'path';
import { AgileScore, CollegeData } from '../../types/types';
import { BaseReport } from '../BaseReport';
import { logger } from '../../helpers/logger';
import {
  CareerRoleData,
  getCareerGuidanceByTrait,
} from '../../helpers/sqlHelper';
import {
  ALIGNMENT_MULTIPLIER,
  BEHAVIORAL_ORIENTATION,
  BehavioralAlignment,
  DISC_ALIGNMENT,
  FitLevel,
  fitLevelFromScore,
  fitLevelStyle,
  READINESS_LABEL,
  READINESS_ORDER,
  ReadinessKey,
  readinessBand,
  SPECIALIZATIONS,
  SPECIALIZATION_ORDER,
  SPEC_WEIGHTS,
  SpecializationCode,
  SpecializationMeta,
} from './mbaConstants';

type DiscTrait = 'D' | 'I' | 'S' | 'C';

interface SpecRanking {
  code: SpecializationCode;
  meta: SpecializationMeta;
  readinessScore: number;
  alignment: BehavioralAlignment;
  finalScore: number;
  fit: FitLevel;
  rank: number;
}

/**
 * Origin BI MBA SpecFit — 2-page short report.
 *
 * Page 1: Profile snapshot + recommended specialization
 * Page 2: All-5 ranking, strengths/development, career chips, preparation plan
 *
 * Uses the same page frame + header + footer system as
 * {@link ../college/collegeShortReport.ts CollegeShortReport}.
 */
export class CollegeMBAShortReport extends BaseReport {
  private data: CollegeData;
  private careerGuidance: CareerRoleData[] = [];

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

  constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info('[MBA Short REPORT] Starting PDF Generation...');
    this.computeProfile();
    await this.preloadCareerGuidance();

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

  // ────────────────────────────────────────────────────────────────────────
  //  Computation
  // ────────────────────────────────────────────────────────────────────────

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

    const ranked: SpecRanking[] = SPECIALIZATION_ORDER.map((code) => {
      const meta = SPECIALIZATIONS[code];
      const weights = SPEC_WEIGHTS[code];
      let weighted = 0;
      let sumW = 0;
      READINESS_ORDER.forEach((k) => {
        weighted += this.readinessPct[k] * weights[k];
        sumW += weights[k];
      });
      const readinessScore = sumW > 0 ? weighted / sumW : 0;
      const alignment = DISC_ALIGNMENT[primary][code];
      const finalScore = readinessScore * ALIGNMENT_MULTIPLIER[alignment];
      return {
        code,
        meta,
        readinessScore,
        alignment,
        finalScore,
        fit: fitLevelFromScore(finalScore),
        rank: 0,
      };
    });
    ranked.sort((a, b) => b.finalScore - a.finalScore);
    ranked.forEach((r, i) => (r.rank = i + 1));
    this.rankings = ranked;
    this.recommendedSpec = ranked[0].meta;

    this.declaredTrack = this.detectDeclaredTrack();
  }

  /**
   * Agile scores are documented as /25; some pipelines may already convert
   * to 0-100. Auto-detect: anything >25 is treated as already a percentage.
   */
  private normalizeScore(raw: unknown): number {
    const v = Number(raw) || 0;
    if (v <= 0) return 0;
    const pct = v > 25 ? v : (v / 25) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  /**
   * Detects a declared MBA specialization-of-study from dept_code/group_name.
   * Returns the specialization name if it does NOT match the recommendation,
   * else null. Used for the soft mismatch note on page 1.
   */
  private detectDeclaredTrack(): string | null {
    const haystack =
      `${this.data.dept_code || ''} ${this.data.group_name || ''}`.toUpperCase();
    const map: { keys: string[]; name: string; code: SpecializationCode }[] = [
      { keys: ['FINANCE', 'FIN'], name: 'Finance', code: 'FIN' },
      { keys: ['HUMAN RESOURCE', 'HR'], name: 'Human Resources', code: 'HR' },
      {
        keys: ['BUSINESS ANALYTIC', 'ANALYTICS', 'BA '],
        name: 'Business Analytics',
        code: 'BA',
      },
      { keys: ['OPERATION', 'OPS '], name: 'Operations', code: 'OPS' },
      { keys: ['MARKETING', 'MKT '], name: 'Marketing', code: 'MKT' },
    ];
    for (const entry of map) {
      if (entry.keys.some((k) => haystack.includes(k))) {
        return entry.code === this.recommendedSpec.code ? null : entry.name;
      }
    }
    return null;
  }

  private async preloadCareerGuidance(): Promise<void> {
    const traitCode = `${this.primaryTrait}${this.secondaryTrait}`;
    try {
      this.careerGuidance = await getCareerGuidanceByTrait(
        traitCode,
        this.data.department_deg_id,
      );
    } catch (err) {
      logger.warn(
        '[MBA Short REPORT] Failed to fetch career guidance data.',
        err,
      );
      this.careerGuidance = [];
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Page rendering
  // ────────────────────────────────────────────────────────────────────────

  private renderPageOne(): void {
    this._useStdMargins = false;
    this._currentBackground = null;
    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawHeroRecommendationCard(y + 14);
    y = this.drawReadinessProfile(y + 16);
    this.drawWhyRecommendation(y + 14);

    this.drawFooterStrip(1);
  }

  private renderPageTwo(): void {
    this._useStdMargins = false;
    this._currentBackground = null;
    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawSpecializationRanking(y + 14);
    y = this.drawStrengthsAndDevelopment(y + 12);
    y = this.drawCareerChips(y + 12);
    y = this.drawPreparationPlan(y + 10);
    this.drawDisclaimer(y + 8);

    this.drawFooterStrip(2);
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Page frame, header, footer (mirrors collegeShortReport.ts)
  // ────────────────────────────────────────────────────────────────────────

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

  private drawHeader(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('MBA Specialization Snapshot', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(20)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Origin BI MBA SpecFit', x, y + 14, {
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

    const dateStr = this.data.exam_start
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
      .text(`${this.data.email_id || ''}   •   ${dateStr}`, metaX, y + 34, {
        width: metaW,
        align: 'right',
        lineBreak: false,
      });

    this.doc
      .lineWidth(0.6)
      .strokeColor(this.C_RULE)
      .moveTo(x, y + 52)
      .lineTo(x + w, y + 52)
      .stroke();

    return y + 52;
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

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Origin BI', x, y + 8, { lineBreak: false });

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

  // ────────────────────────────────────────────────────────────────────────
  //  Page 1 sections
  // ────────────────────────────────────────────────────────────────────────

  private drawHeroRecommendationCard(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 132;
    const spec = this.recommendedSpec;
    const topRank = this.rankings[0];
    const fitStyle = fitLevelStyle(topRank.fit);

    // Card frame
    this.doc.save();
    this.doc.roundedRect(x, y, w, h, 10).fill(spec.accentSoft);
    this.doc.restore();
    this.doc
      .lineWidth(1.2)
      .strokeColor(spec.accent)
      .roundedRect(x, y, w, h, 10)
      .stroke();

    // Left accent bar
    this.doc.save();
    this.doc.rect(x, y, 6, h).fill(spec.accent);
    this.doc.restore();

    const innerX = x + 22;
    const innerY = y + 18;

    // Eyebrow
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9.5)
      .fillColor(spec.accent)
      .text('BEST-FIT MBA SPECIALIZATION', innerX, innerY, {
        characterSpacing: 0.6,
        lineBreak: false,
      });

    // Specialization name (large)
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(28)
      .fillColor(this.C_INK)
      .text(spec.name, innerX, innerY + 14, {
        width: w * 0.55,
        lineBreak: false,
        ellipsis: true,
      });

    // Fit Level pill
    this.drawPill(
      innerX,
      innerY + 54,
      topRank.fit,
      fitStyle.bg,
      fitStyle.fg,
      fitStyle.dot,
    );

    // Right column: behavioral orientation
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

    // One-liner reason at card bottom
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

    READINESS_ORDER.forEach((key, i) => {
      const rowY = barsY + i * rowH;
      const pct = this.readinessPct[key];
      const band = readinessBand(pct);

      // Label
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor(this.C_INK)
        .text(READINESS_LABEL[key], x, rowY + 4, {
          width: labelW,
          lineBreak: false,
          ellipsis: true,
        });

      // Track
      this.doc.save();
      this.doc.roundedRect(barX, rowY + 8, barW, 10, 5).fill('#ECECF1');
      this.doc.restore();

      // Fill
      const fillW = Math.max(4, (pct / 100) * barW);
      this.doc.save();
      this.doc.roundedRect(barX, rowY + 8, fillW, 10, 5).fill(band.color);
      this.doc.restore();

      // Value + band label
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
      .text(paragraph, x, y + 22, { width: w, lineGap: 2 });

    const textH = this.doc.heightOfString(paragraph, { width: w, lineGap: 2 });
    return y + 22 + textH;
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Page 2 sections
  // ────────────────────────────────────────────────────────────────────────

  private drawSpecializationRanking(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('All 5 Specializations — Suitability Ranking', x, y, {
        lineBreak: false,
      });

    const headerY = y + 24;
    const rowH = 42;
    const cols = [
      { label: 'Rank', w: 44, align: 'center' as const },
      { label: 'Specialization', w: 140, align: 'left' as const },
      { label: 'Fit', w: 110, align: 'left' as const },
      { label: 'Reason', w: w - 44 - 140 - 110, align: 'left' as const },
    ];

    // Header row
    this.doc.save();
    this.doc.rect(x, headerY, w, 22).fill('#F0F0F6');
    this.doc.restore();
    let cx = x;
    cols.forEach((c) => {
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9.5)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(c.label, cx + 8, headerY + 6, {
          width: c.w - 16,
          align: c.align,
          lineBreak: false,
        });
      cx += c.w;
    });

    // Rows
    this.rankings.forEach((r, i) => {
      const rowY = headerY + 22 + i * rowH;
      const isRecommended = r.rank === 1;

      if (isRecommended) {
        this.doc.save();
        this.doc.rect(x, rowY, w, rowH).fill(r.meta.accentSoft);
        this.doc.restore();
      } else if (i % 2 === 1) {
        this.doc.save();
        this.doc.rect(x, rowY, w, rowH).fill('#FAFAFD');
        this.doc.restore();
      }

      // Bottom rule
      this.doc
        .lineWidth(0.4)
        .strokeColor(this.C_RULE)
        .moveTo(x, rowY + rowH)
        .lineTo(x + w, rowY + rowH)
        .stroke();

      cx = x;
      // Rank
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(12)
        .fillColor(isRecommended ? r.meta.accent : this.C_INK)
        .text(`${r.rank}`, cx, rowY + 14, {
          width: cols[0].w,
          align: 'center',
          lineBreak: false,
        });
      cx += cols[0].w;

      // Specialization name
      this.doc
        .font(isRecommended ? this.FONT_SORA_BOLD : this.FONT_SORA_SEMIBOLD)
        .fontSize(10.5)
        .fillColor(this.C_INK)
        .text(r.meta.name, cx + 8, rowY + 15, {
          width: cols[1].w - 16,
          lineBreak: false,
          ellipsis: true,
        });
      cx += cols[1].w;

      // Fit pill (inline mini)
      const fStyle = fitLevelStyle(r.fit);
      this.drawInlineFitChip(cx + 8, rowY + 13, r.fit, fStyle);
      cx += cols[2].w;

      // Reason
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8.5)
        .fillColor(this.C_INK)
        .text(r.meta.reasonOnePager, cx + 8, rowY + 12, {
          width: cols[3].w - 16,
        });
    });

    return headerY + 22 + this.rankings.length * rowH;
  }

  private drawInlineFitChip(
    x: number,
    y: number,
    label: string,
    style: { bg: string; fg: string; dot: string },
  ): void {
    this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8.8);
    const textW = this.doc.widthOfString(label);
    const padX = 8;
    const dotR = 2.6;
    const dotGap = 5;
    const chipW = textW + padX * 2 + dotR * 2 + dotGap;
    const chipH = 16;
    this.doc.save();
    this.doc.roundedRect(x, y, chipW, chipH, chipH / 2).fill(style.bg);
    this.doc.restore();
    this.doc.circle(x + padX + dotR, y + chipH / 2, dotR).fill(style.dot);
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8.8)
      .fillColor(style.fg)
      .text(label, x + padX + dotR * 2 + dotGap, y + 4, {
        width: textW + 4,
        lineBreak: false,
      });
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

    const drawItem = (
      colX: number,
      idx: number,
      titleText: string,
      bodyText: string,
      accent: string,
    ) => {
      const itemY = itemsY + idx * 42;
      this.doc.save();
      this.doc.rect(colX, itemY + 4, 3, 22).fill(accent);
      this.doc.restore();
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10.2)
        .fillColor(this.C_INK)
        .text(titleText, colX + 10, itemY + 2, {
          width: colW - 12,
          lineBreak: false,
          ellipsis: true,
        });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(this.C_MUTED)
        .text(bodyText, colX + 10, itemY + 16, {
          width: colW - 12,
          lineGap: 1,
        });
    };

    strengths.forEach((k, i) => {
      drawItem(x, i, READINESS_LABEL[k], strengthExplain[k], '#2E7D32');
    });
    dev.forEach((k, i) => {
      drawItem(
        x + colW + colGap,
        i,
        READINESS_LABEL[k],
        devExplain[k],
        '#ED6C02',
      );
    });

    const usedRows = Math.max(strengths.length, dev.length);
    return itemsY + usedRows * 42;
  }

  private drawCareerChips(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const spec = this.recommendedSpec;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Suitable Career Paths', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text(`Roles aligned with the ${spec.name} specialization.`, x, y + 18, {
        width: w,
        lineBreak: false,
      });

    // Pick up to 7 roles: prefer DB roles, fall back to default list
    const dbRoles = this.careerGuidance
      .map((r) => this.cleanLabel(r.roleName))
      .filter(Boolean);
    const pool = dbRoles.length > 0 ? dbRoles : spec.defaultRoles;
    const roles = pool.slice(0, 7);

    const chipY = y + 40;
    let cursorX = x;
    let cursorY = chipY;
    const chipH = 22;
    const chipPadX = 12;
    const chipGap = 8;

    roles.forEach((role) => {
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(9.5);
      const textW = this.doc.widthOfString(role);
      const chipW = textW + chipPadX * 2;
      if (cursorX + chipW > x + w) {
        cursorX = x;
        cursorY += chipH + chipGap;
      }
      this.doc.save();
      this.doc
        .roundedRect(cursorX, cursorY, chipW, chipH, chipH / 2)
        .fill(spec.accentSoft);
      this.doc.restore();
      this.doc
        .lineWidth(0.6)
        .strokeColor(spec.accent)
        .roundedRect(cursorX, cursorY, chipW, chipH, chipH / 2)
        .stroke();
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9.5)
        .fillColor(spec.accent)
        .text(role, cursorX + chipPadX, cursorY + 6, {
          width: textW + 4,
          lineBreak: false,
        });
      cursorX += chipW + chipGap;
    });

    return cursorY + chipH;
  }

  private drawPreparationPlan(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const spec = this.recommendedSpec;
    const padX = 14;
    const padY = 12;

    const titleH = 18;
    const items = spec.preparation.slice(0, 4);

    this.doc.font(this.FONT_REGULAR).fontSize(9.5);
    let bodyH = 0;
    items.forEach((it) => {
      bodyH += this.doc.heightOfString(it, { width: w - padX * 2 - 18 }) + 6;
    });
    const blockH = padY * 2 + titleH + bodyH + 2;

    this.doc.save();
    this.doc.roundedRect(x, y, w, blockH, 8).fill(this.C_SUBTLE_BG);
    this.doc.restore();
    this.doc
      .lineWidth(0.6)
      .strokeColor('#E2E2EC')
      .roundedRect(x, y, w, blockH, 8)
      .stroke();

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(12)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Preparation Plan', x + padX, y + padY, { lineBreak: false });

    let curY = y + padY + titleH + 2;
    items.forEach((it) => {
      this.doc.circle(x + padX + 4, curY + 6, 2.2).fill(spec.accent);
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor(this.C_INK)
        .text(it, x + padX + 16, curY, { width: w - padX * 2 - 18 });
      curY = this.doc.y + 4;
    });

    return y + blockH;
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

  // ────────────────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────────────────

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
}
