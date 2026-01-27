import * as fs from 'fs';
import { BaseReport } from './base-report';
import * as path from 'path';

export interface RoleFitment {
    roleDesignation: string;
    department: string;
    requiredSkills: string;
    toolsTech: string;
    certifications: string;
}

export interface StudentEntry {
    name: string;
    yearOfStudy: string;
    reportNumber: string;
}

export interface PersonalityGroup {
    personalityName: string;
    personalityDescription: string;
    topRoles: RoleFitment[];
    eligibleRoles: any[]; // Skipping specific type for now
    students: StudentEntry[];
}

export interface OverallReportData {
    reportId: string;
    title: string;
    generatedAt: Date;
    totalStudents: number;
    personalityGroups: PersonalityGroup[];
    fullReportText?: string;
}

export class OverallFitmentReport extends BaseReport {
    private data: OverallReportData;

    constructor(data: OverallReportData) {
        super();
        this.data = data;
    }

    public generate(outputPath?: string): Buffer {
        // If path provided, write to file, else just return buffer (handled by PDFKit internally via buffers usually, but here we can pipe to a stream or memory)
        // PDFKit writes to a stream. 
        // We'll return a Promise<Buffer> in the service using a wrapper. 
        // For this method, let's assume it sets up the doc structure.

        // 1. Cover Page
        this.generateCoverPage();

        // 2. Executive Summary
        this._currentBackground = 'images/Content_Background.jpg'; // Relative to assets
        this._useStdMargins = true;
        this.doc.addPage();
        this.generateExecutiveSummary();

        // 3. Detailed Breakdown by Personality
        this.data.personalityGroups.forEach(group => {
            this.doc.addPage();
            this.generatePersonalityGroupPage(group);
        });

        // 4. Footer/End
        this.addFooters();
        this.doc.end();

        // Note: The actual buffer retrieval happens where the doc is piped.
        // We'll handle piping in the Service.
        return Buffer.alloc(0); // Placeholder
    }

    private generateCoverPage(): void {
        const bgPath = this.getAssetPath('images/Cover_Background.jpg');
        if (fs.existsSync(bgPath)) {
            try {
                this.doc.image(bgPath, 0, 0, {
                    width: this.PAGE_WIDTH,
                    height: this.PAGE_HEIGHT,
                });
            } catch (e) {
                console.warn("Error loading cover image", e);
            }
        } else {
            this.doc
                .rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT)
                .fill('#f0f0f0');
        }

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(38)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.title, 50, 30, { width: 400 });

        // Bottom Details
        const footerY = this.PAGE_HEIGHT - 90;
        this.doc.opacity(1);
        this.doc
            .font(this.FONT_SEMIBOLD)
            .fontSize(20)
            .fillColor(this.COLOR_BLACK)
            .text('Talent Analytics', 30, footerY);

        const dateString = new Date(this.data.generatedAt).toLocaleDateString(
            'en-GB',
            { day: 'numeric', month: 'long', year: 'numeric' },
        );
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(16)
            .text(dateString, 30, footerY + 25);

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(16)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(`Total Students: ${this.data.totalStudents}`, this.PAGE_WIDTH - 300, footerY + 25, {
                width: 270,
                align: 'right',
            });
    }

    private generateExecutiveSummary(): void {
        this.h1('Executive Summary');
        this.p(`This report provides a comprehensive analysis of the role fitment for ${this.data.totalStudents} students. Based on their personality traits and capabilities, we have identified key groups and their ideal career paths.`);

        this.doc.moveDown(1);

        // Distribution Chart
        this.h2('Personality Distribution');

        const chartData = this.data.personalityGroups.map(group => {
            const count = group.students.length;
            const percentage = (count / this.data.totalStudents) * 100;
            // Simple color cycle
            const colorMap: any = {
                'Dominance': [220, 53, 69], // Red
                'Influence': [255, 193, 7], // Yellow
                'Steadiness': [40, 167, 69], // Green
                'Conscientiousness': [23, 162, 184] // Cyan
            };
            // Fallback for custom names "Charismatic Leader" etc
            const defaultColor = [21, 0, 137]; // Deep Blue

            return {
                label: group.personalityName.split(' ')[0], // Short label
                value: percentage,
                color: defaultColor
            };
        });

        this.drawSingleBarChart(chartData, { maxBarHeight: 150 });

        this.doc.moveDown(2);

        this.h2('Group Overview');
        const headers = ['Personality Profile', 'Students', 'Key Strengths'];
        const rows = this.data.personalityGroups.map(g => [
            g.personalityName,
            g.students.length.toString(),
            g.personalityDescription.slice(0, 100) + '...'
        ]);

        this.table(headers, rows, {
            colWidths: [150, 60, 300],
            fontSize: 9
        });
    }

    private generatePersonalityGroupPage(group: PersonalityGroup): void {
        this.h1(group.personalityName);
        this.pHtml(group.personalityDescription);

        this.doc.moveDown(1);

        this.h2('Recommended Roles & Career Paths');

        const roleHeaders = ['Role', 'Department', 'Key Skills'];
        const roleRows = group.topRoles.map(r => [
            r.roleDesignation,
            r.department,
            r.requiredSkills
        ]);

        this.table(roleHeaders, roleRows, {
            fontSize: 9,
            headerColor: '#E8E8E8'
        });

        this.doc.moveDown(2);

        this.h2(`Students Matching ${group.personalityName}`);
        this.p(`${group.students.length} students identified with this profile.`);

        const studentHeaders = ['Student Name', 'Report No.', 'Year'];
        const studentRows = group.students.map(s => [
            s.name,
            s.reportNumber,
            s.yearOfStudy
        ]);

        this.table(studentHeaders, studentRows, {
            fontSize: 9,
            colWidths: [200, 100, 100]
        });
    }

    private addFooters(): void {
        const range = this.doc.bufferedPageRange();
        const totalPages = range.count;

        for (let i = 1; i < totalPages; i++) {
            this.doc.switchToPage(range.start + i);

            const footerY = this.PAGE_HEIGHT - 30; // 30 units from bottom

            this.doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

            // Line
            this.doc
                .lineWidth(0.5)
                .strokeColor('gray')
                .moveTo(this.MARGIN_STD, footerY - 10)
                .lineTo(this.PAGE_WIDTH - this.MARGIN_STD, footerY - 10)
                .stroke();

            // Text
            this.doc.font(this.FONT_REGULAR).fontSize(8).fillColor('gray');

            this.doc.text('OriginBI Role Fitment Report', this.MARGIN_STD, footerY);

            this.doc.text(
                `Page ${i + 1} of ${totalPages}`,
                this.PAGE_WIDTH - 100,
                footerY,
                { width: 100 - this.MARGIN_STD, align: 'right' }
            );
        }
    }
}
