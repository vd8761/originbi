/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-plus-operands */
import * as fs from 'fs';
import { BaseReport } from './base-report';

// --- Interfaces for the Enhanced Report ---

export interface SkillScore {
    name: string;
    score: number;
    insight: string;
}

export interface SkillCategory {
    category: string;
    skills: SkillScore[];
}

export interface CandidateProfile {
    // 1. Snapshot
    name: string;
    currentRole: string;
    totalExperience: string;
    relevantExperience: string;
    currentIndustry: string;
    expectedFutureRole: string;
    futureRoleReadinessScore: number;
    readinessStatus: string;

    // 2. Behavioral
    behavioralSummary: string;

    // 3. Skills
    skillCategories: SkillCategory[];

    // 4. Analysis
    overallSkillInsight: {
        strengths: string[];
        developable: string[];
    };

    // 5. Readiness Mapping
    readinessDimensions: {
        dimension: string;
        alignment: string;
    }[];
    adjacencyType: string;

    // 6. Role Fitment
    roleFitmentScore: number;
    fitmentComponents: {
        component: string;
        weight: string;
        score: number;
    }[];
    fitmentVerdict: string;

    // 7. Industry Suitability
    industrySuitability: {
        industry: string;
        suitability: string;
        description: string;
    }[];

    // 8. Transition
    transitionRequirements: string[];

    // 9. Closure
    executiveInsight: string;
}

export interface OverallReportData {
    reportId: string;
    title: string;
    subTitle?: string;
    generatedAt: Date;
    candidates: CandidateProfile[];
}

// Table of Contents Items
const TOC_ITEMS = [
    'Executive Summary & Report Index',
    'Candidate Profile Snapshots',
    'Behavioral Alignment Analysis',
    'Skill-wise Capability Assessment',
    'Future Role Readiness Mapping',
    'Role Fitment Analysis',
    'Industry-Specific Suitability',
    'Key Transition Requirements',
    'Origin BI Executive Insights',
    'Appendix & Legend'
];

// Readiness Legend Data
const READINESS_LEGEND = [
    { range: 'High', label: 'High Readiness - Ready for immediate transition', color: '#e6ffe6' },
    { range: 'Moderate', label: 'Moderate Readiness - Transitionable with support', color: '#fff5e6' },
    { range: 'Low', label: 'Low Readiness - Significant gaps exist', color: '#ffe6e6' }
];

export class OverallFitmentReport extends BaseReport {
    private data: OverallReportData;

    constructor(data: OverallReportData) {
        super();
        this.data = data;
    }

    public generate(): Buffer {
        // 1. Cover Page
        this.generateCoverPage();

        // 2. Table of Contents
        this._currentBackground = 'Content_Background.jpg';
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();

        // 3. Executive Summary
        this._currentBackground = 'Watermark_Background.jpg';
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateExecutiveSummary();

        // 4. Individual Candidate Profiles
        this._currentBackground = 'Watermark_Background.jpg';
        this.data.candidates.forEach((candidate, index) => {
            this.doc.addPage();
            this.generateCandidateProfile(candidate, index + 1);
        });

        // 5. Appendix & Legend
        this.doc.addPage();
        this.generateAppendix();

        // 6. Add Footers
        this.addFooters();

        this.doc.end();

        return Buffer.alloc(0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════════════════
    private generateCoverPage(): void {
        this._useStdMargins = false;
        this._currentBackground = null;

        // Background Image - Use Handbook_Cover_Default.jpg
        const bgPath = this.getAssetPath('Handbook_Cover_Default.jpg');
        if (fs.existsSync(bgPath)) {
            this.doc.image(bgPath, 0, 0, { width: this.PAGE_WIDTH, height: this.PAGE_HEIGHT });
        } else {
            // Fallback gradient background
            this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#F0F8FF');
        }

        // Title - Top Left Area (aligned with template)
        const titleStartY = 60;
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(30)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Career Fitment &', 30, titleStartY, { align: 'left' })
            .text('Future Role Readiness', 30, titleStartY + 48, { align: 'left' })
            .text('Report', 30, titleStartY + 96, { align: 'left' });

        // Note: Logo removed as per template requirements

        // Rotated Reference Number on Right Edge (Top)
        this.doc.save();
        this.doc.rotate(-90, { origin: [this.PAGE_WIDTH - 20, 60] });
        this.doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#AAAAAA')
            .opacity(0.5)
            .text(`OBI-${this.data.reportId}`, this.PAGE_WIDTH - 200, 60 - 10);
        this.doc.restore();
        this.doc.opacity(1);

        // Bottom Section - Company & Date Info (aligned with template)
        const bottomY = this.PAGE_HEIGHT - 150;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(20)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.subTitle || 'Organization Report', 50, bottomY);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(14)
            .fillColor(this.COLOR_BLACK)
            .text('Future Role Readiness Assessment', 50, bottomY + 32);

        const dateStr = this.data.generatedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor('#666666')
            .text(dateStr, 50, bottomY + 58);

        // Candidate Count Badge - Bottom Right
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(13)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`${this.data.candidates.length} Candidates Assessed`, this.PAGE_WIDTH - 220, bottomY + 40, {
                width: 180,
                align: 'right'
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════════════════════════
    private generateTableOfContents(): void {
        // Header positioned for Content_Background.jpg
        const headerX = 20 * this.MM;
        const headerY = 25 * this.MM;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(32)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Table of Contents', headerX, headerY);

        let currentY = 55 * this.MM;
        const circleCenterX = 28 * this.MM;
        const circleRadius = 4.5 * this.MM;

        TOC_ITEMS.forEach((item, index) => {
            const circleY = currentY + circleRadius;

            // Circle with number - filled circle style
            this.doc
                .lineWidth(0.5 * this.MM)
                .strokeColor(this.COLOR_BRIGHT_GREEN)
                .circle(circleCenterX, circleY, circleRadius)
                .stroke();

            // Number inside circle
            this.doc
                .font(this.FONT_SORA_BOLD)
                .fontSize(11)
                .fillColor(this.COLOR_DEEP_BLUE)
                .text((index + 1).toString(), circleCenterX - 4, circleY - 5, {
                    width: 8,
                    align: 'center'
                });

            // TOC Item Text - right of circle
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(14)
                .fillColor(this.COLOR_BLACK)
                .text(item, 40 * this.MM, currentY, {
                    width: this.PAGE_WIDTH - 55 * this.MM
                });

            currentY = currentY + 16 * this.MM;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    private generateExecutiveSummary(): void {
        this.h1('Executive Summary & Report Index');
        this.doc.moveDown(0.3);

        // Introduction Text
        this.p('This report provides a comprehensive analysis of candidate readiness for future roles within the organization. The assessment evaluates behavioral alignment, skill capabilities, and transition potential.');
        this.doc.moveDown(0.4);

        // Summary Statistics
        this.h2('Assessment Overview');
        this.doc.moveDown(0.2);

        const totalCandidates = this.data.candidates.length;
        const highReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore >= 80).length;
        const moderateReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore >= 60 && c.futureRoleReadinessScore < 80).length;
        const lowReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore < 60).length;

        const statsData = [
            ['Total Candidates Assessed', totalCandidates.toString()],
            ['High Readiness', highReadiness.toString()],
            ['Moderate Readiness', moderateReadiness.toString()],
            ['Requires Development', lowReadiness.toString()]
        ];

        this.table(['Metric', 'Count'], statsData, {
            colWidths: [320, 130],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 10,
            headerFontSize: 10,
            cellPadding: 8
        });

        this.doc.moveDown(0.8);

        // Candidate Index Table
        this.h2('Candidate Index');
        this.doc.moveDown(0.2);

        const tableHeaders = ['#', 'Name', 'Current Role', 'Experience', 'Target Role', 'Readiness'];
        const colWidths = [25, 95, 115, 55, 105, 65];

        const rows = this.data.candidates.map((c, i) => [
            (i + 1).toString(),
            c.name,
            c.currentRole,
            c.totalExperience,
            c.expectedFutureRole,
            c.readinessStatus
        ]);

        this.table(tableHeaders, rows, {
            colWidths,
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 9,
            headerFontSize: 9,
            cellPadding: 5
        });

        this.doc.moveDown(1);

        // Readiness Legend
        this.h3('Readiness Interpretation Legend');
        this.drawReadinessLegend();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CANDIDATE PROFILE
    // ═══════════════════════════════════════════════════════════════════════════
    private generateCandidateProfile(candidate: CandidateProfile, index: number): void {
        // Profile Header
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(9)
            .fillColor('#888888')
            .text('CANDIDATE PROFILE FOR:', this.MARGIN_STD, this.MARGIN_STD);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(22)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(candidate.name, this.MARGIN_STD, this.doc.y + 4);

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(`Target Role: ${candidate.expectedFutureRole}`, this.MARGIN_STD, this.doc.y + 6);

        this.doc.moveDown(1.2);

        // 1. Profile Snapshot
        this.h2('1. Profile Snapshot');
        this.doc.moveDown(0.2);

        const snapshotData = [
            ['Name', candidate.name],
            ['Current Role', candidate.currentRole],
            ['Total Experience', candidate.totalExperience],
            ['Relevant Experience', candidate.relevantExperience],
            ['Current Industry', candidate.currentIndustry],
            ['Expected Future Role', candidate.expectedFutureRole],
            ['Readiness Status', candidate.readinessStatus]
        ];

        this.table(['Profile Attribute', 'Details'], snapshotData, {
            colWidths: [170, 330],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 10,
            headerFontSize: 10,
            cellPadding: 6
        });

        this.doc.moveDown(0.8);

        // 2. Behavioral Alignment
        this.h2('2. Behavioral Alignment Summary');
        this.doc.moveDown(0.2);
        this.pHtml(candidate.behavioralSummary);
        this.doc.moveDown(0.4);

        // 3. Skill Assessment
        this.ensureSpace(200);
        this.h2('3. Skill-wise Capability Assessment (Score out of 5)');
        this.doc.moveDown(0.2);

        candidate.skillCategories.forEach(cat => {
            this.ensureSpace(100);
            this.h3(cat.category);
            this.doc.moveDown(0.1);

            const skillRows = cat.skills.map(s => [
                s.name,
                s.score.toFixed(1),
                s.insight || '-'
            ]);

            this.table(['Skill', 'Score', 'Insight'], skillRows, {
                colWidths: [140, 55, 305],
                fontSize: 9,
                headerFontSize: 9,
                cellPadding: 5,
                headerColor: this.COLOR_DEEP_BLUE,
                headerTextColor: '#FFFFFF'
            });

            this.doc.moveDown(0.4);
        });

        // Skill Radar Chart (Visual)
        this.ensureSpace(200);
        this.h3('Capability Snapshot (Visual)');
        this.drawRadarChart(candidate, this.PAGE_WIDTH / 2, this.doc.y + 120, 100);
        this.doc.y += 260;

        // 4. Overall Skill Insight
        this.ensureSpace(120);
        this.h2('4. Overall Skill Coverage Insight');
        this.doc.moveDown(0.2);

        this.h3('High Strength Areas:');
        this.list(candidate.overallSkillInsight.strengths, { indent: 20 });

        this.h3('Developable Areas:');
        this.list(candidate.overallSkillInsight.developable, { indent: 20 });

        this.doc.moveDown(0.4);

        // 5. Readiness Mapping
        this.ensureSpace(150);
        const showMapping = candidate.currentRole !== 'Aspiring Professional' && candidate.expectedFutureRole !== 'Next Level Role';
        const headerText = showMapping
            ? `5. Future Role Readiness Mapping (${candidate.currentRole} -> ${candidate.expectedFutureRole})`
            : `5. Future Role Readiness Mapping`;

        this.h2(headerText);
        this.doc.moveDown(0.2);

        const readinessRows = candidate.readinessDimensions.map(d => [d.dimension, d.alignment]);
        this.table(['Dimension', 'Alignment Level'], readinessRows, {
            colWidths: [250, 250],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 10,
            cellPadding: 6
        });

        this.doc.moveDown(0.4);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(`Adjacency Type: ${candidate.adjacencyType}`);

        this.doc.moveDown(1);

        // 6. Role Fitment Score
        this.ensureSpace(180);
        this.h2(`6. Role Fitment Analysis - ${candidate.expectedFutureRole}`);
        this.doc.moveDown(0.2);

        const fitmentRows = candidate.fitmentComponents.map(fc => [
            fc.component,
            fc.weight,
            fc.score.toString()
        ]);

        this.table(['Component', 'Weight', 'Score'], fitmentRows, {
            colWidths: [230, 120, 150],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 10,
            cellPadding: 6
        });

        this.doc.moveDown(0.4);

        this.doc.moveDown(0.3);

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text('Verdict:');

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(10)
            .text(candidate.fitmentVerdict);

        this.doc.moveDown(1);

        // 7. Industry Suitability
        this.ensureSpace(120);
        this.h2('7. Industry-Specific Suitability');
        this.doc.moveDown(0.2);

        // Create table for consistent layout
        const industryRows = candidate.industrySuitability.map(ind => [
            ind.industry,
            ind.suitability,
            ind.description
        ]);

        this.table(['Industry', 'Suitability', 'Ideal For'], industryRows, {
            colWidths: [180, 70, 250],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 9,
            headerFontSize: 10,
            cellPadding: 8
        });

        this.doc.moveDown(0.5);

        // 8. Transition Requirements
        this.ensureSpace(120);
        this.h2('8. Key Transition Requirements');

        this.p(`To transition from ${candidate.currentRole} to ${candidate.expectedFutureRole}, the following shifts are required:`);
        this.list(candidate.transitionRequirements, { indent: 20, type: 'number' });

        this.doc.moveDown(1);

        // 9. Executive Insight
        this.ensureSpace(100);
        this.h2('9. Origin BI Executive Insight');

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(candidate.executiveInsight, {
                width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                align: 'justify'
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // APPENDIX
    // ═══════════════════════════════════════════════════════════════════════════
    private generateAppendix(): void {
        this.h1('Appendix & Legend');
        this.doc.moveDown(0.5);

        // Readiness Score Legend
        this.h2('Future Role Readiness Interpretation');
        this.drawReadinessLegend();

        this.doc.moveDown(1);

        // Fitment Score Legend
        this.h2('Role Fitment Interpretation');

        const fitmentLegend = [
            { range: 'Strong', label: 'Strong Fit - Highly recommended for role', color: '#e6ffe6' },
            { range: 'Conditional Strong', label: 'Conditional Strong Fit - Recommended with minor development', color: '#e6f7ff' },
            { range: 'Moderate', label: 'Moderate Fit - Possible with significant development', color: '#fff5e6' },
            { range: 'Weak', label: 'Weak Fit - Not recommended without major changes', color: '#ffe6e6' }
        ];

        this.drawLegendTable(fitmentLegend);

        this.doc.moveDown(1);

        // Methodology Note
        this.h2('Assessment Methodology');
        this.doc.moveDown(0.3);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text('This report utilizes Origin BI\'s proprietary assessment methodology combining:', this.MARGIN_STD, this.doc.y, {
                width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                align: 'left'
            });

        this.doc.moveDown(0.5);

        const methodologyItems = [
            'Behavioral Style Analysis using DISC framework',
            'Technical and Functional Skill Assessment',
            'Leadership and Management Competencies evaluation',
            'Industry and Domain Knowledge mapping',
            'Cultural Fit and Team Dynamics analysis',
            'Growth Potential and Adaptability scoring'
        ];

        this.list(methodologyItems, { indent: 30, type: 'bullet' });

        this.doc.moveDown(1);

        // Disclaimer
        this.h2('Important Disclaimer');
        this.doc.moveDown(0.3);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(10)
            .fillColor('#555555')
            .text(
                'This report is generated based on assessment data and algorithmic analysis. While the insights provided are data-driven and research-backed, they should be used as one input among many in making career and placement decisions. Individual circumstances, organizational context, and other qualitative factors should also be considered. Origin BI recommends using this report in conjunction with interviews, reference checks, and other evaluation methods.',
                this.MARGIN_STD,
                this.doc.y,
                {
                    width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                    align: 'justify'
                }
            );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════
    private drawReadinessLegend(): void {
        this.drawLegendTable(READINESS_LEGEND);
    }

    private drawLegendTable(legendData: { range: string; label: string; color: string }[]): void {
        const x = this.MARGIN_STD;
        let y = this.doc.y + 10;
        const width = 450;
        const rowH = 28;

        // Header Row
        this.doc.rect(x, y, width, rowH).fill(this.COLOR_DEEP_BLUE);
        this.doc
            .fillColor('#FFFFFF')
            .font(this.FONT_SORA_BOLD)
            .fontSize(10)
            .text('Range', x + 10, y + 8, { width: 100, align: 'left' })
            .text('Interpretation', x + 110, y + 8, { width: 330, align: 'left' });

        y += rowH;

        // Data Rows
        legendData.forEach(row => {
            this.doc.rect(x, y, width, rowH).fill(row.color).strokeColor('#cccccc').stroke();

            this.doc
                .fillColor(this.COLOR_BLACK)
                .font(this.FONT_SORA_BOLD)
                .fontSize(9)
                .text(row.range, x + 10, y + 9, { width: 100, align: 'left' });

            this.doc
                .font(this.FONT_REGULAR)
                .text(row.label, x + 110, y + 9, { width: 330, align: 'left' });

            y += rowH;
        });

        this.doc.y = y + 10;
    }

    private drawRadarChart(candidate: CandidateProfile, centerX: number, centerY: number, radius: number): void {
        const categories = candidate.skillCategories.map(c => c.category);
        const scores = candidate.skillCategories.map(c => {
            const sum = c.skills.reduce((a, b) => a + b.score, 0);
            return c.skills.length > 0 ? sum / c.skills.length : 0;
        });

        const numPoints = categories.length;
        if (numPoints < 3) return;

        const maxScore = 5;

        // Draw Web Grid
        this.doc.lineWidth(0.5).strokeColor('#E0E0E0');

        // Concentric circles
        for (let level = 1; level <= maxScore; level++) {
            const r = (level / maxScore) * radius;
            this.doc.circle(centerX, centerY, r).stroke();
        }

        // Axis Lines
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.doc.moveTo(centerX, centerY).lineTo(x, y).stroke();

            // Labels
            const labelX = centerX + Math.cos(angle) * (radius + 25);
            const labelY = centerY + Math.sin(angle) * (radius + 25);
            this.doc
                .fillColor(this.COLOR_BLACK)
                .fontSize(8)
                .font(this.FONT_REGULAR)
                .text(categories[i], labelX - 45, labelY - 6, { width: 90, align: 'center' });
        }

        // Draw Data Polygon
        this.doc.lineWidth(2).strokeColor(this.COLOR_DEEP_BLUE).fillOpacity(0.2);

        const points: [number, number][] = [];
        for (let i = 0; i < numPoints; i++) {
            const score = Math.max(0, Math.min(scores[i], maxScore));
            const r = (score / maxScore) * radius;
            const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
            points.push([
                centerX + Math.cos(angle) * r,
                centerY + Math.sin(angle) * r
            ]);
        }

        this.doc.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            this.doc.lineTo(points[i][0], points[i][1]);
        }
        this.doc.lineTo(points[0][0], points[0][1]);
        this.doc.fillColor(this.COLOR_DEEP_BLUE).fillAndStroke();
        this.doc.fillOpacity(1);

        // Draw data points
        points.forEach(([px, py]) => {
            this.doc.circle(px, py, 4).fill(this.COLOR_DEEP_BLUE);
        });
    }

    private addFooters(): void {
        const range = this.doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 1; i < totalPages; i++) {
            this.doc.switchToPage(range.start + i);
            this.doc.save();

            this.doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

            const footerMargin = 15 * this.MM;
            const footerY = this.PAGE_HEIGHT - footerMargin;

            // Line
            this.doc
                .lineWidth(0.5)
                .strokeColor('#CCCCCC')
                .moveTo(this.MARGIN_STD, footerY)
                .lineTo(this.PAGE_WIDTH - this.MARGIN_STD, footerY)
                .stroke();

            const textY = footerY + 2 * this.MM;

            // Left Text
            this.doc
                .font(this.FONT_REGULAR)
                .fontSize(8)
                .fillColor(this.COLOR_BLACK)
                .text('Origin BI', this.MARGIN_STD, textY, { lineBreak: false });

            const titleWidth = this.doc.widthOfString('Origin BI');
            this.doc
                .fillColor('#A9A9A9')
                .text(` #${this.data.reportId}`, this.MARGIN_STD + titleWidth + 5, textY, { lineBreak: false });

            // Right Text - Page Number
            this.doc
                .fillColor(this.COLOR_BLACK)
                .text(`Page ${i + 1} of ${totalPages}`, this.MARGIN_STD, textY, {
                    width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                    align: 'right'
                });

            this.doc.restore();
        }
    }
}
