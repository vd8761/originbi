import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../entities/user.entity';

@Entity('corporate_bulk_imports')
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

    // PENDING, PROCESSING, COMPLETED, FAILED
    @Column({
        type: 'varchar',
        length: 20,
        default: 'DRAFT',
    })
    status: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
    completedAt: Date;
}
