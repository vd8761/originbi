import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('metaphor_answers')
export class MetaphorAnswer {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint' })
    assessmentAttemptId: number;

    @Column({ name: 'assessment_session_id', type: 'bigint', nullable: true })
    assessmentSessionId: number | null;

    @Column({ name: 'user_id', type: 'bigint', nullable: true })
    userId: number | null;

    @Column({ name: 'registration_id', type: 'bigint', nullable: true })
    registrationId: number | null;

    @Column({ name: 'program_id', type: 'bigint', nullable: true })
    programId: number | null;

    @Column({ name: 'assessment_level_id', type: 'bigint', nullable: true })
    assessmentLevelId: number | null;

    @Column({ name: 'metaphor_question_id', type: 'bigint' })
    metaphorQuestionId: number;

    @Column({ name: 'question_sequence', type: 'smallint', nullable: true })
    questionSequence: number | null;

    @Column({ name: 'spoken_language', type: 'varchar', length: 20, nullable: true })
    spokenLanguage: string | null;

    @Column({ name: 'answer_text_original', type: 'text', nullable: true })
    answerTextOriginal: string | null;

    @Column({ name: 'answer_text_en', type: 'text', nullable: true })
    answerTextEn: string | null;

    @Column({ name: 'translation_status', type: 'varchar', length: 20, default: 'NONE' })
    translationStatus: 'NONE' | 'PENDING' | 'DONE' | 'FAILED';

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'NOT_ANSWERED' })
    status: 'NOT_ANSWERED' | 'ANSWERED';

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
