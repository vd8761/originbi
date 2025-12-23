import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentQuestion } from '../entities/assessment_question.entity';
import { AssessmentQuestionOption } from '../entities/assessment_question_option.entity';
import { OpenQuestion } from '../entities/open_question.entity';
import { OpenQuestionOption } from '../entities/open_question_option.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
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
export class AssessmentModule { }
