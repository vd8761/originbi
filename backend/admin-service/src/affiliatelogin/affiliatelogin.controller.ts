import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { AffiliateLoginGuard } from './affiliatelogin.guard';
import { AffiliateLoginService } from './affiliatelogin.service';

@Controller('affiliates')
export class AffiliateLoginController {
  constructor(private readonly affiliateLoginService: AffiliateLoginService) {}

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

  @Post('record-login')
  @UseGuards(AffiliateLoginGuard)
  async recordLogin(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    let ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      '';
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    await this.affiliateLoginService.recordLogin(userId, ip);
    return { success: true };
  }
}
