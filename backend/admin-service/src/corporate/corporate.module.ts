import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { CorporateController } from './corporate.controller';
import { CorporateService } from './corporate.service';
import {
  CorporateAccount,
  CorporateCreditLedger,
  User as AdminUser,
  CorporateCounsellingAccess,
} from '@originbi/shared-entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorporateAccount,
      CorporateCreditLedger,
      AdminUser,
      CorporateCounsellingAccess,
    ]),
    HttpModule,
  ],
  controllers: [CorporateController],
  providers: [CorporateService],
  exports: [CorporateService],
})
export class CorporateModule { }
