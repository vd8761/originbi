import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ForgotPasswordController } from './forgotpassword.controller';
import { ForgotPasswordService } from './forgotpassword.service';
import { Student } from '../entities/student.entity';
import { StudentActionLog } from '../entities/student-action-log.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Student, StudentActionLog]),
        HttpModule,
        ConfigModule,
    ],
    controllers: [ForgotPasswordController],
    providers: [ForgotPasswordService],
})
export class ForgotPasswordModule { }
