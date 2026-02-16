import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';

import {
    User as AdminUser,
    AffiliateAccount,
} from '@originbi/shared-entities';

import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { OneDriveService } from './onedrive.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([AdminUser, AffiliateAccount]),
        HttpModule,
        MulterModule.register({
            storage: undefined, // Use memory storage (default)
        }),
    ],
    providers: [AffiliatesService, OneDriveService],
    controllers: [AffiliatesController],
    exports: [AffiliatesService],
})
export class AffiliatesModule { }

