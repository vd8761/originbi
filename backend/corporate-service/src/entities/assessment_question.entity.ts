import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AssessmentQuestionOption } from './assessment_question_option.entity';

@Entity('assessment_questions')
export class AssessmentQuestion {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_level_id', type: 'bigint' })
    assessmentLevelId: number;

    @Column({ name: 'set_number', type: 'smallint' })
    setNumber: number;

    @Column({ name: 'program_id', type: 'bigint' })
    programId: number;

    @Column({
        name: 'external_code',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    externalCode: string | null;

    @Column({ name: 'context_text_en', type: 'text', nullable: true })
    contextTextEn: string | null;

    @Column({ name: 'question_text_en', type: 'text', nullable: true })
    questionTextEn: string | null;

    @Column({ name: 'context_text_ta', type: 'text', nullable: true })
    contextTextTa: string | null;

    @Column({ name: 'question_text_ta', type: 'text', nullable: true })
    questionTextTa: string | null;

    @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
    category: string | null;

    @Column({ name: 'personality_trait_id', type: 'bigint', nullable: true })
    personalityTraitId: number | null;

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

    @OneToMany(() => AssessmentQuestionOption, (option) => option.question)
    options: AssessmentQuestionOption[];
}
