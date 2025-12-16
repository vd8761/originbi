export declare class User {
    id: number;
    cognitoSub?: string;
    email: string;
    emailVerified: boolean;
    role: string;
    avatarUrl?: string;
    isActive: boolean;
    isBlocked: boolean;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}
