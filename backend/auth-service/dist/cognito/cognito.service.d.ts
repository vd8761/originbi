import { ConfigService } from '@nestjs/config';
export declare class CognitoService {
    private readonly config;
    private cognitoClient;
    private userPoolId;
    constructor(config: ConfigService);
    createUserWithPermanentPassword(email: string, password: string, groupName?: string): Promise<{
        sub: string;
        email: string;
        group: string;
    }>;
}
