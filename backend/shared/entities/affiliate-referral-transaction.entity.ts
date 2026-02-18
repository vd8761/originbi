import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import type { AffiliateAccount } from './affiliate-account.entity';
import type { Registration } from './registration.entity';

/**
 * settlement_status values:
 *   0 = Not Settled
 *   1 = Processing
 *   2 = Settled
 */
export type SettlementStatus = 0 | 1 | 2;

@Entity('affiliate_referral_transactions')
export class AffiliateReferralTransaction {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'affiliate_account_id', type: 'bigint' })
    affiliateAccountId: number;

    @ManyToOne(() => require('./affiliate-account.entity').AffiliateAccount, (affiliate: AffiliateAccount) => affiliate.referralTransactions)
    @JoinColumn({ name: 'affiliate_account_id' })
    affiliateAccount: AffiliateAccount;

    @Column({ name: 'registration_id', type: 'bigint', nullable: true })
    registrationId: number | null;

    @ManyToOne(() => require('./registration.entity').Registration)
    @JoinColumn({ name: 'registration_id' })
    registration: Registration;

    @Column({ name: 'registration_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
    registrationAmount: number;

    @Column({ name: 'commission_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
    commissionPercentage: number;

    @Column({ name: 'earned_commission_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
    earnedCommissionAmount: number;

    /** 0 = Not Settled, 1 = Processing, 2 = Settled */
    @Column({ name: 'settlement_status', type: 'smallint', default: 0 })
    settlementStatus: SettlementStatus;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @Column({ name: 'payment_at', type: 'timestamptz', nullable: true })
    paymentAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
