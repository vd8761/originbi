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



  @Column({ name: 'level_number', type: 'smallint', unique: true })
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

  // Use sorting from screenshot: sort_order
  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_mandatory', type: 'boolean', default: false })
  isMandatory: boolean;

  // In screenshot we don't see is_active, but standard practice usually has it or we just assume all rows are active?
  // Screenshot 1 shows rows, no is_active visible? Wait, Screenshot 2 shows `is_mandatory` and `sort_order` and `created_at`.
  // It does NOT show `is_active` in the visible columns.
  // However, the query in earlier error log failed on `is_active`.
  // I will remove `is_active` filter from service if it doesn't exist, OR check if it's hidden.
  // Assuming schema from screenshot is the source of truth.
  // Removing `is_active` from here and will remove from service query.

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
