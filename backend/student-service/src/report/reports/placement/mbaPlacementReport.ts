// reports/placement/mbaPlacementReport.ts

import * as fs from 'fs';
import { BaseReport } from '../BaseReport';
import { MBAPlacementData, MBAStudentRow } from '../../types/placementTypes';
import {
  DISC_COLORS,
  DISC_TEXT_COLORS,
  TABLE_STYLES,
} from './placementConstants';
import { FIT_BANDS, MBA_PLACEMENT_CONTENT } from './mbaPlacementConstants';
import {
  BEHAVIORAL_ORIENTATION,
  DiscTrait,
  normalizeReadiness,
  rankSpecializations,
  READINESS_LABEL,
  READINESS_ORDER,
  ReadinessKey,
  SPECIALIZATIONS,
  SPECIALIZATION_ORDER,
  SpecializationCode,
  SpecRanking,
} from '../college/mbaConstants';
import { logger } from '../../helpers/logger';

/** A single student with their computed specialization ranking. */
interface ScoredStudent {
  row: MBAStudentRow;
  primaryTrait: DiscTrait;
  readinessPct: Record<ReadinessKey, number>;
  rankings: SpecRanking[];
  bestFit: SpecRanking;
  secondFit: SpecRanking;
  behavioralOrientation: string;
}

const DEPLOY_READY_FITS = new Set(['Excellent Fit', 'Good Fit']);

/**
 * MBAPlacementReport
 * ------------------
 * Department-level placement handbook for an MBA cohort. Reuses the placement
 * report scaffolding (cover, TOC, executive summary, looped sections, closing
 * pages) but organizes students by best-fit MBA specialization rather than by
 * DISC blended style, using the shared mbaConstants scoring.
 */
export class MBAPlacementReport extends BaseReport {
  private data: MBAPlacementData;
  private students: ScoredStudent[] = [];
  private buckets: Record<SpecializationCode, ScoredStudent[]> = {
    FIN: [],
    HR: [],
    BA: [],
    OPS: [],
    MKT: [],
  };

  constructor(data: MBAPlacementData) {
    super();
    this.data = data;
    if (this.data.exam_ref_no) {
      this.data.exam_ref_no = this.data.exam_ref_no.replace(
        'COLLEGE_STUDENT',
        'CS',
      );
    }
    this.scoreCohort();
  }

  // ── Scoring ────────────────────────────────────────────────────────────────

  /** Mirrors collegeMBAShort.computeProfile per student, then buckets by best fit. */
  private scoreCohort(): void {
    const validTraits = new Set<DiscTrait>(['D', 'I', 'S', 'C']);

    this.students = (this.data.students || []).map((row) => {
      const a = row.agile_score || ({} as MBAStudentRow['agile_score']);
      const readinessPct: Record<ReadinessKey, number> = {
        commitment: normalizeReadiness(a.Commitment),
        focus: normalizeReadiness(a.Focus),
        openness: normalizeReadiness(a.Openness),
        respect: normalizeReadiness(a.Respect),
        courage: normalizeReadiness(a.Courage),
      };

      const code = (row.trait_code || 'D').toUpperCase();
      const primaryTrait = (
        validTraits.has(code[0] as DiscTrait) ? code[0] : 'D'
      ) as DiscTrait;
      const secondaryChar =
        code[1] && validTraits.has(code[1] as DiscTrait) ? code[1] : '';

      const behavioralOrientation =
        BEHAVIORAL_ORIENTATION[`${primaryTrait}${secondaryChar}`] ||
        BEHAVIORAL_ORIENTATION[primaryTrait] ||
        'Balanced Professional';

      const rankings = rankSpecializations(readinessPct, primaryTrait);

      return {
        row,
        primaryTrait,
        readinessPct,
        rankings,
        bestFit: rankings[0],
        secondFit: rankings[1],
        behavioralOrientation,
      };
    });

    for (const s of this.students) {
      this.buckets[s.bestFit.code].push(s);
    }
    // Sort each bucket by suitability score descending.
    SPECIALIZATION_ORDER.forEach((code) => {
      this.buckets[code].sort(
        (x, y) => y.bestFit.finalScore - x.bestFit.finalScore,
      );
    });
  }

  // ── Generation ───────────────────────────────────────────────────────────

  public async generate(outputPath: string): Promise<void> {
    logger.info('[MBA PLACEMENT REPORT] Starting Generation...');
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // 1. Cover
    this.generateCoverPage();

    // 2. Table of Contents
    this._currentBackground = 'public/assets/images/Content_Background.jpg';
    this._useStdMargins = false;
    this.doc.addPage();
    this.generateTableOfContents();

    // 3. Executive Summary onwards (standard margins + watermark background)
    this._currentBackground = 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    this.doc.addPage();
    this.generateExecutiveSummary();

    // 4. Per-specialization sections
    SPECIALIZATION_ORDER.forEach((code) => {
      if (this.buckets[code].length > 0) {
        this.generateSpecializationSection(code);
      }
    });

    // 5. Cross-cutting placement priorities
    this.generatePlacementPriorities();

    // 6. Closing pages
    this.generateClosingPages();

    this.addFooters(this.data.exam_ref_no || '');

    this.doc.end();
    await streamFinished;
    logger.info('[MBA PLACEMENT REPORT] PDF Generated.');
  }

  // ── Cover ──────────────────────────────────────────────────────────────────

  private generateCoverPage(): void {
    const bgPath = 'public/assets/images/Handbook_Cover_Default.jpg';
    if (fs.existsSync(bgPath)) {
      this.doc.image(bgPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    } else {
      this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#f0f0f0');
    }

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(38)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.data.report_title || 'MBA Placement Handbook', 35, 30, {
        width: this.PAGE_WIDTH - 100,
        align: 'left',
      });

    // Vertical reference number
    this.doc.save();
    this.doc.translate(this.PAGE_WIDTH - 47, 150);
    this.doc.rotate(-90, { origin: [0, 0] });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor(this.COLOR_BLACK)
      .opacity(0.4)
      .text(this.data.exam_ref_no || '', 0, 0);
    this.doc.restore();

    const footerY = this.PAGE_HEIGHT - 90;
    this.doc.opacity(1);
    this.doc
      .font(this.FONT_SEMIBOLD)
      .fontSize(20)
      .fillColor(this.COLOR_BLACK)
      .text(MBA_PLACEMENT_CONTENT.cover_label, 35, footerY);

    const dateString = new Date(this.data.exam_start_date).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(16)
      .text(dateString, 35, footerY + 25);

    // Right-aligned degree + department name
    this.doc.font(this.FONT_SORA_BOLD).fontSize(22);
    const nameWidthLimit = 300;
    // Avoid "MBA MBA (...)" when the department name already starts with the
    // degree type (e.g. degree_type="MBA", department_name="MBA (Master...)").
    const deptUpper = (this.data.department_name || '').toUpperCase();
    const degreeUpper = (this.data.degree_type || '').toUpperCase();
    const rawName =
      degreeUpper && deptUpper.startsWith(degreeUpper)
        ? this.data.department_name
        : `${this.data.degree_type} ${this.data.department_name}`;
    const nameText = this.getSmartSplitName(rawName, nameWidthLimit);
    const nameOptions = { width: nameWidthLimit + 20, align: 'right' as const };
    const nameX = this.PAGE_WIDTH - nameWidthLimit - 35 - 20;
    const nameBaseY = footerY + 20;
    const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
    const singleLineHeight = this.doc.heightOfString('M', nameOptions);
    const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);
    this.doc
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(nameText, nameX, adjustedNameY, nameOptions);
  }

  // ── Table of Contents ───────────────────────────────────────────────────────

  private generateTableOfContents(): void {
    const headerX = 15 * this.MM;
    const circleCenterX = 25 * this.MM;
    const bottomLimit = this.PAGE_HEIGHT - 30 * this.MM;

    this.h1(MBA_PLACEMENT_CONTENT.toc_title, {
      x: headerX,
      y: headerX,
      fontSize: 38,
    });

    let currentY = 45 * this.MM;
    const tocItemsGap = 9;

    const specItems = SPECIALIZATION_ORDER.filter(
      (code) => this.buckets[code].length > 0,
    ).map((code) => `${SPECIALIZATIONS[code].name} Specialization`);

    const tocItems = [
      MBA_PLACEMENT_CONTENT.executive_summary_title,
      ...specItems,
      MBA_PLACEMENT_CONTENT.priorities_title,
    ];

    tocItems.forEach((item, index) => {
      if (currentY > bottomLimit) {
        this.doc.addPage();
        this.h1(MBA_PLACEMENT_CONTENT.toc_title, {
          x: headerX,
          y: headerX,
          fontSize: 38,
        });
        currentY = 45 * this.MM;
      }

      const circleY = currentY + 5 * this.MM;
      this.doc
        .lineWidth(0.4 * this.MM)
        .strokeColor(this.COLOR_BRIGHT_GREEN)
        .circle(circleCenterX, circleY, 5 * this.MM)
        .stroke();

      this.renderTextBase((index + 1).toString(), {
        x: 20 * this.MM,
        y: circleY - 7,
        width: 10 * this.MM,
        align: 'center',
        font: this.FONT_SORA_REGULAR,
        fontSize: 12,
        color: this.COLOR_DEEP_BLUE,
      });

      this.renderTextBase(item, {
        x: 35 * this.MM,
        y: currentY + 1.5 * this.MM,
        width: this.PAGE_WIDTH - 60 * this.MM,
        font: this.FONT_SORA_SEMIBOLD,
        fontSize: 16,
        color: this.COLOR_BLACK,
      });

      currentY = this.doc.y + tocItemsGap * this.MM;
    });
  }

  // ── Executive Summary ────────────────────────────────────────────────────────

  private generateExecutiveSummary(): void {
    this.h1(MBA_PLACEMENT_CONTENT.executive_summary_title);
    this.pHtml(
      MBA_PLACEMENT_CONTENT.executive_summary_text(this.data.total_students),
      { fontSize: 12, font: this.FONT_REGULAR, align: 'justify' },
    );
    this.doc.moveDown(0.5);

    // 1. Specialization distribution radar (5 axes)
    this.h2(MBA_PLACEMENT_CONTENT.spec_chart_title);
    const chartData = SPECIALIZATION_ORDER.reduce(
      (acc, code) => {
        acc[SPECIALIZATIONS[code].name] = this.buckets[code].length;
        return acc;
      },
      {} as Record<string, number>,
    );
    const maxCount = Math.max(...Object.values(chartData), 1);
    // Center the radar below the title: top vertex + label must clear the h2,
    // so push the center down by the radius plus a label margin.
    const radarRadius = 105;
    this.drawRadarChart(chartData, {
      radius: radarRadius,
      maxValue: maxCount + 2,
      y: this.doc.y + radarRadius + 26,
    });
    this.doc.moveDown(1);
    this.pHtml(MBA_PLACEMENT_CONTENT.spec_chart_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });

    // Specialization summary — placement-handbook "grid" style: each
    // specialization is a colored header (its own accent), with the best-fit
    // headcount in a single row beneath.
    this.doc.moveDown(0.5);
    const specHeaders = SPECIALIZATION_ORDER.map(
      (c) => SPECIALIZATIONS[c].name,
    );
    const specHeaderColors = SPECIALIZATION_ORDER.map(
      (c) => this.SPEC_HEADER_COLOR[c],
    );
    const specCountRow = SPECIALIZATION_ORDER.map(
      (c) => this.buckets[c].length,
    );
    this.table(specHeaders, [specCountRow], {
      headerFontSize: 8.5,
      fontSize: 15,
      headerHeight: 38,
      rowHeight: 30,
      verticalAlign: 'middle',
      headerVerticalAlign: 'middle',
      headerFont: this.FONT_BOLD,
      font: this.FONT_SORA_BOLD,
      headerColor: specHeaderColors,
      headerTextColor: '#FFFFFF',
      borderColor: '#000000',
      borderWidth: 1,
      rowColor: '#FFFFFF',
      rowTextColor: '#1B1B27',
      headerAlign: 'center',
      rowAlign: 'center',
      colWidths: SPECIALIZATION_ORDER.map(() => 'fill'),
    });

    // 2. Placement-readiness band split
    this.h2(MBA_PLACEMENT_CONTENT.readiness_band_title);
    const bandCounts = FIT_BANDS.map(
      (b) => this.students.filter((s) => s.bestFit.fit === b.level).length,
    );
    const bandRows = FIT_BANDS.map((b, i) => ({
      type: 'row' as const,
      data: [b.level, bandCounts[i], b.meaning],
      fill: b.color,
    }));
    this.table(['Fit Band', 'Students', 'What it means'], bandRows, {
      headerFontSize: 9,
      fontSize: 9,
      headerHeight: 20,
      rowHeight: 24,
      verticalAlign: 'middle',
      headerFont: this.FONT_BOLD,
      font: this.FONT_SEMIBOLD,
      headerTextColor: TABLE_STYLES.headerTextColor,
      borderColor: TABLE_STYLES.borderColor,
      headerColor: TABLE_STYLES.headerColor,
      colWidths: ['fit', 'fit', 'fill'],
      headerAlign: ['left', 'center', 'left'],
      rowAlign: ['left', 'center', 'left'],
    });
    this.pHtml(MBA_PLACEMENT_CONTENT.readiness_band_description, {
      fontSize: 8,
      color: '#58595b',
      font: this.FONT_ITALIC,
    });

    // 3. Behavioral orientation mix
    this.h2(MBA_PLACEMENT_CONTENT.behavioral_mix_title);
    this.drawBehavioralMix(this.countByTrait(this.students));
  }

  // ── Per-specialization section ────────────────────────────────────────────────

  private generateSpecializationSection(code: SpecializationCode): void {
    const spec = SPECIALIZATIONS[code];
    const bucket = this.buckets[code];

    this.h1(`${spec.name} Specialization`, { ensureSpace: 0.35 });
    this.p(spec.reasonOnePager);
    this.list(
      spec.bestSuitedFor.map((b) => b),
      { indent: 20, gap: 4 },
    );

    // Student roster - explicit subtitle so the section's "first choice = this
    // specialization" is unmistakable.
    this.h2(`Students Best Suited Here (${bucket.length})`);
    this.p(
      `${spec.name} is the top-ranked specialization for these students. The "Also a Strong Fit" column shows the next specialization where their profile also aligns well.`,
      { fontSize: 9, color: '#58595b', font: this.FONT_ITALIC, align: 'left' },
    );
    const rosterRows = bucket.map((s, i) => [
      i + 1,
      this.studentLabel(s.row),
      s.bestFit.fit,
      Math.round(s.bestFit.finalScore),
      s.behavioralOrientation,
      s.secondFit.meta.name,
    ]);
    this.table(
      [
        'S.No',
        'Student',
        'Fit Level',
        'Score',
        'Working Style',
        'Also a Strong Fit',
      ],
      rosterRows,
      {
        headerFontSize: 8,
        fontSize: 9,
        headerHeight: 22,
        rowHeight: 26,
        verticalAlign: 'middle',
        headerFont: this.FONT_BOLD,
        font: this.FONT_SEMIBOLD,
        headerTextColor: TABLE_STYLES.headerTextColor,
        borderColor: TABLE_STYLES.borderColor,
        headerColor: TABLE_STYLES.headerColor,
        rowColor: TABLE_STYLES.rowColor,
        rowTextColor: TABLE_STYLES.rowTextColor,
        alternateRowColor: TABLE_STYLES.alternateRowColor,
        colWidths: ['fit', 'fill', 'fit', 'fit', 'fit', 'fit'],
        headerAlign: ['center', 'left', 'center', 'center', 'left', 'left'],
        rowAlign: ['center', 'left', 'center', 'center', 'left', 'left'],
        mergeRepeatedHeaders: true,
      },
    );

    // DISC sub-breakdown (hybrid requirement)
    this.h3('Working Style Mix in this Group');
    this.drawBehavioralMix(this.countByTrait(bucket));

    // Group readiness profile (averages)
    this.h3('Group Readiness Profile');
    const avg = this.averageReadiness(bucket);
    this.drawReadinessBars(avg);

    // Roles + recruiters to target
    this.h2('Roles & Recruiters to Target');
    this.list(
      spec.defaultRoles.map((r) => `<b>${r.name}</b> - ${r.description}`),
      { indent: 20, gap: 4 },
    );

    // Preparation focus
    this.h2('Preparation Focus');
    this.list(spec.preparation, { type: 'number', indent: 20, gap: 4 });
  }

  // ── Cross-cutting placement priorities ────────────────────────────────────────

  private generatePlacementPriorities(): void {
    this.h1(MBA_PLACEMENT_CONTENT.priorities_title, { ensureSpace: 0.35 });

    // Deploy-ready shortlist
    this.h2(MBA_PLACEMENT_CONTENT.deploy_ready_title);
    this.p(MBA_PLACEMENT_CONTENT.deploy_ready_text);
    const deployReady = this.students
      .filter((s) => DEPLOY_READY_FITS.has(s.bestFit.fit))
      .sort((a, b) => b.bestFit.finalScore - a.bestFit.finalScore);
    this.renderShortlistTable(deployReady);

    // Grooming list
    this.h2(MBA_PLACEMENT_CONTENT.grooming_title, { ensureSpace: 0.25 });
    this.p(MBA_PLACEMENT_CONTENT.grooming_text);
    const grooming = this.students
      .filter((s) => !DEPLOY_READY_FITS.has(s.bestFit.fit))
      .sort((a, b) => b.bestFit.finalScore - a.bestFit.finalScore);
    this.renderShortlistTable(grooming);
  }

  private renderShortlistTable(list: ScoredStudent[]): void {
    if (list.length === 0) {
      this.p('No students fall in this category for this cohort.', {
        fontSize: 9,
        color: '#58595b',
        font: this.FONT_ITALIC,
        align: 'left',
      });
      return;
    }
    const rows = list.map((s, i) => [
      i + 1,
      this.studentLabel(s.row),
      s.bestFit.meta.name,
      s.bestFit.fit,
      Math.round(s.bestFit.finalScore),
    ]);
    this.table(
      ['S.No', 'Student', 'Best-Fit Specialization', 'Fit Level', 'Score'],
      rows,
      this.shortlistTableOptions([
        'center',
        'left',
        'left',
        'center',
        'center',
      ]),
    );
  }

  private shortlistTableOptions(rowAlign: ('left' | 'center')[]) {
    // Column widths derived from the column count: the "Student" column (index 1)
    // fills remaining space, every other column fits its content.
    const colWidths = rowAlign.map((_, i) => (i === 1 ? 'fill' : 'fit')) as (
      | 'fit'
      | 'fill'
    )[];
    return {
      headerFontSize: 8,
      fontSize: 9,
      headerHeight: 22,
      rowHeight: 24,
      verticalAlign: 'middle' as const,
      headerFont: this.FONT_BOLD,
      font: this.FONT_SEMIBOLD,
      headerTextColor: TABLE_STYLES.headerTextColor,
      borderColor: TABLE_STYLES.borderColor,
      headerColor: TABLE_STYLES.headerColor,
      rowColor: TABLE_STYLES.rowColor,
      rowTextColor: TABLE_STYLES.rowTextColor,
      alternateRowColor: TABLE_STYLES.alternateRowColor,
      colWidths,
      rowAlign,
      mergeRepeatedHeaders: true,
    };
  }

  // ── Closing pages ─────────────────────────────────────────────────────────────

  private generateClosingPages(): void {
    this.h1('Testimonials', { ensureSpace: 0.35 });
    MBA_PLACEMENT_CONTENT.testimonials.forEach((t) => {
      this.pHtml(`"${t.text}"`, { fontSize: 12, font: this.FONT_ITALIC });
      this.pHtml(t.author, { fontSize: 12, font: this.FONT_REGULAR });
    });

    this.h1(MBA_PLACEMENT_CONTENT.about.title);
    this.pHtml(MBA_PLACEMENT_CONTENT.about.text);

    this.h1(MBA_PLACEMENT_CONTENT.disclaimer.title);
    this.pHtml(MBA_PLACEMENT_CONTENT.disclaimer.text1);
    this.pHtml(MBA_PLACEMENT_CONTENT.disclaimer.text2);

    this.h1(MBA_PLACEMENT_CONTENT.services.title);
    this.list(MBA_PLACEMENT_CONTENT.services.bullets, { indent: 20, gap: 5 });

    this.h1(MBA_PLACEMENT_CONTENT.contact.title);
    this.p(MBA_PLACEMENT_CONTENT.contact.intro);
    this.pHtml(MBA_PLACEMENT_CONTENT.contact.details);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Renders "Full Name" - appending "(phone)" only when two or more students in
   * the cohort share the same full name. The duplicate flag comes from the SQL
   * dedupe check in `getMBAPlacementDetails`.
   */
  private studentLabel(row: MBAStudentRow): string {
    if (row.duplicate_name && row.mobile_number) {
      return `${row.full_name} (${row.mobile_number})`;
    }
    return row.full_name;
  }

  /**
   * Bright, vivid header colors for the specialization summary grid. These are
   * lighter/punchier than the deep `accent` shades used elsewhere so the grid
   * reads clearly with white text (matching the placement-handbook grid style).
   */
  private readonly SPEC_HEADER_COLOR: Record<SpecializationCode, string> = {
    FIN: '#2D5BD0', // bright blue
    HR: '#17A398', // bright teal
    BA: '#7C4DCC', // bright purple
    OPS: '#E07B2E', // bright orange
    MKT: '#D63384', // bright magenta
  };

  /**
   * Plain-language work-style names shown on the cards. These deliberately do
   * NOT expose the underlying assessment framework — they read as placement
   * work styles, not a psychometric model.
   */
  private readonly WORK_STYLE_LABEL: Record<DiscTrait, string> = {
    D: 'Action-Driven',
    I: 'People-Oriented',
    S: 'Supportive',
    C: 'Analytical',
  };

  private countByTrait(students: ScoredStudent[]): Record<DiscTrait, number> {
    const counts: Record<DiscTrait, number> = { D: 0, I: 0, S: 0, C: 0 };
    students.forEach((s) => (counts[s.primaryTrait] += 1));
    return counts;
  }

  /**
   * Renders the DISC behavioral mix as four color-coded cards (one per trait)
   * instead of a flat table — far easier to scan. The count sits inside a
   * colored bubble and each card is labelled with a plain-language work-style
   * name; the underlying assessment framework is intentionally not exposed.
   * The dominant style card is tinted so the group's leading style stands out.
   */
  private drawBehavioralMix(counts: Record<DiscTrait, number>): void {
    const order: DiscTrait[] = ['D', 'I', 'S', 'C'];
    const cardH = 66;
    this.ensureSpace(cardH + 20);

    const x = this.MARGIN_STD;
    const fullW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const gap = 10;
    const cardW = (fullW - gap * 3) / 4;
    const y = this.doc.y + 4;
    const maxCount = Math.max(...order.map((t) => counts[t]));

    order.forEach((t, i) => {
      const cx = x + i * (cardW + gap);
      const color = DISC_COLORS[t] || this.COLOR_DEEP_BLUE;
      const count = counts[t];
      const isDominant = count > 0 && count === maxCount;

      // Card background — dominant style gets a faint tint of its accent color.
      if (isDominant) {
        this.doc.save();
        this.doc.opacity(0.12);
        this.doc.roundedRect(cx, y, cardW, cardH, 10).fill(color);
        this.doc.restore();
      } else {
        this.doc.roundedRect(cx, y, cardW, cardH, 10).fill('#FFFFFF');
      }
      this.doc
        .lineWidth(0.75)
        .roundedRect(cx, y, cardW, cardH, 10)
        .stroke(isDominant ? color : '#E6E6EF');

      // Colored bubble with the student count inside (no framework labels).
      const circR = 16;
      const circCx = cx + cardW / 2;
      const circCy = y + 22;
      this.doc.circle(circCx, circCy, circR).fill(color);
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(16)
        .fillColor(DISC_TEXT_COLORS[t] || '#FFFFFF')
        .text(String(count), cx, circCy - 9, { width: cardW, align: 'center' });

      // Plain-language work-style name.
      this.doc
        .font(this.FONT_SEMIBOLD)
        .fontSize(8.5)
        .fillColor('#1B1B27')
        .text(this.WORK_STYLE_LABEL[t], cx + 4, y + 46, {
          width: cardW - 8,
          align: 'center',
        });
    });

    this.doc.y = y + cardH + 8;
    this.doc.x = this.MARGIN_STD;
  }

  private averageReadiness(
    bucket: ScoredStudent[],
  ): Record<ReadinessKey, number> {
    const sum: Record<ReadinessKey, number> = {
      commitment: 0,
      focus: 0,
      openness: 0,
      respect: 0,
      courage: 0,
    };
    if (bucket.length === 0) return sum;
    bucket.forEach((s) => {
      READINESS_ORDER.forEach((k) => (sum[k] += s.readinessPct[k]));
    });
    READINESS_ORDER.forEach((k) => (sum[k] = sum[k] / bucket.length));
    return sum;
  }

  /** Draws five labeled horizontal readiness bars at the current Y position. */
  private drawReadinessBars(avg: Record<ReadinessKey, number>): void {
    this.ensureSpace(0.22, true);
    const x = this.MARGIN_STD;
    const labelW = 215;
    const barX = x + labelW;
    const barMaxW = this.PAGE_WIDTH - 2 * this.MARGIN_STD - labelW - 44;
    const rowH = 19;
    let y = this.doc.y + 4;

    READINESS_ORDER.forEach((k) => {
      const pct = Math.round(avg[k]);
      this.doc
        .font(this.FONT_SEMIBOLD)
        .fontSize(9)
        .fillColor(this.COLOR_BLACK)
        .text(READINESS_LABEL[k], x, y + 1, { width: labelW - 8 });

      this.doc.roundedRect(barX, y, barMaxW, 10, 5).fill('#ECECF2');
      const w = Math.max(2, (pct / 100) * barMaxW);
      this.doc.roundedRect(barX, y, w, 10, 5).fill(this.COLOR_BRIGHT_GREEN);

      this.doc
        .font(this.FONT_SEMIBOLD)
        .fontSize(9)
        .fillColor(this.COLOR_BLACK)
        .text(`${pct}%`, barX + barMaxW + 6, y + 1, { width: 38 });

      y += rowH;
    });

    this.doc.y = y + 4;
    this.doc.x = this.MARGIN_STD;
  }
}
