import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CounsellingQuestion } from './counselling-question.entity';

@Entity('counselling_question_options')
export class CounsellingQuestionOption {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'question_id', type: 'bigint' })
    questionId: number;

    @ManyToOne(() => CounsellingQuestion, (question) => question.options)
    @JoinColumn({ name: 'question_id' })
    question: CounsellingQuestion;

    @Column({ name: 'option_text_en', type: 'text' })
    optionTextEn: string;

    @Column({ name: 'option_text_ta', type: 'text', nullable: true })
    optionTextTa: string;

    @Column({ name: 'disc_trait', type: 'varchar', length: 1, nullable: true })
    discTrait: string;

    @Column({ name: 'display_order', type: 'int', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
