import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IatTrial } from './iat-trial.entity';

@Entity('iat_keypresses')
@Index('idx_iat_keypresses_trial', ['iatTrialId', 'eventSequence'])
export class IatKeypress {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'iat_trial_id', type: 'bigint' })
  iatTrialId: number;

  @ManyToOne(() => IatTrial, (trial) => trial.keypresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iat_trial_id' })
  trial: IatTrial;

  @Column({ name: 'assessment_attempt_id', type: 'bigint' })
  assessmentAttemptId: number;

  @Column({ name: 'key_pressed', type: 'char', length: 1 })
  keyPressed: string;

  @Column({ name: 'response_time_ms', type: 'int' })
  responseTimeMs: number;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ name: 'event_sequence', type: 'smallint', default: 1 })
  eventSequence: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
