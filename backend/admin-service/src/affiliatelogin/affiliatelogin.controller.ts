import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AffiliateLoginGuard } from './affiliatelogin.guard';

@Controller('affiliates')
export class AffiliateLoginController {
    @Get('me')
    @UseGuards(AffiliateLoginGuard)
    getMe(@Req() req: any) {
        return {
            message: 'Affiliate authenticated',
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
                isActive: req.user.isActive,
                affiliateId: req.user.affiliateId,
                affiliate: req.user.affiliateAccount,
            },
        };
    }
}
