import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Program } from '@originbi/shared-entities';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
  ) {}

  async findAll(
    page = 1,
    limit = 50,
    search?: string,
    isActive?: boolean,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    try {
      const skip = (page - 1) * limit;

      let where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where = [
          {
            name: ILike(`%${search}%`),
            ...(isActive !== undefined ? { isActive: isActive } : {}),
          },
          {
            code: ILike(`%${search}%`),
            ...(isActive !== undefined ? { isActive: isActive } : {}),
          },
        ];
      }

      const order: any = {};
      if (sortBy) {
        // Map snake_case sort keys to camelCase if needed, or assume frontend sends valid keys
        const keyMap: Record<string, string> = {
          created_at: 'createdAt',
          updated_at: 'updatedAt',
          assessment_title: 'assessmentTitle',
          report_title: 'reportTitle',
          is_demo: 'isDemo',
          is_active: 'isActive',
        };
        const key = keyMap[sortBy] || sortBy;
        order[key] = sortOrder;
      } else {
        order.createdAt = 'DESC';
      }

      const [data, total] = await this.programRepo.findAndCount({
        where,
        order,
        skip,
        take: limit,
      });

      return {
        data: data.map((p) => this.toResponse(p)),
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('ProgramsService.findAll Error:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    // id is number/bigint in shared entity
    const program = await this.programRepo.findOne({
      where: { id: Number(id) },
    }); // Ensure numeric ID
    if (!program) throw new NotFoundException('Program not found');
    return this.toResponse(program);
  }

  async create(body: any): Promise<any> {
    const program = this.programRepo.create({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      assessmentTitle: body.assessment_title ?? null,
      reportTitle: body.report_title ?? null,
      isDemo: body.is_demo ?? false,
      isActive: body.is_active ?? true,
    });

    const saved = await this.programRepo.save(program);
    return this.toResponse(saved);
  }

  async update(id: number, body: any): Promise<any> {
    const program = await this.findOneEntity(id);

    if (body.code !== undefined) program.code = body.code;
    if (body.name !== undefined) program.name = body.name;
    if (body.description !== undefined)
      program.description = body.description ?? null;
    if (body.assessment_title !== undefined)
      program.assessmentTitle = body.assessment_title ?? null;
    if (body.report_title !== undefined)
      program.reportTitle = body.report_title ?? null;
    if (body.is_demo !== undefined) program.isDemo = body.is_demo;
    if (body.is_active !== undefined) program.isActive = body.is_active;

    const saved = await this.programRepo.save(program);
    return this.toResponse(saved);
  }

  // ⭐ FIXED: Toggle API
  async updateStatus(id: number, isActive: boolean): Promise<any> {
    const program = await this.findOneEntity(id);
    program.isActive = isActive;
    const saved = await this.programRepo.save(program);
    return this.toResponse(saved);
  }

  // Helper to find entity without mapping
  private async findOneEntity(id: number): Promise<Program> {
    const program = await this.programRepo.findOne({
      where: { id: Number(id) },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  // Helper to map to snake_case
  private toResponse(program: Program) {
    return {
      id: program.id,
      code: program.code,
      name: program.name,
      description: program.description,
      assessment_title: program.assessmentTitle,
      report_title: program.reportTitle,
      is_demo: program.isDemo,
      is_active: program.isActive,
      created_at: program.createdAt,
      updated_at: program.updatedAt,
    };
  }

  async remove(id: number): Promise<void> {
    const program = await this.findOneEntity(id);
    await this.programRepo.remove(program);
  }
}
