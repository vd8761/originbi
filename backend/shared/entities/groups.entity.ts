import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

// Forward reference for Registration - will be resolved at runtime
// Relation defined here but Registration imports this file

@Entity('groups')
export class Groups {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'code', type: 'varchar', length: 100, nullable: true })
    code: string | null;

    @Column({ name: 'name', type: 'text' })
    name: string;

    @Column({ name: 'corporate_account_id', type: 'bigint', nullable: true })
    corporateAccountId: number | null;

    @Column({ name: 'reseller_account_id', type: 'bigint', nullable: true })
    resellerAccountId: number | null;

    @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
    createdByUserId: number | null;

    @Column({ name: 'is_default', type: 'boolean', default: false })
    isDefault: boolean;

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

    // Note: OneToMany to Registration will be added via service-specific extension if needed
    // This keeps the shared entity simple and avoids circular imports
}
