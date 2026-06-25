// reports/placement/mbaPlacementReport.ts

import * as fs from 'fs';
import { BaseReport, PieSlice } from '../BaseReport';
import { MBAPlacementData, MBAStudentRow } from '../../types/placementTypes';
import { DISC_COLORS, TABLE_STYLES } from './placementConstants';
import {
  CHARACTER_GRID_COLORS,
  END_PAGE,
  MBA_PLACEMENT_CONTENT,
} from './mbaPlacementConstants';
import {
  MBACharacter,
  MBA_CHARACTER_ORDER,
  MBA_GRID_ROWS,
  getCharacterArtCandidates,
  getMBACharacter,
} from './mbaCharacterConstants';
import {
  ELECTIVES,
  FitKey,
  SPEC_MAP,
} from '../college/specializationConstants';
import {
  BehavioralAlignment,
  DISC_ALIGNMENT,
  DiscTrait,
  SPECIALIZATIONS,
  SPECIALIZATION_ORDER,
  SpecializationCode,
} from '../college/mbaConstants';
import { logger } from '../../helpers/logger';

/** A single student with their resolved 16-character DISC identity. */
interface ScoredStudent {
  row: MBAStudentRow;
  primaryTrait: DiscTrait;
  /** Resolved 16-character code (2-letter blend or single-letter Pure Trait). */
  characterCode: string;
  character: MBACharacter;
}

/** Maps the level-1 elective keys to this report's specialization codes. */
const ELECTIVE_TO_SPEC: Record<FitKey, SpecializationCode> = {
  hr: 'HR',
  finance: 'FIN',
  marketing: 'MKT',
  operations: 'OPS',
  analytics: 'BA',
};

/** Folder holding the 12 blend illustrations (pure traits borrow a blend's art). */
const TRAIT_ART_DIR = 'public/assets/images/student_traits';

/** Folder for named UI icons (Vision/Mission glyphs). */
const ICON_DIR = 'public/assets/images/icons';

/**
 * Service-card icons, keyed by the END_PAGE.services `icon` value. Each maps to
 * a vector SVG in ICON_DIR; the paths are read at runtime and stroked (outline
 * style), so swapping the SVG file is all that's needed to update an icon.
 */
const SERVICE_ICON_FILES: Record<string, string> = {
  school: 'school.svg',
  cap: 'college.svg',
  people: 'employee.svg',
  exec: 'cxo.svg',
};

/**
 * MBAPlacementReport
 * ------------------
 * Consolidated MBA placement handbook, built entirely from the **Level-1
 * behavioural (DISC) assessment** - the Agile Compatibility Index (ACI) is not
 * part of this report. Every student resolves to one of the platform's 16
 * behavioural characters (12 DISC blends + 4 Pure Traits), and each character
 * carries an authored MBA reading: an MBA persona, the best-fit
 * specialization(s), concrete future roles, and grooming recommendations
 * (see mbaCharacterConstants).
 *
 * Structure (modelled on the Standard Placement Report, groomed for MBA):
 *   cover → TOC → executive summary (character-distribution radar + colour-coded
 *   headcount grid across all 16 characters) → specialization fitment (pie +
 *   "who fits where" reveal) → elective-wise fit → one section per present
 *   character, Pure Traits first then the blends (persona + comic art +
 *   narrative + five-way specialization-fit ranking + grooming + roster whose
 *   merged column lists the combination's future-fit roles). Closing pages and
 *   the landscape master grid are implemented but disabled - see generate().
 */
export class MBAPlacementReport extends BaseReport {
  private data: MBAPlacementData;
  private students: ScoredStudent[] = [];
  /** Students bucketed by their resolved 16-character code. */
  private characterBuckets: Record<string, ScoredStudent[]> = {};
  /** Cache of parsed SVG icons: filename -> { path d strings, viewBox size }. */
  private svgIconCache: Record<string, { paths: string[]; size: number }> = {};

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

  // ── Cohort resolution ───────────────────────────────────────────────────────

  /** Resolves each student's 16-character code, then buckets the cohort. */
  private scoreCohort(): void {
    const validTraits = new Set<DiscTrait>(['D', 'I', 'S', 'C']);

    this.students = (this.data.students || []).map((row) => {
      const character = getMBACharacter(row.trait_code);
      const characterCode = character.code;
      const primaryTrait = (
        validTraits.has(characterCode[0] as DiscTrait) ? characterCode[0] : 'D'
      ) as DiscTrait;
      return { row, primaryTrait, characterCode, character };
    });

    for (const s of this.students) {
      (this.characterBuckets[s.characterCode] ||= []).push(s);
    }
    // No ACI score to rank by - order each character's roster alphabetically.
    Object.values(this.characterBuckets).forEach((bucket) =>
      bucket.sort((x, y) =>
        this.studentLabel(x.row).localeCompare(this.studentLabel(y.row)),
      ),
    );
  }

  /** Present characters in canonical (Pure-first) order; skips empty ones. */
  private presentCharacters(): string[] {
    return MBA_CHARACTER_ORDER.filter(
      (code) => (this.characterBuckets[code]?.length ?? 0) > 0,
    );
  }

  /** Count of students resolved to character `code`. */
  private countFor(code: string): number {
    return this.characterBuckets[code]?.length ?? 0;
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

    // 3. Executive Summary (character-distribution radar + headcount grid)
    this._currentBackground = 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    this.doc.addPage();
    this.generateExecutiveSummary();

    // 4. Specialization fitment (pie + "who fits where" reveal)
    this.generateSpecFitment();

    // 5. Elective-wise placement fit (briefs + strongest-fit headcount)
    this.generateElectiveSummary();

    // 6. Per-character sections (16-character framework, Pure-traits first)
    this.presentCharacters().forEach((code) =>
      this.generateCharacterSection(code),
    );

    // 7. Specialization master grid (landscape appendix) - disabled per request.
    //     The implementation is kept below; re-enable by uncommenting.
    // this.generateMasterGrid();

    // 8. End page (About Us / Vision / Mission / Core Values / Services).
    //    Uses its own full-page background and carries no footer.
    this._currentBackground = 'public/assets/images/background.png';
    this._useStdMargins = true;
    this.doc.addPage();
    this.generateEndPage();

    // Footers on every page except the End page.
    this.addFooters(this.data.exam_ref_no || '', true);

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
      MBA_PLACEMENT_CONTENT.spec_chart_title,
      MBA_PLACEMENT_CONTENT.elective_title,
      ...characterItems,
      END_PAGE.about_title,
      // Master grid (landscape) disabled per request - omitted from the TOC.
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
      { fontSize: 11, font: this.FONT_REGULAR, align: 'justify' },
    );
    this.doc.moveDown(0.8);

    // 1. Character-distribution radar - one spoke per character (all 16 shown).
    // No heading above it (the exec paragraph already frames it); the freed
    // space lets the radar run a little larger.
    const radarData: Record<string, number> = {};
    MBA_CHARACTER_ORDER.forEach((code) => {
      radarData[this.shortPersona(getMBACharacter(code))] = this.countFor(code);
    });
    const maxCount = Math.max(...Object.values(radarData), 1);
    const radarRadius = 122;
    this.drawRadarChart(radarData, {
      radius: radarRadius,
      // Anchor the centre explicitly so the top labels never ride up into the
      // heading above, regardless of how full the page already is.
      y: this.doc.y + radarRadius + 24,
      maxValue: maxCount + 1,
      levels: Math.min(5, maxCount + 1),
      fontSize: 8,
    });
    this.doc.moveDown(0.2);
    this.pHtml(MBA_PLACEMENT_CONTENT.character_radar_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });

    // 2. Character headcount grid - the colour-coded "8 + 8" two-table variant.
    // Reserve the heading + grid + caption together so the heading never
    // strands at a page bottom with the grid pushed to the next page.
    this.ensureSpace(0.3, true);
    this.h2(MBA_PLACEMENT_CONTENT.character_grid_title);
    this.drawCharacterGrid();
    this.pHtml(MBA_PLACEMENT_CONTENT.character_grid_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });
  }

  /** MBA persona without the leading "The " - tighter for chart/grid labels. */
  private shortPersona(c: MBACharacter): string {
    return c.mbaPersona.replace(/^The\s+/i, '');
  }

  /**
   * The 16-character headcount in the Standard Placement Report's personality-
   * grid style: two stacked tables of eight columns each ("8 + 8" variant). Each
   * header cell is the character's grid colour with the persona name; the single
   * data row beneath holds the student count.
   */
  private drawCharacterGrid(): void {
    const tableWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const colWidths = Array(8).fill(tableWidth / 8) as number[];

    MBA_GRID_ROWS.forEach((codes, idx) => {
      if (idx > 0) this.doc.y += 6; // gap between the top and bottom tables

      this.table(
        codes.map((code) => this.shortPersona(getMBACharacter(code))),
        [codes.map((code) => this.countFor(code))],
        {
          x: this.MARGIN_STD,
          width: tableWidth,
          colWidths,
          headerColor: codes.map(
            (code) =>
              (CHARACTER_GRID_COLORS[code] || { bg: this.COLOR_DEEP_BLUE }).bg,
          ),
          headerTextColor: codes.map(
            (code) => (CHARACTER_GRID_COLORS[code] || { text: '#FFFFFF' }).text,
          ),
          headerAlign: 'center',
          headerFont: this.FONT_SORA_BOLD,
          headerFontSize: 7,
          headerHeight: 34,
          headerVerticalAlign: 'middle',
          rowAlign: 'center',
          font: this.FONT_SORA_BOLD,
          fontSize: 13,
          rowHeight: 26,
          borderWidth: 1,
          borderColor: '#000000',
          verticalAlign: 'middle',
        },
      );
    });
  }

  // ── Specialization fitment (pie + reveal) ─────────────────────────────────────

  private generateSpecFitment(): void {
    this.h1(MBA_PLACEMENT_CONTENT.spec_chart_title, { ensureSpace: 0.45 });

    const pieSlices: PieSlice[] = SPECIALIZATION_ORDER.map((code) => ({
      label: SPECIALIZATIONS[code].name,
      value: this.specCount(code),
      color: this.SPEC_HEADER_COLOR[code],
    }));
    this.drawPieChart(pieSlices, { radius: 78, innerRadiusRatio: 0.55 });
    this.pHtml(MBA_PLACEMENT_CONTENT.spec_chart_description, {
      fontSize: 8,
      color: '#58595b',
      align: 'center',
      font: this.FONT_ITALIC,
    });

    // Reveal the headline result first, then list who sits where.
    const ranked = SPECIALIZATION_ORDER.map((code) => ({
      code,
      name: SPECIALIZATIONS[code].name,
      n: this.specCount(code),
    })).sort((a, b) => b.n - a.n);
    const top = ranked[0];
    if (top && top.n > 0) {
      this.pHtml(
        MBA_PLACEMENT_CONTENT.spec_reveal_intro(
          top.name,
          top.n,
          this.data.total_students,
        ),
        { fontSize: 11, font: this.FONT_REGULAR, align: 'justify' },
      );
    }

    this.h3('Who Fits Where');
    const present = this.presentCharacters();
    const lines = SPECIALIZATION_ORDER.map((code) => {
      const n = this.specCount(code);
      if (n === 0) return null;
      const personas = present
        .filter((pc) => getMBACharacter(pc).primarySpec === code)
        .map(
          (pc) =>
            `${this.shortPersona(getMBACharacter(pc))} (${this.countFor(pc)})`,
        )
        .join(', ');
      return `<b>${SPECIALIZATIONS[code].name} - ${n}:</b> ${personas}`;
    }).filter((l): l is string => l !== null);
    this.list(lines, { indent: 20, gap: 4, fontSize: 10 });
  }

  // ── Elective-wise placement fit ───────────────────────────────────────────────

  private generateElectiveSummary(): void {
    this.h1(MBA_PLACEMENT_CONTENT.elective_title, { ensureSpace: 0.35 });
    this.p(MBA_PLACEMENT_CONTENT.elective_intro);

    // About the electives - accent-barred briefs.
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
    this.pHtml(
      MBA_PLACEMENT_CONTENT.elective_legend(this.data.total_students),
      {
        fontSize: 8,
        color: '#58595b',
        font: this.FONT_ITALIC,
      },
    );
  }

  // ── Per-character section ────────────────────────────────────────────────────

  /**
   * Character-level specialization ranking (best-fit first): rank 1 & 2 are the
   * authored primary / secondary specs, the remaining three ordered by the
   * character's DISC behavioural alignment - the character-level analogue of
   * `electiveRanks`, so the section ranking agrees with the master grid.
   */
  private characterElectiveOrder(c: MBACharacter): SpecializationCode[] {
    const trait = (
      ['D', 'I', 'S', 'C'].includes(c.code[0]) ? c.code[0] : 'D'
    ) as DiscTrait;
    const score = (code: SpecializationCode): number => {
      const a = DISC_ALIGNMENT[trait][code];
      return a === 'Strong' ? 3 : a === 'Moderate' ? 2 : 1;
    };
    const rest = SPECIALIZATION_ORDER.filter(
      (s) => s !== c.primarySpec && s !== c.secondarySpec,
    ).sort(
      (a, b) =>
        score(b) - score(a) ||
        SPECIALIZATION_ORDER.indexOf(a) - SPECIALIZATION_ORDER.indexOf(b),
    );
    return [c.primarySpec, c.secondarySpec, ...rest];
  }

  /** Specializations in the report's canonical elective order (HR, FIN, …). */
  private electiveDisplayOrder(): SpecializationCode[] {
    return ELECTIVES.map((e) => ELECTIVE_TO_SPEC[e.key]);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VARIANT A (kept for reference): horizontal bar-chart ranking.
  // The active drawElectiveRanking below is VARIANT B (table). To switch back,
  // restore this body and comment out the table version.
  // ───────────────────────────────────────────────────────────────────────────
  // /**
  //  * Specialization fit shown as a horizontal bar chart in the report's fixed
  //  * **elective order** (so every character lists the five the same way and they
  //  * stay comparable). Each row carries a rank badge, the spec name and a fit bar
  //  * whose length tracks the rank; the **best-fit** row is pulled out with a
  //  * tinted band, the spec accent and a "BEST FIT" tag - so the winner reads at a
  //  * glance without breaking the elective order.
  //  */
  // private drawElectiveRanking(c: MBACharacter): void {
  //   const x = this.MARGIN_STD;
  //   const fullW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
  //   const trait = (
  //     ['D', 'I', 'S', 'C'].includes(c.code[0]) ? c.code[0] : 'D'
  //   ) as DiscTrait;
  //
  //   // Rank each spec (best-first), then render in fixed elective order.
  //   const rankOf = {} as Record<SpecializationCode, number>;
  //   this.characterElectiveOrder(c).forEach((code, i) => (rankOf[code] = i + 1));
  //
  //   const rowH = 24;
  //   const blockH = this.electiveDisplayOrder().length * rowH;
  //
  //   // Keep the heading, intro and bars together on one page.
  //   this.ensureSpace(blockH + 76);
  //   this.h2(MBA_PLACEMENT_CONTENT.elective_rank_title, { ensureSpace: 0.04 });
  //   this.doc
  //     .font(this.FONT_REGULAR)
  //     .fontSize(8.5)
  //     .fillColor('#58595b')
  //     .text(MBA_PLACEMENT_CONTENT.elective_rank_intro, x, this.doc.y + 2, {
  //       width: fullW,
  //       align: 'left',
  //     });
  //
  //   const top = this.doc.y + 8;
  //   const badgeCx = x + 12;
  //   const nameX = x + 28;
  //   const nameW = 150;
  //   const barX = nameX + nameW + 8;
  //   const labelW = 56;
  //   const barW = x + fullW - labelW - barX;
  //   const barH = 10;
  //
  //   this.electiveDisplayOrder().forEach((code, i) => {
  //     const meta = SPECIALIZATIONS[code];
  //     const rank = rankOf[code];
  //     const best = rank === 1;
  //     const align = DISC_ALIGNMENT[trait][code];
  //     const rowY = top + i * rowH;
  //     const cy = rowY + rowH / 2;
  //     const frac = (100 - (rank - 1) * 16) / 100; // 1.0, .84, .68, .52, .36
  //
  //     // Tinted band behind the best-fit row.
  //     if (best) {
  //       this.doc
  //         .roundedRect(x, rowY + 1, fullW, rowH - 2, 6)
  //         .fill(meta.accentSoft);
  //     }
  //
  //     // Rank badge (always the spec's accent for colour identity).
  //     this.doc.circle(badgeCx, cy, 8).fill(meta.accent);
  //     this.doc
  //       .font(this.FONT_SORA_BOLD)
  //       .fontSize(8.5)
  //       .fillColor('#FFFFFF')
  //       .text(String(rank), badgeCx - 9, cy - 5.2, {
  //         width: 18,
  //         align: 'center',
  //       });
  //
  //     // Elective name + (best only) a small "BEST FIT" pill.
  //     const nameFs = best ? 9.5 : 9;
  //     this.doc
  //       .font(this.FONT_BOLD)
  //       .fontSize(nameFs)
  //       .fillColor(best ? meta.accent : '#2A2A33');
  //     this.doc.text(meta.name, nameX, cy - nameFs * 0.58, {
  //       width: nameW,
  //       lineBreak: false,
  //     });
  //     if (best) {
  //       const pillX = nameX + this.doc.widthOfString(meta.name) + 6;
  //       this.doc.roundedRect(pillX, cy - 6.5, 42, 13, 6.5).fill(meta.accent);
  //       this.doc
  //         .font(this.FONT_BOLD)
  //         .fontSize(5.8)
  //         .fillColor('#FFFFFF')
  //         .text('BEST FIT', pillX, cy - 2.9, { width: 42, align: 'center' });
  //     }
  //
  //     // Fit bar: light track + accent fill sized by rank.
  //     this.doc
  //       .roundedRect(barX, cy - barH / 2, barW, barH, barH / 2)
  //       .fill('#ECEEF3');
  //     this.doc
  //       .roundedRect(barX, cy - barH / 2, barW * frac, barH, barH / 2)
  //       .fill(meta.accent);
  //
  //     // Behavioural-alignment tag at the right.
  //     this.doc
  //       .font(this.FONT_SEMIBOLD)
  //       .fontSize(7)
  //       .fillColor('#6B6B76')
  //       .text(align, x + fullW - labelW + 6, cy - 4, {
  //         width: labelW - 6,
  //         align: 'left',
  //       });
  //   });
  //
  //   this.doc.y = top + blockH + 4;
  //   this.doc.x = x;
  // }

  /**
   * VARIANT B (active): specialization fit as a compact **table** sorted by this
   * character's **fit ranking** (rank 1 at the top, down to 5). Columns: rank
   * badge, specialization, a five-dot fit meter (filled = 6 - rank) and a
   * colour-coded behavioural-alignment pill. The best-fit (rank 1) top row is
   * pulled out with a tinted band and the spec accent so the winner reads at a
   * glance. The bar-chart variant is kept above, commented out.
   */
  private drawElectiveRanking(c: MBACharacter): void {
    const x = this.MARGIN_STD;
    const fullW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const trait = (
      ['D', 'I', 'S', 'C'].includes(c.code[0]) ? c.code[0] : 'D'
    ) as DiscTrait;

    // Rank each spec (best-first) and render the rows in that rank order (1..5).
    const ranked = this.characterElectiveOrder(c);
    const rankOf = {} as Record<SpecializationCode, number>;
    ranked.forEach((code, i) => (rankOf[code] = i + 1));

    // Alignment pill styles - soft tint + saturated text per strength.
    const alignStyle: Record<string, { bg: string; fg: string }> = {
      Strong: { bg: '#E4F4EA', fg: '#1E8A4C' },
      Moderate: { bg: '#FBF0D9', fg: '#B07A12' },
      Low: { bg: '#EEF0F4', fg: '#7A828F' },
    };

    const headH = 20;
    const rowH = 27;
    const rows = ranked;
    const tableH = headH + rows.length * rowH;

    // Keep heading, intro and the whole table together on one page.
    this.ensureSpace(tableH + 76);
    this.h2(MBA_PLACEMENT_CONTENT.elective_rank_title, { ensureSpace: 0.04 });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor('#58595b')
      .text(MBA_PLACEMENT_CONTENT.elective_rank_intro, x, this.doc.y + 2, {
        width: fullW,
        align: 'left',
      });

    // Column geometry.
    const top = this.doc.y + 10;
    const cRank = 52;
    const cAlign = 104;
    const cMid = fullW - cRank - cAlign;
    const cSpec = cMid * 0.52;
    const cFit = cMid - cSpec;
    const xRank = x;
    const xSpec = x + cRank;
    const xFit = xSpec + cSpec;
    const xAlign = x + fullW - cAlign;

    const border = '#DCE0E7';
    const divider = '#ECEEF3';

    // Header band + column labels (deep-blue header matching the report's other
    // tables - COLOR_DEEP_BLUE fill with white text).
    this.doc.rect(x, top, fullW, headH).fill(this.COLOR_DEEP_BLUE);
    const heads: Array<[string, number, number, 'left' | 'center']> = [
      ['RANK', xRank, cRank, 'center'],
      ['SPECIALIZATION', xSpec + 12, cSpec - 12, 'left'],
      ['FIT STRENGTH', xFit + 14, cFit - 14, 'left'],
      ['ALIGNMENT', xAlign, cAlign, 'center'],
    ];
    this.doc.font(this.FONT_SEMIBOLD).fontSize(7).fillColor('#FFFFFF');
    for (const [label, hx, hw, al] of heads) {
      this.doc.text(label, hx, top + headH / 2 - 4, {
        width: hw,
        align: al,
        characterSpacing: 0.4,
      });
    }

    // Row backgrounds (best-fit tint) - drawn first so grid lines sit on top.
    rows.forEach((code, i) => {
      if (rankOf[code] === 1) {
        const rowY = top + headH + i * rowH;
        this.doc
          .rect(x, rowY, fullW, rowH)
          .fill(SPECIALIZATIONS[code].accentSoft);
      }
    });

    // Row content.
    rows.forEach((code, i) => {
      const meta = SPECIALIZATIONS[code];
      const rank = rankOf[code];
      const best = rank === 1;
      const align = DISC_ALIGNMENT[trait][code];
      const rowY = top + headH + i * rowH;
      const cy = rowY + rowH / 2;

      // Rank badge (spec accent disc + white number).
      const bcx = xRank + cRank / 2;
      this.doc.circle(bcx, cy, 8.5).fill(meta.accent);
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text(String(rank), bcx - 10, cy - 5.6, { width: 20, align: 'center' });

      // Specialization name (best-fit row uses the spec accent colour).
      const nameFs = 10;
      this.doc
        .font(this.FONT_BOLD)
        .fontSize(nameFs)
        .fillColor(best ? meta.accent : '#2A2A33')
        .text(meta.name, xSpec + 12, cy - nameFs * 0.58, {
          width: cSpec - 16,
          lineBreak: false,
        });

      // Five-dot fit meter (filled = 6 - rank).
      const filled = 6 - rank;
      const dotR = 3.7;
      const dotGap = 15;
      const dotX0 = xFit + 14;
      for (let d = 0; d < 5; d++) {
        this.doc
          .circle(dotX0 + d * dotGap, cy, dotR)
          .fill(d < filled ? meta.accent : '#D7DBE2');
      }

      // Behavioural-alignment pill, centred in its column.
      const aStyle = alignStyle[align] ?? alignStyle.Low;
      this.doc.font(this.FONT_SEMIBOLD).fontSize(7.5);
      const pw = this.doc.widthOfString(align) + 16;
      const px = xAlign + (cAlign - pw) / 2;
      this.doc.roundedRect(px, cy - 8, pw, 16, 8).fill(aStyle.bg);
      this.doc
        .fillColor(aStyle.fg)
        .text(align, px, cy - 3.6, { width: pw, align: 'center' });
    });

    // Grid lines (drawn last, on top of fills).
    this.doc.lineWidth(0.8);
    this.doc
      .moveTo(x, top + headH)
      .lineTo(x + fullW, top + headH)
      .stroke(border);
    this.doc.lineWidth(0.6);
    for (let i = 1; i < rows.length; i++) {
      const ly = top + headH + i * rowH;
      this.doc
        .moveTo(x, ly)
        .lineTo(x + fullW, ly)
        .stroke(divider);
    }
    for (const cx of [xSpec, xFit, xAlign]) {
      this.doc
        .moveTo(cx, top + headH)
        .lineTo(cx, top + tableH)
        .stroke(divider);
    }
    this.doc.lineWidth(1).rect(x, top, fullW, tableH).stroke(border);

    this.doc.y = top + tableH + 6;
    this.doc.x = x;
  }

  private generateCharacterSection(code: string): void {
    const c = getMBACharacter(code);
    const bucket = this.characterBuckets[code];

    // Header card: comic art + persona identity + narrative.
    this.drawCharacterHeader(c);

    // Why we point this character at these roles (brief reasoning).
    this.p(c.reasoning, { align: 'justify' });

    // All five MBA specializations, ranked for this character (best-fit first).
    this.drawElectiveRanking(c);

    // Grooming focus - the "some grooming" the senior asked to keep.
    this.h2('Grooming Focus');
    this.list(c.recommendations, { type: 'number', indent: 20, gap: 4 });

    // Student roster (renders its own heading so it never strands on a page
    // boundary) with the combination's future-fit roles spanning the rows.
    const roles = SPEC_MAP[c.code]?.roles ?? c.futureRoles.map((r) => r.name);
    this.renderCharacterRoster(bucket, roles, c.primarySpec);
  }

  /**
   * Renders the per-character roster: S.No + Student rows of equal height on the
   * left, and a "Future-Fit Roles" cell on the right that spans (and centres its
   * chips across) those rows. Hand-drawn rather than via `table()` because the
   * table helper's vertical merge collapses a merged column onto its first row.
   *
   * The roster paginates: it fills the current page with as many rows as fit,
   * then continues the remaining rows on the next page - re-drawing the table
   * header AND the spanning roles cell on each page (the roles repeat per page,
   * just like a merged column that crosses a page break). The "Students with
   * this Profile" heading renders here too, so it never strands without its
   * table.
   */
  private renderCharacterRoster(
    bucket: ScoredStudent[],
    roles: string[],
    spec: SpecializationCode,
  ): void {
    const x = this.MARGIN_STD;
    const fullW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const wSno = 40;
    const wRoles = 224;
    const wName = fullW - wSno - wRoles;
    const widths = [wSno, wName, wRoles];
    const headerH = 22;
    const pad = 8;
    const baseRowH = 26;
    const bottomLimit = this.PAGE_HEIGHT - this.MARGIN_STD;
    const n = bucket.length;
    const rolesInnerW = wRoles - 2 * pad;

    // Height the roles chips need (measured once); each page group must be at
    // least this tall so the full role set fits in its spanning cell.
    const rolesH = this.layoutRoleChips(roles, 0, 0, rolesInnerW, spec, false);
    const rolesBlockH = rolesH + 2 * pad;
    const groupMin = Math.max(rolesBlockH, baseRowH);

    // Keep the heading with the table header + the first group.
    this.ensureSpace(34 + headerH + groupMin + 10);
    this.h2('Students with this Profile');

    const drawHeaderRow = (hy: number): void => {
      let hx = x;
      this.doc.lineWidth(0.6);
      widths.forEach((w, i) => {
        this.doc
          .rect(hx, hy, w, headerH)
          .fillAndStroke(TABLE_STYLES.headerColor, TABLE_STYLES.borderColor);
        this.doc
          .font(this.FONT_BOLD)
          .fontSize(8)
          .fillColor(TABLE_STYLES.headerTextColor)
          .text(
            ['S.No', 'Student', 'Future-Fit Roles'][i],
            hx + pad,
            hy + (headerH - 9) / 2,
            {
              width: w - 2 * pad,
              align: i === 0 ? 'center' : 'left',
            },
          );
        hx += w;
      });
    };

    let idx = 0;
    let y = this.doc.y + 2;

    while (idx < n) {
      let avail = bottomLimit - y - headerH;
      if (avail < groupMin) {
        this.doc.addPage();
        y = this.doc.y + 2;
        avail = bottomLimit - y - headerH;
      }

      const rowsLeft = n - idx;
      const kMax = Math.max(1, Math.floor(avail / baseRowH));
      const k = Math.min(rowsLeft, kMax);
      const groupRowH = Math.max(baseRowH, Math.ceil(rolesBlockH / k));
      const groupH = groupRowH * k;

      drawHeaderRow(y);
      const rowsY = y + headerH;

      for (let j = 0; j < k; j++) {
        const s = bucket[idx + j];
        const ry = rowsY + j * groupRowH;
        const bg =
          (idx + j) % 2 === 1
            ? TABLE_STYLES.alternateRowColor
            : TABLE_STYLES.rowColor;
        this.doc.lineWidth(0.6);
        this.doc
          .rect(x, ry, wSno, groupRowH)
          .fillAndStroke(bg, TABLE_STYLES.borderColor);
        this.doc
          .rect(x + wSno, ry, wName, groupRowH)
          .fillAndStroke(bg, TABLE_STYLES.borderColor);
        this.doc.font(this.FONT_SEMIBOLD).fontSize(9).fillColor('#222222');
        this.doc.text(String(idx + j + 1), x + pad, ry + (groupRowH - 11) / 2, {
          width: wSno - 2 * pad,
          align: 'center',
        });
        this.doc.text(
          this.studentLabel(s.row),
          x + wSno + pad,
          ry + (groupRowH - 11) / 2,
          { width: wName - 2 * pad, align: 'left' },
        );
      }

      // Roles cell spanning this page's group; chips vertically centred.
      const rolesX = x + wSno + wName;
      this.doc
        .rect(rolesX, rowsY, wRoles, groupH)
        .fillAndStroke('#FFFFFF', TABLE_STYLES.borderColor);
      const chipsY = rowsY + Math.max(pad, (groupH - rolesH) / 2);
      this.layoutRoleChips(
        roles,
        rolesX + pad,
        chipsY,
        rolesInnerW,
        spec,
        true,
      );

      y = rowsY + groupH;
      idx += k;
    }

    this.doc.y = y + this.DEFAULT_GAP;
    this.doc.x = this.MARGIN_STD;
  }

  /**
   * Lays out the role names as rounded chips that wrap within `width`, tinted
   * with the specialization accent. When `render` is false it only measures
   * (draws nothing) and returns the total block height; when true it draws and
   * returns the same height. Lets the caller size the cell before drawing.
   */
  private layoutRoleChips(
    roles: string[],
    x: number,
    y: number,
    width: number,
    spec: SpecializationCode,
    render: boolean,
  ): number {
    const meta = SPECIALIZATIONS[spec];
    const padX = 7;
    const chipH = 17;
    const gapX = 5;
    const gapY = 5;
    const fontSize = 8;

    let cx = x;
    let cy = y;
    this.doc.font(this.FONT_SEMIBOLD).fontSize(fontSize);
    roles.forEach((r) => {
      const tw = this.doc.widthOfString(r);
      const w = tw + 2 * padX;
      if (cx > x && cx + w > x + width) {
        cx = x;
        cy += chipH + gapY;
      }
      if (render) {
        this.doc.roundedRect(cx, cy, w, chipH, chipH / 2).fill(meta.accentSoft);
        this.doc
          .fillColor(meta.accent)
          .font(this.FONT_SEMIBOLD)
          .fontSize(fontSize)
          .text(r, cx + padX, cy + (chipH - fontSize) / 2 - 1, {
            width: tw + 2,
            lineBreak: false,
          });
      }
      cx += w + gapX;
    });
    return cy - y + chipH;
  }

  /**
   * Section header: the character's comic illustration on the left, with the
   * persona title, DISC identity and narrative beside it. (The best-fit elective
   * is shown in the five-way ranking block that follows the header.)
   */
  private drawCharacterHeader(c: MBACharacter): void {
    const imgW = 190;
    const imgH = Math.round(imgW / 1.638); // illustrations are ~1.64:1
    this.ensureSpace(Math.max(imgH, 150) + 24);

    // Match h1's leading gap so sections breathe like the rest of the report.
    const topMargin = this.doc.page.margins.top;
    if (this.doc.y > topMargin + 5) this.doc.y += this.DEFAULT_GAP;

    const x = this.MARGIN_STD;
    const startY = this.doc.y;
    const accent = DISC_COLORS[c.code[0]] || this.COLOR_DEEP_BLUE;

    // Illustration: the character's own art, else (Pure Traits) the top-two
    // combination's art, else a tinted placeholder.
    const artPath = getCharacterArtCandidates(c.code)
      .map((file) => `${TRAIT_ART_DIR}/${file}`)
      .find((p) => fs.existsSync(p));
    if (artPath) {
      this.doc.image(artPath, x, startY, {
        fit: [imgW, imgH],
        align: 'center',
        valign: 'center',
      });
    } else {
      this.doc.roundedRect(x, startY, imgW, imgH, 8).fill(accent);
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(20)
        .fillColor('#FFFFFF')
        .text(c.code, x, startY + imgH / 2 - 14, {
          width: imgW,
          align: 'center',
        });
    }

    // Text column to the right of the illustration.
    const tx = x + imgW + 16;
    const tw = this.PAGE_WIDTH - this.MARGIN_STD - tx;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(16)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(c.mbaPersona, tx, startY, { width: tw });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9.5)
      .fillColor('#6B6B76')
      .text(`Trait ${c.code}  ·  ${c.name}`, tx, this.doc.y + 1, { width: tw });

    // Narrative directly under the identity line; the best-fit elective now
    // lives in the full five-way ranking block below (drawElectiveRanking).
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#33333b')
      .text(c.narrative, tx, this.doc.y + 6, { width: tw, align: 'justify' });

    // Continue below the taller of the illustration and the text column.
    this.doc.y = Math.max(this.doc.y, startY + imgH) + 8;
    this.doc.x = this.MARGIN_STD;
  }

  // ── End page (About Us) ──────────────────────────────────────────────────────

  /**
   * SVG path for a "SIM-card" rounded rectangle: rounded on three corners with
   * the top-right corner chamfered (cut diagonally) by `cut`.
   */
  private simCardPath(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    cut: number,
  ): string {
    return [
      `M ${x + r} ${y}`,
      `L ${x + w - cut} ${y}`,
      `L ${x + w} ${y + cut}`,
      `L ${x + w} ${y + h - r}`,
      `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
      `L ${x + r} ${y + h}`,
      `Q ${x} ${y + h} ${x} ${y + h - r}`,
      `L ${x} ${y + r}`,
      `Q ${x} ${y} ${x + r} ${y}`,
      'Z',
    ].join(' ');
  }

  /**
   * Reads an SVG icon from ICON_DIR and returns its path `d` strings plus the
   * (square) viewBox size, cached so each file is parsed once.
   */
  private loadSvgIcon(file: string): { paths: string[]; size: number } | null {
    if (this.svgIconCache[file]) return this.svgIconCache[file];
    const full = `${ICON_DIR}/${file}`;
    if (!fs.existsSync(full)) return null;
    const svg = fs.readFileSync(full, 'utf8');
    const vb = svg.match(/viewBox="([\d.\s-]+)"/);
    const size = vb ? parseFloat(vb[1].trim().split(/\s+/)[2]) || 512 : 512;
    const paths: string[] = [];
    const re = /<path[^>]*\sd="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(svg)) !== null) paths.push(m[1]);
    const parsed = { paths, size };
    this.svgIconCache[file] = parsed;
    return parsed;
  }

  /**
   * Service-card icon: the category's vector SVG, scaled into a `size` box and
   * filled - so the glyph shows its own detail (windows, holes, internal lines)
   * exactly as designed, rather than a traced contour. Each `<path>` is filled
   * independently with the non-zero rule, matching how the SVG itself renders.
   * `kind` matches the END_PAGE.services `icon` value.
   */
  private drawServiceIcon(
    kind: string,
    ox: number,
    oy: number,
    size: number,
    color = '#68B569',
  ): void {
    const icon = this.loadSvgIcon(SERVICE_ICON_FILES[kind]);
    if (!icon || icon.paths.length === 0) return;
    this.doc.save();
    this.doc.translate(ox, oy).scale(size / icon.size);
    for (const d of icon.paths) this.doc.path(d).fill(color);
    this.doc.restore();
  }

  /**
   * Large faint decorative glyph inside a Vision/Mission box, drawn from the
   * white PNG icon assets (vision = eye/bulb, mission = target) at low opacity.
   */
  private drawBoxGlyph(
    kind: 'vision' | 'mission',
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ): void {
    const file = `${ICON_DIR}/${kind === 'vision' ? 'vision-white.png' : 'mission-white.png'}`;
    if (!fs.existsSync(file)) return;
    const sz = bh * 0.58;
    const ix = bx + bw - sz - 22;
    const iy = by + (bh - sz) / 2;
    this.doc.save();
    this.doc.opacity(0.16);
    this.doc.image(file, ix, iy, { fit: [sz, sz] });
    this.doc.restore();
    this.doc.opacity(1);
  }

  /**
   * Closing "About Us" page: intro paragraph, side-by-side Vision/Mission
   * boxes, Core Values bullets, a four-card "Our Services" row, and a footnote
   * disclaimer. Laid out manually to fit a single page.
   */
  private generateEndPage(): void {
    const x = this.MARGIN_STD;
    const fullW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const bottomY = this.PAGE_HEIGHT - this.MARGIN_STD;

    // About Us.
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(16)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(END_PAGE.about_title, x, this.MARGIN_STD);
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10.5)
      .fillColor('#222222')
      .text(END_PAGE.about_text, x, this.doc.y + 8, {
        width: fullW,
        align: 'justify',
      });

    // Vision / Mission - two touching half-width boxes, each with a faint glyph.
    const boxW = fullW / 2;
    const pad = 20;
    const innerW = boxW - 2 * pad;
    const titleH = 26;
    this.doc.font(this.FONT_REGULAR).fontSize(11);
    const bodyH = Math.max(
      this.doc.heightOfString(END_PAGE.vision_text, { width: innerW }),
      this.doc.heightOfString(END_PAGE.mission_text, { width: innerW }),
    );
    const boxH = pad + titleH + 6 + bodyH + pad + 10;
    const top = this.doc.y + 18;

    this.doc.rect(x, top, boxW, boxH).fill('#312A7B');
    this.drawBoxGlyph('vision', x, top, boxW, boxH);
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(19)
      .fillColor('#69B769')
      .text(END_PAGE.vision_title, x + pad, top + pad, { width: innerW });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(11)
      .fillColor('#FFFFFF')
      .text(END_PAGE.vision_text, x + pad, top + pad + titleH + 6, {
        width: innerW,
      });

    const gx = x + boxW;
    this.doc.rect(gx, top, boxW, boxH).fill('#69B769');
    this.drawBoxGlyph('mission', gx, top, boxW, boxH);
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(19)
      .fillColor('#312A7B')
      .text(END_PAGE.mission_title, gx + pad, top + pad, { width: innerW });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(11)
      .fillColor('#FFFFFF')
      .text(END_PAGE.mission_text, gx + pad, top + pad + titleH + 6, {
        width: innerW,
      });

    this.doc.y = top + boxH + 18;
    this.doc.x = x;

    // Core Values.
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(14)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(END_PAGE.core_values_title, x, this.doc.y);
    this.doc.y += 8;
    // Rendered manually (not the shared `list` helper) so the small bullet sits
    // on the text's optical centre and stays a tidy size.
    const cvFontSize = 10.5;
    const cvBulletR = 1.7;
    const cvIndent = 8;
    const cvLabelGap = 13;
    const cvTextW = fullW - cvIndent - cvLabelGap;
    this.doc.font(this.FONT_REGULAR).fontSize(cvFontSize);
    END_PAGE.core_values.forEach((item) => {
      const itemY = this.doc.y;
      this.doc
        .circle(x + cvIndent + cvBulletR, itemY + cvFontSize * 0.58, cvBulletR)
        .fill('#222222');
      this.doc
        .fillColor('#222222')
        .text(item, x + cvIndent + cvLabelGap, itemY, { width: cvTextW });
      this.doc.y += 5;
    });
    this.doc.x = x;

    // Divider.
    this.doc.y += 12;
    this.doc
      .lineWidth(0.6)
      .strokeColor('#cfcfe6')
      .moveTo(x, this.doc.y)
      .lineTo(x + fullW, this.doc.y)
      .stroke();
    this.doc.y += 16;

    // Our Services (centered).
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(16)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(END_PAGE.services_title, x, this.doc.y, {
        width: fullW,
        align: 'center',
      });
    this.doc.y += 12;

    // Disclaimer is anchored to the page bottom; the cards stretch down to it
    // so the page fills evenly (text stays top-aligned in each card).
    const discText = `*${END_PAGE.disclaimer_label} ${END_PAGE.disclaimer_text}`;
    this.doc.font(this.FONT_ITALIC).fontSize(7.3);
    const discH = this.doc.heightOfString(discText, { width: fullW });
    const discY = bottomY - discH;

    const cardGap = 12;
    const cardW = (fullW - cardGap * 3) / 4;
    const cardPad = 11;
    const cardInnerW = cardW - 2 * cardPad;
    const cardTop = this.doc.y;
    const iconSize = 30;
    const titleBlock = 18;
    this.doc.font(this.FONT_REGULAR).fontSize(7.6);
    const maxBodyH = Math.max(
      ...END_PAGE.services.map((s) =>
        this.doc.heightOfString(s.text, { width: cardInnerW }),
      ),
    );
    const contentH =
      cardPad + iconSize + 10 + titleBlock + 6 + maxBodyH + cardPad;
    const cardH = Math.max(contentH, discY - 14 - cardTop);

    END_PAGE.services.forEach((s, i) => {
      const cx = x + i * (cardW + cardGap);
      this.doc
        .path(this.simCardPath(cx, cardTop, cardW, cardH, 7, 16))
        .lineWidth(1)
        .stroke('#b9c3df');
      this.drawServiceIcon(s.icon, cx + cardPad, cardTop + cardPad, iconSize);
      this.doc
        .font(this.FONT_BOLD)
        .fontSize(13)
        .fillColor('#1B1B27')
        .text(s.title, cx + cardPad, cardTop + cardPad + iconSize + 10, {
          width: cardInnerW,
        });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(7.6)
        .fillColor('#555555')
        .text(
          s.text,
          cx + cardPad,
          cardTop + cardPad + iconSize + 10 + titleBlock + 6,
          { width: cardInnerW, align: 'left' },
        );
    });

    // Disclaimer at the very bottom of the page - same italic body style
    // throughout; only the "*Disclaimer:" label is tinted blue.
    this.doc
      .font(this.FONT_ITALIC)
      .fontSize(7.3)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(`*${END_PAGE.disclaimer_label} `, x, discY, {
        width: fullW,
        align: 'left',
        continued: true,
      });
    this.doc.fillColor('#58595b').text(END_PAGE.disclaimer_text, {
      continued: false,
    });
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
   * Per-student 1–5 specialization ranking. Rank 1 is always the character's
   * primary best-fit and rank 2 its secondary (so it matches the rest of the
   * report); the remaining three are ordered by the student's DISC behavioural
   * alignment to each specialization.
   */
  private electiveRanks(s: ScoredStudent): Record<SpecializationCode, number> {
    const primary = s.character.primarySpec;
    const secondary = s.character.secondarySpec;
    const alignScore = (code: SpecializationCode): number => {
      const a: BehavioralAlignment = DISC_ALIGNMENT[s.primaryTrait][code];
      return a === 'Strong' ? 3 : a === 'Moderate' ? 2 : 1;
    };
    const rest = SPECIALIZATION_ORDER.filter(
      (c) => c !== primary && c !== secondary,
    ).sort(
      (a, b) =>
        alignScore(b) - alignScore(a) ||
        SPECIALIZATION_ORDER.indexOf(a) - SPECIALIZATION_ORDER.indexOf(b),
    );
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
   * Bright, vivid colors for the specialization pie. These are lighter/punchier
   * than the deep `accent` shades used elsewhere so the chart reads clearly with
   * white text (matching the placement-handbook style).
   */
  private readonly SPEC_HEADER_COLOR: Record<SpecializationCode, string> = {
    FIN: '#2D5BD0', // bright blue
    HR: '#17A398', // bright teal
    BA: '#7C4DCC', // bright purple
    OPS: '#E07B2E', // bright orange
    MKT: '#D63384', // bright magenta
  };
}
