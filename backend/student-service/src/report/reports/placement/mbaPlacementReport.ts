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
 * Service-card icon vector paths (Font Awesome Free v7, viewBox 0 0 640 640),
 * keyed by the END_PAGE.services `icon` value. Rendered scaled + filled.
 */
const SERVICE_ICON_PATHS: Record<string, string> = {
  school:
    'M32 256C32 220.7 60.7 192 96 192L160 192L287.9 76.9C306.2 60.5 333.9 60.5 352.1 76.9L480 192L544 192C579.3 192 608 220.7 608 256L608 512C608 547.3 579.3 576 544 576L96 576C60.7 576 32 547.3 32 512L32 256zM256 440L256 528L384 528L384 440C384 417.9 366.1 400 344 400L296 400C273.9 400 256 417.9 256 440zM144 448C152.8 448 160 440.8 160 432L160 400C160 391.2 152.8 384 144 384L112 384C103.2 384 96 391.2 96 400L96 432C96 440.8 103.2 448 112 448L144 448zM160 304L160 272C160 263.2 152.8 256 144 256L112 256C103.2 256 96 263.2 96 272L96 304C96 312.8 103.2 320 112 320L144 320C152.8 320 160 312.8 160 304zM528 448C536.8 448 544 440.8 544 432L544 400C544 391.2 536.8 384 528 384L496 384C487.2 384 480 391.2 480 400L480 432C480 440.8 487.2 448 496 448L528 448zM544 304L544 272C544 263.2 536.8 256 528 256L496 256C487.2 256 480 263.2 480 272L480 304C480 312.8 487.2 320 496 320L528 320C536.8 320 544 312.8 544 304zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z',
  cap: 'M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z',
  people:
    'M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.4 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z',
  exec: 'M320 312C253.7 312 200 258.3 200 192C200 125.7 253.7 72 320 72C386.3 72 440 125.7 440 192C440 258.3 386.3 312 320 312zM289.5 368L350.5 368C360.2 368 368 375.8 368 385.5C368 389.7 366.5 393.7 363.8 396.9L336.4 428.9L367.4 544L368 544L402.6 405.5C404.8 396.8 413.7 391.5 422.1 394.7C484 418.3 528 478.3 528 548.5C528 563.6 515.7 575.9 500.6 575.9L139.4 576C124.3 576 112 563.7 112 548.6C112 478.4 156 418.4 217.9 394.8C226.3 391.6 235.2 396.9 237.4 405.6L272 544.1L272.6 544.1L303.6 429L276.2 397C273.5 393.8 272 389.8 272 385.6C272 375.9 279.8 368.1 289.5 368.1z',
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
 *   best-fit elective chip + narrative + grooming + roster whose merged column
 *   lists the combination's future-fit roles). Closing pages and the landscape
 *   master grid are implemented but disabled - see generate().
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

  private generateCharacterSection(code: string): void {
    const c = getMBACharacter(code);
    const bucket = this.characterBuckets[code];
    const primaryName = SPECIALIZATIONS[c.primarySpec].name;

    // Header card: comic art + persona identity + best-fit chip + narrative.
    this.drawCharacterHeader(c, primaryName);

    // Why we point this character at these roles (brief reasoning).
    this.p(c.reasoning, { align: 'justify' });

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
   * Draws a rounded "pill" chip at (x, y) and returns its width, so callers can
   * place several in a row. Used for the best-fit elective in section headers.
   */
  private chip(
    x: number,
    y: number,
    text: string,
    bg: string,
    fg: string,
    h = 21,
    fontSize = 11,
  ): number {
    this.doc.font(this.FONT_SEMIBOLD).fontSize(fontSize);
    const tw = this.doc.widthOfString(text);
    const w = tw + 20;
    this.doc.roundedRect(x, y, w, h, h / 2).fill(bg);
    this.doc
      .fillColor(fg)
      .font(this.FONT_SEMIBOLD)
      .fontSize(fontSize)
      .text(text, x + 10, y + (h - fontSize) / 2 - 1.5, {
        width: tw + 2,
        lineBreak: false,
      });
    return w;
  }

  /**
   * Section header: the character's comic illustration on the left, with the
   * persona title, DISC identity, best-fit line and narrative beside it.
   */
  private drawCharacterHeader(c: MBACharacter, primaryName: string): void {
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

    // Best-fit elective as a standalone chip (the future roles live in the
    // table); no label or secondary text per request.
    const meta = SPECIALIZATIONS[c.primarySpec];
    const chipH = 21;
    const chipY = this.doc.y + 6;
    this.chip(tx, chipY, primaryName, meta.accent, '#FFFFFF', chipH);
    this.doc.y = chipY + chipH;
    this.doc.x = tx;

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#33333b')
      .text(c.narrative, tx, this.doc.y + 5, { width: tw, align: 'justify' });

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
   * Service-card icon: the category's Font Awesome vector path, scaled into an
   * `size` box and filled. `kind` matches the END_PAGE.services `icon` value.
   */
  private drawServiceIcon(
    kind: string,
    ox: number,
    oy: number,
    size: number,
    color = '#68B569',
  ): void {
    const d = SERVICE_ICON_PATHS[kind];
    if (!d) return;
    this.doc.save();
    this.doc.translate(ox, oy).scale(size / 640);
    // Outline style: stroke the glyph contour instead of filling it. Line width
    // is set in the 640-unit space, so divide by the scale to get a ~2px stroke.
    this.doc
      .lineWidth((2 * 640) / size)
      .lineJoin('round')
      .lineCap('round')
      .path(d)
      .stroke(color);
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
    const file = `${ICON_DIR}/${kind === 'vision' ? 'vision-white.png' : 'target-white.png'}`;
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
