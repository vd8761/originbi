import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { User } from '../users/user.entity';
import { UserActionLog } from '../entities/user-action-log.entity';
import { ForgotPasswordController } from './forgotpassword.controller';
import { ForgotPasswordService } from './forgotpassword.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, UserActionLog]),
        HttpModule,
    ],
    controllers: [ForgotPasswordController],
    providers: [ForgotPasswordService],
    exports: [ForgotPasswordService],
})
export class ForgotPasswordModule { }
