import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('affiliate_accounts')
export class AffiliateAccount {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name: 'country_code', type: 'varchar', length: 10, default: '+91' })
    countryCode: string;

    @Column({ name: 'mobile_number', type: 'varchar', length: 20 })
    mobileNumber: string;

    @Column({ name: 'address', type: 'text', nullable: true })
    address: string | null;

    // Referral
    @Column({ name: 'referral_code', type: 'varchar', length: 20, unique: true })
    referralCode: string;

    @Column({ name: 'referral_count', type: 'int', default: 0 })
    referralCount: number;

    // Commission
    @Column({ name: 'commission_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
    commissionPercentage: number;

    @Column({ name: 'total_earned_commission', type: 'numeric', precision: 12, scale: 2, default: 0 })
    totalEarnedCommission: number;

    @Column({ name: 'total_settled_commission', type: 'numeric', precision: 12, scale: 2, default: 0 })
    totalSettledCommission: number;

    @Column({ name: 'total_pending_commission', type: 'numeric', precision: 12, scale: 2, default: 0 })
    totalPendingCommission: number;

    // Payment Details (UPI + Bank)
    @Column({ name: 'upi_id', type: 'varchar', length: 100, nullable: true })
    upiId: string | null;

    @Column({ name: 'upi_number', type: 'varchar', length: 20, nullable: true })
    upiNumber: string | null;

    @Column({ name: 'banking_name', type: 'varchar', length: 255, nullable: true })
    bankingName: string | null;

    @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
    accountNumber: string | null;

    @Column({ name: 'ifsc_code', type: 'varchar', length: 20, nullable: true })
    ifscCode: string | null;

    @Column({ name: 'branch_name', type: 'varchar', length: 255, nullable: true })
    branchName: string | null;

    // Documents (arrays of { key, url, fileName })
    @Column({ name: 'aadhar_documents', type: 'jsonb', default: () => `'[]'` })
    aadharDocuments: Array<{ key: string; url: string; fileName: string }>;

    @Column({ name: 'pan_documents', type: 'jsonb', default: () => `'[]'` })
    panDocuments: Array<{ key: string; url: string; fileName: string }>;

    // Status
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    // Metadata (for anything extra)
    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
