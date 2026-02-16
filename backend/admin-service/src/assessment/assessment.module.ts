import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssessmentAttempt,
  AssessmentAnswer,
  AssessmentSession,
  GroupAssessment,
  AssessmentQuestion,
  AssessmentQuestionOption,
  OpenQuestion,
  OpenQuestionOption,
  AssessmentLevel,
  PersonalityTrait,
  AciTraitValueNote,
  AciTrait,
  AciValue,
  Registration,
} from '@originbi/shared-entities';
import { Department } from '../departments/department.entity';
import { DepartmentDegree } from '../departments/department-degree.entity';
import { AssessmentGenerationService } from './assessment-generation.service';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';

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
      GroupAssessment,
      PersonalityTrait,
      AciTraitValueNote,
      AciTrait,
      AciValue,
      Department,
      DepartmentDegree,
      Registration,
    ]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentGenerationService, AssessmentService],
  exports: [TypeOrmModule, AssessmentGenerationService, AssessmentService],
})
export class AssessmentModule {}
