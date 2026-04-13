import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssessmentAttempt,
  CorporateAccount,
  CorporateJob,
  CorporateJobSkill,
  JobApplication,
  JobApplicationStatusHistory,
  PersonalityTrait,
  Registration,
  User,
} from '@originbi/shared-entities';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { CorporateCandidatesController } from './candidates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorporateJob,
      CorporateJobSkill,
      JobApplication,
      JobApplicationStatusHistory,
      CorporateAccount,
      User,
      Registration,
      AssessmentAttempt,
      PersonalityTrait,
    ]),
  ],
  controllers: [JobsController, CorporateCandidatesController],
  providers: [JobsService],
})
export class JobsModule {}
