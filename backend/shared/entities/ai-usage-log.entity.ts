import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

/** Generic AI usage / token log - reusable across AI features (not just metaphor). */
@Entity('ai_usage_logs')
export class AiUsageLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'purpose', type: 'varchar', length: 50 })
    purpose: string;

    @Column({ name: 'assessment_attempt_id', type: 'bigint', nullable: true })
    assessmentAttemptId: number | null;

    @Column({ name: 'model', type: 'varchar', length: 100, nullable: true })
    model: string | null;

    @Column({ name: 'input_tokens', type: 'int', default: 0 })
    inputTokens: number;

    @Column({ name: 'output_tokens', type: 'int', default: 0 })
    outputTokens: number;

    @Column({ name: 'total_tokens', type: 'int', default: 0 })
    totalTokens: number;

    @Column({ name: 'question_count', type: 'int', default: 0 })
    questionCount: number;

    @Column({ name: 'question_ids', type: 'jsonb', default: () => `'[]'` })
    questionIds: any;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'DONE' })
    status: string;

    @Column({ name: 'error', type: 'text', nullable: true })
    error: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
