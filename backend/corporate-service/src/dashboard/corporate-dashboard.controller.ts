import {
    Controller,
    Get,
    Query,
    BadRequestException,
} from '@nestjs/common';
import { CorporateDashboardService } from './corporate-dashboard.service';

@Controller('dashboard')
export class CorporateDashboardController {
    constructor(private readonly dashboardService: CorporateDashboardService) { }

    @Get('stats')
    async getDashboardStats(@Query('email') email: string) {
        if (!email) {
            throw new BadRequestException('Email is required');
        }
        return this.dashboardService.getStats(email);
    }
}
