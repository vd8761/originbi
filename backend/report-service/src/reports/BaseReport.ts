import PDFDocument from "pdfkit";
import fs from "fs";

// --- Shared Interfaces ---

export type ListStyle = "bullet" | "number" | "letter" | "roman";

export interface TextOptions {
    x?: number;
    y?: number;
    width?: number;
    align?: "left" | "center" | "right" | "justify";
    color?: string;
    fontSize?: number;
    font?: string;
    gap?: number;
    type?: ListStyle;
    start?: number;
    indent?: number;
    labelGap?: number;
    nestedIndent?: number;
    itemGap?: number;
    itemEnsureSpace?: number;
    itemEnsureSpacePercent?: boolean;
    topGap?: number;
    ensureSpace?: number;
}

export interface ImageOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fit?: boolean | [number, number];
    stretch?: boolean;
    cover?: [number, number];
    align?: "left" | "center" | "right";
    gap?: number;
}

export interface PagedImageOptions {
    resizeMode?: "stretch" | "original";
    autoAddPage?: boolean;
}

export interface TableData {
    trait_combination: string[];
    role_suggestions: string[];
    communication?: string[];
    sustainability?: string[];
    social_responsibility?: string[];
    stress_areas: string[];
    recommended_focus_areas: string[];
    recommendations_for_outsourcing?: string[];
}

export type TextAlignment = "left" | "center" | "right" | "justify";
export type ColumnWidth = number | "fit" | "fill";
export interface ColumnStyle {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
}

export interface TableOptions {
    // --- Layout ---
    x?: number;
    y?: number;
    width?: number;
    colWidths?: ColumnWidth[];
    cellPadding?: number;
    gap?: number;
    verticalAlign?: "top" | "middle" | "bottom";
    columnStyles?: ColumnStyle[];

    // --- Header Styling ---
    headerHeight?: number;
    headerColor?: string | string[];
    headerTextColor?: string | string[];
    headerFont?: string;
    headerFontSize?: number;
    headerAlign?: TextAlignment | TextAlignment[];
    headerVerticalAlign?: "top" | "middle" | "bottom";

    // --- Row Styling ---
    rowHeight?: number; // <--- ADD THIS LINE
    rowColor?: string;
    rowTextColor?: string;
    font?: string;
    fontSize?: number;
    rowAlign?: TextAlignment | TextAlignment[];

    // --- Zebra / Alternate Styling ---
    alternateRowColor?: string;
    alternateRowTextColor?: string;

    // --- Borders ---
    borderColor?: string;
    borderWidth?: number;

    // --- Merging ---
    mergeRepeatedHeaders?: boolean;
}

export interface StyledRow {
    type: "subheader" | "row"; // Augmented to support generic styled rows
    data: (string | number | null | undefined)[];
    // Styling overrides
    fill?: string;
    color?: string;
    font?: string;
    fontSize?: number;
    align?: TextAlignment;
    verticalAlign?: "top" | "middle" | "bottom";
    height?: number; // Optional explicit height
    isMergeable?: boolean; // explicit merge flag? or infer from type? Subheader implies merge usually.
    mergeSupportedColumn?: boolean; // Enable vertical merging for generic rows
}

// Alias for backward compatibility if needed, or just replace usages.
export type SubHeaderRow = StyledRow;

export interface FutureOutlookData {
    title?: string;
    centerLabel?: string;
    leftValue?: string;
    leftLabel?: string;
    rightValue?: string;
    rightLabel?: string;
    sourceText?: string;
    footerText?: string;
}

export interface FutureOutlookOptions {
    addAsNewPage?: boolean;
    titleColor?: string;
    titleFontSize?: number;
    leftCircleGradientStart?: string;
    leftCircleGradientEnd?: string;
    rightCircleGradientStart?: string;
    rightCircleGradientEnd?: string;
    centerLabelFontSize?: number;
    centerLabelColor?: string;
    valueFontSize?: number;
    valueColor?: string;
    labelFontSize?: number;
    sourceFontSize?: number;
    footerFontSize?: number;
}

export interface HorizontalRoadmapBlock {
    label?: string; // e.g. "Suggestion 1"
    roleName: string; // Text inside the circle
    color: string; // Hex color
    textColor?: string; // Hex color for the text inside circle
    milestones: RoadmapMilestone[];
}

export interface RoadmapMilestone {
    name: string;
    category?: string;
    isAbove: boolean;
}

export interface RichTextItem {
    text: string;
    font?: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
}

export interface RichTableCell {
    content: RichTextItem[];
}

export interface HorizontalRoadmapOptions {
    x?: number;
    y?: number;
    width?: number;
    blockGap?: number; // Space between different roadmap blocks
    circleRadius?: number;
    timelinePadding?: number; // Space between circle and start of timeline
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

export interface RadarChartOptions {
    x?: number; // Center X (defaults to page center)
    y?: number; // Center Y
    radius?: number; // Max radius
    maxValue?: number; // value corresponding to the outer edge (default 10)
    levels?: number; // Number of grid rings (default 6)
    fontSize?: number;
    font?: string;

    // --- Colors ---
    colorGrid?: string; // Color of the spiderweb background
    colorAxis?: string; // Color of the spokes
    colorFill?: string; // Color of the data area
    colorStroke?: string; // Color of the data border line
    colorPoint?: string; // Color of the dots
    colorText?: string; // Color of the labels
}

/**
 * BaseReport Class
 * ----------------
 * Serves as the foundational class for all PDF report generation.
 * Provides shared utilities for:
 * - Typography (Headers, Paragraphs, HTML-like text)
 * - Layout (Margins, Page Breaks, Backgrounds)
 * - Data Visualization (Charts, Tables, Timelines)
 * - Common Assets (Fonts, Colors)
 */
export class BaseReport {
    public doc: PDFKit.PDFDocument;

    // --- Configuration Constants ---
    protected readonly MM = 2.83465;
    protected readonly PAGE_WIDTH = 595.28;
    protected readonly PAGE_HEIGHT = 841.89;
    protected readonly MARGIN_STD = 15 * 2.83465;
    protected readonly DEFAULT_GAP = 5 * 2.83465;

    // Fonts
    protected readonly FONT_REGULAR = "Inter-Regular";
    protected readonly FONT_SEMIBOLD = "Inter-SemiBold";
    protected readonly FONT_BOLD = "Inter-Bold";
    protected readonly FONT_ITALIC = "Inter-Italic";
    protected readonly FONT_SORA_REGULAR = "Sora-Regular";
    protected readonly FONT_SORA_SEMIBOLD = "Sora-SemiBold";
    protected readonly FONT_SORA_BOLD = "Sora-Bold";

    // Colors
    protected readonly COLOR_DEEP_BLUE = "#150089";
    protected readonly COLOR_BRIGHT_GREEN = "#19D36A";
    protected readonly COLOR_BLACK = "#000000";

    // State
    protected _currentBackground: string | null = null;
    protected _useStdMargins: boolean = false;

    constructor(options?: PDFKit.PDFDocumentOptions) {
        this.doc = new PDFDocument({
            size: "A4",
            margin: 0,
            autoFirstPage: true,
            bufferPages: true,
            ...options,
        });
        this.registerFonts();
        this.setupPageListener();
    }

    private registerFonts(): void {
        const fonts = [
            { id: "Sora-Bold", path: "assets/fonts/Sora-Bold.ttf" },
            { id: "Sora-SemiBold", path: "assets/fonts/Sora-SemiBold.ttf" },
            { id: "Sora-Regular", path: "assets/fonts/Sora-Regular.ttf" },
            { id: "Inter-Regular", path: "assets/fonts/Inter-Regular.ttf" },
            { id: "Inter-Bold", path: "assets/fonts/Inter-Bold.ttf" },
            { id: "Inter-SemiBold", path: "assets/fonts/Inter-SemiBold.ttf" },
            { id: "Inter-Italic", path: "assets/fonts/Inter-Italic.ttf" },
        ];

        fonts.forEach((font) => {
            if (fs.existsSync(font.path)) {
                this.doc.registerFont(font.id, font.path);
            }
        });
    }

    private setupPageListener(): void {
        this.doc.on("pageAdded", () => {
            if (
                this._currentBackground &&
                fs.existsSync(this._currentBackground)
            ) {
                this.doc.image(this._currentBackground, 0, 0, {
                    width: this.PAGE_WIDTH,
                    height: this.PAGE_HEIGHT,
                });
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

    // --- Helpers ---

    /**
     * Checks if there is enough vertical space remaining on the current page.
     * If not, it adds a new page.
     *
     * @param requiredSpace - The height needed (in points).
     * @param usePercentage - If true, treats requiredSpace as a percentage of page height (0-1).
     */
    protected ensureSpace(
        requiredSpace: number,
        usePercentage: boolean = false,
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
        let roman = "";
        for (let i in lookup) {
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

    // --- Typography ---

    protected h1(text: string, opts: TextOptions = {}) {
        const ensureSpace = opts.ensureSpace ?? 0.15;
        this.ensureSpace(ensureSpace, true);

        const topMargin = this.doc.page.margins.top;
        if (this.doc.y > topMargin + 5) {
            this.doc.y += opts.topGap ?? this.DEFAULT_GAP;
        }

        this.renderTextBase(text, {
            font: this.FONT_SORA_BOLD,
            fontSize: 22,
            color: this.COLOR_DEEP_BLUE,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected h2(text: string, opts: TextOptions = {}) {
        const ensureSpace = opts.ensureSpace ?? 0.15;
        this.ensureSpace(ensureSpace, true);

        const topMargin = this.doc.page.margins.top;
        if (this.doc.y > topMargin + this.DEFAULT_GAP) {
            // Default gap for h2 is smaller than h1 (DEFAULT_GAP)
            this.doc.y += opts.topGap ?? this.DEFAULT_GAP * 0.6;
        }

        this.renderTextBase(text, {
            font: this.FONT_SORA_SEMIBOLD,
            fontSize: 16,
            color: this.COLOR_BLACK,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected h3(text: string, opts: TextOptions = {}) {
        const ensureSpace = opts.ensureSpace ?? 0.08;
        this.ensureSpace(ensureSpace, true);

        const topMargin = this.doc.page.margins.top;
        if (this.doc.y > topMargin + this.DEFAULT_GAP) {
            // Default gap for h3 is smaller than h2
            this.doc.y += opts.topGap ?? this.DEFAULT_GAP * 0.3;
        }

        this.renderTextBase(text, {
            font: this.FONT_SORA_SEMIBOLD,
            fontSize: 12,
            color: this.COLOR_BLACK,
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    protected p(text: string, opts: TextOptions = {}) {
        this.ensureSpace(0.08, true);
        this.renderTextBase(text, {
            font: this.FONT_REGULAR,
            fontSize: 12,
            color: this.COLOR_BLACK,
            align: "justify",
            gap: this.DEFAULT_GAP,
            ...opts,
        });
    }

    /**
     * Renders text with basic HTML tag support.
     * Supported Tags:
     * - `<b>`: Bold text
     * - `<br>`: Line break
     * - `<p>`: Paragraph (adds spacing)
     *
     * @param text - The HTML string to render.
     * @param opts - Styling and layout options.
     */
    protected pHtml(text: string, opts: TextOptions = {}) {
        const x =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);

        const y = opts.y ?? this.doc.y;
        const width = opts.width ?? this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        const gap = opts.gap ?? this.DEFAULT_GAP;

        let cleanText = text
            .replace(/<\/p>\s+/gi, "</p>")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<p[^>]*>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            // FIX: Normalize <b style="..."> or <b class="..."> to just <b>
            .replace(/<b\s[^>]*>/gi, "<b>")
            .trim();

        this.doc
            .fontSize(opts.fontSize ?? 12)
            .fillColor(opts.color ?? this.COLOR_BLACK);

        // Split by <b>, </b>, AND newline to control flow/reset x coordinates
        const parts = cleanText.split(/(<b>|<\/b>|\n)/g);
        let isBold = false;

        this.doc.text("", x, y, { continued: true });

        parts.forEach((part, index) => {
            if (part === "<b>") {
                isBold = true;
            } else if (part === "</b>") {
                isBold = false;
            } else if (part === "\n") {
                // Break the chain to process the newline and reset X
                this.doc.text("\n", { continued: false });
                // Restart chain at the correct X position
                this.doc.text("", x, this.doc.y, { continued: true });
            } else if (part.length > 0) {
                // Determine if we need to continue the text chain
                let hasMore = false;
                for (let i = index + 1; i < parts.length; i++) {
                    const p = parts[i];
                    // If we find a newline or any non-tag content, we must continue
                    if (
                        p === "\n" ||
                        (p !== "<b>" && p !== "</b>" && p.length > 0)
                    ) {
                        hasMore = true;
                        break;
                    }
                }

                this.doc
                    .font(
                        isBold
                            ? this.FONT_BOLD
                            : opts.font || this.FONT_REGULAR,
                    )
                    .text(part, {
                        width: width,
                        align: opts.align ?? "justify",
                        continued: hasMore,
                    });
            }
        });

        // Ensure we end the chain properly (safety catch, though logic above should handle it)
        this.doc.text("", { continued: false });
        this.doc.y += gap;
    }

    protected list(items: string[], opts: TextOptions = {}) {
        const savedX = this.doc.x;
        const type = opts.type ?? "bullet";
        const start = opts.start ?? 1;
        const gap = opts.gap ?? this.DEFAULT_GAP;
        const baseX =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        const listIndent = opts.indent ?? 0;
        const currentX = baseX + listIndent;
        const labelGap = opts.labelGap ?? (type === "bullet" ? 15 : 25);
        const availableWidth =
            opts.width ??
            this.PAGE_WIDTH - 2 * this.MARGIN_STD - listIndent - labelGap;

        this.doc
            .font(opts.font || this.FONT_REGULAR)
            .fontSize(opts.fontSize || 12)
            .fillColor(opts.color || this.COLOR_BLACK);

        if (type === "bullet") {
            items.forEach((item) => {
                this.ensureSpace(
                    opts.itemEnsureSpace ?? 25,
                    opts.itemEnsureSpacePercent ?? false,
                );

                const itemY = this.doc.y;

                this.doc
                    .circle(
                        currentX + 2.5,
                        itemY + (opts.fontSize || 12) / 2 - 1,
                        2.5,
                    )
                    .fill();

                this.pHtml(item, {
                    x: currentX + labelGap,
                    y: itemY,
                    width: availableWidth,
                    gap: 2,
                    fontSize: opts.fontSize,
                    color: opts.color,
                    font: opts.font,
                    align: opts.align || "left",
                });
            });
        } else {
            items.forEach((item, index) => {
                this.ensureSpace(
                    opts.itemEnsureSpace ?? 25,
                    opts.itemEnsureSpacePercent ?? false,
                );
                const currentNum = start + index;
                let label =
                    type === "number"
                        ? `${currentNum}.`
                        : type === "letter"
                          ? `${this.toLetter(currentNum)}.`
                          : `${this.toRoman(currentNum)}.`;
                const startY = this.doc.y;
                this.doc.text(label, currentX, startY, {
                    width: labelGap,
                    align: "left",
                });

                this.pHtml(item, {
                    x: currentX + labelGap,
                    y: startY,
                    width: availableWidth,
                    gap: 2,
                    fontSize: opts.fontSize,
                    color: opts.color,
                    font: opts.font,
                    align: opts.align || "left",
                });
            });
        }
        this.doc.y += gap;
        this.doc.x = savedX;
    }

    protected complexOrderedList(html: string, opts: TextOptions = {}) {
        const savedX = this.doc.x;
        const x =
            opts.x ?? (this._useStdMargins ? this.doc.x : this.MARGIN_STD);
        const gap = opts.gap ?? this.DEFAULT_GAP;
        const itemGap = opts.itemGap ?? 0;
        const ensureSpaceHeight = opts.itemEnsureSpace ?? 0;
        const nestedIndent = opts.nestedIndent ?? 0;
        const ensureSpacePercent = opts.itemEnsureSpacePercent ?? false;

        const splitParts = html.split(/<ol[^>]*>/i);
        if (splitParts[0] && splitParts[0].trim())
            this.pHtml(splitParts[0], { ...opts, gap: gap });
        if (!splitParts[1]) {
            this.doc.x = savedX;
            return;
        }

        const rawItems = splitParts[1].split(/<li[^>]*>\s*<b/i);
        rawItems.shift();
        const numberWidth = 25;
        const contentX = x + numberWidth;
        const availableWidth =
            (opts.width ?? this.PAGE_WIDTH - 2 * this.MARGIN_STD) - numberWidth;

        rawItems.forEach((rawItem, index) => {
            this.ensureSpace(ensureSpaceHeight, ensureSpacePercent);
            const itemHtml = "<b" + rawItem;
            // Extract the Title (text inside the first <b>...</b>)
            const titleMatch = itemHtml.match(/<b[^>]*>([\s\S]*?)<\/b>/i);
            const title = titleMatch ? titleMatch[1].trim() : "";

            // Remove the title matching part and any trailing </li>
            let bodyHtml = itemHtml
                .replace(/<b[\s\S]*?<\/b>/i, "")
                .replace(/<p[^>]*>&nbsp;<\/p>/gi, "")
                .replace(/<\/(ol|ul)>\s*$/i, "") // Remove trailing </ol> or </ul>
                .replace(/<\/li>\s*$/i, ""); // Remove trailing </li>

            const startY = this.doc.y;
            this.doc
                .font(this.FONT_SORA_BOLD)
                .fontSize(opts.fontSize ?? 12)
                .fillColor(opts.color ?? this.COLOR_DEEP_BLUE)
                .text(`${index + 1}.`, x, startY, { width: numberWidth });

            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fillColor(opts.color ?? this.COLOR_BLACK)
                .text(title, contentX, startY, { width: availableWidth });
            this.doc.y += 2;

            // Check for nested lists
            const listMatch = bodyHtml.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);

            if (listMatch) {
                const parts = bodyHtml.split(listMatch[0]);

                // 1. Text BEFORE the nested list
                if (parts[0].trim()) {
                    this.pHtml(parts[0], {
                        x: contentX,
                        width: availableWidth,
                        fontSize: opts.fontSize, // Match main text size or use default
                    });
                    // pHtml adds its own gap, maybe we want less?
                    this.doc.y -= this.DEFAULT_GAP - 2;
                }

                // 2. The Nested List itself
                const nestedItems =
                    listMatch[2]
                        .match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
                        ?.map((li) => li.replace(/<\/?li[^>]*>/g, "").trim()) ||
                    [];

                if (nestedItems.length > 0) {
                    this.list(nestedItems, {
                        x: contentX + nestedIndent,
                        width: availableWidth - nestedIndent,
                        gap: 2,
                        type: "bullet",
                        fontSize: opts.fontSize || 12, // Ensure consistent font size
                        itemEnsureSpace: opts.itemEnsureSpace,
                        itemEnsureSpacePercent: opts.itemEnsureSpacePercent,
                    });
                }

                // 3. Text AFTER the nested list
                if (parts[1] && parts[1].trim()) {
                    this.pHtml(parts[1], {
                        x: contentX,
                        width: availableWidth,
                        fontSize: opts.fontSize,
                    });
                    this.doc.y -= this.DEFAULT_GAP - 2;
                }
            } else {
                // No nested list, just render the body
                this.pHtml(bodyHtml, {
                    x: contentX,
                    width: availableWidth,
                    fontSize: opts.fontSize,
                });
                // pHtml adds a gap at the end, often we want to control the item gap manually
                this.doc.y -= this.DEFAULT_GAP - 2;
            }

            this.doc.y += itemGap;
        });

        this.doc.y += gap;
        this.doc.x = savedX;
    }

    protected renderCleanBodyText(html: string, x: number, width: number) {
        const cleanText = html
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<p[^>]*>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim();
        if (cleanText.length > 0) {
            this.doc
                .font(this.FONT_REGULAR)
                .fillColor(this.COLOR_BLACK)
                .text(cleanText, x, this.doc.y, {
                    width: width,
                    align: "justify",
                });
        }
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
            .text(text, x, y, { width: width, align: opts.align || "left" });
        this.doc.y += opts.gap || 0;
    }

    // --- Images ---

    protected Image(path: string, opts: ImageOptions = {}) {
        if (!fs.existsSync(path)) {
            console.warn(`Image missing: ${path}`);
            return;
        }
        const img = (this.doc as any).openImage(path);
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
        if (opts.align === "center")
            x =
                (this._useStdMargins ? this.MARGIN_STD : 0) +
                (this.PAGE_WIDTH -
                    2 * (this._useStdMargins ? this.MARGIN_STD : 0) -
                    w) /
                    2;

        this.doc.image(path, x, opts.y ?? this.doc.y, { width: w, height: h });
        if (!opts.y) this.doc.y += h + (opts.gap ?? this.DEFAULT_GAP);
    }

    protected PagedImage(path: string, opts: PagedImageOptions = {}) {
        if (!fs.existsSync(path)) return;
        const savedBg = this._currentBackground;
        const savedMargins = this._useStdMargins;
        this._currentBackground = null;
        this._useStdMargins = false;

        if (opts.resizeMode === "original") {
            const img = (this.doc as any).openImage(path);
            this.doc.addPage({ size: [img.width, img.height], margin: 0 });
            this.doc.image(path, 0, 0);
        } else {
            this.doc.addPage({ size: "A4", margin: 0 });
            this.doc.image(path, 0, 0, {
                width: this.PAGE_WIDTH,
                height: this.PAGE_HEIGHT,
            });
        }

        this._currentBackground = savedBg;
        this._useStdMargins = savedMargins;
        if (opts.autoAddPage !== false) this.doc.addPage();
        else {
            this.doc.x = this.MARGIN_STD;
            this.doc.y = this.MARGIN_STD;
        }
    }

    // --- Charts ---

    /**
     * Draws a 3D-style Bar Chart with side walls and slant.
     *
     * @param data - Array of data points { label, value, color }.
     * @param startX - X-coordinate for the chart origin.
     * @param startY - Y-coordinate for the chart origin.
     * @param options - Configuration for dimensions, fonts, and offsets.
     */
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
            let currentX = startX + index * (barWidth + barGap);

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
                .fillColor("black")
                .fontSize(labelFontSize)
                .font("Helvetica")
                .text(
                    `${Math.round(item.value)}%`,
                    currentX +
                        (barWidth - textBoxWidth) / 2 +
                        percentageLabelOffset,
                    startY + (maxBarHeight - barHeight) + 6,
                    { width: textBoxWidth, align: "center", lineBreak: false },
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

    protected drawSideBySideBarCharts(
        dataLeft: any[],
        dataRight: any[],
        options: any = {},
    ) {
        const scale = options.scale ?? 1;
        const scaleHeight = options.scaleHeight ?? 0;
        const rawConfig = {
            barWidth: 50,
            barGap: 10,
            graphsGap: 30,
            maxBarHeight: 200,
            slantDepth: 15,
            sideViewWidth: 25,
            labelFontSize: 12,
            categoryFontSize: 12,
            percentageLabelOffset: -20,
            categoryLabelOffset: -3.5,
            ...options,
        };

        const config = {
            ...rawConfig,
            barWidth: rawConfig.barWidth * scale,
            barGap: rawConfig.barGap * scale,
            graphsGap: rawConfig.graphsGap * scale,
            maxBarHeight: rawConfig.maxBarHeight * scale + scaleHeight,
            slantDepth: rawConfig.slantDepth * scale,
            sideViewWidth: rawConfig.sideViewWidth * scale,
            labelFontSize: rawConfig.labelFontSize * scale,
            categoryFontSize: rawConfig.categoryFontSize * scale,
            percentageLabelOffset: rawConfig.percentageLabelOffset * scale,
            categoryLabelOffset: rawConfig.categoryLabelOffset * scale,
        };

        this.ensureSpace(20 + config.maxBarHeight + 50);
        const startY = this.doc.y + 20;
        const singleGraphWidth =
            dataLeft.length * config.barWidth +
            (dataLeft.length - 1) * config.barGap;
        const leftChartX =
            (this.PAGE_WIDTH - (singleGraphWidth * 2 + config.graphsGap)) / 2;
        this.draw3DBarChart(dataLeft, leftChartX, startY, config);
        this.draw3DBarChart(
            dataRight,
            leftChartX + singleGraphWidth + config.graphsGap,
            startY,
            config,
        );
        this.doc.y = startY + config.maxBarHeight + 20;
        this.doc.x = this.MARGIN_STD;
    }

    // --- Table ---

    /**
     * Dynamic Table Function with Row Height, Vertical Align, and Column Styles
     */
    protected table(
        headers: string[],
        rows: ((string | number | null | undefined)[] | StyledRow)[],
        options: TableOptions = {},
    ) {
        // --- 0. Destructure & Defaults ---
        const {
            x = this._useStdMargins ? this.doc.x : this.MARGIN_STD,
            width = this.PAGE_WIDTH -
                2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM),
            cellPadding = 5,
            gap = this.DEFAULT_GAP,
            headerAlign = "left",
            rowAlign = "left",
            borderWidth = 0.5,
            borderColor = "#000000",
            rowHeight = 0,
            verticalAlign = "top",
            headerVerticalAlign = "top", // Default to top to match previous behavior
            columnStyles = [], // <--- Default to empty array
        } = options;

        // --- Helper: Get Font for Column ---
        // Determines which font family to use based on column style
        const getColFont = (index: number) => {
            const style = columnStyles[index];
            if (!style) return options.font || this.FONT_REGULAR;

            // Note: If you want Bold + Italic, you need a BoldItalic font registered.
            // Currently falling back to Bold if both are true.
            if (style.bold) return this.FONT_BOLD;
            if (style.italic) return this.FONT_ITALIC;

            return options.font || this.FONT_REGULAR;
        };

        // --- Helper: Get Text Options (Underline/Strike) ---
        const getColTextOpts = (index: number) => {
            const style = columnStyles[index];
            if (!style) return {};
            return {
                underline: style.underline || false,
                strike: style.strike || false,
            };
        };

        // --- Helper: Draw Cell Background ---
        const drawCellRect = (
            xx: number,
            yy: number,
            w: number,
            h: number,
            fill: string | undefined,
            stroke: string,
        ) => {
            if (!fill || fill === "transparent") {
                this.doc
                    .lineWidth(borderWidth)
                    .rect(xx, yy, w, h)
                    .stroke(stroke);
            } else {
                this.doc
                    .lineWidth(borderWidth)
                    .rect(xx, yy, w, h)
                    .fillAndStroke(fill, stroke);
            }
        };

        // --- Helper: Get Alignment ---
        const getColAlign = (
            index: number,
            type: "header" | "row",
        ): TextAlignment => {
            if (type === "header") {
                if (Array.isArray(headerAlign)) {
                    return headerAlign[index] || "left";
                }
                return headerAlign;
            }
            if (Array.isArray(rowAlign)) {
                return rowAlign[index] || "left";
            }
            return rowAlign;
        };

        // --- 1. Smart Column Width Calculation ---
        let finalColWidths: number[] = [];
        const definedWidths =
            options.colWidths || new Array(headers.length).fill("fill");

        // A. Measure "fit"
        definedWidths.forEach((w, i) => {
            if (typeof w === "number") {
                finalColWidths[i] = w;
            } else if (w === "fit") {
                let maxW = 0;

                // Measure Header (Always use Header Font)
                this.doc
                    .font(options.headerFont || this.FONT_SORA_BOLD)
                    .fontSize(options.headerFontSize || 10);
                const headerW = this.doc.widthOfString(headers[i]);
                if (headerW > maxW) maxW = headerW;

                // Measure Rows (MUST use specific Column Font)
                const colFont = getColFont(i);
                this.doc.font(colFont).fontSize(options.fontSize || 10);

                rows.forEach((row) => {
                    let rowData: (
                        | string
                        | number
                        | null
                        | undefined
                        | RichTableCell
                    )[];

                    if (Array.isArray(row)) {
                        rowData = row;
                    } else if (typeof row === "object" && row !== null) {
                        // Skip subheaders
                        if ((row as any).type === "subheader") return;
                        // Use data from StyledRow
                        rowData = (row as any).data;
                    } else {
                        return;
                    }

                    let cellText = "";
                    const cellVal = rowData[i];

                    if (
                        cellVal &&
                        typeof cellVal === "object" &&
                        "content" in cellVal
                    ) {
                        // Rich Text: Measure maximum width of any single line (assuming lines are broken manually or we just measure longest segment)
                        // For simplicity in automatic width: measure the longest text segment.
                        // Ideally, we sum widths if on same line, but for this use case (multiline), max is fine?
                        // Actually, we should concatenate plain text to measure "approximate" or iterate.
                        // Let's just map to string for width calc if 'fit' is used.
                        cellText = (cellVal as RichTableCell).content
                            .map((c) => c.text)
                            .join("");
                    } else {
                        cellText = String(cellVal ?? "");
                    }

                    const cellW = this.doc.widthOfString(cellText);
                    if (cellW > maxW) maxW = cellW;
                });
                finalColWidths[i] = maxW + 2 * cellPadding;
            } else {
                finalColWidths[i] = 0;
            }
        });

        // B. Distribute "fill"
        const usedWidth = finalColWidths.reduce((sum, w) => sum + w, 0);
        const availableWidth = width - usedWidth;
        const fillCount = definedWidths.filter(
            (w) => w === "fill" || w === undefined,
        ).length;
        if (fillCount > 0) {
            const fillWidth = Math.max(availableWidth / fillCount, 0);
            definedWidths.forEach((w, i) => {
                if (w === "fill" || w === undefined)
                    finalColWidths[i] = fillWidth;
            });
        }
        const colWidths = finalColWidths;

        // --- Helper: Calculate Spans ---
        // Returns an array of objects { text: string, span: number, colIndex: number }
        const calculateSpans = (
            rowData: (string | number | null | undefined)[],
        ) => {
            const spans: { text: string; span: number; colIndex: number }[] =
                [];
            if (rowData.length === 0) return spans;

            let currentText = String(rowData[0] ?? "");
            let currentSpan = 1;
            let startColIndex = 0;

            for (let i = 1; i < rowData.length; i++) {
                const text = String(rowData[i] ?? "");
                if (text === currentText) {
                    currentSpan++;
                } else {
                    spans.push({
                        text: currentText,
                        span: currentSpan,
                        colIndex: startColIndex,
                    });
                    currentText = text;
                    currentSpan = 1;
                    startColIndex = i;
                }
            }
            // Push the last one
            spans.push({
                text: currentText,
                span: currentSpan,
                colIndex: startColIndex,
            });
            return spans;
        };

        // --- 2. Measure Header Height ---
        this.doc
            .font(options.headerFont || this.FONT_SORA_BOLD)
            .fontSize(options.headerFontSize || 10);
        let maxHeaderHeight = 0;

        // If merging is enabled, we need to measure based on merged widths?
        // For simplicity, let's measure assuming single cells first, or just enough to fit text.
        // Actually, if we merge, the width is larger, so height might be smaller.
        // But conservative estimate is fine.
        headers.forEach((h, i) => {
            const cw = colWidths[i];
            const height = this.doc.heightOfString(h, {
                width: cw - 2 * cellPadding,
                align: getColAlign(i, "header"),
            });
            if (height > maxHeaderHeight) maxHeaderHeight = height;
        });

        const finalHeaderHeight =
            options.headerHeight ||
            Math.max(maxHeaderHeight + 2 * cellPadding, 20);

        // --- 3. Draw Header ---
        this.ensureSpace(0.15, true);
        let currentX = x;
        let currentY = options.y ?? this.doc.y;

        const hColor = options.headerColor || "#D3D3D3";
        const hTextColor = options.headerTextColor || "black";

        if (options.mergeRepeatedHeaders) {
            const spans = calculateSpans(headers);

            spans.forEach((spanItem) => {
                // Calculate width of this merged cell
                // It is the sum of colWidths from spanItem.colIndex to spanItem.colIndex + spanItem.span
                let mergedWidth = 0;
                for (let k = 0; k < spanItem.span; k++) {
                    mergedWidth += colWidths[spanItem.colIndex + k];
                }

                // Background
                // Use color of the first column in the span? Or an array?
                // If array is passed, we might grab the one at colIndex.
                const cellFill = Array.isArray(hColor)
                    ? hColor[spanItem.colIndex]
                    : hColor;

                drawCellRect(
                    currentX,
                    currentY,
                    mergedWidth,
                    finalHeaderHeight,
                    cellFill,
                    borderColor,
                );

                const cellTextColor = Array.isArray(hTextColor)
                    ? hTextColor[spanItem.colIndex]
                    : hTextColor;

                // Vertical Align
                const textHeight = this.doc.heightOfString(spanItem.text, {
                    width: mergedWidth - 2 * cellPadding,
                    align: getColAlign(spanItem.colIndex, "header"),
                });

                let yOffset = cellPadding;
                if (headerVerticalAlign === "middle") {
                    yOffset = (finalHeaderHeight - textHeight) / 2;
                } else if (headerVerticalAlign === "bottom") {
                    yOffset = finalHeaderHeight - textHeight - cellPadding;
                }

                // Draw Text
                this.doc
                    .fillColor(cellTextColor)
                    .text(
                        spanItem.text,
                        currentX + cellPadding,
                        currentY + yOffset,
                        {
                            width: mergedWidth - 2 * cellPadding,
                            align: getColAlign(spanItem.colIndex, "header"), // Use alignment of the first col
                        },
                    );

                currentX += mergedWidth;
            });
        } else {
            // Standard Header Drawing (Existing Logic)
            headers.forEach((h, i) => {
                const cw = colWidths[i];
                drawCellRect(
                    currentX,
                    currentY,
                    cw,
                    finalHeaderHeight,
                    Array.isArray(hColor) ? hColor[i] : hColor,
                    borderColor,
                );

                const currentTextColor = Array.isArray(hTextColor)
                    ? hTextColor[i]
                    : hTextColor;

                // Calculate Vertical Alignment for Header
                const textHeight = this.doc.heightOfString(h, {
                    width: cw - 2 * cellPadding,
                    align: getColAlign(i, "header"),
                });

                let yOffset = cellPadding; // Default top
                if (headerVerticalAlign === "middle") {
                    yOffset = (finalHeaderHeight - textHeight) / 2;
                } else if (headerVerticalAlign === "bottom") {
                    yOffset = finalHeaderHeight - textHeight - cellPadding;
                }

                this.doc
                    .fillColor(currentTextColor)
                    .text(h, currentX + cellPadding, currentY + yOffset, {
                        width: cw - 2 * cellPadding,
                        align: getColAlign(i, "header"),
                    });
                currentX += cw;
            });
        }

        currentY += finalHeaderHeight;

        // --- 4. Draw Rows ---
        const baseFontSize = options.fontSize || 10;

        // Helper for partial borders (Vertical Merging)
        const drawCellWithBorders = (
            xx: number,
            yy: number,
            w: number,
            h: number,
            fill: string | undefined,
            stroke: string | undefined,
            borders: {
                top?: boolean;
                bottom?: boolean;
                left?: boolean;
                right?: boolean;
            } = { top: true, bottom: true, left: true, right: true },
        ) => {
            if (fill && fill !== "transparent") {
                this.doc.rect(xx, yy, w, h).fill(fill);
            }
            if (stroke) {
                this.doc.lineWidth(borderWidth).strokeColor(stroke);
                if (borders.top !== false)
                    this.doc
                        .moveTo(xx, yy)
                        .lineTo(xx + w, yy)
                        .stroke();
                if (borders.bottom !== false)
                    this.doc
                        .moveTo(xx, yy + h)
                        .lineTo(xx + w, yy + h)
                        .stroke();
                if (borders.left !== false)
                    this.doc
                        .moveTo(xx, yy)
                        .lineTo(xx, yy + h)
                        .stroke();
                if (borders.right !== false)
                    this.doc
                        .moveTo(xx + w, yy)
                        .lineTo(xx + w, yy + h)
                        .stroke();
            }
        };

        rows.forEach((rowOrObj, rowIndex, allRows) => {
            // Identify if this is a subheader, styled row, or normal row
            let isSubHeader = false;
            let isStyledRow = false; // Generic styled row (no forced merging default)
            let rowData: (string | number | null | undefined)[];
            let rowStyle: StyledRow | undefined;

            if (
                !Array.isArray(rowOrObj) &&
                typeof rowOrObj === "object" &&
                rowOrObj !== null
            ) {
                const typedRow = rowOrObj as StyledRow;
                rowStyle = typedRow;
                rowData = typedRow.data;

                if (typedRow.type === "subheader") isSubHeader = true;
                else if (typedRow.type === "row") isStyledRow = true;
            } else {
                rowData = rowOrObj as (string | number | null | undefined)[];
            }

            // A. Calculate Content Height (Measurement)
            let maxContentHeight = 0;
            const cellHeights: number[] = [];

            let spans:
                | { text: string; span: number; colIndex: number }[]
                | null = null;
            if (isSubHeader) {
                spans = calculateSpans(rowData);
            }

            // Loop for measurement
            if (isSubHeader && spans) {
                // Measure based on spans
                // Default to Header Styles if not provided in rowStyle
                const fontToUse =
                    rowStyle?.font ||
                    options.headerFont ||
                    options.font ||
                    this.FONT_SORA_BOLD;
                const fontSizeToUse =
                    rowStyle?.fontSize ||
                    options.headerFontSize ||
                    baseFontSize;

                this.doc.font(fontToUse).fontSize(fontSizeToUse);

                spans.forEach((spanItem) => {
                    let mergedWidth = 0;
                    for (let k = 0; k < spanItem.span; k++)
                        mergedWidth += colWidths[spanItem.colIndex + k];

                    const h = this.doc.heightOfString(spanItem.text, {
                        width: mergedWidth - 2 * cellPadding,
                        align: rowStyle?.align || "left", // alignment override
                    });
                    if (h > maxContentHeight) maxContentHeight = h;
                });
            } else {
                // Standard Measurement (includes StyledRow)
                const fontToUse =
                    isStyledRow && rowStyle?.font ? rowStyle.font : null;
                const fontSizeToUse =
                    isStyledRow && rowStyle?.fontSize
                        ? rowStyle.fontSize
                        : baseFontSize;

                rowData.forEach((val, i) => {
                    const cw = colWidths[i];
                    let cellH = 0;

                    if (val && typeof val === "object" && "content" in val) {
                        // Rich Text Measurement
                        const rCell = val as RichTableCell;
                        let currentH = 0;

                        rCell.content.forEach((item) => {
                            const f = item.bold
                                ? this.FONT_BOLD
                                : item.font || fontToUse || getColFont(i);
                            const s = item.fontSize || fontSizeToUse;

                            this.doc.font(f).fontSize(s);
                            // If text has newlines, heightOfString handles it.
                            // We assume items are stacked or flow.
                            // For this specific requirement (Name \n ID), they are separate blocks essentially.
                            // But if they flow inline, this calc is slightly off.
                            // However, usually we put \n in text for breaks.

                            currentH += this.doc.heightOfString(item.text, {
                                width: cw - 2 * cellPadding,
                                align:
                                    isStyledRow && rowStyle?.align
                                        ? rowStyle.align
                                        : getColAlign(i, "row"),
                            });
                        });
                        cellH = currentH;
                    } else {
                        const cellText = String(val ?? "");
                        const finalFont = fontToUse || getColFont(i);
                        this.doc.font(finalFont).fontSize(fontSizeToUse);

                        cellH = this.doc.heightOfString(cellText, {
                            width: cw - 2 * cellPadding,
                            align:
                                isStyledRow && rowStyle?.align
                                    ? rowStyle.align
                                    : getColAlign(i, "row"),
                        });
                    }

                    // Check Merged Above Logic for Measurement
                    let isMergedAbove = false;
                    const cellText = String(val ?? ""); // For merge check comparison, using string repr might be flawed for objects, but we assume rich text cells don't merge by value equality for now.
                    if (
                        isStyledRow &&
                        rowStyle?.mergeSupportedColumn &&
                        rowIndex > 0
                    ) {
                        const prevRowObj = allRows[rowIndex - 1];
                        if (
                            !Array.isArray(prevRowObj) &&
                            typeof prevRowObj === "object" &&
                            (prevRowObj as StyledRow).type === "row" &&
                            (prevRowObj as StyledRow).mergeSupportedColumn
                        ) {
                            const prevText = String(
                                (prevRowObj as StyledRow).data[i] ?? "",
                            );
                            if (cellText === prevText) isMergedAbove = true;
                        }
                    }

                    if (isMergedAbove) {
                        // Suppress height contribution for merged cells (assumed to be drawn in parent)
                        cellHeights[i] = 0;
                    } else {
                        cellHeights[i] = cellH;
                        if (cellH > maxContentHeight) maxContentHeight = cellH;
                    }
                });
            }

            const requiredHeight = maxContentHeight + 2 * cellPadding;

            // Allow subheader/styledRow to have explicit height
            const finalRowHeight = Math.max(
                requiredHeight,
                rowStyle?.height || rowHeight || 0,
            );

            // B. Page Break Check
            let pageBroke = false;
            if (
                currentY + finalRowHeight >
                this.PAGE_HEIGHT - this.MARGIN_STD
            ) {
                this.doc.addPage();
                currentY = this.MARGIN_STD;
                pageBroke = true;
            }

            currentX = x;

            // C. Determine Row Colors
            let bgColor = "transparent";
            let txtColor = "black";
            let vAlign = verticalAlign;

            if (isSubHeader) {
                // Default to Header Styles for Background and Text
                const headerBg = options.headerColor;
                const headerTxt = options.headerTextColor;

                // Handle array vs string for header defaults
                const defaultBg = Array.isArray(headerBg)
                    ? headerBg[0] || "#eeeeee"
                    : headerBg || "#eeeeee";
                const defaultTxt = Array.isArray(headerTxt)
                    ? headerTxt[0] || "black"
                    : headerTxt || "black";

                bgColor = rowStyle?.fill || defaultBg;
                txtColor = rowStyle?.color || defaultTxt;
                vAlign =
                    rowStyle?.verticalAlign ||
                    options.headerVerticalAlign ||
                    verticalAlign;
            } else if (isStyledRow) {
                // Fully custom row without defaults from header
                bgColor = rowStyle?.fill || "transparent";
                txtColor = rowStyle?.color || "black";
                vAlign = rowStyle?.verticalAlign || verticalAlign;
            } else {
                const isAlternate = rowIndex % 2 !== 0;
                const baseColor = options.rowColor || "transparent";
                const altColor = options.alternateRowColor || baseColor;
                bgColor = isAlternate ? altColor : baseColor;

                txtColor = isAlternate
                    ? options.alternateRowTextColor ||
                      options.rowTextColor ||
                      "black"
                    : options.rowTextColor || "black";
            }

            // D. Draw Cells
            if (isSubHeader && spans) {
                // Draw Merged Subheader Cells
                const fontToUse =
                    rowStyle?.font ||
                    options.headerFont ||
                    options.font ||
                    this.FONT_SORA_BOLD;
                const fontSizeToUse =
                    rowStyle?.fontSize ||
                    options.headerFontSize ||
                    baseFontSize;

                spans.forEach((spanItem) => {
                    let mergedWidth = 0;
                    for (let k = 0; k < spanItem.span; k++)
                        mergedWidth += colWidths[spanItem.colIndex + k];

                    // 1. Background
                    drawCellWithBorders(
                        currentX,
                        currentY,
                        mergedWidth,
                        finalRowHeight,
                        bgColor,
                        borderColor,
                    );

                    // 2. Vert Align
                    const textHeight = this.doc.heightOfString(spanItem.text, {
                        width: mergedWidth - 2 * cellPadding,
                        align: rowStyle?.align || "left",
                    });

                    let yOffset = cellPadding;
                    if (vAlign === "middle") {
                        yOffset = (finalRowHeight - textHeight) / 2;
                    } else if (vAlign === "bottom") {
                        yOffset = finalRowHeight - textHeight - cellPadding;
                    }

                    // 3. Text
                    this.doc
                        .font(fontToUse)
                        .fontSize(fontSizeToUse)
                        .fillColor(txtColor)
                        .text(
                            spanItem.text,
                            currentX + cellPadding,
                            currentY + yOffset,
                            {
                                width: mergedWidth - 2 * cellPadding,
                                align: rowStyle?.align || "left",
                            },
                        );

                    currentX += mergedWidth;
                });
            } else {
                // Standard Row Drawing (includes StyledRow)
                const fontToUse =
                    isStyledRow && rowStyle?.font ? rowStyle.font : null;
                const fontSizeToUse =
                    isStyledRow && rowStyle?.fontSize
                        ? rowStyle.fontSize
                        : baseFontSize;

                rowData.forEach((text, i) => {
                    const cw = colWidths[i];
                    const cellText = String(text ?? "");

                    // Determine Merge Status
                    let isMergedAbove = false;
                    let isMergedBelow = false;

                    if (isStyledRow && rowStyle?.mergeSupportedColumn) {
                        // Check Above
                        if (rowIndex > 0) {
                            const prevRowObj = allRows[rowIndex - 1];
                            if (
                                !Array.isArray(prevRowObj) &&
                                (prevRowObj as StyledRow).type === "row" &&
                                (prevRowObj as StyledRow).mergeSupportedColumn
                            ) {
                                const prevText = String(
                                    (prevRowObj as StyledRow).data[i] ?? "",
                                );
                                if (cellText === prevText) isMergedAbove = true;
                            }
                        }
                        // Check Below
                        if (rowIndex < allRows.length - 1) {
                            const nextRowObj = allRows[rowIndex + 1];
                            if (
                                !Array.isArray(nextRowObj) &&
                                (nextRowObj as StyledRow).type === "row" &&
                                (nextRowObj as StyledRow).mergeSupportedColumn
                            ) {
                                const nextText = String(
                                    (nextRowObj as StyledRow).data[i] ?? "",
                                );
                                if (cellText === nextText) isMergedBelow = true;
                            }
                        }
                    }

                    // Page Break Reset
                    if (pageBroke) isMergedAbove = false;

                    const borders = {
                        top: !isMergedAbove,
                        bottom: !isMergedBelow,
                        left: true,
                        right: true,
                    };

                    // Draw Background & Borders
                    drawCellWithBorders(
                        currentX,
                        currentY,
                        cw,
                        finalRowHeight,
                        bgColor,
                        borderColor,
                        borders,
                    );

                    // Draw Text
                    if (!isMergedAbove) {
                        const textHeight = cellHeights[i] || 0;
                        let yOffset = cellPadding;
                        if (vAlign === "middle") {
                            yOffset = (finalRowHeight - textHeight) / 2;
                        } else if (vAlign === "bottom") {
                            yOffset = finalRowHeight - textHeight - cellPadding;
                        }

                        const cellVal = rowData[i];

                        if (
                            cellVal &&
                            typeof cellVal === "object" &&
                            "content" in cellVal
                        ) {
                            // --- Render Rich Text ---
                            const rCell = cellVal as RichTableCell;
                            let currentTextY = currentY + yOffset;

                            rCell.content.forEach((item) => {
                                const f = item.bold
                                    ? this.FONT_BOLD
                                    : item.font || fontToUse || getColFont(i);
                                const s = item.fontSize || fontSizeToUse;
                                const c = item.color || txtColor;

                                this.doc.font(f).fontSize(s).fillColor(c);

                                this.doc.text(
                                    item.text,
                                    currentX + cellPadding,
                                    currentTextY,
                                    {
                                        width: cw - 2 * cellPadding,
                                        align:
                                            isStyledRow && rowStyle?.align
                                                ? rowStyle.align
                                                : getColAlign(i, "row"),
                                    },
                                );

                                // Advance Y by the height of this block
                                const h = this.doc.heightOfString(item.text, {
                                    width: cw - 2 * cellPadding,
                                    align:
                                        isStyledRow && rowStyle?.align
                                            ? rowStyle.align
                                            : getColAlign(i, "row"),
                                });
                                currentTextY += h;
                            });
                        } else {
                            // --- Render Standard Text ---
                            const cellText = String(rowData[i] ?? "");
                            const finalFont = fontToUse || getColFont(i);

                            this.doc
                                .font(finalFont)
                                .fontSize(fontSizeToUse)
                                .fillColor(txtColor)
                                .text(
                                    cellText,
                                    currentX + cellPadding,
                                    currentY + yOffset,
                                    {
                                        width: cw - 2 * cellPadding,
                                        align:
                                            isStyledRow && rowStyle?.align
                                                ? rowStyle.align
                                                : getColAlign(i, "row"),
                                        ...getColTextOpts(i), // Applies underline/strike
                                    },
                                );
                        }
                    }

                    currentX += cw;
                });
            }
            currentY += finalRowHeight;
        });

        this.doc.y = currentY + gap;
        this.doc.x = this.MARGIN_STD;
    }

    /**
     * Generates a vertical Roadmap/Timeline.
     */
    protected roadmap(data: RoadmapItem[], options: RoadmapOptions = {}) {
        const {
            x = this._useStdMargins ? this.doc.x : this.MARGIN_STD,
            width = this.PAGE_WIDTH -
                2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM),
            gap = 15 * this.MM, // ~42pt
            lineColor = "#D3D3D3",
            lineWidth = 2,
            nodeRadius = 6,
            nodeColor = this.COLOR_DEEP_BLUE,
            nodeStrokeColor = "#FFFFFF",
            nodeStrokeWidth = 2,
            alternating = true,
            contentPadding = 20,

            titleFontSize = 14,
            titleFont = this.FONT_SORA_BOLD,
            titleColor = this.COLOR_BLACK,

            dateFontSize = 10,
            dateFont = this.FONT_SORA_SEMIBOLD,
            dateColor = this.COLOR_DEEP_BLUE,

            descFontSize = 10,
            descFont = this.FONT_REGULAR,
            descColor = "#555555",
        } = options;

        let currentY = options.y ?? this.doc.y;
        const centerX = alternating ? x + width / 2 : x + nodeRadius + 5;

        const drawLine = (startY: number, endY: number) => {
            this.doc
                .moveTo(centerX, startY)
                .lineTo(centerX, endY)
                .strokeColor(lineColor)
                .lineWidth(lineWidth)
                .stroke();
        };

        data.forEach((item, index) => {
            const isLeft = alternating && index % 2 === 0;
            const contentWidth = alternating
                ? width / 2 - contentPadding - 10
                : width - contentPadding - nodeRadius * 2;

            this.doc.font(titleFont).fontSize(titleFontSize);
            const hTitle = this.doc.heightOfString(item.title, {
                width: contentWidth,
            });

            let hDate = 0;
            if (item.date) {
                this.doc.font(dateFont).fontSize(dateFontSize);
                hDate =
                    this.doc.heightOfString(item.date, {
                        width: contentWidth,
                    }) + 2;
            }

            let hDesc = 0;
            if (item.description) {
                this.doc.font(descFont).fontSize(descFontSize);
                hDesc =
                    this.doc.heightOfString(item.description, {
                        width: contentWidth,
                    }) + 4;
            }

            const totalItemHeight = Math.max(
                hTitle + hDate + hDesc,
                nodeRadius * 2,
            );

            if (
                currentY + totalItemHeight + gap >
                this.PAGE_HEIGHT - this.MARGIN_STD
            ) {
                drawLine(currentY, this.PAGE_HEIGHT - this.MARGIN_STD);
                this.doc.addPage();
                currentY = this.MARGIN_STD + 20;
            }

            drawLine(currentY, currentY + totalItemHeight + gap);

            const alignedNodeY = currentY + nodeRadius + 2;
            this.doc
                .circle(centerX, alignedNodeY, nodeRadius)
                .fillColor(item.color || nodeColor)
                .fillAndStroke(item.color || nodeColor, nodeStrokeColor);

            if (item.icon && fs.existsSync(item.icon)) {
                const iconSize = nodeRadius * 1.2;
                this.doc.image(
                    item.icon,
                    centerX - iconSize / 2,
                    alignedNodeY - iconSize / 2,
                    { width: iconSize },
                );
            }

            const textX = isLeft
                ? centerX - contentPadding - contentWidth
                : centerX + contentPadding;
            const align = isLeft ? "right" : "left";
            let textCursorY = currentY;

            if (item.date) {
                this.doc
                    .font(dateFont)
                    .fontSize(dateFontSize)
                    .fillColor(dateColor)
                    .text(item.date, textX, textCursorY, {
                        width: contentWidth,
                        align: align,
                    });
                textCursorY += hDate;
            }

            this.doc
                .font(titleFont)
                .fontSize(titleFontSize)
                .fillColor(titleColor)
                .text(item.title, textX, textCursorY, {
                    width: contentWidth,
                    align: align,
                });
            textCursorY += hTitle;

            if (item.description) {
                this.doc
                    .font(descFont)
                    .fontSize(descFontSize)
                    .fillColor(descColor)
                    .text(item.description, textX, textCursorY + 4, {
                        width: contentWidth,
                        align: align,
                    });
            }

            currentY += totalItemHeight + gap;
        });

        this.doc.y = currentY;
        this.doc.x = this.MARGIN_STD;
    }

    protected drawHorizontalRoadmap(
        blocks: HorizontalRoadmapBlock[],
        options: HorizontalRoadmapOptions & { showLegend?: boolean } = {},
    ) {
        const {
            x = this._useStdMargins ? this.doc.x : this.MARGIN_STD,
            width = this.PAGE_WIDTH -
                2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM),
            blockGap = 25 * this.MM,
            circleRadius = 20 * this.MM,
            showLegend = true,
        } = options;

        const V_LINE_LENGTH = 15 * this.MM;
        const LABEL_HEIGHT = 12 * this.MM;
        const DOT_RADIUS = 1.4 * this.MM;

        // --- FIX START: Sync doc.y to local currentY before loop starts ---
        let currentY = options.y ?? this.doc.y;

        blocks.forEach((block, index) => {
            const blockTotalHeight =
                LABEL_HEIGHT + circleRadius * 2 + V_LINE_LENGTH * 2;

            // 1. Sync doc.y so ensureSpace checks from the correct position
            this.doc.y = currentY;

            // 2. Check for space (will add page if needed)
            this.ensureSpace(blockTotalHeight);

            // 3. Update currentY to reflect any page jumps
            currentY = this.doc.y;

            if (block.label) {
                this.doc
                    .font(this.FONT_SORA_SEMIBOLD)
                    .fontSize(16)
                    .fillColor("#282828")
                    .text(block.label, x, currentY);
                currentY += LABEL_HEIGHT;
            }

            const circleCenterY = currentY + V_LINE_LENGTH + circleRadius;
            const circleX = x + circleRadius + 5 * this.MM;
            const timelineStartX = circleX + circleRadius;
            const timelineEndX = x + width;
            const timelineY = circleCenterY;

            this.doc
                .fillColor(block.color)
                .strokeColor(block.color)
                .circle(circleX, circleCenterY, circleRadius)
                .fill();
            this.drawCenteredTextInCircle(
                circleX,
                circleCenterY,
                block.roleName,
                11,
                circleRadius * 1.8,
                block.textColor, // Pass custom text color
            );

            this.doc
                .strokeColor("#282828")
                .lineWidth(0.4)
                .dash(2, { space: 2 })
                .moveTo(timelineStartX, timelineY)
                .lineTo(timelineEndX, timelineY)
                .stroke()
                .undash();

            const count = block.milestones.length;
            const firstDotX = timelineStartX + 10 * this.MM;
            const lastDotX = timelineEndX - 5 * this.MM;
            const step = count > 1 ? (lastDotX - firstDotX) / (count - 1) : 0;

            block.milestones.forEach((milestone, i) => {
                let mx = firstDotX + step * i;
                let align: "left" | "center" | "right" = "center";
                if (i === 0) {
                    mx = firstDotX;
                    align = "left";
                } else if (i === count - 1) {
                    mx = lastDotX;
                    align = "right";
                }

                this.doc
                    .fillColor("#D1D3D4")
                    .strokeColor("#282828")
                    .lineWidth(0.4)
                    .circle(mx, timelineY, DOT_RADIUS)
                    .fillAndStroke();

                this.doc.dash(2, { space: 2 });
                if (milestone.isAbove) {
                    const lineStart = timelineY - DOT_RADIUS;
                    const lineEnd = lineStart - V_LINE_LENGTH + 4 * this.MM;
                    this.doc.moveTo(mx, lineStart).lineTo(mx, lineEnd).stroke();
                    this.drawMilestoneText(
                        milestone,
                        mx,
                        lineEnd - 2 * this.MM,
                        "bottom",
                        align,
                    );
                } else {
                    const lineStart = timelineY + DOT_RADIUS;
                    const lineEnd = lineStart + V_LINE_LENGTH - 4 * this.MM;
                    this.doc.moveTo(mx, lineStart).lineTo(mx, lineEnd).stroke();
                    this.drawMilestoneText(
                        milestone,
                        mx,
                        lineEnd + 2 * this.MM,
                        "top",
                        align,
                    );
                }
                this.doc.undash();
            });

            const isLast = index === blocks.length - 1;
            const gap = isLast ? 10 * this.MM : blockGap;
            currentY += circleRadius * 2 + V_LINE_LENGTH * 2 + gap;
        });

        if (showLegend) {
            // Ensure space for legend too
            this.doc.y = currentY;
            this.ensureSpace(20 * this.MM);
            currentY = this.doc.y;

            this.drawRoadmapLegend(currentY);
            currentY += 15 * this.MM;
        }

        this.doc.y = currentY;
        this.doc.x = this.MARGIN_STD;
    }

    private drawRoadmapLegend(y: number) {
        const legendItems = [
            { label: "Target Role", type: "circle", color: "#282828" },
            { label: "Milestone", type: "dot", color: "#D1D3D4" },
        ];

        const itemGap = 10 * this.MM;
        const iconSpace = 6 * this.MM;

        let totalWidth = 0;
        this.doc.font(this.FONT_REGULAR).fontSize(10);

        const measuredItems = legendItems.map((item) => {
            const textWidth = this.doc.widthOfString(item.label);
            const itemWidth = iconSpace + textWidth;
            totalWidth += itemWidth;
            return { ...item, width: itemWidth };
        });

        if (measuredItems.length > 1) {
            totalWidth += (measuredItems.length - 1) * itemGap;
        }

        let currentX = (this.PAGE_WIDTH - totalWidth) / 2;
        const startY = y;

        measuredItems.forEach((item) => {
            const iconCenterY = startY - 2.5;

            if (item.type === "circle") {
                this.doc
                    .fillColor(item.color)
                    .circle(currentX + 3, iconCenterY, 3)
                    .fill();
            } else if (item.type === "dot") {
                this.doc
                    .fillColor(item.color)
                    .strokeColor("#282828")
                    .lineWidth(0.5)
                    .circle(currentX + 3, iconCenterY, 2)
                    .fillAndStroke();
            }

            this.doc
                .fillColor("#282828")
                .text(item.label, currentX + iconSpace, startY - 6);

            currentX += item.width + itemGap;
        });
    }

    private drawCenteredTextInCircle(
        cx: number,
        cy: number,
        text: string,
        fontSize: number,
        maxWidth: number,
        color: string = "white", // Added color parameter
    ) {
        this.doc.font(this.FONT_BOLD).fontSize(fontSize).fillColor(color);

        const options = {
            width: maxWidth,
            align: "center" as const,
        };

        const height = this.doc.heightOfString(text, options);
        // Calculate Y to center the text block vertically
        const startY = cy - height / 2;

        this.doc.text(text, cx - maxWidth / 2, startY, options);
    }

    private drawMilestoneText(
        milestone: RoadmapMilestone,
        x: number,
        y: number,
        baseline: "top" | "bottom",
        align: "left" | "center" | "right",
    ) {
        const wrapWidth = 35 * this.MM;
        let textBoxX = x - wrapWidth / 2;
        if (align === "left") textBoxX = x;
        if (align === "right") textBoxX = x - wrapWidth;

        this.doc.font(this.FONT_SEMIBOLD).fontSize(10);
        const hName = this.doc.heightOfString(milestone.name, {
            width: wrapWidth,
            align: align,
        });

        let hCat = 0;
        if (milestone.category) {
            this.doc.font(this.FONT_REGULAR).fontSize(8);
            hCat = this.doc.heightOfString(`(${milestone.category})`, {
                width: wrapWidth,
                align: align,
            });
        }

        const totalH = hName + hCat;
        let startY = baseline === "top" ? y : y - totalH;

        this.doc.font(this.FONT_SEMIBOLD).fontSize(10).fillColor("black");
        this.doc.text(milestone.name, textBoxX, startY, {
            width: wrapWidth,
            align: align,
        });
        startY += hName;

        if (milestone.category) {
            this.doc.font(this.FONT_REGULAR).fontSize(8).fillColor("#58595B");
            this.doc.text(`(${milestone.category})`, textBoxX, startY, {
                width: wrapWidth,
                align: align,
            });
        }
    }

    /**
     * Generates a Radar (Spider) Chart.
     * NOTE: Implements specific geometric logic to match legacy design requirements.
     *
     * @param data - Key-value pair object where Key = Label and Value = Score (0-10).
     * @param options - Styling and dimension options.
     */
    protected drawRadarChart(
        data: { [key: string]: number },
        options: RadarChartOptions = {},
    ) {
        // --- 1. Configuration & Defaults ---
        const {
            x = this.PAGE_WIDTH / 2, // Default to center of page
            y = this.doc.y + 100, // Default to current Y + padding
            radius = 100, // Requested radius
            maxValue = 10,
            levels = 6,
            fontSize = 9,
            font = this.FONT_SORA_REGULAR, // Using your custom font
            colorGrid = "#BCBEC0", // [188, 190, 192]
            colorAxis = "#BCBEC0",
            colorFill = "#50BA66", // [80, 186, 102]
            colorStroke = "#2C2B7C", // [44, 43, 124]
            colorPoint = "#2C2B7C",
            colorText = "#000000",
        } = options;

        const labels = Object.keys(data);
        const values = Object.values(data);
        const numAxes = labels.length;
        const angleStep = (2 * Math.PI) / numAxes;

        // Ensure we have enough space (Standard margin logic)
        // If strict margins are on, we calculate safe width within margins
        const margin = this._useStdMargins ? this.MARGIN_STD : 15 * this.MM;
        const pageWidth = this.PAGE_WIDTH;
        const usableWidth = pageWidth - margin * 2;

        // --- 2. Calculate Safe Radius (Dynamic Layout) ---
        // We measure the widest label to ensure text doesn't get cut off
        this.ensureSpace(0.5, true);
        this.doc.font(font).fontSize(fontSize);
        let maxLabelWidth = 0;
        labels.forEach((label) => {
            const w = this.doc.widthOfString(label);
            if (w > maxLabelWidth) maxLabelWidth = w;
        });

        // The "Safe Radius" is half the usable width minus the longest text width
        // We subtract an extra buffer (e.g. 5mm) for padding
        const safeRadius = usableWidth / 2 - maxLabelWidth - 5 * this.MM;

        // Use the smaller of the requested radius or the safe limit
        const finalRadius = Math.min(radius, safeRadius);
        const labelRadius = finalRadius + 4 * this.MM; // Text sits slightly outside

        // --- 3. Draw Grid (Concentric Polygons) ---
        this.doc.lineWidth(0.5).strokeColor(colorGrid);

        for (let level = 1; level <= levels; level++) {
            const r = finalRadius * (level / levels);
            const points: [number, number][] = [];

            for (let i = 0; i < numAxes; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const px = x + r * Math.cos(angle);
                const py = y + r * Math.sin(angle);
                points.push([px, py]);
            }

            // Draw polygon
            this.doc.polygon(...points).stroke();
        }

        // --- 4. Draw Axes (Spokes) ---
        this.doc.strokeColor(colorAxis);
        const levelOneRadius = finalRadius / levels;
        // Extend slightly beyond the last grid line for aesthetics
        const axisExtend = finalRadius + 2 * this.MM;

        for (let i = 0; i < numAxes; i++) {
            const angle = i * angleStep - Math.PI / 2;

            // Start from level 1 (inner empty circle) or center?
            // PHP ref started from levelOneRadius
            const xStart = x + levelOneRadius * Math.cos(angle);
            const yStart = y + levelOneRadius * Math.sin(angle);

            const xEnd = x + axisExtend * Math.cos(angle);
            const yEnd = y + axisExtend * Math.sin(angle);

            this.doc.moveTo(xStart, yStart).lineTo(xEnd, yEnd).stroke();
        }

        // --- 5. Draw Data Polygon (Filled) ---
        const dataPoints: [number, number][] = [];

        for (let i = 0; i < numAxes; i++) {
            let val = values[i];
            // Clamp value
            if (val > maxValue) val = maxValue;
            if (val < 0) val = 0;

            // Map value to radius (0 maps to inner ring, max maps to outer)
            // PHP Logic: $r = $levelOneRadius + (($radius - $levelOneRadius) * ($value / $maxValue));
            const r =
                levelOneRadius +
                (finalRadius - levelOneRadius) * (val / maxValue);

            const angle = i * angleStep - Math.PI / 2;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            dataPoints.push([px, py]);
        }

        // Fill (with opacity)
        this.doc.save(); // Save graphics state
        this.doc.fillColor(colorFill).fillOpacity(0.18);
        this.doc.polygon(...dataPoints).fill();
        this.doc.restore(); // Restore to remove opacity setting

        // Stroke (Border)
        this.doc.lineWidth(1).strokeColor(colorStroke);
        this.doc.polygon(...dataPoints).stroke();

        // --- 6. Draw Data Points (Dots) ---
        dataPoints.forEach((pt) => {
            // White background for dot to hide grid lines behind it
            this.doc.fillColor("white").opacity(1);
            this.doc.circle(pt[0], pt[1], 2).fill();

            // Actual colored dot
            this.doc.fillColor(colorPoint);
            this.doc.circle(pt[0], pt[1], 2).fill(); // Reduced size for sharper look
        });

        // --- 7. Draw Labels ---
        this.doc.fillColor(colorText).font(font).fontSize(fontSize);

        let maxY = y + finalRadius; // Track lowest point to update cursor later

        for (let i = 0; i < numAxes; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const labelXBase = x + labelRadius * Math.cos(angle);
            const labelYBase = y + labelRadius * Math.sin(angle);
            const label = labels[i];
            const w = this.doc.widthOfString(label);
            const h = this.doc.heightOfString(label);

            let align: "left" | "center" | "right" = "center";
            let xOffset = 0;
            let yOffset = 0;

            // --- Label Quadrant Logic (Ported from PHP) ---
            // We use ranges of angles to determine text alignment relative to the point

            // Normalize angle to 0 - 2PI for easier comparison if needed,
            // but standard -PI to PI works if we match the logic.
            // Using direct quadrant logic is usually safer than specific angle slices in JS:

            // Right Side
            if (angle > -Math.PI / 2 + 0.1 && angle < Math.PI / 2 - 0.1) {
                align = "left";
                xOffset = 2;
                yOffset = -h / 2;
            }
            // Left Side
            else if (angle > Math.PI / 2 + 0.1 || angle < -Math.PI / 2 - 0.1) {
                align = "right";
                xOffset = -2; // PHP used -2 - labelWidth. PDFKit 'right' align needs X to be the right edge.
                yOffset = -h / 2;
            }
            // Top (Approximate)
            else if (Math.abs(angle + Math.PI / 2) <= 0.1) {
                align = "center";
                yOffset = -h - 2;
            }
            // Bottom (Approximate)
            else if (Math.abs(angle - Math.PI / 2) <= 0.1) {
                align = "center";
                yOffset = 2;
            }
            // Corner Cases (Diagonals)
            else {
                // If strictly needed, fine-tune like PHP.
                // But PDFKit align works relative to the provided X.
                // For PDFKit:
                // If Align Right: X provided is the rightmost point.
                // If Align Left: X provided is the leftmost point.

                // Top-Right
                if (angle < 0 && angle > -Math.PI / 2) {
                    align = "left";
                    xOffset = 2;
                    yOffset = -h / 2;
                }
                // Bottom-Right
                else if (angle > 0 && angle < Math.PI / 2) {
                    align = "left";
                    xOffset = 2;
                    yOffset = -h / 2;
                }
                // Bottom-Left
                else if (angle > Math.PI / 2 && angle < Math.PI) {
                    align = "right";
                    xOffset = -2;
                    yOffset = -h / 2;
                }
                // Top-Left
                else {
                    align = "right";
                    xOffset = -2;
                    yOffset = -h / 2;
                }
            }

            // Calculate final positions
            let finalX = labelXBase + xOffset;

            // PDFKit specific: If aligning right, text() expects the x to be the left bound
            // unless we calculate width manually.
            // Actually PDFKit `text(str, x, y, {align: 'right', width: w})` renders inside that width.
            // A simpler way for labels is to manually adjust X based on width:

            if (align === "right") {
                finalX = labelXBase + xOffset - w;
                // Reset align to left because we manually shifted X
                align = "left";
            } else if (align === "center") {
                finalX = labelXBase + xOffset - w / 2;
                align = "left";
            }

            // Clamp to margins (Safety)
            const pageLeft = this._useStdMargins ? this.MARGIN_STD : 10;
            const pageRight =
                pageWidth - (this._useStdMargins ? this.MARGIN_STD : 10);

            if (finalX < pageLeft) finalX = pageLeft;
            if (finalX + w > pageRight) finalX = pageRight - w;

            this.doc.text(label, finalX, labelYBase + yOffset, {
                align: "left", // Always left because we calculated exact X
                width: w + 2, // Give slight buffer to prevent wrapping
            });

            // Track height
            const labelBottom = labelYBase + yOffset + h;
            if (labelBottom > maxY) maxY = labelBottom;
        }

        // Update document cursor to below the chart
        this.doc.y = maxY + 10;
        this.doc.x = this.MARGIN_STD;
    }

    /**
     * Renders a centered text line with horizontal lines on either side.
     */
    protected renderCenteredLineText(text: string, options: any = {}) {
        const {
            fontSize = 10,
            font = this.FONT_REGULAR,
            color = "#58595B", // [88, 89, 91]
            lineColor = "#B4B4B4", // [180, 180, 180]
            lineWidth = 0.2, // PHP used 0.2, likely mm? In points ~0.5.
            extraTopSpace = 10 * this.MM, // 12mm
            extraBottomSpace = 15 * this.MM, // 12mm
        } = options;

        // Estimate height needed for line+text+gap
        const requiredHeight = extraTopSpace + fontSize + extraBottomSpace;

        // Page break check
        // this.ensureSpace(requiredHeight);

        const startY = this.doc.y + extraTopSpace;
        const pageWidth = this.PAGE_WIDTH;

        // Calculate Text Width and Position
        this.doc.font(font).fontSize(fontSize);
        const textWidth = this.doc.widthOfString(text);
        const textX = (pageWidth - textWidth) / 2;

        // Calculate Line Y (approx middle of text cap height)
        const lineY = startY + fontSize / 3;

        // Draw Left Line
        this.doc
            .strokeColor(lineColor)
            .lineWidth(0.5) // 0.2mm ~ 0.57pt
            .moveTo(this.MARGIN_STD, lineY)
            .lineTo(textX - 5, lineY)
            .stroke();

        // Draw Text
        this.doc.fillColor(color).text(text, textX, startY, {
            lineBreak: false,
            baseline: "top",
        });

        // Draw Right Line
        this.doc
            .strokeColor(lineColor)
            .moveTo(textX + textWidth + 5, lineY)
            .lineTo(pageWidth - this.MARGIN_STD, lineY)
            .stroke();

        // Advance Y
        this.doc.y = startY + fontSize + extraBottomSpace;

        // RESET X TO MARGIN
        this.doc.x = this.MARGIN_STD;
    }

    protected addFooters(text: string): void {
        const range = this.doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 1; i < totalPages; i++) {
            this.doc.switchToPage(range.start + i);
            this.doc.save();

            this.doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
            this.doc.y = 0;

            const footerMargin = 15 * this.MM;
            const footerY = this.PAGE_HEIGHT - footerMargin;

            // Line
            this.doc
                .lineWidth(0.5)
                .strokeColor("black")
                .moveTo(this.MARGIN_STD, footerY)
                .lineTo(this.PAGE_WIDTH - this.MARGIN_STD, footerY)
                .stroke();
            const textY = footerY + 2 * this.MM;

            // Text
            this.doc.font(this.FONT_REGULAR).fontSize(8);
            const siteTitle = "Origin BI";
            this.doc
                .fillColor("black")
                .text(siteTitle, this.MARGIN_STD, textY, {
                    lineBreak: false,
                    baseline: "top",
                });

            const titleWidth = this.doc.widthOfString(siteTitle);
            this.doc
                .fillColor("#A9A9A9")
                .text(`#${text}`, this.MARGIN_STD + titleWidth + 5, textY, {
                    lineBreak: false,
                    baseline: "top",
                });

            this.doc
                .fillColor("black")
                .text(
                    `Page ${i + 1} of ${totalPages}`,
                    this.MARGIN_STD,
                    textY,
                    {
                        width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                        align: "right",
                        baseline: "top",
                    },
                );

            this.doc.restore();
        }
    }
    /**
     * Helper: Handles smart name splitting based on specific typographic rules:
     * 1. Try to split in half (floor).
     * 2. Ensure Line 1 has > 3 characters (not including spaces).
     * 3. Ensure Line 2 is not just a single Initial (orphaned).
     */
    protected getSmartSplitName(fullName: string, maxWidth: number): string {
        // 1. Check if name fits on one line
        const currentWidth = this.doc.widthOfString(fullName);
        if (currentWidth <= maxWidth) {
            return fullName;
        }

        const words = fullName.trim().split(/\s+/);
        const totalWords = words.length;

        // If only 1 word but it's too long, we can't split it by spaces. Return as is.
        if (totalWords === 1) return fullName;

        // 2. Initial Split Strategy: Start at roughly half (rounding down)
        // This handles "First Last Init" (3 words) -> Split at 1 ("First" / "Last Init")
        // This handles "First Mid Last Init" (4 words) -> Split at 2 ("First Mid" / "Last Init")
        let splitIndex = Math.floor(totalWords / 2);

        // Safety: If floor resulted in 0 (e.g. 1 word logic, though handled above), force 1
        if (splitIndex < 1) splitIndex = 1;

        // --- RULE 1: First Line Minimum Length ---
        // "First line must have at least more than 3 letters"
        while (splitIndex < totalWords) {
            const line1Candidate = words.slice(0, splitIndex).join(" ");
            // Count actual letters (strip spaces/punctuation)
            const charCount = line1Candidate.replace(/[^a-zA-Z]/g, "").length;

            if (charCount > 3) {
                break; // Condition met
            }
            // If too short (e.g. "M."), pull the next word up to Line 1
            splitIndex++;
        }

        // --- RULE 2: No Orphaned Initials on Line 2 ---
        // "If the initial comes in last, don't ever put that initial alone in second line"
        const line2Words = words.slice(splitIndex);

        // Check if Line 2 has exactly 1 word AND it looks like an initial (<= 2 chars)
        if (line2Words.length === 1) {
            const lastWord = line2Words[0].replace(/[^a-zA-Z]/g, "");
            if (lastWord.length <= 2) {
                // Determine correction direction:
                // We cannot push the initial UP (that would leave Line 2 empty).
                // We must pull the last word of Line 1 DOWN to join the initial.
                if (splitIndex > 1) {
                    splitIndex--;
                }
            }
        }

        // 3. Construct Final String
        const line1 = words.slice(0, splitIndex).join(" ");
        const line2 = words.slice(splitIndex).join(" ");

        return `${line1}\n${line2}`;
    }
}
