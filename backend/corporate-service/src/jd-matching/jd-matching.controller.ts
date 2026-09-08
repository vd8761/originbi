import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  CorporateJDMatchingService,
  JDMatchResult,
  CandidateProfile,
} from './jd-matching.service';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

// ═══════════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════════

class JDMatchRequestDto {
  @IsString()
  email: string;

  @IsString()
  jobDescription: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  topN?: number;

  @IsOptional()
  @IsNumber()
  minScore?: number;
}

export class ChatJDMatchRequestDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  groupId?: number;

  @IsOptional()
  history?: { role: 'user' | 'assistant'; content: string }[];

  // ── Interview Transcript Mode (REQ 8) ──────────────────────────────────
  @IsOptional()
  @IsBoolean()
  interviewMode?: boolean;

  @IsOptional()
  @IsString()
  jdText?: string;

  @IsOptional()
  @IsArray()
  transcripts?: { name: string; transcript: string }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

@Controller('jd-matching')
export class JDMatchingController {
  constructor(private readonly jdMatchingService: CorporateJDMatchingService) {}

  /**
   * POST /jd-matching/match
   * Full JD matching with structured input
   * Corporate-scoped: only returns candidates from the corporate account
   */
  @Post('match')
  async matchCandidates(
    @Body() dto: JDMatchRequestDto,
  ): Promise<{ success: boolean; data: JDMatchResult }> {
    if (!dto.email) throw new BadRequestException('Email is required');
    if (!dto.jobDescription || dto.jobDescription.length < 20) {
      throw new BadRequestException(
        'A detailed job description is required (minimum 20 characters)',
      );
    }

    const corporateId = await this.jdMatchingService.getCorporateAccountId(
      dto.email,
    );

    const result = await this.jdMatchingService.matchCandidatesToJD(
      dto.jobDescription,
      corporateId,
      {
        groupId: dto.groupId,
        topN: dto.topN || 10,
        minScore: dto.minScore || 0,
        includeInsights: true,
        includeWorkforceInsights: true,
      },
    );

    return { success: true, data: result };
  }

  /**
   * POST /jd-matching/chat
   * Chat-style JD matching - accepts natural language messages
   * Returns formatted markdown response for chat display
   */
  @Post('chat')
  async chatJDMatch(@Body() dto: ChatJDMatchRequestDto): Promise<{
    success: boolean;
    answer: string;
    isJDMatch: boolean;
    data?: JDMatchResult;
  }> {
    if (!dto.email) throw new BadRequestException('Email is required');

    // ── Interview Transcript Mode (REQ 8) ─────────────────────────────────
    // No DB fetch — purely GPT analysis of pasted JD + transcripts
    if (dto.interviewMode && dto.jdText && dto.transcripts?.length) {
      const answer = await this.jdMatchingService.handleInterviewAnalysis(
        dto.jdText,
        dto.transcripts,
        dto.history || [],
      );
      return { success: true, answer, isJDMatch: false };
    }

    if (!dto.message) throw new BadRequestException('Message is required');

    // Check if the message is a JD matching request
    const isJDMatch = this.jdMatchingService.isJDMatchingRequest(dto.message);

    const corporateId = await this.jdMatchingService.getCorporateAccountId(
      dto.email,
    );

    if (!isJDMatch) {
      // It's not a JD Match, so it must be an HR / Employee analysis query
      const hrAnswer = await this.jdMatchingService.analyzeHRQuery(
        corporateId,
        dto.message,
        dto.history || [],
      );
      
      return {
        success: true,
        answer: hrAnswer,
        isJDMatch: false,
      };
    }

    const jobDescription = this.jdMatchingService.extractJDFromMessage(
      dto.message,
    );

    if (!jobDescription || jobDescription.length < 15) {
      return {
        success: true,
        answer: `**🎯 JD Talent Matching**\n\nPlease provide more details about the role. You can:\n\n**Paste a full JD:**\n> Find candidates for: Senior Software Engineer responsible for backend development, requiring 5+ years experience, strong leadership...\n\n**Or describe the role:**\n• "Match employees for a team lead needing analytical thinking and collaboration"\n• "Who fits best for a customer support role requiring empathy and communication?"\n\nThe more detail you provide, the more accurate the matching!`,
        isJDMatch: true,
      };
    }

    const result = await this.jdMatchingService.matchCandidatesToJD(
      jobDescription,
      corporateId,
      {
        groupId: dto.groupId,
        topN: 10,
        includeInsights: true,
        includeWorkforceInsights: true,
      },
    );

    const answer = this.jdMatchingService.formatMatchResultForChat(result);

    return {
      success: true,
      answer,
      isJDMatch: true,
      data: result,
    };
  }

  /**
   * GET /jd-matching/employees
   * Returns the employee list with trait codes for the frontend cache.
   * Only returns safe fields — NO raw scores, NO blended style name.
   */
  @Get('employees')
  async getEmployees(
    @Headers('authorization') authHeader: string,
  ): Promise<CandidateProfile[]> {
    // Extract email from the service (it reads from the JWT via the corporate account lookup)
    // For now we return for all employees of the corporate account via token context
    const email = ''; // Will be resolved by service via token
    const corporateId = await this.jdMatchingService.getCorporateIdByEmail(email, authHeader);
    if (!corporateId) {
      throw new BadRequestException('Could not identify corporate account');
    }
    const candidates = await this.jdMatchingService.fetchCorporateCandidates(corporateId);
    return candidates;
  }

  /**
   * GET /jd-matching/health
   * Health check endpoint
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'corporate-jd-matching',
      version: '2.0.0',
      features: [
        'corporate-scoped-matching',
        'multi-factor-scoring',
        'workforce-intelligence',
        'ai-insights',
        'success-prediction',
        'retention-risk-analysis',
        'interview-transcript-analysis',
        'conversation-memory',
      ],
    };
  }
}
