import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { CorporateController } from './corporate.controller';
import { CorporateService } from './corporate.service';
import { CorporateAccount } from './entities/corporate-account.entity';
import { CorporateCreditLedger } from './entities/corporate-credit-ledger.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CorporateAccount, CorporateCreditLedger, User]),
    HttpModule,
  ],
  controllers: [CorporateController],
  providers: [CorporateService],
  exports: [CorporateService],
})
export class CorporateModule {}
