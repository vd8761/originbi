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
import { CorporateAccount } from './corporate-account.entity';
import { CorporateJob } from './corporate-job.entity';
import { Registration } from './registration.entity';
import { User } from './user.entity';
import { JobApplicationStatusHistory } from './job-application-status-history.entity';

export type JobApplicationSource = 'INTERNAL' | 'EXTERNAL' | 'REFERRAL' | 'BULK_IMPORT';
export type JobApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

@Entity('job_applications')
export class JobApplication {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'corporate_account_id', type: 'bigint' })
    corporateAccountId: number;

    @ManyToOne(() => CorporateAccount)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'job_id', type: 'bigint' })
    jobId: number;

    @ManyToOne(() => CorporateJob, (job) => job.applications)
    @JoinColumn({ name: 'job_id' })
    job: CorporateJob;

    @Column({ name: 'registration_id', type: 'bigint' })
    registrationId: number;

    @ManyToOne(() => Registration)
    @JoinColumn({ name: 'registration_id' })
    registration: Registration;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'source', type: 'varchar', length: 20, default: 'INTERNAL' })
    source: JobApplicationSource;

    @Column({ name: 'current_status', type: 'varchar', length: 20, default: 'APPLIED' })
    currentStatus: JobApplicationStatus;

    @Column({ name: 'status_reason', type: 'text', nullable: true })
    statusReason: string | null;

    @Column({ name: 'status_changed_at', type: 'timestamptz', default: () => 'NOW()' })
    statusChangedAt: Date;

    @Column({ name: 'match_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
    matchScore: string | null;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @Column({ name: 'applied_at', type: 'timestamptz', default: () => 'NOW()' })
    appliedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => JobApplicationStatusHistory, (history) => history.jobApplication)
    statusHistory: JobApplicationStatusHistory[];
}
