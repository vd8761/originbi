import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User as AdminUser, AffiliateAccount, AffiliateReferralTransaction, Registration, Program, Groups, AffiliateSettlementTransaction } from '@originbi/shared-entities';
import { AffiliateLoginService } from './affiliatelogin.service';
import { AffiliateLoginGuard } from './affiliatelogin.guard';
import { AffiliateLoginController } from './affiliatelogin.controller';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([AdminUser, AffiliateAccount, AffiliateReferralTransaction, Registration, Program, Groups, AffiliateSettlementTransaction]),
    ],
    controllers: [AffiliateLoginController],
    providers: [AffiliateLoginService, AffiliateLoginGuard],
    exports: [AffiliateLoginGuard, AffiliateLoginService, TypeOrmModule],
})
export class AffiliateLoginModule { }
