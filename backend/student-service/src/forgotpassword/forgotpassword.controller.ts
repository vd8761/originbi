import { Controller, Post, Body } from '@nestjs/common';
import { ForgotPasswordService } from './forgotpassword.service';

@Controller('forgot-password')
export class ForgotPasswordController {
  constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

  @Post('initiate')
  async initiateReset(@Body('email') email: string) {
    return this.forgotPasswordService.initiateStudentReset(email);
  }
}
