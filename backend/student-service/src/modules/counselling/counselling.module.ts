import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CounsellingService } from './counselling.service';
import { CounsellingPublicController } from './counselling-public.controller';
import {
  CounsellingType,
  CounsellingQuestion,
  CounsellingQuestionOption,
  CounsellingSession,
  CounsellingResponse,
  CorporateAccount,
  User,
  CorporateCreditLedger,
  PersonalityTrait,
} from '@originbi/shared-entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CounsellingType,
      CounsellingQuestion,
      CounsellingQuestionOption,
      CounsellingSession,
      CounsellingResponse,
      CorporateAccount,
      User,
      CorporateCreditLedger,
      PersonalityTrait,
    ]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [CounsellingPublicController],
  providers: [CounsellingService],
  exports: [CounsellingService],
})
export class CounsellingModule {}
