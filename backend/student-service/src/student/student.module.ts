import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { User } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HttpModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
