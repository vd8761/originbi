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
    'Role Fitment Score Analysis',
    'Industry-Specific Suitability',
    'Key Transition Requirements',
    'Origin BI Executive Insights',
    'Appendix & Score Legend'
];

// Readiness Legend Data
const READINESS_LEGEND = [
    { range: '80% - 100%', label: 'High Readiness (Green) - Ready for immediate transition', color: '#e6ffe6' },
    { range: '60% - 79%', label: 'Moderate Readiness (Amber) - Transitionable with support', color: '#fff5e6' },
    { range: '0% - 59%', label: 'Low Readiness (Red) - Significant gaps exist', color: '#ffe6e6' }
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
        this._currentBackground = 'Watermark_Background.jpg';
        this._useStdMargins = false;
        this.doc.addPage();
        this.generateTableOfContents();

        // 3. Executive Summary
        this._currentBackground = 'Watermark_Background.jpg';
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateExecutiveSummary();

        // 4. Individual Candidate Profiles
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

        // Title - Top Left Area
        const titleStartY = 50;
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(32)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Career Fitment &', 40, titleStartY, { align: 'left' })
            .text('Future Role Readiness', 40, titleStartY + 42, { align: 'left' })
            .text('Report', 40, titleStartY + 84, { align: 'left' });

        // Origin BI Logo - Top Right
        const logoPath = this.getAssetPath('Origin-BI-Logo-01.png');
        if (fs.existsSync(logoPath)) {
            this.doc.image(logoPath, this.PAGE_WIDTH - 160, 40, { width: 130 });
        }

        // Rotated Reference Number on Right Edge
        this.doc.save();
        this.doc.rotate(-90, { origin: [this.PAGE_WIDTH - 25, 200] });
        this.doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#AAAAAA')
            .opacity(0.6)
            .text(`OBI-${this.data.reportId}`, this.PAGE_WIDTH - 200, 200 - 10);
        this.doc.restore();
        this.doc.opacity(1);

        // Bottom Section - Company & Date Info
        const bottomY = this.PAGE_HEIGHT - 130;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(18)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.subTitle || 'Organization Report', 40, bottomY);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(14)
            .fillColor(this.COLOR_BLACK)
            .text('Future Role Readiness', 40, bottomY + 28);

        const dateStr = this.data.generatedAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(12)
            .fillColor('#666666')
            .text(dateStr, 40, bottomY + 50);

        // Candidate Count Badge - Bottom Right
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(14)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`${this.data.candidates.length} Candidates`, this.PAGE_WIDTH - 200, bottomY + 30, {
                width: 160,
                align: 'right'
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════════════════════════
    private generateTableOfContents(): void {
        const headerX = 15 * this.MM;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(38)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Table of Contents', headerX, headerX);

        let currentY = 50 * this.MM;
        const circleCenterX = 25 * this.MM;

        TOC_ITEMS.forEach((item, index) => {
            const circleY = currentY + 5 * this.MM;

            // Circle with number
            this.doc
                .lineWidth(0.4 * this.MM)
                .strokeColor(this.COLOR_BRIGHT_GREEN)
                .circle(circleCenterX, circleY, 5 * this.MM)
                .stroke();

            this.doc
                .font(this.FONT_SORA_REGULAR)
                .fontSize(12)
                .fillColor(this.COLOR_DEEP_BLUE)
                .text((index + 1).toString(), 20 * this.MM, circleY - 6, {
                    width: 10 * this.MM,
                    align: 'center'
                });

            // TOC Item Text
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(16)
                .fillColor(this.COLOR_BLACK)
                .text(item, 35 * this.MM, currentY + 1.5 * this.MM, {
                    width: this.PAGE_WIDTH - 60 * this.MM
                });

            currentY = this.doc.y + 8 * this.MM;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    private generateExecutiveSummary(): void {
        this.h1('Executive Summary & Report Index');
        this.doc.moveDown(0.5);

        // Introduction Text
        this.p('This report provides a comprehensive analysis of candidate readiness for future roles within the organization. The assessment evaluates behavioral alignment, skill capabilities, and transition potential.');
        this.doc.moveDown(0.5);

        // Summary Statistics
        this.h2('Assessment Overview');

        const totalCandidates = this.data.candidates.length;
        const highReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore >= 80).length;
        const moderateReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore >= 60 && c.futureRoleReadinessScore < 80).length;
        const lowReadiness = this.data.candidates.filter(c => c.futureRoleReadinessScore < 60).length;

        const statsData = [
            ['Total Candidates Assessed', totalCandidates.toString()],
            ['High Readiness (≥80%)', highReadiness.toString()],
            ['Moderate Readiness (60-79%)', moderateReadiness.toString()],
            ['Requires Development (<60%)', lowReadiness.toString()]
        ];

        this.table(['Metric', 'Count'], statsData, {
            colWidths: [300, 150],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 11,
            headerFontSize: 11
        });

        this.doc.moveDown(1);

        // Candidate Index Table
        this.h2('Candidate Index');
        this.doc.moveDown(0.3);

        const tableHeaders = ['#', 'Name', 'Current Role', 'Experience', 'Target Role', 'Readiness'];
        const colWidths = [30, 100, 110, 60, 100, 70];

        const rows = this.data.candidates.map((c, i) => [
            (i + 1).toString(),
            c.name,
            c.currentRole,
            c.totalExperience,
            c.expectedFutureRole,
            `${c.futureRoleReadinessScore}%`
        ]);

        this.table(tableHeaders, rows, {
            colWidths,
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 9,
            headerFontSize: 9,
            cellPadding: 6
        });

        this.doc.moveDown(1);

        // Readiness Legend
        this.h3('Score Interpretation Legend');
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
            .fontSize(24)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(candidate.name, this.MARGIN_STD, this.doc.y + 5);

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(12)
            .fillColor(this.COLOR_BLACK)
            .text(`Target Role: ${candidate.expectedFutureRole}`, this.MARGIN_STD, this.doc.y + 8);

        this.doc.moveDown(1.5);

        // 1. Profile Snapshot
        this.h2('1. Profile Snapshot');

        const snapshotData = [
            ['Name', candidate.name],
            ['Current Role', candidate.currentRole],
            ['Total Experience', candidate.totalExperience],
            ['Relevant Experience', candidate.relevantExperience],
            ['Current Industry', candidate.currentIndustry],
            ['Expected Future Role', candidate.expectedFutureRole],
            ['Future Role Readiness Score', `${candidate.futureRoleReadinessScore}%`],
            ['Readiness Status', candidate.readinessStatus]
        ];

        this.table(['Profile Attribute', 'Details'], snapshotData, {
            colWidths: [180, 320],
            headerColor: '#E8E8E8',
            headerTextColor: this.COLOR_BLACK,
            fontSize: 10,
            headerFontSize: 10
        });

        this.doc.moveDown(1);

        // 2. Behavioral Alignment
        this.h2('2. Behavioral Alignment Summary');
        this.pHtml(candidate.behavioralSummary);
        this.doc.moveDown(0.5);

        // 3. Skill Assessment
        this.ensureSpace(200);
        this.h2('3. Skill-wise Capability Assessment (Score out of 5)');

        candidate.skillCategories.forEach(cat => {
            this.ensureSpace(100);
            this.h3(cat.category);

            const skillRows = cat.skills.map(s => [
                s.name,
                s.score.toFixed(1),
                s.insight || '-'
            ]);

            this.table(['Skill', 'Score', 'Insight'], skillRows, {
                colWidths: [150, 60, 290],
                fontSize: 9,
                headerFontSize: 9,
                cellPadding: 5,
                headerColor: '#F0F0F0'
            });

            this.doc.moveDown(0.5);
        });

        // Skill Radar Chart (Visual)
        this.ensureSpace(200);
        this.h3('Capability Snapshot (Visual)');
        this.drawRadarChart(candidate, this.PAGE_WIDTH / 2, this.doc.y + 120, 100);
        this.doc.y += 260;

        // 4. Overall Skill Insight
        this.ensureSpace(120);
        this.h2('4. Overall Skill Coverage Insight');

        this.h3('High Strength Areas:');
        this.list(candidate.overallSkillInsight.strengths, { indent: 20 });

        this.h3('Developable Areas:');
        this.list(candidate.overallSkillInsight.developable, { indent: 20 });

        this.doc.moveDown(0.5);

        // 5. Readiness Mapping
        this.ensureSpace(150);
        this.h2(`5. Future Role Readiness Mapping (${candidate.currentRole} → ${candidate.expectedFutureRole})`);

        const readinessRows = candidate.readinessDimensions.map(d => [d.dimension, d.alignment]);
        this.table(['Dimension', 'Alignment Level'], readinessRows, {
            colWidths: [250, 250],
            headerColor: '#E8E8E8',
            fontSize: 10
        });

        this.doc.moveDown(0.5);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(12)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`Future Role Readiness Score: ${candidate.futureRoleReadinessScore}%`);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(`Adjacency Type: ${candidate.adjacencyType}`);

        this.doc.moveDown(1);

        // 6. Role Fitment Score
        this.ensureSpace(180);
        this.h2(`6. Role Fitment Score - ${candidate.expectedFutureRole} (Out of 100)`);

        const fitmentRows = candidate.fitmentComponents.map(fc => [
            fc.component,
            fc.weight,
            fc.score.toString()
        ]);

        this.table(['Component', 'Weight', 'Score'], fitmentRows, {
            colWidths: [220, 100, 100],
            headerColor: '#E8E8E8',
            fontSize: 10
        });

        this.doc.moveDown(0.5);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(14)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`Final Role Fitment Score: ${candidate.roleFitmentScore}%`);

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

        candidate.industrySuitability.forEach(ind => {
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(11)
                .fillColor(this.COLOR_DEEP_BLUE)
                .text(ind.industry);

            this.doc
                .font(this.FONT_REGULAR)
                .fontSize(10)
                .fillColor(this.COLOR_BLACK)
                .text(`Suitability: ${ind.suitability}`);

            this.doc
                .font(this.FONT_REGULAR)
                .fontSize(10)
                .fillColor('#555555')
                .text(`Ideal for: ${ind.description}`);

            this.doc.moveDown(0.5);
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
        this.h1('Appendix & Score Legend');
        this.doc.moveDown(0.5);

        // Readiness Score Legend
        this.h2('Future Role Readiness Score Interpretation');
        this.drawReadinessLegend();

        this.doc.moveDown(1);

        // Fitment Score Legend
        this.h2('Role Fitment Score Interpretation');

        const fitmentLegend = [
            { range: '85% - 100%', label: 'Strong Fit - Highly recommended for role', color: '#e6ffe6' },
            { range: '70% - 84%', label: 'Conditional Strong Fit - Recommended with minor development', color: '#e6f7ff' },
            { range: '55% - 69%', label: 'Moderate Fit - Possible with significant development', color: '#fff5e6' },
            { range: '0% - 54%', label: 'Weak Fit - Not recommended without major changes', color: '#ffe6e6' }
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
