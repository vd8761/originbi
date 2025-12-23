import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AssessmentSession } from './assessment_session.entity';
import { AssessmentLevel } from './assessment_level.entity';
import { User } from './user.entity';
import { Registration } from './registration.entity';

@Entity('assessment_attempts')
export class AssessmentAttempt {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_session_id', type: 'bigint' })
    assessmentSessionId: number;

    @ManyToOne(() => AssessmentSession)
    @JoinColumn({ name: 'assessment_session_id' })
    assessmentSession: AssessmentSession;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'registration_id', type: 'bigint' })
    registrationId: number;

    @ManyToOne(() => Registration)
    @JoinColumn({ name: 'registration_id' })
    registration: Registration;

    @Column({ name: 'program_id', type: 'bigint' })
    programId: number;

    @Column({ name: 'assessment_level_id', type: 'bigint', nullable: true })
    assessmentLevelId: number;

    @ManyToOne(() => AssessmentLevel)
    @JoinColumn({ name: 'assessment_level_id' })
    assessmentLevel: AssessmentLevel;

    @Column({ name: 'unlock_at', type: 'timestamptz', nullable: true })
    unlockAt: Date | null;

    @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
    expiresAt: Date | null;

    @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
    startedAt: Date | null;

    @Column({ name: 'must_finish_by', type: 'timestamptz', nullable: true })
    mustFinishBy: Date | null;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt: Date | null;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'NOT_STARTED',
    })
    status: string;

    @Column({
        name: 'total_score',
        type: 'numeric',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    totalScore: string | null;

    @Column({ name: 'max_score_snapshot', type: 'int', nullable: true })
    maxScoreSnapshot: number | null;

    @Column({
        name: 'sincerity_index',
        type: 'numeric',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    sincerityIndex: string | null;

    @Column({
        name: 'sincerity_class',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    sincerityClass: string | null;

    @Column({ name: 'dominant_trait_id', type: 'bigint', nullable: true })
    dominantTraitId: number | null;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
