// reports/placement/mbaPlacementReport.ts

import * as fs from 'fs';
import { BaseReport, PieSlice } from '../BaseReport';
import { MBAPlacementData, MBAStudentRow } from '../../types/placementTypes';
import { TABLE_STYLES } from './placementConstants';
import { FIT_BANDS, MBA_PLACEMENT_CONTENT } from './mbaPlacementConstants';
import {
  MBACharacter,
  MBA_CHARACTER_ORDER,
  getMBACharacter,
} from './mbaCharacterConstants';
import { ELECTIVES, FitKey } from '../college/specializationConstants';
import {
  BEHAVIORAL_ORIENTATION,
  DiscTrait,
  normalizeReadiness,
  rankSpecializations,
  READINESS_ORDER,
  ReadinessKey,
  SPECIALIZATIONS,
  SPECIALIZATION_ORDER,
  SpecializationCode,
  SpecRanking,
} from '../college/mbaConstants';
import { logger } from '../../helpers/logger';

/** A single student with their resolved character + computed specialization ranking. */
interface ScoredStudent {
  row: MBAStudentRow;
  primaryTrait: DiscTrait;
  /** Resolved 16-character code (2-letter blend or single-letter Pure Trait). */
  characterCode: string;
  character: MBACharacter;
  readinessPct: Record<ReadinessKey, number>;
  rankings: SpecRanking[];
  /**
   * Suitability ranking for the character's primary specialization — the fit
   * shown throughout the report. Organizing by character means the cohort-level
   * specialization (pie, glance table, priorities) is character-driven, while
   * this score captures how ready the student is for that specialization.
   */
  specFit: SpecRanking;
  behavioralOrientation: string;
}

const DEPLOY_READY_FITS = new Set(['Excellent Fit', 'Good Fit']);

/** Maps the level-1 elective keys to this report's specialization codes. */
const ELECTIVE_TO_SPEC: Record<FitKey, SpecializationCode> = {
  hr: 'HR',
  finance: 'FIN',
  marketing: 'MKT',
  operations: 'OPS',
  analytics: 'BA',
};

/** Short column headers for the per-student raw-readiness data table. */
const SHORT_READINESS_LABEL: Record<ReadinessKey, string> = {
  commitment: 'Ownership',
  focus: 'Goal Focus',
  openness: 'Adaptability',
  respect: 'Collaboration',
  courage: 'Confidence',
};

/**
 * MBAPlacementReport
 * ------------------
 * Consolidated MBA placement handbook. The cohort is organized around the
 * platform's 16-character behavioural framework (12 DISC blends + 4 Pure
 * Traits), and every character is given an MBA reading: an MBA persona, the
 * best-fit specialization(s), concrete future roles, recommendations, and the
 * reasoning behind the suggestions (see mbaCharacterConstants).
 *
 * Structure: cover → TOC → executive summary (specialization pie + cohort
 * readiness radar + per-character counts + readiness bands) → one section per
 * present character (persona, roster, role fitment, recommendations, reasoning,
 * and a raw-data table at the end) → cross-cutting placement priorities →
 * closing pages.
 */
export class MBAPlacementReport extends BaseReport {
  private data: MBAPlacementData;
  private students: ScoredStudent[] = [];
  /** Students bucketed by their resolved 16-character code. */
  private characterBuckets: Record<string, ScoredStudent[]> = {};

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

  /** Scores each student's specialization fit, then buckets by 16-character code. */
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

      const character = getMBACharacter(row.trait_code);
      const characterCode = character.code;
      const primaryTrait = (
        validTraits.has(characterCode[0] as DiscTrait)
          ? characterCode[0]
          : 'D'
      ) as DiscTrait;
      const secondaryChar =
        characterCode[1] && validTraits.has(characterCode[1] as DiscTrait)
          ? characterCode[1]
          : '';

      const behavioralOrientation =
        BEHAVIORAL_ORIENTATION[`${primaryTrait}${secondaryChar}`] ||
        BEHAVIORAL_ORIENTATION[primaryTrait] ||
        'Balanced Professional';

      const rankings = rankSpecializations(readinessPct, primaryTrait);

      return {
        row,
        primaryTrait,
        characterCode,
        character,
        readinessPct,
        rankings,
        specFit:
          rankings.find((r) => r.code === character.primarySpec) ?? rankings[0],
        behavioralOrientation,
      };
    });

    for (const s of this.students) {
      (this.characterBuckets[s.characterCode] ||= []).push(s);
    }
    // Sort each character bucket by suitability score descending.
    Object.values(this.characterBuckets).forEach((bucket) =>
      bucket.sort((x, y) => y.specFit.finalScore - x.specFit.finalScore),
    );
  }

  /** Present characters in canonical order (skips characters with no students). */
  private presentCharacters(): string[] {
    return MBA_CHARACTER_ORDER.filter(
      (code) => (this.characterBuckets[code]?.length ?? 0) > 0,
    );
  }

  /** Count of students whose character maps to specialization `code`. */
  private specCount(code: SpecializationCode): number {
    return this.students.filter((s) => s.character.primarySpec === code).length;
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

    // 1. Cover (wrapper page)
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

    // 3b. Elective-wise placement fit (briefs + strongest-fit headcount)
    this.generateElectiveSummary();

    // 4. Per-character sections (16-character framework)
    this.presentCharacters().forEach((code) =>
      this.generateCharacterSection(code),
    );

    // 5. Cross-cutting placement priorities
    this.generatePlacementPriorities();

    // 6. Specialization master grid (landscape appendix)
    this.generateMasterGrid();

    // 7. Closing pages (back to portrait)
    this._currentBackground = 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    this.doc.addPage();
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

    const characterItems = this.presentCharacters().map(
      (code) => getMBACharacter(code).mbaPersona,
    );

    const tocItems = [
      MBA_PLACEMENT_CONTENT.executive_summary_title,
      MBA_PLACEMENT_CONTENT.elective_title,
      ...characterItems,
      MBA_PLACEMENT_CONTENT.priorities_title,
      MBA_PLACEMENT_CONTENT.master_grid_title,
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

    // 1. Specialization fitment — pie chart (where the cohort's careers concentrate)
    this.h2(MBA_PLACEMENT_CONTENT.spec_chart_title);
    const pieSlices: PieSlice[] = SPECIALIZATION_ORDER.map((code) => ({
      label: SPECIALIZATIONS[code].name,
      value: this.specCount(code),
      color: this.SPEC_HEADER_COLOR[code],
    }));
    this.drawPieChart(pieSlices, { radius: 72, innerRadiusRatio: 0.55 });
    this.pHtml(MBA_PLACEMENT_CONTENT.spec_chart_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });

    // 2. Cohort at a glance — how many students fall under each character
    this.h2(MBA_PLACEMENT_CONTENT.cohort_glance_title);
    const glanceRows = this.presentCharacters()
      .map((code) => {
        const c = getMBACharacter(code);
        const count = this.characterBuckets[code].length;
        return { c, count };
      })
      .sort((a, b) => b.count - a.count)
      .map(({ c, count }, i) => [
        i + 1,
        c.mbaPersona,
        SPECIALIZATIONS[c.primarySpec].name,
        count,
      ]);
    this.table(
      ['S.No', 'MBA Persona', 'Best-Fit Specialization', 'Students'],
      glanceRows,
      {
        headerFontSize: 8,
        fontSize: 9,
        headerHeight: 22,
        rowHeight: 24,
        verticalAlign: 'middle',
        headerFont: this.FONT_BOLD,
        font: this.FONT_SEMIBOLD,
        headerTextColor: TABLE_STYLES.headerTextColor,
        borderColor: TABLE_STYLES.borderColor,
        headerColor: TABLE_STYLES.headerColor,
        rowColor: TABLE_STYLES.rowColor,
        rowTextColor: TABLE_STYLES.rowTextColor,
        alternateRowColor: TABLE_STYLES.alternateRowColor,
        colWidths: ['fit', 'fill', 'fit', 'fit'],
        headerAlign: ['center', 'left', 'left', 'center'],
        rowAlign: ['center', 'left', 'left', 'center'],
        mergeRepeatedHeaders: true,
      },
    );

    // 3. Cohort readiness profile — radar across the five readiness indicators
    this.h2(MBA_PLACEMENT_CONTENT.readiness_radar_title);
    const avg = this.averageReadiness(this.students);
    const radarData = READINESS_ORDER.reduce(
      (acc, k) => {
        acc[SHORT_READINESS_LABEL[k]] = Math.round(avg[k]);
        return acc;
      },
      {} as Record<string, number>,
    );
    this.drawRadarChart(radarData, {
      radius: 105,
      maxValue: 100,
      levels: 5,
      y: this.doc.y + 105 + 26,
    });
    this.doc.moveDown(1);
    this.pHtml(MBA_PLACEMENT_CONTENT.readiness_radar_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });

    // 4. Placement-readiness band split
    this.h2(MBA_PLACEMENT_CONTENT.readiness_band_title);
    const bandCounts = FIT_BANDS.map(
      (b) => this.students.filter((s) => s.specFit.fit === b.level).length,
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
  }

  // ── Elective-wise placement fit ───────────────────────────────────────────────

  private generateElectiveSummary(): void {
    this.h1(MBA_PLACEMENT_CONTENT.elective_title, { ensureSpace: 0.35 });
    this.p(MBA_PLACEMENT_CONTENT.elective_intro);

    // About the electives — accent-barred briefs.
    this.h2(MBA_PLACEMENT_CONTENT.elective_about_title);
    const x = this.MARGIN_STD;
    const labelX = x + 12;
    const briefW = this.PAGE_WIDTH - 2 * this.MARGIN_STD - 12;
    for (const e of ELECTIVES) {
      this.doc.font(this.FONT_BOLD).fontSize(11);
      const labelH = this.doc.heightOfString(e.label, { width: briefW });
      this.doc.font(this.FONT_REGULAR).fontSize(9.5);
      const blurbH = this.doc.heightOfString(e.blurb, { width: briefW });
      const blockH = labelH + blurbH + 8;

      this.ensureSpace(blockH + 10);
      const y = this.doc.y + 2;
      this.doc.rect(x, y + 1, 4, blockH - 4).fill(e.accent);
      this.doc
        .font(this.FONT_BOLD)
        .fontSize(11)
        .fillColor('#1B1B27')
        .text(e.label, labelX, y, { width: briefW });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor('#58595b')
        .text(e.blurb, labelX, this.doc.y + 1, {
          width: briefW,
          align: 'justify',
        });
      this.doc.y += 8;
      this.doc.x = this.MARGIN_STD;
    }

    // Strongest-fit headcount by elective.
    this.h2(MBA_PLACEMENT_CONTENT.elective_headcount_title);
    const counts = ELECTIVES.map((e) =>
      this.specCount(ELECTIVE_TO_SPEC[e.key]),
    );
    const total = counts.reduce((a, b) => a + b, 0);
    const rows = [
      ...ELECTIVES.map((e, i) => ({
        type: 'row' as const,
        data: [e.label, counts[i]],
        color: e.accent,
        font: this.FONT_SORA_SEMIBOLD,
      })),
      {
        type: 'row' as const,
        data: ['Total', total],
        fill: '#EDEFFA',
        color: this.COLOR_DEEP_BLUE,
        font: this.FONT_SORA_BOLD,
      },
    ];
    this.table(['Type of Elective', 'Strongest Fit'], rows, {
      headerFontSize: 9,
      fontSize: 12,
      headerHeight: 24,
      rowHeight: 28,
      verticalAlign: 'middle',
      headerFont: this.FONT_BOLD,
      font: this.FONT_SORA_SEMIBOLD,
      headerTextColor: '#FFFFFF',
      headerColor: this.COLOR_DEEP_BLUE,
      borderColor: TABLE_STYLES.borderColor,
      rowColor: '#FFFFFF',
      colWidths: ['fill', 'fit'],
      headerAlign: ['left', 'center'],
      rowAlign: ['left', 'center'],
    });
    this.pHtml(MBA_PLACEMENT_CONTENT.elective_legend(this.data.total_students), {
      fontSize: 8,
      color: '#58595b',
      font: this.FONT_ITALIC,
    });
  }

  // ── Per-character section ────────────────────────────────────────────────────

  private generateCharacterSection(code: string): void {
    const c = getMBACharacter(code);
    const bucket = this.characterBuckets[code];
    const primaryName = SPECIALIZATIONS[c.primarySpec].name;
    const secondaryName = SPECIALIZATIONS[c.secondarySpec].name;

    this.h1(c.mbaPersona, { ensureSpace: 0.35 });

    // Best-fit specialization line — the reader sees the MBA role identity.
    this.pHtml(
      `<b>Best fit:</b> ${primaryName} (also strong in ${secondaryName})`,
      { fontSize: 10, font: this.FONT_REGULAR, align: 'left' },
    );
    this.p(c.tagline, {
      fontSize: 9,
      color: '#58595b',
      font: this.FONT_ITALIC,
      align: 'left',
    });
    this.p(c.narrative);

    // 1. Roster — the individuals under this character. Their best-fit
    // specialization is the character's (stated above); the per-student columns
    // show how ready each individual is for it.
    this.h2(`Students in this Character (${bucket.length})`);
    const rosterRows = bucket.map((s, i) => [
      i + 1,
      this.studentLabel(s.row),
      `${primaryName} Fit`,
      s.specFit.fit,
      Math.round(s.specFit.finalScore),
      s.behavioralOrientation,
    ]);
    this.table(
      [
        'S.No',
        'Student',
        'Specialization',
        'Readiness Fit',
        'Score',
        'Working Style',
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
        headerAlign: ['center', 'left', 'left', 'center', 'center', 'left'],
        rowAlign: ['center', 'left', 'left', 'center', 'center', 'left'],
        mergeRepeatedHeaders: true,
      },
    );

    // 2. Future role fitment — roles with the reasoning per role.
    this.h2('Future Role Fitment');
    this.list(
      c.futureRoles.map((r) => `<b>${r.name}</b> — ${r.why}`),
      { indent: 20, gap: 4 },
    );

    // 3. Specific recommendations (grooming / preparation focus).
    this.h2('Recommendations');
    this.list(c.recommendations, { type: 'number', indent: 20, gap: 4 });

    // 4. Why these careers — the reasoning behind the suggestions.
    this.h2('Why These Careers');
    this.p(c.reasoning, { align: 'justify' });

    // 5. Raw data table — placed at the end of the section. Reserve enough
    // space that the heading, note, and the start of the table stay together
    // (never orphan the "Raw Data" heading at the bottom of a page).
    this.ensureSpace(0.2, true);
    this.h3('Raw Data');
    this.p(
      'Underlying work-readiness indicators (0–100) and best-fit suitability score for each student in this character.',
      { fontSize: 8, color: '#58595b', font: this.FONT_ITALIC, align: 'left' },
    );
    this.renderRawDataTable(bucket);
  }

  /** Per-student raw readiness indicators + fit score, shown at a section's end. */
  private renderRawDataTable(bucket: ScoredStudent[]): void {
    const headers = [
      'Student',
      ...READINESS_ORDER.map((k) => SHORT_READINESS_LABEL[k]),
      'Fit Score',
    ];
    const rows = bucket.map((s) => [
      this.studentLabel(s.row),
      ...READINESS_ORDER.map((k) => `${Math.round(s.readinessPct[k])}%`),
      Math.round(s.specFit.finalScore),
    ]);
    this.table(headers, rows, {
      headerFontSize: 7.5,
      fontSize: 8,
      headerHeight: 24,
      rowHeight: 20,
      verticalAlign: 'middle',
      headerVerticalAlign: 'middle',
      headerFont: this.FONT_BOLD,
      font: this.FONT_SEMIBOLD,
      headerTextColor: TABLE_STYLES.headerTextColor,
      borderColor: TABLE_STYLES.borderColor,
      headerColor: TABLE_STYLES.headerColor,
      rowColor: TABLE_STYLES.rowColor,
      rowTextColor: TABLE_STYLES.rowTextColor,
      alternateRowColor: TABLE_STYLES.alternateRowColor,
      colWidths: ['fill', 'fit', 'fit', 'fit', 'fit', 'fit', 'fit'],
      headerAlign: ['left', 'center', 'center', 'center', 'center', 'center', 'center'],
      rowAlign: ['left', 'center', 'center', 'center', 'center', 'center', 'center'],
      mergeRepeatedHeaders: true,
    });
  }

  // ── Cross-cutting placement priorities ────────────────────────────────────────

  private generatePlacementPriorities(): void {
    this.h1(MBA_PLACEMENT_CONTENT.priorities_title, { ensureSpace: 0.35 });

    // Placement priorities are driven by ACI readiness. When no student in the
    // cohort has completed ACI, the rankings fall back to behavioural (DISC)
    // fit only - surface a short note so the reader interprets them correctly.
    const cohortHasAci = this.students.some((s) =>
      Object.values(s.readinessPct).some((v) => v > 0),
    );
    if (!cohortHasAci) {
      this.pHtml(
        'Note: No ACI (Agile Compatibility Index) data is available for this ' +
          'cohort. The shortlists below are based on behavioural fit only ' +
          'and will sharpen once students complete the ACI assessment.',
        { fontSize: 9, color: '#58595b', font: this.FONT_ITALIC },
      );
    }

    // Deploy-ready shortlist
    this.h2(MBA_PLACEMENT_CONTENT.deploy_ready_title);
    this.p(MBA_PLACEMENT_CONTENT.deploy_ready_text);
    const deployReady = this.students
      .filter((s) => DEPLOY_READY_FITS.has(s.specFit.fit))
      .sort((a, b) => b.specFit.finalScore - a.specFit.finalScore);
    this.renderShortlistTable(deployReady);

    // Grooming list
    this.h2(MBA_PLACEMENT_CONTENT.grooming_title, { ensureSpace: 0.25 });
    this.p(MBA_PLACEMENT_CONTENT.grooming_text);
    const grooming = this.students
      .filter((s) => !DEPLOY_READY_FITS.has(s.specFit.fit))
      .sort((a, b) => b.specFit.finalScore - a.specFit.finalScore);
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
      s.character.mbaPersona,
      s.specFit.meta.name,
      s.specFit.fit,
      Math.round(s.specFit.finalScore),
    ]);
    this.table(
      ['S.No', 'Student', 'MBA Persona', 'Best-Fit Specialization', 'Fit Level', 'Score'],
      rows,
      this.shortlistTableOptions([
        'center',
        'left',
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

  // ── Specialization Master Grid (landscape appendix) ─────────────────────────

  private readonly LAND_W = 841.89;
  private readonly LAND_H = 595.28;
  private readonly LAND_MARGIN = 30;
  private readonly GRID_BORDER = '#D7D9E8';
  private readonly GRID_ZEBRA = '#F4F5FB';
  private readonly GRID_STRONG_BG = '#E6FBF0';
  private readonly GRID_STRONG_TEXT = '#0E8C46';
  private readonly FIT_KEYS: SpecializationCode[] = [
    'FIN',
    'HR',
    'MKT',
    'OPS',
    'BA',
  ];

  /** Column layout for the master grid; the roles column absorbs the remainder. */
  private gridColumns(): {
    key: string;
    label: string;
    width: number;
    align: 'left' | 'center';
  }[] {
    const fixed: {
      key: string;
      label: string;
      width: number;
      align: 'left' | 'center';
    }[] = [
      { key: 'sl', label: 'Sl. No.', width: 30, align: 'center' },
      { key: 'name', label: 'Student Name', width: 128, align: 'left' },
      { key: 'code', label: 'Trait Code', width: 46, align: 'center' },
      { key: 'persona', label: 'MBA Persona', width: 118, align: 'left' },
      { key: 'FIN', label: 'Finance', width: 50, align: 'center' },
      { key: 'HR', label: 'HR', width: 38, align: 'center' },
      { key: 'MKT', label: 'Marketing', width: 60, align: 'center' },
      { key: 'OPS', label: 'Operations', width: 64, align: 'center' },
      { key: 'BA', label: 'Business Analytics', width: 68, align: 'center' },
    ];
    const used = fixed.reduce((s, c) => s + c.width, 0);
    return [
      ...fixed,
      {
        key: 'roles',
        label: 'Top Future Roles',
        width: this.LAND_W - 2 * this.LAND_MARGIN - used,
        align: 'left',
      },
    ];
  }

  /**
   * Per-student 1–5 specialization ranking, anchored to the character so rank 1
   * is always the character's primary best-fit (matching the rest of the
   * report); the remaining slots are ordered by readiness suitability.
   */
  private electiveRanks(s: ScoredStudent): Record<SpecializationCode, number> {
    const primary = s.character.primarySpec;
    const secondary = s.character.secondarySpec;
    const scoreFor = (code: SpecializationCode) =>
      s.rankings.find((r) => r.code === code)?.finalScore ?? 0;
    const rest = SPECIALIZATION_ORDER.filter(
      (c) => c !== primary && c !== secondary,
    ).sort((a, b) => scoreFor(b) - scoreFor(a));
    const order = [primary, secondary, ...rest];
    const ranks = {} as Record<SpecializationCode, number>;
    order.forEach((c, i) => (ranks[c] = i + 1));
    return ranks;
  }

  private rolesText(s: ScoredStudent): string {
    return s.character.futureRoles.map((r) => r.name).join('   ·   ');
  }

  private generateMasterGrid(): void {
    const ordered: ScoredStudent[] = [];
    this.presentCharacters().forEach((code) =>
      ordered.push(...this.characterBuckets[code]),
    );
    if (ordered.length === 0) return;

    // Landscape pages paint their own background; suppress the portrait
    // watermark the pageAdded listener would otherwise draw.
    this._currentBackground = null;

    const cols = this.gridColumns();
    let y = this.addGridPage();
    y = this.drawGridHeader(y, cols);
    const bottom = this.LAND_H - this.LAND_MARGIN - 22;

    ordered.forEach((s, i) => {
      const rowH = this.measureGridRow(s, cols);
      if (y + rowH > bottom) {
        y = this.addGridPage();
        y = this.drawGridHeader(y, cols);
      }
      this.drawGridRow(s, i, y, rowH, cols);
      y += rowH;
    });

    this.doc
      .font(this.FONT_SEMIBOLD)
      .fontSize(8.5)
      .fillColor('#58595b')
      .text(MBA_PLACEMENT_CONTENT.master_grid_legend, this.LAND_MARGIN, y + 8, {
        width: this.LAND_W - 2 * this.LAND_MARGIN,
      });
  }

  /** Adds a landscape page with the master-grid background + title band. */
  private addGridPage(): number {
    this.doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });

    const bg = 'public/assets/images/Level1_Landscape_Background.png';
    if (fs.existsSync(bg)) {
      this.doc.image(bg, 0, 0, {
        fit: [this.LAND_W, this.LAND_H],
        align: 'center',
        valign: 'center',
      });
    }

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(16)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(MBA_PLACEMENT_CONTENT.master_grid_title, this.LAND_MARGIN, 22);
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor('#58595b')
      .text(MBA_PLACEMENT_CONTENT.master_grid_intro, this.LAND_MARGIN, 44, {
        width: this.LAND_W - 2 * this.LAND_MARGIN,
      });
    return 64;
  }

  private drawGridHeader(
    y: number,
    cols: ReturnType<MBAPlacementReport['gridColumns']>,
  ): number {
    const headerH = 34;
    let x = this.LAND_MARGIN;
    this.doc.lineWidth(0.6);
    for (const col of cols) {
      this.doc
        .rect(x, y, col.width, headerH)
        .fillAndStroke(this.COLOR_DEEP_BLUE, this.GRID_BORDER);
      this.doc.font(this.FONT_BOLD).fontSize(8).fillColor('#FFFFFF');
      const textH = this.doc.heightOfString(col.label, {
        width: col.width - 8,
        align: 'center',
      });
      this.doc.text(col.label, x + 4, y + Math.max(2, (headerH - textH) / 2), {
        width: col.width - 8,
        align: 'center',
      });
      x += col.width;
    }
    return y + headerH;
  }

  private measureGridRow(
    s: ScoredStudent,
    cols: ReturnType<MBAPlacementReport['gridColumns']>,
  ): number {
    let max = 20;
    for (const col of cols) {
      let txt = '';
      let font = this.FONT_REGULAR;
      let size = 8;
      if (col.key === 'name') {
        txt = this.studentLabel(s.row);
        font = this.FONT_SEMIBOLD;
      } else if (col.key === 'persona') {
        txt = s.character.mbaPersona;
      } else if (col.key === 'roles') {
        txt = this.rolesText(s);
        size = 7.5;
      } else {
        continue; // numeric / serial / code columns are single-line
      }
      this.doc.font(font).fontSize(size);
      const h = this.doc.heightOfString(txt, { width: col.width - 8 });
      if (h + 12 > max) max = h + 12;
    }
    return max;
  }

  private drawGridRow(
    s: ScoredStudent,
    i: number,
    y: number,
    rowH: number,
    cols: ReturnType<MBAPlacementReport['gridColumns']>,
  ): void {
    const ranks = this.electiveRanks(s);
    const zebra = i % 2 === 1;
    let x = this.LAND_MARGIN;

    for (const col of cols) {
      const isFit = (this.FIT_KEYS as string[]).includes(col.key);
      const rank = isFit ? ranks[col.key as SpecializationCode] : 0;
      const strongest = isFit && rank === 1;

      const bg = strongest
        ? this.GRID_STRONG_BG
        : zebra
          ? this.GRID_ZEBRA
          : '#FFFFFF';
      this.doc.rect(x, y, col.width, rowH).fillAndStroke(bg, this.GRID_BORDER);

      let txt = '';
      let font = this.FONT_REGULAR;
      let size = 8;
      let color = '#1B1B27';
      if (col.key === 'sl') {
        txt = String(i + 1);
      } else if (col.key === 'name') {
        txt = this.studentLabel(s.row);
        font = this.FONT_SEMIBOLD;
      } else if (col.key === 'code') {
        txt = s.characterCode;
        font = this.FONT_SORA_BOLD;
        color = this.COLOR_DEEP_BLUE;
      } else if (col.key === 'persona') {
        txt = s.character.mbaPersona;
      } else if (col.key === 'roles') {
        txt = this.rolesText(s);
        size = 7.5;
        color = '#58595b';
      } else if (isFit) {
        txt = String(rank);
        if (strongest) {
          font = this.FONT_BOLD;
          color = this.GRID_STRONG_TEXT;
        }
      }

      this.doc.font(font).fontSize(size);
      const txtH = this.doc.heightOfString(txt, { width: col.width - 8 });
      const ty = y + Math.max(4, (rowH - txtH) / 2);
      this.doc
        .fillColor(color)
        .text(txt, x + 4, ty, { width: col.width - 8, align: col.align });

      x += col.width;
    }
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
   * Bright, vivid colors for the specialization pie + counts. These are
   * lighter/punchier than the deep `accent` shades used elsewhere so the chart
   * reads clearly with white text (matching the placement-handbook style).
   */
  private readonly SPEC_HEADER_COLOR: Record<SpecializationCode, string> = {
    FIN: '#2D5BD0', // bright blue
    HR: '#17A398', // bright teal
    BA: '#7C4DCC', // bright purple
    OPS: '#E07B2E', // bright orange
    MKT: '#D63384', // bright magenta
  };

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
}
