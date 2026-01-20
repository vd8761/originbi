import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { SyncService } from './sync.service';
import { FutureRoleReportService } from './future-role-report.service';
import { OverallRoleFitmentService } from './overall-role-fitment.service';
import {
    Registration,
    AssessmentAttempt,
    AssessmentSession,
    User
} from '@originbi/shared-entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Registration,
            AssessmentAttempt,
            AssessmentSession,
            User,
        ]),
    ],
    controllers: [RagController],
    providers: [RagService, EmbeddingsService, SyncService, FutureRoleReportService, OverallRoleFitmentService],
    exports: [RagService, SyncService, FutureRoleReportService, OverallRoleFitmentService],
})
export class RagModule { }


