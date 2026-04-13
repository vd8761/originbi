import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs.query.dto';
import { ListJobCandidatesQueryDto } from './dto/list-job-candidates.query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { BulkApplyCandidatesDto } from './dto/bulk-apply-candidates.dto';

@Controller('corporate/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async createJob(@Body() dto: CreateJobDto, @Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.createJob(email, dto);
  }

  @Get()
  async listJobs(@Query() query: ListJobsQueryDto, @Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.listJobs(email, query);
  }

  @Get(':jobId')
  async getJobById(@Param('jobId') jobId: string, @Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.getJobById(email, Number(jobId));
  }

  @Patch(':jobId')
  async updateJob(
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.updateJob(email, Number(jobId), dto);
  }

  @Patch(':jobId/status')
  async updateJobStatus(
    @Param('jobId') jobId: string,
    @Body() dto: { status: string; note?: string },
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!dto?.status) throw new BadRequestException('Status is required');
    return this.jobsService.updateJobStatus(email, Number(jobId), dto.status, dto.note);
  }

  @Get(':jobId/candidates')
  async listJobCandidates(
    @Param('jobId') jobId: string,
    @Query() query: ListJobCandidatesQueryDto,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.listJobCandidates(email, Number(jobId), query);
  }

  @Patch(':jobId/candidates/:applicationId/status')
  async updateCandidateApplicationStatus(
    @Param('jobId') jobId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.updateApplicationStatus(
      email,
      Number(jobId),
      Number(applicationId),
      dto,
    );
  }

  @Post(':jobId/candidates/bulk-apply')
  async bulkApplyCandidates(
    @Param('jobId') jobId: string,
    @Body() dto: BulkApplyCandidatesDto,
    @Query('email') email: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.jobsService.bulkApplyCandidates(email, Number(jobId), dto);
  }
}
