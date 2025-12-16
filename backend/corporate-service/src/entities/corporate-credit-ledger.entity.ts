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

    @ManyToOne(() => CorporateAccount, (account) => account.creditLedgers)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'credit_delta' })
    creditDelta: number;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser?: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
