import fs from "fs";
import { SchoolData, COLORS } from "../../types/types";
import {
    BaseReport,
    FutureOutlookData,
    FutureOutlookOptions,
} from "../BaseReport";
import {
    SCHOOL_TOC_CONTENT,
    SCHOOL_CONTENT,
    SCHOOL_DYNAMIC_CONTENT,
    SCHOOL_BLENDED_STYLE_MAPPING,
    WORD_SKETCH_DATA,
    DISCLAIMER_CONTENT,
    MAPPING,
} from "./schoolConstants";
import {
    getCompapabilityMatixDetails,
    CourseCompatibility,
} from "../../helpers/sqlHelper";
import { ACI, ACI_SCORE, DISCLAIMER } from "../BaseConstants";
import { logger } from "../../helpers/logger";

/**
 * SchoolReport Class
 * ------------------
 * Generates the School Student Report PDF.
 * Focuses on:
 * - Personalized Insights based on DISC scores.
 * - Study Habits and Learning Styles.
 * - Academic and Career stream recommendations.
 * - Course Compatibility Matrix.
 */
export class SchoolReport extends BaseReport {
    private data: SchoolData;

    constructor(data: SchoolData, options?: PDFKit.PDFDocumentOptions) {
        super(options);
        this.data = data;
    }

    /**
     * Main Generation Method
     * ----------------------
     * Orchestrates the creation of the School Report PDF.
     * Flow:
     * 1. Cover Page
     * 2. Table of Contents
     * 3. Introductory Pages (About, Purpose)
     * 4. Personalized Insights (General Characteristics, Strengths)
     * 5. Nature Style Graph (Charts)
     * 6. Academic & Career Goals (Leadership, Trait Mapping)
     * 7. Course Compatibility Matrix
     * 8. Disclaimer & Closing
     */
    public async generate(outputPath: string): Promise<void> {
        logger.info("[School REPORT] Starting PDF Generation...");
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        const streamFinished = new Promise<void>((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        // 1. Cover Page
        this.generateCoverPage();
        logger.info("[School REPORT] Cover Page Generated.");

        // 2. Table of Contents
        this._currentBackground = "assets/images/Content_Background.jpg";
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();
        logger.info("[School REPORT] TOC Generated.");

        // 3. Introductory Pages
        this._currentBackground = "assets/images/Watermark_Background.jpg";
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateIntroductoryPages();
        logger.info("[School REPORT] Intro Pages Generated.");

        // 4. Personalized Insights
        this.generatePersonalizedInsights();
        logger.info("[School REPORT] Personalized Insights Generated.");

        // 5. Nature Style Graph (Charts)
        this.generateNatureGraphSection();
        logger.info("[School REPORT] Nature Graph Section Generated.");

        // 6. Leadership Strengths - Business Vision
        this.doc.addPage();
        this.generateAcademicCareerGoals();
        logger.info("[School REPORT] Academic Career Goals Generated.");

        // 7. Course Compatability Matrix
        await this.generateCourseCompatability();
        logger.info("[School REPORT] Course Compatability Generated.");

        // 8. Disclaimer & Closing
        this.generateDisclaimerSection();
        logger.info("[School REPORT] Disclaimer Generated.");

        this.addFooters(this.data.exam_ref_no);
        this.doc.end();

        await streamFinished;
        logger.info(
            `[School REPORT] PDF generated successfully at: ${outputPath}`,
        );
    }

    // --- Section Methods (Placeholders) ---

    private generateCoverPage(): void {
        const bgPath = "assets/images/Cover_Background.jpg";
        if (fs.existsSync(bgPath))
            this.doc.image(bgPath, 0, 0, {
                width: this.PAGE_WIDTH,
                height: this.PAGE_HEIGHT,
            });
        else
            this.doc
                .rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT)
                .fill("#f0f0f0");

        // --- Title Wrapping ---
        const titleWidth = this.PAGE_WIDTH - 100;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(38)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.report_title, 35, 30, {
                width: titleWidth,
                align: "left",
            });

        // --- Vertical Reference Number ---
        const refNoX = this.PAGE_WIDTH - 47;
        const refNoY = 150;

        this.doc.save(); // Save state before rotation

        this.doc.translate(refNoX, refNoY);
        this.doc.rotate(-90, { origin: [0, 0] });

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(8)
            .fillColor(this.COLOR_BLACK)
            .opacity(0.4)
            .text(this.data.exam_ref_no, 0, 0);

        this.doc.restore(); // Restore state (undo rotation)

        // --- Footer Elements ---
        const footerY = this.PAGE_HEIGHT - 90;
        this.doc.opacity(1);

        // Draw "Self Guidance" Label
        this.doc
            .font(this.FONT_SEMIBOLD)
            .fontSize(20)
            .fillColor(this.COLOR_BLACK)
            .text("Self Guidance", 35, footerY);

        // Draw Date
        const dateString = new Date(this.data.exam_start).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "long", year: "numeric" },
        );
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(16)
            .text(dateString, 35, footerY + 25);

        // --- FIX 2: Name Alignment with Smart Wrapping ---

        // 1. Set font first so width calculations are accurate
        this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

        const nameWidthLimit = 300; // Half page limit
        const rawName = this.data.full_name;

        // 2. Calculate the smart string (returns "First Last" or "First\nLast")
        const nameText = this.getSmartSplitName(rawName, nameWidthLimit);

        // 3. Define Position
        const rightMarginLimit = 35;
        // X position: Page Width - Text Box Width - Margin - Gap
        const nameX = this.PAGE_WIDTH - nameWidthLimit - rightMarginLimit - 20;
        const nameBaseY = footerY + 20; // This is where the bottom line should sit

        const nameOptions = {
            width: nameWidthLimit + 20,
            align: "right" as const,
        };

        // 4. Calculate Height for "Bottom-Up" positioning
        // heightOfString handles the \n correctly
        const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
        const singleLineHeight = this.doc.heightOfString("M", nameOptions);

        // AdjustedY ensures the last line of text is always at nameBaseY
        const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);

        this.doc
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(nameText, nameX, adjustedNameY, nameOptions);
    }

    private generateTableOfContents(): void {
        const headerX = 15 * this.MM;
        const circleCenterX = 25 * this.MM;

        // Define the bottom limit (Page Height - Footer Margin)
        const bottomLimit = this.PAGE_HEIGHT - 30 * this.MM;

        // 1. Print Header on the first page
        this.h1("Table of Contents", { x: headerX, y: headerX, fontSize: 38 });

        // Set the starting Y position for the first item
        let currentY = 45 * this.MM;

        // TOC items gap by TOC items count
        let tocItemsGap = 10;
        if (SCHOOL_TOC_CONTENT.length > 10 && SCHOOL_TOC_CONTENT.length < 13) {
            tocItemsGap = 8;
        } else if (SCHOOL_TOC_CONTENT.length >= 13) {
            tocItemsGap = 10;
        }

        SCHOOL_TOC_CONTENT.forEach((item, index) => {
            // 2. Check for overflow
            if (currentY > bottomLimit) {
                this.doc.addPage();

                // 3. Re-print the Header on the new page
                this.h1("Table of Contents", {
                    x: headerX,
                    y: headerX,
                    fontSize: 38,
                });

                // 4. Reset Y position for the content (same as the first page start)
                currentY = 45 * this.MM;
            }

            const contentText = item.replace("$full_name", this.data.full_name);
            const circleY = currentY + 5 * this.MM;

            // Draw the Circle
            this.doc
                .lineWidth(0.4 * this.MM)
                .strokeColor(this.COLOR_BRIGHT_GREEN)
                .circle(circleCenterX, circleY, 5 * this.MM)
                .stroke();

            // Draw the Number inside the circle
            this.renderTextBase((index + 1).toString(), {
                x: 20 * this.MM,
                y: circleY - 7,
                width: 10 * this.MM,
                align: "center",
                font: this.FONT_SORA_REGULAR,
                fontSize: 12,
                color: this.COLOR_DEEP_BLUE,
            });

            // Draw the Content Text
            this.renderTextBase(contentText, {
                x: 35 * this.MM,
                y: currentY + 1.5 * this.MM,
                width: this.PAGE_WIDTH - 60 * this.MM,
                font: this.FONT_SORA_SEMIBOLD,
                fontSize: 16,
                color: this.COLOR_BLACK,
            });

            // Increment Y for the next loop
            currentY = this.doc.y + tocItemsGap * this.MM;
        });
    }

    /**
     * Generates Intro Pages.
     * Covers:
     * - About the report.
     * - Purpose and Benefits.
     * - How the report helps the student.
     */
    private generateIntroductoryPages(): void {
        // About the Report
        this.h1("About the Origin BI Self-Discovery Report");
        this.pHtml(SCHOOL_CONTENT.about_report);
        this.doc.moveDown();

        // Purpose (Bulleted List)
        this.h2("Purpose of the Report");
        this.list(SCHOOL_CONTENT.purpose_items, { indent: 30 });
        this.doc.moveDown();

        // Why It Matters
        this.h2("Why the Origin BI Self Discovery Assessment Matters");
        this.pHtml(SCHOOL_CONTENT.why_matters);
        this.list(SCHOOL_CONTENT.why_matters_items, { indent: 30 });
        this.doc.moveDown();

        // What You Gain
        this.h2("What You Gain");
        this.p("This Report offers:", { gap: 2 });
        this.list(SCHOOL_CONTENT.what_you_gain_items, {
            indent: 30,
            type: "number",
        });
        this.pHtml(SCHOOL_CONTENT.about_origin_bi);

        // --- Benefits ---
        this.h1("Benefits of Identifying Strategic Business Enhancement Paths");

        this.pHtml(SCHOOL_CONTENT.benefits_career_paths_desc);
        this.pHtml(SCHOOL_CONTENT.benefits_career_paths_para_2);

        this.h2("Why Identifying the Right Career Matters");
        this.pHtml(SCHOOL_CONTENT.why_identifying_career_matters_desc);
        this.pHtml(SCHOOL_CONTENT.why_identifying_career_matters_para_2);

        // --- How This Report Helps You ---
        this.h2("How This Report Helps You");
        this.pHtml(SCHOOL_CONTENT.how_report_helps_intro);
        this.list(SCHOOL_CONTENT.how_report_helps_items, { indent: 30 });
        this.pHtml(SCHOOL_CONTENT.how_report_helps_outro);

        // Important Note (Boxed/Highlighted usually, but simple text for now based on PHP)
        this.h2("An Important Note");
        this.pHtml(SCHOOL_CONTENT.important_note_desc);
    }

    /**
     * Generates Personalized Insights.
     * Logic:
     * - Fetches dynamic content based on the primary Answer Type (DISC).
     * - Renders sections: Who I Am, Key Strengths, Motivations, Communication Tips.
     * - Includes Nature Style Graph and Agile Compatibility Index (ACI).
     */
    private generatePersonalizedInsights(): void {
        // most_answered_answer_type is an array of objects {ANSWER_TYPE, COUNT}
        const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
        const content = SCHOOL_DYNAMIC_CONTENT[primaryType];

        if (!content) {
            logger.error(
                `[School REPORT] No content found for DISC type: ${primaryType}`,
            );
            return;
        }

        // 1. Personalized Leadership Insights (Intro)
        this.h1(`General Characteristics for ${this.data.full_name}`);
        this.pHtml(content.general_characteristics_1);

        // this.h2("Your Executive Behavioral Snapshot");
        this.pHtml(content.general_characteristics_2);

        // 2. Understanding Yourself - Who I Am
        this.h2("Understanding Yourself - Who I Am");
        this.pHtml(content.understanding_yourself_1);
        this.pHtml(content.understanding_yourself_2);

        // 3. Key Strengths
        this.h1("YOUR STRENGTHS - What You Bring to the Organization");
        this.pHtml(content.strengths_intro);
        this.h2("Your Natural Strengths");
        this.list(content.strengths_list, { indent: 30 });
        this.h2("Nature Style Graph", {
            align: "center",
            color: this.COLOR_DEEP_BLUE,
        });
        const topTrait = this.getTopTwoTraits()[0];
        let chartData: { label: string; value: number; color: number[] }[] = [];

        if (topTrait === "D") {
            chartData = [
                { label: "D", value: 85, color: COLORS.D },
                { label: "I", value: 30, color: COLORS.I },
                { label: "S", value: 25, color: COLORS.S },
                { label: "C", value: 40, color: COLORS.C },
            ];
        } else if (topTrait === "I") {
            chartData = [
                { label: "D", value: 30, color: COLORS.D },
                { label: "I", value: 80, color: COLORS.I },
                { label: "S", value: 50, color: COLORS.S },
                { label: "C", value: 30, color: COLORS.C },
            ];
        } else if (topTrait === "S") {
            chartData = [
                { label: "D", value: 25, color: COLORS.D },
                { label: "I", value: 35, color: COLORS.I },
                { label: "S", value: 85, color: COLORS.S },
                { label: "C", value: 40, color: COLORS.C },
            ];
        } else if (topTrait === "C") {
            chartData = [
                { label: "D", value: 20, color: COLORS.D },
                { label: "I", value: 25, color: COLORS.I },
                { label: "S", value: 40, color: COLORS.S },
                { label: "C", value: 90, color: COLORS.C },
            ];
        } else {
            // Fallback
            chartData = [
                { label: "D", value: this.data.score_D, color: COLORS.D },
                { label: "I", value: this.data.score_I, color: COLORS.I },
                { label: "S", value: this.data.score_S, color: COLORS.S },
                { label: "C", value: this.data.score_C, color: COLORS.C },
            ];
        }
        this.drawSingleBarChart(chartData, { percentageLabelOffset: -25 });

        // 4. Motivations
        this.h1("Motivations and Needs – Your Personalized Insights");
        this.pHtml(
            content.motivations_intro.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.doc.moveDown();

        this.h3(`What Drives ${this.data.full_name}`);
        this.pHtml(content.what_drives_desc);
        this.doc.moveDown();

        // Unique Needs
        this.h3("Your Unique Needs");
        this.pHtml(content.unique_needs_desc);

        // 5. Communication - Should
        this.h1(
            `Communication Tips for Connecting with ${this.data.full_name}`,
        );
        this.h2(`How Others Can Best Communicate With ${this.data.full_name}`);
        this.pHtml(content.communication_desc);

        // Do's List
        this.p(`When communicating with ${this.data.full_name}, DO's`);
        this.list(content.communication_dos_list, {
            indent: 30,
            type: "number",
        });
        this.doc.moveDown();

        // Communication - Should Not
        this.h2("What Others Should Avoid");
        this.pHtml(content.communication_avoid_desc);

        // Dont's List
        this.p(`When communicating with ${this.data.full_name}, DON'T`);
        this.list(content.communication_donts_list, {
            indent: 30,
            type: "number",
        });
        this.doc.moveDown();

        // 6. Impact and Growth Areas
        this.h2("Your Potential Growth Areas");
        this.doc.lineGap(2);
        this.complexOrderedList(content.growth_areas_html, {
            gap: 10,
            color: this.COLOR_BLACK,
        });

        this.generateACI();

        // 7. Executive Behavioral SnapShot
        this.h1("Your Personalized Behavioral Charts");
        this.h3("What makes you Exceptional");
        this.pHtml(content.behavioral_snapshot_intro);

        // 8. Understanding Graphs
        this.h3("Understanding the Graphs");
        this.list(content.understanding_graphs_list, {
            indent: 30,
        });

        // 9. Key Insights
        this.h3("Key Insights");
        this.list(content.key_insights_list, {
            indent: 30,
        });
    }

    private generateACI(): void {
        const dominantType = this.data.most_answered_answer_type[0]
            .ANSWER_TYPE as "D" | "I" | "S" | "C";
        const contentBlock =
            ACI[this.getTopTwoTraits()[0] + this.getTopTwoTraits()[1]];
        const agileSum =
            this.data.agile_scores[0].commitment +
            this.data.agile_scores[0].focus +
            this.data.agile_scores[0].openness +
            this.data.agile_scores[0].respect +
            this.data.agile_scores[0].courage;

        // this.doc.lineGap(2);
        this.h1("Agile Compatibility Index (ACI)");
        this.pHtml(DISCLAIMER.aci_description);
        this.pHtml(contentBlock.agile_desc_1);

        this.h2("Pesonalized Insight");
        this.pHtml(contentBlock.personalized_insight);

        this.h2("Agile Value-Wise Breakdown Table");

        const awbtHeaders = [
            "Agile Value",
            "Score (Out of 25)",
            "Behavioural Note",
        ];

        const awbtRows = [
            [
                "Commitment",
                this.data.agile_scores[0].commitment,
                `${contentBlock.agile_wise_breakdown.commitment.behavioural_note}`,
            ],
            [
                "Focus",
                this.data.agile_scores[0].focus,
                `${contentBlock.agile_wise_breakdown.focus.behavioural_note}`,
            ],
            [
                "Openness",
                this.data.agile_scores[0].openness,
                `${contentBlock.agile_wise_breakdown.openness.behavioural_note}`,
            ],
            [
                "Respect",
                this.data.agile_scores[0].respect,
                `${contentBlock.agile_wise_breakdown.respect.behavioural_note}`,
            ],
            [
                "Courage",
                this.data.agile_scores[0].courage,
                `${contentBlock.agile_wise_breakdown.courage.behavioural_note}`,
            ],
        ];

        this.table(awbtHeaders, awbtRows, {
            colWidths: ["fit", "fit", "fill"],
            rowColor: "transparent",
        });

        let agileRef = ACI_SCORE["0"];
        if (agileSum >= 100) {
            agileRef = ACI_SCORE["100"];
        } else if (agileSum >= 75) {
            agileRef = ACI_SCORE["75"];
        } else if (agileSum >= 50) {
            agileRef = ACI_SCORE["50"];
        } else {
            agileRef = ACI_SCORE["0"];
        }

        const aciScoreHeaders = ["Parameter", "Description"];
        const aciScoreRows = [
            ["Total Score", `${agileSum} / 125`],
            ["Level", agileRef.title],
            ["Compatibility Tag", agileRef.compatibility_tag],
            ["Interpretation", agileRef.interpretation],
        ];

        this.h2("Score Overview");

        this.table(aciScoreHeaders, aciScoreRows, {
            colWidths: ["fit", "fill"],
            rowColor: "transparent",
        });

        this.h2("Value-wise Scores & Micro-habits");
        const vwmhHeader = [
            "Agile Value",
            "Behavioural Reflection",
            "Suggested Micro-Habit for Growth",
        ];

        const vwmhRows = [
            [
                "Commitment",
                contentBlock.agile_wise_breakdown.commitment
                    .behavioural_description,
                contentBlock.agile_wise_breakdown.commitment
                    .suggested_micro_habit,
            ],
            [
                "Focus",
                contentBlock.agile_wise_breakdown.focus.behavioural_description,
                contentBlock.agile_wise_breakdown.focus.suggested_micro_habit,
            ],
            [
                "Openness",
                contentBlock.agile_wise_breakdown.openness
                    .behavioural_description,
                contentBlock.agile_wise_breakdown.openness
                    .suggested_micro_habit,
            ],
            [
                "Respect",
                contentBlock.agile_wise_breakdown.respect
                    .behavioural_description,
                contentBlock.agile_wise_breakdown.respect.suggested_micro_habit,
            ],
            [
                "Courage",
                contentBlock.agile_wise_breakdown.courage
                    .behavioural_description,
                contentBlock.agile_wise_breakdown.courage.suggested_micro_habit,
            ],
        ];

        this.table(vwmhHeader, vwmhRows, {
            colWidths: ["fit", "fill", "fill"],
            rowColor: "transparent",
        });

        this.doc.moveDown(2);
        this.h2("Reflection Summary");
        this.pHtml(contentBlock.reflection_summary);
    }

    private generateNatureGraphSection(): void {
        const topTrait = this.getTopTwoTraits()[0];
        let chartData: { label: string; value: number; color: number[] }[] = [];

        if (topTrait === "D") {
            chartData = [
                { label: "D", value: 85, color: COLORS.D },
                { label: "I", value: 30, color: COLORS.I },
                { label: "S", value: 25, color: COLORS.S },
                { label: "C", value: 40, color: COLORS.C },
            ];
        } else if (topTrait === "I") {
            chartData = [
                { label: "D", value: 30, color: COLORS.D },
                { label: "I", value: 80, color: COLORS.I },
                { label: "S", value: 50, color: COLORS.S },
                { label: "C", value: 30, color: COLORS.C },
            ];
        } else if (topTrait === "S") {
            chartData = [
                { label: "D", value: 25, color: COLORS.D },
                { label: "I", value: 35, color: COLORS.I },
                { label: "S", value: 85, color: COLORS.S },
                { label: "C", value: 40, color: COLORS.C },
            ];
        } else if (topTrait === "C") {
            chartData = [
                { label: "D", value: 20, color: COLORS.D },
                { label: "I", value: 25, color: COLORS.I },
                { label: "S", value: 40, color: COLORS.S },
                { label: "C", value: 90, color: COLORS.C },
            ];
        } else {
            // Fallback
            chartData = [
                { label: "D", value: this.data.score_D, color: COLORS.D },
                { label: "I", value: this.data.score_I, color: COLORS.I },
                { label: "S", value: this.data.score_S, color: COLORS.S },
                { label: "C", value: this.data.score_C, color: COLORS.C },
            ];
        }
        // --- Logic for Nature and Adapted Style Graph ---
        const pageContentHeight = this.PAGE_HEIGHT - 2 * this.MARGIN_STD;
        const heightPercent = 92; // 92%
        const normalHeightNeeded = pageContentHeight * (heightPercent / 100);
        const currentY = this.doc.y;
        const pageHeight = this.PAGE_HEIGHT;
        const bottomMargin = this.MARGIN_STD;
        const availableSpace = pageHeight - bottomMargin - currentY;

        let shouldAddPage = false;
        let scalingAdjustment = 0;
        let scale = 1;
        let x = 0;

        if (availableSpace >= normalHeightNeeded) {
            // Fits perfectly
            scalingAdjustment = -50;
        } else if (availableSpace >= normalHeightNeeded - 50) {
            scalingAdjustment = -50;
            scale = 0.8;
        } else {
            // Does not fit even with shrink
            shouldAddPage = true;
            scalingAdjustment = 0;
            scale = 1;
            x = 0.5;
        }

        if (shouldAddPage) {
            this.ensureSpace(1, true); // Force new page
        }

        this.h2(`Nature Style Graph`, {
            align: "center",
            color: this.COLOR_DEEP_BLUE,
            topGap: 0,
        });
        this.Image("assets/images/behavioural-charts.png", {
            width: this.PAGE_WIDTH - 120,
            align: "center",
        });
        this.doc.moveDown(x);
        this.h2(`Nature and Adapted Style`, {
            align: "center",
            color: this.COLOR_DEEP_BLUE,
        });
        const adaptedData = [
            { label: "D", value: this.data.score_D, color: COLORS.D },
            { label: "I", value: this.data.score_I, color: COLORS.I },
            { label: "S", value: this.data.score_S, color: COLORS.S },
            { label: "C", value: this.data.score_C, color: COLORS.C },
        ];
        this.drawSideBySideBarCharts(chartData, adaptedData, {
            scaleHeight: scalingAdjustment,
            scale: scale,
        });
        this.PagedImage("assets/images/future-industries-nopage.jpg", {
            resizeMode: "stretch",
            autoAddPage: false,
        });
        this.PagedImage("assets/images/career-popularity-nopage.jpg", {
            resizeMode: "stretch",
            autoAddPage: false,
        });
        this.generateFutureTechPage();
        this.doc.y += 10 * this.MM;
        this.generateFutureOutlookPage({}, { addAsNewPage: false });
    }

    /**
     * Generates Academic & Career Goals Section.
     * Logic:
     * - Identifies the Dominant Trait Combo (e.g., "DI").
     * - Renders the corresponding "Nature Elements" (Fire/Water/Earth/Air).
     * - Provides Suggestions, Key Behaviours, and Trait Mapping tables.
     */
    private generateAcademicCareerGoals(): void {
        const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
        const dominantTrait = this.data.most_answered_answer_type
            .sort((a, b) => b.COUNT - a.COUNT)
            .slice(0, 2)
            .map((trait) => trait.ANSWER_TYPE)
            .join("");

        const contentBlock =
            SCHOOL_BLENDED_STYLE_MAPPING[
                dominantTrait as keyof typeof SCHOOL_BLENDED_STYLE_MAPPING
            ];
        if (!contentBlock) return;

        this.h1("Mapping Your Strengths to Future Academic and Career Goals");
        this.h2(contentBlock.style_name);
        this.pHtml(contentBlock.style_desc);

        this.renderElementCombo(dominantTrait[0], dominantTrait[1]);

        this.h3("Suggestions");
        this.pHtml(contentBlock.nature_suggestions);

        this.h3("Key Behaviours");
        this.list(contentBlock.key_behaviours, { indent: 30, type: "number" });

        this.h3("Typical Scenarios");
        this.list(contentBlock.typical_scenarios, {
            indent: 30,
            type: "number",
        });

        this.h2("Trait Mapping", { ensureSpace: 0.15 });

        const headers = [
            "Trait Combination",
            "Role Suggestions",
            "Recommended Focus Areas",
            "Stress Areas",
        ];
        const tableWidth =
            this.PAGE_WIDTH -
            2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM);
        const colWidths = [
            tableWidth * 0.2,
            tableWidth * 0.3,
            tableWidth * 0.25,
            tableWidth * 0.25,
        ];
        this.table(headers, contentBlock.trait_mapping1, {
            fontSize: 8,
            headerFontSize: 8,
            colWidths: colWidths,
        });
        this.generateRespondParameterTable(primaryType);
    }

    /**
     * Generates Course Compatibility Matrix.
     * Logic:
     * - Fetches compatibility data for the student's stream and top traits.
     * - Renders a Bar Chart comparing compatibility percentages for various courses.
     * - Includes the "Nature Style - Word Sketch".
     */
    private async generateCourseCompatability(): Promise<void> {
        this.h1("Course Compatability Matrix");
        const topTwoTraits = this.getTopTwoTraits();

        const data = await getCompapabilityMatixDetails(
            topTwoTraits[0] + topTwoTraits[1],
            this.data.school_stream_id,
        );
        console.log(data);

        this.generateCourseCompatabilityTable(
            data,
            topTwoTraits[0],
            topTwoTraits[1],
        );
        this.doc.moveDown();

        this.h2("Nature Style - Word Sketch");
        this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc);
        this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc_1);
        this.generateWordSketch();
    }

    private generateDisclaimerSection(): void {
        this.h1(DISCLAIMER_CONTENT.title);
        this.pHtml(DISCLAIMER_CONTENT.intro);

        this.h3(DISCLAIMER_CONTENT.limitations_title);
        this.list(DISCLAIMER_CONTENT.limitations_bullets, { indent: 30 });

        this.h3(DISCLAIMER_CONTENT.no_warranties_title);
        this.pHtml(DISCLAIMER_CONTENT.no_warranties_intro, { gap: 10 });
        this.pHtml(DISCLAIMER_CONTENT.no_warranties_disclaimer);
        this.list(DISCLAIMER_CONTENT.no_warranties_bullets, { indent: 30 });

        this.h3(DISCLAIMER_CONTENT.indemnity_title);
        this.pHtml(DISCLAIMER_CONTENT.indemnity_intro);
        this.list(DISCLAIMER_CONTENT.indemnity_bullets, { indent: 30 });
        this.pHtml(DISCLAIMER_CONTENT.indemnity_outro);

        this.h3(DISCLAIMER_CONTENT.no_liability_title);
        this.pHtml(DISCLAIMER_CONTENT.no_liability_desc);

        // Final Closing Note
        this.doc.font(this.FONT_SORA_REGULAR).fontSize(10).fillColor("#555555"); // Greyish
        this.pHtml(DISCLAIMER_CONTENT.closing_note);
    }

    // --- Special Generators ---

    public generateWordSketch(): void {
        this._useStdMargins = true;

        // 1. Configuration
        const tableWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        // 5 columns: Label, D, I, S, C
        const labelColWidth = tableWidth * 0.1;
        const dataColWidth = (tableWidth - labelColWidth) / 4;
        const colWidths = [
            labelColWidth,
            dataColWidth,
            dataColWidth,
            dataColWidth,
            dataColWidth,
        ];

        // Standardized font sizes for table content
        const TABLE_FONT_SIZE = 8;
        const HEADER_FONT_SIZE = 9;

        // 2. Data Definitions
        // Static rows (headers/metadata)
        const staticRows = [
            {
                label: "Needs",
                vals: [
                    "Challenges to solve,\nAuthority",
                    "Social relationship,\nFriendly environment",
                    "Rules of follow,\nData to Analyze",
                    "System, Teams,\nStable environment",
                ],
            },
            {
                label: "Emotions",
                vals: [
                    "Decisive, risk-taker",
                    "Optimistic, trust others",
                    "Caution, careful decision",
                    "Patience, stabilizer",
                ],
            },
            {
                label: "Fears",
                vals: [
                    "..being taken advantage\nof/lack of control",
                    "..being left out,\nloss of social approval",
                    "..being criticized, loss\nof accuracy and quality",
                    "..sudden changes/\nloss of stability",
                ],
            },
        ];

        // Word Sketch Rows (Levels 6 down to 1)
        const sketchData = [
            {
                level: 6,
                d: "argumentative daring demanding decisive domineering egocentric",
                i: "emotional enthusiastic gregarious impulsive optimistic persuasive",
                s: "calming loyal patient peaceful serene team person",
                c: "accurate conservative exacting fact-finder precise systematic",
            },
            {
                level: 5,
                d: "adventurous risk-taker direct forceful",
                i: "charming influential sociable trusting",
                s: "consistent cooperative possessive relaxed",
                c: "conscientious courteous focused high standards",
            },
            {
                level: 4,
                d: "assertive competitive determined self-reliant",
                i: "confident friendly generous poised",
                s: "composed deliberate stable steady",
                c: "analytical neat sensitive tactful",
            },
            {
                level: 3,
                d: "calculated risks moderate questioning unassuming",
                i: "controlled discriminating rational reflective",
                s: "alert eager flexible mobile",
                c: "own person self assured opinionated persistent",
            },
            {
                level: 2,
                d: "mild seeks consensus unobtrusive weighs pro/con",
                i: "contemplative factual logical retiring",
                s: "discontented energetic fidgety impetuous",
                c: "autonomous independent firm stubborn",
            },
            {
                level: 1,
                d: "agreeing cautious conservative contemplative modest restrained",
                i: "introspective pessimistic quiet pensive reticent suspicious",
                s: "active change-oriented fault-finding impatient restless spontaneous",
                c: "arbitrary defiant fearless obstinate rebellious sarcastic",
            },
        ];

        // 3. Logic: Determine Level (1-6) from Score (0-100)
        const getLevel = (score: number) => {
            if (score <= 15) return 1;
            if (score <= 30) return 2;
            if (score <= 45) return 3;
            if (score <= 60) return 4;
            if (score <= 75) return 5;
            return 6;
        };

        const dLevel = getLevel(this.data.score_D);
        const iLevel = getLevel(this.data.score_I);
        const sLevel = getLevel(this.data.score_S);
        const cLevel = getLevel(this.data.score_C);

        // Colors
        const highlightColors = {
            D: "#FFCCCC",
            I: "#FFF0CC",
            S: "#CCFFE2",
            C: "#CCF4FF",
        };
        const headerColors = [
            "#D3D3D3",
            "#FF3131",
            "#E8B236",
            "#00AD4C",
            "#4AC6EA",
        ];
        // Colors for main headers: Empty is grey, D/I/S/C use their brand colors
        const headerTextColors = ["black", "black", "black", "white", "white"];

        // --- DRAWING ---

        // Check overall space approximation: Headers (2 rows) + Static (3 rows) + Spacer + Sketch (6 rows)
        // Approx 20 * 2 + 25 * 3 + 5 + 25 * 6 = 40 + 75 + 5 + 150 = ~270 points
        this.ensureSpace(0.55, true);

        let currentY = this.doc.y;
        const startX = this.MARGIN_STD;
        const headerHeight = 20;

        // A. Main Headers (Dominance, Influence, etc.)
        const headers = [
            "",
            "Dominance (D)",
            "Influence (I)",
            "Steadiness (S)",
            "Conscientiousness (C)",
        ];
        this.doc.font(this.FONT_SORA_BOLD).fontSize(HEADER_FONT_SIZE);

        headers.forEach((h, i) => {
            let cx =
                startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
            const w = colWidths[i];

            // Draw BG
            this.doc
                .rect(cx, currentY, w, headerHeight)
                .fillColor(headerColors[i])
                .fill();

            // Draw Border
            this.doc
                .rect(cx, currentY, w, headerHeight)
                .strokeColor("black")
                .lineWidth(0.5)
                .stroke();

            // Text
            this.doc
                .fillColor(headerTextColors[i])
                .text(h, cx + 2, currentY + 6, {
                    width: w - 4,
                    align: "center",
                });
        });
        currentY += headerHeight;

        // B. Sub Headers (DISC Focus, etc.)
        const subHeaders = [
            "DISC Focus",
            "Problem/Tasks",
            "People",
            "Pace (Environment)",
            "Procedure",
        ];
        this.doc.font(this.FONT_SORA_BOLD).fontSize(8).fillColor("black");

        subHeaders.forEach((h, i) => {
            let cx =
                startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
            const w = colWidths[i];

            this.doc
                .rect(cx, currentY, w, headerHeight)
                .fillColor("#D3D3D3")
                .fillAndStroke("#D3D3D3", "black");

            this.doc.fillColor("black").text(h, cx + 2, currentY + 6, {
                width: w - 4,
                align: "center",
            });
        });
        currentY += headerHeight;

        // C. Static Rows (Needs, Emotions, Fears)
        this.doc.font(this.FONT_REGULAR).fontSize(TABLE_FONT_SIZE);
        staticRows.forEach((row) => {
            const cells = [row.label, ...row.vals];

            // Calc Height
            let maxH = 20;
            cells.forEach((text, i) => {
                const w = colWidths[i];
                const h = this.doc.heightOfString(text, { width: w - 4 }) + 10;
                if (h > maxH) maxH = h;
            });

            // Ensure Space per row
            if (currentY + maxH > this.PAGE_HEIGHT - this.MARGIN_STD) {
                this.doc.addPage();
                currentY = this.MARGIN_STD;
            }

            // Draw Cells
            cells.forEach((text, i) => {
                let cx =
                    startX +
                    (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
                const w = colWidths[i];

                this.doc
                    .rect(cx, currentY, w, maxH)
                    .strokeColor("black")
                    .stroke();
                this.doc.text(text, cx + 2, currentY + 5, {
                    width: w - 4,
                    align: "center",
                });
            });
            currentY += maxH;
        });

        // Spacer Row
        this.doc
            .rect(startX, currentY, tableWidth, 5)
            .fillColor("#D3D3D3")
            .fillAndStroke("#D3D3D3", "black");
        currentY += 5;

        // D. Word Sketch Rows
        sketchData.forEach((row) => {
            // Determine highlighting
            const highlights = [
                false,
                dLevel === row.level, // D col
                iLevel === row.level, // I col
                sLevel === row.level, // S col
                cLevel === row.level, // C col
            ];

            const cells = [row.level.toString(), row.d, row.i, row.s, row.c];

            let maxH = 25;
            cells.forEach((text, i) => {
                const w = colWidths[i];
                const h = this.doc.heightOfString(text, { width: w - 4 }) + 10;
                if (h > maxH) maxH = h;
            });

            // Page Break Check
            if (currentY + maxH > this.PAGE_HEIGHT - this.MARGIN_STD) {
                this.doc.addPage();
                currentY = this.MARGIN_STD;
            }

            cells.forEach((text, i) => {
                let cx =
                    startX +
                    (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
                const w = colWidths[i];

                // Draw Background Highlight
                if (highlights[i]) {
                    const colorKey = ["", "D", "I", "S", "C"][i];
                    this.doc
                        .rect(cx, currentY, w, maxH)
                        .fillColor((highlightColors as any)[colorKey])
                        .fill();
                }

                // Draw Border
                this.doc
                    .rect(cx, currentY, w, maxH)
                    .strokeColor("black")
                    .lineWidth(0.5)
                    .stroke();

                // Draw Text
                this.doc.fillColor("black").text(text, cx + 2, currentY + 5, {
                    width: w - 4,
                    align: "center",
                });
            });

            currentY += maxH;
        });

        this.doc.y = currentY + 20;
        this.doc.x = this.MARGIN_STD;
    }

    private generateRespondParameterTable(
        dominantType: "D" | "I" | "S" | "C",
    ): void {
        const contentBlock = SCHOOL_DYNAMIC_CONTENT[dominantType];
        const headers = [
            "Trait",
            "Conflict Management",
            "Change Management",
            "Team Dynamics",
            "Communication",
            "Sustainability",
            "Social Responsibility",
        ];
        const totalWidth =
            this.PAGE_WIDTH -
            2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM);
        const colWidths = [
            totalWidth * 0.1,
            totalWidth * 0.15,
            totalWidth * 0.15,
            totalWidth * 0.15,
            totalWidth * 0.15,
            totalWidth * 0.15,
            totalWidth * 0.15,
        ];
        const traitNames = {
            D: "Dominance",
            I: "Influence",
            S: "Steadiness",
            C: "Conscientiousness",
        };
        const traitName = traitNames[dominantType];
        const rowData = [[traitName, ...contentBlock.respond_parameter_row]];
        this.ensureSpace(100);
        this.table(headers, rowData, {
            fontSize: 8,
            headerFontSize: 8,
            headerColor: "#D3D3D3",
            headerTextColor: "#000000",
            borderColor: "#000000",
            cellPadding: 5,
            colWidths: colWidths,
        });
    }

    private generateFutureTechPage(): void {
        this.doc.addPage();
        this._useStdMargins = true;
        const margin = 15 * this.MM;

        // --- Header Section ---
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(36)
            .fillColor("black")
            .text("Tech Areas That Will", margin, margin);
        this.doc.text("Matter in ", margin, this.doc.y, { continued: true });
        this.doc.fillColor(this.COLOR_DEEP_BLUE).text("2027 - 2035");

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(20)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text("Emerging Technologies", margin, this.doc.y + 10 * this.MM);

        // --- Legend Section ---
        const legendY = this.doc.y + 5;
        const legendX = 142 * this.MM;
        this.doc.save();
        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(9)
            .fillColor("black")
            .text("2027", legendX, legendY, { lineBreak: false });

        const circleX = legendX + 16 * this.MM;
        const circleY = legendY + 3;

        // Legend Graphic
        this.doc
            .lineWidth(0.5)
            .strokeColor("#B4B4B4")
            .fillColor("white")
            .circle(circleX, circleY, 1.5 * this.MM)
            .fillAndStroke();
        this.doc
            .moveTo(circleX + 1.5 * this.MM, circleY)
            .lineTo(circleX + 11.5 * this.MM, circleY)
            .strokeColor("#BEBEBE")
            .lineWidth(0.3)
            .stroke();
        this.doc
            .polygon(
                [circleX + 13.5 * this.MM, circleY],
                [circleX + 11.5 * this.MM, circleY - 1.25 * this.MM],
                [circleX + 11.5 * this.MM, circleY + 1.25 * this.MM],
            )
            .fillColor("#BEBEBE")
            .fill();
        this.doc
            .circle(circleX + 15 * this.MM, circleY, 1.5 * this.MM)
            .fillColor("#AAAAAF")
            .fill();
        this.doc
            .fillColor("black")
            .text("2035", circleX + 20 * this.MM, legendY, {
                lineBreak: false,
            });
        this.doc.restore();

        // --- Chart Section ---
        const [t1, t2] = this.getTopTwoTraits();
        const skills = MAPPING[t1 + t2];
        const years = [25, 27, 29, 31, 33, 35];
        const boxWidth = 15.5 * this.MM;
        const startBarY = this.doc.y + 20 * this.MM;

        this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

        // Calculate layout width based on longest label
        let maxLabelWidth = 0;
        skills.forEach((s) => {
            const w = this.doc.widthOfString(s.label);
            if (w > maxLabelWidth) maxLabelWidth = w;
        });
        maxLabelWidth += 4 * this.MM;

        const sectionStartX =
            (this.PAGE_WIDTH -
                (maxLabelWidth + 8 * this.MM + years.length * boxWidth)) /
            2;
        const barStartX = sectionStartX + maxLabelWidth + 8 * this.MM;

        // Render Rows
        skills.forEach((row, index) => {
            const barY = startBarY + index * 10 * this.MM;
            const barCenterY = barY + 2.5 * this.MM; // The vertical center of the chart bar

            // --- FIX START: Vertical Alignment Calculation ---
            const labelOptions = {
                width: maxLabelWidth,
                align: "right" as const,
            };

            // 1. Measure the height of the label (1 line, 2 lines, etc.)
            this.doc.font(this.FONT_SORA_REGULAR).fontSize(12); // Set font before measuring
            const labelHeight = this.doc.heightOfString(
                row.label,
                labelOptions,
            );

            // 2. Calculate Y to center text on barCenterY
            // Formula: CenterPoint - (TextHeight / 2) - BaselineAdjustment
            const centeredLabelY = barCenterY - labelHeight / 2 - 2;

            this.doc
                .fillColor("black")
                .text(row.label, sectionStartX, centeredLabelY, labelOptions);
            // --- FIX END ---

            this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

            // Draw Years Grid
            years.forEach((year, i) => {
                const bx = barStartX + i * boxWidth;
                this.doc
                    .rect(bx, barY, boxWidth, 5 * this.MM)
                    .fillColor("#E8E8E8")
                    .fill();

                // Draw Year Labels (Top Row Only)
                if (index === 0)
                    this.doc
                        .fillColor("black")
                        .text(year.toString(), bx, barY - 15, {
                            width: boxWidth,
                            align: "center",
                        });

                // Draw White Separators
                if (i < years.length - 1)
                    this.doc
                        .moveTo(bx + boxWidth, barY)
                        .lineTo(bx + boxWidth, barY + 5 * this.MM)
                        .strokeColor("white")
                        .stroke();
            });

            // Draw Data Line/Dots
            const startOffset =
                ((row.start - 25) / 2) * boxWidth + boxWidth / 2;
            const endOffset = ((row.end - 25) / 2) * boxWidth + boxWidth / 2;
            const openPosX = barStartX + startOffset;
            const endPosX = barStartX + endOffset;

            this.doc
                .moveTo(openPosX, barCenterY)
                .lineTo(endPosX - 2 * this.MM, barCenterY)
                .lineWidth(0.4)
                .strokeColor("#1E1E1E")
                .stroke();
            this.doc
                .circle(openPosX, barCenterY, 1.5 * this.MM)
                .lineWidth(0.4)
                .fillColor("#E8E8E8")
                .strokeColor("#1E1E1E")
                .fillAndStroke();
            this.doc
                .polygon(
                    [endPosX, barCenterY],
                    [endPosX - 2 * this.MM, barCenterY - 1 * this.MM],
                    [endPosX - 2 * this.MM, barCenterY + 1 * this.MM],
                )
                .fillColor("#1E1E1E")
                .fill();
            this.doc
                .circle(endPosX + 1.4 * this.MM, barCenterY, 1.5 * this.MM)
                .fillColor("#161482")
                .fill();
        });
    }

    private generateFutureOutlookPage(
        data: FutureOutlookData = {},
        options: FutureOutlookOptions = {},
    ): void {
        const {
            title = "Future Outlook",
            centerLabel = "Interdisciplinary, tech-driven expertise",
            leftValue = "39%",
            leftLabel = "current job\nskills",
            rightValue = "2030",
            rightLabel = "obsolete",
            sourceText = "Source : World Economic Forum (WEF) Future of Jobs Report 2025.",
        } = data;

        const circleR = 32 * this.MM;

        // --- PAGE SETUP ---
        if (options.addAsNewPage !== false) {
            this.doc.addPage();
            this._useStdMargins = true;
        } else this.ensureSpace(120 * this.MM);
        if (options.addAsNewPage === false) this.doc.moveDown(1);
        const startX = this._useStdMargins ? this.doc.x : this.MARGIN_STD;

        // --- TITLE ---
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(options.titleFontSize || 20)
            .fillColor(options.titleColor || this.COLOR_DEEP_BLUE)
            .text(title, startX, this.doc.y);

        // --- COORDINATE CALCULATIONS ---
        const centerX = 80 * this.MM;
        const centerY = this.doc.y + 45 * this.MM;
        const offset = circleR * 1.65;
        const rightCircleX = centerX + offset - 11 * this.MM;

        // Calculate Center Dot X early to use as anchor for dotted circles
        const centerDotX = centerX + offset / 2 - 5.5 * this.MM;

        this.doc.save();

        // --- SOLID GRADIENT CIRCLES ---
        // Left Fill
        const lGrad = this.doc.linearGradient(
            centerX - circleR,
            centerY,
            centerX + circleR,
            centerY,
        );
        lGrad
            .stop(0, options.leftCircleGradientStart || "#A6D3E1")
            .stop(1, options.leftCircleGradientEnd || "#FFFFFF");
        this.doc.circle(centerX, centerY, circleR).fill(lGrad);

        // Right Fill
        const rGrad = this.doc.linearGradient(
            rightCircleX - circleR,
            centerY,
            rightCircleX + circleR,
            centerY,
        );
        rGrad
            .stop(0, options.rightCircleGradientStart || "#FFFFFF")
            .stop(1, options.rightCircleGradientEnd || "#150089");
        this.doc
            .opacity(0.4)
            .circle(rightCircleX, centerY, circleR)
            .fill(rGrad);

        this.doc.opacity(1.0);

        // Solid Strokes
        this.doc
            .lineWidth(0.38)
            .strokeColor("#76B3C3")
            .circle(centerX, centerY, circleR)
            .stroke();
        this.doc
            .strokeColor("#7268BF")
            .circle(rightCircleX, centerY, circleR)
            .stroke();

        // --- DOTTED CIRCLES ---
        this.doc.dash(2, { space: 2 });
        const spacing = 13 * this.MM; // Gap between the two dotted circles

        // Left Side Dotted Circles (Cyan)
        // Inner touches centerDotX, Outer is shifted left
        this.doc.strokeColor("#76B3C3");
        this.doc
            .opacity(0.75)
            .circle(centerDotX - circleR, centerY, circleR)
            .stroke(); // Inner
        this.doc
            .opacity(0.5)
            .circle(centerDotX - circleR - spacing, centerY, circleR)
            .stroke(); // Outer

        // Right Side Dotted Circles (Purple)
        // Inner touches centerDotX, Outer is shifted right
        this.doc.strokeColor("#ACA8DE");
        this.doc
            .opacity(0.75)
            .circle(centerDotX + circleR, centerY, circleR)
            .stroke(); // Inner
        this.doc
            .opacity(0.5)
            .circle(centerDotX + circleR + spacing, centerY, circleR)
            .stroke(); // Outer
        // -----------------------------

        this.doc.undash().opacity(1);

        // --- CENTER GREEN DOT & LINE ---
        this.doc
            .dash(2, { space: 2 })
            .strokeColor("#3CC878")
            .moveTo(centerDotX, centerY - 45 * this.MM)
            .lineTo(centerDotX, centerY)
            .stroke();
        this.doc
            .moveTo(centerDotX, centerY - 45 * this.MM)
            .lineTo(centerDotX + 9 * this.MM, centerY - 45 * this.MM)
            .stroke();
        this.doc
            .undash()
            .fillColor([30, 200, 100])
            .circle(centerDotX, centerY, 2.2 * this.MM)
            .fill();

        // --- TEXT LABELS ---
        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(options.centerLabelFontSize || 12)
            .fillColor(options.centerLabelColor || "#2C3627")
            .text(
                centerLabel,
                centerDotX + 10 * this.MM,
                centerY - 50 * this.MM,
                { width: 200 },
            );

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(options.valueFontSize || 26)
            .fillColor(options.valueColor || "#19191E");
        this.doc.text(
            leftValue,
            centerX - 25 * this.MM,
            centerY - 11 * this.MM,
            { align: "center", width: 28 * this.MM },
        );
        this.doc.text(
            rightValue,
            centerX + offset - 15 * this.MM,
            centerY - 11 * this.MM,
            { align: "center", width: 28 * this.MM },
        );

        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(options.labelFontSize || 10);
        this.doc.text(
            leftLabel,
            centerX - 35 * this.MM + 40,
            centerY - 2 * this.MM,
            { align: "left", width: 40 * this.MM },
        );
        this.doc.text(
            rightLabel,
            centerX + offset - 18 * this.MM,
            centerY - 1.5 * this.MM,
            { align: "center", width: 40 * this.MM },
        );

        // --- FOOTER ---
        const footerY = centerY + circleR + 6 * this.MM;
        this.doc
            .font("Helvetica-Oblique")
            .fontSize(options.sourceFontSize || 7)
            .fillColor("#282828")
            .text(sourceText, this.MARGIN_STD, footerY, {
                align: "center",
                width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
            });

        this.doc.restore();
        this.doc.y = footerY + 20 * this.MM;
    }

    private getTopTwoTraits(): [string, string] {
        if (
            this.data.most_answered_answer_type &&
            this.data.most_answered_answer_type.length >= 2
        ) {
            return [
                this.data.most_answered_answer_type[0].ANSWER_TYPE,
                this.data.most_answered_answer_type[1].ANSWER_TYPE,
            ];
        }
        const scores = [
            { type: "D", val: this.data.score_D },
            { type: "I", val: this.data.score_I },
            { type: "S", val: this.data.score_S },
            { type: "C", val: this.data.score_C },
        ];
        scores.sort((a, b) => b.val - a.val);
        return [scores[0].type, scores[1].type];
    }

    /**
     * Generates a Course Compatibility Bar Chart.
     * Visuals:
     * - Renders bars indicating compatibility %.
     * - Color coding: High compatibility (>=70%) uses Primary Trait color, Low uses Secondary.
     *
     * @param data Array of course objects
     * @param traitHigh Trait char (D/I/S/C) for scores >= 70%
     * @param traitLow Trait char (D/I/S/C) for scores < 70%
     */
    private generateCourseCompatabilityTable(
        data: any[],
        traitHigh: string,
        traitLow: string,
    ): void {
        // --- 1. Layout Constants (Converted from PHP to PDFKit points) ---
        const chartLeft = 100 * this.MM; // PHP: 100
        const chartTop = this.doc.y; // PHP: $pdf->getY() + 8
        const barHeight = 4 * this.MM; // PHP: 4
        const barSpace = 2 * this.MM; // PHP: 2
        const maxBarWidth = 90 * this.MM; // PHP: 90
        const tickLength = 2 * this.MM; // PHP: 2

        // Calculate total height needed
        const chartHeight = data.length * (barHeight + barSpace);
        const chartBottom = chartTop + chartHeight;
        const chartRight = chartLeft + tickLength + maxBarWidth;

        // Ensure we have space on the page
        if (chartBottom + 50 * this.MM > this.PAGE_HEIGHT) {
            this.doc.addPage();
            // Recalculate top if we added a page
            // (You might need to reset chartTop here based on your margin logic)
        }

        // --- 2. Define Colors (Matching PHP RGB values) ---
        const DISC_COLORS: Record<string, string> = {
            D: "#D82A29", // [216, 42, 41]
            I: "#FEDD10", // [254, 221, 16]
            S: "#4FB965", // [79, 185, 101] (PHP code had this as Green)
            C: "#01AADB", // [1, 170, 219]
        };

        const DISC_TEXT_COLORS: Record<string, string> = {
            D: "#FFFFFF",
            I: "#000000",
            S: "#FFFFFF",
            C: "#FFFFFF",
        };

        const colorHigh = traitHigh.toUpperCase();
        const colorLow = traitLow.toUpperCase();

        // --- 3. Draw Axes ---
        const axisWidth = 0.6; // PHP was 0.6 (likely points in FPDF default)
        this.ensureSpace(0.4, true);
        this.doc.save(); // Save state for line width changes
        this.doc.lineWidth(axisWidth).strokeColor("black");

        // Y-Axis
        this.doc
            .moveTo(chartLeft, chartTop)
            .lineTo(chartLeft, chartBottom)
            .stroke();

        // X-Axis (Adjusted slightly to join perfectly)
        this.doc
            .moveTo(chartLeft - axisWidth / 2, chartBottom)
            .lineTo(chartRight, chartBottom)
            .stroke();

        // --- 4. Draw Grid and Ticks (0 to 100) ---
        this.doc.lineWidth(0.2);
        this.doc.font(this.FONT_SORA_REGULAR).fontSize(8).fillColor("black");

        for (let i = 0; i <= 100; i += 20) {
            const x = chartLeft + tickLength + (i * maxBarWidth) / 100;

            // X-axis tick (downwards)
            this.doc
                .moveTo(x, chartBottom)
                .lineTo(x, chartBottom + 2 * this.MM) // PHP tick length was 2
                .strokeColor("black")
                .stroke();

            // X-axis Label
            // PHP: Cell(10, 4, "$i", 0, 0, 'C');
            // Centered text below tick
            this.doc.text(
                i.toString(),
                x - 5 * this.MM,
                chartBottom + 3 * this.MM,
                {
                    width: 10 * this.MM,
                    align: "center",
                },
            );
        }
        this.doc.restore(); // Restore line width

        // --- 5. Draw Bars ---
        data.forEach((item, index) => {
            const val = parseFloat(item.compatibility_percentage);
            const y = chartTop + index * (barHeight + barSpace);
            const barWidth = (maxBarWidth * val) / 100;
            const tickY = y + barHeight / 2;

            // A. Draw short horizontal black tick (Axis connector)
            this.doc.save();
            this.doc.lineWidth(0.6).strokeColor("black");
            this.doc
                .moveTo(chartLeft, tickY)
                .lineTo(chartLeft + tickLength, tickY)
                .stroke();
            this.doc.restore();

            // B. Determine Colors
            // PHP Logic: >= 70 uses Color 1, else Color 2
            const useTrait = val >= 70 ? colorHigh : colorLow;
            const barColor = DISC_COLORS[useTrait] || "#808080";
            const textColor = DISC_TEXT_COLORS[useTrait] || "#000000";

            // C. Draw Bar Rect
            this.doc
                .rect(chartLeft + tickLength, y, barWidth, barHeight)
                .fillColor(barColor)
                .fill();

            // D. Label (Left of Y Axis)
            // PHP: Cell($chartLeft - 19, $barHeight, $label, 0, 0, 'R');
            // Align Right, ending at (chartLeft - 4mm padding approx)
            this.doc
                .font(this.FONT_SORA_REGULAR)
                .fontSize(9)
                .fillColor("black")
                .text(item.course_name, 15 * this.MM, y - 1, {
                    // y-1 for visual centering
                    width: chartLeft - 19 * this.MM,
                    align: "right",
                    height: barHeight,
                });

            // E. Value Label (Right of Bar)
            // PHP: SetXY($chartLeft + $tickLength + $barWidth + 2, $y);
            this.doc
                .font(this.FONT_SORA_REGULAR)
                .fontSize(9)
                .fillColor("black") // Explicitly black as per your previous chart logic, or usage of textColor?
                // PHP code sets TextColor based on DISC, but typically this label is outside the bar.
                // If the label is outside, White text (DISC_TEXT_COLORS) will be invisible.
                // Reverting to BLACK for visibility unless it's inside.
                // Based on PHP code structure, it sets color then prints.
                // If you strictly want PHP behavior: .fillColor(textColor)
                // But I recommend Black for outside labels.
                .fillColor("black")
                .text(
                    `${val.toFixed(0)}%`,
                    chartLeft + tickLength + barWidth + 2 * this.MM,
                    y - 1,
                );
        });

        // --- 6. Footer Label ---
        // PHP: Cell(..., 'Compatibility (%)', ..., 'C');
        const footerY = chartBottom + 8 * this.MM;
        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(10)
            .fillColor("black")
            .text("Compatibility (%)", 0, footerY, {
                width: this.PAGE_WIDTH,
                align: "center",
            });

        // --- 7. Description Text ---
        // PHP: SetXY(15, $pdf->getY() + 12); MultiCell...
        const descY = footerY + 12 * this.MM;
        const desc =
            "The course compatibility chart you’ve received is based on your unique personality Report results, aiming to highlight programs that align well with your strengths and traits. However, this is not a fixed or singular recommendation. Your personal interests, evolving passions, and exposure to different fields also play a crucial role in shaping the right career path for you. We’ve combined your profile with real-time industry data to give you a future-oriented perspective. Please keep in mind that course trends and career opportunities can shift from year to year as the world continues to evolve-new fields emerge, and existing ones transform. Use this as a guide, not a rulebook, to explore and make informed choices about your educational journey.";

        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(9)
            .fillColor("black")
            .text(desc, 15 * this.MM, descY, {
                width: this.PAGE_WIDTH - 30 * this.MM, // Approx margin
                align: "left",
                lineGap: 2,
            });

        // Move doc cursor to end of this section
        this.doc.y =
            descY +
            this.doc.heightOfString(desc, {
                width: this.PAGE_WIDTH - 30 * this.MM,
            });
    }

    /**
     * Renders the "Nature Elements" combo (e.g. Water + Earth) centered on the page.
     * Logic:
     * - Maps traits (D, I, S, C) to Elements (Fire, Water, Earth, Air).
     * - Renders Icons + Labels + Plus sign in a centered row.
     */
    private renderElementCombo(trait1: string, trait2: string): void {
        // 1. Map codes to Labels and Image filenames
        const elementMap: { [key: string]: string } = {
            D: "Fire",
            I: "Water",
            S: "Earth",
            C: "Air",
        };

        const iconMap: { [key: string]: string } = {
            D: "Fire.png",
            I: "Water.png",
            S: "Earth.png",
            C: "Air.png",
        };

        // Safety check: if traits aren't valid D/I/S/C, exit or handle gracefully
        if (!elementMap[trait1] || !elementMap[trait2]) {
            console.error(
                `[School Report] Invalid traits passed to renderElementCombo: ${trait1}, ${trait2}`,
            );
            return;
        }

        const baseIconPath = "assets/images/nature-icons/";

        // 2. Define Dimensions (using your this.MM conversion)
        const imgSize = 20 * this.MM; // Icon width/height
        const gap = 5 * this.MM; // Gap between icon and plus sign
        const plusWidth = 8 * this.MM; // Width reserved for the "+"
        const labelHeight = 6 * this.MM; // Height reserved for the text label above

        // Total width of the group: [Icon] [Gap] [Plus] [Gap] [Icon]
        const totalGroupWidth = imgSize + gap + plusWidth + gap + imgSize;

        // 3. Calculate Centering
        const startX = (this.PAGE_WIDTH - totalGroupWidth) / 2;

        // Move down slightly from previous content
        this.doc.moveDown(1);
        const currentY = this.doc.y;

        // 4. Draw First Element (Trait 1)
        const label1 = elementMap[trait1];
        const iconPath1 = baseIconPath + iconMap[trait1];

        // Label 1
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(12)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(label1, startX, currentY, {
                width: imgSize,
                align: "center",
            });

        // Icon 1
        if (fs.existsSync(iconPath1)) {
            this.doc.image(iconPath1, startX, currentY + labelHeight, {
                width: imgSize,
                height: imgSize,
            });
        } else {
            this.doc
                .rect(startX, currentY + labelHeight, imgSize, imgSize)
                .stroke();
        }

        // 5. Draw the Plus Sign ("+")
        const plusX = startX + imgSize + gap;
        const plusY = currentY + labelHeight + imgSize / 2 - 6 / 2; // vertical center adjustment

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(18)
            .fillColor("black")
            .text("+", plusX, plusY, {
                width: plusWidth,
                align: "center",
            });

        // 6. Draw Second Element (Trait 2)
        const startX2 = plusX + plusWidth + gap;
        const label2 = elementMap[trait2];
        const iconPath2 = baseIconPath + iconMap[trait2];

        // Label 2
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(12)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(label2, startX2, currentY, {
                width: imgSize,
                align: "center",
            });

        // Icon 2
        if (fs.existsSync(iconPath2)) {
            this.doc.image(iconPath2, startX2, currentY + labelHeight, {
                width: imgSize,
                height: imgSize,
            });
        } else {
            this.doc
                .rect(startX2, currentY + labelHeight, imgSize, imgSize)
                .stroke();
        }

        // 7. Reset Cursor Position for next elements
        // Set Y below the images
        this.doc.y = currentY + labelHeight + imgSize + 5 * this.MM;

        // !!! IMPORTANT: Reset X to the standard margin !!!
        this.doc.x = this.MARGIN_STD;

        // Reset color to black
        this.doc.fillColor(this.COLOR_BLACK);
    }
}
