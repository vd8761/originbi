import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IatModule } from './iat-module.entity';

@Entity('iat_stimuli')
@Index('idx_iat_stimuli_module_concept', ['moduleId', 'conceptKey'])
export class IatStimulus {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'module_id', type: 'bigint' })
  moduleId: number;

  @ManyToOne(() => IatModule, (module) => module.stimuli)
  @JoinColumn({ name: 'module_id' })
  module: IatModule;

  @Column({ name: 'concept_key', type: 'varchar', length: 50 })
  conceptKey: string;

  @Column({ type: 'text' })
  word: string;

  @Column({ name: 'display_order', type: 'smallint', default: 1 })
  displayOrder: number;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
