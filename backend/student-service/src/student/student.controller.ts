import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { StudentService } from './student.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly boss: PgBossService,
  ) {}

  @Post('profile')
  async getProfile(@Body() body: { email: string }): Promise<any> {
    return this.studentService.getProfile(body.email);
  }

  @Post('streams')
  async getSchoolStreams() {
    return this.studentService.getSchoolStreams();
  }

  @Post('seed')
  seedStudent(@Body() body: { email: string; fullName: string }) {
    return this.studentService.createTestStudent(body.email, body.fullName);
  }

  @Post('assessment-status')
  async getAssessmentStatus(@Body() body: { userId: number }) {
    return this.studentService.checkAssessmentStatus(body.userId);
  }

  @Post('login-status')
  async checkLoginRedirect(@Body() body: { email: string }) {
    return this.studentService.checkLoginStatus(body.email);
  }

  @Post('progress')
  async getAssessmentProgress(@Body() body: { email: string }) {
    return this.studentService.getAssessmentProgress(body.email);
  }

  @Post('complete-first-login')
  async completeFirstLogin(@Body() body: { email: string }) {
    await this.studentService.completeFirstLogin(body.email);
    return { success: true };
  }

  @Post('register')
  async register(@Body() dto: CreateRegistrationDto) {
    return this.studentService.register(dto);
  }

  @Post('validate-registration')
  async validateRegistration(
    @Body() dto: { email: string; mobile_number?: string },
  ) {
    return this.studentService.validateRegistration(dto);
  }

  @Post('assessment-complete')
  async completeAssessment(@Body() body: { userId: number }) {
    const logger = new Logger('AssessmentComplete');
    logger.log(`Received assessment-complete for userId: ${body.userId}`);
    try {
      const result = await this.boss.scheduleJob(
        'assessment-email-queue',
        { userId: body.userId },
        {
          retryLimit: 3,
          retryBackoff: true,
        },
      );
      logger.log(
        `Job enqueued successfully. Result: ${JSON.stringify(result)}`,
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(`Failed to enqueue job: ${error.message}`, error.stack);
      throw err;
    }

    return { message: 'Assessment completion processing started' };
  }

  @Post('assessment-level-unlocked')
  async levelUnlocked(@Body() body: { userId: number; levelNumber: number }) {
    await this.studentService.handleLevelUnlocked(
      body.userId,
      body.levelNumber,
    );
    return { success: true };
  }

  @Post('affiliate/validate')
  async validateAffiliate(@Body() body: { code: string }) {
    return this.studentService.validateReferralCode(body.code);
  }

  @Post('send-report-email')
  async sendReportEmail(@Body() body: { userId: number; toEmail?: string }) {
    const logger = new Logger('SendReportEmail');
    logger.log(
      `Received send-report-email for userId: ${body.userId}${body.toEmail ? ` to ${body.toEmail}` : ''}`,
    );
    try {
      const result = await this.boss.scheduleJob(
        'manual-report-email-queue',
        { userId: body.userId, toEmail: body.toEmail },
        {
          retryLimit: 3,
          retryBackoff: true,
        },
      );
      logger.log(
        `Manual email job enqueued. Result: ${JSON.stringify(result)}`,
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(
        `Failed to enqueue manual email job: ${error.message}`,
        error.stack,
      );
      throw err;
    }

    return { message: 'Report email sending started' };
  }

  @Post('send-bulk-report-emails')
  async sendBulkReportEmails(@Body() body: { userIds: number[] }) {
    const logger = new Logger('SendBulkReportEmails');
    logger.log(`Received send-bulk-report-emails for ${body.userIds?.length || 0} users`);
    if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
      return { message: '0 email jobs queued', enqueued: 0 };
    }
    let enqueued = 0;
    const errors: number[] = [];
    for (const userId of body.userIds) {
      try {
        await this.boss.scheduleJob(
          'manual-report-email-queue',
          { userId },
          { retryLimit: 3, retryBackoff: true },
        );
        enqueued++;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error(`Failed to enqueue job for userId ${userId}: ${error.message}`);
        errors.push(userId);
      }
    }
    logger.log(`Bulk email: ${enqueued} queued, ${errors.length} failed`);
    return { message: `${enqueued} email job(s) queued`, enqueued, failed: errors };
  }


  @Post('send-placement-report-email')
  async sendPlacementReportEmail(
    @Body()
    body: {
      groupId: number;
      departmentId: number;
      toEmail: string;
      downloadUrl: string;
      studentCount: number;
      degreeType: string;
      departmentName: string;
    },
  ) {
    const logger = new Logger('SendPlacementReportEmail');
    logger.log(
      `Received send-placement-report-email for group ${body.groupId}, dept ${body.departmentId} to ${body.toEmail}`,
    );
    try {
      const result = await this.boss.scheduleJob(
        'placement-report-email-queue',
        {
          groupId: body.groupId,
          departmentId: body.departmentId,
          toEmail: body.toEmail,
          downloadUrl: body.downloadUrl,
          studentCount: body.studentCount,
          degreeType: body.degreeType,
          departmentName: body.departmentName,
        },
        {
          retryLimit: 3,
          retryBackoff: true,
        },
      );
      logger.log(
        `Placement report email job enqueued. Result: ${JSON.stringify(result)}`,
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(
        `Failed to enqueue placement report email job: ${error.message}`,
        error.stack,
      );
      throw err;
    }

    return { message: 'Placement report email sending started' };
  }
}
