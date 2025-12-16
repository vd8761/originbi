import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'cognito_sub', nullable: true })
    cognitoSub?: string;

    @Column()
    email: string;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column()
    role: string;

    @Column({ name: 'avatar_url', nullable: true })
    avatarUrl?: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_blocked', default: false })
    isBlocked: boolean;

    // Minimal fields for now, as we just need to link
    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
