import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssessmentAttempt,
  AssessmentAnswer,
  AssessmentSession,
  AssessmentQuestion,
  AssessmentQuestionOption,
  OpenQuestion,
  OpenQuestionOption,
  AssessmentLevel,
  PersonalityTrait,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { AssessmentGenerationService } from './assessment-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentSession,
      AssessmentAttempt,
      AssessmentAnswer,
      AssessmentQuestion,
      AssessmentQuestionOption,
      OpenQuestion,
      OpenQuestionOption,
      AssessmentLevel,
      PersonalityTrait,
      OriginbiSetting,
    ]),
  ],
  providers: [AssessmentGenerationService],
  exports: [TypeOrmModule, AssessmentGenerationService],
})
export class AssessmentModule {}
