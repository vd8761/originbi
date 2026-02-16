import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import {
    User as AdminUser,
    AffiliateAccount,
    AffiliateReferralTransaction,
} from '@originbi/shared-entities';

import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser, AffiliateAccount, AffiliateReferralTransaction]),
        HttpModule,
    ],
    providers: [AffiliatesService],
    controllers: [AffiliatesController],
    exports: [AffiliatesService],
})
export class AffiliatesModule { }
