import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { Registration } from './registration.entity';
import { User } from '../users/user.entity';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { GroupsModule } from '../groups/groups.module';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Registration]),
    HttpModule,
    GroupsModule,
    AssessmentModule, // for AssessmentGenerationService
  ],
  providers: [RegistrationsService],
  controllers: [RegistrationsController],
})
export class RegistrationsModule { }
