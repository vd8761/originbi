import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CorporateRegistrationsService } from './corporate-registrations.service';
import { CorporateRegistrationsController } from './corporate-registrations.controller';
import { AssessmentModule } from '../assessment/assessment.module';

import { CorporateAccount } from '../entities/corporate-account.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';
import { User } from '../entities/user.entity';
import { Registration } from '../entities/registration.entity';
import { Groups } from '../entities/groups.entity';
import { Program } from '../entities/program.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CorporateAccount,
            CorporateCreditLedger,
            User,
            Registration,
            Groups,
            Program,
            AssessmentSession,
            AssessmentAttempt,
            AssessmentLevel,
        ]),
        HttpModule,
        AssessmentModule,
    ],
    controllers: [CorporateRegistrationsController],
    providers: [CorporateRegistrationsService],
})
export class CorporateRegistrationsModule { }
