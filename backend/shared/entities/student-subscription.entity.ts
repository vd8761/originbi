import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Registration } from './registration.entity';

export type SubscriptionPlan = 'free' | 'ai_counsellor' | 'debrief';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

@Entity('student_subscriptions')
export class StudentSubscription {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'registration_id', type: 'bigint', nullable: true })
    registrationId: number | null;

    @ManyToOne(() => Registration)
    @JoinColumn({ name: 'registration_id' })
    registration: Registration;

    @Column({ name: 'plan_type', type: 'varchar', length: 30, default: 'free' })
    planType: SubscriptionPlan;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'active' })
    status: SubscriptionStatus;

    @Column({ name: 'payment_provider', type: 'varchar', length: 20, nullable: true })
    paymentProvider: string | null;

    @Column({ name: 'payment_reference', type: 'varchar', length: 100, nullable: true })
    paymentReference: string | null;

    @Column({ name: 'payment_order_id', type: 'varchar', length: 100, nullable: true })
    paymentOrderId: string | null;

    @Column({ name: 'amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
    amount: string;

    @Column({ name: 'currency', type: 'varchar', length: 10, default: 'INR' })
    currency: string;

    @Column({ name: 'purchased_at', type: 'timestamptz', nullable: true })
    purchasedAt: Date | null;

    @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
    expiresAt: Date | null;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
    metadata: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
