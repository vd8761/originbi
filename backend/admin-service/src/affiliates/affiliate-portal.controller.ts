import {
    Controller,
    Get,
    Put,
    Post,
    Query,
    Body,
} from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';

@Controller('affiliates/portal')
export class AffiliatePortalController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    // Dashboard stats
    @Get('dashboard')
    async getDashboardStats(@Query('affiliateId') affiliateId: string) {
        return this.affiliatesService.getDashboardStats(Number(affiliateId));
    }

    // Dashboard table (recent referrals, limited)
    @Get('referrals')
    async getReferrals(
        @Query('affiliateId') affiliateId: string,
        @Query('limit') limit = '10',
    ) {
        return this.affiliatesService.getRecentReferrals(Number(affiliateId), Number(limit));
    }

    // Referrals page — full table + cards
    @Get('referrals-full')
    async getReferralsPage(
        @Query('affiliateId') affiliateId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.affiliatesService.getReferralsPage(
            Number(affiliateId), Number(page), Number(limit), status, search,
        );
    }

    // Earnings page — stats cards
    @Get('earnings-stats')
    async getEarningsStats(@Query('affiliateId') affiliateId: string) {
        return this.affiliatesService.getEarningsStats(Number(affiliateId));
    }

    // Earnings page — chart data (12 months)
    @Get('earnings-chart')
    async getEarningsChart(@Query('affiliateId') affiliateId: string) {
        return this.affiliatesService.getEarningsChart(Number(affiliateId));
    }

    // Earnings page — transaction history (paginated)
    @Get('earnings')
    async getEarnings(
        @Query('affiliateId') affiliateId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        return this.affiliatesService.getEarningsHistory(
            Number(affiliateId), Number(page), Number(limit),
        );
    }

    // Settings — Profile
    @Get('profile')
    async getProfile(@Query('affiliateId') affiliateId: string) {
        return this.affiliatesService.getProfileWithStats(Number(affiliateId));
    }

    @Put('profile')
    async updateProfile(
        @Query('affiliateId') affiliateId: string,
        @Body() dto: { name?: string; mobileNumber?: string; countryCode?: string; address?: string },
    ) {
        return this.affiliatesService.updateProfile(Number(affiliateId), dto);
    }

    // Settings — Payout
    @Put('payout')
    async updatePayout(
        @Query('affiliateId') affiliateId: string,
        @Body() dto: {
            bankingName?: string; accountNumber?: string; ifscCode?: string; branchName?: string;
            upiId?: string; upiNumber?: string;
        },
    ) {
        return this.affiliatesService.updatePayoutSettings(Number(affiliateId), dto);
    }

    // Settings — Change Password
    @Post('change-password')
    async changePassword(
        @Query('affiliateId') affiliateId: string,
        @Body() dto: { currentPassword: string; newPassword: string },
    ) {
        return this.affiliatesService.changePassword(Number(affiliateId), dto);
    }
}
