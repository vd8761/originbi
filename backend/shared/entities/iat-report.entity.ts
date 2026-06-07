import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('iat_reports')
@Index('idx_iat_reports_session', ['assessmentSessionId'])
export class IatReport {
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

  @Column({ name: 'group_id', type: 'bigint', nullable: true })
  groupId?: number | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string | null;

  @Column({ name: 'report_text', type: 'text', nullable: true })
  reportText?: string | null;

  @Column({ name: 'report_input', type: 'jsonb', default: () => `'{}'` })
  reportInput: Record<string, unknown>;

  @Column({ name: 'bias_map', type: 'jsonb', default: () => `'[]'` })
  biasMap: unknown[];

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
