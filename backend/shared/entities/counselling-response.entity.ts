import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CounsellingSession } from './counselling-session.entity';
import { CounsellingQuestion } from './counselling-question.entity';
import { CounsellingQuestionOption } from './counselling-question-option.entity';

@Entity('counselling_responses')
export class CounsellingResponse {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'session_id', type: 'bigint' })
    sessionId: number;

    @ManyToOne(() => CounsellingSession)
    @JoinColumn({ name: 'session_id' })
    session: CounsellingSession;

    @Column({ name: 'question_id', type: 'bigint' })
    questionId: number;

    @ManyToOne(() => CounsellingQuestion)
    @JoinColumn({ name: 'question_id' })
    question: CounsellingQuestion;

    @Column({ name: 'selected_option_id', type: 'bigint' })
    selectedOptionId: number;

    @ManyToOne(() => CounsellingQuestionOption)
    @JoinColumn({ name: 'selected_option_id' })
    selectedOption: CounsellingQuestionOption;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
