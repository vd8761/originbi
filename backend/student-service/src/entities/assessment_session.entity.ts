import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('assessment_sessions')
export class AssessmentSession {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @Column({ name: 'registration_id', type: 'bigint' })
    registrationId: number;

    @Column({ name: 'program_id', type: 'bigint', default: 0 })
    programId: number;

    @Column({ name: 'group_id', type: 'bigint', nullable: true })
    groupId: number | null;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: 'NOT_STARTED',
    })
    status: string; // 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

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

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
