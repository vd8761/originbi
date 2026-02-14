import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { CorporateJDMatchingService, JDMatchResult } from './jd-matching.service';

// ═══════════════════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════════════════

class JDMatchRequestDto {
  email: string;
  jobDescription: string;
  groupId?: number;
  topN?: number;
  minScore?: number;
}

class ChatJDMatchRequestDto {
  email: string;
  message: string;
  groupId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

@Controller('jd-matching')
export class JDMatchingController {
  constructor(
    private readonly jdMatchingService: CorporateJDMatchingService,
  ) {}

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
      throw new BadRequestException('A detailed job description is required (minimum 20 characters)');
    }

    const corporateId = await this.jdMatchingService.getCorporateAccountId(dto.email);

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
   * Chat-style JD matching — accepts natural language messages
   * Returns formatted markdown response for chat display
   */
  @Post('chat')
  async chatJDMatch(
    @Body() dto: ChatJDMatchRequestDto,
  ): Promise<{ success: boolean; answer: string; isJDMatch: boolean; data?: JDMatchResult }> {
    if (!dto.email) throw new BadRequestException('Email is required');
    if (!dto.message) throw new BadRequestException('Message is required');

    // Check if the message is a JD matching request
    const isJDMatch = this.jdMatchingService.isJDMatchingRequest(dto.message);

    if (!isJDMatch) {
      return {
        success: true,
        answer: `I can help you find the best candidates from your team! To use JD matching, try:\n\n• "Find candidates suitable for a project manager role requiring leadership and analytical thinking"\n• "Match employees for: Senior Software Engineer with strong problem-solving skills"\n• "Who is best fit for a customer success manager?"\n\nProvide a job description and I'll analyze your team's behavioral profiles to find the best matches.`,
        isJDMatch: false,
      };
    }

    const corporateId = await this.jdMatchingService.getCorporateAccountId(dto.email);
    const jobDescription = this.jdMatchingService.extractJDFromMessage(dto.message);

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
      ],
    };
  }
}
