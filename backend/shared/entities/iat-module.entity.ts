import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IatStimulus } from './iat-stimulus.entity';

@Entity('iat_modules')
@Index('idx_iat_modules_order', ['moduleOrder'])
export class IatModule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'display_name', type: 'varchar', length: 150 })
  displayName: string;

  @Column({ name: 'module_order', type: 'smallint' })
  moduleOrder: number;

  @Column({ name: 'left_concept_key', type: 'varchar', length: 50 })
  leftConceptKey: string;

  @Column({ name: 'right_concept_key', type: 'varchar', length: 50 })
  rightConceptKey: string;

  @Column({ name: 'compatible_left_keys', type: 'jsonb', default: () => `'[]'` })
  compatibleLeftKeys: string[];

  @Column({ name: 'compatible_right_keys', type: 'jsonb', default: () => `'[]'` })
  compatibleRightKeys: string[];

  @Column({ name: 'incompatible_left_keys', type: 'jsonb', default: () => `'[]'` })
  incompatibleLeftKeys: string[];

  @Column({ name: 'incompatible_right_keys', type: 'jsonb', default: () => `'[]'` })
  incompatibleRightKeys: string[];

  @Column({ name: 'slowed_on_description', type: 'text', nullable: true })
  slowedOnDescription?: string | null;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: any;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany(() => IatStimulus, (stimulus) => stimulus.module)
  stimuli: IatStimulus[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
