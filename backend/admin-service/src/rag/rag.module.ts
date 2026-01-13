import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { Registration } from '../registrations/registration.entity';
import { AssessmentAttempt } from '../assessment/assessment_attempt.entity';
import { AssessmentSession } from '../assessment/assessment_session.entity';
import { User } from '../users/user.entity';

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
