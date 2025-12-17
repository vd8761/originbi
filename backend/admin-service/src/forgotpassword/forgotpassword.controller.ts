import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ForgotPasswordService } from './forgotpassword.service';

@Controller('forgot-password')
export class ForgotPasswordController {
    constructor(private readonly forgotPasswordService: ForgotPasswordService) { }

    @Post('admin/check')
    @HttpCode(HttpStatus.OK)
    async checkAdmin(@Body('email') email: string) {
        if (!email) {
            throw new BadRequestException('Email is required');
        }

        const isEligible = await this.forgotPasswordService.checkAdminEligibility(email);

        if (!isEligible) {
            throw new ForbiddenException('Access Denied. This email is not authorized for Admin Password Reset.');
        }

        return { valid: true, message: 'User authorized for password reset.' };
    }
}
