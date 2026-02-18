// reports/placement/placementReport.ts

import fs from "fs";
import { BaseReport } from "../BaseReport";
import { Student, PlacementData, TraitGroup } from "../../types/placementTypes";
import {
    PLACEMENT_CONTENT,
    ACI_CONFIG,
    DISC_COLORS,
    DISC_TEXT_COLORS,
    ORDERED_STYLES,
    TABLE_STYLES,
} from "./placementConstants";
import {
    getCareerGuidanceByTrait,
    CareerRoleData,
} from "../../helpers/sqlHelper";
import { logger } from "../../helpers/logger";
import { height } from "pdfkit/js/page";

/**
 * PlacementReport Class
 * ---------------------
 * Generates the Placement Handbook PDF.
 * This report uses a department-level aggregation of student data to provide:
 * - Executive Summaries (Radar Charts, Personality Grids)
 * - Detailed Trait Sections (Profiles, Student Lists, Career Roadmaps)
 */
export class PlacementReport extends BaseReport {
    private data: PlacementData;

    constructor(data: PlacementData) {
        super();
        this.data = data;
        this.data.exam_ref_no = this.data.exam_ref_no.replace(
            "COLLEGE_STUDENT",
            "CS",
        );
    }

    /**
     * Main Generation Method
     * ----------------------
     * Orchestrates the creation of the Placement Report PDF.
     * Flow:
     * 1. Cover Page
     * 2. Table of Contents
     * 3. Executive Summary (Aggregated Status)
     * 4. Trait Specific Sections (Loop through each active trait)
     * 5. Closing Pages (Testimonials, Disclaimer)
     */
    public async generate(outputPath: string): Promise<void> {
        logger.info("[PLACEMENT REPORT] Starting Generation...");
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        const streamFinished = new Promise<void>((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        // 1. Cover Page
        this.generateCoverPage();
        logger.info("[PLACEMENT REPORT] Cover Page Generated.");

        // 2. Table of Contents
        this._currentBackground = "assets/images/Content_Background.jpg";
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();
        logger.info("[PLACEMENT REPORT] Table of Contents Generated.");

        // 3. Executive Summary
        this._currentBackground = "assets/images/Watermark_Background.jpg";
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateExecutiveSummary();

        // // 4. Trait Specific Sections (The core loop)
        const department_degree_id = this.data.department_deg_id;
        let careerDataList: CareerRoleData[] = [];

        // Loop happens HERE
        for (const trait of this.data.trait_distribution) {
            if (trait.student_count > 0) {
                careerDataList = await getCareerGuidanceByTrait(
                    trait.trait_code,
                    department_degree_id,
                );

                // FIX: Pass the specific 'trait' instance here
                this.generateTraitSection(trait, careerDataList);
            }
        }

        // // 5. Testimonials & Info
        this.generateClosingPages();

        this.addFooters(this.data.exam_ref_no);

        this.doc.end();

        await streamFinished;
        logger.info("[PLACEMENT REPORT] PDF Generated.");
    }

    // --- Section 1: Cover Page ---
    private generateCoverPage(): void {
        const bgPath = "assets/images/Handbook_Cover_Default.jpg";
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
            .text(this.data.report_title || "Students Handbook", 35, 30, {
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
            .text("Placement Guidance", 35, footerY);

        // Draw Date
        const dateString = new Date(
            this.data.exam_start_date,
        ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(16)
            .text(dateString, 35, footerY + 25);

        // --- FIX 2: Name Alignment with Smart Wrapping ---

        // 1. Set font first so width calculations are accurate
        this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

        const nameWidthLimit = 300; // Half page limit
        const rawName = this.data.degree_type + " " + this.data.department_name;

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

    // --- Section 2: Table of Contents ---
    private generateTableOfContents(): void {
        const headerX = 15 * this.MM;
        const circleCenterX = 25 * this.MM;

        // Define the bottom limit (Page Height - Footer Margin)
        const bottomLimit = this.PAGE_HEIGHT - 30 * this.MM;

        // 1. Print Header on the first page
        this.h1("Table of Contents", { x: headerX, y: headerX, fontSize: 38 });

        // Set the starting Y position for the first item
        let currentY = 45 * this.MM;
        let tocItemsGap = 9;

        const validTraits = this.data.trait_distribution.filter(
            (t) => t.student_count > 0,
        );
        const tocItems = [
            "Executive Summary",
            ...validTraits.map((t) => t.blended_style_name),
        ];

        tocItems.forEach((item, index) => {
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

            const contentText = item;
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

    // --- Section 3: Executive Summary ---
    /**
     * Generates the Executive Summary.
     * Includes:
     * - High-level text summary of the batch.
     * - Radar Chart visualizing the distribution of 12 blended styles.
     * - Personality Grid showing counts per style in a colored matrix.
     */
    private generateExecutiveSummary(): void {
        this.h1(PLACEMENT_CONTENT.executive_summary_title);

        const summary = PLACEMENT_CONTENT.executive_summary_text(
            this.data.total_students,
        );
        this.pHtml(summary, { fontSize: 12, font: this.FONT_REGULAR });
        this.doc.moveDown(6);

        // 1. Define the master list of blended styles in the correct order (ID 1-12)
        // This ensures the radar chart always shows all axes in the same order
        // 1. Define the master list of blended styles in the correct order (ID 1-12)
        // This ensures the radar chart always shows all axes in the same order
        const orderedStyles = ORDERED_STYLES;

        const chartData = orderedStyles.reduce(
            (acc, styleName) => {
                const trait = this.data.trait_distribution.find(
                    (t) => t.blended_style_name === styleName,
                );
                acc[styleName] = trait ? trait.student_count : 0;
                return acc;
            },
            {} as Record<string, number>,
        );

        console.log("Radar Chart Data:", chartData);

        // 2. Pass the dynamic data to the chart
        this.drawRadarChart(chartData, {
            radius: 140, // Size
            maxValue: Math.max(...Object.values(chartData)) + 5,
        });

        this.doc.moveDown(2);

        this.pHtml(PLACEMENT_CONTENT.chart_description, {
            fontSize: 8,
            color: "#58595b",
            align: "center",
            font: this.FONT_ITALIC,
        });

        this.doc.moveDown(2);

        this.drawPersonalityGrid();

        this.h2("Agile Compatibility Index Distribution");
        const aciDistHeader = [
            "ACI Level",
            "ACI Score",
            "Number of Students",
            "Placement Strategy",
        ];

        // Calculate counts based on ACI_CONFIG logic
        const counts = ACI_CONFIG.map((config) => {
            let count = 0;
            this.data.trait_distribution.forEach((group) => {
                group.students_data.forEach((student) => {
                    const total = student.agile_score?.total ?? 0;
                    // Logic: count if total >= minScore AND total < prevConfig.minScore (if exists)
                    // But here we can just use the config order since it flows 100 -> 75 -> 50 -> 0
                    // A simple way is to use the specific ranges or just simpler logic:
                    // We need to be careful not to double count.
                    // Let's implement a specific check matching the config's intent.
                    if (
                        total >= config.minScore &&
                        (config === ACI_CONFIG[0] ||
                            total <
                                ACI_CONFIG[ACI_CONFIG.indexOf(config) - 1]
                                    .minScore)
                    ) {
                        count++;
                    }
                });
            });
            return count;
        });

        // Simplified logic above might be tricky with "0" case if not ordered carefully.
        // Let's stick closer to the original logic which was hierarchical:
        // A (>100), B (>75), C (>50), D (>0)
        // But wait, the original logic was if/else if.
        // Let's redo the counts calculation safely.

        const calculatedCounts = this.calculateAgileCounters();

        const tableData = ACI_CONFIG.map((config, index) => {
            return [
                config.level,
                config.rangeLabel,
                calculatedCounts[index],
                config.strategy,
            ];
        });

        this.table(aciDistHeader, tableData, {
            headerFontSize: 8,
            fontSize: 9,
            headerHeight: 20,
            rowAlign: ["left", "center", "center", "left"],
            verticalAlign: "middle",
            colWidths: ["fit", "fit", "fit", "fill"],
            headerFont: this.FONT_BOLD,
            font: this.FONT_SEMIBOLD,
            headerTextColor: TABLE_STYLES.headerTextColor,
            borderColor: TABLE_STYLES.borderColor,
            headerColor: TABLE_STYLES.headerColor,
            rowColor: TABLE_STYLES.rowColor,
            rowTextColor: TABLE_STYLES.rowTextColor,
            alternateRowColor: TABLE_STYLES.alternateRowColor,
        });

        // --- Corporate Readiness Summary Table ---
        this.doc.moveDown(1);
        this.h2("Corporate Readiness Summary");

        // Calculate total for Percentage (Naturalist + Adaptive + Learner ONLY)
        // Assumption: The last item in ACI_CONFIG is "Resistant" (or lowest level) which might be excluded
        // based on original logic: counts[0] + counts[1] + counts[2] (excluding last)
        const totalRelevant =
            calculatedCounts.reduce((a, b) => a + b, 0) -
            calculatedCounts[calculatedCounts.length - 1];

        const getPercent = (count: number) => {
            if (totalRelevant === 0) return "0%";
            return Math.round((count / totalRelevant) * 100) + "%";
        };

        const readinessRows = ACI_CONFIG.slice(0, 3).map((config, index) => {
            return {
                type: "row" as const,
                data: [
                    config.readiness!, // Use non-null assertion as these should exist for top 3
                    getPercent(calculatedCounts[index]),
                    config.readinessAction!,
                ],
                fill: config.color,
            };
        });

        this.table(
            [
                // "Status Indicator",
                "Corporate Readiness Category",
                "Percentage",
                "Action Priority",
            ],
            readinessRows,
            {
                headerFontSize: 8,
                fontSize: 9,
                headerHeight: 20,
                rowHeight: 25,
                verticalAlign: "middle",
                headerFont: this.FONT_BOLD,
                font: this.FONT_SEMIBOLD,
                headerTextColor: TABLE_STYLES.headerTextColor,
                borderColor: TABLE_STYLES.borderColor,
                headerColor: TABLE_STYLES.headerColor,
                // Use specific colWidths to ensure text fits
                colWidths: ["fill", "fit", "fill"],
                headerAlign: ["left", "center", "left"],
                rowAlign: ["left", "center", "left"],
            },
        );
    }

    // --- Section 4: Trait Details ---
    /**
     * Generates a Detailed Section for a specific Trait.
     * Logic:
     * - Renders Trait Description.
     * - Lists all students belonging to this trait.
     * - Generates specific Career Roadmaps for this trait.
     *
     * @param trait - The trait data object (includes student lists and codes).
     * @param careerDataList - The fetched career guidance data for this trait.
     */
    private generateTraitSection(
        trait: any,
        careerDataList: CareerRoleData[],
    ): void {
        // this.doc.addPage(); // Ensure every trait starts on a fresh page
        this.h1(trait.blended_style_name);
        this.p(trait.blended_style_desc);

        // 2. Student List Table
        this.h2("Students List");

        this.table(
            [
                "S.No",
                "Student Detail",
                "ACI Score",
                "ACI Level",
                "Corporate Readiness",
                "Company Tier",
            ],
            trait.students_data
                .sort((a: any, b: any) => {
                    const scoreA = a.agile_score?.total || 0;
                    const scoreB = b.agile_score?.total || 0;
                    return scoreB - scoreA;
                })
                .map((student: any, index: number) =>
                    this.processStudentRow(student, index),
                ),
            {
                headerFontSize: 8,
                fontSize: 9,
                headerHeight: 20,
                headerAlign: [
                    "center",
                    "center",
                    "center",
                    "center",
                    "center",
                    "center",
                ],
                rowHeight: 27,
                rowAlign: ["center", "left", "center", "left", "left", "left"],
                headerFont: this.FONT_BOLD,
                headerTextColor: TABLE_STYLES.headerTextColor,
                font: this.FONT_SEMIBOLD,
                colWidths: ["fit", "fill", "fit", "fit", "fit", "fit"],
                borderColor: TABLE_STYLES.borderColor,
                headerColor: TABLE_STYLES.headerColor,
                rowColor: TABLE_STYLES.rowColor,
                rowTextColor: TABLE_STYLES.rowTextColor,
                alternateRowColor: TABLE_STYLES.alternateRowColor,
                verticalAlign: "middle",
                mergeRepeatedHeaders: true,
            },
        );

        // 3. Career Roadmap
        this.h1(`Career Roadmap for ${trait.blended_style_name}`, {
            ensureSpace: 0.4,
        });

        if (!careerDataList || careerDataList.length === 0) {
            this.p(
                "Additional career guidance data could not be retrieved at this time.",
            );
            return;
        }

        careerDataList.slice(0, 4).forEach((role, index) => {
            logger.info(
                `[PLACEMENT REPORT] Generated Section for Trait: ${trait.trait_code} (${trait.student_count} students)`,
            );

            // Calculate Color Logic
            const traitKey = trait.trait_code[index % 2]; // Uses the passed trait code

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
                        this.h2(section.title, {
                            fontSize: 14,
                            color: "#292984",
                        });
                    }

                    if (typeof section.content === "string") {
                        this.p(section.content);
                    } else if (Array.isArray(section.content)) {
                        section.content.forEach((item: any) => {
                            this.ensureSpace(50);

                            if (item.subtitle && item.text) {
                                this.list(
                                    [`<b>${item.subtitle} :</b> ${item.text}`],
                                    { indent: 30, gap: 5 },
                                );
                            } else {
                                if (item.subtitle) this.h3(item.subtitle);
                                if (item.text)
                                    this.list([item.text], {
                                        indent: 30,
                                        gap: 5,
                                    });
                            }

                            if (
                                item.bullets &&
                                Array.isArray(item.bullets) &&
                                item.bullets.length > 0
                            ) {
                                this.list(item.bullets, {
                                    indent: 30,
                                    gap: 5,
                                });
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
    }

    // --- Section 5: Closing Pages ---
    private generateClosingPages(): void {
        // Testimonials
        this.h1("1. Testimonials");
        PLACEMENT_CONTENT.testimonials.forEach((t) => {
            this.pHtml(`"${t.text}"`, {
                fontSize: 12,
                font: this.FONT_ITALIC,
            });
            this.pHtml(t.author, {
                fontSize: 12,
                font: this.FONT_REGULAR,
            });
        });

        // About
        this.h1(PLACEMENT_CONTENT.about.title);
        this.pHtml(PLACEMENT_CONTENT.about.text);

        // Disclaimer
        this.h1(PLACEMENT_CONTENT.disclaimer.title);
        this.pHtml(PLACEMENT_CONTENT.disclaimer.text1);
        this.pHtml(PLACEMENT_CONTENT.disclaimer.text2);

        // Services
        this.h1(PLACEMENT_CONTENT.services.title);
        PLACEMENT_CONTENT.services.bullets.forEach((b) => {
            this.pHtml(`• ${b}`, { indent: 10 });
        });

        // Contact
        this.h1(PLACEMENT_CONTENT.contact.title);
        this.p(PLACEMENT_CONTENT.contact.intro, { align: "left" });
        this.pHtml(PLACEMENT_CONTENT.contact.details);
    }

    // --- Helpers (Specific to this report) ---

    private drawPersonalityGrid(): void {
        // 1. Define the Top Row (Red -> Yellow/Green)
        const row1Defs = [
            { key: "Charismatic Leader", bg: "#ea3324", text: "#FFFFFF" }, // Red
            { key: "Strategic Stabilizer", bg: "#ff7331", text: "#FFFFFF" }, // Orange
            { key: "Decisive Analyst", bg: "#ffb61f", text: "#000000" }, // Gold
            { key: "Energetic Visionary", bg: "#ffd500", text: "#000000" }, // Yellow
            { key: "Supportive Energizer", bg: "#ffe800", text: "#000000" }, // Light Yellow
            { key: "Creative Thinker", bg: "#ddd730", text: "#000000" }, // Lime
        ];

        // 2. Define the Bottom Row (Cyan -> Purple/Pink)
        const row2Defs = [
            { key: "Reliable Executor", bg: "#00bacc", text: "#FFFFFF" }, // Cyan
            { key: "Collaborative Optimist", bg: "#00c889", text: "#FFFFFF" }, // Teal
            { key: "Dependable Specialist", bg: "#00b355", text: "#FFFFFF" }, // Green
            { key: "Analytical Leader", bg: "#0097e6", text: "#FFFFFF" }, // Blue
            { key: "Logical Innovator", bg: "#ba306b", text: "#FFFFFF" }, // Magenta
            { key: "Structured Supporter", bg: "#d11e5b", text: "#FFFFFF" }, // Deep Pink/Red
        ];

        // 3. Helper to get counts
        const getCount = (key: string) => {
            const t = this.data.trait_distribution.find(
                (x) => x.blended_style_name === key,
            );
            return t ? t.student_count : 0;
        };

        const tableWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
        const colWidth = tableWidth / 6;
        const colWidths = Array(6).fill(colWidth); // 6 equal columns

        // --- RENDER TABLE 1 (Top Row) ---
        this.table(
            row1Defs.map((d) => d.key),
            [row1Defs.map((d) => getCount(d.key))], // Data Row
            {
                x: this.MARGIN_STD,
                width: tableWidth,
                colWidths: colWidths,

                // Header Styling (The colorful boxes)
                headerColor: row1Defs.map((d) => d.bg),
                headerTextColor: row1Defs.map((d) => d.text),
                headerAlign: "center",
                headerFont: this.FONT_SORA_BOLD,
                headerFontSize: 8,
                headerHeight: 35,

                // Data Row Styling
                rowAlign: "center",
                font: this.FONT_SORA_REGULAR,
                fontSize: 12,
                rowHeight: 30,

                // Borders
                borderWidth: 1,
                borderColor: "#000000",
                verticalAlign: "middle",
                headerVerticalAlign: "middle",
            },
        );

        // --- RENDER TABLE 2 (Bottom Row) ---
        // We draw this immediately below the first one.
        // Since `table` updates `this.doc.y`, we create a small gap (e.g., 10pts)
        // If you want them attached like a single block, set `y: this.doc.y` (minus any gap).

        // Ensure space creates a gap, or remove `moveDown` if you want them touching.
        this.doc.y += 10;

        this.table(
            row2Defs.map((d) => d.key),
            [row2Defs.map((d) => getCount(d.key))],
            {
                x: this.MARGIN_STD,
                width: tableWidth,
                colWidths: colWidths,

                headerColor: row2Defs.map((d) => d.bg),
                headerTextColor: row2Defs.map((d) => d.text),
                headerAlign: "center",
                headerFont: this.FONT_SORA_BOLD,
                headerFontSize: 8,
                headerHeight: 35,

                rowAlign: "center",
                font: this.FONT_SORA_REGULAR,
                fontSize: 12,
                rowHeight: 30,

                borderWidth: 1,
                borderColor: "#000000",
                verticalAlign: "middle",
                headerVerticalAlign: "middle",
            },
        );
    }

    // --- Data Processing Helpers ---

    private calculateAgileCounters(): number[] {
        const counters = new Array(ACI_CONFIG.length).fill(0);

        this.data.trait_distribution.forEach((group) => {
            group.students_data.forEach((student) => {
                const total = student.agile_score?.total ?? 0;

                // Find the matching config level
                const configIndex = ACI_CONFIG.findIndex(
                    (c) => total >= c.minScore,
                );

                if (configIndex !== -1) {
                    counters[configIndex]++;
                }
            });
        });
        return counters;
    }

    private processStudentRow(student: any, index: number): any[] {
        const aciScore = student.agile_score?.total || 0;

        // Find config by score
        const config =
            ACI_CONFIG.find((c) => aciScore >= c.minScore) ||
            ACI_CONFIG[ACI_CONFIG.length - 1];

        const aciLevel = config.level;
        const corporateReadiness = config.readiness || "Developing";
        let companyTier = config.companyTier || "Developing";

        // Handle specific edge case for "Product Company" (>= 90) nested within "Agile Adaptive"
        if (aciScore >= 90 && aciScore < 100) {
            companyTier = "Product Company";
        }

        return [
            index + 1,
            // Student Column (Name + Year + Report No)
            {
                content: [
                    {
                        text: `${student.full_name.toUpperCase()} (Year ${student.college_year})`,
                        bold: true,
                    },
                    {
                        text: `${student.student_exam_ref_no.replace("COLLEGE_STUDENT", "CS")}`,
                        fontSize: 8,
                        color: "#555555",
                    },
                ],
            },
            aciScore,
            aciLevel,
            corporateReadiness,
            companyTier,
        ];
    }
}
