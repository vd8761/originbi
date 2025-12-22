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

  @Column({ nullable: true })
  email: string;

  // @Column({ name: 'full_name', nullable: true })
  // fullName: string; // Removed as per DB change

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
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

  @Column({
    name: 'first_login_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  firstLoginAt?: Date;

  @Column({
    name: 'last_login_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'corporate_id', nullable: true })
  corporateId: string;
}
