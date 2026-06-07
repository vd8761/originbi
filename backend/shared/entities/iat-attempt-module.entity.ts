import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IatModule } from './iat-module.entity';
import { IatTrial } from './iat-trial.entity';

@Entity('iat_attempt_modules')
@Index('idx_iat_attempt_modules_attempt', ['assessmentAttemptId', 'moduleOrder'])
export class IatAttemptModule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'assessment_attempt_id', type: 'bigint' })
  assessmentAttemptId: number;

  @Column({ name: 'assessment_session_id', type: 'bigint', nullable: true })
  assessmentSessionId?: number | null;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId?: number | null;

  @Column({ name: 'registration_id', type: 'bigint', nullable: true })
  registrationId?: number | null;

  @Column({ name: 'program_id', type: 'bigint', nullable: true })
  programId?: number | null;

  @Column({ name: 'assessment_level_id', type: 'bigint', nullable: true })
  assessmentLevelId?: number | null;

  @Column({ name: 'module_id', type: 'bigint' })
  moduleId: number;

  @ManyToOne(() => IatModule)
  @JoinColumn({ name: 'module_id' })
  module: IatModule;

  @Column({ name: 'module_order', type: 'smallint' })
  moduleOrder: number;

  @Column({ type: 'varchar', length: 20, default: 'NOT_STARTED' })
  status: string;

  @Column({ name: 'compatible_average_ms', type: 'numeric', precision: 10, scale: 2, nullable: true })
  compatibleAverageMs?: string | null;

  @Column({ name: 'incompatible_average_ms', type: 'numeric', precision: 10, scale: 2, nullable: true })
  incompatibleAverageMs?: string | null;

  @Column({ name: 'speed_gap_ms', type: 'numeric', precision: 10, scale: 2, nullable: true })
  speedGapMs?: string | null;

  @Column({ name: 'pattern_label', type: 'varchar', length: 20, nullable: true })
  patternLabel?: string | null;

  @Column({ name: 'slowest_words', type: 'jsonb', default: () => `'[]'` })
  slowestWords: string[];

  @Column({ name: 'error_words', type: 'jsonb', default: () => `'[]'` })
  errorWords: string[];

  @Column({ name: 'error_rate', type: 'numeric', precision: 6, scale: 2, nullable: true })
  errorRate?: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @OneToMany(() => IatTrial, (trial) => trial.attemptModule)
  trials: IatTrial[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
