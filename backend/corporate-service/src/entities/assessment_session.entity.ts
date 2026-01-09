import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Registration } from './registration.entity';
import { User } from './user.entity';
import { AssessmentAttempt } from './assessment_attempt.entity';
import { GroupAssessment } from './group_assessment.entity';

@Entity('assessment_sessions')
export class AssessmentSession {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

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

    @Column({ name: 'program_id', type: 'bigint', default: 0 })
    programId: number;

    @Column({ name: 'group_id', type: 'bigint', nullable: true })
    groupId: number | null;

    @Column({ name: 'group_assessment_id', type: 'bigint', nullable: true })
    groupAssessmentId: number | null;

    @ManyToOne(() => GroupAssessment)
    @JoinColumn({ name: 'group_assessment_id' })
    groupAssessment: GroupAssessment;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'NOT_STARTED',
    })
    status: string;

    @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
    validFrom: Date | null;

    @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
    validTo: Date | null;

    @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
    startedAt: Date | null;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt: Date | null;

    @Column({ name: 'is_report_ready', type: 'boolean', default: false })
    isReportReady: boolean;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => AssessmentAttempt, (attempt) => attempt.assessmentSession)
    attempts: AssessmentAttempt[];
}
