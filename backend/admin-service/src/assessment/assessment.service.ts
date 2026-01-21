/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
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
} from '@originbi/shared-entities';

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
        // Get Max Level attempted for each session using attemptRepo
        const rawLevels = await this.attemptRepo
          .createQueryBuilder('aa')
          .select('aa.assessmentSessionId', 'sid')
          .addSelect('MAX(al.levelNumber)', 'maxLvl')
          .leftJoin('aa.assessmentLevel', 'al')
          .where('aa.assessmentSessionId IN (:...ids)', { ids: sessionIds })
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
}
