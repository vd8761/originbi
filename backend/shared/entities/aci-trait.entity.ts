import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('aci_traits')
export class AciTrait {
    @PrimaryGeneratedColumn({ type: 'integer' })
    id: number;

    @Column({ type: 'varchar', length: 10, name: 'trait_code' })
    traitCode: string;

    @Column({ type: 'varchar', length: 150, name: 'trait_title' })
    traitTitle: string;

    @Column({ type: 'text', name: 'short_summary', nullable: true })
    shortSummary: string;

    @Column({ type: 'text', name: 'detailed_overview', nullable: true })
    detailedOverview: string;

    @Column({ type: 'text', name: 'personalized_insight', nullable: true })
    personalizedInsight: string;
}
