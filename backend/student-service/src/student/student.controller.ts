import { Controller, Post, Body } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StudentService } from './student.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    @InjectQueue('assessment-email-queue') private emailQueue: Queue,
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
    await this.emailQueue.add(
      'send-report-email',
      {
        userId: body.userId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );

    return { message: 'Assessment completion processing started' };
  }

  @Post('affiliate/validate')
  async validateAffiliate(@Body() body: { code: string }) {
    return this.studentService.validateReferralCode(body.code);
  }
}
