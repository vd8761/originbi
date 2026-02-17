import fs from "fs";
import { CollegeData, COLORS } from "../../types/types";
import { BaseReport } from "../BaseReport";
import {
    EMPLOYEE_TOC_CONTENT,
    EMPLOYEE_CONTENT,
    EMPLOYEE_DYNAMIC_CONTENT,
    BLENDED_STYLE_MAPPING,
    WORD_SKETCH_DATA,
    DISCLAIMER_CONTENT,
} from "./employeeConstants";
import { ACI, ACI_SCORE, DISCLAIMER } from "../BaseConstants";
import { logger } from "../../helpers/logger";

/**
 * EmployeeReport Class
 * --------------------
 * Generates the Employee / Professional Report PDF.
 * Focuses on:
 * - Professional Strengths and Motivators.
 * - Communication Styles (Do's and Don'ts).
 * - Business Vision Alignment.
 * - Agile Compatibility Index (ACI).
 */
export class EmployeeReport extends BaseReport {
    private data: CollegeData;

    constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
        super(options);
        this.data = data;
    }

    /**
     * Main Generation Method
     * ----------------------
     * Orchestrates the creation of the Employee Report PDF.
     * Flow:
     * 1. Cover Page
     * 2. Table of Contents
     * 3. Introductory Pages
     * 4. Personalized Insights (Strengths, Motivations, Communication)
     * 5. Nature Style Graph (Charts)
     * 6. Business Vision (Leadership Alignment)
     * 7. Disclaimer & Closing
     */
    public async generate(outputPath: string): Promise<void> {
        logger.info("[EmployeeREPORT] Starting PDF Generation...");
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        const streamFinished = new Promise<void>((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        // 1. Cover Page
        this.generateCoverPage();
        logger.info("[EmployeeREPORT] Cover Page Generated.");

        // 2. Table of Contents
        this._currentBackground = "assets/images/Content_Background.jpg";
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();
        logger.info("[EmployeeREPORT] TOC Generated.");

        // 3. Introductory Pages
        this._currentBackground = "assets/images/Watermark_Background.jpg";
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateIntroductoryPages();
        logger.info("[EmployeeREPORT] Intro Pages Generated.");

        // 4. Personalized Insights
        this.generatePersonalizedInsights();
        logger.info("[EmployeeREPORT] Personalized Insights Generated.");

        // 5. Nature Style Graph (Charts)
        this.doc.addPage();
        this.generateNatureGraphSection();
        logger.info("[EmployeeREPORT] Nature Graph Section Generated.");

        // 6. Leadership Strengths - Business Vision
        this.doc.addPage();
        this.generateBusinessVisionSection();
        logger.info("[EmployeeREPORT] Business Vision Section Generated.");

        // 7. Disclaimer & Closing
        this.generateDisclaimerSection();
        logger.info("[EmployeeREPORT] Disclaimer Generated.");

        this.addFooters(this.data.exam_ref_no);
        this.doc.end();

        await streamFinished;
        logger.info(
            `[EmployeeREPORT] PDF generated successfully at: ${outputPath}`,
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
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(38)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.report_title, 50, 30);

        const refNoX = this.PAGE_WIDTH - 47;
        const refNoY = 150;

        this.doc.save();

        this.doc.translate(refNoX, refNoY);
        this.doc.rotate(-90, { origin: [0, 0] });

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(8)
            .fillColor(this.COLOR_BLACK)
            .opacity(0.4)
            .text(this.data.exam_ref_no, 0, 0);

        this.doc.restore();

        // --- Footer Elements ---
        const footerY = this.PAGE_HEIGHT - 90;
        this.doc.opacity(1);
        this.doc
            .font(this.FONT_SEMIBOLD)
            .fontSize(20)
            .fillColor(this.COLOR_BLACK)
            .text("Self Guidance", 30, footerY);
        const dateString = new Date(this.data.exam_start).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "long", year: "numeric" },
        );
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(16)
            .text(dateString, 30, footerY + 25);

        // --- NAME ALIGNMENT WITH SMART WRAPPING ---
        this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

        const nameWidthLimit = 300; // Half page limit
        const rawName = this.data.full_name;

        // Calculate smart string
        const nameText = this.getSmartSplitName(rawName, nameWidthLimit);

        // Define Position
        const rightMarginLimit = 35;
        const nameX = this.PAGE_WIDTH - nameWidthLimit - rightMarginLimit - 20;
        const nameBaseY = footerY + 20;

        const nameOptions = {
            width: nameWidthLimit + 20,
            align: "right" as const,
        };

        // Calculate Height for "Bottom-Up" positioning
        const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
        const singleLineHeight = this.doc.heightOfString("M", nameOptions);

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

        EMPLOYEE_TOC_CONTENT.forEach((item, index) => {
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
            currentY = this.doc.y + 10 * this.MM;
        });
    }

    /**
     * Generates Intro Pages.
     * Covers:
     * - About the report.
     * - Purpose and Benefits of Self-Discovery.
     * - Strategic Business Enhancement Paths.
     */
    private generateIntroductoryPages(): void {
        // About the Report
        this.h1("About the Origin BI Self-Discovery Report");
        this.pHtml(EMPLOYEE_CONTENT.about_report);
        this.doc.moveDown();

        // Purpose (Bulleted List)
        this.h2("Purpose of the Report");
        this.list(EMPLOYEE_CONTENT.purpose_items, { indent: 30 });
        this.doc.moveDown();

        // Why It Matters
        this.h2("Why the Origin BI Self Discovery Assessment Matters");
        this.pHtml(EMPLOYEE_CONTENT.why_matters);
        this.list(EMPLOYEE_CONTENT.why_matters_items, { indent: 30 });
        this.doc.moveDown();

        // What You Gain
        this.h2("What You Gain");
        this.p("This Report offers:", { gap: 2 });
        this.list(EMPLOYEE_CONTENT.what_you_gain, {
            indent: 30,
            type: "number",
        });
        this.pHtml(EMPLOYEE_CONTENT.about_obi_self_discovery_report);

        // --- Benefits ---
        this.h1("Benefits of Identifying Strategic Business Enhancement Paths");

        this.pHtml(EMPLOYEE_CONTENT.benefits_identifying_career_paths);
        this.pHtml(EMPLOYEE_CONTENT.benefits_identifying_career_paths_para_2);

        this.h2("Why Identifying the Right Strategic Path Matters");
        this.pHtml(EMPLOYEE_CONTENT.why_identifying_right_career_matters);
        this.pHtml(
            EMPLOYEE_CONTENT.why_identifying_right_career_matters_para_2,
        );

        // --- How This Report Helps You ---
        this.h2("How This Report Helps You");
        this.pHtml(EMPLOYEE_CONTENT.how_this_report_helps_you);
        this.list(EMPLOYEE_CONTENT.how_this_report_helps_list, { indent: 30 });
        this.pHtml(EMPLOYEE_CONTENT.how_this_report_helps_you_para_2);

        // Important Note (Boxed/Highlighted usually, but simple text for now based on PHP)
        this.h2("An Important Note");
        this.pHtml(EMPLOYEE_CONTENT.important_note);
    }

    /**
     * Generates Personalized Insights.
     * Logic:
     * - Fetches dynamic content based on the primary DISC type.
     * - Renders sections: Leadership Insights, Who I Am, Key Strengths.
     * - Includes Nature Style Graph and Communication Tips.
     * - Includes Agile Compatibility Index (ACI).
     */
    private generatePersonalizedInsights(): void {
        // most_answered_answer_type is an array of objects {ANSWER_TYPE, COUNT}
        const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
        const content = EMPLOYEE_DYNAMIC_CONTENT[primaryType];

        if (!content) {
            logger.error(
                `[EmployeeREPORT] No content found for DISC type: ${primaryType}`,
            );
            return;
        }

        // 1. Personalized Leadership Insights (Intro)
        this.h1(`Personalized Leadership Insights for ${this.data.full_name}`);
        this.pHtml(content.general_characteristics_1);

        // this.h2("Your Executive Behavioral Snapshot");
        this.pHtml(content.general_characteristics_2);

        // 2. Understanding Yourself - Who I Am
        this.h2("Understanding Yourself - Who I Am");
        this.pHtml(content.understanding_yourself_who_i_am_1);
        this.pHtml(content.understanding_yourself_who_i_am_2);

        // 3. Key Strengths
        this.h1("Your Key Strengths – How You Drive Impact");
        this.pHtml(content.key_strengths_1);
        this.h2("Your Natural Strengths");
        this.list(content.key_strengths_2);
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
        this.h1("What Drives You – Motivations and Needs for Strategic Growth");
        this.pHtml(
            content.motivations_1.replace("$full_name", this.data.full_name),
        );
        this.doc.moveDown();

        this.h3(content.what_drives.replace("$full_name", this.data.full_name));
        this.pHtml(content.motivations_desc_1);
        this.doc.moveDown();

        // Unique Needs
        this.h3("Your Unique Needs");
        this.pHtml(content.unique_needs_desc_2);

        // 5. Communication - Should
        this.h1(
            `Communication Tips for Connecting with ${this.data.full_name}`,
        );
        this.h2(`How Others Can Best Communicate With ${this.data.full_name}`);
        this.pHtml(content.communication_desc_3);

        // Do's List
        this.p(`When communicating with ${this.data.full_name}, DO's`);
        this.list(content.communication_dos, { indent: 30, type: "number" });
        this.doc.moveDown();

        // Communication - Should Not
        this.h2("What Others Should Avoid");
        this.pHtml(content.motivations_insights_2);

        // Dont's List
        this.p(`When communicating with ${this.data.full_name}, DON'T`);
        this.list(content.communication_donts, { indent: 30, type: "number" });
        this.doc.moveDown();

        // 6. Impact and Growth Areas
        this.h2("Your Potential Growth Areas");
        this.doc.lineGap(2);
        this.complexOrderedList(content.growth_areas, {
            gap: 10,
            color: this.COLOR_BLACK,
        });

        this.generateACI();

        // 7. Executive Behavioral SnapShot
        this.h1("Your Executive Behavioral Snapshot");
        this.h3("What makes you Exceptional");
        this.pHtml(content.your_personalized_behavioral_charts_1);

        // 8. Understanding Graphs
        this.h3("Understanding the Graphs");
        this.list(
            content.your_personalized_behavioral_understanding_the_graphs_list,
            {
                indent: 30,
            },
        );

        // 9. Key Insights
        this.h3("Key Insights");
        this.list(content.your_personalized_behavioral_key_insights_list, {
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

    /**
     * Generates the Nature Style Graph Section.
     * Visuals:
     * - Displays the Behavioural Charts image.
     * - Renders "Nature vs Adapted" Side-by-Side Bar Charts.
     */
    private generateNatureGraphSection(): void {
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
        }

        if (shouldAddPage) {
            this.ensureSpace(1, true); // Force new page
        }

        this.h2("Nature Style Graph", {
            align: "center",
            color: this.COLOR_DEEP_BLUE,
        });
        this.Image("assets/images/behavioural-charts.png", {
            width: this.PAGE_WIDTH - 120,
            align: "center",
        });
        this.h2("Nature and Adapted Style", {
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
    }

    /**
     * Generates Business Vision Section.
     * Logic:
     * - Identifies the Dominant Trait Combo.
     * - Maps it to Leadership Strengths and Business Vision.
     * - Renders Trait Mapping Table (Roles, Focus Areas, Stress Areas).
     * - Renders "Nature Style - Word Sketch".
     */
    private generateBusinessVisionSection(): void {
        const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
        const dominantTrait = this.data.most_answered_answer_type
            .sort((a, b) => b.COUNT - a.COUNT)
            .slice(0, 2)
            .map((trait) => trait.ANSWER_TYPE)
            .join("");

        const contentBlock =
            BLENDED_STYLE_MAPPING[
                dominantTrait as keyof typeof BLENDED_STYLE_MAPPING
            ];
        if (!contentBlock) return;

        this.h1(
            "Aligning Your Leadership Strengths with Future Business Vision",
        );
        this.h2(contentBlock.style_name);
        this.pHtml(contentBlock.style_desc);

        this.h3("Key Behaviours");
        this.list(contentBlock.key_behaviours, { indent: 30, type: "number" });
        this.doc.moveDown();

        this.h3("Typical Scenarios");
        this.list(contentBlock.typical_scenarios, {
            indent: 30,
            type: "number",
        });

        this.h2("Trait Mapping");

        const headers = [
            "Trait Combination",
            "Role Suggestions",
            "Recommended Focus Areas",
            "Stress Areas",
            "Recommendations for Outsourcing",
        ];
        const tableWidth =
            this.PAGE_WIDTH -
            2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM);

        this.table(headers, contentBlock.trait_combinations, {
            fontSize: 8,
            headerFontSize: 8,
            colWidths: ["fit", "fill", "fill", "fill", "fill"],
        });
        this.generateRespondParameterTable(primaryType);
        this.doc.moveDown();
        this.h2("Naure Style - Word Sketch");
        this.pHtml(EMPLOYEE_CONTENT.natural_style_work_sketch_desc);
        this.pHtml(EMPLOYEE_CONTENT.natural_style_work_sketch_desc_1);
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

    /**
     * Generates the Word Sketch Table.
     * Visuals:
     * - A detailed table mapping various intensity levels (1-6) of DISC traits.
     * - Highlights the user's specific level for each trait (D, I, S, C).
     */
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

    /**
     * Generates the Respond Parameter Table.
     * Displays behavioral responses for specific areas:
     * - Conflict Management
     * - Change Management
     * - Team Dynamics
     * - Communication, etc.
     *
     * @param dominantType - The user's primary DISC trait.
     */
    private generateRespondParameterTable(
        dominantType: "D" | "I" | "S" | "C",
    ): void {
        const contentBlock = EMPLOYEE_DYNAMIC_CONTENT[dominantType];
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
}
