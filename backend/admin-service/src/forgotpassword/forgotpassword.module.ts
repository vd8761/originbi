import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { User as AdminUser, UserActionLog } from '@originbi/shared-entities';
import { ForgotPasswordController } from './forgotpassword.controller';
import { ForgotPasswordService } from './forgotpassword.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, UserActionLog]), HttpModule],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService],
  exports: [ForgotPasswordService],
})
export class ForgotPasswordModule { }
