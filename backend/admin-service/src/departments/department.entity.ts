// src/departments/department.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'departments' })
export class Department {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;  // you can also type this as string if you prefer for bigint

  @Column({ name: 'name' })   // ✅ match DB column
  name: string;

  @Column({ name: 'short_name', nullable: true })
  shortName?: string;
}
