import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AssessmentAttempt,
  CorporateAccount,
  CorporateJob,
  CorporateJobSkill,
  JobApplication,
  JobApplicationSource,
  JobApplicationStatus,
  JobApplicationStatusHistory,
  JobLifecycleStatus,
  PersonalityTrait,
  Registration,
  User,
} from '@originbi/shared-entities';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs.query.dto';
import { ListJobCandidatesQueryDto } from './dto/list-job-candidates.query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { BulkApplyCandidatesDto } from './dto/bulk-apply-candidates.dto';
import { ListCandidatesQueryDto } from './dto/list-candidates.query.dto';

const JOB_STATUSES: JobLifecycleStatus[] = [
  'DRAFT',
  'ACTIVE',
  'HOLD',
  'CLOSED',
  'ARCHIVED',
];

const APPLICATION_STATUSES: JobApplicationStatus[] = [
  'APPLIED',
  'SHORTLISTED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

const APPLICATION_SOURCES: JobApplicationSource[] = [
  'INTERNAL',
  'EXTERNAL',
  'REFERRAL',
  'BULK_IMPORT',
];

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(CorporateJob)
    private readonly jobRepo: Repository<CorporateJob>,
    @InjectRepository(CorporateJobSkill)
    private readonly jobSkillRepo: Repository<CorporateJobSkill>,
    @InjectRepository(JobApplication)
    private readonly jobApplicationRepo: Repository<JobApplication>,
    @InjectRepository(JobApplicationStatusHistory)
    private readonly jobApplicationStatusHistoryRepo: Repository<JobApplicationStatusHistory>,
    @InjectRepository(CorporateAccount)
    private readonly corporateAccountRepo: Repository<CorporateAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(PersonalityTrait)
    private readonly traitRepo: Repository<PersonalityTrait>,
    private readonly dataSource: DataSource,
  ) {}

  private normalizeSortOrder(order?: string): 'ASC' | 'DESC' {
    return String(order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }

  private toPositiveInt(value: string | undefined, fallback: number, max = 100): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(Math.floor(n), max);
  }

  private parseId(id: number, fieldName: string): number {
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }
    return Math.floor(id);
  }

  private isValidJobStatus(status: string): status is JobLifecycleStatus {
    return JOB_STATUSES.includes(status as JobLifecycleStatus);
  }

  private isValidApplicationStatus(status: string): status is JobApplicationStatus {
    return APPLICATION_STATUSES.includes(status as JobApplicationStatus);
  }

  private async resolveCorporateContext(email: string): Promise<{ user: User; corporate: CorporateAccount }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let corporate = await this.corporateAccountRepo.findOne({
      where: { userId: user.id },
    });

    if (!corporate && user.corporateId) {
      corporate = await this.corporateAccountRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }

    if (!corporate) {
      throw new NotFoundException('Corporate account not found');
    }

    return { user, corporate };
  }

  private async generateJobRefNo(): Promise<string> {
    for (let i = 0; i < 8; i += 1) {
      const ref = `OBI-J${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
      const exists = await this.jobRepo.findOne({ where: { jobRefNo: ref } });
      if (!exists) return ref;
    }
    throw new BadRequestException('Failed to generate unique job reference number');
  }

  private normalizeSkills(requiredSkills?: string[], preferredSkills?: string[]) {
    const result: Array<{ skillName: string; skillType: 'REQUIRED' | 'PREFERRED'; weight: number }> = [];
    const seen = new Set<string>();

    const addSkill = (skillName: string, skillType: 'REQUIRED' | 'PREFERRED') => {
      const normalized = String(skillName || '').trim();
      if (!normalized) return;
      const key = `${skillType}:${normalized.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ skillName: normalized, skillType, weight: 1 });
    };

    (requiredSkills || []).forEach((skill) => addSkill(skill, 'REQUIRED'));
    (preferredSkills || []).forEach((skill) => addSkill(skill, 'PREFERRED'));

    return result;
  }

  private parseOptionalNumber(value: unknown, fieldName: string): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    return n;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    return d;
  }

  private deriveStatusFromTab(tab?: string): JobLifecycleStatus | undefined {
    const normalized = String(tab || '').toLowerCase();
    if (normalized === 'active') return 'ACTIVE';
    if (normalized === 'closed') return 'CLOSED';
    if (normalized === 'draft') return 'DRAFT';
    if (normalized === 'hold') return 'HOLD';
    return undefined;
  }

  private applyJobsListFilters(
    qb: SelectQueryBuilder<CorporateJob>,
    query: ListJobsQueryDto,
  ) {
    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(j.title ILIKE :s OR j.job_ref_no ILIKE :s OR COALESCE(j.location, \'\') ILIKE :s)',
        { s },
      );
    }

    if (query.location?.trim()) {
      qb.andWhere('j.location ILIKE :location', {
        location: `%${query.location.trim()}%`,
      });
    }

    if (query.workMode?.trim()) {
      qb.andWhere('j.work_mode = :workMode', {
        workMode: query.workMode.trim().toUpperCase(),
      });
    }

    if (query.employmentType?.trim()) {
      qb.andWhere('j.employment_type = :employmentType', {
        employmentType: query.employmentType.trim().toUpperCase(),
      });
    }

    const requestedStatus = query.status?.trim().toUpperCase();
    const tabStatus = this.deriveStatusFromTab(query.tab);
    const statusToApply = requestedStatus || tabStatus;

    if (statusToApply) {
      if (!this.isValidJobStatus(statusToApply)) {
        throw new BadRequestException('Invalid job status filter');
      }
      qb.andWhere('j.status = :statusToApply', { statusToApply });
    }
  }

  private applyCandidatesFilters(
    qb: SelectQueryBuilder<Registration>,
    query: ListCandidatesQueryDto,
  ) {
    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(COALESCE(r.full_name, "") ILIKE :s OR u.email ILIKE :s OR CAST(r.id AS TEXT) ILIKE :s)',
        { s },
      );
    }

    if (query.trait?.trim()) {
      qb.andWhere('pt.blended_style_name ILIKE :trait', {
        trait: `%${query.trait.trim()}%`,
      });
    }

    if (query.status?.trim()) {
      const status = query.status.trim().toUpperCase();
      if (!this.isValidApplicationStatus(status)) {
        throw new BadRequestException('Invalid candidate status filter');
      }
      qb.andWhere('ja.current_status = :candidateStatus', {
        candidateStatus: status,
      });
    }

    if (query.jobId?.trim()) {
      const jobId = Number(query.jobId);
      if (!Number.isFinite(jobId) || jobId <= 0) {
        throw new BadRequestException('Invalid jobId filter');
      }
      qb.andWhere('ja.job_id = :filterJobId', { filterJobId: Math.floor(jobId) });
    }

    if (query.appliedDateFrom?.trim()) {
      qb.andWhere('ja.applied_at >= :appliedDateFrom', {
        appliedDateFrom: `${query.appliedDateFrom.trim()} 00:00:00`,
      });
    }

    if (query.appliedDateTo?.trim()) {
      qb.andWhere('ja.applied_at <= :appliedDateTo', {
        appliedDateTo: `${query.appliedDateTo.trim()} 23:59:59`,
      });
    }
  }

  async createJob(email: string, dto: CreateJobDto) {
    const { user, corporate } = await this.resolveCorporateContext(email);

    const minCtc = this.parseOptionalNumber(dto.minCtc, 'minCtc');
    const maxCtc = this.parseOptionalNumber(dto.maxCtc, 'maxCtc');
    const openings = dto.openings === undefined || dto.openings === null || dto.openings === ''
      ? 1
      : Math.floor(Number(dto.openings));

    if (!Number.isFinite(openings) || openings < 1) {
      throw new BadRequestException('openings must be at least 1');
    }

    if (minCtc !== null && maxCtc !== null && minCtc > maxCtc) {
      throw new BadRequestException('minCtc cannot be greater than maxCtc');
    }

    const postingStartAt = this.parseOptionalDate(dto.postingStartAt, 'postingStartAt');
    const postingEndAt = this.parseOptionalDate(dto.postingEndAt, 'postingEndAt');

    if (postingStartAt && postingEndAt && postingStartAt > postingEndAt) {
      throw new BadRequestException('postingStartAt cannot be later than postingEndAt');
    }

    const requestedStatus = dto.status?.toUpperCase() as JobLifecycleStatus | undefined;
    if (requestedStatus && !this.isValidJobStatus(requestedStatus)) {
      throw new BadRequestException('Invalid job status');
    }

    const status = requestedStatus || 'DRAFT';
    const skills = this.normalizeSkills(dto.requiredSkills, dto.preferredSkills);
    const jobRefNo = await this.generateJobRefNo();

    const created = await this.dataSource.transaction(async (manager) => {
      const job = manager.create(CorporateJob, {
        corporateAccountId: corporate.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
        jobRefNo,
        title: dto.title.trim(),
        department: dto.department?.trim() || null,
        location: dto.location?.trim() || null,
        workMode: dto.workMode,
        employmentType: dto.employmentType,
        shift: dto.shift || null,
        experienceLevel: dto.experienceLevel || null,
        minCtc: minCtc === null ? null : String(minCtc),
        maxCtc: maxCtc === null ? null : String(maxCtc),
        currencyCode: (dto.currencyCode || 'INR').toUpperCase(),
        openings,
        status,
        postingStartAt,
        postingEndAt,
        description: dto.description,
        responsibilities: dto.responsibilities || null,
        eligibility: dto.eligibility || null,
        niceToHave: dto.niceToHave || null,
        whatYouWillLearn: dto.whatYouWillLearn || null,
        companyDetails: dto.companyDetails || null,
        metadata: dto.metadata || {},
      });

      const savedJob = await manager.save(CorporateJob, job);

      if (skills.length > 0) {
        const skillRows = skills.map((s) =>
          manager.create(CorporateJobSkill, {
            jobId: savedJob.id,
            skillName: s.skillName,
            skillType: s.skillType,
            weight: s.weight,
          }),
        );
        await manager.save(CorporateJobSkill, skillRows);
      }

      return savedJob;
    });

    return {
      message: 'Job created successfully',
      jobId: created.id,
      jobRefNo: created.jobRefNo,
      status: created.status,
    };
  }

  async listJobs(email: string, query: ListJobsQueryDto) {
    const { corporate } = await this.resolveCorporateContext(email);
    const page = this.toPositiveInt(query.page, 1, 100000);
    const limit = this.toPositiveInt(query.limit, 10, 100);
    const sortOrder = this.normalizeSortOrder(query.sortOrder);

    const qb = this.jobRepo
      .createQueryBuilder('j')
      .leftJoin('job_applications', 'ja', 'ja.job_id = j.id AND ja.is_deleted = false')
      .where('j.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('j.is_deleted = false');

    this.applyJobsListFilters(qb, query);

    qb
      .select('j.id', 'id')
      .addSelect('j.job_ref_no', 'jobRefNo')
      .addSelect('j.title', 'title')
      .addSelect('j.department', 'department')
      .addSelect('j.location', 'location')
      .addSelect('j.work_mode', 'workMode')
      .addSelect('j.employment_type', 'employmentType')
      .addSelect('j.shift', 'shift')
      .addSelect('j.experience_level', 'experienceLevel')
      .addSelect('j.min_ctc', 'minCtc')
      .addSelect('j.max_ctc', 'maxCtc')
      .addSelect('j.currency_code', 'currencyCode')
      .addSelect('j.openings', 'openings')
      .addSelect('j.status', 'status')
      .addSelect('j.posting_start_at', 'postingStartAt')
      .addSelect('j.posting_end_at', 'postingEndAt')
      .addSelect('j.created_at', 'createdAt')
      .addSelect('j.updated_at', 'updatedAt')
      .addSelect('COUNT(ja.id)', 'totalApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'APPLIED')", 'newApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'SHORTLISTED')", 'shortlisted')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'HIRED')", 'hired')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'REJECTED')", 'rejected')
      .groupBy('j.id');

    const sortBy = (query.sortBy || '').toLowerCase();
    if (sortBy === 'title') {
      qb.orderBy('j.title', sortOrder);
    } else if (sortBy === 'closingdate' || sortBy === 'postingendat') {
      qb.orderBy('j.posting_end_at', sortOrder, 'NULLS LAST');
    } else if (sortBy === 'applicants') {
      qb.orderBy('COUNT(ja.id)', sortOrder);
    } else {
      qb.orderBy('j.created_at', sortOrder);
    }

    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany();

    const totalQb = this.jobRepo
      .createQueryBuilder('j')
      .where('j.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('j.is_deleted = false');

    this.applyJobsListFilters(totalQb, query);

    const total = await totalQb.getCount();

    const statusRows = await this.jobRepo
      .createQueryBuilder('j')
      .select('j.status', 'status')
      .addSelect('COUNT(1)', 'count')
      .where('j.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('j.is_deleted = false')
      .groupBy('j.status')
      .getRawMany();

    const counts = {
      all: total,
      active: 0,
      closed: 0,
      draft: 0,
      hold: 0,
    };

    statusRows.forEach((row) => {
      const status = String(row.status || '').toUpperCase();
      const count = Number(row.count || 0);
      if (status === 'ACTIVE') counts.active = count;
      if (status === 'CLOSED') counts.closed = count;
      if (status === 'DRAFT') counts.draft = count;
      if (status === 'HOLD') counts.hold = count;
    });

    return {
      data: rows.map((row) => ({
        id: Number(row.id),
        jobRefNo: row.jobRefNo,
        title: row.title,
        department: row.department,
        location: row.location,
        workMode: row.workMode,
        employmentType: row.employmentType,
        shift: row.shift,
        experienceLevel: row.experienceLevel,
        minCtc: row.minCtc,
        maxCtc: row.maxCtc,
        currencyCode: row.currencyCode,
        openings: Number(row.openings || 0),
        status: row.status,
        postingStartAt: row.postingStartAt,
        postingEndAt: row.postingEndAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        totalApplicants: Number(row.totalApplicants || 0),
        newApplicants: Number(row.newApplicants || 0),
        shortlisted: Number(row.shortlisted || 0),
        hired: Number(row.hired || 0),
        rejected: Number(row.rejected || 0),
      })),
      total,
      page,
      limit,
      counts,
    };
  }

  async getJobById(email: string, jobId: number) {
    const { corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');

    const job = await this.jobRepo.findOne({
      where: {
        id: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const skills = await this.jobSkillRepo.find({
      where: { jobId: job.id },
      order: { skillType: 'ASC', createdAt: 'ASC' },
    });

    const stats = await this.jobApplicationRepo
      .createQueryBuilder('ja')
      .select('COUNT(ja.id)', 'totalApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'APPLIED')", 'newApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'SHORTLISTED')", 'shortlisted')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'HIRED')", 'hired')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'REJECTED')", 'rejected')
      .where('ja.job_id = :jobId', { jobId: job.id })
      .andWhere('ja.is_deleted = false')
      .getRawOne();

    return {
      job,
      requiredSkills: skills.filter((s) => s.skillType === 'REQUIRED').map((s) => s.skillName),
      preferredSkills: skills.filter((s) => s.skillType === 'PREFERRED').map((s) => s.skillName),
      stats: {
        totalApplicants: Number(stats?.totalApplicants || 0),
        newApplicants: Number(stats?.newApplicants || 0),
        shortlisted: Number(stats?.shortlisted || 0),
        hired: Number(stats?.hired || 0),
        rejected: Number(stats?.rejected || 0),
      },
    };
  }

  async updateJob(email: string, jobId: number, dto: UpdateJobDto) {
    const { user, corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');

    const job = await this.jobRepo.findOne({
      where: {
        id: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const minCtc = this.parseOptionalNumber(dto.minCtc, 'minCtc');
    const maxCtc = this.parseOptionalNumber(dto.maxCtc, 'maxCtc');

    if (minCtc !== null && maxCtc !== null && minCtc > maxCtc) {
      throw new BadRequestException('minCtc cannot be greater than maxCtc');
    }

    const postingStartAt = dto.postingStartAt === undefined
      ? job.postingStartAt
      : this.parseOptionalDate(dto.postingStartAt, 'postingStartAt');

    const postingEndAt = dto.postingEndAt === undefined
      ? job.postingEndAt
      : this.parseOptionalDate(dto.postingEndAt, 'postingEndAt');

    if (postingStartAt && postingEndAt && postingStartAt > postingEndAt) {
      throw new BadRequestException('postingStartAt cannot be later than postingEndAt');
    }

    if (dto.status) {
      const status = dto.status.toUpperCase();
      if (!this.isValidJobStatus(status)) {
        throw new BadRequestException('Invalid job status');
      }
      job.status = status;
    }

    if (dto.title !== undefined) job.title = dto.title.trim();
    if (dto.department !== undefined) job.department = dto.department?.trim() || null;
    if (dto.location !== undefined) job.location = dto.location?.trim() || null;
    if (dto.workMode !== undefined) job.workMode = dto.workMode;
    if (dto.employmentType !== undefined) job.employmentType = dto.employmentType;
    if (dto.shift !== undefined) job.shift = dto.shift || null;
    if (dto.experienceLevel !== undefined) job.experienceLevel = dto.experienceLevel || null;
    if (dto.minCtc !== undefined) job.minCtc = minCtc === null ? null : String(minCtc);
    if (dto.maxCtc !== undefined) job.maxCtc = maxCtc === null ? null : String(maxCtc);
    if (dto.currencyCode !== undefined) job.currencyCode = (dto.currencyCode || 'INR').toUpperCase();
    if (dto.openings !== undefined) {
      const openings = Math.floor(Number(dto.openings));
      if (!Number.isFinite(openings) || openings < 1) {
        throw new BadRequestException('openings must be at least 1');
      }
      job.openings = openings;
    }

    job.postingStartAt = postingStartAt;
    job.postingEndAt = postingEndAt;

    if (dto.description !== undefined) job.description = dto.description;
    if (dto.responsibilities !== undefined) job.responsibilities = dto.responsibilities || null;
    if (dto.eligibility !== undefined) job.eligibility = dto.eligibility || null;
    if (dto.niceToHave !== undefined) job.niceToHave = dto.niceToHave || null;
    if (dto.whatYouWillLearn !== undefined) job.whatYouWillLearn = dto.whatYouWillLearn || null;
    if (dto.companyDetails !== undefined) job.companyDetails = dto.companyDetails || null;
    if (dto.metadata !== undefined) job.metadata = dto.metadata || {};

    job.updatedByUserId = user.id;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(CorporateJob, job);

      const shouldReplaceSkills =
        dto.requiredSkills !== undefined || dto.preferredSkills !== undefined;

      if (shouldReplaceSkills) {
        await manager.delete(CorporateJobSkill, { jobId: job.id });

        const normalizedSkills = this.normalizeSkills(
          dto.requiredSkills || [],
          dto.preferredSkills || [],
        );

        if (normalizedSkills.length > 0) {
          const skillRows = normalizedSkills.map((s) =>
            manager.create(CorporateJobSkill, {
              jobId: job.id,
              skillName: s.skillName,
              skillType: s.skillType,
              weight: s.weight,
            }),
          );
          await manager.save(CorporateJobSkill, skillRows);
        }
      }
    });

    return this.getJobById(email, job.id);
  }

  async updateJobStatus(email: string, jobId: number, status: string, note?: string) {
    const { user, corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');
    const toStatus = String(status || '').trim().toUpperCase();

    if (!this.isValidJobStatus(toStatus)) {
      throw new BadRequestException('Invalid job status');
    }

    const job = await this.jobRepo.findOne({
      where: {
        id: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const transitions: Record<JobLifecycleStatus, JobLifecycleStatus[]> = {
      DRAFT: ['ACTIVE', 'HOLD', 'ARCHIVED'],
      ACTIVE: ['HOLD', 'CLOSED', 'ARCHIVED'],
      HOLD: ['ACTIVE', 'CLOSED', 'ARCHIVED'],
      CLOSED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    if (job.status === toStatus) {
      return {
        message: 'Job status unchanged',
        jobId: job.id,
        status: job.status,
      };
    }

    if (!transitions[job.status].includes(toStatus)) {
      throw new BadRequestException(
        `Invalid job status transition from ${job.status} to ${toStatus}`,
      );
    }

    job.status = toStatus;
    job.updatedByUserId = user.id;

    if (toStatus === 'ACTIVE' && !job.postingStartAt) {
      job.postingStartAt = new Date();
    }

    if (toStatus === 'CLOSED' && !job.postingEndAt) {
      job.postingEndAt = new Date();
    }

    if (note) {
      job.metadata = {
        ...(job.metadata || {}),
        lastStatusNote: note,
      };
    }

    await this.jobRepo.save(job);

    return {
      message: 'Job status updated successfully',
      jobId: job.id,
      status: job.status,
    };
  }

  async listJobCandidates(email: string, jobId: number, query: ListJobCandidatesQueryDto) {
    const { corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');

    const job = await this.jobRepo.findOne({
      where: {
        id: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
      select: ['id'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const page = this.toPositiveInt(query.page, 1, 100000);
    const limit = this.toPositiveInt(query.limit, 10, 100);
    const sortOrder = this.normalizeSortOrder(query.sortOrder);

    const latestAttemptSubQuery = this.attemptRepo
      .createQueryBuilder('aa')
      .select('DISTINCT ON (aa.registration_id) aa.registration_id', 'registration_id')
      .addSelect('aa.dominant_trait_id', 'dominant_trait_id')
      .addSelect('aa.total_score', 'total_score')
      .where('aa.dominant_trait_id IS NOT NULL')
      .orderBy('aa.registration_id', 'ASC')
      .addOrderBy('aa.created_at', 'DESC');

    const qb = this.jobApplicationRepo
      .createQueryBuilder('ja')
      .innerJoin('registrations', 'r', 'r.id = ja.registration_id')
      .innerJoin('users', 'u', 'u.id = ja.user_id')
      .leftJoin(
        `(${latestAttemptSubQuery.getQuery()})`,
        'la',
        'la.registration_id = r.id',
      )
      .leftJoin('personality_traits', 'pt', 'pt.id = la.dominant_trait_id')
      .where('ja.job_id = :jobId', { jobId: parsedJobId })
      .andWhere('ja.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('ja.is_deleted = false')
      .setParameters(latestAttemptSubQuery.getParameters());

    if (query.status?.trim()) {
      const status = query.status.trim().toUpperCase();
      if (!this.isValidApplicationStatus(status)) {
        throw new BadRequestException('Invalid candidate status filter');
      }
      qb.andWhere('ja.current_status = :statusFilter', { statusFilter: status });
    }

    if (query.search?.trim()) {
      const s = `%${query.search.trim()}%`;
      qb.andWhere(
        '(COALESCE(r.full_name, "") ILIKE :s OR u.email ILIKE :s OR CAST(r.id AS TEXT) ILIKE :s)',
        { s },
      );
    }

    qb
      .select('ja.id', 'applicationId')
      .addSelect('r.id', 'registrationId')
      .addSelect('COALESCE(r.full_name, u.email)', 'fullName')
      .addSelect('u.email', 'email')
      .addSelect('u.avatar_url', 'avatarUrl')
      .addSelect('ja.current_status', 'applicationStatus')
      .addSelect('ja.status_reason', 'statusReason')
      .addSelect('ja.applied_at', 'appliedAt')
      .addSelect('ja.status_changed_at', 'statusChangedAt')
      .addSelect('pt.blended_style_name', 'trait')
      .addSelect('pt.color_rgb', 'traitColor')
      .addSelect('la.total_score', 'totalScore');

    const sortBy = (query.sortBy || '').toLowerCase();
    if (sortBy === 'name') {
      qb.orderBy('COALESCE(r.full_name, u.email)', sortOrder);
    } else if (sortBy === 'status') {
      qb.orderBy('ja.current_status', sortOrder);
    } else {
      qb.orderBy('ja.applied_at', sortOrder, 'NULLS LAST');
    }

    const totalCountRow = await qb
      .clone()
      .select('COUNT(ja.id)', 'total')
      .orderBy()
      .getRawOne();

    const total = Number(totalCountRow?.total || 0);

    const rows = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const summary = await this.jobApplicationRepo
      .createQueryBuilder('ja')
      .select('COUNT(ja.id)', 'totalApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'APPLIED')", 'newApplicants')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'SHORTLISTED')", 'shortlisted')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'HIRED')", 'hired')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'REJECTED')", 'rejected')
      .where('ja.job_id = :jobId', { jobId: parsedJobId })
      .andWhere('ja.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('ja.is_deleted = false')
      .getRawOne();

    return {
      data: rows.map((row) => ({
        applicationId: Number(row.applicationId),
        registrationId: Number(row.registrationId),
        name: row.fullName,
        email: row.email,
        avatarUrl: row.avatarUrl,
        applicationStatus: row.applicationStatus,
        statusReason: row.statusReason,
        appliedAt: row.appliedAt,
        statusChangedAt: row.statusChangedAt,
        trait: row.trait,
        traitColor: row.traitColor,
        totalScore: row.totalScore,
      })),
      total,
      page,
      limit,
      summary: {
        totalApplicants: Number(summary?.totalApplicants || 0),
        newApplicants: Number(summary?.newApplicants || 0),
        shortlisted: Number(summary?.shortlisted || 0),
        hired: Number(summary?.hired || 0),
        rejected: Number(summary?.rejected || 0),
      },
    };
  }

  async updateApplicationStatus(
    email: string,
    jobId: number,
    applicationId: number,
    dto: UpdateApplicationStatusDto,
  ) {
    const { user, corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');
    const parsedApplicationId = this.parseId(applicationId, 'applicationId');

    const toStatus = String(dto.toStatus || '').toUpperCase();
    if (!this.isValidApplicationStatus(toStatus)) {
      throw new BadRequestException('Invalid application status');
    }

    const application = await this.jobApplicationRepo.findOne({
      where: {
        id: parsedApplicationId,
        jobId: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const transitions: Record<JobApplicationStatus, JobApplicationStatus[]> = {
      APPLIED: ['SHORTLISTED', 'HIRED', 'REJECTED', 'WITHDRAWN'],
      SHORTLISTED: ['HIRED', 'REJECTED', 'WITHDRAWN'],
      HIRED: [],
      REJECTED: ['SHORTLISTED'],
      WITHDRAWN: ['APPLIED'],
    };

    if (application.currentStatus === toStatus) {
      return {
        message: 'Application status unchanged',
        applicationId: application.id,
        currentStatus: application.currentStatus,
      };
    }

    if (!transitions[application.currentStatus].includes(toStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${application.currentStatus} to ${toStatus}`,
      );
    }

    const fromStatus = application.currentStatus;

    await this.dataSource.transaction(async (manager) => {
      application.currentStatus = toStatus;
      application.statusReason = dto.reason || null;
      application.statusChangedAt = new Date();

      await manager.save(JobApplication, application);

      const historyRow = manager.create(JobApplicationStatusHistory, {
        jobApplicationId: application.id,
        fromStatus,
        toStatus,
        changedByUserId: user.id,
        changedAt: new Date(),
        note: dto.note || null,
        metadata: {
          reason: dto.reason || null,
        },
      });

      await manager.save(JobApplicationStatusHistory, historyRow);
    });

    return {
      message: 'Application status updated successfully',
      applicationId: application.id,
      previousStatus: fromStatus,
      currentStatus: toStatus,
    };
  }

  async bulkApplyCandidates(
    email: string,
    jobId: number,
    dto: BulkApplyCandidatesDto,
  ) {
    const { user, corporate } = await this.resolveCorporateContext(email);
    const parsedJobId = this.parseId(jobId, 'jobId');

    const job = await this.jobRepo.findOne({
      where: {
        id: parsedJobId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
      select: ['id'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const uniqueRegistrationIds = Array.from(
      new Set((dto.registrationIds || []).map((id) => Math.floor(Number(id))).filter((id) => Number.isFinite(id) && id > 0)),
    );

    if (uniqueRegistrationIds.length === 0) {
      throw new BadRequestException('registrationIds must contain valid positive numbers');
    }

    const registrations = await this.registrationRepo.find({
      where: {
        id: In(uniqueRegistrationIds),
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
      select: ['id', 'userId'],
    });

    const validRegistrationIds = registrations.map((r) => r.id);

    const existingRows = validRegistrationIds.length
      ? await this.jobApplicationRepo.find({
          where: {
            corporateAccountId: corporate.id,
            jobId: parsedJobId,
            registrationId: In(validRegistrationIds),
            isDeleted: false,
          },
          select: ['registrationId'],
        })
      : [];

    const existingRegistrationSet = new Set(existingRows.map((r) => r.registrationId));
    const registrationById = new Map(registrations.map((r) => [r.id, r]));

    const source: JobApplicationSource =
      dto.source && APPLICATION_SOURCES.includes(dto.source)
        ? dto.source
        : 'INTERNAL';

    const toCreate = validRegistrationIds
      .filter((registrationId) => !existingRegistrationSet.has(registrationId))
      .map((registrationId) => {
        const registration = registrationById.get(registrationId)!;
        return {
          corporateAccountId: corporate.id,
          jobId: parsedJobId,
          registrationId,
          userId: registration.userId,
          source,
          currentStatus: 'APPLIED' as JobApplicationStatus,
          statusReason: null,
          statusChangedAt: new Date(),
          matchScore: null,
          metadata: {},
          appliedAt: new Date(),
          isDeleted: false,
        };
      });

    let insertedApplications: JobApplication[] = [];

    if (toCreate.length > 0) {
      insertedApplications = await this.dataSource.transaction(async (manager) => {
        const createdRows = await manager.save(
          JobApplication,
          toCreate.map((row) => manager.create(JobApplication, row)),
        );

        const historyRows = createdRows.map((created) =>
          manager.create(JobApplicationStatusHistory, {
            jobApplicationId: created.id,
            fromStatus: null,
            toStatus: 'APPLIED',
            changedByUserId: user.id,
            changedAt: new Date(),
            note: 'Bulk apply',
            metadata: {
              source,
            },
          }),
        );

        await manager.save(JobApplicationStatusHistory, historyRows);

        return createdRows;
      });
    }

    const missingRegistrationIds = uniqueRegistrationIds.filter(
      (id) => !registrationById.has(id),
    );

    return {
      message: 'Bulk apply processed',
      jobId: parsedJobId,
      requested: uniqueRegistrationIds.length,
      appliedCount: insertedApplications.length,
      skippedExistingCount:
        uniqueRegistrationIds.length - missingRegistrationIds.length - insertedApplications.length,
      missingRegistrationIds,
      applicationIds: insertedApplications.map((a) => a.id),
    };
  }

  async listCandidates(email: string, query: ListCandidatesQueryDto) {
    const { corporate } = await this.resolveCorporateContext(email);
    const page = this.toPositiveInt(query.page, 1, 100000);
    const limit = this.toPositiveInt(query.limit, 10, 100);
    const sortOrder = this.normalizeSortOrder(query.sortOrder);

    const latestAttemptSubQuery = this.attemptRepo
      .createQueryBuilder('aa')
      .select('DISTINCT ON (aa.registration_id) aa.registration_id', 'registration_id')
      .addSelect('aa.dominant_trait_id', 'dominant_trait_id')
      .where('aa.dominant_trait_id IS NOT NULL')
      .orderBy('aa.registration_id', 'ASC')
      .addOrderBy('aa.created_at', 'DESC');

    const baseQb = this.registrationRepo
      .createQueryBuilder('r')
      .innerJoin('users', 'u', 'u.id = r.user_id')
      .leftJoin(
        'job_applications',
        'ja',
        'ja.registration_id = r.id AND ja.corporate_account_id = :corpId AND ja.is_deleted = false',
        { corpId: corporate.id },
      )
      .leftJoin('corporate_jobs', 'j', 'j.id = ja.job_id AND j.is_deleted = false')
      .leftJoin(
        `(${latestAttemptSubQuery.getQuery()})`,
        'la',
        'la.registration_id = r.id',
      )
      .leftJoin('personality_traits', 'pt', 'pt.id = la.dominant_trait_id')
      .where('r.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('r.is_deleted = false')
      .setParameters(latestAttemptSubQuery.getParameters());

    this.applyCandidatesFilters(baseQb, query);

    const rowsQb = baseQb
      .clone()
      .select('r.id', 'registrationId')
      .addSelect('COALESCE(r.full_name, u.email)', 'fullName')
      .addSelect('u.email', 'email')
      .addSelect('u.avatar_url', 'avatarUrl')
      .addSelect('pt.blended_style_name', 'trait')
      .addSelect('pt.color_rgb', 'traitColor')
      .addSelect('MAX(ja.applied_at)', 'latestApplied')
      .addSelect('COUNT(ja.id)', 'applicationsCount')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'HIRED')", 'hiredCount')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'SHORTLISTED')", 'shortlistedCount')
      .addSelect("COUNT(ja.id) FILTER (WHERE ja.current_status = 'REJECTED')", 'rejectedCount')
      .groupBy('r.id')
      .addGroupBy('u.email')
      .addGroupBy('u.avatar_url')
      .addGroupBy('pt.blended_style_name')
      .addGroupBy('pt.color_rgb');

    const sortBy = (query.sortBy || '').toLowerCase();
    if (sortBy === 'name') {
      rowsQb.orderBy('COALESCE(r.full_name, u.email)', sortOrder);
    } else {
      rowsQb.orderBy('MAX(ja.applied_at)', sortOrder, 'NULLS LAST');
    }

    const countQb = baseQb
      .clone()
      .select('COUNT(DISTINCT r.id)', 'total');

    const totalRow = await countQb.getRawOne();
    const total = Number(totalRow?.total || 0);

    const rows = await rowsQb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const registrationIds = rows.map((row) => Number(row.registrationId));

    const appliedJobsMap = new Map<number, Array<{ title: string; count: number }>>();

    if (registrationIds.length > 0) {
      const jobRows = await this.jobApplicationRepo
        .createQueryBuilder('ja')
        .innerJoin('corporate_jobs', 'j', 'j.id = ja.job_id AND j.is_deleted = false')
        .select('ja.registration_id', 'registrationId')
        .addSelect('j.title', 'jobTitle')
        .addSelect('COUNT(ja.id)', 'count')
        .where('ja.corporate_account_id = :corpId', { corpId: corporate.id })
        .andWhere('ja.registration_id IN (:...registrationIds)', { registrationIds })
        .andWhere('ja.is_deleted = false')
        .groupBy('ja.registration_id')
        .addGroupBy('j.title')
        .orderBy('COUNT(ja.id)', 'DESC')
        .getRawMany();

      jobRows.forEach((row) => {
        const registrationId = Number(row.registrationId);
        const bucket = appliedJobsMap.get(registrationId) || [];
        bucket.push({
          title: row.jobTitle,
          count: Number(row.count || 0),
        });
        appliedJobsMap.set(registrationId, bucket);
      });
    }

    return {
      data: rows.map((row) => {
        const registrationId = Number(row.registrationId);
        return {
          id: registrationId,
          name: row.fullName,
          originId: String(registrationId),
          email: row.email,
          avatar: row.avatarUrl,
          trait: row.trait,
          traitColor: row.traitColor,
          latestApplied: row.latestApplied,
          appliedJobs: appliedJobsMap.get(registrationId) || [],
          candidateStatus: {
            hired: Number(row.hiredCount || 0),
            shortlist: Number(row.shortlistedCount || 0),
            rejected: Number(row.rejectedCount || 0),
          },
        };
      }),
      total,
      page,
      limit,
    };
  }

  async getCandidateApplications(email: string, registrationId: number) {
    const { corporate } = await this.resolveCorporateContext(email);
    const parsedRegistrationId = this.parseId(registrationId, 'registrationId');

    const registration = await this.registrationRepo.findOne({
      where: {
        id: parsedRegistrationId,
        corporateAccountId: corporate.id,
        isDeleted: false,
      },
      select: ['id'],
    });

    if (!registration) {
      throw new NotFoundException('Candidate not found in this corporate account');
    }

    const applications = await this.jobApplicationRepo
      .createQueryBuilder('ja')
      .innerJoin('corporate_jobs', 'j', 'j.id = ja.job_id AND j.is_deleted = false')
      .select('ja.id', 'applicationId')
      .addSelect('ja.job_id', 'jobId')
      .addSelect('j.job_ref_no', 'jobRefNo')
      .addSelect('j.title', 'jobTitle')
      .addSelect('j.status', 'jobStatus')
      .addSelect('ja.source', 'source')
      .addSelect('ja.current_status', 'currentStatus')
      .addSelect('ja.status_reason', 'statusReason')
      .addSelect('ja.applied_at', 'appliedAt')
      .addSelect('ja.status_changed_at', 'statusChangedAt')
      .addSelect('ja.match_score', 'matchScore')
      .where('ja.corporate_account_id = :corpId', { corpId: corporate.id })
      .andWhere('ja.registration_id = :registrationId', {
        registrationId: parsedRegistrationId,
      })
      .andWhere('ja.is_deleted = false')
      .orderBy('ja.applied_at', 'DESC')
      .getRawMany();

    if (applications.length === 0) {
      return {
        registrationId: parsedRegistrationId,
        applications: [],
      };
    }

    const applicationIds = applications.map((a) => Number(a.applicationId));

    const historyRows = await this.jobApplicationStatusHistoryRepo
      .createQueryBuilder('h')
      .select('h.job_application_id', 'jobApplicationId')
      .addSelect('h.from_status', 'fromStatus')
      .addSelect('h.to_status', 'toStatus')
      .addSelect('h.changed_by_user_id', 'changedByUserId')
      .addSelect('h.changed_at', 'changedAt')
      .addSelect('h.note', 'note')
      .where('h.job_application_id IN (:...applicationIds)', { applicationIds })
      .orderBy('h.changed_at', 'DESC')
      .getRawMany();

    const historyByAppId = new Map<number, any[]>();
    historyRows.forEach((row) => {
      const appId = Number(row.jobApplicationId);
      const bucket = historyByAppId.get(appId) || [];
      bucket.push({
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        changedByUserId: row.changedByUserId ? Number(row.changedByUserId) : null,
        changedAt: row.changedAt,
        note: row.note,
      });
      historyByAppId.set(appId, bucket);
    });

    return {
      registrationId: parsedRegistrationId,
      applications: applications.map((app) => {
        const appId = Number(app.applicationId);
        return {
          applicationId: appId,
          jobId: Number(app.jobId),
          jobRefNo: app.jobRefNo,
          jobTitle: app.jobTitle,
          jobStatus: app.jobStatus,
          source: app.source,
          currentStatus: app.currentStatus,
          statusReason: app.statusReason,
          appliedAt: app.appliedAt,
          statusChangedAt: app.statusChangedAt,
          matchScore: app.matchScore,
          statusHistory: historyByAppId.get(appId) || [],
        };
      }),
    };
  }
}
