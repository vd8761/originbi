import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { StudentProcessor } from './student.processor';
import { User } from '../entities/student.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';

import { Program } from '../entities/program.entity';
import { AssessmentReport } from '../entities/assessment-report.entity';
import {
  Registration,
  Gender,
  RegistrationStatus,
  PaymentStatus,
  AffiliateAccount,
  AffiliateReferralTransaction,
  Notification,
  AffiliateSettlementTransaction,
  Groups,
  StudentSubscription,
} from '@originbi/shared-entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AssessmentSession,
      AssessmentAttempt,
      AssessmentLevel,
      AssessmentAnswer,
      Registration,
      Program,
      AssessmentReport,
      AffiliateReferralTransaction,
      AffiliateAccount,
      AffiliateSettlementTransaction,
      Groups,
      StudentSubscription,
      Notification,
    ]),
    HttpModule,
  ],
  controllers: [StudentController, SubscriptionController],
  providers: [StudentService, SubscriptionService, StudentProcessor],
  exports: [StudentService, SubscriptionService],
})
export class StudentModule { }
