import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('metaphor_transcription_jobs')
export class MetaphorTranscriptionJob {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint', unique: true })
    assessmentAttemptId: number;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
    status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

    @Column({ name: 'total', type: 'int', default: 0 })
    total: number;

    @Column({ name: 'transcribed', type: 'int', default: 0 })
    transcribed: number;

    @Column({ name: 'last_error', type: 'text', nullable: true })
    lastError: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
