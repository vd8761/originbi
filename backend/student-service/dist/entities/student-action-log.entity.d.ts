import { Student } from './student.entity';
export declare enum ActionType {
    RESET_PASSWORD = "RESET_PASSWORD",
    EMAIL_SENT = "EMAIL_SENT"
}
export declare class StudentActionLog {
    id: string;
    student: Student;
    studentId: number;
    actionType: ActionType;
    attemptCount: number;
    actionDate: string;
    createdAt: Date;
    updatedAt: Date;
}
