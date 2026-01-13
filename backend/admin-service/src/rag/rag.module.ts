import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
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
    providers: [RagService, EmbeddingsService],
    exports: [RagService],
})
export class RagModule { }
