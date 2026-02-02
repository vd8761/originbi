import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { CounsellingQuestion } from './counselling-question.entity';

@Entity('counselling_types')
export class CounsellingType {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'prompt', type: 'text', nullable: true })
    prompt: string;

    @Column({ name: 'course_details', type: 'jsonb', default: {} })
    courseDetails: any;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => CounsellingQuestion, (question) => question.counsellingType)
    questions: CounsellingQuestion[];
}
