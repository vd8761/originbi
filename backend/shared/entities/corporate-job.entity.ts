import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { CorporateAccount } from './corporate-account.entity';
import { User } from './user.entity';
import { CorporateJobSkill } from './corporate-job-skill.entity';
import { JobApplication } from './job-application.entity';

export type JobWorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type JobEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';
export type JobShift = 'DAY' | 'NIGHT' | 'ROTATIONAL' | 'FLEXIBLE';
export type JobExperienceLevel = 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export type JobLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'HOLD' | 'CLOSED' | 'ARCHIVED';

@Entity('corporate_jobs')
export class CorporateJob {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'corporate_account_id', type: 'bigint' })
    corporateAccountId: number;

    @ManyToOne(() => CorporateAccount)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser: User | null;

    @Column({ name: 'updated_by_user_id', type: 'bigint', nullable: true })
    updatedByUserId: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by_user_id' })
    updatedByUser: User | null;

    @Column({ name: 'job_ref_no', type: 'varchar', length: 40, unique: true })
    jobRefNo: string;

    @Column({ name: 'title', type: 'varchar', length: 255 })
    title: string;

    @Column({ name: 'department', type: 'varchar', length: 120, nullable: true })
    department: string | null;

    @Column({ name: 'location', type: 'varchar', length: 160, nullable: true })
    location: string | null;

    @Column({ name: 'work_mode', type: 'varchar', length: 20 })
    workMode: JobWorkMode;

    @Column({ name: 'employment_type', type: 'varchar', length: 20 })
    employmentType: JobEmploymentType;

    @Column({ name: 'shift', type: 'varchar', length: 20, nullable: true })
    shift: JobShift | null;

    @Column({ name: 'experience_level', type: 'varchar', length: 30, nullable: true })
    experienceLevel: JobExperienceLevel | null;

    @Column({ name: 'min_ctc', type: 'numeric', precision: 12, scale: 2, nullable: true })
    minCtc: string | null;

    @Column({ name: 'max_ctc', type: 'numeric', precision: 12, scale: 2, nullable: true })
    maxCtc: string | null;

    @Column({ name: 'currency_code', type: 'varchar', length: 8, default: 'INR' })
    currencyCode: string;

    @Column({ name: 'openings', type: 'int', default: 1 })
    openings: number;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'DRAFT' })
    status: JobLifecycleStatus;

    @Column({ name: 'posting_start_at', type: 'timestamptz', nullable: true })
    postingStartAt: Date | null;

    @Column({ name: 'posting_end_at', type: 'timestamptz', nullable: true })
    postingEndAt: Date | null;

    @Column({ name: 'description', type: 'text' })
    description: string;

    @Column({ name: 'responsibilities', type: 'text', nullable: true })
    responsibilities: string | null;

    @Column({ name: 'eligibility', type: 'text', nullable: true })
    eligibility: string | null;

    @Column({ name: 'nice_to_have', type: 'text', nullable: true })
    niceToHave: string | null;

    @Column({ name: 'what_you_will_learn', type: 'text', nullable: true })
    whatYouWillLearn: string | null;

    @Column({ name: 'company_details', type: 'text', nullable: true })
    companyDetails: string | null;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => CorporateJobSkill, (skill) => skill.job)
    skills: CorporateJobSkill[];

    @OneToMany(() => JobApplication, (application) => application.job)
    applications: JobApplication[];
}
