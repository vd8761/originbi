import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CorporateDashboardController } from './corporate-dashboard.controller';
import { CorporateDashboardService } from './corporate-dashboard.service';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { User } from '../entities/user.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';
import { UserActionLog } from '../entities/user-action-log.entity';
import { Registration } from '../entities/registration.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { Program } from '../entities/program.entity';
import { GroupAssessment } from '../entities/group_assessment.entity';
import { Groups } from '../entities/groups.entity';

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
