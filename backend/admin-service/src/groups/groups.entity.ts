import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Registration } from '../registrations/registration.entity';

@Entity('groups')
export class Groups {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'code', type: 'varchar', length: 100, nullable: true })
    code: string | null;

    @Column({ name: 'name', type: 'text' }) // Changed to text as per screenshot
    name: string;

    // -- Missing in Entity but present in DB --
    @Column({ name: 'corporate_account_id', type: 'bigint', nullable: true })
    corporateAccountId: number | null;

    @Column({ name: 'reseller_account_id', type: 'bigint', nullable: true })
    resellerAccountId: number | null;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId: number | null;

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault: boolean;
    // ------------------------------------------

    // Removed 'description' and 'current_year' as per User request

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Registration, (reg) => reg.group)
    registrations: Registration[];
}
