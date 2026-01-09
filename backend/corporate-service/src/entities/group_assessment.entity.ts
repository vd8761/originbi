import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Groups } from './groups.entity';
import { Program } from './program.entity';

@Entity('group_assessments')
export class GroupAssessment {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'group_id', type: 'bigint' })
    groupId: number;

    @ManyToOne(() => Groups)
    @JoinColumn({ name: 'group_id' })
    group: Groups;

    @Column({ name: 'program_id', type: 'bigint' })
    programId: number;

    @ManyToOne(() => Program)
    @JoinColumn({ name: 'program_id' })
    program: Program;

    @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
    validFrom: Date | null;

    @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
    validTo: Date | null;

    @Column({ name: 'total_candidates', type: 'int', default: 0 })
    totalCandidates: number;

    @Column({ type: 'varchar', length: 50, default: 'NOT_STARTED' })
    status: string; // NOT_STARTED, IN_PROGRESS, COMPLETED, EXPIRED

    @Column({ name: 'corporate_account_id', type: 'bigint', nullable: true })
    corporateAccountId: number | null;

    @Column({ name: 'reseller_account_id', type: 'bigint', nullable: true })
    resellerAccountId: number | null;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId: number | null;

    @Column({ type: 'jsonb', default: {} })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
