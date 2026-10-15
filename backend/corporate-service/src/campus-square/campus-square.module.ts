import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  CorporateAccount,
  User,
  Registration,
  Groups,
  Program,
  AssessmentSession,
  AssessmentAttempt,
  AssessmentLevel,
  AssessmentQuestion,
  OpenQuestion,
  AssessmentAnswer,
  PersonalityTrait,
} from '@originbi/shared-entities';

import { SettingsModule } from '../settings/settings.module';
import { CampusSquareController } from './campus-square.controller';
import { CampusSquareService } from './campus-square.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorporateAccount,
      User,
      Registration,
      Groups,
      Program,
      AssessmentSession,
      AssessmentAttempt,
      AssessmentLevel,
      AssessmentQuestion,
      OpenQuestion,
      AssessmentAnswer,
      PersonalityTrait,
    ]),
    HttpModule,
    SettingsModule,
  ],
  controllers: [CampusSquareController],
  providers: [CampusSquareService],
  exports: [CampusSquareService],
})
export class CampusSquareModule {}
