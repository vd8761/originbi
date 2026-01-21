import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AciTrait } from './aci-trait.entity';
import { AciValue } from './aci-value.entity';

@Entity('aci_trait_value_notes')
export class AciTraitValueNote {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ type: 'integer', name: 'aci_trait_id' })
    aciTraitId: number;

    @Column({ type: 'smallint', name: 'aci_value_id' })
    aciValueId: number;

    @Column({ type: 'text', name: 'behavioral_note' })
    behavioralNote: string;

    @Column({ type: 'text', name: 'reflection_text', nullable: true })
    reflectionText: string;

    @ManyToOne(() => AciTrait)
    @JoinColumn({ name: 'aci_trait_id' })
    trait: AciTrait;

    @ManyToOne(() => AciValue)
    @JoinColumn({ name: 'aci_value_id' })
    value: AciValue;
}
