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
import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';

import { BulkCorporateRegistrationsService } from './bulk-corporate-registrations.service';
import { BulkCorporateRegistrationsController } from './bulk-corporate-registrations.controller';
import { GroupAssessment } from '../entities/group_assessment.entity';

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
            BulkImport,
            BulkImportRow,
            GroupAssessment,
        ]),
        HttpModule,
        AssessmentModule,
    ],
    controllers: [CorporateRegistrationsController, BulkCorporateRegistrationsController],
    providers: [CorporateRegistrationsService, BulkCorporateRegistrationsService],
})
export class CorporateRegistrationsModule { }
