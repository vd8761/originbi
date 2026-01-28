import { BaseReport } from './base-report';
import { CareerFitmentReportData, SkillCategory } from '../../rag/custom-report.service';

export class CareerFitmentReport extends BaseReport {
    private data: CareerFitmentReportData;

    constructor(data: CareerFitmentReportData) {
        super();
        this.data = data;
    }

    public generate(): Buffer {
        // 1. Cover Page
        this.generateCoverPage();

        // 2. Content pages with watermark background
        this._currentBackground = null; // Will use simple background
        this._useStdMargins = true;

        // Page 2: Profile + Behavioral Summary
        this.doc.addPage();
        this.generateProfileSection();
        this.generateBehavioralSummary();

        // Page 3-4: Skill Assessment
        this.doc.addPage();
        this.generateSkillAssessment();

        // Page 5: Readiness & Fitment
        this.doc.addPage();
        this.generateReadinessSection();
        this.generateFitmentScore();

        // Page 6: Industry Suitability, Transition, Executive Insight
        this.doc.addPage();
        this.generateIndustrySuitability();
        this.generateTransitionRequirements();
        this.generateExecutiveInsight();

        // Add footers
        this.addFooters();

        this.doc.end();

        // Return buffer (handled by stream in PdfService)
        return Buffer.from([]);
    }

    private generateCoverPage(): void {
        const { PAGE_WIDTH, PAGE_HEIGHT, MM } = this;

        // Background gradient effect (simulated with rectangles)
        this.doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#0f172a');

        // Accent line
        this.doc.rect(0, PAGE_HEIGHT * 0.4, PAGE_WIDTH, 3).fill('#06b6d4');

        // Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(32).fillColor('#ffffff');
        this.doc.text('Career Fitment &', 0, PAGE_HEIGHT * 0.25, { align: 'center' });
        this.doc.text('Future Role Readiness', 0, PAGE_HEIGHT * 0.25 + 40, { align: 'center' });
        this.doc.text('Report', 0, PAGE_HEIGHT * 0.25 + 80, { align: 'center' });

        // Report ID
        this.doc.font(this.FONT_REGULAR).fontSize(12).fillColor('#94a3b8');
        this.doc.text(this.data.reportId, 0, PAGE_HEIGHT * 0.45, { align: 'center' });

        // User Name
        this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(28).fillColor('#06b6d4');
        this.doc.text(this.data.profile.fullName, 0, PAGE_HEIGHT * 0.55, { align: 'center' });

        // Subtitle
        this.doc.font(this.FONT_REGULAR).fontSize(14).fillColor('#e2e8f0');
        this.doc.text('Future Role Readiness', 0, PAGE_HEIGHT * 0.62, { align: 'center' });

        // Date
        this.doc.font(this.FONT_REGULAR).fontSize(12).fillColor('#94a3b8');
        const formattedDate = this.data.generatedDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        this.doc.text(formattedDate, 0, PAGE_HEIGHT * 0.75, { align: 'center' });
    }

    private generateProfileSection(): void {
        const { MARGIN_STD, MM } = this;
        let y = 50;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(16).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('Profile Snapshot', MARGIN_STD, y);
        y += 25;

        // Profile details
        const profile = this.data.profile;
        const profileItems = [
            { label: 'Current Role', value: profile.currentRole },
            { label: 'Total Experience', value: `${profile.yearsOfExperience} Years` },
            { label: 'Relevant Experience', value: profile.relevantExperience || 'N/A' },
            { label: 'Current Industry', value: profile.currentIndustry },
            { label: 'Expected Future Role', value: profile.expectedFutureRole },
        ];

        this.doc.font(this.FONT_REGULAR).fontSize(11);
        profileItems.forEach(item => {
            this.doc.fillColor('#374151').text(`${item.label}: `, MARGIN_STD, y, { continued: true });
            this.doc.fillColor('#111827').text(item.value);
            y += 18;
        });
    }

    private generateBehavioralSummary(): void {
        const { MARGIN_STD, PAGE_WIDTH, MM } = this;
        let y = this.doc.y + 30;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('1. Behavioral Alignment Summary', MARGIN_STD, y);
        y += 20;

        // Summary text
        this.doc.font(this.FONT_REGULAR).fontSize(10).fillColor('#374151');
        this.doc.text(this.data.behavioralSummary, MARGIN_STD, y, {
            width: PAGE_WIDTH - MARGIN_STD * 2,
            align: 'justify',
        });
    }

    private generateSkillAssessment(): void {
        const { MARGIN_STD, PAGE_WIDTH, MM } = this;
        let y = 50;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('2. Skill-wise Capability Assessment (Score out of 5)', MARGIN_STD, y);
        y += 25;

        // Draw each skill category as a table
        this.data.skillCategories.forEach(category => {
            if (y > 700) {
                this.doc.addPage();
                y = 50;
            }

            // Category header
            this.doc.font(this.FONT_SEMIBOLD).fontSize(11).fillColor('#1f2937');
            this.doc.text(category.category, MARGIN_STD, y);
            y += 18;

            // Table header
            const colWidths = [200, 50, 230];
            const headers = ['Skill', 'Score', 'Insight'];

            this.doc.font(this.FONT_SEMIBOLD).fontSize(9).fillColor('#6b7280');
            let x = MARGIN_STD;
            headers.forEach((header, i) => {
                this.doc.text(header, x, y);
                x += colWidths[i];
            });
            y += 15;

            // Draw line
            this.doc.strokeColor('#e5e7eb').lineWidth(0.5);
            this.doc.moveTo(MARGIN_STD, y).lineTo(PAGE_WIDTH - MARGIN_STD, y).stroke();
            y += 5;

            // Skills rows
            this.doc.font(this.FONT_REGULAR).fontSize(9);
            category.skills.forEach(skill => {
                x = MARGIN_STD;

                this.doc.fillColor('#374151').text(skill.name, x, y, { width: colWidths[0] - 10 });
                x += colWidths[0];

                this.doc.fillColor(skill.score >= 4 ? '#059669' : skill.score >= 3 ? '#d97706' : '#dc2626');
                this.doc.text(skill.score.toFixed(1), x, y, { width: colWidths[1] - 10 });
                x += colWidths[1];

                this.doc.fillColor('#6b7280').text(skill.insight || '-', x, y, { width: colWidths[2] - 10 });

                y += 16;
            });

            y += 15; // Gap between categories
        });

        // Overall Skill Insight
        if (y > 650) {
            this.doc.addPage();
            y = 50;
        }

        y += 10;
        this.doc.font(this.FONT_SORA_BOLD).fontSize(12).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('3. Overall Skill Coverage Insight', MARGIN_STD, y);
        y += 20;

        this.doc.font(this.FONT_REGULAR).fontSize(10);
        if (this.data.overallSkillInsight.highStrengthAreas.length > 0) {
            this.doc.fillColor('#059669').text('High Strength Areas: ', MARGIN_STD, y, { continued: true });
            this.doc.fillColor('#374151').text(this.data.overallSkillInsight.highStrengthAreas.join(', '));
            y += 18;
        }
        if (this.data.overallSkillInsight.developableAreas.length > 0) {
            this.doc.fillColor('#d97706').text('Developable Areas: ', MARGIN_STD, y, { continued: true });
            this.doc.fillColor('#374151').text(this.data.overallSkillInsight.developableAreas.join(', '));
        }
    }

    private generateReadinessSection(): void {
        const { MARGIN_STD, PAGE_WIDTH, MM } = this;
        let y = 50;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('4. Future Role Readiness Mapping', MARGIN_STD, y);
        y += 25;

        const readiness = this.data.futureRoleReadiness;

        // Dimension table
        const colWidths = [200, 150];
        this.doc.font(this.FONT_SEMIBOLD).fontSize(10).fillColor('#6b7280');
        this.doc.text('Dimension', MARGIN_STD, y);
        this.doc.text('Alignment', MARGIN_STD + colWidths[0], y);
        y += 18;

        this.doc.strokeColor('#e5e7eb').lineWidth(0.5);
        this.doc.moveTo(MARGIN_STD, y).lineTo(MARGIN_STD + 350, y).stroke();
        y += 8;

        this.doc.font(this.FONT_REGULAR).fontSize(10);
        readiness.dimensions.forEach(dim => {
            this.doc.fillColor('#374151').text(dim.name, MARGIN_STD, y);
            const color = dim.alignment === 'High' ? '#059669' : dim.alignment === 'Medium' ? '#d97706' : '#dc2626';
            this.doc.fillColor(color).text(dim.alignment, MARGIN_STD + colWidths[0], y);
            y += 16;
        });

        // Readiness Score
        y += 15;
        this.doc.font(this.FONT_SEMIBOLD).fontSize(12).fillColor('#1f2937');
        this.doc.text(`Future Role Readiness Score: `, MARGIN_STD, y, { continued: true });
        const rColor = readiness.readinessScore >= 80 ? '#059669' : readiness.readinessScore >= 60 ? '#d97706' : '#dc2626';
        this.doc.fillColor(rColor).text(`${readiness.readinessScore}%`);
        y += 20;

        this.doc.font(this.FONT_REGULAR).fontSize(10).fillColor('#6b7280');
        this.doc.text(`Adjacency Type: ${readiness.adjacencyType}`, MARGIN_STD, y);
    }

    private generateFitmentScore(): void {
        const { MARGIN_STD, PAGE_WIDTH } = this;
        let y = this.doc.y + 40;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('5. Role Fitment Score (Out of 100)', MARGIN_STD, y);
        y += 25;

        const fitment = this.data.roleFitmentScore;

        // Component table
        const colWidths = [180, 80, 80];
        this.doc.font(this.FONT_SEMIBOLD).fontSize(10).fillColor('#6b7280');
        this.doc.text('Component', MARGIN_STD, y);
        this.doc.text('Weight', MARGIN_STD + colWidths[0], y);
        this.doc.text('Score', MARGIN_STD + colWidths[0] + colWidths[1], y);
        y += 18;

        this.doc.strokeColor('#e5e7eb').lineWidth(0.5);
        this.doc.moveTo(MARGIN_STD, y).lineTo(MARGIN_STD + 340, y).stroke();
        y += 8;

        this.doc.font(this.FONT_REGULAR).fontSize(10);
        fitment.components.forEach(comp => {
            this.doc.fillColor('#374151').text(comp.name, MARGIN_STD, y);
            this.doc.fillColor('#6b7280').text(`${comp.weight}%`, MARGIN_STD + colWidths[0], y);
            this.doc.fillColor('#1f2937').text(comp.score.toString(), MARGIN_STD + colWidths[0] + colWidths[1], y);
            y += 16;
        });

        // Total Score
        y += 10;
        this.doc.font(this.FONT_BOLD).fontSize(14).fillColor('#1f2937');
        this.doc.text(`Final Role Fitment Score: `, MARGIN_STD, y, { continued: true });
        const fColor = fitment.totalScore >= 80 ? '#059669' : fitment.totalScore >= 60 ? '#d97706' : '#dc2626';
        this.doc.fillColor(fColor).text(`${fitment.totalScore}%`);
        y += 25;

        // Verdict
        this.doc.font(this.FONT_SEMIBOLD).fontSize(11).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text(`Verdict: ${fitment.verdict}`, MARGIN_STD, y, { width: PAGE_WIDTH - MARGIN_STD * 2 });
    }

    private generateIndustrySuitability(): void {
        const { MARGIN_STD, PAGE_WIDTH } = this;
        let y = 50;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('6. Industry-Specific Suitability', MARGIN_STD, y);
        y += 25;

        this.data.industrySuitability.forEach(ind => {
            this.doc.font(this.FONT_SEMIBOLD).fontSize(11).fillColor('#1f2937');
            this.doc.text(ind.industry, MARGIN_STD, y);
            y += 16;

            this.doc.font(this.FONT_REGULAR).fontSize(10);
            const sColor = ind.suitability === 'High' ? '#059669' : ind.suitability === 'Medium' ? '#d97706' : '#dc2626';
            this.doc.fillColor('#6b7280').text('Suitability: ', MARGIN_STD, y, { continued: true });
            this.doc.fillColor(sColor).text(ind.suitability);
            y += 14;

            this.doc.fillColor('#6b7280').text('Ideal for: ', MARGIN_STD, y, { continued: true });
            this.doc.fillColor('#374151').text(ind.idealFor);
            y += 25;
        });
    }

    private generateTransitionRequirements(): void {
        const { MARGIN_STD, PAGE_WIDTH } = this;
        let y = this.doc.y + 20;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('7. Key Transition Requirements', MARGIN_STD, y);
        y += 20;

        this.doc.font(this.FONT_REGULAR).fontSize(10).fillColor('#374151');
        this.data.transitionRequirements.forEach(req => {
            this.doc.text(`• ${req}`, MARGIN_STD + 10, y, { width: PAGE_WIDTH - MARGIN_STD * 2 - 10 });
            y += 16;
        });
    }

    private generateExecutiveInsight(): void {
        const { MARGIN_STD, PAGE_WIDTH } = this;
        let y = this.doc.y + 30;

        // Section Title
        this.doc.font(this.FONT_SORA_BOLD).fontSize(14).fillColor(this.COLOR_DEEP_BLUE);
        this.doc.text('8. ORIGIN BI Executive Insight', MARGIN_STD, y);
        y += 20;

        // Insight box
        const boxWidth = PAGE_WIDTH - MARGIN_STD * 2;
        this.doc.rect(MARGIN_STD, y, boxWidth, 80).fill('#f0fdf4');

        this.doc.font(this.FONT_REGULAR).fontSize(10).fillColor('#166534');
        this.doc.text(this.data.executiveInsight, MARGIN_STD + 15, y + 12, {
            width: boxWidth - 30,
            align: 'justify',
        });
    }

    private addFooters(): void {
        const range = this.doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 1; i < totalPages; i++) {
            this.doc.switchToPage(range.start + i);
            this.doc.save();

            const footerY = this.PAGE_HEIGHT - 30;

            // Line
            this.doc.strokeColor('#e5e7eb').lineWidth(0.5);
            this.doc.moveTo(this.MARGIN_STD, footerY).lineTo(this.PAGE_WIDTH - this.MARGIN_STD, footerY).stroke();

            // Footer text
            this.doc.font(this.FONT_REGULAR).fontSize(8);
            this.doc.fillColor('#6b7280').text('Origin BI', this.MARGIN_STD, footerY + 8);
            this.doc.fillColor('#9ca3af').text(`#${this.data.reportId}`, this.MARGIN_STD + 50, footerY + 8);
            this.doc.text(`Page ${i + 1} of ${totalPages}`, this.PAGE_WIDTH - this.MARGIN_STD - 60, footerY + 8);

            this.doc.restore();
        }
    }
}
