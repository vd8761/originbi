import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('iat_intake_profiles')
export class IatIntakeProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'assessment_attempt_id', type: 'bigint', unique: true })
  assessmentAttemptId: number;

  @Column({ name: 'assessment_session_id', type: 'bigint', nullable: true })
  assessmentSessionId?: number | null;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId?: number | null;

  @Column({ name: 'registration_id', type: 'bigint', nullable: true })
  registrationId?: number | null;

  @Column({ name: 'program_id', type: 'bigint', nullable: true })
  programId?: number | null;

  @Column({ name: 'student_name', type: 'varchar', length: 255, nullable: true })
  studentName?: string | null;

  @Column({ type: 'smallint', nullable: true })
  age?: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string | null;

  @Column({ name: 'hometown_tier', type: 'varchar', length: 30, nullable: true })
  hometownTier?: string | null;

  @Column({ name: 'college_tier', type: 'varchar', length: 30, nullable: true })
  collegeTier?: string | null;

  @Column({ name: 'undergraduate_stream', type: 'varchar', length: 50, nullable: true })
  undergraduateStream?: string | null;

  @Column({ name: 'work_experience_years', type: 'numeric', precision: 4, scale: 1, nullable: true })
  workExperienceYears?: string | null;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
