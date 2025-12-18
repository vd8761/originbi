import { ForgotPasswordService } from './forgotpassword.service';
export declare class ForgotPasswordController {
    private readonly forgotPasswordService;
    constructor(forgotPasswordService: ForgotPasswordService);
    initiateReset(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
