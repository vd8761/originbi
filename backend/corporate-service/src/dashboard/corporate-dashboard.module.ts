import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CorporateDashboardController } from './corporate-dashboard.controller';
import { CorporateDashboardService } from './corporate-dashboard.service';

// Import from shared entities package
import {
  CorporateAccount,
  User,
  CorporateCreditLedger,
  UserActionLog,
  Registration,
  AssessmentSession,
  Program,
  GroupAssessment,
  Groups,
} from '@originbi/shared-entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorporateAccount,
      User,
      CorporateCreditLedger,
      UserActionLog,
      Registration,
      AssessmentSession,
      Program,
      GroupAssessment,
      Groups,
    ]),
    HttpModule,
  ],
  controllers: [CorporateDashboardController],
  providers: [CorporateDashboardService],
})
export class CorporateDashboardModule { }
