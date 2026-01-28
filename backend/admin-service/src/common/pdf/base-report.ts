/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-plus-operands */
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

// --- Shared Interfaces ---

export type ListStyle = 'bullet' | 'number' | 'letter' | 'roman';

export interface TextOptions {
    x?: number;
    y?: number;
    width?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    fontSize?: number;
    font?: string;
    gap?: number;
    type?: ListStyle;
    start?: number;
    indent?: number;
    labelGap?: number;
}

export interface ImageOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fit?: boolean | [number, number];
    stretch?: boolean;
    cover?: [number, number];
    align?: 'left' | 'center' | 'right';
    gap?: number;
}

export interface PagedImageOptions {
    resizeMode?: 'stretch' | 'original';
    autoAddPage?: boolean;
}

export interface TableOptions {
    x?: number;
    y?: number;
    width?: number;
    headerColor?: string;
    headerTextColor?: string;
    fontSize?: number;
    headerFontSize?: number;
    font?: string;
    headerFont?: string;
    borderColor?: string;
    cellPadding?: number;
    gap?: number;
    colWidths?: number[];
}

export interface RoadmapItem {
    title: string;
    date?: string; // e.g. "2025" or "Phase 1"
    description?: string;
    color?: string | [number, number, number]; // Custom color for this specific node
    icon?: string; // Optional: Path to an icon/image to draw inside the node
}

export interface RoadmapOptions {
    x?: number;
    y?: number;
    width?: number; // Total width of the roadmap area
    gap?: number; // Vertical space between items (default: 30)

    // Style
    lineColor?: string;
    lineWidth?: number;
    nodeRadius?: number;
    nodeColor?: string | [number, number, number]; // Default node color if item.color is missing
    nodeStrokeColor?: string;
    nodeStrokeWidth?: number;

    // Text Styling
    titleColor?: string;
    titleFontSize?: number;
    titleFont?: string;

    dateColor?: string;
    dateFontSize?: number;
    dateFont?: string;

    descColor?: string;
    descFontSize?: number;
    descFont?: string;

    // Layout
    alternating?: boolean; // If true, items switch left/right. If false, all on right.
    contentPadding?: number; // Distance from center line to text
}

export class BaseReport {
    public doc: PDFKit.PDFDocument;

    // --- Configuration Constants ---
    protected readonly MM = 2.83465;
    protected readonly PAGE_WIDTH = 595.28;
    protected readonly PAGE_HEIGHT = 841.89;
    protected readonly MARGIN_STD = 15 * 2.83465;
    protected readonly DEFAULT_GAP = 4 * 2.83465;

    // Fonts
    protected readonly FONT_REGULAR = 'Inter-Regular';
    protected readonly FONT_SEMIBOLD = 'Inter-SemiBold';
    protected readonly FONT_BOLD = 'Inter-Bold';
    protected readonly FONT_SORA_REGULAR = 'Sora-Regular';
    protected readonly FONT_SORA_SEMIBOLD = 'Sora-SemiBold';
    protected readonly FONT_SORA_BOLD = 'Sora-Bold';

    // Colors
    protected readonly COLOR_DEEP_BLUE = '#150089';
    protected readonly COLOR_BRIGHT_GREEN = '#19D36A';
    protected readonly COLOR_BLACK = '#000000';

    // Assets Path - resolved in constructor
    protected ASSETS_PATH: string;

    private static findAssetsPath(): string {
        // Get the directory of this file
        const thisFile = __filename;
        const thisDir = path.dirname(thisFile);
        
        // Try multiple paths to find assets
        const possiblePaths = [
            path.join(thisDir, 'assets'),                                             // Relative to this file
            path.join(process.cwd(), 'src', 'common', 'pdf', 'assets'),               // From project root (dev)
            path.join(process.cwd(), 'dist', 'common', 'pdf', 'assets'),              // From project root (prod)
            path.resolve(thisDir, '..', '..', '..', 'src', 'common', 'pdf', 'assets'), // Navigate from dist to src
        ];

        for (const p of possiblePaths) {
            // Check if directory exists and contains expected files
            const testFile = path.join(p, 'Handbook_Cover_Default.jpg');
            if (fs.existsSync(testFile)) {
                return p;
            }
        }

        // Default fallback to CWD-based path
        return path.join(process.cwd(), 'src', 'common', 'pdf', 'assets');
    }

    // State
    protected _currentBackground: string | null = null;
    protected _useStdMargins = false;

    constructor() {
        // Resolve assets path first
        this.ASSETS_PATH = BaseReport.findAssetsPath();
        
        this.doc = new PDFDocument({
            size: 'A4',
            margin: 0,
            autoFirstPage: true,
            bufferPages: true,
        });
        this.registerFonts();
        this.setupPageListener();
    }

    private registerFonts(): void {
        const fonts = [
            { id: 'Sora-Bold', path: 'fonts/Sora-Bold.ttf', fallback: 'Helvetica-Bold' },
            { id: 'Sora-SemiBold', path: 'fonts/Sora-SemiBold.ttf', fallback: 'Helvetica-Bold' },
            { id: 'Sora-Regular', path: 'fonts/Sora-Regular.ttf', fallback: 'Helvetica' },
            { id: 'Inter-Regular', path: 'fonts/Inter-Regular.ttf', fallback: 'Helvetica' },
            { id: 'Inter-Bold', path: 'fonts/Inter-Bold.ttf', fallback: 'Helvetica-Bold' },
            { id: 'Inter-SemiBold', path: 'fonts/Inter-SemiBold.ttf', fallback: 'Helvetica-Bold' },
        ];

        fonts.forEach((font) => {
            const fontPath = path.join(this.ASSETS_PATH, font.path);
            if (fs.existsSync(fontPath)) {
                this.doc.registerFont(font.id, fontPath);
            } else {
                // Use built-in Helvetica as fallback
                console.warn(`Font missing, using fallback: ${font.id} -> ${font.fallback}`);
                this.doc.registerFont(font.id, font.fallback);
            }
        });
    }

    private setupPageListener(): void {
        this.doc.on('pageAdded', () => {
            if (this._currentBackground) {
                const bgPath = path.join(this.ASSETS_PATH, this._currentBackground);
                if (fs.existsSync(bgPath)) {
                    this.doc.image(bgPath, 0, 0, {
                        width: this.PAGE_WIDTH,
                        height: this.PAGE_HEIGHT,
                    });
                }
            }

            if (this._useStdMargins) {
                this.doc.page.margins = {
                    top: this.MARGIN_STD,
                    bottom: this.MARGIN_STD,
                    left: this.MARGIN_STD,
                    right: this.MARGIN_STD,
                };
                this.doc.y = this.MARGIN_STD;
                this.doc.x = this.MARGIN_STD;
            } else {
                this.doc.page.margins = {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                };
            }
        });
    }

    // --- Helpers ---

    protected ensureSpace(
        requiredSpace: number,
        usePercentage = false,
    ): void {
        if (!this._useStdMargins) return;

        const bottomLimit = this.PAGE_HEIGHT - this.MARGIN_STD;
        let neededHeight = requiredSpace;

        if (usePercentage) {
            neededHeight =
                (this.PAGE_HEIGHT - 2 * this.MARGIN_STD) * requiredSpace;
        }

        if (this.doc.y + neededHeight > bottomLimit) {
            this.doc.addPage();
        }
    }

    protected toRoman(num: number): string {
        const lookup: { [key: string]: number } = {
            m: 1000,
            cm: 900,
            d: 500,
            cd: 400,
            c: 100,
            xc: 90,
            l: 50,
            xl: 40,
            x: 10,
            ix: 9,
            v: 5,
            iv: 4,
            i: 1,
        };
        let roman = '';
        /* eslint-disable-next-line guard-for-in */
        for (const i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }

    protected toLetter(num: number): string {
        return String.fromCharCode(96 + num);
    }

    protected getAssetPath(relativePath: string): string {
        return path.join(this.ASSETS_PATH, relativePath);
    }

    // --- Typography ---

    protected h1(text: string, opts: TextOptions = {}) {
        this.ensureSpace(0.1, true);
        this.renderTextBase(text, {
            font: this.FONT_SORA_BOLD,
            fontSize: 22,
            color: this.COLOR_DEEP_BLUE,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected h2(text: string, opts: TextOptions = {}) {
        this.ensureSpace(0.05, true);
        this.renderTextBase(text, {
            font: this.FONT_SORA_SEMIBOLD,
            fontSize: 16,
            color: this.COLOR_BLACK,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected h3(text: string, opts: TextOptions = {}) {
        this.ensureSpace(40);
        this.renderTextBase(text, {
            font: this.FONT_SORA_SEMIBOLD,
            fontSize: 12,
            color: this.COLOR_BLACK,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected p(text: string, opts: TextOptions = {}) {
        this.renderTextBase(text, {
            font: this.FONT_REGULAR,
            fontSize: 12,
            color: this.COLOR_BLACK,
            align: 'justify',
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected pHtml(text: string, opts: TextOptions = {}) {
        const x =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        const y = opts.y ?? this.doc.y;
        const width = opts.width ?? this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        const gap = opts.gap ?? this.DEFAULT_GAP;

        const cleanText = text
            .replace(/<\/p>\s+/gi, '</p>')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .trim();
        this.doc
            .fontSize(opts.fontSize ?? 12)
            .fillColor(opts.color ?? this.COLOR_BLACK);

        const parts = cleanText.split(/(<b>|<\/b>)/g);
        let isBold = false;
        this.doc.text('', x, y, { continued: true });
        parts.forEach((part, index) => {
            if (part === '<b>') isBold = true;
            else if (part === '</b>') isBold = false;
            else if (part.length > 0) {
                this.doc
                    .font(isBold ? this.FONT_BOLD : this.FONT_REGULAR)
                    .text(part, {
                        width: width,
                        align: opts.align ?? 'justify',
                        continued: index < parts.length - 1,
                    });
            }
        });
        this.doc.text('', { continued: false });
        this.doc.y += gap;
    }

    protected list(items: string[], opts: TextOptions = {}) {
        const savedX = this.doc.x;
        const type = opts.type ?? 'bullet';
        const start = opts.start ?? 1;
        const gap = opts.gap ?? this.DEFAULT_GAP;
        const baseX =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        const listIndent = opts.indent ?? 0;
        const currentX = baseX + listIndent;
        const labelGap = opts.labelGap ?? (type === 'bullet' ? 15 : 25);
        const availableWidth =
            opts.width ??
            this.PAGE_WIDTH - 2 * this.MARGIN_STD - listIndent - labelGap;

        this.ensureSpace(20);
        this.doc
            .font(opts.font || this.FONT_REGULAR)
            .fontSize(opts.fontSize || 12)
            .fillColor(opts.color || this.COLOR_BLACK);

        if (type === 'bullet') {
            this.doc.x = currentX;
            this.doc.list(items, {
                width: availableWidth,
                align: opts.align || 'left',
                bulletRadius: 2.5,
                textIndent: labelGap,
                bulletIndent: 0,
            });
        } else {
            items.forEach((item, index) => {
                if (this.doc.y + 15 > this.PAGE_HEIGHT - this.MARGIN_STD)
                    this.doc.addPage();
                const currentNum = start + index;
                const label =
                    type === 'number'
                        ? `${currentNum}.`
                        : type === 'letter'
                            ? `${this.toLetter(currentNum)}.`
                            : `${this.toRoman(currentNum)}.`;
                const startY = this.doc.y;
                this.doc.text(label, currentX, startY, {
                    width: labelGap,
                    align: 'left',
                });
                this.doc.text(item, currentX + labelGap, startY, {
                    width: availableWidth,
                    align: opts.align || 'left',
                });
                this.doc.y += 2;
            });
        }
        this.doc.y += gap;
        this.doc.x = savedX;
    }

    protected renderTextBase(text: string, opts: TextOptions) {
        const x =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        const y = opts.y ?? this.doc.y;
        const width = opts.width ?? this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        this.doc
            .font(opts.font || this.FONT_REGULAR)
            .fontSize(opts.fontSize || 12)
            .fillColor(opts.color || this.COLOR_BLACK)
            .text(text, x, y, { width: width, align: opts.align || 'left' });
        this.doc.y += opts.gap || 0;
    }

    // --- Images ---

    protected Image(relativePath: string, opts: ImageOptions = {}) {
        const imagePath = this.getAssetPath(relativePath);
        if (!fs.existsSync(imagePath)) {
            console.warn(`Image missing: ${imagePath}`);
            return;
        }
        const img = (this.doc as any).openImage(imagePath);
        let [w, h] = [img.width, img.height];

        if (opts.fit === true && opts.width && opts.height) {
            const s = Math.min(opts.width / w, opts.height / h);
            w *= s;
            h *= s;
        } else if (Array.isArray(opts.fit)) {
            const [boxW, boxH] = opts.fit;
            const s = Math.min(boxW / w, boxH / h);
            w *= s;
            h *= s;
        } else if (opts.stretch) {
            w = opts.width!;
            h = opts.height!;
        } else if (opts.width && !opts.height) {
            h = h * (opts.width / w);
            w = opts.width;
        }

        this.ensureSpace(h + (opts.gap ?? this.DEFAULT_GAP));
        let x = opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        if (opts.align === 'center')
            x =
                (this._useStdMargins ? this.MARGIN_STD : 0) +
                (this.PAGE_WIDTH -
                    2 * (this._useStdMargins ? this.MARGIN_STD : 0) -
                    w) /
                2;

        this.doc.image(imagePath, x, opts.y ?? this.doc.y, { width: w, height: h });
        if (!opts.y) this.doc.y += h + (opts.gap ?? this.DEFAULT_GAP);
    }

    // --- Charts ---

    protected draw3DBarChart(
        data: { label: string; value: number; color: number[] }[],
        startX: number,
        startY: number,
        options: any,
    ) {
        const {
            barWidth,
            barGap,
            maxBarHeight,
            slantDepth,
            sideViewWidth,
            labelFontSize,
            categoryFontSize,
            percentageLabelOffset,
            categoryLabelOffset,
        } = options;
        data.forEach((item, index) => {
            const barHeight = (item.value / 100) * maxBarHeight;
            const [r, g, b] = item.color;
            const currentX = startX + index * (barWidth + barGap);

            // Draw
            this.doc
                .fillColor([r, g, b])
                .polygon(
                    [currentX, startY + (maxBarHeight - barHeight)],
                    [currentX + barWidth, startY + (maxBarHeight - barHeight)],
                    [
                        currentX + barWidth - slantDepth,
                        startY + (maxBarHeight - barHeight - slantDepth),
                    ],
                    [
                        currentX - slantDepth,
                        startY + (maxBarHeight - barHeight - slantDepth),
                    ],
                )
                .fill();
            this.doc
                .fillColor([r, g, b])
                .polygon(
                    [currentX + barWidth, startY + (maxBarHeight - barHeight)],
                    [currentX + barWidth, startY + maxBarHeight + 10],
                    [
                        currentX + barWidth - sideViewWidth,
                        startY + maxBarHeight + 10,
                    ],
                    [
                        currentX + barWidth - sideViewWidth,
                        startY + (maxBarHeight - barHeight),
                    ],
                )
                .fill();

            // Labels
            const textBoxWidth = barWidth + 30;
            this.doc
                .fillColor('black')
                .fontSize(labelFontSize)
                .font('Helvetica')
                .text(
                    `${Math.round(item.value)}%`,
                    currentX +
                    (barWidth - textBoxWidth) / 2 +
                    percentageLabelOffset,
                    startY + (maxBarHeight - barHeight) + 6,
                    { width: textBoxWidth, align: 'center', lineBreak: false },
                );
            this.doc
                .font(this.FONT_SORA_BOLD)
                .fontSize(categoryFontSize)
                .text(
                    item.label,
                    currentX +
                    barWidth -
                    sideViewWidth +
                    12 +
                    categoryLabelOffset,
                    startY + maxBarHeight - 12,
                    { lineBreak: false },
                );
        });
    }

    protected drawSingleBarChart(data: any[], options: any = {}) {
        const config = {
            barWidth: 50,
            barGap: 30,
            maxBarHeight: 200,
            slantDepth: 15,
            sideViewWidth: 30,
            labelFontSize: 12,
            categoryFontSize: 12,
            percentageLabelOffset: -5,
            categoryLabelOffset: 0,
            ...options,
        };
        this.ensureSpace(20 + config.maxBarHeight + 50);
        const startX =
            (this.PAGE_WIDTH -
                (data.length * config.barWidth +
                    (data.length - 1) * config.barGap) +
                config.slantDepth) /
            2;
        const startY = this.doc.y + 20;
        this.draw3DBarChart(data, startX, startY, config);
        this.doc.y = startY + config.maxBarHeight + 50;
        this.doc.x = this.MARGIN_STD;
    }

    // --- Table ---

    protected table(
        headers: string[],
        rows: string[][],
        options: TableOptions = {},
    ) {
        const {
            x = this._useStdMargins ? this.doc.x : this.MARGIN_STD,
            // width = this.PAGE_WIDTH -
            //    2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM),
            cellPadding = 5,
            gap = this.DEFAULT_GAP,
        } = options;

        const width = options.width ?? (this.PAGE_WIDTH - 2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM));

        // 1. Determine Column Widths
        let colWidths = options.colWidths;
        if (!colWidths || colWidths.length !== headers.length) {
            const defaultW = width / headers.length;
            colWidths = new Array(headers.length).fill(defaultW);
        }

        // --- NEW LOGIC: Calculate Dynamic Header Height ---
        this.doc
            .font(options.headerFont || this.FONT_SORA_BOLD)
            .fontSize(options.headerFontSize || 10);

        let maxHeaderHeight = 0;
        headers.forEach((h, i) => {
            const cw = colWidths![i];
            const height = this.doc.heightOfString(h, {
                width: cw - 2 * cellPadding,
                align: 'left',
            });
            if (height > maxHeaderHeight) maxHeaderHeight = height;
        });

        const headerHeight = Math.max(maxHeaderHeight + 2 * cellPadding, 20);

        // 2. Initial Layout Check
        this.ensureSpace(headerHeight + 20);

        let currentX = x;
        let currentY = options.y ?? this.doc.y;

        // 3. Draw Header
        this.doc
            .font(options.headerFont || this.FONT_SORA_BOLD)
            .fontSize(options.headerFontSize || 10);

        headers.forEach((h, i) => {
            const cw = colWidths![i];

            // Background & Border
            this.doc
                .rect(currentX, currentY, cw, headerHeight)
                .fillColor(options.headerColor || '#D3D3D3')
                .fillAndStroke(
                    options.headerColor || '#D3D3D3',
                    options.borderColor || '#000000',
                );

            // Text
            this.doc
                .fillColor(options.headerTextColor || 'black')
                .text(h, currentX + cellPadding, currentY + cellPadding, {
                    width: cw - 2 * cellPadding,
                    align: 'left',
                });

            currentX += cw;
        });

        currentY += headerHeight;

        // 4. Draw Rows
        this.doc
            .font(options.font || this.FONT_REGULAR)
            .fontSize(options.fontSize || 10)
            .fillColor('black');

        rows.forEach((row) => {
            // A. Calculate Max Row Height
            let maxRowHeight = 0;
            row.forEach((text, i) => {
                const cw = colWidths![i];
                const h = this.doc.heightOfString(text, {
                    width: cw - 2 * cellPadding,
                });
                if (h > maxRowHeight) maxRowHeight = h;
            });
            maxRowHeight += 2 * cellPadding;

            // B. Page Break Check
            if (currentY + maxRowHeight > this.PAGE_HEIGHT - this.MARGIN_STD) {
                this.doc.addPage();
                currentY = this.MARGIN_STD;
            }

            // C. Render Cells
            currentX = x; // Reset X
            row.forEach((text, i) => {
                const cw = colWidths![i];

                // Border
                this.doc
                    .rect(currentX, currentY, cw, maxRowHeight)
                    .strokeColor(options.borderColor || '#000000')
                    .lineWidth(0.5)
                    .stroke();

                // Text
                this.doc.text(
                    text,
                    currentX + cellPadding,
                    currentY + cellPadding,
                    { width: cw - 2 * cellPadding },
                );

                currentX += cw;
            });

            currentY += maxRowHeight;
        });

        // 5. Update Cursor
        this.doc.y = currentY + gap;
        this.doc.x = this.MARGIN_STD;
    }
}
