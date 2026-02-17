import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { AffiliateAccount } from './affiliate-account.entity';

@Entity('affiliate_settlement_transactions')
export class AffiliateSettlementTransaction {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'affiliate_account_id', type: 'bigint' })
    affiliateAccountId: number;

    @ManyToOne(() => AffiliateAccount)
    @JoinColumn({ name: 'affiliate_account_id' })
    affiliateAccount: AffiliateAccount;

    @Column({ name: 'settled_amount', type: 'numeric', precision: 10, scale: 2 })
    settledAmount: number;

    @Column({ name: 'transaction_mode', type: 'varchar', length: 50 })
    transactionMode: string; // 'UPI', 'BANK_TRANSFER', etc.

    @Column({ name: 'settlement_transaction_id', type: 'varchar', length: 255 })
    settlementTransactionId: string; // UTR/Ref No

    @Column({ name: 'payment_date', type: 'date', default: () => 'CURRENT_DATE' })
    paymentDate: Date;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: {
        earnedAsOfSettlement: number;
        pendingAsOfSettlement: number;
        settledAsOfSettlement: number;
        [key: string]: any;
    };

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
