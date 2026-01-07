import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssessmentQuestion } from './assessment_question.entity';

@Entity('assessment_question_options')
export class AssessmentQuestionOption {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'question_id', type: 'bigint' })
  questionId: number;

  @ManyToOne(() => AssessmentQuestion, (question) => question.options)
  @JoinColumn({ name: 'question_id' })
  question: AssessmentQuestion;

  @Column({ name: 'display_order', type: 'smallint', default: 1 })
  displayOrder: number;

  @Column({ name: 'option_text_en', type: 'text', nullable: true })
  optionTextEn: string | null;

  @Column({ name: 'option_text_ta', type: 'text', nullable: true })
  optionTextTa: string | null;

  @Column({ name: 'disc_factor', type: 'varchar', length: 10, nullable: true })
  discFactor: string | null;

  @Column({
    name: 'score_value',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0.00,
    transformer: {
      to: (data: number) => data,
      from: (data: string) => parseFloat(data),
    },
  })
  scoreValue: number;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: any;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
