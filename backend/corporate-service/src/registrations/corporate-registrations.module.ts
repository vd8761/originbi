import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CorporateRegistrationsService } from './corporate-registrations.service';
import { CorporateRegistrationsController } from './corporate-registrations.controller';
import { AssessmentModule } from '../assessment/assessment.module';
import { SettingsModule } from '../settings/settings.module';

// Import from shared entities package
import {
  CorporateAccount,
  CorporateCreditLedger,
  User,
  Registration,
  Groups,
  Program,
  AssessmentSession,
  AssessmentAttempt,
  AssessmentLevel,
  GroupAssessment,
  Department,
  DepartmentDegree,
  DegreeType,
  Notification,
} from '@originbi/shared-entities';

// Corporate-specific entities (not shared)
import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';

import { BulkCorporateRegistrationsService } from './bulk-corporate-registrations.service';
import { BulkCorporateRegistrationsController } from './bulk-corporate-registrations.controller';

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
      Department,
      DepartmentDegree,
      DegreeType,
      Notification,
    ]),
    HttpModule,
    AssessmentModule,
    SettingsModule,
  ],
  controllers: [
    CorporateRegistrationsController,
    BulkCorporateRegistrationsController,
  ],
  providers: [CorporateRegistrationsService, BulkCorporateRegistrationsService],
})
export class CorporateRegistrationsModule { }
