import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly repo: Repository<Program>,
  ) {}

  async create(data: CreateProgramDto) {
    const level =
      typeof data.program_level === 'string'
        ? Number(data.program_level)
        : data.program_level ?? 0;

    const status =
      typeof data.status === 'string'
        ? Number(data.status)
        : data.status ?? 1;

    const program = this.repo.create({
      program_name: data.program_name,
      program_level: level,
      assessment_title: data.assessment_title ?? '',  // avoid null for TS
      report_title: data.report_title ?? '',          // avoid null for TS
      status,
      deleted: 0,
      createdby: 0
      // createdby not set → stays undefined → DB default (nullable) is used
    });

    return this.repo.save(program);
  }

  async update(id: number, data: UpdateProgramDto) {
    const program_level =
      typeof data.program_level === "string"
        ? Number(data.program_level)
        : data.program_level ?? 0;

    const status =
      typeof data.status === "string"
        ? Number(data.status)
        : data.status ?? 1;

    const updateData = {
      program_name: data.program_name,
      program_level,
      assessment_title: data.assessment_title ?? "",
      report_title: data.report_title ?? "",
      status
    };

    return this.repo.update({ program_id: id }, updateData);
  }


  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { program_id: id } });
  }

  remove(id: number) {
    return this.repo.delete({ program_id: id });
  }
}
