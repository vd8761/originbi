import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  MetaphorTranslationJob,
  AiUsageLog,
  OriginbiSetting,
} from '@originbi/shared-entities';
// Use the student-service LOCAL AssessmentAttempt (not the shared one) so we
// don't register a duplicate/relational entity into this service's connection.
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { MetaphorController } from './metaphor.controller';
import { MetaphorService } from './metaphor.service';
import { MetaphorGenerationService } from './metaphor-generation.service';
import { MetaphorTranslationService } from './metaphor-translation.service';
import { MetaphorProcessor } from './metaphor.processor';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      MetaphorQuestion,
      MetaphorAnswer,
      MetaphorTranslationJob,
      AiUsageLog,
      AssessmentAttempt,
      OriginbiSetting,
    ]),
  ],
  controllers: [MetaphorController],
  providers: [
    MetaphorService,
    MetaphorGenerationService,
    MetaphorTranslationService,
    MetaphorProcessor,
  ],
  exports: [MetaphorService, MetaphorGenerationService, TypeOrmModule],
})
export class MetaphorModule {}
