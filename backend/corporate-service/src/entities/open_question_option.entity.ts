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
    @PrimaryGeneratedColumn({ name: 'open_question_option_ID', type: 'int' })
    id: number;

    @Column({ name: 'open_question_ID', type: 'int', nullable: true })
    openQuestionId: number;

    @ManyToOne(() => OpenQuestion, (question) => question.options)
    @JoinColumn({ name: 'open_question_ID' })
    openQuestion: OpenQuestion;

    @Column({
        name: 'option_type',
        type: 'int',
        default: 0,
        comment: '1-Text | 2-Image',
    })
    optionType: number;

    @Column({ name: 'option_text_en', type: 'text', nullable: true })
    optionTextEn: string | null;

    @Column({ name: 'option_text_ta', type: 'text', nullable: true })
    optionTextTa: string | null;

    @Column({
        name: 'option_image_file',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    optionImageFile: string | null;

    @Column({
        name: 'trait_type',
        type: 'smallint',
        default: 0,
        comment: '0 - Wrong | 1 - Valid',
    })
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
