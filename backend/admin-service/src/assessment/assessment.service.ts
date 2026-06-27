import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
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
import { LevelEligibilityService } from '../levels/level-eligibility.service';

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
    private readonly levelEligibility: LevelEligibilityService,
  ) {}

  /** Terminal session statuses - a user with only these can receive a new exam. */
  private static readonly TERMINAL_SESSION_STATUSES = [
    'COMPLETED',
    'EXPIRED',
    'PARTIALLY_EXP',
    'PARTIALLY_EXPIRED',
  ];

  /** True when a level is the Level 1 Behavioral (DISC) level. */
  private isBehavioralLevel(level: AssessmentLevel): boolean {
    return (
      level.levelNumber === 1 ||
      String(level.patternType || '').toUpperCase() === 'DISC' ||
      level.name === 'Level 1'
    );
  }

  /**
   * Resolve the assessment levels a registration should receive, in order,
   * from the admin-configurable `levels.*` settings (enable flag +
   * program/department/board scope). Mirrors the registration-time logic so
   * the preview and the actual assignment always agree with current settings.
   */
  private async resolveEnabledLevelsForRegistration(
    manager: EntityManager,
    registration: Registration,
    programId: number,
  ): Promise<AssessmentLevel[]> {
    const levels = await manager.getRepository(AssessmentLevel).find({
      order: { sortOrder: 'ASC' },
    });

    let departmentId: number | string | null = null;
    if (registration.departmentDegreeId) {
      const rows = await manager.query(
        `SELECT department_id FROM department_degrees WHERE id = $1 LIMIT 1`,
        [registration.departmentDegreeId],
      );
      departmentId = rows?.[0]?.department_id ?? null;
    }

    return this.levelEligibility.filterEnabledLevels(levels, {
      programId,
      departmentDegreeId: registration.departmentDegreeId,
      departmentId,
      studentBoard: registration.studentBoard,
    });
  }

  /**
   * Preview what a brand-new individual exam would assign to a single user:
   * the program and the levels currently enabled for their registration scope.
   * Also reports whether the user currently has an ongoing (non-terminal)
   * session, in which case a new exam cannot be assigned.
   */
  async previewIndividualExam(registrationId: number) {
    const registration = await this.dataSource
      .getRepository(Registration)
      .findOne({ where: { id: registrationId as any } });
    if (!registration) {
      throw new BadRequestException(`Registration ${registrationId} not found`);
    }
    if (!registration.programId) {
      throw new BadRequestException(
        'Registration has no program; cannot assign an exam.',
      );
    }

    const programId = Number(registration.programId);
    const program = await this.dataSource
      .getRepository(Program)
      .findOne({ where: { id: programId as any } });

    const levels = await this.resolveEnabledLevelsForRegistration(
      this.dataSource.manager,
      registration,
      programId,
    );

    const ongoingSession = await this.dataSource
      .getRepository(AssessmentSession)
      .createQueryBuilder('s')
      .where('s.user_id = :uid', { uid: registration.userId })
      .andWhere('s.status NOT IN (:...terminal)', {
        terminal: AssessmentService.TERMINAL_SESSION_STATUSES,
      })
      .getOne();

    return {
      registrationId: Number(registration.id),
      userId: Number(registration.userId),
      program: program
        ? {
            id: Number(program.id),
            name: program.name,
            assessmentTitle: program.assessmentTitle,
          }
        : null,
      levels: levels.map((l) => ({
        id: Number(l.id),
        levelNumber: l.levelNumber,
        name: l.name,
        patternType: l.patternType,
      })),
      canAssign: !ongoingSession,
      ongoingStatus: ongoingSession?.status ?? null,
    };
  }

  /**
   * Assign a brand-new individual exam (date window only) to a single user.
   * Reuses the user's registration program + current level settings. Creates a
   * fresh standalone AssessmentSession (no group) + mandatory-level attempts,
   * generating Level-1 questions up-front. Blocks when the user has an ongoing
   * (non-terminal) session. The new session becomes their latest exam.
   */
  async assignIndividualExam(input: {
    registrationId: number;
    examStart?: string;
    examEnd?: string;
  }) {
    const { registrationId, examStart, examEnd } = input;
    if (!registrationId) {
      throw new BadRequestException('registrationId is required');
    }

    const validFrom = examStart ? new Date(examStart) : new Date();
    const validTo = examEnd
      ? new Date(examEnd)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      const registration = await manager
        .getRepository(Registration)
        .findOne({ where: { id: registrationId as any } });
      if (!registration) {
        throw new BadRequestException(
          `Registration ${registrationId} not found`,
        );
      }
      if (!registration.programId) {
        throw new BadRequestException(
          'Registration has no program; cannot assign an exam.',
        );
      }
      const programId = Number(registration.programId);

      // Block assignment while a non-terminal session exists - only users with
      // a completed/expired exam may receive a new one.
      const ongoingSession = await manager
        .getRepository(AssessmentSession)
        .createQueryBuilder('s')
        .where('s.user_id = :uid', { uid: registration.userId })
        .andWhere('s.status NOT IN (:...terminal)', {
          terminal: AssessmentService.TERMINAL_SESSION_STATUSES,
        })
        .getOne();
      if (ongoingSession) {
        throw new BadRequestException(
          `User has an ongoing assessment (Status: ${ongoingSession.status}). Cannot assign a new exam.`,
        );
      }

      const session = manager.create(AssessmentSession, {
        userId: registration.userId,
        registrationId: registration.id,
        programId,
        groupId: null,
        groupAssessmentId: null,
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: { source: 'ADMIN_ASSIGN_INDIVIDUAL_EXAM' },
      });
      await manager.save(session);

      const levels = await this.resolveEnabledLevelsForRegistration(
        manager,
        registration,
        programId,
      );

      for (const level of levels) {
        const attempt = manager.create(AssessmentAttempt, {
          userId: registration.userId,
          registrationId: registration.id,
          programId,
          assessmentSessionId: session.id,
          assessmentLevelId: level.id,
          status: 'NOT_STARTED',
        });
        await manager.save(attempt);

        if (this.isBehavioralLevel(level)) {
          await this.assessmentGenService.generateQuestions(attempt, manager);
        }
      }

      return {
        sessionId: Number(session.id),
        registrationId: Number(registration.id),
        userId: Number(registration.userId),
        programId,
        levelsAssigned: levels.length,
        validFrom,
        validTo,
      };
    });
  }

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
    groupBy?: string,
  ) {
    try {
      // COMBINED "BY GROUP" VIEW: aggregate group_assessments by (group, program)
      // so a cohort spread across several exam windows shows as ONE row.
      if (type === 'group' && groupBy === 'group') {
        return this.findGroupsCombined(
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          startDate,
          endDate,
          status,
        );
      }

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

  /**
   * "By Group" list: aggregates group_assessments by (group_id, program_id) so
   * each cohort+program shows as a single combined row regardless of how many
   * exam windows it spans. Status is rolled up; candidate count is summed; the
   * window is min(start)..max(end).
   */
  async findGroupsCombined(
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
    status?: string,
  ) {
    const qb = this.groupAssessmentRepo
      .createQueryBuilder('ga')
      .leftJoin(Program, 'p', 'p.id = ga.programId')
      .leftJoin(Groups, 'g', 'g.id = ga.groupId')
      .select('ga.group_id', 'groupId')
      .addSelect('ga.program_id', 'programId')
      .addSelect('g.name', 'groupName')
      .addSelect('p.name', 'programName')
      .addSelect('p.assessment_title', 'assessmentTitle')
      .addSelect('COUNT(ga.id)', 'assessmentCount')
      .addSelect('COALESCE(SUM(ga.total_candidates), 0)', 'totalCandidates')
      .addSelect('MIN(ga.valid_from)', 'firstStart')
      .addSelect('MAX(ga.valid_to)', 'lastEnd')
      .addSelect("BOOL_AND(ga.status = 'COMPLETED')", 'allCompleted')
      .addSelect("BOOL_AND(ga.status = 'NOT_STARTED')", 'allNotStarted')
      .groupBy('ga.group_id')
      .addGroupBy('ga.program_id')
      .addGroupBy('g.name')
      .addGroupBy('p.name')
      .addGroupBy('p.assessment_title');

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(g.name) LIKE :s)',
        { s },
      );
    }
    if (startDate)
      qb.andWhere('ga.valid_from >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    if (endDate)
      qb.andWhere('ga.valid_from <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    // status filter applies at the window level (a group is included if it has a
    // window in that status); the rolled-up row status is computed separately.
    if (status) qb.andWhere('ga.status = :status', { status });

    // Sort on an aggregate alias.
    const sortMap: Record<string, string> = {
      group_name: 'g.name',
      program_name: 'p.name',
      exam_starts_on: 'MIN(ga.valid_from)',
      exam_ends_on: 'MAX(ga.valid_to)',
      no_of_candidates: 'COALESCE(SUM(ga.total_candidates), 0)',
    };
    qb.orderBy(sortMap[sortBy ?? ''] ?? 'MIN(ga.valid_from)', sortOrder);

    // Aggregate rows are few (one per group+program) - fetch all, count, slice.
    const allRows = await qb.getRawMany();
    const total = allRows.length;
    const pageRows = allRows.slice((page - 1) * limit, page * limit);

    const data = pageRows.map((r) => ({
      // synthetic id so the frontend can route to the combined detail view
      id: `${r.groupId}:${r.programId}`,
      groupId: Number(r.groupId),
      programId: Number(r.programId),
      groupName: r.groupName || 'N/A',
      program: {
        id: Number(r.programId),
        name: r.programName,
        assessmentTitle: r.assessmentTitle,
      },
      assessmentCount: Number(r.assessmentCount),
      totalCandidates: Number(r.totalCandidates),
      validFrom: r.firstStart,
      validTo: r.lastEnd,
      createdAt: r.firstStart,
      status: r.allCompleted
        ? 'COMPLETED'
        : r.allNotStarted
          ? 'NOT_STARTED'
          : 'IN_PROGRESS',
      // parity fields with the per-assessment rows
      userId: 0,
      registrationId: 0,
      currentLevel: 0,
      totalLevels: 0,
    }));

    return { data, total, page, limit };
  }

  /**
   * Combined detail for a (group, program): every exam window plus the merged
   * candidate list across all windows, deduped to ONE row per student (their
   * latest completed session). The report button uses group.id, which the
   * group-scoped report endpoint already supports.
   */
  async findGroupCombinedDetails(groupId: number, programId: number) {
    try {
      const group = await this.dataSource
        .getRepository(Groups)
        .findOne({ where: { id: groupId } });

      const assessments = await this.groupAssessmentRepo.find({
        where: { groupId, programId },
        relations: ['program'],
        order: { validFrom: 'ASC' },
      });

      const program =
        assessments[0]?.program ||
        (await this.dataSource
          .getRepository(Program)
          .findOne({ where: { id: programId } }));

      // All sessions for this (group, program), ordered so the latest completed
      // session per user comes first, then dedup in memory.
      const sessions = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.user', 'u')
        .leftJoinAndSelect('s.registration', 'r')
        .where('s.group_id = :groupId', { groupId })
        .andWhere('s.program_id = :programId', { programId })
        .orderBy('s.user_id', 'ASC')
        .addOrderBy('s.completed_at', 'DESC', 'NULLS LAST')
        .addOrderBy('s.created_at', 'DESC')
        .getMany();

      const seen = new Set<number>();
      const dedupedSessions = sessions.filter((s) => {
        const uid = Number(s.userId);
        if (seen.has(uid)) return false;
        seen.add(uid);
        return true;
      });

      return {
        groupId,
        programId,
        group: group ? { id: group.id, name: group.name } : null,
        program,
        totalAssessments: assessments.length,
        totalCandidates: dedupedSessions.length,
        assessments: assessments.map((ga) => ({
          id: ga.id,
          status: ga.status,
          validFrom: ga.validFrom,
          validTo: ga.validTo,
          totalCandidates: ga.totalCandidates,
        })),
        sessions: dedupedSessions.map((s) => ({
          ...s,
          userFullName: s.registration?.fullName || 'N/A',
          userEmail: s.user?.email || 'N/A',
        })),
      };
    } catch (error) {
      console.error('Error fetching group combined details:', error);
      throw error;
    }
  }

  /**
   * Survey (open question_type='SURVEY') answers for a session: the questions
   * shown to this candidate plus the option they picked. Non-scoring - purely
   * for the admin "Survey" preview tab. Empty array => no survey in this exam.
   */
  async findSurveyAnswers(sessionId: number) {
    const rows = await this.dataSource.query(
      `SELECT a.question_sequence  AS seq,
              oq.id                AS question_id,
              oq.set_number        AS set_number,
              oq.context_text_en   AS context_en,
              oq.context_text_ta   AS context_ta,
              oq.question_text_en  AS question_en,
              oq.question_text_ta  AS question_ta,
              oq.metadata->>'theme' AS theme,
              a.open_option_id     AS selected_option_id,
              a.status             AS status
       FROM assessment_answers a
       JOIN open_questions oq ON a.open_question_id = oq.id
       WHERE a.assessment_session_id = $1
         AND a.question_source = 'OPEN'
         AND oq.question_type = 'SURVEY'
       ORDER BY a.question_sequence ASC`,
      [sessionId],
    );

    if (!rows || rows.length === 0) {
      return { setNumber: null, total: 0, answered: 0, answers: [] };
    }

    const questionIds = rows.map((r: any) => r.question_id);
    const opts = await this.dataSource.query(
      `SELECT id, open_question_id, option_text_en, option_text_ta, display_order
       FROM open_question_options
       WHERE open_question_id = ANY($1)
       ORDER BY open_question_id, display_order ASC`,
      [questionIds],
    );

    const optsByQ = new Map<string, any[]>();
    for (const o of opts) {
      const k = String(o.open_question_id);
      if (!optsByQ.has(k)) optsByQ.set(k, []);
      optsByQ.get(k)!.push(o);
    }

    const answers = rows.map((r: any) => {
      const selId =
        r.selected_option_id != null ? String(r.selected_option_id) : null;
      return {
        sequence: r.seq,
        questionId: Number(r.question_id),
        setNumber: r.set_number,
        theme: r.theme || null,
        contextEn: r.context_en,
        contextTa: r.context_ta,
        questionEn: r.question_en,
        questionTa: r.question_ta,
        status: r.status,
        answered: selId != null,
        selectedOptionId: selId != null ? Number(selId) : null,
        options: (optsByQ.get(String(r.question_id)) || []).map((o: any) => ({
          id: Number(o.id),
          displayOrder: o.display_order,
          textEn: o.option_text_en,
          textTa: o.option_text_ta,
          selected: selId != null && String(o.id) === selId,
        })),
      };
    });

    return {
      setNumber: rows[0].set_number,
      total: answers.length,
      answered: answers.filter((a) => a.answered).length,
      answers,
    };
  }

  async findMetaphorReport(sessionId: number) {
    const attemptRows = await this.dataSource.query(
      `SELECT aa.id, aa.status, aa.started_at, aa.completed_at
       FROM assessment_attempts aa
       JOIN assessment_levels al ON al.id = aa.assessment_level_id
       WHERE aa.assessment_session_id = $1
         AND (LOWER(al.name) LIKE '%metaphor%' OR LOWER(COALESCE(al.pattern_type, '')) = 'metaphor' OR al.level_number = 4)
       ORDER BY aa.id DESC
       LIMIT 1`,
      [sessionId],
    );

    if (!attemptRows || attemptRows.length === 0) {
      return {
        attempt: null,
        total: 0,
        answered: 0,
        missing: 0,
        readyForReport: false,
        answers: [],
        job: null,
        report: null,
      };
    }

    const attemptId = Number(attemptRows[0].id);
    const answers = await this.dataSource.query(
      `SELECT a.id,
              a.question_sequence AS "sequence",
              a.status,
              a.spoken_language AS "spokenLanguage",
              a.answer_text_web AS "webTranscript",
              a.answer_text_original AS "finalTranscript",
              a.answer_text_en AS "englishText",
              a.translation_status AS "translationStatus",
              a.transcription_status AS "transcriptionStatus",
              a.transcription_source AS "transcriptionSource",
              a.transcription_error AS "transcriptionError",
              a.transcription_retry_count AS "transcriptionRetryCount",
              a.transcription_next_retry_at AS "transcriptionNextRetryAt",
              q.context_text_en AS "contextEn",
              q.context_text_ta AS "contextTa",
              q.question_text_en AS "questionEn",
              q.question_text_ta AS "questionTa",
              q.image_url AS "imageUrl",
              q.image_description_en AS "imageDescriptionEn",
              q.image_description_ta AS "imageDescriptionTa"
       FROM metaphor_answers a
       JOIN metaphor_questions q ON q.id = a.metaphor_question_id
       WHERE a.assessment_attempt_id = $1
       ORDER BY a.question_sequence ASC`,
      [attemptId],
    );

    const jobRows = await this.dataSource.query(
      `SELECT id,
              status,
              retry_count AS "retryCount",
              max_retries AS "maxRetries",
              next_retry_at AS "nextRetryAt",
              last_error AS "lastError",
              started_at AS "startedAt",
              completed_at AS "completedAt",
              updated_at AS "updatedAt"
       FROM metaphor_report_jobs
       WHERE assessment_attempt_id = $1
       LIMIT 1`,
      [attemptId],
    );

    const reportRows = await this.dataSource.query(
      `SELECT id,
              model,
              markdown,
              generated_at AS "generatedAt",
              updated_at AS "updatedAt"
       FROM metaphor_reports
       WHERE assessment_attempt_id = $1
       LIMIT 1`,
      [attemptId],
    );

    const total = answers.length;
    const answered = answers.filter((a: any) => a.status === 'ANSWERED').length;
    const missing = total - answered;
    const readyForReport =
      total > 0 &&
      answers.every((a: any) => {
        if (a.status === 'NOT_ANSWERED') return true;
        return (
          a.translationStatus === 'DONE' && String(a.englishText || '').trim()
        );
      });

    const imageBaseSetting = await this.dataSource.query(
      `SELECT value_string FROM originbi_settings WHERE setting_key = $1 LIMIT 1`,
      ['image_base_url'],
    );
    const imageBase = String(imageBaseSetting?.[0]?.value_string || '').replace(
      /\/+$/,
      '',
    );

    const buildImageUrl = (p: string | null): string | null => {
      if (!p) return null;
      if (/^https?:\/\//i.test(p)) return p;
      if (!imageBase) return p;
      return `${imageBase}${p.startsWith('/') ? '' : '/'}${p}`;
    };

    const formattedAnswers = (answers as any[]).map(
      (a: any): Record<string, unknown> => {
        const row = a as Record<string, unknown>;
        return {
          ...row,
          imageUrl: buildImageUrl(row.imageUrl as string | null),
        };
      },
    );

    return {
      attempt: {
        id: attemptId,
        status: attemptRows[0].status,
        startedAt: attemptRows[0].started_at,
        completedAt: attemptRows[0].completed_at,
      },
      total,
      answered,
      missing,
      readyForReport,
      answers: formattedAnswers,
      job: jobRows[0] || null,
      report: reportRows[0] || null,
    };
  }

  async retryMetaphorReport(attemptId: number) {
    const existingReport = await this.dataSource.query(
      `SELECT id FROM metaphor_reports WHERE assessment_attempt_id = $1 LIMIT 1`,
      [attemptId],
    );
    if (existingReport?.length) {
      return { success: false, reason: 'report_exists' };
    }

    await this.dataSource.query(
      `INSERT INTO metaphor_report_jobs
         (assessment_attempt_id, status, retry_count, max_retries, next_retry_at, last_error, created_at, updated_at)
       VALUES ($1, 'PENDING', 0, 5, NULL, NULL, NOW(), NOW())
       ON CONFLICT (assessment_attempt_id)
       DO UPDATE SET status = 'PENDING',
                     retry_count = 0,
                     next_retry_at = NULL,
                     last_error = NULL,
                     updated_at = NOW()`,
      [attemptId],
    );

    return { success: true, queued: true };
  }

  async findIatReport(sessionId: number) {
    const attemptRows = await this.dataSource.query(
      `SELECT aa.id, aa.status, aa.started_at, aa.completed_at, aa.metadata
       FROM assessment_attempts aa
       JOIN assessment_levels al ON al.id = aa.assessment_level_id
       WHERE aa.assessment_session_id = $1
         AND (
           al.level_number = 3
           OR UPPER(COALESCE(al.pattern_type, '')) = 'IAT_GEN'
           OR aa.metadata->>'assessment_kind' = 'IAT_GEN'
           OR EXISTS (
             SELECT 1 FROM iat_attempt_modules iam
             WHERE iam.assessment_attempt_id = aa.id
           )
         )
       ORDER BY aa.id DESC
       LIMIT 1`,
      [sessionId],
    );

    if (!attemptRows?.length) {
      return {
        attempt: null,
        total: 0,
        completed: 0,
        modules: [],
        job: null,
        report: null,
      };
    }

    const attemptId = Number(attemptRows[0].id);
    const modules = await this.dataSource.query(
      `SELECT iam.id,
              iam.module_order AS "order",
              iam.status,
              iam.compatible_average_ms AS "compatibleAverageMs",
              iam.incompatible_average_ms AS "incompatibleAverageMs",
              iam.speed_gap_ms AS "speedGapMs",
              iam.pattern_label AS "pattern",
              iam.slowest_words AS "slowestWords",
              iam.error_words AS "errorWords",
              iam.error_rate AS "errorRate",
              im.code,
              im.name,
              im.display_name AS "displayName"
       FROM iat_attempt_modules iam
       JOIN iat_modules im ON im.id = iam.module_id
       WHERE iam.assessment_attempt_id = $1
       ORDER BY iam.module_order ASC`,
      [attemptId],
    );

    const jobRows = await this.dataSource.query(
      `SELECT id,
              status,
              retry_count AS "retryCount",
              max_retries AS "maxRetries",
              next_retry_at AS "nextRetryAt",
              last_error AS "lastError",
              started_at AS "startedAt",
              completed_at AS "completedAt",
              updated_at AS "updatedAt"
       FROM iat_report_jobs
       WHERE assessment_attempt_id = $1
       LIMIT 1`,
      [attemptId],
    );

    const reportRows = await this.dataSource.query(
      `SELECT id,
              status,
              model,
              report_text AS "reportText",
              bias_map AS "biasMap",
              error,
              generated_at AS "generatedAt",
              updated_at AS "updatedAt"
       FROM iat_reports
       WHERE assessment_attempt_id = $1
       LIMIT 1`,
      [attemptId],
    );

    const total = modules.length || 6;
    const completed = modules.filter(
      (m: any) => m.status === 'COMPLETED',
    ).length;
    return {
      attempt: {
        id: attemptId,
        status: attemptRows[0].status,
        startedAt: attemptRows[0].started_at,
        completedAt: attemptRows[0].completed_at,
      },
      total,
      completed,
      modules,
      job: jobRows[0] || null,
      report: reportRows[0] || null,
    };
  }

  async retryIatReport(attemptId: number) {
    const existingReport = await this.dataSource.query(
      `SELECT id FROM iat_reports WHERE assessment_attempt_id = $1 AND status = 'DONE' LIMIT 1`,
      [attemptId],
    );
    if (existingReport?.length) {
      return { success: false, reason: 'report_exists' };
    }

    await this.dataSource.query(
      `INSERT INTO iat_report_jobs
         (assessment_attempt_id, status, retry_count, max_retries, next_retry_at, last_error, created_at, updated_at)
       VALUES ($1, 'PENDING', 0, 5, NULL, NULL, NOW(), NOW())
       ON CONFLICT (assessment_attempt_id)
       DO UPDATE SET status = 'PENDING',
                     retry_count = 0,
                     next_retry_at = NULL,
                     last_error = NULL,
                     started_at = NULL,
                     completed_at = NULL,
                     updated_at = NOW()`,
      [attemptId],
    );

    return { success: true, queued: true };
  }

  async generateMetaphorReportPdf(attemptId: number): Promise<Buffer> {
    const reportRows = await this.dataSource.query(
      `SELECT markdown, model, generated_at AS "generatedAt"
       FROM metaphor_reports
       WHERE assessment_attempt_id = $1
       LIMIT 1`,
      [attemptId],
    );

    if (!reportRows?.length || !String(reportRows[0].markdown || '').trim()) {
      throw new BadRequestException('Metaphor report is not generated yet.');
    }

    const answerRows = await this.dataSource.query(
      `SELECT a.question_sequence AS sequence,
              a.status,
              a.answer_text_original AS "finalTranscript",
              a.answer_text_en AS "englishText",
              q.question_text_en AS "questionEn"
       FROM metaphor_answers a
       JOIN metaphor_questions q ON q.id = a.metaphor_question_id
       WHERE a.assessment_attempt_id = $1
       ORDER BY a.question_sequence ASC`,
      [attemptId],
    );

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 54, bottom: 54, left: 54, right: 54 },
        info: {
          Title: `Metaphor Claude Report ${attemptId}`,
          Author: 'OriginBI',
        },
      });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const ensureSpace = (height = 80) => {
        if (doc.y + height > doc.page.height - doc.page.margins.bottom)
          doc.addPage();
      };
      const cleanInline = (value: string) =>
        value
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/__(.*?)__/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\[(.*?)\]\((.*?)\)/g, '$1');

      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#111827')
        .text('Metaphor Claude Report');
      doc.moveDown(0.4);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`Attempt ID: ${attemptId}`)
        .text(reportRows[0].model ? `Model: ${reportRows[0].model}` : '')
        .text(
          reportRows[0].generatedAt
            ? `Generated: ${new Date(reportRows[0].generatedAt).toLocaleString('en-GB')}`
            : '',
        );
      doc.moveDown(1);

      String(reportRows[0].markdown)
        .split(/\r?\n/)
        .forEach((raw) => {
          const line = raw.trim();
          if (!line) {
            doc.moveDown(0.55);
            return;
          }
          ensureSpace();
          if (line.startsWith('# ')) {
            doc.moveDown(0.45);
            doc
              .font('Helvetica-Bold')
              .fontSize(16)
              .fillColor('#111827')
              .text(cleanInline(line.slice(2)), { width: pageWidth });
          } else if (line.startsWith('## ')) {
            doc.moveDown(0.4);
            doc
              .font('Helvetica-Bold')
              .fontSize(14)
              .fillColor('#111827')
              .text(cleanInline(line.slice(3)), { width: pageWidth });
          } else if (line.startsWith('### ')) {
            doc.moveDown(0.3);
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .fillColor('#111827')
              .text(cleanInline(line.slice(4)), { width: pageWidth });
          } else if (/^\d+\.\s+/.test(line)) {
            doc
              .font('Helvetica')
              .fontSize(10.5)
              .fillColor('#111827')
              .text(cleanInline(line), {
                width: pageWidth,
                indent: 16,
                lineGap: 3,
              });
          } else if (/^[-*]\s+/.test(line)) {
            doc
              .font('Helvetica')
              .fontSize(10.5)
              .fillColor('#111827')
              .text(`- ${cleanInline(line.slice(2))}`, {
                width: pageWidth,
                indent: 16,
                lineGap: 3,
              });
          } else {
            doc
              .font('Helvetica')
              .fontSize(10.5)
              .fillColor('#111827')
              .text(cleanInline(line), {
                width: pageWidth,
                lineGap: 3,
              });
          }
        });

      if (answerRows?.length) {
        doc.addPage();
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#111827')
          .text('Question Transcript Appendix');
        doc.moveDown(0.8);
        for (const answer of answerRows) {
          ensureSpace(140);
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#111827')
            .text(`Question ${answer.sequence}`);
          doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor('#374151')
            .text(
              cleanInline(String(answer.questionEn || 'Metaphor question')),
              {
                width: pageWidth,
                lineGap: 2,
              },
            );
          doc.moveDown(0.25);
          doc
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor('#111827')
            .text('Transcript');
          doc
            .font('Helvetica')
            .fontSize(9.5)
            .fillColor('#374151')
            .text(String(answer.finalTranscript || '[No answer submitted]'), {
              width: pageWidth,
              lineGap: 2,
            });
          if (answer.englishText) {
            doc.moveDown(0.25);
            doc
              .font('Helvetica-Bold')
              .fontSize(9.5)
              .fillColor('#111827')
              .text('English Translation');
            doc
              .font('Helvetica')
              .fontSize(9.5)
              .fillColor('#374151')
              .text(String(answer.englishText), {
                width: pageWidth,
                lineGap: 2,
              });
          }
          doc.moveDown(0.8);
        }
      }

      doc.end();
    });
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
      // Return every real assessment-ladder level - not just the mandatory
      // ones. Opt-in levels like Level 3 (IAT Gen) are is_mandatory = false
      // because eligibility is now driven per-registration by the levels.*
      // settings (see migration 025), not by the global mandatory flag. The
      // candidate preview still needs them in this list so it can match a
      // candidate's actual attempts to their level and render the right tab /
      // report - otherwise the IAT Gen tab never appears even after the
      // candidate completes it. Only inert "TBD" placeholder rows are excluded.
      return await this.levelRepo
        .createQueryBuilder('al')
        .where("UPPER(COALESCE(al.pattern_type, '')) <> :placeholder", {
          placeholder: 'TBD',
        })
        .orderBy('al.sort_order', 'ASC')
        .getMany();
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }

  /** Active IAT modules for the per-scope module routing config UI. */
  async listIatModules(): Promise<
    Array<{ id: string; code: string; name: string }>
  > {
    try {
      const rows: Array<{ id: string; code: string; name: string }> =
        await this.dataSource.query(
          `SELECT id, code, display_name AS name
           FROM iat_modules
          WHERE is_active = true AND is_deleted = false
          ORDER BY module_order ASC`,
        );
      return rows.map((r) => ({
        id: String(r.id),
        code: r.code,
        name: r.name,
      }));
    } catch (error) {
      this.logger.error('Error fetching IAT modules', error as Error);
      return [];
    }
  }

  async findGroupDepartmentStats(groupId: number) {
    try {
      // Resolve the attempt level ids for DISC (Level 1) and ACI (Level 2) so we
      // can report completion PER report-type level requirement, not just the
      // session's overall status. A report only needs the levels it consumes:
      //   - Level 1 Placement & Special MBA -> Level 1 only
      //   - Standard Placement              -> Level 1 + Level 2
      // (kept in sync with the frontend REPORT_REQUIRED_LEVELS map and the
      // report-cohort SQL in student-service).
      const levels = await this.levelRepo.find();
      const l1 = levels.find((l) => l.levelNumber === 1)?.id ?? -1;
      const l2 = levels.find((l) => l.levelNumber === 2)?.id ?? -1;

      const stats = await this.sessionRepo
        .createQueryBuilder('s')
        .leftJoin('s.registration', 'r')
        .leftJoin(DepartmentDegree, 'dd', 'dd.id = r.departmentDegreeId')
        .leftJoin(Department, 'd', 'd.id = dd.departmentId')
        .leftJoin(DegreeType, 'dt', 'dt.id = dd.degreeTypeId')
        // These attempt joins fan a session out into multiple rows, so every
        // aggregate below counts DISTINCT session ids. a1/a2 are non-null only
        // when that session has a COMPLETED Level-1 / Level-2 attempt.
        .leftJoin(
          AssessmentAttempt,
          'a1',
          'a1.assessmentSessionId = s.id AND a1.assessmentLevelId = :l1 AND a1.status = :done',
          { l1, done: 'COMPLETED' },
        )
        .leftJoin(
          AssessmentAttempt,
          'a2',
          'a2.assessmentSessionId = s.id AND a2.assessmentLevelId = :l2 AND a2.status = :done',
          { l2, done: 'COMPLETED' },
        )
        .select([
          'r.departmentDegreeId AS "id"',
          'd.name AS "departmentName"',
          'dt.name AS "degreeName"',
          'COUNT(DISTINCT s.id) AS "total"',
          `COUNT(DISTINCT CASE WHEN s.status = 'COMPLETED' THEN s.id END) AS "completed"`,
          'COUNT(DISTINCT CASE WHEN a1.id IS NOT NULL THEN s.id END) AS "completedL1"',
          'COUNT(DISTINCT CASE WHEN a1.id IS NOT NULL AND a2.id IS NOT NULL THEN s.id END) AS "completedL1L2"',
        ])
        .where('s.groupAssessmentId = :groupId', { groupId })
        .andWhere('r.departmentDegreeId IS NOT NULL')
        .groupBy('r.departmentDegreeId, d.name, dt.name')
        .getRawMany();

      return {
        departments: stats.map((s) => {
          // Avoid duplicating the degree prefix when the department name already
          // begins with it - e.g. "MBA" + "MBA (Master of Business Administration)"
          // collapses to "MBA (Master of Business Administration)".
          const deptName: string = s.departmentName ?? '';
          const degreeName: string = s.degreeName ?? '';
          const startsWithDegree =
            degreeName &&
            deptName.toUpperCase().startsWith(degreeName.toUpperCase());
          return {
            id: Number(s.id),
            name:
              startsWithDegree || !degreeName
                ? deptName
                : `${degreeName} ${deptName}`,
            total: Number(s.total),
            // Legacy session-status completion (full assessment). Kept for any
            // existing consumers; the popup now uses the per-level counts below.
            completed: Number(s.completed),
            // Completion per level requirement: completedL1 = finished Level 1
            // (DISC); completedL1L2 = finished Level 1 AND Level 2 (DISC + ACI).
            completedL1: Number(s.completedL1),
            completedL1L2: Number(s.completedL1L2),
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
        // Allow email search too - re-filter in memory since email lives in
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
        .orderBy(`CASE WHEN s.status = 'NOT_STARTED' THEN 0 ELSE 1 END`, 'ASC')
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
