import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('metaphor_questions')
export class MetaphorQuestion {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'set_number', type: 'smallint' })
    setNumber: number;

    @Column({ name: 'question_number', type: 'smallint', nullable: true })
    questionNumber: number | null;

    @Column({ name: 'program_id', type: 'bigint', nullable: true })
    programId: number | null;

    @Column({ name: 'external_code', type: 'varchar', length: 50, nullable: true })
    externalCode: string | null;

    @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
    imageUrl: string | null;

    @Column({ name: 'image_description_en', type: 'text', nullable: true })
    imageDescriptionEn: string | null;

    @Column({ name: 'image_description_ta', type: 'text', nullable: true })
    imageDescriptionTa: string | null;

    @Column({ name: 'context_text_en', type: 'text', nullable: true })
    contextTextEn: string | null;

    @Column({ name: 'context_text_ta', type: 'text', nullable: true })
    contextTextTa: string | null;

    @Column({ name: 'question_text_en', type: 'text', nullable: true })
    questionTextEn: string | null;

    @Column({ name: 'question_text_ta', type: 'text', nullable: true })
    questionTextTa: string | null;

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
}
