import fs from "fs";
import { COLORS, CollegeData } from "../../types/types";
import {
    BaseReport,
    FutureOutlookData,
    FutureOutlookOptions,
} from "../BaseReport";
import {
    COLLEGE_TOC_CONTENT,
    CONTENT,
    MAPPING,
    blendedTraits,
} from "./collegeConstants";
import {
    getCareerGuidanceByTrait,
    CareerRoleData,
} from "../../helpers/sqlHelper";
import { ACI, ACI_SCORE, DISCLAIMER } from "../BaseConstants";

import { scale } from "pdfkit";
import { logger } from "../../helpers/logger";

export class CollegeReport extends BaseReport {
    private data: CollegeData;

    constructor(data: CollegeData, options?: PDFKit.PDFDocumentOptions) {
        super(options);
        this.data = data;
    }

    /**
     * Main Generation Method
     * ----------------------
     * Orchestrates the creation of the College Report PDF.
     * Flow:
     * 1. Cover Page
     * 2. Table of Contents
     * 3. Core Report Pages (About, Insights, Graphs)
     * 4. Career Guidance & Roadmap (Content 3)
     * 5. Footers
     */
    public async generate(outputPath: string): Promise<void> {
        logger.info("[CollegeREPORT] Starting PDF Generation...");
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        const streamFinished = new Promise<void>((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        // 1. Cover Page
        this.generateCoverPage();
        logger.info("[CollegeREPORT] Cover Page Generated.");

        // 2. Table of Contents
        this._currentBackground = "assets/images/Content_Background.jpg";
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();
        logger.info("[CollegeREPORT] TOC Generated.");

        // 3. Reports
        this._currentBackground = "assets/images/Watermark_Background.jpg";
        this._useStdMargins = true;

        this.doc.addPage();
        this.generateAboutReportPage();

        this.doc.addPage();
        this.generateContent1();

        this.doc.addPage();
        this.generateContent2();

        // --- Fetch Dynamic Career Data ---
        const [t1, t2] = this.getTopTwoTraits();
        const traitKey = t1 + t2;

        let careerDataList: CareerRoleData[] = [];
        try {
            const deptId = this.data.department_deg_id;
            logger.info(
                `[CollegeREPORT] Fetching career guidance for trait: ${traitKey} & Dept ID: ${deptId}`,
            );
            careerDataList = await getCareerGuidanceByTrait(traitKey, deptId);
            logger.info(
                `[CollegeREPORT] Received ${careerDataList.length} career roles from DB.`,
            );
        } catch (error) {
            logger.error(
                "[CollegeREPORT] Failed to fetch career guidance data:",
                error,
            );
        }
        this.generateContent3(careerDataList);

        this.addFooters(this.data.exam_ref_no);

        this.doc.end();

        await streamFinished;
        logger.info(
            `[CollegeREPORT] PDF generated successfully at: ${outputPath}`,
        );
    }

    private generateRespondParameterTable(
        dominantType: "D" | "I" | "S" | "C",
    ): void {
        const contentBlock = CONTENT[dominantType];
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
        this.ensureSpace(0.2, true);
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

    /**
     * Generates the Cover Page.
     * Features:
     * - Full bleed background image.
     * - Rotated "Exam Ref No" on the side.
     * - "Self Guidance" label and Date in the footer.
     * - Smart Name Splitting to ensure names fit aesthetically.
     */
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

    /**
     * Generates the Table of Contents.
     * Logic:
     * - Iterates through `COLLEGE_TOC_CONTENT`.
     * - Checks for page overflow and adds new pages if needed (re-printing header).
     * - Draws connection circles and lines for each item.
     */
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
        if (
            COLLEGE_TOC_CONTENT.length > 10 &&
            COLLEGE_TOC_CONTENT.length < 13
        ) {
            tocItemsGap = 8;
        } else if (COLLEGE_TOC_CONTENT.length >= 13) {
            tocItemsGap = 10;
        }

        COLLEGE_TOC_CONTENT.forEach((item, index) => {
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

    private generateAboutReportPage(): void {
        this.h1(COLLEGE_TOC_CONTENT[0]);
        this.pHtml(CONTENT.about_report);
        this.doc.moveDown(0.5);
        this.h2("Purpose of the Assessment");
        this.list(CONTENT.purpose_items, { indent: 30 });
        this.doc.moveDown(0.5);
        this.h2("Why the Origin BI Self Discovery Assessment Matters");
        this.p(CONTENT.why_matters);
        this.list(CONTENT.why_matters_items, { indent: 30 });
        this.doc.moveDown(0.5);
        this.h2("What You Gain");
        this.p("This Report offers:", { gap: 2 });
        this.list(CONTENT.what_you_gain, { type: "number", indent: 30 });
        this.pHtml(CONTENT.about_obi_self_discovery_report);
    }

    private generateContent1(): void {
        const dominantType = this.getTopTwoTraits()[0] as "D" | "I" | "S" | "C";
        const contentBlock = CONTENT[dominantType];
        this.doc.lineGap(2);
        this.h1(COLLEGE_TOC_CONTENT[1]);
        this.pHtml(CONTENT.benefits_identifying_suitable_career_paths);
        this.pHtml(CONTENT.benefits_identifying_suitable_career_paths_para_2);
        this.h2("Why Identifying the Right Career Matters");
        this.pHtml(CONTENT.why_identifying_right_career);
        this.pHtml(CONTENT.why_identifying_right_career_para_2);
        this.h2("How This Report Helps You");
        this.pHtml(CONTENT.how_this_report_helps_you);
        this.h2("An Important Note");
        this.pHtml(CONTENT.important_note);
        this.list(CONTENT.how_this_report_helps_list, { indent: 50 });
        this.pHtml(CONTENT.how_this_report_helps_you_para_2);
        this.h1(`Personalised Insights for ${this.data.full_name}`);
        this.pHtml(contentBlock.general_characteristics_for_student_1);
        this.pHtml(contentBlock.general_characteristics_for_student_2);
        this.h2("Understanding Yourself - Who I Am");
        this.pHtml(contentBlock.understanding_yourself_who_i_am_1);
        this.pHtml(contentBlock.understanding_yourself_who_i_am_2);
        this.h1(`Your Key Strengths – How You Stand Out`);
        this.pHtml(
            contentBlock.your_strength_what_you_bring_to_the_organization_1,
        );
        this.h2("Your Natural Strengths");
        this.list(
            contentBlock.your_strength_what_you_bring_to_the_organization_2,
            { indent: 30 },
        );
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
        this.h1(`What Drives You – Motivations and Needs for Growth`);
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_1.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.h3(
            contentBlock.motivations_and_need_your_personalized_insights_what_drives.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_desc_1,
        );
        this.h3("Your Unique Needs");
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_desc_2,
        );
        this.h2(
            contentBlock.motivations_and_need_your_personalized_insights_communication_tips.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.h3(
            contentBlock.motivations_and_need_your_personalized_insights_communication_with_others.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_desc_3,
        );
        this.ensureSpace(0.1, true);
        this.pHtml(
            contentBlock.when_communicating_with_student_dos_title.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.list(contentBlock.when_communicating_with_student_dos, {
            indent: 30,
            type: "number",
        });
        this.h3(
            contentBlock.motivations_and_need_your_personalized_what_others_should_avoid,
        );
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_2,
        );
        this.ensureSpace(0.1, true);
        this.pHtml(
            contentBlock.motivations_and_need_your_personalized_insights_3.replace(
                "$full_name",
                this.data.full_name,
            ),
        );
        this.list(contentBlock.when_communicating_with_student_dont, {
            indent: 30,
            type: "number",
        });

        this.h2("Your Potential Growth Areas");
        this.complexOrderedList(
            contentBlock.motivations_and_need_your_personalized_insights_4,
            {
                gap: 10,
                color: this.COLOR_BLACK,
                itemGap: 5,
                itemEnsureSpace: 0.02,
                itemEnsureSpacePercent: true,
                nestedIndent: 30,
            },
        );
        this.generateACI();
        this.h1("Your Personalized Behavioural Snapshot");
        this.h3("What Makes You Exceptional");
        this.pHtml(contentBlock.your_personalized_behavioral_charts_1);
        this.h3(
            contentBlock.your_personalized_behavioral_understanding_the_graphs,
        );
        this.list(
            contentBlock.your_personalized_behavioral_understanding_the_graphs_list,
            { indent: 30 },
        );
        this.h3(contentBlock.your_personalized_behavioral_key_insights);
        this.list(contentBlock.your_personalized_behavioral_key_insights_list, {
            indent: 30,
        });

        // --- Logic for Nature and Adapted Style Graph ---
        // Determines if the graph should fit on the current page or move to a new one.
        // It calculates available space and applies scaling or page breaks accordingly.
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

    private generateContent2(): void {
        const dominantType = this.getTopTwoTraits()[0] as "D" | "I" | "S" | "C";
        const dominantTrait = this.getTopTwoTraits().join("");
        const contentBlock = blendedTraits[dominantTrait];

        this.h1("Applying Self-Discovery to Your Academic and Career Choices");
        this.h2("You are " + blendedTraits[dominantTrait].name);
        this.pHtml(
            "<b>Description:</b>" + blendedTraits[dominantTrait].description,
        );
        this.h3("Key Behaviours:");
        this.list(blendedTraits[dominantTrait].key_behaviours, {
            indent: 30,
            type: "number",
        });
        this.h3("Typical Scenarios:");
        this.list(blendedTraits[dominantTrait].typical_scenarios, {
            indent: 30,
            type: "number",
        });
        this.h3("Trait Mapping:");
        const headers = [
            "Trait Combination",
            "Role Suggestions",
            "Stress Areas",
            "Recommended Focus Areas",
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
        this.generateRespondParameterTable(dominantType);
    }

    private generateACI(): void {
        const dominantType = this.getTopTwoTraits()[0] as "D" | "I" | "S" | "C";
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
            rowAlign: ["left", "center", "left"],
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

        this.ensureSpace(0.01, true);
        this.h2("Score Overview");

        this.table(aciScoreHeaders, aciScoreRows, {
            colWidths: ["fit", "fill"],
            rowColor: "transparent",
        });

        this.ensureSpace(0.01, true);
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

        this.h2("Reflection Summary");
        this.pHtml(contentBlock.reflection_summary);
    }

    /**
     * Generates Content 3: Alternating Roadmap and Detailed Guidance.
     * Flow: Suggestion 1 Header -> Roadmap 1 -> Explanation 1 -> Suggestion 2...
     */
    /**
     * Generates Content 3: Career Guidance & Roadmap.
     * Details:
     * - Uses data from `getCareerGuidanceByTrait`.
     * - Alternate layout for Roadmap blocks.
     * - Color-coded based on the primary/secondary trait of the role.
     */
    private generateContent3(careerDataList: CareerRoleData[]): void {
        this._useStdMargins = true;
        this.h1("Career Guidance & Roadmap");
        this.doc.moveDown(0.5);

        if (!careerDataList || careerDataList.length === 0) {
            this.p(
                "Additional career guidance data could not be retrieved at this time.",
            );
            return;
        }

        // --- DISC COLORS SETUP ---
        const DISC_COLORS: { [key: string]: string } = {
            D: "#D82A29", // Red
            I: "#FEDD10", // Yellow
            C: "#01AADB", // Blue
            S: "#4FB965", // Green
        };

        const DISC_TEXT_COLORS: { [key: string]: string } = {
            D: "#FFFFFF",
            I: "#000000",
            C: "#FFFFFF",
            S: "#FFFFFF",
        };

        // --- LOGIC UPDATE: Ensure Traits are Sorted Descending ---
        // We fetch the top two traits.
        // Index 0 = Primary (Highest)
        // Index 1 = Secondary (Second Highest)
        const dominantTraits = this.getTopTwoTraits();

        // Iterate through EACH Suggestion (Max 3)
        careerDataList.slice(0, 3).forEach((role, index) => {
            console.log(
                `[REPORT] Generating Roadmap & Details for Role ${index + 1}: "${role.roleName}"`,
            );

            // Calculate Color Logic:
            // Role 1 (index 0) -> Uses Primary Trait Color
            // Role 2 (index 1) -> Uses Secondary Trait Color
            // Role 3 (index 2) -> Uses Primary Trait Color
            const traitKey = dominantTraits[index % 2];

            const bgColor = DISC_COLORS[traitKey] || "#150089";
            const txtColor = DISC_TEXT_COLORS[traitKey] || "#FFFFFF";

            // 1. Roadmap Diagram
            const milestones = role.tools.map((toolName, tIndex) => ({
                name: toolName,
                category: "Skill/Tool",
                isAbove: tIndex % 2 === 0,
            }));

            const singleRoadmapBlock = [
                {
                    label: `Suggestion ${index + 1}`,
                    roleName: role.roleName,
                    color: bgColor,
                    textColor: txtColor,
                    milestones: milestones,
                },
            ];

            this.drawHorizontalRoadmap(singleRoadmapBlock, {
                blockGap: 20 * this.MM,
                circleRadius: 20 * this.MM,
                showLegend: false,
            });

            // 2. Guidance Sections
            if (role.guidanceSections && Array.isArray(role.guidanceSections)) {
                role.guidanceSections.forEach((section: any) => {
                    if (section.title) {
                        this.ensureSpace(0.15, true);
                        this.h2(section.title);
                    }

                    if (typeof section.content === "string") {
                        this.p(section.content);
                    } else if (Array.isArray(section.content)) {
                        section.content.forEach((item: any) => {
                            this.ensureSpace(50);

                            if (item.subtitle && item.text) {
                                this.list(
                                    [`<b>${item.subtitle} :</b> ${item.text}`],
                                    { indent: 20, gap: 0 },
                                );
                            } else {
                                if (item.subtitle) this.h3(item.subtitle);
                                if (item.text)
                                    this.list([item.text], {
                                        indent: 20,
                                        gap: 0,
                                    });
                            }

                            if (
                                item.bullets &&
                                Array.isArray(item.bullets) &&
                                item.bullets.length > 0
                            ) {
                                this.list(item.bullets, { indent: 20 });
                            }
                        });
                        this.doc.moveDown(0.5);
                    }
                });
            }

            // Render Centered Footer Line
            this.renderCenteredLineText(
                "These results were generated using AI and may vary by person",
            );
        });

        // --- Remaining Static Content ---
        this.h2("Nature Style - Word Sketch");
        this.p(CONTENT.word_sketch_1);
        this.doc.moveDown(0.5);
        this.p(CONTENT.word_sketch_2);
        this.doc.moveDown(0.5);
        this.p(CONTENT.word_sketch_3);
        this.generateWordSketch();

        this.h1("Disclaimer");
        this.p(CONTENT.disclaimer);
        this.h3("Limitations of the Assessment");
        this.list(CONTENT.limitations, { indent: 30, gap: 0 });
        this.doc.moveDown(1);
        this.h3("No Warranties or Liabilities");
        this.p(CONTENT.warranties_1);
        this.p(CONTENT.warranties_2);
        this.list(CONTENT.warranty_list, { indent: 30, gap: 0 });
        this.doc.moveDown(1);
        this.h3("Indemnity");
        this.p(CONTENT.indemnity_desc_1);
        this.p(CONTENT.indemnity_desc_2);
        this.list(CONTENT.indemnity_list, { indent: 30, gap: 0 });
        this.doc.moveDown(1);
        this.h3("No Liability for Damages");
        this.p(CONTENT.damages_desc_1);
        this.p(CONTENT.damages_desc_2);
    }

    /**
     * Generates the "Natural Style - Word Sketch" table.
     * Can be called independently to render the table at the current position.
    /**
     * Generates the "Natural Style - Word Sketch" table.
     * This table visualizes the intensity of each trait (D, I, S, C) based on scores.
     * It highlights the specific "Level" (1-6) for each trait using a color map.
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
        this.ensureSpace(270);

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

    private renderTipBox(text: string): void {
        const startX = this.doc.x;
        const startY = this.doc.y;
        const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        this.doc.font(this.FONT_REGULAR).fontSize(10);
        const textHeight = this.doc.heightOfString(text, { width: width - 20 });
        const boxHeight = textHeight + 20;
        this.doc.save();
        this.doc
            .rect(startX, startY, width, boxHeight)
            .fillColor("#F0F8FF")
            .fill();
        this.doc
            .rect(startX, startY, width, boxHeight)
            .lineWidth(0.5)
            .strokeColor("#4682B4")
            .stroke();
        this.doc.fillColor("#000000").text(text, startX + 10, startY + 10, {
            width: width - 20,
            align: "justify",
        });
        this.doc.restore();
        this.doc.y = startY + boxHeight + 10;
    }

    private generateFutureTechPage(): void {
        this.doc.addPage();
        this._useStdMargins = true;
        const margin = 15 * this.MM;
        const rightMarginLimit = this.PAGE_WIDTH - margin;

        // --- Header Section ---
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(36)
            .fillColor("black")
            .text("Tech Areas That Will", margin, margin);
        this.doc.text("Matter in ", margin, this.doc.y, { continued: true });
        this.doc.fillColor(this.COLOR_DEEP_BLUE).text("2027 - 2035");

        // --- Shared Y-Axis for Header and Legend ---
        const rowY = this.doc.y + 10 * this.MM;

        // Measure Header Height (Size 20)
        this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(20);
        const headerText = "Emerging Technologies";
        const headerHeight = this.doc.heightOfString(headerText, {
            width: 400,
        });

        // Visual Center of the Header Line
        const headerVisualCenterY = rowY + headerHeight / 2 + 1.5;

        // 1. Render "Emerging Technologies" (Left Aligned)
        this.doc.fillColor(this.COLOR_DEEP_BLUE).text(headerText, margin, rowY);

        // --- 2. Render Legend (Right Aligned to Margin) ---
        const legendTextSize = 9;
        this.doc.font(this.FONT_SORA_REGULAR).fontSize(legendTextSize);

        const text2035 = "2035";
        const legendTextHeight = this.doc.heightOfString(text2035);

        // Align Legend vertically
        const legendY = headerVisualCenterY - legendTextHeight / 2;
        const circleY = headerVisualCenterY; // Nudge arrow down +1pt

        const text2035Width = this.doc.widthOfString(text2035);

        // Calculate X positions (Backwards from Right Margin)
        const x2035 = rightMarginLimit - text2035Width;
        const circleX = x2035 - 20 * this.MM;
        const legendX = circleX - 16 * this.MM;

        this.doc.save();
        this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(legendTextSize)
            .fillColor("black")
            .text("2027", legendX, legendY, { lineBreak: false });

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
        this.doc.fillColor("black").text(text2035, x2035, legendY, {
            lineBreak: false,
        });
        this.doc.restore();

        // --- Chart Section ---
        const [t1, t2] = this.getTopTwoTraits();
        const skills = MAPPING[t1 + t2];
        const years = [25, 27, 29, 31, 33, 35];
        const boxWidth = 15.5 * this.MM;

        const startBarY = rowY + 20 * this.MM;

        this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

        // --- FIX: Full Width Layout Calculation ---

        // 1. Anchor Chart Bars to the RIGHT Margin
        const totalChartWidth = years.length * boxWidth;
        const barStartX = rightMarginLimit - totalChartWidth;

        // 2. Anchor Labels to the LEFT Margin
        // The text area spans from 'margin' up to 'barStartX' (minus a gap)
        const labelGap = 8 * this.MM;
        const labelStartX = margin;
        const availableLabelWidth = barStartX - labelStartX - labelGap;

        // Render Rows
        skills.forEach((row, index) => {
            const barY = startBarY + index * 10 * this.MM;
            const barCenterY = barY + 2.5 * this.MM;

            // --- Text Rendering ---
            const labelOptions = {
                width: availableLabelWidth, // Use all available space
                align: "right" as const, // Right align against the bars
            };

            this.doc.font(this.FONT_SORA_REGULAR).fontSize(12);

            // Calculate vertical center
            const labelHeight = this.doc.heightOfString(
                row.label,
                labelOptions,
            );
            const centeredLabelY = barCenterY - labelHeight / 2 - 2;

            this.doc
                .fillColor("black")
                .text(row.label, labelStartX, centeredLabelY, labelOptions);

            this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

            // --- Chart Rendering ---

            // Draw Years Grid
            years.forEach((year, i) => {
                const bx = barStartX + i * boxWidth;
                this.doc
                    .rect(bx, barY, boxWidth, 5 * this.MM)
                    .fillColor("#E8E8E8")
                    .fill();

                // Year Labels
                if (index === 0)
                    this.doc
                        .fillColor("black")
                        .text(year.toString(), bx, barY - 15, {
                            width: boxWidth,
                            align: "center",
                        });

                // Separators
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

    /**
     * Helper: Identifies the Top Two Traits (Primary and Secondary).
     * Logic:
     * 1. Sorts traits by Value (Descending).
     * 2. Tie-breaker: Uses fixed Priority (C > D > I > S).
     */
    private getTopTwoTraits(): [string, string] {
        let scores: { type: string; val: number }[] = [];

        if (
            this.data.most_answered_answer_type &&
            this.data.most_answered_answer_type.length >= 4
        ) {
            scores = this.data.most_answered_answer_type.map((item) => ({
                type: item.ANSWER_TYPE,
                val: item.COUNT,
            }));
        } else {
            scores = [
                { type: "D", val: this.data.score_D },
                { type: "I", val: this.data.score_I },
                { type: "S", val: this.data.score_S },
                { type: "C", val: this.data.score_C },
            ];
        }

        const PRIORITY = ["C", "D", "I", "S"];
        scores.sort((a, b) => {
            const diff = b.val - a.val; // Primary: Value Descending
            if (diff !== 0) return diff;

            // Secondary: Priority Index Ascending (Low index = High Priority)
            const pA = PRIORITY.indexOf(a.type);
            const pB = PRIORITY.indexOf(b.type);
            return pA - pB;
        });

        // Debug Log to verify sorting
        // console.log("Sorted Traits:", scores);

        return [scores[0].type, scores[1].type];
    }
}
