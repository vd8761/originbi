import {
    Controller,
    Post,
    Body,
    Get,
    Res,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RagService } from './rag.service';

// DTO for query request
export class RagQueryDto {
    @IsString()
    @IsNotEmpty()
    question: string;

    @IsOptional()
    @IsBoolean()
    generatePdf?: boolean;
}

// DTO for single document ingestion
export class IngestDocumentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsIn(['candidate', 'role', 'course', 'question', 'tool'])
    category: 'candidate' | 'role' | 'course' | 'question' | 'tool';

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
}

@Controller('rag')
export class RagController {
    constructor(private readonly ragService: RagService) { }

    /**
     * POST /rag/query
     * Main endpoint for RAG queries (Hybrid: Semantic + SQL)
     */
    @Post('query')
    async query(
        @Body() queryDto: RagQueryDto,
        @Req() req: any,
    ): Promise<RagResponse> {
        try {
            const question = queryDto?.question;
            if (!question) {
                throw new Error('Question is required');
            }

            const user = req.user || {
                id: 1,
                role: 'ADMIN',
                corporateId: null,
            };

            return await this.ragService.query(question, user);
        } catch (error) {
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
            const result = await this.ragService.ingest(dto);
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
            const pdfBuffer = await this.ragService.generatePdf(result, queryDto.question);

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
}
