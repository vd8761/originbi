import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminLoginModule } from '../adminlogin/adminlogin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import {
  User as AdminUser,
  GroupAssessment,
  CorporateAccount,
  AssessmentSession,
  CorporateCreditLedger,
  Registration,
  AffiliateSettlementTransaction,
  StudentSubscription,
} from '@originbi/shared-entities';

@Module({
  imports: [
    AdminLoginModule,
    TypeOrmModule.forFeature([
      AdminUser,
      GroupAssessment,
      CorporateAccount,
      AssessmentSession,
      CorporateCreditLedger,
      Registration,
      AffiliateSettlementTransaction,
      StudentSubscription,
    ]),
    AffiliatesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
