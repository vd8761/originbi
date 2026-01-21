import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('aci_score_bands')
export class AciScoreBand {
    @PrimaryGeneratedColumn({ type: 'smallint' })
    id: number;

    @Column({ type: 'smallint', name: 'min_score' })
    minScore: number;

    @Column({ type: 'smallint', name: 'max_score' })
    maxScore: number;

    @Column({ type: 'varchar', length: 60, name: 'level_name' })
    levelName: string;

    @Column({ type: 'varchar', length: 150, name: 'compatibility_tag' })
    compatibilityTag: string;

    @Column({ type: 'text', name: 'interpretation_text', nullable: true })
    interpretationText: string;
}
