import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'programs' })
export class Program {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 50 })
    code: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ name: 'assessment_title', type: 'varchar', length: 255, nullable: true })
    assessmentTitle?: string | null;

    @Column({ name: 'report_title', type: 'varchar', length: 255, nullable: true })
    reportTitle?: string | null;

    @Column({ name: 'is_demo', type: 'boolean', default: false })
    isDemo: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
