import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ForgotPasswordController } from './forgotpassword.controller';
import { ForgotPasswordService } from './forgotpassword.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [ForgotPasswordController],
    providers: [ForgotPasswordService],
    exports: [ForgotPasswordService],
})
export class ForgotPasswordModule { }
