import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { JobApplication, JobApplicationStatus } from './job-application.entity';
import { User } from './user.entity';

@Entity('job_application_status_history')
export class JobApplicationStatusHistory {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'job_application_id', type: 'bigint' })
    jobApplicationId: number;

    @ManyToOne(() => JobApplication, (jobApplication) => jobApplication.statusHistory, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'job_application_id' })
    jobApplication: JobApplication;

    @Column({ name: 'from_status', type: 'varchar', length: 20, nullable: true })
    fromStatus: JobApplicationStatus | null;

    @Column({ name: 'to_status', type: 'varchar', length: 20 })
    toStatus: JobApplicationStatus;

    @Column({ name: 'changed_by_user_id', type: 'bigint', nullable: true })
    changedByUserId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'changed_by_user_id' })
    changedByUser: User | null;

    @Column({ name: 'changed_at', type: 'timestamptz', default: () => 'NOW()' })
    changedAt: Date;

    @Column({ name: 'note', type: 'text', nullable: true })
    note: string | null;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;
}
