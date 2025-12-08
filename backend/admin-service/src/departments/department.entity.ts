// src/departments/department.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bi_departments')   // your table name
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_name' })
  name: string;

  @Column({ name: 'short_name', nullable: true })
  shortName?: string;
}
