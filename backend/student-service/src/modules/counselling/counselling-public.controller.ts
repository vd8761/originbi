import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { CounsellingService } from './counselling.service';

@Controller('public/counselling')
export class CounsellingPublicController {
    constructor(private readonly counsellingService: CounsellingService) { }

    @Post('enquiry')
    async handleEnquiry(@Body() payload: any) {
        return this.counsellingService.handleEnquiry(payload);
    }

    @Get('validate-token')
    async validateToken(@Query('token') token: string) {
        return this.counsellingService.validateSessionToken(token);
    }

    @Post('verify-access')
    async verifyAccess(@Body() body: { token: string; identifier: string; access_code: string }) {
        return this.counsellingService.verifySessionAccess(body.token, body.identifier, body.access_code);
    }

    @Get('questions')
    async getQuestions(@Query('session_id') sessionId: number) {
        return this.counsellingService.getQuestions(sessionId);
    }

    @Post('submit')
    async submitResponse(@Body() body: { session_id: number; question_id: number; option_id: number }) {
        return this.counsellingService.submitResponse(
            body.session_id,
            body.question_id,
            body.option_id
        );
    }

    @Post('complete')
    async completeSession(@Body() body: { session_id: number }) {
        return this.counsellingService.completeSession(body.session_id);
    }
}
