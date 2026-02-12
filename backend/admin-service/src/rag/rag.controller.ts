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
  UseGuards,
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
import { ChatMemoryService } from './chat-memory.service';
import { PdfService } from '../common/pdf/pdf.service';

// RBAC: Auth guard & user context
import { CognitoUniversalGuard } from '../auth/cognito-universal.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserContext } from '../common/interfaces/user-context.interface';

// DTO for query request
export class RagQueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsBoolean()
  generatePdf?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  conversationId?: number;
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
  private readonly logger = new Logger(RagController.name);

  constructor(
    private readonly ragService: RagService,
    private readonly syncService: SyncService,
    private readonly futureRoleReportService: FutureRoleReportService,
    private readonly overallRoleFitmentService: OverallRoleFitmentService,
    private readonly customReportService: CustomReportService,
    private readonly chatMemory: ChatMemoryService,
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
 * Fetches user by ID, looks up their name, and generates report with available assessment data
 */
  @Get('custom-report/pdf')
  async generateCustomReportPdf(
    @Query('userId') userId: string,
    @Query('name') userName: string,
    @Query('type') reportType: string = 'career_fitment',
    @Res() res: Response,
  ) {
    try {
      if (!userId && !userName) {
        throw new HttpException('userId or name is required', HttpStatus.BAD_REQUEST);
      }

      // Currently supporting career_fitment report
      if (reportType !== 'career_fitment') {
        throw new HttpException(`Report type '${reportType}' not supported yet`, HttpStatus.BAD_REQUEST);
      }

      let reportData;

      // If we have a userName, use the chat-based method (more flexible, handles incomplete data)
      if (userName) {
        this.logger.log(`📊 Generating report by name: ${userName}`);
        reportData = await this.customReportService.generateChatBasedReport({
          name: userName,
          currentRole: 'Not Specified',
          currentJobDescription: '',
          yearsOfExperience: 0,
          relevantExperience: '',
          currentIndustry: 'Not Specified',
          expectedFutureRole: 'Not Specified',
          expectedIndustry: '',
        });
      } else {
        // Fallback to userId lookup - first get the user's name, then use chat-based method
        this.logger.log(`📊 Generating report by userId: ${userId}`);

        // Lookup user name from registration
        const userLookupQuery = `
          SELECT r.full_name, r.metadata 
          FROM registrations r 
          WHERE r.user_id = $1 AND r.is_deleted = false 
          ORDER BY r.created_at DESC 
          LIMIT 1
        `;
        const lookupResult = await this.customReportService['dataSource'].query(userLookupQuery, [parseInt(userId)]);

        if (!lookupResult || lookupResult.length === 0) {
          throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
        }

        const registration = lookupResult[0];
        const regMetadata = registration.metadata || {};

        // Use the chat-based method with the user's name and any metadata we have
        reportData = await this.customReportService.generateChatBasedReport({
          name: registration.full_name,
          currentRole: regMetadata.currentRole || 'Not Specified',
          currentJobDescription: regMetadata.currentJobDescription || '',
          yearsOfExperience: regMetadata.yearsOfExperience || 0,
          relevantExperience: regMetadata.relevantExperience || '',
          currentIndustry: regMetadata.currentIndustry || 'Not Specified',
          expectedFutureRole: regMetadata.expectedFutureRole || 'Not Specified',
          expectedIndustry: regMetadata.expectedIndustry || '',
        });
      }

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateCareerFitmentReport(reportData);

      // Sanitize filename - remove all special characters that could break HTTP headers
      const safeFilename = `career-fitment-report-${reportData.reportId.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
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
   * POST /rag/chat-report/pdf
   * Generate Custom Report PDF from chat-provided profile data
   * Does NOT require user to be in database - uses AI to generate report from user input
   */
  @Post('chat-report/pdf')
  async generateChatBasedReportPdf(
    @Body() profileData: {
      name: string;
      currentRole: string;
      currentJobDescription?: string;
      yearsOfExperience: number;
      relevantExperience?: string;
      currentIndustry: string;
      expectedFutureRole: string;
      expectedIndustry?: string;
    },
    @Res() res: Response,
  ) {
    try {
      if (!profileData.name) {
        throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
      }

      // Generate report data from chat input
      const reportData = await this.customReportService.generateChatBasedReport({
        name: profileData.name,
        currentRole: profileData.currentRole || 'Not Specified',
        currentJobDescription: profileData.currentJobDescription || '',
        yearsOfExperience: profileData.yearsOfExperience || 0,
        relevantExperience: profileData.relevantExperience || '',
        currentIndustry: profileData.currentIndustry || 'Not Specified',
        expectedFutureRole: profileData.expectedFutureRole || 'Not Specified',
        expectedIndustry: profileData.expectedIndustry || '',
      });

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateCareerFitmentReport(reportData);

      // Sanitize filename - remove all special characters that could break HTTP headers
      const safeFilename = `chat-career-report-${reportData.reportId.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate chat-based report PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /rag/query
   * Main endpoint for RAG queries (Hybrid: Semantic + SQL)
   *
   * RBAC: CognitoUniversalGuard handles authentication & enrichment:
   *   - Verifies Cognito token (if present) and enriches with DB IDs
   *   - Falls back to X-User-Context header (validated via DB)
   *   - Defaults to anonymous STUDENT (most restricted) if no auth
   *
   * The enriched UserContext contains:
   *   - id: numeric users.id
   *   - role: ADMIN | CORPORATE | STUDENT
   *   - corporateId: corporate_accounts.id (for CORPORATE role)
   *   - registrationId: registrations.id (for STUDENT role)
   */
  @UseGuards(CognitoUniversalGuard)
  @Post('query')
  async query(
    @Body() queryDto: RagQueryDto,
    @CurrentUser() user: UserContext,
  ): Promise<RagResponse & { conversationId?: number }> {
    this.logger.log(`🎯 POST /query | user=${user.id} role=${user.role} corporateId=${user.corporateId || 'N/A'}`);

    try {
      const question = queryDto?.question;
      if (!question) {
        throw new Error('Question is required');
      }

      this.logger.log(`🔐 RBAC context: id=${user.id}, role=${user.role}, corporateId=${user.corporateId || 'N/A'}`);

      // ── Chat memory: resolve or create conversation ──
      let convId = queryDto.conversationId || 0;
      if (user.id > 0) {
        try {
          if (convId > 0) {
            // Verify ownership
            const conv = await this.chatMemory.getConversation(convId, user.id);
            if (!conv) convId = 0; // not found → create new
          }
          if (convId === 0) {
            const conv = await this.chatMemory.createConversation(user.id, user.role);
            convId = conv.id;
          }
          // Save user message
          await this.chatMemory.addMessage(convId, 'user', question);
        } catch (e) {
          this.logger.warn(`Chat memory save failed (non-blocking): ${e}`);
        }
      }

      const result = await this.ragService.query(question, user);
      this.logger.log(`✅ RAG query completed`);

      // ── Chat memory: save assistant reply + auto-title ──
      if (user.id > 0 && convId > 0) {
        try {
          await this.chatMemory.addMessage(convId, 'assistant', result.answer, {
            searchType: result.searchType,
            confidence: result.confidence,
          });
          // Auto-generate title after first exchange
          await this.chatMemory.autoGenerateTitle(convId, user.id);
        } catch (e) {
          this.logger.warn(`Chat memory reply save failed (non-blocking): ${e}`);
        }
      }

      return { ...result, conversationId: convId || undefined };
    } catch (error) {
      this.logger.error(`❌ RAG Controller error: ${error.message}`);
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
   * Generate PDF from query result (RBAC enforced)
   */
  @UseGuards(CognitoUniversalGuard)
  @Post('query/pdf')
  async queryWithPdf(
    @Body() queryDto: RagQueryDto,
    @CurrentUser() user: UserContext,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`📄 PDF query | user=${user.id} role=${user.role}`);
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

  /**
   * GET /rag/chat-report/download
   * Download a chat-based career fitment report as PDF
   * Profile data is passed as base64-encoded JSON in query param
   */
  @Get('chat-report/download')
  async downloadChatReport(
    @Query('profile') encodedProfile: string,
    @Res() res: Response,
  ) {
    try {
      if (!encodedProfile) {
        throw new HttpException(
          'Profile data is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decode the base64 profile data
      const profileJson = Buffer.from(encodedProfile, 'base64').toString('utf-8');
      const profileData = JSON.parse(profileJson);

      this.logger.log(`📄 Generating chat-based report for: ${profileData.name}`);

      // Generate the report data using CustomReportService
      const reportData = await this.customReportService.generateChatBasedReport(profileData);

      // Generate PDF using PdfService
      const pdfBuffer = await this.pdfService.generateCareerFitmentReport(reportData);

      // Sanitize filename - remove all special characters that could break HTTP headers
      const safeFilename = `${profileData.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_Career_Fitment_Report.pdf`;
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Chat report download error: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to generate report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
