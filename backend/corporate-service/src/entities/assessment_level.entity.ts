import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('assessment_levels')
export class AssessmentLevel {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number;

    @Column({ name: 'program_id', type: 'bigint' })
    programId: number;

    @Column({ name: 'level_number', type: 'smallint' })
    levelNumber: number;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'pattern_type', type: 'varchar', length: 50, nullable: true })
    patternType: string | null;

    @Column({ name: 'unlock_after_hours', type: 'int', default: 0 })
    unlockAfterHours: number;

    @Column({ name: 'max_score', type: 'int', nullable: true })
    maxScore: number | null;

    @Column({ name: 'sort_order', type: 'smallint', default: 0 })
    sortOrder: number;

    @Column({ name: 'is_mandatory', type: 'boolean', default: false })
    isMandatory: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
