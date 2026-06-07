import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AiUsageLog,
  IatAttemptModule,
  IatIntakeProfile,
  IatKeypress,
  IatModule as IatModuleEntity,
  IatReport,
  IatReportJob,
  IatStimulus,
  IatTrial,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { Registration } from '../entities/registration.entity';
import { IatController } from './iat.controller';
import { IatEligibilityService } from './iat-eligibility.service';
import { IatReportProcessor } from './iat-report.processor';
import { IatReportService } from './iat-report.service';
import { IatService } from './iat.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IatModuleEntity,
      IatStimulus,
      IatIntakeProfile,
      IatAttemptModule,
      IatTrial,
      IatKeypress,
      IatReport,
      IatReportJob,
      AiUsageLog,
      OriginbiSetting,
      AssessmentAttempt,
      AssessmentLevel,
      AssessmentSession,
      Registration,
    ]),
  ],
  controllers: [IatController],
  providers: [
    IatService,
    IatEligibilityService,
    IatReportService,
    IatReportProcessor,
  ],
  exports: [IatService, IatEligibilityService, IatReportService, TypeOrmModule],
})
export class IatModule {}
