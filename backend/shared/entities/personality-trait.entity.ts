import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('personality_traits')
export class PersonalityTrait {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'code', type: 'varchar', length: 10, unique: true })
    code: string;

    @Column({ name: 'blended_style_name', type: 'varchar', length: 100 })
    blendedStyleName: string;

    @Column({ name: 'blended_style_desc', type: 'text', nullable: true })
    blendedStyleDesc: string | null;

    @Column({ name: 'color_rgb', type: 'varchar', length: 20, nullable: true })
    colorRgb: string | null;

    @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'` })
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
