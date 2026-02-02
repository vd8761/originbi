import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { CounsellingType } from './counselling-type.entity';
import { CounsellingQuestionOption } from './counselling-question-option.entity';

@Entity('counselling_questions')
export class CounsellingQuestion {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'counselling_type_id', type: 'bigint' })
    counsellingTypeId: number;

    @ManyToOne(() => CounsellingType, (type) => type.questions)
    @JoinColumn({ name: 'counselling_type_id' })
    counsellingType: CounsellingType;

    @Column({ name: 'question_text_en', type: 'text' })
    questionTextEn: string;

    @Column({ name: 'question_text_ta', type: 'text', nullable: true })
    questionTextTa: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => CounsellingQuestionOption, (option) => option.question)
    options: CounsellingQuestionOption[];
}
