import { Injectable, Logger } from '@nestjs/common';
import { OverallFitmentReport, OverallReportData } from './overall-fitment-report';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async generateOverallReport(data: OverallReportData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const report = new OverallFitmentReport(data);
                const buffers: Buffer[] = [];

                report.doc.on('data', (buffer) => {
                    buffers.push(buffer);
                });

                report.doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    this.logger.log(`📄 Generated Overall Report PDF: ${pdfData.length} bytes`);
                    resolve(pdfData);
                });

                report.doc.on('error', (err) => {
                    this.logger.error(`❌ Error generating PDF: ${err.message}`, err.stack);
                    reject(err);
                });

                // Trigger generation
                report.generate();

            } catch (error) {
                this.logger.error('Failed to initiate PDF generation', error);
                reject(error);
            }
        });
    }

    // Future: generateCustomReport(data: CustomReportData) ...
}
