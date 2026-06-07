import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('metaphor_report_jobs')
export class MetaphorReportJob {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint', unique: true })
    assessmentAttemptId: number;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

    @Column({ name: 'retry_count', type: 'int', default: 0 })
    retryCount: number;

    @Column({ name: 'max_retries', type: 'int', default: 5 })
    maxRetries: number;

    @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
    nextRetryAt: Date | null;

    @Column({ name: 'last_error', type: 'text', nullable: true })
    lastError: string | null;

    @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
    startedAt: Date | null;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
