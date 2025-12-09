import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // ✅ FK column
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  // ✅ Relation
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'registration_source', default: 'ADMIN_PANEL' })
  registrationSource: string;

  @Column({ name: 'status', default: 'PENDING' })
  status: string;

  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId: number | null;

  @Column({ name: 'exam_start', type: 'timestamptz', nullable: true })
  examStart?: Date | null;

  @Column({ name: 'exam_end', type: 'timestamptz', nullable: true })
  examEnd?: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
