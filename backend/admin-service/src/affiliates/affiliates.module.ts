import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import {
    User as AdminUser,
    AffiliateAccount,
    AffiliateReferralTransaction,
    Registration,
} from '@originbi/shared-entities';

import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatePortalController } from './affiliate-portal.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser, AffiliateAccount, AffiliateReferralTransaction, Registration]),
        HttpModule,
    ],
    providers: [AffiliatesService],
    controllers: [AffiliatesController, AffiliatePortalController],
    exports: [AffiliatesService],
})
export class AffiliatesModule { }
