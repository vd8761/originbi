import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import {
  User as AdminUser,
  Registration,
  Program,
} from '@originbi/shared-entities';

import { RegistrationsService } from './registrations.service';
import { BulkRegistrationsService } from './bulk-registrations.service';
import { RegistrationsController } from './registrations.controller';
import { GroupsModule } from '../groups/groups.module';
import { AssessmentModule } from '../assessment/assessment.module';

import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';
import { Department } from '../departments/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      Registration,
      BulkImport,
      BulkImportRow,
      Program,
      Department,
    ]),
    HttpModule,
    GroupsModule,
    AssessmentModule,
  ],
  providers: [RegistrationsService, BulkRegistrationsService],
  controllers: [RegistrationsController],
})
export class RegistrationsModule {}
