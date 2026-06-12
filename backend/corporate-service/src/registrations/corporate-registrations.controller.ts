import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CorporateRegistrationsService } from './corporate-registrations.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Controller('corporate/registrations')
export class CorporateRegistrationsController {
  constructor(private readonly service: CorporateRegistrationsService) {}

  @Post()
  async register(
    @Body() dto: CreateCandidateDto,
    @Query('userId') userId: number,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.service.registerCandidate(dto, Number(userId));
  }

  @Get('individual-exam-preview')
  async previewIndividualExam(
    @Query('registrationId') registrationId: number,
    @Query('userId') userId: number,
  ) {
    if (!userId) throw new BadRequestException('User ID is required');
    if (!registrationId)
      throw new BadRequestException('Registration ID is required');
    return this.service.previewIndividualExam(
      Number(registrationId),
      Number(userId),
    );
  }

  @Post('assign-individual-exam')
  async assignIndividualExam(
    @Body()
    body: { registrationId: number; examStart?: string; examEnd?: string },
    @Query('userId') userId: number,
  ) {
    if (!userId) throw new BadRequestException('User ID is required');
    return this.service.assignIndividualExam(
      {
        registrationId: Number(body.registrationId),
        examStart: body.examStart,
        examEnd: body.examEnd,
      },
      Number(userId),
    );
  }
}
