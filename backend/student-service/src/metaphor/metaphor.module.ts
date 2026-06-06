import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  MetaphorTranscriptionJob,
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
import { MetaphorTranscriptionService } from './metaphor-transcription.service';
import { MetaphorProcessor } from './metaphor.processor';
import { MetaphorTranscriptionProcessor } from './metaphor-transcription.processor';
import { R2Module } from '../r2/r2.module';

@Module({
  imports: [
    HttpModule,
    R2Module,
    TypeOrmModule.forFeature([
      MetaphorQuestion,
      MetaphorAnswer,
      MetaphorTranscriptionJob,
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
    MetaphorTranscriptionService,
    MetaphorTranscriptionProcessor,
    MetaphorProcessor,
  ],
  exports: [MetaphorService, MetaphorGenerationService, TypeOrmModule],
})
export class MetaphorModule {}
