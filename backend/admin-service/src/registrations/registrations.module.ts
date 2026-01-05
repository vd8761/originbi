import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Registration } from './registration.entity';
import { User } from '../users/user.entity';
import { RegistrationsService } from './registrations.service';
import { BulkRegistrationsService } from './bulk-registrations.service';
import { RegistrationsController } from './registrations.controller';
import { GroupsModule } from '../groups/groups.module';
import { AssessmentModule } from '../assessment/assessment.module';

import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';
import { Program } from '../programs/entities/program.entity';
import { Department } from '../departments/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Registration,
      BulkImport,
      BulkImportRow,
      Program,
      Department
    ]),
    HttpModule,
    GroupsModule,
    AssessmentModule,
  ],
  providers: [RegistrationsService, BulkRegistrationsService],
  controllers: [RegistrationsController],
})
export class RegistrationsModule { }
