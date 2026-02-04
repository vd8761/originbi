import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounsellingType, CounsellingQuestion } from '@originbi/shared-entities';
import { CreateCounsellingTypeDto, UpdateCounsellingTypeDto } from './dto/counselling-type.dto';

@Injectable()
export class AdministratorCounsellingService {
    constructor(
        @InjectRepository(CounsellingType)
        private readonly typeRepo: Repository<CounsellingType>,
        @InjectRepository(CounsellingQuestion)
        private readonly questionRepo: Repository<CounsellingQuestion>,
    ) { }

    // --- Types ---

    async getAllTypes(): Promise<CounsellingType[]> {
        return this.typeRepo.find({
            where: { isDeleted: false },
            order: { id: 'ASC' }
        });
    }

    async getTypeById(id: number): Promise<CounsellingType> {
        const type = await this.typeRepo.findOne({ where: { id } });
        if (!type) throw new NotFoundException('Counselling Type not found');
        return type;
    }

    async createType(dto: CreateCounsellingTypeDto): Promise<CounsellingType> {
        const type = this.typeRepo.create({
            name: dto.name,
            prompt: dto.prompt,
            courseDetails: dto.courseDetails,
            isActive: dto.isActive ?? true,
        });
        return this.typeRepo.save(type);
    }

    async updateType(id: number, dto: UpdateCounsellingTypeDto): Promise<CounsellingType> {
        const type = await this.getTypeById(id);

        if (dto.name) type.name = dto.name;
        if (dto.prompt) type.prompt = dto.prompt;
        if (dto.courseDetails) type.courseDetails = dto.courseDetails;
        if (dto.isActive !== undefined) type.isActive = dto.isActive;

        return this.typeRepo.save(type);
    }

    async deleteType(id: number): Promise<void> {
        const type = await this.getTypeById(id);
        // Soft delete logic can be added here if needed, typically we use a flag or real delete
        // Given schema has isDeleted, let's use soft delete if standard, or just delete if it's clean
        // The schema has `is_deleted` column.
        type.isDeleted = true;
        await this.typeRepo.save(type);
    }
}
