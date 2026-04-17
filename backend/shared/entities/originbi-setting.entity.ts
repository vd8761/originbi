import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

/**
 * Flexible admin-configurable settings entity.
 * Grouped by `category`, typed by `valueType`.
 *
 * Table: originbi_settings
 */
@Entity('originbi_settings')
@Unique('uq_originbi_settings_category_key', ['category', 'settingKey'])
@Index('idx_originbi_settings_category', ['category'])
export class OriginbiSetting {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', length: 50 })
    category: string;

    @Column({ name: 'setting_key', type: 'varchar', length: 100 })
    settingKey: string;

    @Column({ name: 'value_type', type: 'varchar', length: 20 })
    valueType: 'string' | 'boolean' | 'json' | 'number';

    @Column({ name: 'value_string', type: 'text', nullable: true })
    valueString: string | null;

    @Column({ name: 'value_boolean', type: 'boolean', nullable: true })
    valueBoolean: boolean | null;

    @Column({ name: 'value_json', type: 'jsonb', nullable: true })
    valueJson: any | null;

    @Column({ name: 'value_number', type: 'numeric', precision: 15, scale: 4, nullable: true })
    valueNumber: number | null;

    @Column({ type: 'varchar', length: 200 })
    label: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'is_sensitive', type: 'boolean', default: false })
    isSensitive: boolean;

    @Column({ name: 'is_readonly', type: 'boolean', default: false })
    isReadonly: boolean;

    @Column({ name: 'display_order', type: 'smallint', default: 0 })
    displayOrder: number;

    @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
    updatedBy: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    // ----- Convenience Getter -----

    /**
     * Returns the typed value based on `valueType`.
     * Use this instead of reading individual value columns directly.
     */
    get value(): string | boolean | number | any | null {
        switch (this.valueType) {
            case 'string':
                return this.valueString;
            case 'boolean':
                return this.valueBoolean;
            case 'json':
                return this.valueJson;
            case 'number':
                return this.valueNumber != null ? Number(this.valueNumber) : null;
            default:
                return this.valueString;
        }
    }
}
