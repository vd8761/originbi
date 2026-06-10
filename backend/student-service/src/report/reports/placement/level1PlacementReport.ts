/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * Level 1 Placement Report
 * ------------------------
 * Group-level placement-style PDF built from the Level-1 DISC cohort. Ported
 * directly from the standalone `specialization-report/` service (verified
 * on KIOT MBA + KIOT CSE cohorts), adapted to the originBI backend asset
 * layout. Self-contained PDF generator — does not extend BaseReport because
 * the report mixes portrait (cover, summary) and landscape (master grid)
 * pages, whereas BaseReport's pageAdded listener assumes a single layout.
 */
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

import {
  Level1CohortResult,
  Level1CohortStudent,
} from '../../helpers/level1CohortHelper';
import {
  SPEC_MAP,
  FIT_COLUMNS,
  ELECTIVES,
  LEGEND_TEXT,
  HIGH_FACTOR_TEXT,
  calculateDiscProfile,
  isHighFactor,
} from '../college/specializationConstants';
import { logger } from '../../helpers/logger';

// ── Theme ──────────────────────────────────────────────────────────────────
const DEEP_BLUE = '#150089';
const GREEN = '#19D36A';
const GREEN_TINT = '#E6FBF0';
const HEADER_BG = '#150089';
const HEADER_TEXT = '#FFFFFF';
const ZEBRA = '#F4F5FB';
const BORDER = '#D7D9E8';
const TEXT = '#1B1B27';
const MUTED = '#58595B';

const ASSETS_DIR = path.resolve(process.cwd(), 'public/assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');

// Fonts (registered into PDFKit by id)
const F_SORA_BOLD = 'Sora-Bold';
const F_SORA_SEMI = 'Sora-SemiBold';
const F_SORA_REG = 'Sora-Regular';
const F_REG = 'Inter-Regular';
const F_BOLD = 'Inter-Bold';
const F_SEMI = 'Inter-SemiBold';
const F_ITALIC = 'Inter-Italic';

const BANNER_TITLE = 'Behavioral Profiling & Specialization Analysis';
const ROLES_TO_SHOW = 5;

interface Row {
  student: Level1CohortStudent;
  code: string;
}

interface ColSpec {
  key:
    | 'sl'
    | 'name'
    | 'code'
    | 'trait'
    | 'roles'
    | 'finance'
    | 'hr'
    | 'marketing'
    | 'operations'
    | 'analytics';
  label: string;
  width: number;
  align: 'left' | 'center';
}

export class Level1PlacementReport {
  private doc: PDFKit.PDFDocument;
  private readonly groupName: string;
  private readonly departmentName: string | null;
  private readonly rows: Row[];

  // Landscape A4 geometry.
  private readonly PW = 841.89;
  private readonly PH = 595.28;
  private readonly MARGIN = 30;

  // Portrait A4 geometry (cover, summary).
  private readonly PORT_W = 595.28;
  private readonly PORT_H = 841.89;
  private readonly PORT_MARGIN = 50;

  /** Y position just below the grid + legend, used to flow later sections. */
  private gridEndY = 0;

  private readonly cols: ColSpec[] = [
    { key: 'sl', label: 'Sl. No.', width: 30, align: 'center' },
    { key: 'name', label: 'Student Name', width: 110, align: 'left' },
    { key: 'code', label: 'Trait Code', width: 40, align: 'center' },
    { key: 'trait', label: 'Trait Name', width: 110, align: 'left' },
    { key: 'roles', label: 'Top Future Roles', width: 232, align: 'left' },
    { key: 'finance', label: 'Finance', width: 46, align: 'center' },
    { key: 'hr', label: 'HR', width: 36, align: 'center' },
    { key: 'marketing', label: 'Marketing', width: 58, align: 'center' },
    { key: 'operations', label: 'Operations', width: 60, align: 'center' },
    { key: 'analytics', label: 'Business Analytics', width: 60, align: 'center' },
  ];

  constructor(cohort: Level1CohortResult) {
    this.groupName = cohort.groupName;
    this.departmentName = cohort.departmentName;
    this.rows = cohort.students.map((student) => ({
      student,
      code: calculateDiscProfile(student.scores),
    }));

    this.doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      autoFirstPage: false,
      bufferPages: true,
    });
    this.registerFonts();
  }

  private registerFonts(): void {
    const map: Record<string, string> = {
      [F_SORA_BOLD]: 'Sora-Bold.ttf',
      [F_SORA_SEMI]: 'Sora-SemiBold.ttf',
      [F_SORA_REG]: 'Sora-Regular.ttf',
      [F_REG]: 'Inter-Regular.ttf',
      [F_BOLD]: 'Inter-Bold.ttf',
      [F_SEMI]: 'Inter-SemiBold.ttf',
      [F_ITALIC]: 'Inter-Italic.ttf',
    };
    for (const [id, file] of Object.entries(map)) {
      const p = path.join(FONTS_DIR, file);
      if (fs.existsSync(p)) this.doc.registerFont(id, p);
    }
  }

  async generate(outputPath: string): Promise<void> {
    logger.info('[LEVEL1 PLACEMENT] Starting Generation...');
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);
    const done = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    this.drawCover();
    this.drawElectiveSummaryPage();
    this.drawGrid();
    this.drawHighFactorBlocks();
    this.addFooters();

    this.doc.end();
    await done;
    logger.info(`[LEVEL1 PLACEMENT] PDF generated at: ${outputPath}`);
  }

  // ── Cover (portrait, full-report style) ───────────────────────────────────
  private drawCover(): void {
    const W = this.PORT_W;
    const H = this.PORT_H;
    this.doc.addPage({ size: 'A4', layout: 'portrait', margin: 0 });

    const bg = path.join(IMAGES_DIR, 'Cover_Background.jpg');
    if (fs.existsSync(bg)) {
      this.doc.image(bg, 0, 0, { width: W, height: H });
    } else {
      this.doc.rect(0, 0, W, H).fill('#f0f0f0');
    }

    this.doc
      .font(F_SORA_BOLD)
      .fontSize(30)
      .fillColor(DEEP_BLUE)
      .text(BANNER_TITLE, 35, 38, { width: W - 80, align: 'left' });

    // Footer block: group name + department + date.
    const footerY = H - 130;
    this.doc
      .font(F_SEMI)
      .fontSize(18)
      .fillColor(TEXT)
      .text('Group Assessment', 35, footerY);
    this.doc
      .font(F_SORA_BOLD)
      .fontSize(22)
      .fillColor(DEEP_BLUE)
      .text(this.groupName, 35, footerY + 24, { width: W - 70 });

    if (this.departmentName) {
      this.doc
        .font(F_SEMI)
        .fontSize(12)
        .fillColor(MUTED)
        .text(this.departmentName, 35, this.doc.y + 2, { width: W - 70 });
    }

    const dateString = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.doc
      .font(F_REG)
      .fontSize(13)
      .fillColor(MUTED)
      .text(dateString, 35, this.doc.y + 6);
  }

  // ── Elective-wise summary (portrait, starts on page 2) ────────────────────
  private newPortraitPage(): number {
    this.doc.addPage({ size: 'A4', layout: 'portrait', margin: 0 });
    // Portrait pages use the full-bleed watermark background (A4 portrait).
    const bg = path.join(IMAGES_DIR, 'Watermark_Background.jpg');
    if (fs.existsSync(bg)) {
      this.doc.image(bg, 0, 0, { width: this.PORT_W, height: this.PORT_H });
    }
    return 60;
  }

  private drawElectiveSummaryPage(): void {
    const margin = this.PORT_MARGIN;
    const usableW = this.PORT_W - 2 * margin;
    const bottom = this.PORT_H - margin - 8;

    let y = this.newPortraitPage();

    // Heading.
    this.doc
      .font(F_SORA_BOLD)
      .fontSize(22)
      .fillColor(DEEP_BLUE)
      .text('Elective-Wise Placement Fit Summary', margin, y, { width: usableW });
    y = this.doc.y + 2;
    this.doc
      .font(F_SORA_SEMI)
      .fontSize(13)
      .fillColor(GREEN)
      .text('Strongest Fitment', margin, y);
    y = this.doc.y + 14;

    // ── Elective briefs ────────────────────────────────────────────────────
    this.doc
      .font(F_SORA_SEMI)
      .fontSize(14)
      .fillColor(DEEP_BLUE)
      .text('About the Electives', margin, y);
    y = this.doc.y + 10;

    const labelX = margin + 12;
    const briefW = usableW - 12;
    for (const e of ELECTIVES) {
      // Measure the whole block so it never splits across pages.
      this.doc.font(F_SEMI).fontSize(12);
      const labelH = this.doc.heightOfString(e.label, { width: briefW });
      this.doc.font(F_REG).fontSize(10);
      const blurbH = this.doc.heightOfString(e.blurb, { width: briefW });
      const blockH = labelH + blurbH + 12;

      if (y + blockH > bottom) y = this.newPortraitPage();

      // Accent bar.
      this.doc.rect(margin, y + 1, 4, blockH - 6).fill(e.accent);
      this.doc
        .font(F_SEMI)
        .fontSize(12)
        .fillColor(TEXT)
        .text(e.label, labelX, y, { width: briefW });
      this.doc
        .font(F_REG)
        .fontSize(10)
        .fillColor(MUTED)
        .text(e.blurb, labelX, this.doc.y + 1, { width: briefW, align: 'justify' });
      y = this.doc.y + 12;
    }

    // ── Summary table ──────────────────────────────────────────────────────
    const counts = ELECTIVES.map((e) => {
      let n = 0;
      for (const row of this.rows) {
        const spec = SPEC_MAP[row.code];
        if (spec && (spec as unknown as Record<string, unknown>)[e.key] === 1) n++;
      }
      return n;
    });
    const total = counts.reduce((a, b) => a + b, 0);

    const headerH = 32;
    const rowH = 34;
    const tableBlockH = 28 + headerH + (ELECTIVES.length + 1) * rowH + 26;
    if (y + tableBlockH > bottom) y = this.newPortraitPage();
    else y += 10;

    this.doc
      .font(F_SORA_SEMI)
      .fontSize(14)
      .fillColor(DEEP_BLUE)
      .text('Strongest-Fit Headcount by Elective', margin, y);
    y = this.doc.y + 8;

    const tableX = margin;
    const tableW = usableW;
    const col2W = 200;
    const col1W = tableW - col2W;

    // Header.
    this.doc.lineWidth(0.8);
    this.doc.rect(tableX, y, col1W, headerH).fillAndStroke(HEADER_BG, BORDER);
    this.doc
      .rect(tableX + col1W, y, col2W, headerH)
      .fillAndStroke(HEADER_BG, BORDER);
    this.doc
      .font(F_BOLD)
      .fontSize(10.5)
      .fillColor(HEADER_TEXT)
      .text('Type of Elective', tableX + 14, y + (headerH - 12) / 2, {
        width: col1W - 28,
      });
    this.doc
      .font(F_BOLD)
      .fontSize(10.5)
      .fillColor(HEADER_TEXT)
      .text('Strongest Fit', tableX + col1W, y + (headerH - 12) / 2, {
        width: col2W,
        align: 'center',
      });
    y += headerH;

    // Data rows.
    ELECTIVES.forEach((e, i) => {
      const zebra = i % 2 === 1;
      this.doc
        .rect(tableX, y, col1W, rowH)
        .fillAndStroke(zebra ? ZEBRA : '#FFFFFF', BORDER);
      this.doc
        .rect(tableX + col1W, y, col2W, rowH)
        .fillAndStroke(zebra ? ZEBRA : '#FFFFFF', BORDER);
      // accent dot
      this.doc.circle(tableX + 16, y + rowH / 2, 4).fill(e.accent);
      this.doc
        .font(F_SEMI)
        .fontSize(12)
        .fillColor(TEXT)
        .text(e.label, tableX + 28, y + (rowH - 14) / 2, { width: col1W - 40 });
      this.doc
        .font(F_SORA_BOLD)
        .fontSize(17)
        .fillColor(DEEP_BLUE)
        .text(String(counts[i]), tableX + col1W, y + (rowH - 18) / 2, {
          width: col2W,
          align: 'center',
        });
      y += rowH;
    });

    // Total row.
    this.doc.rect(tableX, y, col1W, rowH).fillAndStroke('#EDEFFA', BORDER);
    this.doc
      .rect(tableX + col1W, y, col2W, rowH)
      .fillAndStroke('#EDEFFA', BORDER);
    this.doc
      .font(F_SORA_BOLD)
      .fontSize(12)
      .fillColor(DEEP_BLUE)
      .text('Total', tableX + 16, y + (rowH - 14) / 2, { width: col1W - 32 });
    this.doc
      .font(F_SORA_BOLD)
      .fontSize(17)
      .fillColor(DEEP_BLUE)
      .text(String(total), tableX + col1W, y + (rowH - 18) / 2, {
        width: col2W,
        align: 'center',
      });
    y += rowH;

    this.doc
      .font(F_ITALIC)
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        `${LEGEND_TEXT}.  Each student's strongest-fit elective is counted once  ·  Total students: ${this.rows.length}.`,
        tableX,
        y + 10,
        { width: tableW },
      );
  }

  // ── Master grid (landscape) ───────────────────────────────────────────────
  private cellText(row: Row, col: ColSpec, index: number): string {
    const spec = SPEC_MAP[row.code];
    switch (col.key) {
      case 'sl':
        return String(index + 1);
      case 'name':
        return row.student.fullName;
      case 'code':
        return row.code;
      case 'trait':
        return spec?.trait ?? '—';
      case 'roles':
        return (spec?.roles ?? []).slice(0, ROLES_TO_SHOW).join('  ·  ');
      default:
        return spec
          ? String((spec as unknown as Record<string, number | string>)[col.key])
          : '—';
    }
  }

  /** Draws the OriginBI page background in fit mode (aspect preserved, centered). */
  private drawPageBackground(): void {
    // Landscape pages use the metaphor/specialization landscape background if
    // present; falls back to the standard watermark otherwise.
    const candidates = [
      path.join(IMAGES_DIR, 'Level1_Landscape_Background.png'),
      path.join(IMAGES_DIR, 'Watermark_Background.jpg'),
    ];
    const bg = candidates.find((p) => fs.existsSync(p));
    if (bg) {
      this.doc.image(bg, 0, 0, {
        fit: [this.PW, this.PH],
        align: 'center',
        valign: 'center',
      });
    }
  }

  private addContentPage(): number {
    this.doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
    this.drawPageBackground();
    // Subtle page title band.
    this.doc
      .font(F_SORA_SEMI)
      .fontSize(13)
      .fillColor(DEEP_BLUE)
      .text('Specialization & Trait Mapping', this.MARGIN, 22);
    const sub = this.departmentName
      ? `${this.groupName}  ·  ${this.departmentName}`
      : this.groupName;
    this.doc
      .font(F_REG)
      .fontSize(9)
      .fillColor(MUTED)
      .text(sub, this.MARGIN, 40);
    return 60;
  }

  private drawHeader(y: number): number {
    const headerH = 34;
    let x = this.MARGIN;
    this.doc.lineWidth(0.6);
    for (const col of this.cols) {
      this.doc.rect(x, y, col.width, headerH).fillAndStroke(HEADER_BG, BORDER);
      this.doc.font(F_BOLD).fontSize(8).fillColor(HEADER_TEXT);
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

  private measureRow(row: Row, index: number): number {
    let max = 18;
    for (const col of this.cols) {
      const txt = this.cellText(row, col, index);
      const font =
        col.key === 'roles' ? F_REG : col.key === 'name' ? F_SEMI : F_REG;
      this.doc.font(font).fontSize(col.key === 'roles' ? 7.5 : 8);
      let h = this.doc.heightOfString(txt, { width: col.width - 8 });
      if (col.key === 'name' && row.student.mobile) {
        this.doc.font(F_REG).fontSize(6.5);
        h +=
          this.doc.heightOfString(row.student.mobile, {
            width: col.width - 8,
          }) + 2;
      }
      if (h + 10 > max) max = h + 10;
    }
    return max;
  }

  private drawGrid(): void {
    let y = this.addContentPage();
    y = this.drawHeader(y);

    const bottom = this.PH - this.MARGIN - 16;

    if (this.rows.length === 0) {
      this.doc
        .font(F_ITALIC)
        .fontSize(11)
        .fillColor(MUTED)
        .text(
          'No students with a completed Level-1 assessment were found for this group.',
          this.MARGIN,
          y + 20,
          { width: this.PW - 2 * this.MARGIN },
        );
      return;
    }

    this.rows.forEach((row, i) => {
      const rowH = this.measureRow(row, i);
      if (y + rowH > bottom) {
        y = this.addContentPage();
        y = this.drawHeader(y);
      }

      const spec = SPEC_MAP[row.code];
      let x = this.MARGIN;
      const zebra = i % 2 === 1;

      for (const col of this.cols) {
        const isFit = (FIT_COLUMNS as readonly string[]).includes(col.key);
        const value =
          isFit && spec
            ? ((spec as unknown as Record<string, unknown>)[col.key] as number)
            : null;
        const strongest = value === 1;

        const bg = strongest ? GREEN_TINT : zebra ? ZEBRA : '#FFFFFF';
        this.doc.rect(x, y, col.width, rowH).fillAndStroke(bg, BORDER);

        // Name cell with a mobile sub-line (only for duplicate names).
        if (col.key === 'name' && row.student.mobile) {
          const name = row.student.fullName;
          const mobile = row.student.mobile;
          this.doc.font(F_SEMI).fontSize(8);
          const nameH = this.doc.heightOfString(name, { width: col.width - 8 });
          this.doc.font(F_REG).fontSize(6.5);
          const mobH = this.doc.heightOfString(mobile, { width: col.width - 8 });
          const ty = y + Math.max(4, (rowH - (nameH + mobH + 2)) / 2);
          this.doc
            .font(F_SEMI)
            .fontSize(8)
            .fillColor(TEXT)
            .text(name, x + 4, ty, { width: col.width - 8 });
          this.doc
            .font(F_REG)
            .fontSize(6.5)
            .fillColor(MUTED)
            .text(mobile, x + 4, ty + nameH + 2, { width: col.width - 8 });
          x += col.width;
          continue;
        }

        const txt = this.cellText(row, col, i);
        let font = F_REG;
        let size = 8;
        let color = TEXT;
        if (col.key === 'name') font = F_SEMI;
        if (col.key === 'code') {
          font = F_SORA_BOLD;
          color = DEEP_BLUE;
        }
        if (col.key === 'roles') size = 7.5;
        if (strongest) {
          font = F_BOLD;
          color = '#0E8C46';
        }

        const txtH = (() => {
          this.doc.font(font).fontSize(size);
          return this.doc.heightOfString(txt, { width: col.width - 8 });
        })();
        const ty = y + Math.max(4, (rowH - txtH) / 2);

        this.doc
          .font(font)
          .fontSize(size)
          .fillColor(color)
          .text(txt, x + 4, ty, {
            width: col.width - 8,
            align: col.align === 'center' ? 'center' : 'left',
          });

        x += col.width;
      }
      y += rowH;
    });

    // Legend directly beneath the grid.
    this.doc
      .font(F_SEMI)
      .fontSize(9)
      .fillColor(MUTED)
      .text(LEGEND_TEXT, this.MARGIN, y + 8);

    this.gridEndY = y + 8 + 14;
  }

  // ── High-factor explanation blocks ───────────────────────────────────────
  private drawHighFactorBlocks(): void {
    const present = new Set(
      this.rows.map((r) => r.code).filter((c) => isHighFactor(c)),
    );
    if (present.size === 0) return;

    const traits = (['D', 'I', 'S', 'C'] as const).filter((t) =>
      present.has(t),
    );
    const contentW = this.PW - 2 * this.MARGIN - 16;

    this.doc.font(F_REG).fontSize(11);
    const blockHeights = traits.map((t) =>
      this.doc.heightOfString(HIGH_FACTOR_TEXT[t], { width: contentW }),
    );
    const HEADING_H = 26;
    const INTRO_H = 22;
    const needed =
      HEADING_H + INTRO_H + blockHeights.reduce((a, b) => a + b + 16, 0);

    const bottom = this.PH - this.MARGIN - 16;
    const samePageStart = this.gridEndY + 24;

    let y: number;
    if (this.gridEndY > 0 && samePageStart + needed <= bottom) {
      y = samePageStart;
    } else {
      this.doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
      this.drawPageBackground();
      y = 40;
    }

    this.doc
      .font(F_SORA_BOLD)
      .fontSize(16)
      .fillColor(DEEP_BLUE)
      .text('High-Factor Trait Profiles', this.MARGIN, y);
    y += HEADING_H;
    this.doc
      .font(F_ITALIC)
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        'Applied where a single dimension is dominant enough to override the standard dual-trait combination.',
        this.MARGIN,
        y,
        { width: this.PW - 2 * this.MARGIN },
      );
    y += INTRO_H;

    traits.forEach((t, idx) => {
      const txt = HIGH_FACTOR_TEXT[t];
      const h = blockHeights[idx];
      this.doc.rect(this.MARGIN, y, 4, h).fill(GREEN);
      this.doc
        .font(F_REG)
        .fontSize(11)
        .fillColor(TEXT)
        .text(txt, this.MARGIN + 14, y, { width: contentW });
      y += h + 16;
    });
  }

  // ── Footers ──────────────────────────────────────────────────────────────
  private addFooters(): void {
    const range = this.doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      this.doc.switchToPage(range.start + i);
      if (i === 0) continue; // skip cover
      const w = this.doc.page.width;
      const h = this.doc.page.height;
      this.doc
        .font(F_REG)
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Page ${i}`, 0, h - 24, {
          width: w - this.MARGIN,
          align: 'right',
        });
      this.doc
        .font(F_REG)
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          'Origin BI · Behavioral Profiling & Specialization Analysis',
          this.MARGIN,
          h - 24,
        );
    }
  }
}
