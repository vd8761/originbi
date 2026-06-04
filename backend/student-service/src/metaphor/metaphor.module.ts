import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  MetaphorTranslationJob,
  AssessmentAttempt,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { MetaphorController } from './metaphor.controller';
import { MetaphorService } from './metaphor.service';
import { MetaphorGenerationService } from './metaphor-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetaphorQuestion,
      MetaphorAnswer,
      MetaphorTranslationJob,
      AssessmentAttempt,
      OriginbiSetting,
    ]),
  ],
  controllers: [MetaphorController],
  providers: [MetaphorService, MetaphorGenerationService],
  exports: [MetaphorService, MetaphorGenerationService, TypeOrmModule],
})
export class MetaphorModule {}
