import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'users' })     // 👈 IMPORTANT: map to REAL table
export class AdminUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'cognito_sub', unique: true })
  cognitoSub: string;

  @Column()
  email: string;

  @Column()
  role: string; // ADMIN | STUDENT | CORPORATE

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'first_login_at', type: 'timestamptz', nullable: true })
  firstLoginAt?: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: any;
}
