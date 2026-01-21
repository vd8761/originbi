// src/departments/departments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

import { DepartmentDegree } from './department-degree.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentDegree)
    private readonly deptDegreeRepo: Repository<DepartmentDegree>,
  ) {}

  async findAll() {
    const rows = await this.deptRepo.find({
      order: { name: 'ASC' },
      where: { isActive: true },
    });

    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      shortName: d.shortName,
    }));
  }

  async findAllDegrees() {
    // If you need specific ordering, you might need query builder or sort in JS
    const rows = await this.deptDegreeRepo.find({
      relations: ['department', 'degreeType'],
      where: { isActive: true },
    });

    // Transform to simple list for dropdown
    const result = rows.map((row) => {
      const degreeName = row.degreeType?.name || '';
      const deptName = row.department?.name || '';
      return {
        id: row.id,
        name: `${degreeName} ${deptName}`.trim(),
        short_name: row.department?.shortName || '',
        is_active: row.isActive,
      };
    });

    // Sort by name for better UX
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
}
