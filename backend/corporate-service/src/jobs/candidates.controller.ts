import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ListCandidatesQueryDto } from './dto/list-candidates.query.dto';

@Controller('corporate/candidates')
export class CorporateCandidatesController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async listCandidates(
    @Query() query: ListCandidatesQueryDto,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.listCandidates(email, query);
  }

  @Get(':registrationId/applications')
  async getCandidateApplications(
    @Param('registrationId') registrationId: string,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.getCandidateApplications(email, Number(registrationId));
  }
}
