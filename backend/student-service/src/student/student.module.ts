import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { User } from '../entities/student.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AssessmentSession, AssessmentAttempt, AssessmentLevel]), HttpModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule { }
