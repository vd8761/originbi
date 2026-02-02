import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CorporateAccount } from './corporate-account.entity';
import { CounsellingType } from './counselling-type.entity';

@Entity('corporate_counselling_access')
export class CorporateCounsellingAccess {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'corporate_account_id', type: 'bigint' })
    corporateAccountId: number;

    @ManyToOne(() => CorporateAccount)
    @JoinColumn({ name: 'corporate_account_id' })
    corporateAccount: CorporateAccount;

    @Column({ name: 'counselling_type_id', type: 'bigint' })
    counsellingTypeId: number;

    @ManyToOne(() => CounsellingType)
    @JoinColumn({ name: 'counselling_type_id' })
    counsellingType: CounsellingType;

    @Column({ name: 'is_enabled', type: 'boolean', default: true })
    isEnabled: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
