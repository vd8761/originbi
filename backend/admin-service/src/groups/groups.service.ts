import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Groups } from './groups.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Groups)
    private groupsRepository: Repository<Groups>,
  ) {}

  /**
   * Finds an existing group by name or creates a new one.
   */
  async findOrCreate(name: string, manager?: EntityManager): Promise<Groups> {
    const repo = manager
      ? manager.getRepository(Groups)
      : this.groupsRepository;

    // Check if exists
    const existing = await repo.findOne({ where: { name } });
    if (existing) {
      return existing;
    }

    // Create new
    const newGroup = repo.create({
      name,
      isActive: true,
      isDeleted: false,
    });

    return await repo.save(newGroup);
  }
}
