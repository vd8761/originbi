import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { DegreeType } from './degree-type.entity';

@Entity({ name: 'department_degrees' })
export class DepartmentDegree {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'department_id', type: 'bigint' })
    departmentId: string;

    @Column({ name: 'degree_type_id', type: 'bigint' })
    degreeTypeId: string;

    @ManyToOne(() => Department)
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @ManyToOne(() => DegreeType)
    @JoinColumn({ name: 'degree_type_id' })
    degreeType: DegreeType;

    @Column({ name: 'course_duration', type: 'smallint', nullable: true })
    courseDuration?: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'is_deleted', type: 'boolean', default: false })
    isDeleted: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
