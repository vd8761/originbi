// src/departments/departments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async findAll() {
    const rows = await this.deptRepo.find({
      order: { name: 'ASC' },
    });

    // you can add courseDuration later by joining department_degrees
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      shortName: d.shortName,
    }));
  }
}
