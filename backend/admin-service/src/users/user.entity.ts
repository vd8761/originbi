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

  @Column({ name: 'first_login_at', type: 'timestamptz', nullable: true })
  firstLoginAt?: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'corporate_id', nullable: true })
  corporateId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
