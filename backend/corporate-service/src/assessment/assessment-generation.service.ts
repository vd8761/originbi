import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentQuestion } from '../entities/assessment_question.entity';
import { OpenQuestion } from '../entities/open_question.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';

@Injectable()
export class AssessmentGenerationService {
    private readonly logger = new Logger(AssessmentGenerationService.name);

    constructor(
        @InjectRepository(AssessmentLevel)
        private levelRepo: Repository<AssessmentLevel>,
        @InjectRepository(AssessmentQuestion)
        private questionRepo: Repository<AssessmentQuestion>,
        @InjectRepository(OpenQuestion)
        private openQuestionRepo: Repository<OpenQuestion>,
    ) { }

    /**
     * Generates Level 1 questions following the 2:1 pattern (2 Main : 1 Open).
     * Total 60 questions: 40 Main, 20 Open.
     *
     * @param attemptId ID of the assessment_attempt
     * @param programId Program ID (used to filter main questions)
     * @param manager Transactional entity manager
     */
    async generateLevel1Questions(
        attempt: AssessmentAttempt,
        manager: EntityManager,
    ) {
        this.logger.log(
            `Generating Level 1 questions for attempt ${attempt.id}, program ${attempt.programId}`,
        );

        // 1. Fetch Main Questions
        const mainQuestions = await manager
            .createQueryBuilder(AssessmentQuestion, 'q')
            .where('q.program_id = :programId', { programId: attempt.programId })
            .andWhere('q.is_active = true')
            .andWhere('q.is_deleted = false')
            .orderBy('RANDOM()')
            .limit(40)
            .getMany();

        // 2. Fetch Open Questions
        const openQuestions = await manager
            .createQueryBuilder(OpenQuestion, 'oq')
            .where('oq.is_active = true')
            .andWhere('oq.is_deleted = false')
            .orderBy('RANDOM()')
            .limit(20)
            .getMany();

        // 3. Interleave 2:1 Pattern
        const answersToInsert: Partial<AssessmentAnswer>[] = [];
        let mainIdx = 0;
        let openIdx = 0;
        let seq = 1;

        for (let i = 0; i < 20; i++) {
            // Add 2 Main
            for (let j = 0; j < 2; j++) {
                if (mainIdx < mainQuestions.length) {
                    const q = mainQuestions[mainIdx++];
                    answersToInsert.push({
                        assessmentAttemptId: attempt.id,
                        assessmentSessionId: attempt.assessmentSessionId,
                        userId: attempt.userId,
                        registrationId: attempt.registrationId,
                        programId: attempt.programId,
                        assessmentLevelId: attempt.assessmentLevelId,
                        questionSource: 'MAIN',
                        mainQuestionId: q.id,
                        questionSequence: seq++,
                        questionOptionsOrder: JSON.stringify(
                            this.shuffleOptions([1, 2, 3, 4]),
                        ), // Store as string
                        status: 'NOT_ANSWERED',
                    });
                }
            }
            // Add 1 Open
            if (openIdx < openQuestions.length) {
                const oq = openQuestions[openIdx++];
                answersToInsert.push({
                    assessmentAttemptId: attempt.id,
                    assessmentSessionId: attempt.assessmentSessionId,
                    userId: attempt.userId,
                    registrationId: attempt.registrationId,
                    programId: attempt.programId,
                    assessmentLevelId: attempt.assessmentLevelId,
                    questionSource: 'OPEN',
                    openQuestionId: oq.id,
                    questionSequence: seq++,
                    questionOptionsOrder: JSON.stringify(
                        this.shuffleOptions([1, 2, 3, 4]),
                    ),
                    status: 'NOT_ANSWERED',
                });
            }
        }

        // 4. Bulk Insert
        if (answersToInsert.length > 0) {
            await manager.getRepository(AssessmentAnswer).insert(answersToInsert);
        }

        this.logger.log(
            `Generated ${answersToInsert.length} answers for attempt ${attempt.id}`,
        );
    }

    private shuffleOptions(array: number[]): number[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
