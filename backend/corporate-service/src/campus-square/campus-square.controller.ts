import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CampusSquareService } from './campus-square.service';
import { RegisterCampusSquareCandidateDto } from './dto/register-campus-square.dto';

@Controller('campus-square')
export class CampusSquareController {
  constructor(private readonly campusSquareService: CampusSquareService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'campus-square',
      assessmentProgram: 'School Students (Level 1 Behavioral)',
      totalQuestions: 30,
      breakdown: {
        mainDiscQuestions: 24,
        surveyQuestions: 6,
      },
      corporateAccountId: 22,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerCandidate(
    @Body() dto: RegisterCampusSquareCandidateDto,
  ) {
    return this.campusSquareService.registerCandidate(dto);
  }

  @Post('sync-results')
  @HttpCode(HttpStatus.OK)
  async syncResults(@Query('limit') limit?: number) {
    return this.campusSquareService.syncCompletedAssessments(
      limit ? Number(limit) : 50,
    );
  }
}
