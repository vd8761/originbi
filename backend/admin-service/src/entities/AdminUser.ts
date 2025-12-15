import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'users' })
export class AdminUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'cognito_sub', unique: true })
  cognitoSub: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  // @Column({ name: 'full_name', nullable: true })
  // fullName?: string;
}
