import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

@Controller('admin/assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('assign-group-exam')
  async assignGroupExam(
    @Body()
    body: {
      groupId: number;
      programId: number;
      examStart?: string;
      examEnd?: string;
      sendEmail?: boolean;
    },
  ) {
    return this.assessmentService.assignGroupExam({
      groupId: Number(body.groupId),
      programId: Number(body.programId),
      examStart: body.examStart,
      examEnd: body.examEnd,
      sendEmail: body.sendEmail,
    });
  }

  @Get('sessions')
  async findAllSessions(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('emailStatus') emailStatus?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    return this.assessmentService.findAllSessions(
      pageNum,
      limitNum,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      status,
      userId,
      type,
      emailStatus,
      groupBy,
    );
  }

  @Get('group/:id')
  async getGroupSessionDetails(@Param('id') id: string) {
    return this.assessmentService.findGroupSessionDetails(Number(id));
  }

  @Get('group-combined/:groupId/:programId')
  async getGroupCombinedDetails(
    @Param('groupId') groupId: string,
    @Param('programId') programId: string,
  ) {
    return this.assessmentService.findGroupCombinedDetails(
      Number(groupId),
      Number(programId),
    );
  }

  @Get('group/:id/eligible-candidates')
  async getEligibleCandidates(
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    return this.assessmentService.findEligibleCandidatesForGroupAssessment(
      Number(id),
      search,
    );
  }

  @Post('group/:id/candidates')
  async addCandidateToGroupAssessment(
    @Param('id') id: string,
    @Body() body: { registrationId: number },
  ) {
    return this.assessmentService.addCandidateToGroupAssessment(
      Number(id),
      Number(body.registrationId),
    );
  }

  @Get('group/:id/department-stats')
  async getGroupDepartmentStats(@Param('id') id: string) {
    return this.assessmentService.findGroupDepartmentStats(Number(id));
  }

  @Get('sessions/:id')
  async getSessionDetails(@Param('id') id: string) {
    return this.assessmentService.getSessionDetails(Number(id));
  }

  @Get('levels')
  async getLevels() {
    return this.assessmentService.getLevels();
  }
}
