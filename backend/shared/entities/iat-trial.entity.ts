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
import { IatAttemptModule } from './iat-attempt-module.entity';
import { IatModule } from './iat-module.entity';
import { IatStimulus } from './iat-stimulus.entity';
import { IatKeypress } from './iat-keypress.entity';

@Entity('iat_trials')
@Index('idx_iat_trials_attempt_module', ['assessmentAttemptId', 'iatAttemptModuleId', 'trialSequence'])
export class IatTrial {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'assessment_attempt_id', type: 'bigint' })
  assessmentAttemptId: number;

  @Column({ name: 'iat_attempt_module_id', type: 'bigint' })
  iatAttemptModuleId: number;

  @ManyToOne(() => IatAttemptModule, (attemptModule) => attemptModule.trials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iat_attempt_module_id' })
  attemptModule: IatAttemptModule;

  @Column({ name: 'module_id', type: 'bigint' })
  moduleId: number;

  @ManyToOne(() => IatModule)
  @JoinColumn({ name: 'module_id' })
  module: IatModule;

  @Column({ name: 'stimulus_id', type: 'bigint', nullable: true })
  stimulusId?: number | null;

  @ManyToOne(() => IatStimulus, { nullable: true })
  @JoinColumn({ name: 'stimulus_id' })
  stimulus?: IatStimulus | null;

  @Column({ name: 'trial_sequence', type: 'int' })
  trialSequence: number;

  @Column({ name: 'step_number', type: 'smallint' })
  stepNumber: number;

  @Column({ name: 'block_type', type: 'varchar', length: 30 })
  blockType: string;

  @Column({ name: 'word_shown', type: 'text' })
  wordShown: string;

  @Column({ name: 'left_label', type: 'text', nullable: true })
  leftLabel?: string | null;

  @Column({ name: 'right_label', type: 'text', nullable: true })
  rightLabel?: string | null;

  @Column({ name: 'expected_key', type: 'char', length: 1 })
  expectedKey: string;

  @Column({ name: 'first_key_pressed', type: 'char', length: 1, nullable: true })
  firstKeyPressed?: string | null;

  @Column({ name: 'final_key_pressed', type: 'char', length: 1, nullable: true })
  finalKeyPressed?: string | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect?: boolean | null;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs?: number | null;

  @Column({ name: 'first_response_time_ms', type: 'int', nullable: true })
  firstResponseTimeMs?: number | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'shown_at', type: 'timestamptz', nullable: true })
  shownAt?: Date | null;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt?: Date | null;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @OneToMany(() => IatKeypress, (keypress) => keypress.trial)
  keypresses: IatKeypress[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
