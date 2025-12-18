import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Student } from '../entities/student.entity';
import { StudentActionLog } from '../entities/student-action-log.entity';
export declare class ForgotPasswordService {
    private studentRepository;
    private actionLogRepository;
    private httpService;
    private configService;
    private authServiceUrl;
    constructor(studentRepository: Repository<Student>, actionLogRepository: Repository<StudentActionLog>, httpService: HttpService, configService: ConfigService);
    initiateStudentReset(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
