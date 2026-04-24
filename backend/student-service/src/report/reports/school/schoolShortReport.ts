/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import * as fs from 'fs';
import { SchoolData } from '../../types/types';
import { BaseReport } from '../BaseReport';
import {
  SCHOOL_BLENDED_STYLE_MAPPING,
  TRAIT_REASONS,
  STREAM_AGILE_COMPATIBILITY,
  DISC_AGILE_CAREER_PACE,
  DiscAgileEntry,
  STREAM_FUTURE_DIRECTIONS,
  STREAM_NAMES,
  STREAM_ODYSSEY_ROADMAP,
} from './schoolConstants';
import { logger } from '../../helpers/logger';
import {
  getCompatibilityMatrixDetails,
  CourseCompatibility,
} from '../../helpers/sqlHelper';

const STREAM_EXPANDED: Record<string, string> = {
  PCMB: 'Physics, Chemistry, Maths & Biology',
  PCM: 'Physics, Chemistry & Maths',
  PCB: 'Physics, Chemistry & Biology',
  PCBZ: 'Physics, Chemistry, Biology & Zoology',
  Commerce: 'Commerce / Management',
  Humanities: 'Arts / Humanities',
};

const WATERMARK_BG = 'public/assets/images/Watermark_Background.jpg';

/**
 * SchoolShortReport
 * ------------------
 * Produces a strictly single-page PDF summary of a school student's
 * behavioural profile. Supports SSLC (Class 10) and HSC (Class 12);
 * GCSE is routed through the same class via `variant`.
 *
 * Sections (SSLC):
 *   1. Header band
 *   2. Report overview (3-line context)
 *   3. Where You Fit Best
 *   4. Other Available Streams
 *   5. Career Flight Path
 *   6. Disclaimer + reference to the full report
 *
 * Sections (HSC):
 *   1. Header band
 *   2. About this report
 *   3. Your Stream (chosen stream + 10-year vision)
 *   4. Course Compatibility Matrix (top 3 courses per department)
 *   5. Disclaimer
 */
export class SchoolShortReport extends BaseReport {
  private data: SchoolData;
  private variant: 'SSLC' | 'HSC' | 'GCSE';
  private rankedStreams: { name: string; compat: number }[] = [];
  private hscCourses: CourseCompatibility[] = [];

  private readonly CONTENT_X = this.MARGIN_STD;
  private readonly CONTENT_W = this.PAGE_WIDTH - 2 * this.MARGIN_STD;

  private readonly C_ACCENT_DONT = '#B0381A';
  private readonly C_CARD_BG = '#F4F3FB';
  private readonly C_CARD_BORDER = '#E0DEF2';
  private readonly C_MUTED = '#5D5D70';

  constructor(
    data: SchoolData,
    options?: PDFKit.PDFDocumentOptions,
    variant: 'SSLC' | 'HSC' | 'GCSE' = 'SSLC',
  ) {
    super(options);
    this.data = data;
    this.variant = variant;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info(
      `[School SHORT REPORT] Starting ${this.variant} Single-Page PDF...`,
    );

    if (this.variant === 'HSC') {
      await this.preloadHscCourses();
    } else {
      this.preloadRankedStreams();
    }

    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    this._useStdMargins = false;
    this._currentBackground = null;

    if (this.variant === 'HSC') {
      this.renderHSC();
    } else {
      this.renderSSLC();
    }

    this.doc.end();
    await streamFinished;
    logger.info(
      `[School SHORT REPORT] PDF generated successfully at: ${outputPath}`,
    );
  }

  // ============================================================
  // LAYOUT
  // ============================================================
  private renderSSLC(): void {
    const [t1, t2] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const combo = t1 + t2;

    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawOverview(y + 6, combo);
    y = this.drawWhereYouFitBest(y + 8, combo);
    y = this.drawAllStreams(y + 8);
    y = this.drawCareerFlightPath(y + 18, t1 as 'D' | 'I' | 'S' | 'C');

    const DISCLAIMER_H = 56;
    const disclaimerY = Math.max(
      y + 8,
      this.PAGE_HEIGHT - 32 - DISCLAIMER_H - 8,
    );
    this.drawDisclaimer(disclaimerY);

    this.drawFooterStrip();
  }

  // ------------------------------------------------------------
  // PRELOAD
  // ------------------------------------------------------------
  private preloadRankedStreams(): void {
    const agile = this.data.agile_scores?.[0];
    const agileMap: Record<string, number> = {
      Focus: agile?.focus ?? 0,
      Courage: agile?.courage ?? 0,
      Respect: agile?.respect ?? 0,
      Openness: agile?.openness ?? 0,
      Commitment: agile?.commitment ?? 0,
    };
    const topAgile = Object.entries(agileMap).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    this.rankedStreams = Object.keys(STREAM_AGILE_COMPATIBILITY)
      .map((name) => ({
        name,
        compat:
          (STREAM_AGILE_COMPATIBILITY[name] || {})[topAgile || 'Focus'] ?? 65,
      }))
      .sort((a, b) => b.compat - a.compat);
  }

  // ------------------------------------------------------------
  // HSC PRELOAD — fetch course compatibility for chosen stream
  // ------------------------------------------------------------
  private async preloadHscCourses(): Promise<void> {
    const [t1, t2] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const traitCode = t1 + t2;

    try {
      this.hscCourses = await getCompatibilityMatrixDetails(
        traitCode,
        this.data.school_stream_id,
      );
    } catch (err) {
      logger.warn(
        `[School SHORT REPORT] Failed to fetch HSC course matrix`,
        err,
      );
      this.hscCourses = [];
    }
  }

  // ============================================================
  // HSC LAYOUT
  // ============================================================
  private renderHSC(): void {
    this.drawPageFrame();

    let y = 20;
    y = this.drawHeader(y);
    y = this.drawAboutThisReport(y + 14);
    y = this.drawYourStream(y + 18);
    y = this.drawCourseMatrix(y + 10);

    const DISCLAIMER_H = 56;
    const disclaimerY = Math.max(
      y + 14,
      this.PAGE_HEIGHT - 32 - DISCLAIMER_H - 8,
    );
    this.drawFullDisclaimer(disclaimerY, DISCLAIMER_H);

    this.drawFooterStrip();
  }

  // ------------------------------------------------------------
  // HSC-1. ABOUT THIS REPORT
  // ------------------------------------------------------------
  private drawAboutThisReport(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('About This Report', x, y, { lineBreak: false });

    const body =
      'This short report offers a focused snapshot of the stream you have chosen — your 10-year career outlook within it, and the courses that align best with your traits, grouped by department.';

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#2A2A36')
      .text(body, x, y + 22, {
        width: w,
        lineGap: 1.6,
      });

    return this.doc.y;
  }

  // ------------------------------------------------------------
  // HSC-2. YOUR STREAM (chosen stream + 10-year vision odyssey)
  // ------------------------------------------------------------
  private drawYourStream(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 220;

    const streamId = this.data.school_stream_id ?? 0;
    const streamName = STREAM_NAMES[streamId] ?? '—';
    const streamFull = STREAM_EXPANDED[streamName] ?? streamName;
    const odyssey = STREAM_ODYSSEY_ROADMAP[streamName];

    // Section heading
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Stream', x, y, { lineBreak: false });

    // Stream abbreviation
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(22)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(streamName, x, y + 24, {
        width: w * 0.3,
        lineBreak: false,
      });

    // Full form
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor(this.C_MUTED)
      .text(streamFull, x, y + 52, {
        width: w * 0.32,
        lineBreak: false,
        ellipsis: true,
      });

    // Tagline (right of stream block)
    const taglineText = odyssey?.tagline ?? 'Your 10-Year Vision';
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(11.5)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(taglineText, x + w * 0.34, y + 28, {
        width: w * 0.66,
        lineBreak: true,
        height: 34,
        ellipsis: true,
      });

    // Odyssey roadmap area
    if (odyssey && odyssey.nodes.length > 0) {
      this.drawOdysseyRoadmap(x, y + 58, w, h - 58, odyssey.nodes);
    }

    return y + h;
  }

  // ------------------------------------------------------------
  // HSC-2b. 10-YEAR VISION ODYSSEY (winding wave timeline)
  // ------------------------------------------------------------
  private drawOdysseyRoadmap(
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    nodes: { label: string; title: string; subtitle: string }[],
  ): void {
    const startX = boxX + 54;
    const endX = boxX + boxW - 54;
    const amplitude = 20;
    const centerY = boxY + boxH / 2;
    const DASHED_LINE_LENGTH = 14;

    // Draw winding wave path
    this.doc.save();
    this.doc
      .lineWidth(3)
      .strokeColor('#E8EAF6')
      .lineJoin('round')
      .lineCap('round');

    const segments = 80;
    for (let j = 0; j <= segments; j++) {
      const p = j / segments;
      const xp = startX + p * (endX - startX);
      const ang = p * Math.PI * 2.5;
      const yp = centerY + Math.cos(ang) * amplitude;
      if (j === 0) this.doc.moveTo(xp, yp);
      else this.doc.lineTo(xp, yp);
    }
    this.doc.stroke();
    this.doc.restore();

    // Draw nodes + labels
    nodes.forEach((node, i) => {
      const progress = i / (nodes.length - 1);
      const nodeX = startX + progress * (endX - startX);
      const ang = progress * Math.PI * 2.5;
      const nodeY = centerY + Math.cos(ang) * amplitude;
      const textAbove = i % 2 !== 0;

      const nodeR = 6;
      let dashEndY: number;
      let labelY: number;
      let titleY: number;
      let subtitleY: number;

      const LABEL_W = 95;
      const TITLE_W = 108;
      const SUB_W = 108;

      this.doc.font(this.FONT_SORA_BOLD).fontSize(9);
      const labelH = this.doc.heightOfString(node.label, {
        width: LABEL_W,
        align: 'center',
      });
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8);
      const titleH = this.doc.heightOfString(node.title, {
        width: TITLE_W,
        align: 'center',
      });
      this.doc.font(this.FONT_REGULAR).fontSize(7.2);
      const subtitleH = this.doc.heightOfString(node.subtitle, {
        width: SUB_W,
        align: 'center',
      });

      if (textAbove) {
        dashEndY = nodeY - nodeR - DASHED_LINE_LENGTH;
        subtitleY = dashEndY - 2 - subtitleH;
        titleY = subtitleY - 2 - titleH;
        labelY = titleY - 2 - labelH;
      } else {
        dashEndY = nodeY + nodeR + DASHED_LINE_LENGTH;
        labelY = dashEndY + 2;
        titleY = labelY + labelH + 2;
        subtitleY = titleY + titleH + 2;
      }

      // Dashed connector
      this.doc
        .save()
        .lineWidth(1)
        .strokeColor('#A0AABF')
        .dash(2.5, { space: 2.5 })
        .moveTo(nodeX, nodeY + (textAbove ? -nodeR : nodeR))
        .lineTo(nodeX, dashEndY)
        .stroke()
        .restore();

      // Node circle
      this.doc
        .circle(nodeX, nodeY, nodeR)
        .fill('#2FB67C')
        .lineWidth(2)
        .strokeColor('#FFFFFF')
        .stroke();

      // Label (Year/Phase)
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(9)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(node.label, nodeX - LABEL_W / 2, labelY, {
          width: LABEL_W,
          align: 'center',
          lineBreak: false,
        });

      // Title
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8)
        .fillColor('#2A2A36')
        .text(node.title, nodeX - TITLE_W / 2, titleY, {
          width: TITLE_W,
          align: 'center',
          height: titleH,
        });

      // Subtitle
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(7.2)
        .fillColor('#6B6B78')
        .text(node.subtitle, nodeX - SUB_W / 2, subtitleY, {
          width: SUB_W,
          align: 'center',
          height: subtitleH,
        });
    });
  }

  // ------------------------------------------------------------
  // HSC-3. COURSE COMPATIBILITY MATRIX
  //   Top 3 courses per department, up to 4 departments.
  // ------------------------------------------------------------
  private drawCourseMatrix(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    // Group courses by department preserving insertion order, keep top 3 each.
    const deptMap = new Map<string, CourseCompatibility[]>();
    for (const c of this.hscCourses) {
      const dept = (c.department_name || 'General').trim();
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept).push(c);
    }
    const depts = Array.from(deptMap.entries())
      .slice(0, 4)
      .map(([name, courses]) => ({
        name,
        courses: courses
          .slice()
          .sort(
            (a, b) => b.compatibility_percentage - a.compatibility_percentage,
          )
          .slice(0, 3),
      }));

    // Section header
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Course Compatibility Matrix', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor(this.C_MUTED)
      .text(
        'Use this matrix to compare the strongest course options within each department. Higher percentages show stronger alignment with your trait profile.',
        x,
        y + 22,
        { width: w, lineGap: 1.0 },
      );

    if (depts.length === 0) {
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(this.C_MUTED)
        .text(
          'Course compatibility data is not available for this stream.',
          x,
          y + 50,
          { width: w, lineBreak: false },
        );
      return y + 70;
    }

    // 2-column x 2-row grid of departments
    const colGap = 26;
    const rowGap = 18;
    const colW = (w - colGap) / 2;
    const gridTop = y + 52;

    // Measure each dept block height to determine row heights
    const blockHeights = depts.map((d) =>
      this.measureDeptBlock(colW, d.courses),
    );
    const row1H = Math.max(blockHeights[0] ?? 0, blockHeights[1] ?? 0);
    const row2H = Math.max(blockHeights[2] ?? 0, blockHeights[3] ?? 0);

    depts.forEach((dept, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = x + col * (colW + colGap);
      const cy = gridTop + (row === 0 ? 0 : row1H + rowGap);
      this.drawDeptBlock(cx, cy, colW, dept.name, dept.courses);
    });

    const totalH = 52 + row1H + (row2H > 0 ? rowGap + row2H : 0);
    return y + totalH;
  }

  private measureDeptBlock(w: number, courses: CourseCompatibility[]): number {
    const HEADER_H = 26;
    const PCT_W = 44;
    let total = HEADER_H;
    courses.forEach((c) => {
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(9.5);
      const nameH = this.doc.heightOfString(c.course_name || 'Course', {
        width: w - PCT_W - 8,
        lineGap: 1.0,
      });
      total += Math.max(nameH, 13) + 9;
    });
    return total;
  }

  private drawDeptBlock(
    x: number,
    y: number,
    w: number,
    deptName: string,
    courses: CourseCompatibility[],
  ): void {
    // Dept header
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(deptName, x, y, {
        width: w,
        lineBreak: false,
        ellipsis: true,
      });

    // Divider
    this.doc
      .lineWidth(0.5)
      .strokeColor('#CBD5E0')
      .moveTo(x, y + 17)
      .lineTo(x + w, y + 17)
      .stroke();

    let cy = y + 26;
    const PCT_W = 44;
    const nameW = w - PCT_W - 8;

    courses.forEach((c) => {
      const pct = Math.max(
        0,
        Math.min(100, Math.round(c.compatibility_percentage || 0)),
      );
      const name = c.course_name || 'Course';

      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(9.5);
      const nameH = this.doc.heightOfString(name, {
        width: nameW,
        lineGap: 1.0,
      });

      // Course name (wraps naturally to the next line)
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9.5)
        .fillColor(this.COLOR_BLACK)
        .text(name, x, cy, {
          width: nameW,
          lineGap: 1.0,
        });

      // Percentage — aligned to first line of course name
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(`${pct}%`, x + w - PCT_W, cy, {
          width: PCT_W,
          align: 'right',
          lineBreak: false,
        });

      cy += Math.max(nameH, 13) + 9;
    });
  }

  // ------------------------------------------------------------
  // HSC-4. FULL DISCLAIMER (compacted to fit)
  // ------------------------------------------------------------
  private drawFullDisclaimer(y: number, h: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Disclaimer', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor('#3A3A46')
      .text(
        'This short report is a quick summary generated from your responses and should support, not replace, your final stream or course decision. Please refer to the full Origin BI report for detailed trait insights, stream comparisons, and career guidance.',
        x,
        y + 22,
        { width: w, lineGap: 1.2 },
      );

    return y + h;
  }

  // ------------------------------------------------------------
  // FRAME
  // ------------------------------------------------------------
  private drawPageFrame(): void {
    if (fs.existsSync(WATERMARK_BG)) {
      this.doc.image(WATERMARK_BG, 0, 0, {
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

  // ------------------------------------------------------------
  // HEADER
  // ------------------------------------------------------------
  private drawHeader(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(`${this.variant}  •  Short Report`, x, y, { lineBreak: false });

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
      .text(this.data.full_name || '—', metaX, y + 14, {
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

  // ------------------------------------------------------------
  // 1. ABOUT THIS REPORT
  // ------------------------------------------------------------
  private drawOverview(y: number, combo: string): number {
    const block =
      SCHOOL_BLENDED_STYLE_MAPPING[combo] || SCHOOL_BLENDED_STYLE_MAPPING.DI;
    const styleLabel = this.stripHtml(block.style_name || combo)
      .replace(/^you are\s+/i, '')
      .trim();
    const body = `This short report gives you a quick snapshot of your academic direction. It highlights your best-fit stream, other available streams, and your career flight path. Your profile reflects a ${styleLabel} pattern that shapes these recommendations.`;

    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('About This Report', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9.5)
      .fillColor('#2A2A36')
      .text(body, x, y + 22, {
        width: w,
        lineGap: 1.2,
      });

    return this.doc.y;
  }

  // ------------------------------------------------------------
  // 2. WHERE YOU FIT BEST
  // ------------------------------------------------------------
  private drawWhereYouFitBest(y: number, combo: string): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 112;

    const stream = this.rankedStreams[0] ?? { name: '—', compat: 0 };
    const reasons = (TRAIT_REASONS[combo] || []).slice(0, 3);
    const fields =
      STREAM_FUTURE_DIRECTIONS[stream.name] ?? 'Academic and career pathways';

    this.doc.roundedRect(x, y, w, h, 8).fillAndStroke('#EDF8F1', '#CDE9D8');

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .fillColor('#2E7D4F')
      .text('WHERE YOU FIT BEST', x + 14, y + 10, { lineBreak: false });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(22)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(stream.name, x + 14, y + 22, {
        width: w * 0.32,
        lineBreak: false,
      });

    const fullForm = STREAM_EXPANDED[stream.name] ?? stream.name;
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(this.C_MUTED)
      .text(fullForm, x + 14, y + 48, {
        width: w * 0.32,
        lineBreak: false,
        ellipsis: true,
      });

    const matchPct = Math.max(0, Math.min(100, Math.round(stream.compat || 0)));

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(this.C_MUTED)
      .text('Based on agile dimensions', x + 14, y + 64, {
        width: w * 0.32,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7.5)
      .fillColor('#2E7D4F')
      .text('Departments', x + 14, y + 80, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.9)
      .fillColor('#34554A')
      .text(fields, x + 14, y + 91, {
        width: w * 0.32,
        height: 28,
        lineGap: 0.8,
        ellipsis: true,
      });

    const rightX = x + w * 0.36;
    const rightMaxX = x + w - 14;
    const rightW = rightMaxX - rightX;

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .fillColor('#2E7D4F')
      .text('MATCH STRENGTH', rightX, y + 10, { lineBreak: false });
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(24)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(`${matchPct}%`, rightX, y + 23, {
        width: 74,
        lineBreak: false,
      });

    const barX = rightX + 82;
    const barY = y + 34;
    const barW = rightW - 82;
    const barH = 7;
    this.doc.roundedRect(barX, barY, barW, barH, barH / 2).fill('#DCEBE2');
    this.doc
      .roundedRect(barX, barY, (matchPct / 100) * barW, barH, barH / 2)
      .fill('#2E7D4F');
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(this.C_MUTED)
      .text('Agile stream alignment', barX, y + 46, {
        width: barW,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .fillColor('#2E7D4F')
      .text('WHY THIS FITS YOU', rightX, y + 64, { lineBreak: false });

    const reasonGap = 8;
    const reasonCardH = 22;
    const reasonStartY = y + 80;
    const reasonMaxX = rightX + rightW;
    let reasonX = rightX;
    let reasonY = reasonStartY;

    reasons.forEach((reason) => {
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(7.8);
      const measuredTextW = this.doc.widthOfString(reason);
      const reasonCardW = Math.min(measuredTextW + 24, rightW);
      if (reasonX > rightX && reasonX + reasonCardW > reasonMaxX) {
        reasonX = rightX;
        reasonY += reasonCardH + 6;
      }

      this.doc
        .roundedRect(
          reasonX,
          reasonY,
          reasonCardW,
          reasonCardH,
          reasonCardH / 2,
        )
        .fillAndStroke('#FFFFFF', '#B7D9C5');
      this.doc
        .fillColor('#1F5B3A')
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(7.8)
        .text(reason, reasonX + 10, reasonY + 6, {
          width: reasonCardW - 16,
          height: reasonCardH - 8,
          lineBreak: false,
          ellipsis: true,
        });

      reasonX += reasonCardW + reasonGap;
    });

    return y + h;
  }

  // ------------------------------------------------------------
  // 3. ALL AVAILABLE STREAM OPTIONS
  // ------------------------------------------------------------
  private drawAllStreams(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 172;
    const streams = this.rankedStreams.slice(0, 6);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('All Available Streams', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor(this.C_MUTED)
      .text('All stream options ranked for this profile.', x, y + 22, {
        lineBreak: false,
      });

    if (streams.length === 0) {
      return y + h;
    }

    const colGap = 10;
    const rowGap = 16;
    const colW = (w - 28 - colGap) / 2;
    const cardH = 32;
    const startY = y + 44;

    streams.forEach((stream, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cx = x + 14 + col * (colW + colGap);
      const cy = startY + row * (cardH + rowGap);
      const pct = Math.max(0, Math.min(100, Math.round(stream.compat || 0)));
      const isTop = index === 0;

      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(13)
        .fillColor(isTop ? this.COLOR_DEEP_BLUE : this.COLOR_BLACK)
        .text(`${index + 1}. ${stream.name}`, cx + 8, cy + 4, {
          width: colW - 56,
          lineBreak: false,
          ellipsis: true,
        });

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor('#44635A')
        .text(`${pct}%`, cx + colW - 46, cy + 5, {
          width: 38,
          align: 'right',
          lineBreak: false,
        });

      const streamFullName = STREAM_EXPANDED[stream.name] ?? stream.name;
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8.1)
        .fillColor(this.C_MUTED)
        .text(streamFullName, cx + 8, cy + 21, {
          width: colW - 16,
          lineBreak: false,
          ellipsis: true,
        });
    });

    return y + h;
  }

  // ------------------------------------------------------------
  // 4. CAREER FLIGHT PATH
  // ------------------------------------------------------------
  private drawCareerFlightPath(
    y: number,
    primaryTrait: 'D' | 'I' | 'S' | 'C',
  ): number {
    const agile = this.data.agile_scores?.[0] ?? {
      focus: 0,
      courage: 0,
      respect: 0,
      openness: 0,
      commitment: 0,
    };
    const agileMap: Record<string, number> = {
      Focus: agile.focus ?? 0,
      Courage: agile.courage ?? 0,
      Respect: agile.respect ?? 0,
      Openness: agile.openness ?? 0,
      Commitment: agile.commitment ?? 0,
    };
    const topAgile = Object.entries(agileMap).sort((a, b) => b[1] - a[1])[0][0];

    const group = DISC_AGILE_CAREER_PACE[primaryTrait];
    const entry: DiscAgileEntry | undefined =
      group?.entries.find((item) => item.agileValue === topAgile) ??
      group?.entries[0];

    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 220;
    const explainer =
      'This view compares your likely pace to senior responsibility with the broader industry timeline. It uses your dominant trait and strongest agile value to estimate how quickly you may grow over time, where you may gain an advantage, and which challenge may need attention so your progress stays steady through important career transitions.';

    this.doc.roundedRect(x, y, w, h, 8).fillAndStroke('#FFF9F0', '#F2E0BC');

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Career Flight Path', x + 14, y + 10, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.3)
      .fillColor('#5F4B32')
      .text(explainer, x + 14, y + 30, {
        width: w - 28,
        height: 44,
        lineGap: 0.9,
        ellipsis: true,
      });

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(entry ? `You: ${entry.predictedPace}` : 'You: —', x + 14, y + 84, {
        width: w * 0.5,
        lineBreak: false,
      });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        entry
          ? `Industry avg to seniority: ${entry.industryAvg}`
          : 'Industry benchmark unavailable.',
        x + 14,
        y + 102,
        { width: w * 0.5, lineBreak: false },
      );

    if (entry) {
      this.drawPaceBar(x + 14, y + 126, w - 28, entry);

      const bottomY = y + 174;
      const colGap = 14;
      const colW = (w - 28 - colGap) / 2;

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8.5)
        .fillColor('#0E7C42')
        .text('YOUR EDGE', x + 14, bottomY, { lineBreak: false });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8.2)
        .fillColor('#2A2A36')
        .text(entry.motivation, x + 14, bottomY + 11, {
          width: colW,
          lineGap: 1.1,
        });

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8.5)
        .fillColor(this.C_ACCENT_DONT)
        .text(
          `WATCH OUT — ${entry.challengeTitle}`,
          x + 14 + colW + colGap,
          bottomY,
          { width: colW, lineBreak: false, ellipsis: true },
        );
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(8.2)
        .fillColor('#2A2A36')
        .text(entry.challengeDesc, x + 14 + colW + colGap, bottomY + 11, {
          width: colW,
          lineGap: 1.1,
        });
    }

    return y + h;
  }

  private drawPaceBar(
    x: number,
    y: number,
    w: number,
    entry: DiscAgileEntry,
  ): void {
    const parsePace = (value: string): [number, number] => {
      const numbers = value.match(/\d+/g)?.map(Number) ?? [0];
      return numbers.length >= 2
        ? [numbers[0], numbers[1]]
        : [numbers[0], numbers[0]];
    };
    const parseAvg = (value: string): number =>
      parseInt(value.match(/\d+/)?.[0] ?? '12', 10);

    const [, paceEnd] = parsePace(entry.predictedPace);
    const industryYr = parseAvg(entry.industryAvg);
    const maxYr = Math.max(15, industryYr + 2);
    const toX = (yr: number) => x + (yr / maxYr) * w;
    const barH = 8;

    this.doc.roundedRect(x, y, w, barH, barH / 2).fill('#EEF0F5');

    const xYou = toX(paceEnd);
    const xInd = toX(industryYr);
    const xMax = toX(maxYr);

    const fillSlice = (fromX: number, toXVal: number, fill: string) => {
      if (toXVal <= fromX) return;
      this.doc.save();
      this.doc.roundedRect(x, y, w, barH, barH / 2).clip();
      this.doc.rect(fromX, y, toXVal - fromX, barH).fill(fill);
      this.doc.restore();
    };

    fillSlice(x, xYou, '#4DB6AC');

    if (xInd > xYou) {
      this.doc.save();
      this.doc.roundedRect(x, y, w, barH, barH / 2).clip();
      const grad = this.doc.linearGradient(xYou, y, xInd, y);
      grad.stop(0, '#4DB6AC');
      grad.stop(1, '#E8633A');
      this.doc.rect(xYou, y, xInd - xYou, barH).fill(grad);
      this.doc.restore();
    }

    fillSlice(xInd, xMax, '#E8633A');

    this.doc
      .circle(xYou, y + barH / 2, 4.5)
      .fillAndStroke('#FFFFFF', '#00695C');

    this.doc.font(this.FONT_REGULAR).fontSize(7).fillColor(this.C_MUTED);
    [0, 5, 10, 15].forEach((tick) => {
      if (tick > maxYr) return;
      const tx = toX(tick);
      this.doc.text(`${tick}y`, tx - 7, y + barH + 3, {
        width: 14,
        align: 'center',
        lineBreak: false,
      });
    });

    const swatchY = y + barH + 14;
    this.doc.rect(x, swatchY, 10, 6).fill('#4DB6AC');
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7)
      .fillColor('#333')
      .text('Your pace', x + 14, swatchY - 1, { lineBreak: false });
    this.doc.rect(x + 68, swatchY, 10, 6).fill('#E8633A');
    this.doc
      .fillColor('#333')
      .text('Industry pace', x + 82, swatchY - 1, { lineBreak: false });
  }

  // ------------------------------------------------------------
  // 5. DISCLAIMER
  // ------------------------------------------------------------
  private drawDisclaimer(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 56;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Disclaimer', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor('#3A3A46')
      .text(
        'This short report is a quick summary and should support, not replace, your final stream decision. Please refer to the full Origin BI report for detailed trait insights, stream comparisons, and guidance on next steps.',
        x,
        y + 22,
        {
          width: w,
          lineGap: 1.2,
        },
      );

    return y + h;
  }

  // ------------------------------------------------------------
  // FOOTER
  // ------------------------------------------------------------
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

  private drawInsetAccentStrip(
    x: number,
    y: number,
    h: number,
    color: string,
  ): void {
    const stripW = 4;
    const insetX = 3;
    const insetY = 8;
    this.doc
      .roundedRect(x + insetX, y + insetY, stripW, h - insetY * 2, stripW / 2)
      .fill(color);
  }

  // ------------------------------------------------------------
  // UTIL
  // ------------------------------------------------------------
  private stripHtml(value: string): string {
    return value
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
