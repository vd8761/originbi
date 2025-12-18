import { ConfigService } from '@nestjs/config';
export declare class CognitoService {
    private readonly config;
    private cognitoClient;
    private userPoolId;
    private clientId;
    constructor(config: ConfigService);
    createUserWithPermanentPassword(email: string, password: string, groupName?: string): Promise<{
        sub: string;
        email: string;
        group: string;
    }>;
    login(email: string, password: string, requiredGroup?: string): Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    }>;
    forgotPassword(email: string): Promise<import("@aws-sdk/client-cognito-identity-provider").ForgotPasswordCommandOutput>;
}
