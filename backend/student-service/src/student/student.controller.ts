import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
    constructor(private readonly studentService: StudentService) { }

    @Get('profile')
    getProfile() {
        return this.studentService.getProfile();
    }
}
