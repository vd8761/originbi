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
import { Groups } from './groups.entity';

export type RegistrationSource = 'SELF' | 'ADMIN' | 'CORPORATE' | 'RESELLER';
export type RegistrationStatus = 'INCOMPLETE' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({
    name: 'country_code',
    type: 'varchar',
    length: 10,
    default: '+91',
  })
  countryCode: string;

  @Column({ name: 'mobile_number', type: 'varchar', length: 20 })
  mobileNumber: string;

  @Column({ name: 'gender', type: 'varchar', length: 10, nullable: true })
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;

  @Column({
    name: 'registration_source',
    type: 'varchar',
    length: 20,
    default: 'SELF',
  })
  registrationSource: RegistrationSource;

  @Column({ name: 'corporate_account_id', type: 'bigint', nullable: true })
  corporateAccountId: number | null;

  @Column({ name: 'reseller_account_id', type: 'bigint', nullable: true })
  resellerAccountId: number | null;

  @Column({ name: 'school_level', type: 'varchar', length: 20, nullable: true })
  schoolLevel: string | null;

  @Column({
    name: 'school_stream',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  schoolStream: string | null;

  @Column({ name: 'department_degree_id', type: 'bigint', nullable: true })
  departmentDegreeId: number | null;

  @Column({ name: 'group_id', type: 'bigint', nullable: true })
  groupId: number | null;

  @ManyToOne(() => Groups)
  @JoinColumn({ name: 'group_id' })
  group: Groups;

  @Column({ name: 'program_id', type: 'bigint', nullable: true })
  programId: number | null;

  @Column({ name: 'assessment_session_id', type: 'bigint', nullable: true })
  assessmentSessionId: number | null;

  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId: number | null;

  @Column({ name: 'payment_required', type: 'boolean', default: false })
  paymentRequired: boolean;

  @Column({
    name: 'payment_provider',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  paymentProvider: string | null;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentReference: string | null;

  @Column({
    name: 'payment_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  paymentAmount: string | null;

  @Column({ name: 'payment_created_at', type: 'timestamptz', nullable: true })
  paymentCreatedAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 20,
    default: 'NOT_REQUIRED',
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'INCOMPLETE',
  })
  status: RegistrationStatus;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
