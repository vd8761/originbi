// src/departments/departments.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DepartmentsService } from './departments.service';

@Controller('admin/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async getAll() {
    return this.departmentsService.findAll();
  }
}
