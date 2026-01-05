import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('bulk_imports')
export class BulkImport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    createdById: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    filename: string;

    @Column({ name: 'total_records', type: 'int', default: 0 })
    totalRecords: number;

    @Column({ name: 'processed_count', type: 'int', default: 0 })
    processedCount: number;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'DRAFT',
    })
    status: string;

    @Column({
        name: 'validation_version',
        type: 'varchar',
        length: 10,
        default: 'v1',
    })
    validationVersion: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt: Date;
}
