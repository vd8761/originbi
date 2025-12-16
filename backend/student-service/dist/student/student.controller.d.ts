import { StudentService } from './student.service';
export declare class StudentController {
    private readonly studentService;
    constructor(studentService: StudentService);
    getProfile(): Promise<{
        message: string;
    }>;
}
