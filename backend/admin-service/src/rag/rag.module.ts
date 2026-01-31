import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { SyncService } from './sync.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { CustomReportService } from './custom-report.service';
import { ConversationService } from './conversation.service';
import { OriIntelligenceService } from './ori-intelligence.service';
import {
  Registration,
  AssessmentAttempt,
  AssessmentSession,
  User,
  PersonalityTrait,
} from '@originbi/shared-entities';
import { PdfModule } from '../common/pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      AssessmentAttempt,
      AssessmentSession,
      User,
      PersonalityTrait,
    ]),
    PdfModule,
  ],
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingsService,
    SyncService,
    FutureRoleReportService,
    OverallRoleFitmentService,
    CustomReportService,
    ConversationService,
    OriIntelligenceService,
  ],
  exports: [
    RagService,
    SyncService,
    FutureRoleReportService,
    OverallRoleFitmentService,
    CustomReportService,
    ConversationService,
    OriIntelligenceService,
  ],
})
export class RagModule { }
