import { Controller, Post, Body } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post('profile')
  async getProfile(@Body() body: { email: string }) {
    return this.studentService.getProfile(body.email);
  }

  @Post('seed')
  seedStudent(@Body() body: { email: string; fullName: string }) {
    return this.studentService.createTestStudent(
      body.email || 'monish@touchmarkdes.com',
      body.fullName || 'Monish Test',
    );
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
}
