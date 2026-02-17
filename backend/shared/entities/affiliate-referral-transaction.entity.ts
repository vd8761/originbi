import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AffiliateAccount } from './affiliate-account.entity';
import { User } from './user.entity';

export type TransactionType = 'COMMISSION_EARNED' | 'PAYOUT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

@Entity('affiliate_referral_transactions')
export class AffiliateReferralTransaction {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'affiliate_id', type: 'bigint' })
    affiliateId: number;

    @ManyToOne(() => AffiliateAccount, (affiliate) => affiliate.referralTransactions)
    @JoinColumn({ name: 'affiliate_id' })
    affiliate: AffiliateAccount;

    @Column({ name: 'student_user_id', type: 'bigint', nullable: true })
    studentUserId: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'student_user_id' })
    studentUser: User;

    @Column({ name: 'registration_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
    registrationAmount: number;

    @Column({ name: 'commission_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
    commissionPercentage: number;

    @Column({ name: 'earned_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
    earnedAmount: number;

    // "transfered too" - snapshots the payment details or status context
    @Column({ name: 'transfer_details', type: 'jsonb', nullable: true })
    transferDetails: any;

    @Column({ name: 'transaction_type', type: 'varchar', length: 50, default: 'COMMISSION_EARNED' })
    transactionType: TransactionType;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
    status: TransactionStatus;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
