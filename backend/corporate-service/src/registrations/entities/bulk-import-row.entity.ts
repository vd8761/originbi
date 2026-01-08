import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { BulkImport } from './bulk-import.entity';

@Entity('corporate_bulk_import_rows')
@Index('idx_corp_bulk_rows_ready', ['importId'], { where: "status = 'READY'" })
@Index('uniq_corp_bulk_row', ['importId', 'rowIndex'], { unique: true })
export class BulkImportRow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'import_id', type: 'uuid' })
    importId: string;

    @ManyToOne(() => BulkImport)
    @JoinColumn({ name: 'import_id' })
    import: BulkImport;

    @Column({ name: 'row_index', type: 'int' })
    rowIndex: number;

    @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
    rawData: any;

    @Column({ name: 'normalized_data', type: 'jsonb', nullable: true })
    normalizedData: any;

    // READY, INVALID, SUCCESS, FAILED
    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    status: string;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @Column({ name: 'result_type', type: 'varchar', length: 50, nullable: true })
    resultType: string;

    @Column({ name: 'group_match_score', type: 'int', nullable: true })
    groupMatchScore: number;

    @Column({ name: 'matched_group_id', type: 'bigint', nullable: true })
    matchedGroupId: number | null;

    @Column({ type: 'boolean', default: false })
    overridden: boolean;

    @Column({ name: 'override_data', type: 'jsonb', nullable: true })
    overrideData: any;
}
