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
  async getProfile(@Body() body: { email: string }) {
    return this.studentService.getProfile(body.email);
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

  @Post('affiliate/validate')
  async validateAffiliate(@Body() body: { code: string }) {
    return this.studentService.validateReferralCode(body.code);
  }
}
