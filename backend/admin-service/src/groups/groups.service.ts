import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Groups } from '@originbi/shared-entities';

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

  /**
   * Returns all active groups, each annotated with the set of programs it is
   * associated with.
   *
   * A group doesn't store a program directly, and a group can legitimately span
   * more than one program. Its program set is the distinct union of:
   *   - the programs of its scheduled assessments (`group_assessments`), and
   *   - the programs of its member registrations (the few that carry one).
   *
   * Groups with no association at all get an empty `programs` array, meaning
   * "no known program" — the UI treats those as program-agnostic (selectable
   * for any program).
   */
  async findAll(): Promise<
    (Groups & { programs: { id: string; name: string }[] })[]
  > {
    const groups = await this.groupsRepository.find({
      where: { isDeleted: false, isActive: true },
    });

    const rows: {
      group_id: string;
      program_id: string;
      program_name: string;
    }[] = await this.groupsRepository.manager.query(`
      WITH group_programs AS (
        SELECT ga.group_id AS group_id, ga.program_id AS program_id
        FROM group_assessments ga
        WHERE ga.program_id IS NOT NULL
        UNION
        SELECT r.group_id AS group_id, r.program_id AS program_id
        FROM registrations r
        WHERE r.group_id IS NOT NULL
          AND r.program_id IS NOT NULL
          AND r.is_deleted = false
      )
      SELECT gp.group_id   AS group_id,
             gp.program_id AS program_id,
             p.name        AS program_name
      FROM group_programs gp
      JOIN programs p ON p.id = gp.program_id
      ORDER BY gp.group_id, p.name
    `);

    // Build group_id -> [{ id, name }]. Ids stay strings end-to-end (bigints
    // serialize as strings) so the frontend never reconciles number-vs-string.
    const programsByGroup = new Map<string, { id: string; name: string }[]>();
    for (const row of rows) {
      const key = String(row.group_id);
      const list = programsByGroup.get(key) ?? [];
      list.push({ id: String(row.program_id), name: row.program_name });
      programsByGroup.set(key, list);
    }

    // Spread into plain objects (not entity instances) so the extra field is
    // always serialized, regardless of any interceptor.
    return groups.map((g) => ({
      ...g,
      programs: programsByGroup.get(String(g.id)) ?? [],
    }));
  }
}
