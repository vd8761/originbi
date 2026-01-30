/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-plus-operands */
import * as fs from 'fs';
import { BaseReport } from './base-report';
import { CareerFitmentReportData, SkillCategory } from '../../rag/custom-report.service';

// Table of Contents Items
const TOC_ITEMS = [
    'Profile Snapshot',
    'Behavioral Alignment Summary',
    'Skill-wise Capability Assessment',
    'Overall Skill Coverage Insight',
    'Future Role Readiness Mapping',
    'Role Fitment Score Analysis',
    'Industry-Specific Suitability',
    'Key Transition Requirements',
    'Origin BI Executive Insight'
];

export class CareerFitmentReport extends BaseReport {
    private data: CareerFitmentReportData;

    constructor(data: CareerFitmentReportData) {
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

        // 3. Content pages with watermark background
        this._currentBackground = 'Watermark_Background.jpg';
        this._useStdMargins = true;

        // Page 3: Profile + Behavioral Summary
        this.doc.addPage();
        this.generateProfileSection();
        this.generateBehavioralSummary();

        // Page 4+: Skill Assessment
        this.doc.addPage();
        this.generateSkillAssessment();

        // Readiness & Fitment
        this.doc.addPage();
        this.generateReadinessSection();
        this.generateFitmentScore();

        // Industry Suitability, Transition, Executive Insight
        this.doc.addPage();
        this.generateIndustrySuitability();
        this.generateTransitionRequirements();
        this.generateExecutiveInsight();

        // Add footers
        this.addFooters();

        this.doc.end();

        return Buffer.from([]);
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
        const titleStartY = 30;
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(30)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Career Fitment &', 30, titleStartY, { align: 'left' })
            .text('Future Role Readiness', 30, titleStartY + 48, { align: 'left' })
            .text('Report', 30, titleStartY + 96, { align: 'left' });

        // Rotated Reference Number on Right Edgey
        this.doc.save();
        this.doc.rotate(-90, { origin: [this.PAGE_WIDTH - 20, 200] });
        this.doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#AAAAAA')
            .opacity(0.5)
            .text(`${this.data.reportId}`, this.PAGE_WIDTH - 200, 200 - 10);
        this.doc.restore();
        this.doc.opacity(1);

        // Bottom Section - User Name & Info
        const bottomY = this.PAGE_HEIGHT - 150;

        // Left Side: Name, Title, Date
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(20)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.profile.fullName.split(/Current Role|Job Description|Experience/i)[0].trim().substring(0, 50), 50, bottomY);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(14)
            .fillColor(this.COLOR_BLACK)
            .text('Future Role Readiness Assessment', 50, bottomY + 32);

        const dateStr = this.data.generatedDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor('#666666')
            .text(dateStr, 50, bottomY + 58);

        // Right Side: Company Name
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(13)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text('Infiniti Software', this.PAGE_WIDTH - 250, bottomY + 40, {
                width: 200,
                align: 'right'
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS
    // ═══════════════════════════════════════════════════════════════════════════
    private generateTableOfContents(): void {
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

            // Circle with number
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

            // TOC Item Text
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
    // PROFILE SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    private generateProfileSection(): void {
        // Header
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(9)
            .fillColor('#888888')
            .text('CAREER FITMENT REPORT FOR:', this.MARGIN_STD, this.MARGIN_STD);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(22)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.profile.fullName, this.MARGIN_STD, this.doc.y + 4);

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(`Target Role: ${this.data.profile.expectedFutureRole}`, this.MARGIN_STD, this.doc.y + 6);

        this.doc.moveDown(1.2);

        // 1. Profile Snapshot
        this.h2('1. Profile Snapshot');
        this.doc.moveDown(0.2);

        const profile = this.data.profile;
        const snapshotData = [
            ['Name', profile.fullName],
            ['Current Role', profile.currentRole],
            ['Total Experience', `${profile.yearsOfExperience} Years`],
            ['Relevant Experience', profile.relevantExperience || 'N/A'],
            ['Current Industry', profile.currentIndustry],
            ['Expected Future Role', profile.expectedFutureRole],
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
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BEHAVIORAL SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    private generateBehavioralSummary(): void {
        this.h2('2. Behavioral Alignment Summary');
        this.doc.moveDown(0.2);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(10)
            .fillColor(this.COLOR_BLACK)
            .text(this.data.behavioralSummary, this.MARGIN_STD, this.doc.y, {
                width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                align: 'justify'
            });

        // DISC Profile if available
        if (this.data.discProfile && this.data.discProfile.dominantTrait !== 'Balanced Profile') {
            this.doc.moveDown(0.5);
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(11)
                .fillColor(this.COLOR_DEEP_BLUE)
                .text(`DISC Profile: ${this.data.discProfile.dominantTrait}`);
        }

        // Agile Profile
        if (this.data.agileProfile) {
            this.doc.moveDown(0.3);
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(11)
                .fillColor(this.COLOR_DEEP_BLUE)
                .text(`Agile Profile: ${this.data.agileProfile.level}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SKILL ASSESSMENT
    // ═══════════════════════════════════════════════════════════════════════════
    private generateSkillAssessment(): void {
        this.h2('3. Skill-wise Capability Assessment (Score out of 5)');
        this.doc.moveDown(0.2);

        this.data.skillCategories.forEach(category => {
            this.ensureSpace(100);
            this.h3(category.category);
            this.doc.moveDown(0.1);

            const skillRows = category.skills.map(s => [
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
        this.drawRadarChart(this.PAGE_WIDTH / 2, this.doc.y + 120, 100);
        this.doc.y += 260;

        // Overall Skill Insight
        this.ensureSpace(120);
        this.doc.x = this.MARGIN_STD; // Reset X alignment
        this.h2('4. Overall Skill Coverage Insight');
        this.doc.moveDown(0.2);

        this.h3('High Strength Areas:');
        if (this.data.overallSkillInsight.highStrengthAreas.length > 0) {
            this.list(this.data.overallSkillInsight.highStrengthAreas, { indent: 20 });
        } else {
            this.p('No high strength areas identified.');
        }

        this.h3('Developable Areas:');
        if (this.data.overallSkillInsight.developableAreas.length > 0) {
            this.list(this.data.overallSkillInsight.developableAreas, { indent: 20 });
        } else {
            this.p('No critical development areas identified.');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // READINESS SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    private generateReadinessSection(): void {
        const profile = this.data.profile;
        // Only show mapping if values are meaningful
        const showMapping = profile.currentRole !== 'Aspiring Professional' && profile.expectedFutureRole !== 'Next Level Role';
        const headerText = showMapping
            ? `5. Future Role Readiness Mapping (${profile.currentRole} -> ${profile.expectedFutureRole})`
            : `5. Future Role Readiness Mapping`;

        this.h2(headerText);
        this.doc.moveDown(0.2);

        const readiness = this.data.futureRoleReadiness;
        const readinessRows = readiness.dimensions.map(d => [d.name, d.alignment]);

        this.table(['Dimension', 'Alignment Level'], readinessRows, {
            colWidths: [250, 250],
            headerColor: this.COLOR_DEEP_BLUE,
            headerTextColor: '#FFFFFF',
            fontSize: 10,
            cellPadding: 6
        });

        this.doc.moveDown(0.4);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(12)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`Future Role Readiness Score: ${readiness.readinessScore}%`);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(`Adjacency Type: ${readiness.adjacencyType}`);

        this.doc.moveDown(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FITMENT SCORE
    // ═══════════════════════════════════════════════════════════════════════════
    private generateFitmentScore(): void {
        this.ensureSpace(180);
        this.h2(`6. Role Fitment Score - ${this.data.profile.expectedFutureRole} (Out of 100)`);
        this.doc.moveDown(0.2);

        const fitment = this.data.roleFitmentScore;
        const fitmentRows = fitment.components.map(fc => [
            fc.name,
            `${fc.weight}%`,
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

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(14)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`Final Role Fitment Score: ${fitment.totalScore}%`);

        this.doc.moveDown(0.3);

        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text('Verdict:');

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(10)
            .text(fitment.verdict);

        this.doc.moveDown(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INDUSTRY SUITABILITY
    // ═══════════════════════════════════════════════════════════════════════════
    private generateIndustrySuitability(): void {
        this.ensureSpace(120);
        this.h2('7. Industry-Specific Suitability');
        this.doc.moveDown(0.2);

        this.data.industrySuitability.forEach(ind => {
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
                .text(`Ideal for: ${ind.idealFor}`);

            this.doc.moveDown(0.5);
        });

        this.doc.moveDown(0.5);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSITION REQUIREMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    private generateTransitionRequirements(): void {
        this.ensureSpace(120);
        this.h2('8. Key Transition Requirements');
        this.doc.moveDown(0.2);

        const profile = this.data.profile;
        this.p(`To transition from ${profile.currentRole} to ${profile.expectedFutureRole}, the following shifts are required:`);
        this.list(this.data.transitionRequirements, { indent: 20, type: 'number' });

        this.doc.moveDown(1);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTIVE INSIGHT
    // ═══════════════════════════════════════════════════════════════════════════
    private generateExecutiveInsight(): void {
        this.ensureSpace(100);
        this.h2('9. Origin BI Executive Insight');
        this.doc.moveDown(0.2);

        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(11)
            .fillColor(this.COLOR_BLACK)
            .text(this.data.executiveInsight, {
                width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
                align: 'justify'
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTERS
    // ═══════════════════════════════════════════════════════════════════════════
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

    private drawRadarChart(centerX: number, centerY: number, radius: number): void {
        this.doc.save();

        const categories = this.data.skillCategories.map(c => c.category);
        const scores = this.data.skillCategories.map(c => {
            const sum = c.skills.reduce((a, b) => a + b.score, 0);
            return c.skills.length > 0 ? sum / c.skills.length : 0;
        });

        const numPoints = categories.length;
        if (numPoints < 3) {
            this.doc.restore();
            return;
        }

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

        this.doc.restore();
    }
}
