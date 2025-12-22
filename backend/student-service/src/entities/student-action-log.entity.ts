import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './student.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  CORPORATE = 'CORPORATE',
}

export enum ActionType {
  RESET_PASSWORD = 'RESET_PASSWORD',
  EMAIL_SENT = 'EMAIL_SENT',
}

@Entity('user_action_logs')
@Unique(['user', 'actionType', 'actionDate'])
export class UserActionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'integer' }) // User ID is integer
  userId: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: true,
  })
  role: UserRole;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ name: 'action_date', type: 'date' })
  actionDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
