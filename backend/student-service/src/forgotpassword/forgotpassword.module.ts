import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ForgotPasswordController } from './forgotpassword.controller';
import { ForgotPasswordService } from './forgotpassword.service';
import { User } from '../entities/student.entity';
import { UserActionLog } from '../entities/student-action-log.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActionLog]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService],
})
export class ForgotPasswordModule {}
