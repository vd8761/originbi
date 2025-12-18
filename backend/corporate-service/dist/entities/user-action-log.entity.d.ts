import { User } from './user.entity';
export declare enum UserRole {
    ADMIN = "ADMIN",
    STUDENT = "STUDENT",
    CORPORATE = "CORPORATE"
}
export declare enum ActionType {
    RESET_PASSWORD = "RESET_PASSWORD",
    EMAIL_SENT = "EMAIL_SENT"
}
export declare class UserActionLog {
    id: string;
    user: User;
    userId: number;
    registrationId: string;
    role: UserRole;
    actionType: ActionType;
    attemptCount: number;
    actionDate: string;
    createdAt: Date;
    updatedAt: Date;
}
