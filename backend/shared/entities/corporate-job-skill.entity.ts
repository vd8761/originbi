import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CorporateJob } from './corporate-job.entity';

export type JobSkillType = 'REQUIRED' | 'PREFERRED';

@Entity('corporate_job_skills')
export class CorporateJobSkill {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'job_id', type: 'bigint' })
    jobId: number;

    @ManyToOne(() => CorporateJob, (job) => job.skills, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: CorporateJob;

    @Column({ name: 'skill_name', type: 'varchar', length: 120 })
    skillName: string;

    @Column({ name: 'skill_type', type: 'varchar', length: 20, default: 'REQUIRED' })
    skillType: JobSkillType;

    @Column({ name: 'weight', type: 'smallint', default: 1 })
    weight: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
