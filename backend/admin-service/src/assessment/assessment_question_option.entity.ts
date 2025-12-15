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
    @PrimaryGeneratedColumn({ name: 'qus_option_ID', type: 'int' })
    id: number;

    @Column({ name: 'question_id', type: 'int', default: 0 })
    questionId: number;

    @ManyToOne(() => AssessmentQuestion, (question) => question.options)
    @JoinColumn({ name: 'question_id' })
    question: AssessmentQuestion;

    @Column({ name: 'option_text_en', type: 'text', nullable: true })
    optionTextEn: string | null;

    @Column({ name: 'trait_text_en', type: 'text', nullable: true })
    traitTextEn: string | null;

    @Column({ name: 'option_text_ta', type: 'text', nullable: true })
    optionTextTa: string | null;

    @Column({ name: 'trait_text_ta', type: 'text', nullable: true })
    traitTextTa: string | null;

    @Column({ name: 'trait_type', type: 'smallint', default: 0, comment: '1 - D | 2 - I | 3 - S | 4 - C' })
    traitType: number;

    @Column({ name: 'createdby', type: 'int', default: 0 })
    createdBy: number;

    @CreateDateColumn({ name: 'createdon' })
    createdOn: Date;

    @UpdateDateColumn({ name: 'updatedon', nullable: true })
    updatedOn: Date | null;

    @Column({ name: 'status', type: 'smallint', default: 0 })
    status: number;

    @Column({ name: 'deleted', type: 'smallint', default: 0 })
    deleted: number;
}
