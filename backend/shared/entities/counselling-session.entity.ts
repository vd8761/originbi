import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { CounsellingType } from './counselling-type.entity';
import { CorporateAccount } from './corporate-account.entity';

@Entity('counselling_sessions')
export class CounsellingSession {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'counselling_type_id', type: 'bigint' })
    counsellingTypeId: number;

    @ManyToOne(() => CounsellingType)
    @JoinColumn({ name: 'counselling_type_id' })
    counsellingType: CounsellingType;

    @Column({ name: 'corporate_account_id', type: 'bigint', nullable: true })
    corporateAccountId: number;

    @ManyToOne(() => CorporateAccount)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'mobile_number', type: 'varchar', length: 20 })
    mobileNumber: string;

    @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ name: 'access_code', type: 'varchar', length: 50, nullable: true })
    accessCode: string;

    @Column({ name: 'is_verified', type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ name: 'session_token', type: 'varchar', length: 100 })
    sessionToken: string;

    @Column({ name: 'status', type: 'varchar', length: 50, default: 'ACTIVE' })
    status: string;

    @Column({ name: 'student_details', type: 'jsonb', default: {} })
    studentDetails: any;

    @Column({ name: 'results', type: 'jsonb', default: {} })
    results: any;

    @Column({ name: 'report_data', type: 'jsonb', default: {} })
    reportData: any;

    @Column({ name: 'personality_trait_id', type: 'bigint', nullable: true })
    personalityTraitId: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
