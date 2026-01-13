import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CorporateAccount } from './corporate-account.entity';
import { User } from './user.entity';

@Entity('corporate_credit_ledger')
export class CorporateCreditLedger {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'corporate_account_id', type: 'bigint' })
    corporateAccountId: number;

    @ManyToOne(() => CorporateAccount)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'credit_delta' })
    creditDelta: number;

    @Column({ name: 'ledger_type', type: 'varchar', length: 10, nullable: true })
    ledgerType: string;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser?: User;

    @Column({ name: 'per_credit_cost', type: 'numeric', precision: 10, scale: 2, nullable: true })
    perCreditCost?: number;

    @Column({ name: 'total_amount', type: 'numeric', precision: 10, scale: 2, nullable: true })
    totalAmount?: number;

    @Column({ name: 'payment_status', type: 'varchar', length: 20, default: 'NA' })
    paymentStatus: string;

    @Column({ name: 'paid_on', type: 'timestamptz', nullable: true })
    paidOn?: Date;

    @Column({ name: 'razorpay_order_id', type: 'varchar', length: 100, nullable: true })
    razorpayOrderId?: string;

    @Column({ name: 'razorpay_payment_id', type: 'varchar', length: 100, nullable: true })
    razorpayPaymentId?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
