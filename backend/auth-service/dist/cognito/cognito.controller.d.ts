import { CognitoService } from './cognito.service';
declare class CreateCognitoUserDto {
    email: string;
    password: string;
    groupName?: string;
}
declare class LoginDto {
    email: string;
    password: string;
    group?: string;
}
export declare class CognitoController {
    private readonly cognitoService;
    constructor(cognitoService: CognitoService);
    createUser(body: CreateCognitoUserDto): Promise<{
        sub: string;
        email: string;
        group: string;
    }>;
    login(body: LoginDto): Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    }>;
    forgotPassword(email: string): Promise<import("@aws-sdk/client-cognito-identity-provider").ForgotPasswordCommandOutput>;
}
export {};
