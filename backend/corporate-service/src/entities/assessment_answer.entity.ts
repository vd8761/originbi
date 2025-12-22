import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AssessmentAttempt } from './assessment_attempt.entity';

@Entity('assessment_answers')
export class AssessmentAnswer {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint' })
    assessmentAttemptId: number;

    @ManyToOne(() => AssessmentAttempt)
    @JoinColumn({ name: 'assessment_attempt_id' })
    assessmentAttempt: AssessmentAttempt;

    @Column({ name: 'assessment_session_id', type: 'bigint' })
    assessmentSessionId: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @Column({ name: 'registration_id', type: 'bigint' })
    registrationId: number;

    @Column({ name: 'program_id', type: 'bigint' })
    programId: number;

    @Column({ name: 'assessment_level_id', type: 'bigint' })
    assessmentLevelId: number;

    @Column({ name: 'question_source', type: 'varchar', length: 10 })
    questionSource: 'MAIN' | 'OPEN';

    @Column({ name: 'main_question_id', type: 'bigint', nullable: true })
    mainQuestionId: number | null;

    @Column({ name: 'open_question_id', type: 'bigint', nullable: true })
    openQuestionId: number | null;

    @Column({ name: 'question_sequence', type: 'smallint', nullable: true })
    questionSequence: number | null;

    @Column({
        name: 'question_options_order',
        type: 'varchar',
        length: 200,
        nullable: true,
    })
    questionOptionsOrder: string | null;

    @Column({ name: 'main_option_id', type: 'bigint', nullable: true })
    mainOptionId: number | null;

    @Column({ name: 'open_option_id', type: 'bigint', nullable: true })
    openOptionId: number | null;

    @Column({ name: 'answer_text', type: 'text', nullable: true })
    answerText: string | null;

    @Column({
        name: 'answer_score',
        type: 'numeric',
        precision: 10,
        scale: 2,
        default: 0,
    })
    answerScore: number;

    @Column({ name: 'time_spent_seconds', type: 'int', default: 0 })
    timeSpentSeconds: number;

    @Column({ name: 'is_multiple_selection', type: 'boolean', default: false })
    isMultipleSelection: boolean;

    @Column({ name: 'answer_change_count', type: 'int', default: 0 })
    answerChangeCount: number;

    @Column({ name: 'is_attention_fail', type: 'boolean', default: false })
    isAttentionFail: boolean;

    @Column({ name: 'is_distraction_chosen', type: 'boolean', default: false })
    isDistractionChosen: boolean;

    @Column({ name: 'sincerity_flag', type: 'smallint', nullable: true })
    sincerityFlag: number | null;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'NOT_ANSWERED',
    })
    status: string;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
