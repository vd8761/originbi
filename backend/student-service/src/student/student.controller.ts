import {
  Controller,
  Post,
  Body,
  Logger,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
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

  @Post('departments')
  async getDepartments() {
    return this.studentService.getDepartments();
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

  @Post('record-login')
  async recordLogin(@Req() req: Request, @Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    let ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      '';
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    await this.studentService.recordLogin(body.email, ip);
    return { success: true };
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

  @Post('register/tech')
  async registerTechAssessment(@Body() dto: CreateRegistrationDto) {
    return this.studentService.registerTechAssessment(dto);
  }

  @Post('upgrade/info')
  async getUpgradeInfo(@Body() body: { email: string }) {
    return this.studentService.getUpgradeInfo(body.email);
  }

  @Post('upgrade/create-order')
  async createUpgradeOrder(@Body() body: { email: string }) {
    return this.studentService.createUpgradeOrder(body.email);
  }

  @Post('upgrade/verify-and-register')
  async verifyUpgradeAndRegister(
    @Body()
    body: {
      email: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.studentService.verifyUpgradeAndRegister(body);
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
    logger.log(
      `Received send-bulk-report-emails for ${body.userIds?.length || 0} users`,
    );
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
        logger.error(
          `Failed to enqueue job for userId ${userId}: ${error.message}`,
        );
        errors.push(userId);
      }
    }
    logger.log(`Bulk email: ${enqueued} queued, ${errors.length} failed`);
    return {
      message: `${enqueued} email job(s) queued`,
      enqueued,
      failed: errors,
    };
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
