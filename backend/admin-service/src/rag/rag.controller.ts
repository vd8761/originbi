import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  Req,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RagService } from './rag.service';
import { SyncService } from './sync.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { CustomReportService } from './custom-report.service';
import { PdfService } from '../common/pdf/pdf.service';

// DTO for query request
export class RagQueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsBoolean()
  generatePdf?: boolean;
}

// DTO for Career Report
export class CareerReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  currentRole: string;

  @IsString()
  @IsNotEmpty()
  currentJobDescription: string;

  @IsNumber()
  yearsOfExperience: number;

  @IsString()
  @IsNotEmpty()
  relevantExperience: string;

  @IsString()
  @IsNotEmpty()
  currentIndustry: string;

  @IsString()
  @IsNotEmpty()
  expectedFutureRole: string;

  @IsOptional()
  @IsString()
  behavioralStyle?: string;

  @IsOptional()
  @IsString()
  behavioralDescription?: string;

  @IsOptional()
  @IsNumber()
  agileScore?: number;
}

// DTO for single document ingestion
export class IngestDocumentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsIn([
    'candidate',
    'role',
    'course',
    'question',
    'tool',
    'career',
    'user',
    'program',
    'personality',
    'group',
    'corporate',
    'department',
    'stats',
  ])
  category: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sourceTable?: string;

  @IsOptional()
  sourceId?: number;
}

// DTO for bulk ingestion
export class BulkIngestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestDocumentDto)
  documents: IngestDocumentDto[];
}

// DTO for Overall Report
export class OverallReportDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsString()
  groupCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  programId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporateId?: number;

  @IsOptional()
  @IsString()
  title?: string;
}

// Response interface
export interface RagResponse {
  answer: string;
  candidates?: {
    name: string;
    score: number;
    suitability: string;
  }[];
  sources?: any[];
  searchType?: string;
  sql?: string;
  confidence?: number;
}

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly syncService: SyncService,
    private readonly futureRoleReportService: FutureRoleReportService,
    private readonly overallRoleFitmentService: OverallRoleFitmentService,
    private readonly customReportService: CustomReportService,
    private readonly pdfService: PdfService,
  ) { }

  /**
   * POST /rag/career-report
   * Generate Career Fitment & Future Role Readiness Report
   */
  @Post('career-report')
  async generateCareerReport(@Body() dto: CareerReportDto) {
    try {
      const report = await this.futureRoleReportService.generateReport(dto);
      return {
        success: true,
        reportId: report.reportId,
        report: report.fullReportText,
        generatedAt: report.generatedAt,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate career report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /rag/overall-report/pdf
   * Generate Overall Role Fitment Report PDF
   */
  @Get('overall-report/pdf')
  async generateOverallReportPdf(
    @Query() dto: OverallReportDto,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.overallRoleFitmentService.generatePdf(dto);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="overall-role-fitment.pdf"',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate overall report PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /rag/custom-report/pdf
   * Generate Custom Report PDF (e.g., Career Fitment)
   */
  @Get('custom-report/pdf')
  async generateCustomReportPdf(
    @Query('userId') userId: string,
    @Query('type') reportType: string = 'career_fitment',
    @Res() res: Response,
  ) {
    try {
      if (!userId) {
        throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
      }

      // Currently supporting career_fitment report
      if (reportType !== 'career_fitment') {
        throw new HttpException(`Report type '${reportType}' not supported yet`, HttpStatus.BAD_REQUEST);
      }

      // Generate report data
      const reportData = await this.customReportService.generateCareerFitmentData(parseInt(userId));

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateCareerFitmentReport(reportData);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="career-fitment-report-${reportData.reportId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate custom report PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/query
   * Main endpoint for RAG queries (Hybrid: Semantic + SQL)
   */
  @Post('query')
  async query(
    @Body() queryDto: RagQueryDto,
    @Req() req: any,
  ): Promise<RagResponse> {
    console.log(`🎯 RAG CONTROLLER: POST /query received at ${new Date().toISOString()}`);
    console.log(`📝 Request body:`, queryDto);
    console.log(`👤 Request user:`, req.user);
    
    try {
      const question = queryDto?.question;
      if (!question) {
        console.log(`❌ No question provided`);
        throw new Error('Question is required');
      }

      const user = req.user || {
        id: 1,
        role: 'ADMIN',
        corporateId: null,
      };

      console.log(`🔄 Calling ragService.query with question: "${question}"`);
      const result = await this.ragService.query(question, user);
      console.log(`✅ RAG Service returned result`);
      return result;
    } catch (error) {
      console.log(`❌ RAG Controller error:`, error);
      throw new HttpException(
        error.message || 'Failed to process query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/ingest
   * Ingest a single document into the RAG system
   */
  @Post('ingest')
  async ingest(@Body() dto: IngestDocumentDto) {
    try {
      const result = (await this.ragService.ingest(dto)) as any;
      if (result.success) {
        return { success: true, documentId: result.documentId };
      } else {
        throw new Error(result.error || 'Failed to ingest');
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to ingest document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/ingest/bulk
   * Ingest multiple documents at once
   */
  @Post('ingest/bulk')
  async bulkIngest(@Body() dto: BulkIngestDto) {
    try {
      return await this.ragService.bulkIngest(dto.documents);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to bulk ingest',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/index
   * Index existing database content (career_roles, questions, etc.)
   */
  @Post('index')
  async indexExistingData() {
    try {
      const result = await this.ragService.indexExistingData();
      return { success: true, ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to index data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /rag/status
   * Get RAG system status (pgvector, Jina, document count)
   */
  @Get('status')
  async status() {
    return await this.ragService.getStatus();
  }

  /**
   * GET /rag/health
   * Simple health check
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'rag' };
  }

  /**
   * POST /rag/seed (alias for /rag/index)
   */
  @Post('seed')
  async seedKnowledgeBase() {
    try {
      const result = await this.ragService.seedKnowledgeBase();
      return { success: true, ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to seed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/rebuild
   * Clear and rebuild the entire knowledge base
   */
  @Post('rebuild')
  async rebuildKnowledgeBase() {
    try {
      const result = await this.ragService.rebuildKnowledgeBase();
      return { success: true, message: 'Knowledge base rebuilt', ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to rebuild',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/query/pdf
   * Generate PDF from query result
   */
  @Post('query/pdf')
  async queryWithPdf(
    @Body() queryDto: RagQueryDto,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const user = req.user || { id: 1, role: 'ADMIN', corporateId: null };
      const result = await this.ragService.query(queryDto.question, user);
      const pdfBuffer = await this.ragService.generatePdf(
        result,
        queryDto.question,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="rag-report.pdf"',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate PDF',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /rag/sync/status
   * Get auto-sync status
   */
  @Get('sync/status')
  getSyncStatus() {
    return this.syncService.getStatus();
  }

  /**
   * POST /rag/sync/trigger
   * Manually trigger a sync
   */
  @Post('sync/trigger')
  async triggerSync() {
    try {
      const result = await this.syncService.triggerSync();
      return { success: true, ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to trigger sync',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /rag/reports/:id
   * Download a generated report
   */
  @Get('reports/:id')
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(process.cwd(), 'reports');
      const reportPath = path.join(reportsDir, `${id}.txt`);

      if (!fs.existsSync(reportPath)) {
        throw new Error('Report not found');
      }

      const content = fs.readFileSync(reportPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.txt"`);
      res.send(content);
    } catch (error) {
      throw new HttpException(
        error.message || 'Report not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
