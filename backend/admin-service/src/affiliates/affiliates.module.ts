import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import {
    User as AdminUser,
    AffiliateAccount,
    AffiliateReferralTransaction,
    AffiliateSettlementTransaction,
    Registration,
} from '@originbi/shared-entities';

import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatePortalController } from './affiliate-portal.controller';
import { R2Module } from '../r2/r2.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser, AffiliateAccount, AffiliateReferralTransaction, AffiliateSettlementTransaction, Registration]),
        HttpModule,
        R2Module,
    ],
    providers: [AffiliatesService],
    controllers: [AffiliatesController, AffiliatePortalController],
    exports: [AffiliatesService],
})
export class AffiliatesModule { }
