import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssessmentSession,
  Program,
  AssessmentLevel,
  AssessmentAttempt,
  GroupAssessment,
  Groups,
  AciTraitValueNote,
  AciTrait,
  AciValue,
} from '@originbi/shared-entities';
import { Department } from '../departments/department.entity';
import { DepartmentDegree } from '../departments/department-degree.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(GroupAssessment)
    private readonly groupAssessmentRepo: Repository<GroupAssessment>,
    @InjectRepository(AciTraitValueNote)
    private readonly aciNoteRepo: Repository<AciTraitValueNote>,
    @InjectRepository(AciTrait)
    private readonly aciTraitRepo: Repository<AciTrait>,
    @InjectRepository(AciValue)
    private readonly aciValueRepo: Repository<AciValue>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(DepartmentDegree)
    private readonly deptDegreeRepo: Repository<DepartmentDegree>,
  ) {}

  async findAllSessions(
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
    status?: string,
    userId?: string,
    type?: string,
  ) {
    try {
      // NEW LOGIC FOR GROUP ASSESSMENTS
      if (type === 'group') {
        const qb = this.groupAssessmentRepo
          .createQueryBuilder('ga')
          .leftJoinAndMapOne('ga.program', Program, 'p', 'p.id = ga.programId')
          .leftJoinAndMapOne('ga.group', Groups, 'g', 'g.id = ga.groupId'); // Join Group

        if (search) {
          const s = `%${search.toLowerCase()}%`;
          qb.andWhere(
            '(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(g.name) LIKE :s)',
            { s },
          );
        }

        if (startDate)
          qb.andWhere('ga.validFrom >= :startDate', {
            startDate: `${startDate} 00:00:00`,
          });
        if (endDate)
          qb.andWhere('ga.validFrom <= :endDate', {
            endDate: `${endDate} 23:59:59`,
          });
        if (status) qb.andWhere('ga.status = :status', { status });

        // Sort
        if (sortBy) {
          let sortCol = '';
          switch (sortBy) {
            case 'exam_title':
              sortCol = 'p.assessment_title';
              break;
            case 'program_name':
              sortCol = 'p.name';
              break;
            case 'group_name':
              sortCol = 'g.name';
              break;
            case 'exam_status':
              sortCol = 'ga.status';
              break;
            case 'exam_starts_on':
              sortCol = 'ga.validFrom';
              break;
            case 'exam_ends_on':
              sortCol = 'ga.validTo';
              break;
            default:
              sortCol = 'ga.validFrom';
          }
          qb.orderBy(sortCol, sortOrder);
        } else {
          qb.orderBy('ga.id', 'DESC');
        }

        const total = await qb.getCount();
        const rows = await qb
          .skip((page - 1) * limit)
          .take(limit)
          .getMany();

        const data = rows.map((r) => ({
          id: r.id,
          programId: r.programId,
          program: r.program,
          status: r.status,
          validFrom: r.validFrom,
          validTo: r.validTo,
          createdAt: r.validFrom,
          // Map Group Info
          groupId: r.groupId,
          groupName: (r as any).group?.name || 'N/A',

          userId: 0,
          registrationId: 0,
          currentLevel: 0,
          totalLevels: 0,
          totalCandidates: r.totalCandidates,
        }));

        return { data, total, page, limit };
      }

      // EXISTING LOGIC FOR INDIVIDUAL SESSIONS
      const qb = this.sessionRepo
        .createQueryBuilder('as')
        .leftJoinAndMapOne('as.program', Program, 'p', 'p.id = as.programId')
        .leftJoinAndSelect('as.user', 'u')
        .leftJoinAndSelect('as.registration', 'r');

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(u.email) LIKE :s OR LOWER(r.fullName) LIKE :s)',
          { s },
        );
      }

      if (startDate) {
        qb.andWhere('as.validFrom >= :startDate', {
          startDate: `${startDate} 00:00:00`,
        });
      }
      if (endDate) {
        qb.andWhere('as.validFrom <= :endDate', {
          endDate: `${endDate} 23:59:59`,
        });
      }

      if (status) {
        qb.andWhere('as.status = :status', { status });
      }

      if (userId) {
        qb.andWhere('as.userId = :userId', { userId });
      }

      if (type === 'individual') {
        qb.andWhere('(as.groupId IS NULL OR as.groupId = 0)');
      }

      if (sortBy) {
        let sortCol = '';
        switch (sortBy) {
          case 'exam_title':
            sortCol = 'p.assessment_title';
            break;
          case 'program_name':
            sortCol = 'p.name';
            break;
          case 'candidate_name':
            sortCol = 'r.fullName';
            break;
          case 'email':
            sortCol = 'u.email';
            break;
          case 'exam_status':
            sortCol = 'as.status';
            break;
          case 'exam_starts_on':
            sortCol = 'as.validFrom';
            break;
          case 'exam_ends_on':
            sortCol = 'as.validTo';
            break;
          case 'exam_published_on':
            sortCol = 'as.createdAt';
            break;
          default:
            sortCol = 'as.createdAt';
        }
        qb.orderBy(sortCol, sortOrder);
      } else {
        qb.orderBy('as.createdAt', 'DESC');
      }

      const total = await qb.getCount();
      const rows = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      // Calculate Metrics
      const totalLevels = await this.levelRepo.count({
        where: { isMandatory: true },
      });

      let currentLevelsMap: Record<number, number> = {};
      if (rows.length > 0) {
        const sessionIds = rows.map((r) => r.id);

        // Get Max Level started/completed
        // Logic: Show "2/2" only if Level 2 is actually started. If Level 1 is done but Level 2 is NOT_STARTED, show "1/2".
        const rawLevels = await this.attemptRepo
          .createQueryBuilder('aa')
          .select('aa.assessmentSessionId', 'sid')
          .addSelect('MAX(al.levelNumber)', 'maxLvl')
          .leftJoin('aa.assessmentLevel', 'al')
          .where('aa.assessmentSessionId IN (:...ids)', { ids: sessionIds })
          .andWhere("aa.status NOT IN ('NOT_STARTED', 'NOT_YET_STARTED')") // Exclude unstarted
          .groupBy('aa.assessmentSessionId')
          .getRawMany();

        currentLevelsMap = rawLevels.reduce((acc, curr) => {
          acc[curr.sid] = Number(curr.maxLvl) || 1;
          return acc;
        }, {});
      }

      const augmentedRows = rows.map((r) => ({
        ...r,
        groupName: r.groupAssessment?.group?.name || 'N/A',
        totalLevels,
        currentLevel:
          currentLevelsMap[r.id] || (r.status === 'NOT_STARTED' ? 0 : 1),
      }));

      return { data: augmentedRows, total, page, limit };
    } catch (error) {
      console.error('AssessmentService.findAllSessions Error:', error);
      throw error;
    }
  }

  async findGroupSessionDetails(id: number) {
    try {
      const groupAssessment = await this.groupAssessmentRepo.findOne({
        where: { id },
        relations: ['group', 'program'],
      });

      if (!groupAssessment) {
        return null;
      }

      const sessions = await this.sessionRepo.find({
        where: { groupAssessmentId: id },
        relations: ['user', 'registration'],
        order: { createdAt: 'DESC' },
      });

      return {
        ...groupAssessment,
        sessions: sessions.map((s) => ({
          ...s,
          userFullName: s.registration?.fullName || 'N/A',
          userEmail: s.user?.email || 'N/A',
        })),
      };
    } catch (error) {
      console.error('Error fetching group session details:', error);
      throw error;
    }
  }

  async getSessionDetails(id: number) {
    try {
      const session = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.user', 'u')
        .leftJoinAndSelect('s.registration', 'r')
        .leftJoinAndSelect('s.groupAssessment', 'ga')
        .leftJoinAndSelect('ga.group', 'g')
        .leftJoinAndMapOne('s.program', Program, 'p', 'p.id = s.programId')
        .leftJoinAndMapOne(
          'ga.program',
          Program,
          'gap',
          'gap.id = ga.programId',
        )
        .where('s.id = :id', { id })
        .getOne();

      if (!session) return null;

      // Fetch all attempts for the session to populate level-wise reports
      const attempts = await this.attemptRepo.find({
        where: { assessmentSessionId: id },
        relations: ['assessmentLevel', 'dominantTrait'],
        order: { assessmentLevelId: 'ASC' },
      });

      // --- DYNAMIC ACI NOTES ENRICHMENT ---
      const aciAttempt = attempts.find(
        (a) =>
          a.assessmentLevel?.patternType === 'ACI' ||
          a.assessmentLevel?.name?.includes('ACI'),
      );

      if (aciAttempt) {
        // Try to find trait code from metadata
        const traitCode =
          aciAttempt.metadata?.traitCode || session.metadata?.traitCode;

        if (traitCode) {
          // Find the trait entity (try code first, then title)
          let trait = await this.aciTraitRepo.findOne({
            where: { traitCode: traitCode },
          });
          if (!trait) {
            trait = await this.aciTraitRepo.findOne({
              where: { traitTitle: traitCode },
            });
          }

          if (trait) {
            // Get all values to map IDs to Names
            const aciValues = await this.aciValueRepo.find();
            const valueMap = new Map<number, string>();
            aciValues.forEach((v) => valueMap.set(v.id, v.valueName));

            // Get the notes
            const notes = await this.aciNoteRepo.find({
              where: { aciTraitId: trait.id },
            });

            // Construct the map
            const notesMap: Record<string, string> = {};
            notes.forEach((n) => {
              const valName = valueMap.get(n.aciValueId);
              if (valName) {
                notesMap[valName] = n.behavioralNote;
              }
            });

            // Attach to attempt (as ad-hoc property)
            (aciAttempt as any).aciNotes = notesMap;
            // Also update 'aciBand' if missing, but 'trait' entity has info?
            // AciTrait has 'traitTitle' which is the Band/Level Name usually.
            if (!(aciAttempt as any).aciBand) {
              (aciAttempt as any).aciBand = {
                levelName: trait.traitTitle,
                compatibilityTag: trait.shortSummary, // Mapping summary to tag?
                interpretation: trait.personalizedInsight,
              };
            }
          }
        }
      }
      // ------------------------------------

      // Maintain currentAttempt logic for stats bar if needed (usually latest active)
      // If we just sort attempts by ID DESC, the first one is the latest.
      const currentAttempt = attempts.sort(
        (a, b) => Number(b.id) - Number(a.id),
      )[0];

      // Calculate currentLevel from max level number in attempts
      const currentLevel = attempts.reduce((max, attempt) => {
        const lvl = attempt.assessmentLevel?.levelNumber || 0;
        return lvl > max ? lvl : max;
      }, 1);

      return {
        ...session,
        attempts, // Return full list
        currentAttempt,
        currentLevel,
      };
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  }

  async getLevels() {
    try {
      return await this.levelRepo
        .createQueryBuilder('al')
        .where('al.is_mandatory = :isMandatory', { isMandatory: true })
        .orderBy('al.sort_order', 'ASC')
        .getMany();
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }

  async findGroupDepartmentStats(groupId: number) {
    try {
      const stats = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoin('s.registration', 'r')
        .leftJoin(DepartmentDegree, 'dd', 'dd.id = r.departmentDegreeId')
        .leftJoin(Department, 'd', 'd.id = dd.departmentId')
        .select([
          'r.departmentDegreeId AS "id"',
          'd.name AS "name"',
          'COUNT(s.id) AS "total"',
          `SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS "completed"`,
        ])
        .where('s.groupAssessmentId = :groupId', { groupId })
        .andWhere('r.departmentDegreeId IS NOT NULL')
        .groupBy('r.departmentDegreeId, d.name')
        .getRawMany();

      return {
        departments: stats.map((s) => ({
          id: Number(s.id),
          name: s.name,
          total: Number(s.total),
          completed: Number(s.completed),
        })),
      };
    } catch (error) {
      console.error('Error fetching group department stats:', error);
      return { departments: [] };
    }
  }
}
