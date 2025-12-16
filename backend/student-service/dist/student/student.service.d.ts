import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
export declare class StudentService {
    private readonly studentRepo;
    constructor(studentRepo: Repository<Student>);
    getProfile(): Promise<{
        message: string;
    }>;
}
