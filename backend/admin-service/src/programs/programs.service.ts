import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Program } from './entities/program.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
  ) { }

  async findAll(page = 1, limit = 50, search?: string) {
    try {
      const skip = (page - 1) * limit;

      const where = search
        ? [
          { name: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
        ]
        : undefined;

      const [data, total] = await this.programRepo.findAndCount({
        where,
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      });

      return { data, total, page, limit };
    } catch (error) {
      console.error('ProgramsService.findAll Error:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async create(body: any): Promise<Program> {
    const program = this.programRepo.create({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      assessment_title: body.assessment_title ?? null,
      report_title: body.report_title ?? null,
      is_demo: body.is_demo ?? false,
      is_active: body.is_active ?? true,
    });

    return this.programRepo.save(program);
  }

  async update(id: string, body: any): Promise<Program> {
    const program = await this.findOne(id);

    if (body.code !== undefined) program.code = body.code;
    if (body.name !== undefined) program.name = body.name;
    if (body.description !== undefined)
      program.description = body.description ?? null;
    if (body.assessment_title !== undefined)
      program.assessment_title = body.assessment_title ?? null;
    if (body.report_title !== undefined)
      program.report_title = body.report_title ?? null;
    if (body.is_demo !== undefined) program.is_demo = body.is_demo;
    if (body.is_active !== undefined) program.is_active = body.is_active;

    return this.programRepo.save(program);
  }

  // ⭐ FIXED: Toggle API
  async updateStatus(id: string, is_active: boolean): Promise<Program> {
    const program = await this.findOne(id);
    program.is_active = is_active;
    return this.programRepo.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepo.remove(program);
  }
}
