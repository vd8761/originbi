import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CorporateDashboardController } from './corporate-dashboard.controller';
import { CorporateDashboardService } from './corporate-dashboard.service';
import { CounsellingReportService } from './counselling-report.service';

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
  CorporateCounsellingAccess,
  CounsellingType,
  CounsellingQuestion,
  CounsellingQuestionOption,
  CounsellingSession,
  CounsellingResponse,
  PersonalityTrait,
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
      CorporateCounsellingAccess,
      CounsellingType,
      CounsellingQuestion,
      CounsellingQuestionOption,
      CounsellingSession,
      CounsellingResponse,
      PersonalityTrait,
    ]),
    HttpModule,
  ],
  controllers: [CorporateDashboardController],
  providers: [CorporateDashboardService, CounsellingReportService],
  exports: [CounsellingReportService],
})
export class CorporateDashboardModule {}
