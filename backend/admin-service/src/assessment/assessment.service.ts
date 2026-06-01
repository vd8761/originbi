import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AssessmentSession,
  Program,
  AssessmentLevel,
  AssessmentAttempt,
  GroupAssessment,
  Groups,
  Registration,
  AciTraitValueNote,
  AciTrait,
  AciValue,
} from '@originbi/shared-entities';
import { Department } from '../departments/department.entity';
import { DepartmentDegree } from '../departments/department-degree.entity';
import { DegreeType } from '../departments/degree-type.entity';
import { AssessmentGenerationService } from './assessment-generation.service';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);
  private readonly ADMIN_USER_ID = 1;

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
    private readonly dataSource: DataSource,
    private readonly assessmentGenService: AssessmentGenerationService,
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
    emailStatus?: string,
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

      // LEFT JOIN assessment_reports for email status filtering only
      qb.leftJoin(
        'assessment_reports',
        'ar',
        'ar.assessment_session_id = as.id',
      );

      // Email status filter
      if (emailStatus === 'not_sent') {
        qb.andWhere('(ar.email_sent IS NULL OR ar.email_sent = false)');
      } else if (emailStatus === 'sent') {
        qb.andWhere('ar.email_sent = true AND ar.email_sent_to = u.email');
      } else if (emailStatus === 'third_party') {
        qb.andWhere('ar.email_sent = true AND ar.email_sent_to != u.email');
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
        userId: r.userId,
      }));

      // Fetch email status from assessment_reports via raw query for all session IDs
      if (augmentedRows.length > 0) {
        const ids = augmentedRows.map((r) => r.id);
        const emailData: Array<{
          session_id: number;
          email_sent: boolean;
          email_sent_to: string;
        }> = await this.sessionRepo.manager.query(
          `SELECT assessment_session_id as session_id, email_sent, email_sent_to
             FROM assessment_reports
             WHERE assessment_session_id = ANY($1::int[])`,
          [ids],
        );
        const emailMap = emailData.reduce(
          (acc, e) => {
            acc[e.session_id] = e;
            return acc;
          },
          {} as Record<number, (typeof emailData)[0]>,
        );

        augmentedRows.forEach((r: any) => {
          const e = emailMap[r.id];
          r.emailSent = e?.email_sent ?? null;
          r.emailSentTo = e?.email_sent_to ?? null;
        });
      }

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

      // Rehydrate transient report password and agile scores for frontend candidate preview components
      let reportAgileScores: any = null;
      try {
        const report = await this.sessionRepo.manager.query(
          `SELECT report_password as "reportPassword", agile_scores as "agileScores", email_sent as "emailSent", email_sent_at as "emailSentAt", email_sent_to as "emailSentTo" FROM assessment_reports WHERE assessment_session_id = $1 LIMIT 1`,
          [id],
        );
        if (report && report.length > 0) {
          if (!session.metadata) {
            session.metadata = {};
          }
          if (report[0].reportPassword) {
            session.metadata.reportPassword = report[0].reportPassword;
          }
          if (report[0].emailSent !== undefined) {
            session.metadata.emailSent = report[0].emailSent;
            session.metadata.emailSentAt = report[0].emailSentAt;
            session.metadata.emailSentTo = report[0].emailSentTo;
          }
          if (report[0].agileScores) {
            reportAgileScores = report[0].agileScores;
          }
        }
      } catch (err) {
        console.error('Failed to fetch from assessment_reports:', err);
      }

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

      // --- INJECT AGILE SCORES INTO ACI ATTEMPT METADATA ---
      if (aciAttempt && reportAgileScores) {
        // agile_scores is stored as an array; take the first element
        const rawScores = Array.isArray(reportAgileScores)
          ? reportAgileScores[0]
          : reportAgileScores;
        if (rawScores) {
          if (!aciAttempt.metadata) {
            aciAttempt.metadata = {};
          }
          // Store as agile_scores with PascalCase keys (frontend expects Commitment, Focus, etc.)
          aciAttempt.metadata.agile_scores = {
            Commitment: rawScores.commitment ?? rawScores.Commitment ?? 0,
            Focus: rawScores.focus ?? rawScores.Focus ?? 0,
            Openness: rawScores.openness ?? rawScores.Openness ?? 0,
            Respect: rawScores.respect ?? rawScores.Respect ?? 0,
            Courage: rawScores.courage ?? rawScores.Courage ?? 0,
            total:
              (rawScores.commitment ?? rawScores.Commitment ?? 0) +
              (rawScores.focus ?? rawScores.Focus ?? 0) +
              (rawScores.openness ?? rawScores.Openness ?? 0) +
              (rawScores.respect ?? rawScores.Respect ?? 0) +
              (rawScores.courage ?? rawScores.Courage ?? 0),
          };
        }
      }

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
        .leftJoin(DegreeType, 'dt', 'dt.id = dd.degreeTypeId')
        .select([
          'r.departmentDegreeId AS "id"',
          'd.name AS "departmentName"',
          'dt.name AS "degreeName"',
          'COUNT(s.id) AS "total"',
          `SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) AS "completed"`,
        ])
        .where('s.groupAssessmentId = :groupId', { groupId })
        .andWhere('r.departmentDegreeId IS NOT NULL')
        .groupBy('r.departmentDegreeId, d.name, dt.name')
        .getRawMany();

      return {
        departments: stats.map((s) => {
          // Avoid duplicating the degree prefix when the department name already
          // begins with it — e.g. "MBA" + "MBA (Master of Business Administration)"
          // collapses to "MBA (Master of Business Administration)".
          const deptName: string = s.departmentName ?? '';
          const degreeName: string = s.degreeName ?? '';
          const startsWithDegree =
            degreeName &&
            deptName.toUpperCase().startsWith(degreeName.toUpperCase());
          return {
            id: Number(s.id),
            name: startsWithDegree || !degreeName
              ? deptName
              : `${degreeName} ${deptName}`,
            total: Number(s.total),
            completed: Number(s.completed),
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching group department stats:', error);
      return { departments: [] };
    }
  }

  /**
   * Assigns a new exam (Program + date window) to every active user already
   * registered in a Group. Find-or-creates the parent GroupAssessment, then
   * for each eligible user that doesn't already have a session for it,
   * creates an AssessmentSession + mandatory-level AssessmentAttempts and
   * generates Level-1 questions. Returns a per-user summary.
   */
  async assignGroupExam(input: {
    groupId: number;
    programId: number;
    examStart?: string;
    examEnd?: string;
    sendEmail?: boolean;
  }) {
    const { groupId, programId, examStart, examEnd } = input;

    if (!groupId) throw new BadRequestException('groupId is required');
    if (!programId) throw new BadRequestException('programId is required');

    const validFrom = examStart ? new Date(examStart) : new Date();
    const validTo = examEnd
      ? new Date(examEnd)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      const program = await manager
        .getRepository(Program)
        .findOne({ where: { id: programId as any } });
      if (!program) {
        throw new BadRequestException(`Program ${programId} not found`);
      }

      const group = await manager
        .getRepository(Groups)
        .findOne({ where: { id: groupId } });
      if (!group) {
        throw new BadRequestException(`Group ${groupId} not found`);
      }

      // 1. Find-or-create the GroupAssessment row (same dedupe key as
      //    single-user admin create: groupId + programId + overlapping window).
      const gaRepo = manager.getRepository(GroupAssessment);
      let groupAssessment = await gaRepo
        .createQueryBuilder('ga')
        .where('ga.group_id = :groupId', { groupId })
        .andWhere('ga.program_id = :programId', { programId })
        .andWhere(
          '(ga.valid_to IS NULL OR ga.valid_to >= :from) AND (ga.valid_from IS NULL OR ga.valid_from <= :to)',
          { from: validFrom, to: validTo },
        )
        .orderBy('ga.created_at', 'DESC')
        .getOne();

      if (!groupAssessment) {
        groupAssessment = gaRepo.create({
          groupId: Number(groupId),
          programId: Number(programId),
          validFrom,
          validTo,
          totalCandidates: 0,
          status: 'NOT_STARTED',
          createdByUserId: this.ADMIN_USER_ID,
          metadata: { source: 'ADMIN_ASSIGN_GROUP_EXAM' },
        });
        groupAssessment = await gaRepo.save(groupAssessment);
      }

      // 2. Pull every active registration in this group.
      const registrations = await manager
        .getRepository(Registration)
        .createQueryBuilder('r')
        .where('r.group_id = :groupId', { groupId })
        .andWhere('r.is_deleted = false')
        .getMany();

      if (registrations.length === 0) {
        return {
          groupAssessmentId: Number(groupAssessment.id),
          totalRegistrations: 0,
          created: 0,
          skipped: 0,
          failed: 0,
          failures: [] as { registrationId: number; reason: string }[],
        };
      }

      // 3. Find users that already have a session for THIS GroupAssessment so
      //    we can skip them (idempotency: repeated assign click is a no-op).
      const existingSessions = await manager
        .getRepository(AssessmentSession)
        .find({
          where: { groupAssessmentId: Number(groupAssessment.id) },
          select: ['userId'],
        });
      const alreadyAssigned = new Set(
        existingSessions.map((s) => String(s.userId)),
      );

      const levels = await manager.getRepository(AssessmentLevel).find({
        where: { isMandatory: true },
        order: { sortOrder: 'ASC' },
      });

      let created = 0;
      let relinked = 0;
      let skipped = 0;
      let failed = 0;
      const failures: { registrationId: number; reason: string }[] = [];

      for (const registration of registrations) {
        if (alreadyAssigned.has(String(registration.userId))) {
          skipped++;
          continue;
        }

        try {
          // Prevent double-scheduling: if the user already has an
          // unlinked session for this program (e.g. their original
          // individual assignment), re-link it into this group assessment
          // instead of creating a second session. Mirrors the
          // add-candidate flow.
          const existingUnlinked = await manager
            .getRepository(AssessmentSession)
            .createQueryBuilder('s')
            .where('s.user_id = :uid', { uid: registration.userId })
            .andWhere('s.program_id = :pid', { pid: programId })
            .andWhere('s.group_assessment_id IS NULL')
            .orderBy(
              `CASE WHEN s.status = 'NOT_STARTED' THEN 0 ELSE 1 END`,
              'ASC',
            )
            .addOrderBy('s.created_at', 'DESC')
            .getOne();

          if (existingUnlinked) {
            existingUnlinked.groupAssessmentId = Number(groupAssessment.id);
            existingUnlinked.groupId = Number(groupId);
            await manager.save(existingUnlinked);
            relinked++;
            continue;
          }

          const session = manager.create(AssessmentSession, {
            userId: registration.userId,
            registrationId: registration.id,
            programId: Number(programId),
            groupId: Number(groupId),
            groupAssessmentId: Number(groupAssessment.id),
            status: 'NOT_STARTED',
            validFrom,
            validTo,
            metadata: { source: 'ADMIN_ASSIGN_GROUP_EXAM' },
          });
          await manager.save(session);

          for (const level of levels) {
            const attempt = manager.create(AssessmentAttempt, {
              userId: registration.userId,
              registrationId: registration.id,
              programId: Number(programId),
              assessmentSessionId: session.id,
              assessmentLevelId: level.id,
              status: 'NOT_STARTED',
            });
            await manager.save(attempt);

            if (level.levelNumber === 1 || level.name === 'Level 1') {
              await this.assessmentGenService.generateQuestions(
                attempt,
                manager,
              );
            }
          }
          created++;
        } catch (err: any) {
          this.logger.error(
            `assignGroupExam: failed for registration ${registration.id}`,
            err?.stack || err,
          );
          failed++;
          failures.push({
            registrationId: Number(registration.id),
            reason: err?.message || 'Unknown error',
          });
        }
      }

      // 4. Update the GroupAssessment candidate total to reflect reality.
      const total = await manager
        .getRepository(AssessmentSession)
        .count({ where: { groupAssessmentId: Number(groupAssessment.id) } });
      groupAssessment.totalCandidates = total;
      await gaRepo.save(groupAssessment);

      return {
        groupAssessmentId: Number(groupAssessment.id),
        totalRegistrations: registrations.length,
        created,
        relinked,
        skipped,
        failed,
        failures,
      };
    });
  }

  /**
   * Returns the pool of users that the admin can add as a candidate to a
   * specific group assessment. Eligibility (all must hold):
   *   - registrationSource = 'ADMIN'
   *   - Registration.groupId IS NULL (not yet in any group)
   *   - Registration.programId = group_assessment.program_id
   *   - Not already linked to this group_assessment via a session
   */
  async findEligibleCandidatesForGroupAssessment(
    groupAssessmentId: number,
    search?: string,
  ) {
    const ga = await this.groupAssessmentRepo.findOne({
      where: { id: groupAssessmentId },
    });
    if (!ga) {
      throw new BadRequestException(
        `GroupAssessment ${groupAssessmentId} not found`,
      );
    }

    const qb = this.sessionRepo.manager
      .getRepository(Registration)
      .createQueryBuilder('r')
      .where('r.registration_source = :src', { src: 'ADMIN' })
      .andWhere('r.group_id IS NULL')
      .andWhere('r.program_id = :programId', { programId: ga.programId })
      .andWhere('r.is_deleted = false')
      .andWhere((qbInner) => {
        const sub = qbInner
          .subQuery()
          .select('s.user_id')
          .from(AssessmentSession, 's')
          .where('s.group_assessment_id = :gaId', { gaId: groupAssessmentId })
          .getQuery();
        return `r.user_id NOT IN ${sub}`;
      });

    if (search && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(r.full_name) LIKE :s OR LOWER(r.mobile_number) LIKE :s)',
        { s },
      );
    }

    qb.orderBy('r.created_at', 'DESC').limit(50);

    const rows = await qb.getMany();

    // Hydrate emails from the users table (Registration doesn't store email).
    const userIds = rows.map((r) => r.userId).filter(Boolean);
    let emailByUserId = new Map<string, string>();
    if (userIds.length) {
      const users = await this.sessionRepo.manager.query(
        `SELECT id, email FROM users WHERE id = ANY($1::bigint[])`,
        [userIds],
      );
      emailByUserId = new Map(
        users.map((u: any) => [String(u.id), String(u.email || '')]),
      );
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        // Allow email search too — re-filter in memory since email lives in
        // a different table.
        const filtered = rows.filter((r) => {
          const email = emailByUserId.get(String(r.userId)) || '';
          return (
            r.fullName?.toLowerCase().includes(s) ||
            (r.mobileNumber || '').toLowerCase().includes(s) ||
            email.toLowerCase().includes(s)
          );
        });
        return filtered.map((r) => ({
          registrationId: Number(r.id),
          userId: Number(r.userId),
          fullName: r.fullName,
          email: emailByUserId.get(String(r.userId)) || null,
          mobileNumber: r.mobileNumber,
          countryCode: r.countryCode,
        }));
      }
    }

    return rows.map((r) => ({
      registrationId: Number(r.id),
      userId: Number(r.userId),
      fullName: r.fullName,
      email: emailByUserId.get(String(r.userId)) || null,
      mobileNumber: r.mobileNumber,
      countryCode: r.countryCode,
    }));
  }

  /**
   * Re-link an eligible user's existing AssessmentSession into a group
   * assessment. Does NOT create a new session; just sets the session's
   * groupAssessmentId + groupId, and sets the Registration.groupId so the
   * user is recorded as being in the group. Re-validates eligibility on the
   * server to defend against stale UI.
   */
  async addCandidateToGroupAssessment(
    groupAssessmentId: number,
    registrationId: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const ga = await manager
        .getRepository(GroupAssessment)
        .findOne({ where: { id: groupAssessmentId } });
      if (!ga) {
        throw new BadRequestException(
          `GroupAssessment ${groupAssessmentId} not found`,
        );
      }

      const registration = await manager
        .getRepository(Registration)
        .findOne({ where: { id: registrationId as any } });
      if (!registration) {
        throw new BadRequestException(
          `Registration ${registrationId} not found`,
        );
      }

      // Server-side re-validation (UI must not be trusted).
      if (registration.registrationSource !== 'ADMIN') {
        throw new BadRequestException(
          'Only ADMIN-created users can be added to a group from this screen.',
        );
      }
      if (registration.groupId) {
        throw new BadRequestException(
          'User is already in a group. Remove them from that group first.',
        );
      }
      if (Number(registration.programId) !== Number(ga.programId)) {
        throw new BadRequestException(
          "User's program does not match the group assessment's program.",
        );
      }

      // Find their unlinked session for this program. Prefer NOT_STARTED,
      // tie-break by most recent.
      const session = await manager
        .getRepository(AssessmentSession)
        .createQueryBuilder('s')
        .where('s.user_id = :userId', { userId: registration.userId })
        .andWhere('s.program_id = :programId', { programId: ga.programId })
        .andWhere('s.group_assessment_id IS NULL')
        .orderBy(
          `CASE WHEN s.status = 'NOT_STARTED' THEN 0 ELSE 1 END`,
          'ASC',
        )
        .addOrderBy('s.created_at', 'DESC')
        .getOne();

      if (!session) {
        throw new BadRequestException(
          'User has no unlinked assessment session for this program. Cannot add.',
        );
      }

      // Re-link the session into the group assessment.
      session.groupAssessmentId = Number(ga.id);
      session.groupId = Number(ga.groupId);
      await manager.save(session);

      // Mark the registration as being in the group.
      registration.group = { id: Number(ga.groupId) } as any;
      await manager.save(registration);

      // Bump candidate count.
      const total = await manager
        .getRepository(AssessmentSession)
        .count({ where: { groupAssessmentId: Number(ga.id) } });
      ga.totalCandidates = total;
      await manager.save(ga);

      return {
        groupAssessmentId: Number(ga.id),
        sessionId: Number(session.id),
        registrationId: Number(registration.id),
        totalCandidates: total,
      };
    });
  }
}
