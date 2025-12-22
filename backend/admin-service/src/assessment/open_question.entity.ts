import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OpenQuestionOption } from './open_question_option.entity';

@Entity('open_questions')
export class OpenQuestion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'question_type', type: 'varchar', length: 30 })
  questionType: string;

  @Column({ name: 'media_type', type: 'varchar', length: 20 })
  mediaType: string;

  @Column({ name: 'question_text_en', type: 'text', nullable: true })
  questionTextEn: string | null;

  @Column({ name: 'question_text_ta', type: 'text', nullable: true })
  questionTextTa: string | null;

  @Column({ name: 'audio_file', type: 'varchar', length: 255, nullable: true })
  audioFile: string | null;

  @Column({ name: 'video_file', type: 'varchar', length: 255, nullable: true })
  videoFile: string | null;

  @Column({
    name: 'document_file',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  documentFile: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'created_by_user_id', type: 'bigint', nullable: true })
  createdByUserId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => OpenQuestionOption, (option) => option.openQuestion)
  options: OpenQuestionOption[];
}
