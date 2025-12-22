import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentAttempt } from './assessment_attempt.entity';
import { AssessmentAnswer } from './assessment_answer.entity';
import { AssessmentSession } from './assessment_session.entity';
import { AssessmentQuestion } from './assessment_question.entity';
import { AssessmentQuestionOption } from './assessment_question_option.entity';
import { OpenQuestion } from './open_question.entity';
import { OpenQuestionOption } from './open_question_option.entity';
import { AssessmentLevel } from './assessment_level.entity';
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
    ]),
  ],
  providers: [AssessmentGenerationService],
  exports: [TypeOrmModule, AssessmentGenerationService],
})
export class AssessmentModule {}
