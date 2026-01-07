import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OpenQuestion } from './open_question.entity';

@Entity('open_question_options')
export class OpenQuestionOption {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'open_question_id', type: 'bigint' })
  openQuestionId: number;

  @ManyToOne(() => OpenQuestion, (question) => question.options)
  @JoinColumn({ name: 'open_question_id' })
  openQuestion: OpenQuestion;

  @Column({ name: 'option_type', type: 'varchar', length: 20 })
  optionType: string;

  @Column({ name: 'option_text_en', type: 'text', nullable: true })
  optionTextEn: string | null;

  @Column({ name: 'option_text_ta', type: 'text', nullable: true })
  optionTextTa: string | null;

  @Column({ name: 'option_image_file', type: 'varchar', length: 255, nullable: true })
  optionImageFile: string | null;

  @Column({ name: 'is_valid', type: 'boolean', default: false })
  isValid: boolean;

  @Column({ name: 'display_order', type: 'smallint', default: 1 })
  displayOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
