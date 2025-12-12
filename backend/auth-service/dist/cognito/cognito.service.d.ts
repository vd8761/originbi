export declare class CognitoService {
    private cognitoClient;
    private userPoolId;
    constructor();
    createUserWithPermanentPassword(email: string, password: string, groupName?: string): Promise<{
        sub: string;
        email: string;
        group: string;
    }>;
}
