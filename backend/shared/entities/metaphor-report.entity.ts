import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('metaphor_reports')
export class MetaphorReport {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint', unique: true })
    assessmentAttemptId: number;

    @Column({ name: 'assessment_session_id', type: 'bigint', nullable: true })
    assessmentSessionId: number | null;

    @Column({ name: 'user_id', type: 'bigint', nullable: true })
    userId: number | null;

    @Column({ name: 'registration_id', type: 'bigint', nullable: true })
    registrationId: number | null;

    @Column({ name: 'model', type: 'varchar', length: 100, nullable: true })
    model: string | null;

    @Column({ name: 'markdown', type: 'text' })
    markdown: string;

    @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
    generatedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
