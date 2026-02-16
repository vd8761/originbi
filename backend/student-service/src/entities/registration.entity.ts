import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './student.entity';
import { Program } from './program.entity';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'registration_source', default: 'SELF' })
  registrationSource: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ name: 'mobile_number', nullable: true })
  mobileNumber: string;

  @Column({ name: 'country_code', default: '+91' })
  countryCode: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ name: 'school_level', nullable: true })
  schoolLevel: string;

  @Column({ name: 'school_stream', nullable: true })
  schoolStream: string;

  @Column({ name: 'program_id', nullable: true })
  programId: number;

  @Column({ name: 'status', default: 'INCOMPLETE' })
  status: string;

  @Column({ name: 'payment_status', default: 'NOT_REQUIRED' })
  paymentStatus: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: any;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Program)
  @JoinColumn({ name: 'program_id' })
  program: Program;
}
