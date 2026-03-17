import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  Query,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportQueueService } from './services/report.queue.service';
import { logger } from './helpers/logger';
import * as fs from 'fs';
import * as path from 'path';
import {
  schoolData,
  collegeData,
  employeeData,
  cxoData,
} from './mocks/mockData';
import { SchoolReport } from './reports/school/schoolReport';
import { CollegeReport } from './reports/college/collegeReport';
import { EmployeeReport } from './reports/employee/employeeReport';
import { CxoReport } from './reports/cxo/cxoReport';
import { fetchUserAssessmentData } from './helpers/groupReportHelper';
import { buildReportJSON } from './helpers/reportFactory';

@Controller('report')
export class ReportController {
  constructor(private readonly reportQueue: ReportQueueService) {}

  // 1. Placement Handbook Route (PDF)
  @Get('generate/placement/:group_id/:department_degree_id')
  generatePlacementReport(
    @Param('group_id') rawGroupId: string,
    @Param('department_degree_id') rawDeptDegreeId: string,
    @Query('json') json: string,
    @Res() res: Response,
  ): void {
    const groupId = parseInt(rawGroupId);
    const deptDegreeId = parseInt(rawDeptDegreeId);

    if (isNaN(groupId) || isNaN(deptDegreeId)) {
      res.status(HttpStatus.BAD_REQUEST).send('Invalid IDs provided');
      return;
    }

    logger.info(
      `[API] Start Placement Report: Group ${groupId}, Dept ${deptDegreeId}`,
    );

    const jobId = `placement_${groupId}_${deptDegreeId}_${Date.now()}`;

    this.reportQueue
      .processPlacementReport(groupId, deptDegreeId, jobId)
      .catch((err) => logger.error('Background Job Error', err));

    if (json === 'true') {
      res.json({
        success: true,
        jobId,
        statusUrl: `/download/status/${jobId}`,
      });
    } else {
      res.redirect(`/download/status/${jobId}`);
    }
  }

  // 2. Group Reports Route (ZIP)
  @Get('generate/group/:group_id')
  generateGroupReport(
    @Param('group_id') groupId: string,
    @Query('json') json: string,
    @Res() res: Response,
  ): void {
    logger.info(`[API] Start Group Report: Group ${groupId}`);

    const jobId = `group_${groupId}_${Date.now()}`;

    this.reportQueue
      .processGroupReports(groupId, jobId)
      .catch((err) => logger.error('Background Job Error', err));

    if (json === 'true') {
      res.json({
        success: true,
        jobId,
        statusUrl: `/download/status/${jobId}`,
      });
    } else {
      res.redirect(`/download/status/${jobId}`);
    }
  }

  // 3. User Reports Route (ZIP)
  @Post('generate/users')
  generateUserReport(
    @Body() body: { user_ids: string[] },
    @Res() res: Response,
  ): void {
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid input: user_ids array is required.');
      return;
    }

    logger.info(`[API] Start User Report: ${user_ids.length} users`);

    const jobId = `users_${Date.now()}`;

    this.reportQueue
      .processUserReports(user_ids, jobId)
      .catch((err) => logger.error('Background Job Error', err));

    res.json({
      success: true,
      statusUrl: `/download/status/${jobId}`,
    });
  }

  // 4. Single Student Report Route (PDF or JSON with ?api=true)
  @Get('generate/student/:student_id')
  async generateSingleUserReport(
    @Param('student_id') userId: string,
    @Query('api') apiMode: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!userId) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid input: student_id is required.');
      return;
    }

    // ── JSON API Mode ──
    if (apiMode === 'true') {
      logger.info(`[API] JSON API Request for student: ${userId}`);
      try {
        const groupData = await fetchUserAssessmentData([userId]);
        if (!groupData || groupData.length === 0) {
          res.status(HttpStatus.NOT_FOUND).json({
            success: false,
            error: 'No completed assessment found for this student.',
          });
          return;
        }
        const user = groupData[0];
        const reportJSON = await buildReportJSON(user);
        res.json({ success: true, data: reportJSON });
      } catch (error) {
        logger.error(`[API] JSON Report Generation failed for ${userId}:`, error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: (error as Error).message,
        });
      }
      return;
    }

    // ── Standard PDF Mode ──
    logger.info(`[API] Start Single Student Report: ${userId}`);

    const jobId = `student_${userId}_${Date.now()}`;

    this.reportQueue
      .processSingleUserReport(userId, jobId)
      .catch((err) => logger.error('Background Job Error', err));

    res.json({
      success: true,
      jobId,
      statusUrl: `/download/status/${jobId}`,
    });
  }

  // 5. Unified Status & Download Route
  @Get('download/status/:job_id')
  getDownloadStatus(
    @Param('job_id') jobId: string,
    @Query('json') json: string,
    @Headers('accept') acceptHeader: string,
    @Res() res: Response,
  ): void {
    const job = this.reportQueue.getJob(jobId);

    if (!job) {
      res
        .status(HttpStatus.NOT_FOUND)
        .send('Job not found or expired. Please start a new generation.');
      return;
    }

    if (json === 'true' || acceptHeader === 'application/json') {
      if (job.status === 'PROCESSING') {
        res.json({
          status: 'PROCESSING',
          progress: job.progress || 'Processing...',
        });
        return;
      }
      if (job.status === 'ERROR') {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ status: 'ERROR', error: job.error });
        return;
      }
      if (job.status === 'COMPLETED') {
        res.json({
          status: 'COMPLETED',
          downloadUrl: `/download/status/${jobId}?download=true`,
          password: job.password,
        });
        return;
      }
    }

    // --- Standard Browser HTML / File Download Handling ---

    if (job.status === 'PROCESSING') {
      const progress = job.progress || 'Processing...';
      res.send(`
                <html>
                    <head>
                        <meta http-equiv="refresh" content="3">
                        <title>${progress}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f9; }
                            .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h2>Generating Reports</h2>
                            <div class="loader"></div>
                            <p style="color:#666;">${progress}</p>
                            <p style="font-size:12px; color:#999;">Please wait, this page will refresh automatically.</p>
                        </div>
                    </body>
                </html>
            `);
      return;
    }

    if (job.status === 'ERROR') {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`
                <html>
                    <body style="font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:red;">Generation Failed</h1>
                        <p>${job.error}</p>
                        <a href="#" onclick="window.history.back()">Go Back</a>
                    </body>
                </html>
            `);
      return;
    }

    if (job.status === 'COMPLETED') {
      const downloadPath = job.zipPath || job.filePath;

      if (downloadPath && fs.existsSync(downloadPath)) {
        res.download(downloadPath, (err) => {
          if (err) {
            if (
              err.message === 'Request aborted' ||
              (err as { code?: string }).code === 'ECONNABORTED' ||
              (err as { code?: string }).code === 'ECONNRESET'
            ) {
              // Intentionally silent
            } else {
              logger.error(`[API] Download failed for job ${jobId}:`, err);
            }
          }
        });
      } else {
        res
          .status(HttpStatus.NOT_FOUND)
          .send(
            'File generated successfully but could not be found on the server.',
          );
      }
      return;
    }
  }

  // 6. Health Check
  @Get('report-status')
  healthCheck(): object {
    return {
      status: 'alive',
      service: 'report-service',
      timestamp: new Date().toISOString(),
    };
  }

  // 7. Mock Report Route (PDF)
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion */
  @Post('generate/mock')
  async generateMockReport(
    @Query('program') program: string,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    const programId = parseInt(program);

    if (isNaN(programId)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send('Invalid program ID provided. Use 1, 2, 3, or 4.');
      return;
    }

    let baseData: any;
    switch (programId) {
      case 1:
        baseData = schoolData;
        break;
      case 2:
        baseData = collegeData;
        break;
      case 3:
        baseData = employeeData;
        break;
      case 4:
        baseData = cxoData;
        break;
      default:
        res
          .status(HttpStatus.BAD_REQUEST)
          .send(
            'Unknown program ID. Supported: 1 (School), 2 (College), 3 (Employee), 4 (CXO)',
          );
        return;
    }

    // Deep merge function
    const deepMerge = (target: any, source: any): any => {
      if (typeof target !== 'object' || target === null) return source;
      if (typeof source !== 'object' || source === null) return source;
      if (Array.isArray(source)) return source; // Overwrite arrays

      const output = { ...target };
      Object.keys(source).forEach((key) => {
        if (typeof source[key] === 'object' && source[key] !== null) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
      return output;
    };

    const mergedData = deepMerge(baseData, body);
    mergedData.program_type = programId;

    const tempDir = path.join(process.cwd(), 'dist', 'temp_reports', 'mock');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `mock_${programId}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);

    const pdfOptions: PDFKit.PDFDocumentOptions = {
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false,
      },
    };

    try {
      logger.info(`[API] Generating Mock Report for program ${programId}`);
      switch (programId) {
        case 1:
          await new SchoolReport(mergedData as any, pdfOptions).generate(
            filePath,
          );
          break;
        case 2:
          await new CollegeReport(mergedData as any, pdfOptions).generate(
            filePath,
          );
          break;
        case 3:
          await new EmployeeReport(mergedData as any, pdfOptions).generate(
            filePath,
          );
          break;
        case 4:
          await new CxoReport(mergedData as any, pdfOptions).generate(filePath);
          break;
      }

      res.download(filePath, fileName, (err) => {
        if (err) {
          logger.error(`[API] Mock Report Download failed:`, err);
        }
        // Cleanup mock file after sending
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // Ignore cleanup errors
          }
        }
      });
    } catch (error) {
      logger.error(`[API] Mock Report Generation failed:`, error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error generating mock report');
    }
  }
}
