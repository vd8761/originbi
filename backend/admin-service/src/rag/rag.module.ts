import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { ChatController } from './chat.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { SyncService } from './sync.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import { CustomReportService } from './custom-report.service';
import { ConversationService } from './conversation.service';
import { ChatMemoryService } from './chat-memory.service';
import { OriIntelligenceService } from './ori-intelligence.service';
import { JDMatchingService } from './jd-matching.service';

// RBAC Services
import { AccessPolicyFactory } from './policies';
import { SecureQueryExecutor } from './utils';
import { AuditLoggerService } from './audit';

// Auth Module (provides CognitoUniversalGuard + UserEnrichmentService)
import { AuthModule } from '../auth/auth.module';

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
    AuthModule,
  ],
  controllers: [RagController, ChatController],
  providers: [
    RagService,
    EmbeddingsService,
    SyncService,
    FutureRoleReportService,
    OverallRoleFitmentService,
    CustomReportService,
    ConversationService,
    ChatMemoryService,
    OriIntelligenceService,
    JDMatchingService,
    // RBAC Providers
    AccessPolicyFactory,
    SecureQueryExecutor,
    AuditLoggerService,
  ],
  exports: [
    RagService,
    SyncService,
    FutureRoleReportService,
    OverallRoleFitmentService,
    CustomReportService,
    ConversationService,
    ChatMemoryService,
    OriIntelligenceService,
    JDMatchingService,
    // RBAC Exports
    AccessPolicyFactory,
    SecureQueryExecutor,
    AuditLoggerService,
  ],
})
export class RagModule { }

