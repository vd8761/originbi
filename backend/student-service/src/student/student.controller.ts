import { Controller, Get, Post, Body } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('profile')
  getProfile() {
    return this.studentService.getProfile();
  }

  @Post('seed')
  seedStudent(@Body() body: { email: string; fullName: string }) {
    return this.studentService.createTestStudent(
      body.email || 'monish@touchmarkdes.com',
      body.fullName || 'Monish Test',
    );
  }
}
