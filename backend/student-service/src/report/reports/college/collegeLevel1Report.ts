import * as fs from 'fs';
import * as path from 'path';
import { CollegeData, COLORS } from '../../types/types';
import { BaseReport } from '../BaseReport';
import { blendedTraits } from './collegeConstants';
import { SPEC_MAP, SpecEntry, ELECTIVES } from './specializationConstants';
import { logger } from '../../helpers/logger';
import * as zlib from 'zlib';

const WATERMARK_BG = 'public/assets/images/Watermark_Background.jpg';

/**
 * Pure-trait threshold. The behavioural assessment has 40 questions; when a
 * single dimension is the most-answered type 20+ times it dominates strongly
 * enough to resolve to a "pure" single-trait profile (e.g. I = Pure Influence)
 * rather than a two-letter blend. Matches calculateDiscProfile().
 */
const PURE_TRAIT_THRESHOLD = 20;

/** Full-form names for the four behavioural dimensions (no letter codes). */
const DIMENSION_NAMES: Record<string, string> = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

/**
 * CollegeLevel1Report
 * -------------------
 * A short, two-page "Level 1 Only" report that summarises a student's
 * Level 1 Behavioural (DISC) result without requiring ACI data.
 *
 * Page 1 - Hero: superhero image as the full card background, trait-combination
 *          title, description, DISC score bars, and defining behaviours.
 * Page 2 - Direction: specialization fit (canonical order), top future roles,
 *          strengths & watch-outs, and disclaimer.
 */
export class CollegeLevel1Report extends BaseReport {
  private data: CollegeData;

  private readonly CONTENT_X = this.MARGIN_STD;
  private readonly CONTENT_W = this.PAGE_WIDTH - 2 * this.MARGIN_STD;

  private readonly C_CARD_BG = '#F4F3FB';
  private readonly C_CARD_BORDER = '#E0DEF2';
  private readonly C_MUTED = '#5D5D70';
  private readonly C_RULE = '#DCDCE4';
  private readonly C_INK = '#1B1B27';
  private readonly C_ACCENT_GREEN = '#0E7C42';

  private readonly SNAPSHOT_LABEL = 'Behavioural Snapshot';

  // DISC dimension accent colours
  private readonly DISC_COLORS = {
    D: '#E53E3E',
    I: '#D97706',
    S: '#38A169',
    C: '#3182CE',
  };

  constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  public async generate(outputPath: string): Promise<void> {
    logger.info('[College LEVEL 1 REPORT] Starting two-page PDF...');

    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    this._useStdMargins = false;
    this._currentBackground = null;

    const combo = this.resolveProfileCode(
      this.data.most_answered_answer_type,
      this.data,
    );
    const block = blendedTraits[combo] || blendedTraits.DI;

    // ── PAGE 1 ──
    this.drawPageFrame();
    let y = this.drawHeader(20);
    // Hero image only: pure single-trait profiles have no dedicated artwork, so
    // fall back to the legacy top-two blend's image (the rest of the page still
    // uses the resolved pure profile).
    const imageCombo =
      combo.length === 1
        ? this.resolveTopTwoCombo(
            this.data.most_answered_answer_type,
            this.data,
          )
        : combo;
    const imageBlock = blendedTraits[imageCombo] || blendedTraits.DI;
    const heroPath = this.resolveTraitImagePath(imageBlock.name);
    const panelColor = this.getHeroPanelColor(heroPath);
    y = this.drawHeroCard(y + 14, combo, block, panelColor, heroPath);
    y = this.drawDiscBars(y + 22);
    this.drawDefiningBehaviours(y + 22, block);
    this.drawFooterStrip(1);

    // ── PAGE 2 ──
    // Resolve the specialization (and its future roles) from the SAME top-two
    // profile used for the page-1 archetype, so the recommendation and roles
    // always match the behavioural archetype the student is shown.
    const spec = SPEC_MAP[combo] || SPEC_MAP.DI;

    this.doc.addPage();
    this.drawPageFrame();
    y = this.drawHeader(20);
    y = this.drawSpecializationFit(y + 12, spec);
    y = this.drawFutureRoles(y + 12, spec);
    y = this.drawStrengthsAndWatchOuts(y + 12, block);
    y = this.drawNextSteps(y + 12, spec);
    this.drawDisclaimer(y + 12);
    this.drawFooterStrip(2);

    this.doc.end();
    await streamFinished;
    logger.info(`[College LEVEL 1 REPORT] PDF generated at: ${outputPath}`);
  }

  // ============================================================
  // PAGE FRAME
  // ============================================================
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

  // ============================================================
  // HEADER  (mirrors CollegeMBAShortReport)
  // ============================================================
  private drawHeader(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    const logoH = 22;
    const logoW = 78;
    const titleFontSize = 16;
    const nameSize = 15;
    const dateSize = 8.5;
    const metaGap = 4;

    const metaX = x + w * 0.62;
    const metaW = w * 0.38;
    const metaH = nameSize + metaGap + dateSize;

    const titleLeft = x + logoW + 12;
    const titleAvailW = metaX - titleLeft - 16;
    const titleText = 'Behavioural Snapshot';

    this.doc.font(this.FONT_SORA_BOLD).fontSize(titleFontSize);
    const titleH = this.doc.heightOfString(titleText, { width: titleAvailW });

    const contentH = Math.max(logoH, titleH, metaH);
    const bandH = contentH + 4;
    const midY = y + bandH / 2;

    // Logo
    const logoPath = this.resolveLogoPath();
    if (logoPath) {
      this.doc.image(logoPath, x, midY - logoH / 2, { height: logoH });
    }

    // Title
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(titleFontSize)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(titleText, titleLeft, midY - titleH / 2, {
        width: titleAvailW,
        lineGap: 0,
      });

    // Name
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
        { width: metaW, align: 'right', lineBreak: false },
      );

    // Rule
    const ruleY = y + bandH + 4;
    this.doc
      .lineWidth(0.6)
      .strokeColor(this.C_RULE)
      .moveTo(x, ruleY)
      .lineTo(x + w, ruleY)
      .stroke();

    return ruleY;
  }

  // ============================================================
  // FOOTER  (mirrors CollegeMBAShortReport)
  // ============================================================
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

  // ============================================================
  // PAGE 1 — HERO CARD
  // Superhero image IS the card — it fills the entire card as the
  // background. A dark gradient overlay on the left side makes
  // the text readable.
  // ============================================================
  private drawHeroCard(
    y: number,
    combo: string,
    block: (typeof blendedTraits)[string],
    panelColor: string,
    heroPath: string | null,
  ): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const h = 232;
    const r = 12; // corner radius

    // ── 1. Hero image as the full card background ──
    this.doc.save();
    this.doc.roundedRect(x, y, w, h, r).clip();

    // Base fill uses a colour sampled & darkened from THIS hero image, so the
    // text panel harmonises with the artwork's own background (which varies
    // per superhero) rather than clashing with a fixed brand colour.
    this.doc.rect(x, y, w, h).fill(panelColor);

    if (heroPath) {
      // The character is fitted to the card height and anchored to the right
      // edge so the full figure stays visible; the image bleeds to the card
      // edges with no inner frame — the image IS the card.
      this.doc.image(heroPath, x, y, {
        fit: [w, h],
        align: 'right',
        valign: 'bottom',
      });
    }

    // ── 2. Smooth panel→transparent fade overlay (left to right) ──
    // A single linear gradient in the sampled panel colour, so the left text
    // column is fully legible and the artwork emerges cleanly on the right
    // with no banding or visible seams.
    const grad = this.doc.linearGradient(x, y, x + w, y);
    grad.stop(0, panelColor, 1); // image fully faded out (0%) at the left edge
    grad.stop(0.34, panelColor, 1); // fully covered up to 34% of the width
    grad.stop(0.84, panelColor, 0); // fully clear past 84% of the width
    this.doc.rect(x, y, w, h).fill(grad);

    this.doc.restore();

    // ── 4. Text overlay (neutral white/light so it works on any panel hue) ──
    const tx = x + 26;
    const tw = w * 0.52;

    this.doc.save();
    this.doc.fillOpacity(0.72);
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8.5)
      .fillColor('#FFFFFF')
      .text('YOUR BEHAVIOURAL ARCHETYPE', tx, y + 26, {
        characterSpacing: 0.5,
        lineBreak: false,
      });
    this.doc.restore();
    this.doc.fillOpacity(1);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(30)
      .fillColor('#FFFFFF')
      .text(block.name, tx, y + 40, { width: tw, lineGap: 0 });

    let cy = this.doc.y + 8;

    // Top-traits pill — shows the DISC code(s) alongside the full dimension
    // name(s). A pure single-trait profile reads "Top Trait: I (Influence)";
    // a blend reads "Top Two Traits: CD (Conscientiousness & Dominance)".
    const c1 = combo.charAt(0);
    const c2 = combo.charAt(1);
    const n1 = DIMENSION_NAMES[c1] || '';
    const n2 = DIMENSION_NAMES[c2] || '';
    let pillLabel: string;
    if (c2 && n2) {
      pillLabel = `Top Two Traits:  ${combo} (${n1} & ${n2})`;
    } else if (n1) {
      pillLabel = `Top Trait:  ${c1} (${n1})`;
    } else {
      pillLabel = 'Top Behavioural Traits';
    }
    this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8.5);
    const pillW = this.doc.widthOfString(pillLabel) + 24;
    this.doc.save();
    this.doc.fillOpacity(0.2);
    this.doc.roundedRect(tx, cy, pillW, 22, 11).fill('#FFFFFF');
    this.doc.restore();
    this.doc.fillOpacity(1);
    this.doc
      .fillColor('#FFFFFF')
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8.5)
      .text(pillLabel, tx + 12, cy + 7, { lineBreak: false });

    cy += 34;

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(10)
      .fillColor('#F2F2F7')
      .text(this.stripHtml(block.description), tx, cy, {
        width: tw,
        height: h - (cy - y) - 20,
        lineGap: 2.2,
        ellipsis: true,
      });

    return y + h;
  }

  /**
   * Samples the hero image and returns a darkened version of its dominant
   * colour, used as the card's text-panel background so the panel matches
   * each superhero's own artwork. Falls back to the brand deep-blue.
   *
   * Uses a small pure-JS PNG decoder (Node's built-in zlib) so there is no
   * native dependency — important for portability across Node versions.
   */
  private getHeroPanelColor(heroPath: string | null): string {
    const FALLBACK = '#0D0055';
    if (!heroPath || !fs.existsSync(heroPath)) return FALLBACK;
    try {
      const avg = this.averagePngColor(heroPath);
      if (!avg) return FALLBACK;
      // Darken toward a deep, text-legible tone while keeping the hue.
      const f = 0.34;
      const dr = Math.min(64, Math.round(avg.r * f));
      const dg = Math.min(64, Math.round(avg.g * f));
      const db = Math.min(74, Math.round(avg.b * f));
      const hx = (v: number) => v.toString(16).padStart(2, '0');
      return `#${hx(dr)}${hx(dg)}${hx(db)}`;
    } catch (e) {
      logger.warn(
        `[College LEVEL 1 REPORT] hero colour sample failed: ${
          (e as Error).message
        }`,
      );
      return FALLBACK;
    }
  }

  /**
   * Decodes an 8-bit PNG (colour types 0/2/4/6, non-interlaced) and returns
   * the average RGB of its left half, skipping near-transparent pixels.
   * Returns null for unsupported formats so the caller can fall back.
   */
  private averagePngColor(
    filePath: string,
  ): { r: number; g: number; b: number } | null {
    const buf = fs.readFileSync(filePath);
    // PNG signature: 89 50 4E 47 ...
    if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return null;

    let pos = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let interlace = 0;
    const idat: Buffer[] = [];

    while (pos + 8 <= buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const dataStart = pos + 8;
      const dataEnd = dataStart + len;
      if (dataEnd > buf.length) break;
      if (type === 'IHDR') {
        width = buf.readUInt32BE(dataStart);
        height = buf.readUInt32BE(dataStart + 4);
        bitDepth = buf[dataStart + 8];
        colorType = buf[dataStart + 9];
        interlace = buf[dataStart + 12];
      } else if (type === 'IDAT') {
        idat.push(buf.subarray(dataStart, dataEnd));
      } else if (type === 'IEND') {
        break;
      }
      pos = dataEnd + 4; // skip 4-byte CRC
    }

    if (bitDepth !== 8 || interlace !== 0) return null;
    let channels: number;
    if (colorType === 2)
      channels = 3; // RGB
    else if (colorType === 6)
      channels = 4; // RGBA
    else if (colorType === 0)
      channels = 1; // grayscale
    else if (colorType === 4)
      channels = 2; // grayscale + alpha
    else return null; // palette (3) unsupported
    if (!width || !height || idat.length === 0) return null;

    const raw = zlib.inflateSync(Buffer.concat(idat));
    const bpp = channels;
    const stride = width * bpp;
    if (raw.length < (stride + 1) * height) return null;

    const recon = Buffer.alloc(stride * height);
    const paeth = (a: number, b: number, c: number): number => {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      if (pa <= pb && pa <= pc) return a;
      if (pb <= pc) return b;
      return c;
    };

    let inPos = 0;
    for (let row = 0; row < height; row++) {
      const filter = raw[inPos++];
      const rowStart = row * stride;
      const prevStart = (row - 1) * stride;
      for (let i = 0; i < stride; i++) {
        const filt = raw[inPos++];
        const a = i >= bpp ? recon[rowStart + i - bpp] : 0;
        const b = row > 0 ? recon[prevStart + i] : 0;
        const c = row > 0 && i >= bpp ? recon[prevStart + i - bpp] : 0;
        let val: number;
        switch (filter) {
          case 0:
            val = filt;
            break;
          case 1:
            val = filt + a;
            break;
          case 2:
            val = filt + b;
            break;
          case 3:
            val = filt + ((a + b) >> 1);
            break;
          case 4:
            val = filt + paeth(a, b, c);
            break;
          default:
            return null;
        }
        recon[rowStart + i] = val & 0xff;
      }
    }

    // Average the left ~half — that is where the text panel sits, so the
    // panel colour blends into the artwork it overlaps.
    const cols = Math.max(1, Math.floor(width * 0.5));
    let r = 0;
    let g = 0;
    let bSum = 0;
    let n = 0;
    for (let row = 0; row < height; row++) {
      const rowStart = row * stride;
      for (let px = 0; px < cols; px++) {
        const off = rowStart + px * bpp;
        let pr: number;
        let pg: number;
        let pb: number;
        let pa = 255;
        if (channels >= 3) {
          pr = recon[off];
          pg = recon[off + 1];
          pb = recon[off + 2];
          if (channels === 4) pa = recon[off + 3];
        } else {
          pr = pg = pb = recon[off];
          if (channels === 2) pa = recon[off + 1];
        }
        if (pa < 200) continue; // skip near-transparent pixels
        r += pr;
        g += pg;
        bSum += pb;
        n++;
      }
    }
    if (n === 0) return null;
    return { r: r / n, g: g / n, b: bSum / n };
  }

  // ============================================================
  // PAGE 1 — DISC SCORE BARS  (new section)
  // ============================================================
  private drawDiscBars(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Behavioural Profile', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        'Your strength across the four behavioural dimensions, shown as percentages.',
        x,
        y + 18,
        { lineBreak: false },
      );

    const dims: ('D' | 'I' | 'S' | 'C')[] = ['D', 'I', 'S', 'C'];

    const scores = {
      D: this.data.score_D || 0,
      I: this.data.score_I || 0,
      S: this.data.score_S || 0,
      C: this.data.score_C || 0,
    };

    // ── 3D bar graph (same "Nature style" chart used in the full report) ──
    // Scores are already on a 0-100 scale — present directly as a percentage.
    const chartData = dims.map((key) => ({
      label: '', // category names are drawn manually below (full words)
      value: Math.max(0, Math.min(100, Math.round(scores[key]))),
      color: COLORS[key],
    }));

    const cfg = {
      barWidth: 46,
      barGap: 38,
      maxBarHeight: 120,
      slantDepth: 12,
      sideViewWidth: 22,
      labelFontSize: 10,
      categoryFontSize: 10,
      percentageLabelOffset: -22,
      categoryLabelOffset: 0,
    };

    const totalW = dims.length * cfg.barWidth + (dims.length - 1) * cfg.barGap;
    const startX = x + (w - totalW + cfg.slantDepth) / 2;
    const startY = y + 46;

    // Bars + percentage labels (helper draws empty category labels).
    this.draw3DBarChart(chartData, startX, startY, cfg);

    // Full-form dimension names centred under each bar.
    const labelY = startY + cfg.maxBarHeight + 16;
    dims.forEach((key, i) => {
      const barCenter =
        startX + i * (cfg.barWidth + cfg.barGap) + cfg.barWidth / 2;
      const boxW = cfg.barWidth + cfg.barGap;
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8.5)
        .fillColor(this.DISC_COLORS[key])
        .text(DIMENSION_NAMES[key], barCenter - boxW / 2, labelY, {
          width: boxW,
          align: 'center',
          lineBreak: false,
        });
    });

    return labelY + 14;
  }

  // ============================================================
  // PAGE 1 — DEFINING BEHAVIOURS
  // ============================================================
  private drawDefiningBehaviours(
    y: number,
    block: (typeof blendedTraits)[string],
  ): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const behaviours = (block.key_behaviours || []).slice(0, 6);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('What Defines You', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        'The behaviours that consistently show up in how you work and lead.',
        x,
        y + 18,
        { lineBreak: false },
      );

    const colGap = 16;
    const rowGap = 10;
    const colW = (w - colGap) / 2;
    const startY = y + 40;
    let col0Y = startY;
    let col1Y = startY;

    behaviours.forEach((text, i) => {
      const col = i % 2;
      const cx = x + col * (colW + colGap);
      const cy = col === 0 ? col0Y : col1Y;

      this.doc.font(this.FONT_REGULAR).fontSize(9.5);
      const textH = this.doc.heightOfString(text, {
        width: colW - 42,
        lineGap: 1.4,
      });
      const cardH = Math.max(textH + 18, 38);

      this.doc
        .roundedRect(cx, cy, colW, cardH, 8)
        .fillAndStroke(this.C_CARD_BG, this.C_CARD_BORDER);

      // Number badge
      this.doc.circle(cx + 20, cy + cardH / 2, 11).fill(this.COLOR_DEEP_BLUE);
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(`${i + 1}`, cx + 9, cy + cardH / 2 - 6, {
          width: 22,
          align: 'center',
          lineBreak: false,
        });

      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor('#2A2A36')
        .text(text, cx + 38, cy + (cardH - textH) / 2, {
          width: colW - 50,
          lineGap: 1.4,
        });

      if (col === 0) col0Y = cy + cardH + rowGap;
      else col1Y = cy + cardH + rowGap;
    });

    return Math.max(col0Y, col1Y);
  }

  // ============================================================
  // PAGE 2 — SPECIALIZATION FIT
  // Electives shown in canonical order — NOT sorted by rank.
  // ============================================================
  private drawSpecializationFit(y: number, spec: SpecEntry): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Your Specialization Fit', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        'How your behavioural profile maps to the five MBA electives.',
        x,
        y + 18,
        { lineBreak: false },
      );

    // ── Recommended specialization banner ──
    // Shows the top-two strongest electives as a podium: a big "1" beside the
    // strongest elective and a smaller, bottom-aligned "2" beside the runner-up,
    // so the second reads as shorter in height than the first.
    const bannerY = y + 34;
    const bannerH = 86;
    this.doc
      .roundedRect(x, bannerY, w, bannerH, 10)
      .fillAndStroke('#EDF8F1', '#CDE9D8');

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(8)
      .fillColor(this.C_ACCENT_GREEN)
      .text('RECOMMENDED SPECIALIZATION', x + 18, bannerY + 10, {
        lineBreak: false,
        characterSpacing: 0.4,
      });

    // Rank electives by fit weight (1 = strongest) and take the top two.
    const ranked = [...ELECTIVES]
      .map((e) => ({
        e,
        weight: (spec as unknown as Record<string, number>)[e.key],
      }))
      .sort((a, b) => a.weight - b.weight)
      .slice(0, 2);

    const podBaseY = bannerY + bannerH - 14; // shared baseline for both numerals
    const podColW = (w - 36) / 2;
    const NUM_SIZES = [42, 27]; // 1st larger, 2nd smaller
    const captions = ['STRONGEST FIT', 'SECOND-STRONGEST FIT'];

    ranked.forEach(({ e }, i) => {
      const colX = x + 18 + i * podColW;
      const numSize = NUM_SIZES[i];

      // Big numeral, bottom-aligned to the shared baseline.
      this.doc.font(this.FONT_SORA_BOLD).fontSize(numSize).fillColor(e.accent);
      const numStr = String(i + 1);
      const numW = this.doc.widthOfString(numStr);
      this.doc.text(numStr, colX, podBaseY - numSize, { lineBreak: false });

      // Caption + elective label, stacked beside the numeral. The label shares
      // the numeral's baseline (both placed at podBaseY − fontSize) so it is
      // bottom-aligned with the big number rather than floating above it.
      const labelSize = i === 0 ? 16 : 10.5;
      const textX = colX + numW + 12;
      const textW = podColW - (numW + 12) - 8;
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(7)
        .fillColor(this.C_MUTED)
        .text(captions[i], textX, podBaseY - labelSize - 13, {
          width: textW,
          characterSpacing: 0.3,
          lineBreak: false,
          ellipsis: true,
        });
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(labelSize)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(e.label, textX, podBaseY - labelSize, {
          width: textW,
          lineBreak: false,
          ellipsis: true,
        });
    });

    // ── Elective fit — canonical order (no sorting) ──
    let cy = bannerY + bannerH + 12;
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Elective Fit', x, cy, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7.5)
      .fillColor(this.C_MUTED)
      .text('1 = Strongest Fit  ·  5 = Weakest Fit', x, cy + 1, {
        width: w,
        align: 'right',
        lineBreak: false,
      });

    cy += 16;

    const rowH = 25;
    const labelW = w * 0.34;
    const barX = x + labelW + 10;
    const tagW = 86;
    const barW = w - labelW - 10 - tagW - 10;

    // Iterate in the canonical ELECTIVES order — rank 1 may not be first
    ELECTIVES.forEach((e) => {
      const weight = (spec as unknown as Record<string, number>)[e.key];
      const strongest = weight === 1;
      const rowY = cy;

      if (strongest) {
        this.doc
          .roundedRect(x - 6, rowY - 4, w + 12, rowH - 4, 6)
          .fill('#F1FBF5');
      }

      // Accent dot + label
      this.doc.circle(x + 6, rowY + 9, 4).fill(e.accent);
      this.doc
        .font(strongest ? this.FONT_SORA_BOLD : this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor(strongest ? this.C_ACCENT_GREEN : '#2A2A36')
        .text(e.label, x + 18, rowY + 4, {
          width: labelW - 18,
          lineBreak: false,
          ellipsis: true,
        });

      // Strength bar (weight 1..5 → visual strength 5..1)
      const strength = (6 - weight) / 5;
      const barY = rowY + 6;
      const barH = 7;
      this.doc.roundedRect(barX, barY, barW, barH, barH / 2).fill('#EAECF4');
      this.doc
        .roundedRect(barX, barY, Math.max(8, barW * strength), barH, barH / 2)
        .fill(e.accent);

      // Right tag
      const tagX = x + w - tagW;
      if (strongest) {
        this.doc
          .roundedRect(tagX, rowY + 1, tagW, 16, 8)
          .fill(this.C_ACCENT_GREEN);
        this.doc
          .font(this.FONT_SORA_SEMIBOLD)
          .fontSize(7.5)
          .fillColor('#FFFFFF')
          .text('STRONGEST FIT', tagX, rowY + 5, {
            width: tagW,
            align: 'center',
            lineBreak: false,
          });
      } else {
        this.doc
          .font(this.FONT_SORA_SEMIBOLD)
          .fontSize(8.5)
          .fillColor(this.C_MUTED)
          .text(`Fit rank ${weight}`, tagX, rowY + 4, {
            width: tagW,
            align: 'center',
            lineBreak: false,
          });
      }

      cy += rowH;
    });

    return cy;
  }

  // ============================================================
  // PAGE 2 — TOP FUTURE ROLES
  // ============================================================
  private drawFutureRoles(y: number, spec: SpecEntry): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    // Show every future role from the specialization mapping (the document
    // lists ten per profile) — they flow as wrapping chips.
    const roles = spec.roles || [];

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Top Future Roles', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        'Career directions this behavioural profile is well-positioned for.',
        x,
        y + 18,
        { lineBreak: false },
      );

    let chipX = x;
    let chipY = y + 34;
    const chipH = 24;
    const chipGap = 8;
    const maxX = x + w;

    roles.forEach((role) => {
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(9.5);
      const chipW = this.doc.widthOfString(role) + 26;
      if (chipX > x && chipX + chipW > maxX) {
        chipX = x;
        chipY += chipH + chipGap;
      }
      this.doc
        .roundedRect(chipX, chipY, chipW, chipH, chipH / 2)
        .fillAndStroke('#FFFFFF', this.C_CARD_BORDER);
      this.doc
        .fillColor('#2A2A36')
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9.5)
        .text(role, chipX + 13, chipY + 7, { lineBreak: false });
      chipX += chipW + chipGap;
    });

    return chipY + chipH;
  }

  // ============================================================
  // PAGE 2 — STRENGTHS & WATCH-OUTS  (new section)
  // ============================================================
  private drawStrengthsAndWatchOuts(
    y: number,
    block: (typeof blendedTraits)[string],
  ): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;
    const colGap = 16;
    const colW = (w - colGap) / 2;

    // Extract from trait_mapping2[0]: [name, roles, watch-outs, strengths].
    // trait_mapping2 carries the business/elective-aligned wording (whereas
    // trait_mapping1 held off-domain leftovers such as "Coding efficiency…").
    const mapping = block.trait_mapping2?.[0] || [];
    const strengthsRaw: string = mapping[3] || '';
    const watchOutsRaw: string = mapping[2] || '';

    const strengthsList = strengthsRaw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    const watchOutsList = watchOutsRaw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 4);

    // Section titles
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Natural Strengths', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Watch-outs', x + colW + colGap, y, { lineBreak: false });

    const itemsY = y + 24;
    const dotR = 3;
    const itemGap = 8;
    const textSize = 9.5;

    const drawItems = (
      items: string[],
      colX: number,
      accentColor: string,
    ): number => {
      let curY = itemsY;
      items.forEach((item) => {
        this.doc.circle(colX + dotR, curY + 6, dotR).fill(accentColor);
        this.doc
          .font(this.FONT_REGULAR)
          .fontSize(textSize)
          .fillColor(this.C_INK)
          .text(item, colX + dotR * 2 + 8, curY, {
            width: colW - dotR * 2 - 10,
            lineGap: 1.2,
          });
        const textH = this.doc.heightOfString(item, {
          width: colW - dotR * 2 - 10,
          lineGap: 1.2,
        });
        curY += textH + itemGap;
      });
      return curY;
    };

    const leftEnd = drawItems(strengthsList, x, this.C_ACCENT_GREEN);
    const rightEnd = drawItems(watchOutsList, x + colW + colGap, '#E07B2E');

    return Math.max(leftEnd, rightEnd);
  }

  // ============================================================
  // PAGE 2 — RECOMMENDED NEXT STEPS
  // ============================================================
  private drawNextSteps(y: number, spec: SpecEntry): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    const topRole = spec.roles?.[0] || 'your target role';

    const steps: string[] = [
      `Explore the ${spec.suggestion} specialization and its core subjects in depth.`,
      `Speak with seniors, mentors or alumni working as a ${topRole}.`,
      'Take on one project or internship aligned to your strongest elective.',
      'Pick one watch-out from this report and actively work on it this term.',
    ];

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Recommended Next Steps', x, y, { lineBreak: false });
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(9)
      .fillColor(this.C_MUTED)
      .text(
        'Practical actions to turn this behavioural snapshot into momentum.',
        x,
        y + 18,
        { lineBreak: false },
      );

    const colGap = 16;
    const rowGap = 8;
    const colW = (w - colGap) / 2;
    const startY = y + 32;
    let col0Y = startY;
    let col1Y = startY;

    steps.forEach((text, i) => {
      const col = i % 2;
      const cx = x + col * (colW + colGap);
      const cy = col === 0 ? col0Y : col1Y;

      this.doc.font(this.FONT_REGULAR).fontSize(9.5);
      const textH = this.doc.heightOfString(text, {
        width: colW - 50,
        lineGap: 1.4,
      });
      const ch = Math.max(textH + 16, 38);

      this.doc
        .roundedRect(cx, cy, colW, ch, 8)
        .fillAndStroke('#EDF8F1', '#CDE9D8');

      this.doc.circle(cx + 20, cy + ch / 2, 11).fill(this.C_ACCENT_GREEN);
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(`${i + 1}`, cx + 9, cy + ch / 2 - 6, {
          width: 22,
          align: 'center',
          lineBreak: false,
        });

      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9.5)
        .fillColor('#234')
        .text(text, cx + 38, cy + (ch - textH) / 2, {
          width: colW - 50,
          lineGap: 1.4,
        });

      if (col === 0) col0Y = cy + ch + rowGap;
      else col1Y = cy + ch + rowGap;
    });

    return Math.max(col0Y, col1Y);
  }

  // ============================================================
  // PAGE 2 — DISCLAIMER
  // ============================================================
  private drawDisclaimer(y: number): number {
    const x = this.CONTENT_X;
    const w = this.CONTENT_W;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Disclaimer', x, y, { lineBreak: false });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8.5)
      .fillColor('#3A3A46')
      .text(
        'This report is a quick behavioural snapshot based on your behavioural (DISC) responses. ' +
          'It is meant to support, not replace, deeper career guidance. Please refer to the full Origin BI report ' +
          'for detailed trait insights, agile dimensions, and personalised recommendations.',
        x,
        y + 16,
        { width: w, lineGap: 1.2 },
      );

    return y + 58;
  }

  // ============================================================
  // UTILS
  // ============================================================
  /**
   * Resolves the DISC profile code for this student, honouring the pure-trait
   * rule: when the strongest dimension is the most-answered type
   * PURE_TRAIT_THRESHOLD (20) or more times, it resolves to a single-letter
   * "pure" code (e.g. 'I' = Pure Influence) instead of a two-letter blend.
   * Otherwise it falls back to the top-two traits concatenated.
   *
   * Sources values from the same place as getTopTwoTraits (most-answered
   * counts when present, else the 0-100 scores) and uses the same priority
   * tie-breaker, so the Level 1 report stays consistent with the rest of the
   * suite.
   */
  private resolveProfileCode(
    mostAnswered: { ANSWER_TYPE: string; COUNT: number }[],
    scores: {
      score_D: number;
      score_I: number;
      score_S: number;
      score_C: number;
    },
  ): string {
    const ranked = this.rankTraits(mostAnswered, scores);
    const [top, second] = ranked;
    // Pure-trait override: e.g. D:10 I:25 S:2 C:3 → 'I' (Pure Influence),
    // because 25 >= 20, rather than the 'ID' blend.
    if (top.val >= PURE_TRAIT_THRESHOLD) return top.type;
    return top.type + second.type;
  }

  /**
   * Legacy top-two blend code (no pure-trait override). Used only to pick the
   * hero artwork for pure profiles, which have no dedicated image of their own.
   */
  private resolveTopTwoCombo(
    mostAnswered: { ANSWER_TYPE: string; COUNT: number }[],
    scores: {
      score_D: number;
      score_I: number;
      score_S: number;
      score_C: number;
    },
  ): string {
    const [top, second] = this.rankTraits(mostAnswered, scores);
    return top.type + second.type;
  }

  /**
   * Ranks the four DISC dimensions strongest-first, sourcing from the
   * most-answered counts when present (else the 0-100 scores) and using the
   * suite-wide priority tie-breaker.
   */
  private rankTraits(
    mostAnswered: { ANSWER_TYPE: string; COUNT: number }[],
    scores: {
      score_D: number;
      score_I: number;
      score_S: number;
      score_C: number;
    },
  ): { type: string; val: number }[] {
    let traitScores: { type: string; val: number }[];

    if (mostAnswered && mostAnswered.length >= 4) {
      traitScores = mostAnswered.map((item) => ({
        type: item.ANSWER_TYPE,
        val: item.COUNT,
      }));
    } else {
      traitScores = [
        { type: 'D', val: scores.score_D },
        { type: 'I', val: scores.score_I },
        { type: 'S', val: scores.score_S },
        { type: 'C', val: scores.score_C },
      ];
    }

    const PRIORITY = ['C', 'D', 'I', 'S'];
    traitScores.sort((a, b) => {
      const diff = b.val - a.val; // Primary: value descending
      if (diff !== 0) return diff;
      // Tie-breaker: priority index ascending (low index = high priority)
      return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type);
    });

    return traitScores;
  }

  private resolveTraitImagePath(name: string): string | null {
    const file = `${name.trim().replace(/\s+/g, '_')}.png`;
    const candidates = [
      path.resolve(
        process.cwd(),
        `public/assets/images/student_traits/${file}`,
      ),
      path.resolve(
        process.cwd(),
        `../../backend/student-service/public/assets/images/student_traits/${file}`,
      ),
    ];
    return candidates.find((c) => fs.existsSync(c)) ?? null;
  }

  private stripHtml(value: string): string {
    return (value || '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
