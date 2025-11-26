import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bi_programs')
export class Program {
  @PrimaryGeneratedColumn({ name: 'program_id' })
  program_id: number;

  @Column({ name: 'program_name', type: 'text', nullable: true })
  program_name: string;

  @Column({ name: 'program_level', type: 'smallint', default: 0 })
  program_level: number;

  @Column({ name: 'assessment_title', type: 'varchar', length: 100, nullable: true })
  assessment_title: string;

  @Column({ name: 'report_title', type: 'text', nullable: true })
  report_title: string;

  @Column({ name: 'createdby', type: 'int', nullable: true })
  createdby: number;

  @Column({ name: 'createdon', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdon: Date;

  @Column({
    name: 'updatedon',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedon: Date;

  @Column({ name: 'status', type: 'smallint', default: 0 })
  status: number;

  @Column({ name: 'deleted', type: 'smallint', default: 0 })
  deleted: number;
}
