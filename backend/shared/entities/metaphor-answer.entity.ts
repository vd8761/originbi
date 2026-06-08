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

    @Column({ name: 'answer_text_web', type: 'text', nullable: true })
    answerTextWeb: string | null;

    @Column({ name: 'answer_text_en', type: 'text', nullable: true })
    answerTextEn: string | null;

    @Column({ name: 'translation_status', type: 'varchar', length: 20, default: 'NONE' })
    translationStatus: 'NONE' | 'PENDING' | 'DONE' | 'FAILED';

    @Column({ name: 'audio_storage_key', type: 'varchar', length: 300, nullable: true })
    audioStorageKey: string | null;

    @Column({ name: 'transcription_status', type: 'varchar', length: 20, default: 'NONE' })
    transcriptionStatus: 'NONE' | 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

    @Column({ name: 'transcription_source', type: 'varchar', length: 10, nullable: true })
    transcriptionSource: 'web' | 'gemini' | null;

    @Column({ name: 'transcription_error', type: 'text', nullable: true })
    transcriptionError: string | null;

    @Column({ name: 'transcription_retry_count', type: 'int', default: 0 })
    transcriptionRetryCount: number;

    @Column({ name: 'transcription_next_retry_at', type: 'timestamptz', nullable: true })
    transcriptionNextRetryAt: Date | null;

    @Column({ name: 'transcription_last_attempt_at', type: 'timestamptz', nullable: true })
    transcriptionLastAttemptAt: Date | null;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'NOT_ANSWERED' })
    status: 'NOT_ANSWERED' | 'ANSWERED';

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
