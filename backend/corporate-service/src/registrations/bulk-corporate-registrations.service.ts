/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

const csv = require('fast-csv');
import { Readable } from 'stream';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';
import {
  Groups,
  User,
  Program,
  CorporateAccount,
  GroupAssessment,
  Department,
  DepartmentDegree,
  Notification,
} from '@originbi/shared-entities';
import { CorporateRegistrationsService } from './corporate-registrations.service';

type DegreeTypeRow = {
  id: string | number;
  name: string;
  [key: string]: unknown;
};

@Injectable()
export class BulkCorporateRegistrationsService {
  private readonly logger = new Logger(BulkCorporateRegistrationsService.name);

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private normalizeMobile(mobile: string): string {
    return String(mobile || '').replace(/\D/g, '');
  }

  constructor(
    @InjectRepository(BulkImport)
    private bulkImportRepo: Repository<BulkImport>,
    @InjectRepository(BulkImportRow)
    private bulkImportRowRepo: Repository<BulkImportRow>,
    @InjectRepository(Groups)
    private groupsRepo: Repository<Groups>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Program)
    private programRepo: Repository<Program>,
    @InjectRepository(CorporateAccount)
    private corporateAccountRepo: Repository<CorporateAccount>,
    @InjectRepository(GroupAssessment)
    private groupAssessmentRepo: Repository<GroupAssessment>,
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
    @InjectRepository(DepartmentDegree)
    private departmentDegreeRepo: Repository<DepartmentDegree>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private dataSource: DataSource,
    private readonly corporateRegistrationsService: CorporateRegistrationsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Phase 1: Preview & Validate
   */
  async preview(fileBuffer: Buffer, filename: string, userId: number) {
    // Validate File Format
    if (!filename.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException(
        'Invalid file format. Only CSV files are allowed.',
      );
    }

    // Fetch Corporate Account from UserId
    let corporateAccount = await this.corporateAccountRepo.findOne({
      where: { userId: userId },
    });

    // Fallback: Check if user belongs to a corporate account context
    if (!corporateAccount) {
      // Try fetching user to see if they are a sub-user of a corporate account
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user && user.corporateId) {
        corporateAccount = await this.corporateAccountRepo.findOne({
          where: { id: Number(user.corporateId) },
        });
      }
    }

    if (!corporateAccount) {
      throw new BadRequestException(
        'Corporate Account not found for this user.',
      );
    }

    const corporateAccountId = corporateAccount.id;

    // 1. Create Import Record
    const importJob = this.bulkImportRepo.create({
      createdById: userId,
      filename,
      status: 'DRAFT',
      totalRecords: 0,
      processedCount: 0,
    });
    await this.bulkImportRepo.save(importJob);

    // 2. Reference Data
    const allPrograms = await this.programRepo.find();
    const programMap = new Map<string, Program>();
    allPrograms.forEach((p) => {
      programMap.set(this.normalizeString(p.code), p);
      programMap.set(this.normalizeString(p.name), p);
    });

    // Fetch Groups for Matching (Only for this Corporate Account)
    const allGroups = await this.groupsRepo.find({
      where: { corporateAccountId: corporateAccountId },
    });
    const groupMap = new Map<string, Groups>();
    allGroups.forEach((g) => {
      groupMap.set(this.normalizeString(g.name), g);
      if (g.code) {
        groupMap.set(this.normalizeString(g.code), g);
      }
    });

    const allDepartments = await this.departmentRepo.find();
    const allDeptDegrees = await this.departmentDegreeRepo.find({
      relations: ['department'],
    });
    const departmentMap = new Map<string, Department>();
    allDepartments.forEach((d) => {
      if (d.shortName) {
        departmentMap.set(this.normalizeString(d.shortName), d);
      }
    });

    const degreeMap = new Map<string, DegreeTypeRow>();
    const deptDegreeMap = new Map<string, string>(); // Map<departmentId_degreeTypeId, departmentDegreeId>
    try {
      const allDegrees: DegreeTypeRow[] = await this.dataSource.query(
        'SELECT * FROM degree_types',
      );
      allDegrees.forEach((d) => {
        degreeMap.set(this.normalizeString(d.name), d);
      });
    } catch (e) {
      this.logger.warn(
        'Could not fetch degree_types table, skipping degree validation',
        e,
      );
    }
    allDeptDegrees.forEach((dd) => {
      deptDegreeMap.set(`${dd.departmentId}_${dd.degreeTypeId}`, dd.id);
    });

    // 3. Parse All Rows First
    const rawRows: any[] = [];
    const stream = Readable.from(fileBuffer);

    await new Promise((resolve, reject) => {
      csv
        .parseStream(stream, { headers: true, ignoreEmpty: true, trim: true })
        .on('error', (error: any) =>
          reject(
            new BadRequestException(`Invalid CSV format: ${error.message}`),
          ),
        )
        .on('data', (row: any) => rawRows.push(row))
        .on('end', () => resolve(true));
    });

    // 4. Batch Validation Checks (Duplicates)
    const emails = rawRows
      .map((r) => this.normalizeEmail(r['Email'] || r['email']))
      .filter(Boolean);
    const mobiles = rawRows
      .map((r) =>
        this.normalizeMobile(r['Mobile'] || r['mobile'] || r['mobile_number']),
      )
      .filter(Boolean);

    // Fetch users by Email OR Mobile
    let existingUsers: User[] = [];

    if (emails.length > 0 || mobiles.length > 0) {
      const qb = this.userRepo
        .createQueryBuilder('u')
        .select(['u.id', 'u.email', 'u.metadata']);

      if (emails.length > 0) {
        qb.where('LOWER(u.email) IN (:...emails)', { emails });
      }
      if (mobiles.length > 0) {
        if (emails.length > 0) {
          qb.orWhere(
            "regexp_replace(COALESCE(u.metadata->>'mobile', ''), '\\D', '', 'g') IN (:...mobiles)",
            { mobiles },
          );
        } else {
          qb.where(
            "regexp_replace(COALESCE(u.metadata->>'mobile', ''), '\\D', '', 'g') IN (:...mobiles)",
            { mobiles },
          );
        }
      }
      existingUsers = await qb.getMany();
    }

    // Build User Maps
    const userMapByEmail = new Map<string, User>();
    const userMapByMobile = new Map<string, User>();

    existingUsers.forEach((u) => {
      const normalizedEmail = this.normalizeEmail(u.email);
      if (normalizedEmail) userMapByEmail.set(normalizedEmail, u);
      const normalizedMobile = this.normalizeMobile(u.metadata?.mobile || '');
      if (normalizedMobile) userMapByMobile.set(normalizedMobile, u);
    });

    // Fetch Assessment Sessions for these existing users to check overlaps
    const userAssessmentMap = new Map<number, any[]>();
    if (existingUsers.length > 0) {
      const userIds = existingUsers.map((u) => u.id);
      try {
        const sessions = await this.dataSource.query(
          `SELECT id, user_id, valid_from, valid_to, program_id, status FROM assessment_sessions WHERE user_id IN (${userIds.join(',')})`,
        );
        sessions.forEach((s: any) => {
          const uid = Number(s.user_id);
          if (!userAssessmentMap.has(uid)) {
            userAssessmentMap.set(uid, []);
          }
          userAssessmentMap.get(uid)?.push(s);
        });
      } catch (err) {
        this.logger.warn(
          'Failed to fetch existing sessions for validation',
          err,
        );
      }
    }

    // Check Credits
    let newRegistrationsCount = 0;
    for (const row of rawRows) {
      const email = this.normalizeEmail(row['Email'] || row['email']);
      const inputMobile = this.normalizeMobile(
        row['Mobile'] || row['mobile'] || row['mobile_number'],
      );

      const exists =
        (email && userMapByEmail.has(email)) ||
        (inputMobile && userMapByMobile.has(inputMobile));
      if (!exists) {
        newRegistrationsCount++;
      }
    }

    // Check if credits are zero - ONLY if we are trying to add new people
    if (corporateAccount.availableCredits <= 0 && newRegistrationsCount > 0) {
      throw new BadRequestException(
        'Could not register the employees since credits are zero. You need to purchase the credits before the registrations.',
      );
    }

    // Check if credits are sufficient for the NEW registrations
    if (newRegistrationsCount > corporateAccount.availableCredits) {
      this.logger.warn(
        `Insufficient credits. Required: ${newRegistrationsCount}, Available: ${corporateAccount.availableCredits}, Total Skipped: ${rawRows.length - newRegistrationsCount}`,
      );
      throw new BadRequestException(
        `Insufficient credits. You have ${corporateAccount.availableCredits} credits but new registrations count is ${newRegistrationsCount}.`,
      );
    }

    // 5. Process Rows
    const rowsToInsert: BulkImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let needsConfirmCount = 0;

    const seenEmails = new Set<string>();
    const seenMobiles = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowIndex = i + 1;

      const processedRow = this.processRow(
        row,
        rowIndex,
        importJob,
        programMap,
        departmentMap,
        degreeMap,
        deptDegreeMap,
        allGroups,
        groupMap, // Pass group map
        userMapByEmail,
        userMapByMobile,
        userAssessmentMap,
        seenEmails,
        seenMobiles,
      );
      rowsToInsert.push(processedRow);

      if (processedRow.status === 'READY') validCount++;
      else if (processedRow.status === 'NEEDS_CONFIRMATION')
        needsConfirmCount++;
      else invalidCount++;
    }

    if (rowsToInsert.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        await this.bulkImportRowRepo.save(rowsToInsert.slice(i, i + chunkSize));
      }
    }

    importJob.totalRecords = rawRows.length;
    await this.bulkImportRepo.save(importJob);

    const previewRows = rowsToInsert.slice(0, 100).map((r) => ({
      ...r,
      import: undefined,
    }));

    return {
      importId: importJob.id,
      summary: {
        total: rawRows.length,
        valid: validCount,
        invalid: invalidCount,
        needsConfirmation: needsConfirmCount,
      },
      rows: previewRows,
    };
  }

  /**
   * Phase 2: Execute
   */
  async execute(fromDto: { import_id: string; overrides?: any[] }) {
    const { import_id, overrides } = fromDto;
    const job = await this.bulkImportRepo.findOne({ where: { id: import_id } });
    if (!job) throw new NotFoundException('Import job not found');
    if (job.status !== 'DRAFT')
      throw new BadRequestException(`Job is ${job.status}, cannot execute.`);

    if (overrides && overrides.length > 0) {
      for (const override of overrides) {
        const { row_index, group_id } = override;
        await this.bulkImportRowRepo.update(
          { importId: import_id, rowIndex: row_index },
          {
            status: 'READY',
            matchedGroupId: group_id,
            overridden: true,
            overrideData: { group_id },
          },
        );
      }
    }

    job.status = 'QUEUED';
    await this.bulkImportRepo.save(job);
    this.processJob(job.id, Number(job.createdById)).catch((err) =>
      this.logger.error(`Job ${job.id} failed`, err),
    );
    return { jobId: job.id, status: 'QUEUED' };
  }

  async getJobStatus(jobId: string) {
    const job = await this.bulkImportRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const failedCount = await this.bulkImportRowRepo.count({
      where: { importId: jobId, status: 'FAILED' },
    });

    const successCount = await this.bulkImportRowRepo.count({
      where: { importId: jobId, status: 'SUCCESS' },
    });

    const latestFailure = await this.bulkImportRowRepo.findOne({
      where: { importId: jobId, status: 'FAILED' },
      order: { rowIndex: 'ASC' },
    });

    // Also check if the job itself failed for overarching reasons
    let jobLastError = undefined;
    if (job.status === 'FAILED') {
      jobLastError = "Job crashed unexpectedly during preprocessing. Please contact support.";
    }

    return {
      status: job.status,
      total: job.totalRecords,
      processed: job.processedCount,
      success: successCount,
      failed: failedCount,
      progress:
        job.totalRecords > 0
          ? Math.round((job.processedCount / job.totalRecords) * 100)
          : 0,
      lastError: jobLastError || latestFailure?.errorMessage,
    };
  }

  async getJobRows(jobId: string) {
    return this.bulkImportRowRepo.find({
      where: { importId: jobId },
      order: { rowIndex: 'ASC' },
    });
  }

  /**
   * Worker
   */
  async processJob(jobId: string, createdById: number) {
    this.logger.log(`Starting processing for Job ${jobId}`);

    const job = await this.bulkImportRepo.findOne({ where: { id: jobId } });
    if (!job) return;
    job.status = 'PROCESSING';
    await this.bulkImportRepo.save(job);

    try {
      // Fetch Corporate Account
      let corporateAccount = await this.corporateAccountRepo.findOne({
        where: { userId: createdById },
      });
      // Fallback for sub-users
      if (!corporateAccount) {
        const user = await this.userRepo.findOne({ where: { id: createdById } });
        if (user && user.corporateId) {
          corporateAccount = await this.corporateAccountRepo.findOne({
            where: { id: Number(user.corporateId) },
          });
        }
      }
      if (!corporateAccount) {
        this.logger.error(`Corporate Account not found for user ${createdById}`);
        job.status = 'FAILED';
        job.completedAt = new Date();
        await this.bulkImportRepo.save(job);
        return;
      }

      const corporateAccountId = corporateAccount.id;

      // Reload Groups for matching
      const allGroups = await this.groupsRepo.find({
        where: { corporateAccountId },
      });
      const groupMap = new Map(allGroups.map((g) => [Number(g.id), g.name]));
      const groupMapForMatching = new Map<string, Groups>();
      allGroups.forEach((g) => {
        groupMapForMatching.set(this.normalizeString(g.name), g);
        if (g.code) {
          groupMapForMatching.set(this.normalizeString(g.code), g);
        }
      });

      const allPrograms = await this.programRepo.find();
      const programMap = new Map<string, Program>();
      allPrograms.forEach((p) => {
        programMap.set(this.normalizeString(p.code), p);
        programMap.set(this.normalizeString(p.name), p);
      });

      const allDepartments = await this.departmentRepo.find();
      const allDeptDegrees = await this.departmentDegreeRepo.find({
        relations: ['department'],
      });
      const departmentMap = new Map<string, Department>();
      allDepartments.forEach((d) => {
        if (d.shortName) {
          departmentMap.set(this.normalizeString(d.shortName), d);
        }
      });

      const degreeMap = new Map<string, DegreeTypeRow>();
      const deptDegreeMap = new Map<string, string>(); // Map<departmentId_degreeTypeId, departmentDegreeId>
      try {
        const allDegrees: DegreeTypeRow[] = await this.dataSource.query(
          'SELECT * FROM degree_types',
        );
        allDegrees.forEach((d) => {
          degreeMap.set(this.normalizeString(d.name), d);
        });
      } catch (e) {
        this.logger.warn(
          'Could not fetch degree_types table, skipping degree validation',
          e,
        );
      }
      allDeptDegrees.forEach((dd) => {
        deptDegreeMap.set(`${dd.departmentId}_${dd.degreeTypeId}`, dd.id);
      });

      const rows = await this.bulkImportRowRepo.find({
        where: { importId: jobId, status: 'READY' },
        order: { rowIndex: 'ASC' },
      });

      // 1. Group Rows into Batches
      const batches = new Map<
        string,
        {
          key: string;
          groupName: string;
          programType: string;
          examStart: string | undefined;
          examEnd: string | undefined;
          rows: BulkImportRow[];
          dtos: any[];
        }
      >();

      for (const row of rows) {
        let effectiveGroupName = this.getValue(row.rawData, [
          'GroupName',
          'group_name',
          'Corporate',
          'corporate',
          'Group',
        ]);
        if (row.matchedGroupId) {
          const matchedName = groupMap.get(Number(row.matchedGroupId));
          if (matchedName) effectiveGroupName = matchedName;
        }

        const dto = this.mapRowToDto(
          row.rawData,
          effectiveGroupName || '',
          programMap,
          departmentMap,
          degreeMap,
          deptDegreeMap,
        );

        // Find Program ID for Header from original CSV value
        const rawProgram = this.getValue(row.rawData, ['ProgramId', 'program_code']);
        const programObj = rawProgram
          ? programMap.get(this.normalizeString(rawProgram))
          : null;
        const programId = programObj ? Number(programObj.id) : null;

        // Create Batch Key
        const batchKey = `${this.normalizeString(effectiveGroupName || '')}|${programId || 'UNKNOWN'}`;

        if (!batches.has(batchKey)) {
          batches.set(batchKey, {
            key: batchKey,
            groupName: effectiveGroupName || '',
            programType: String(programId || ''), // store resolved Program ID
            examStart: dto.examStart,
            examEnd: dto.examEnd,
            rows: [],
            dtos: [],
          });
        }
        batches.get(batchKey)?.rows.push(row);
        batches.get(batchKey)?.dtos.push(dto);
      }

      let successCount = 0;
      let failCount = 0;

      // 2. Process Batches
      for (const batch of batches.values()) {
        this.logger.log(
          `Processing Batch: ${batch.groupName} - Rows: ${batch.rows.length}`,
        );

        let groupAssessmentId = null;

        // A. Create/Find Group
        let group = allGroups.find(
          (g) =>
            this.normalizeString(g.name) === this.normalizeString(batch.groupName) ||
            (g.code && this.normalizeString(g.code) === this.normalizeString(batch.groupName)),
        );
        try {
          // If group doesn't exist in map but was passed, Create it ONLY if we are sure?
          // Actually corporateRegistrationsService.registerCandidate handles group creation per row.
          // But we need Group ID for the Header.
          // So we MUST ensure group exists HERE.

          if (!group) {
            group = this.groupsRepo.create({
              name: batch.groupName,
              corporateAccountId: corporateAccountId,
              createdByUserId: createdById,
              isActive: true,
              // code: ... auto
            });
            await this.groupsRepo.save(group);
            // Add to cache
            allGroups.push(group);
          }
        } catch (err) {
          this.logger.error(
            `Failed to find/create group ${batch.groupName}`,
            err,
          );
          // Fail all rows in batch
          for (const row of batch.rows) {
            row.status = 'FAILED';
            row.errorMessage = 'System Error: Failed to create Group';
            row.resultType = 'FAILED_DB';
            failCount++;
          }
          await this.bulkImportRowRepo.save(batch.rows);

          // Fix stuck processing issue
          await this.bulkImportRepo.increment(
            { id: jobId },
            'processedCount',
            batch.rows.length,
          );

          continue;
        }

        // B. Create Header (GroupAssessment)
        try {
          // Determine Dates
          const dtoTemplate = batch.dtos[0];
          const validFrom = dtoTemplate.examStart
            ? new Date(dtoTemplate.examStart)
            : new Date();
          const validTo = dtoTemplate.examEnd
            ? new Date(dtoTemplate.examEnd)
            : new Date();

          const programId = Number(batch.programType);
          if (programId > 0) {
            this.logger.log(
              `Creating GroupAssessment for Group: ${group.id}, Program: ${programId}`,
            );

            const groupAssessment = this.groupAssessmentRepo.create({
              groupId: Number(group.id),
              programId: programId,
              validFrom,
              validTo,
              totalCandidates: batch.rows.length,
              status: 'NOT_STARTED',
              corporateAccountId: corporateAccountId,
              createdByUserId: createdById,
              metadata: { importId: jobId, source: 'BULK_UPLOAD' },
            });

            const savedGA = await this.groupAssessmentRepo.save(groupAssessment);
            groupAssessmentId = savedGA.id;
          } else {
            // Fallback: Find any active program
            this.logger.warn(
              `Program ID could not be resolved for batch '${batch.groupName}'. Attempting default active program.`,
            );
            const defaultProgram = allPrograms.find((p) => p.isActive);

            if (defaultProgram) {
              this.logger.log(
                `Using Default Program: ${defaultProgram.name} (ID: ${defaultProgram.id})`,
              );

              const groupAssessment = this.groupAssessmentRepo.create({
                groupId: Number(group.id),
                programId: Number(defaultProgram.id),
                validFrom,
                validTo,
                totalCandidates: batch.rows.length,
                status: 'NOT_STARTED',
                corporateAccountId: corporateAccountId,
                createdByUserId: createdById,
                metadata: {
                  importId: jobId,
                  source: 'BULK_UPLOAD',
                  note: 'Used default program',
                },
              });
              const savedGA = await this.groupAssessmentRepo.save(groupAssessment);
              groupAssessmentId = savedGA.id;

              // Important: Update the DTOs in this batch to use this program ID
              for (const d of batch.dtos) {
                if (!d.programType) {
                  d.programType = defaultProgram.code || defaultProgram.name;
                }
              }
            } else {
              this.logger.error(
                `CRITICAL: No programType in CSV and no default active program found.`,
              );
              throw new Error(
                'No valid program found for this batch and no default active program is available.',
              );
            }
          }
        } catch (err) {
          this.logger.error(
            `CRITICAL: Failed to create GroupAssessment Header for batch ${batch.groupName}`,
            err,
          );

          for (const row of batch.rows) {
            row.status = 'FAILED';
            row.errorMessage = `System Error: Failed to create Group Assessment Header${err instanceof Error && err.message ? ` - ${err.message}` : ''
              }`;
            row.resultType = 'FAILED_DB';
            failCount++;
          }
          await this.bulkImportRowRepo.save(batch.rows);

          // Fix stuck processing issue
          await this.bulkImportRepo.increment(
            { id: jobId },
            'processedCount',
            batch.rows.length,
          );

          continue; // Stop processing this batch
        }

        // Pre-fetch users for this batch to avoid N+1 queries
        const emailsForBatch = batch.rows
          .map((r) => this.normalizeEmail(r.rawData['Email'] || r.rawData['email']))
          .filter(Boolean);
        const mobilesForBatch = batch.rows.map(r => r.rawData['Mobile'] || r.rawData['mobile'] || r.rawData['mobile_number'])
          .map(m => this.normalizeMobile(String(m)))
          .filter(Boolean);

        const batchUsers = await this.userRepo
          .createQueryBuilder('u')
          .where(
            emailsForBatch.length > 0 ? 'LOWER(u.email) IN (:...emails)' : '1=0',
            { emails: emailsForBatch },
          )
          .orWhere(
            mobilesForBatch.length > 0
              ? "regexp_replace(COALESCE(u.metadata->>'mobile', ''), '\\D', '', 'g') IN (:...mobiles)"
              : '1=0',
            { mobiles: mobilesForBatch },
          )
          .getMany();

        const batchUserMapByEmail = new Map(
          batchUsers.map((u) => [this.normalizeEmail(u.email), u]),
        );
        // For mobiles search, since it's common in college student programs, let's also fetch them if emails empty.
        // But to be safe and efficient, let's use the maps we already build in the loop if needed or just optimized queries.

        let batchProcessedCount = 0;
        for (let i = 0; i < batch.rows.length; i++) {
          // Throttle to prevent Cognito 429 errors (Approx 50 req/sec)
          await new Promise((resolve) => setTimeout(resolve, 20));

          const row = batch.rows[i];
          const dto = batch.dtos[i];

          try {
            if (!groupAssessmentId) {
              throw new Error('Group Assessment ID missing.');
            }
            dto.groupAssessmentId = Number(groupAssessmentId);

            const email = this.normalizeEmail(
              row.rawData['Email'] || row.rawData['email'],
            );
            const mobile = row.rawData['Mobile'] || row.rawData['mobile'] || row.rawData['mobile_number'];
            const mobileNorm = this.normalizeMobile(mobile);

            let existingUserId: number | null = null;
            if (email && batchUserMapByEmail.has(email)) {
              existingUserId = batchUserMapByEmail.get(email)!.id;
            } else if (mobileNorm) {
              // Secondary fallback for mobile if email didn't match
              const u = await this.userRepo
                .createQueryBuilder('u')
                .where(
                  "regexp_replace(COALESCE(u.metadata->>'mobile', ''), '\\D', '', 'g') = :mobile",
                  { mobile: mobileNorm },
                )
                .getOne();
              if (u) existingUserId = u.id;
            }

            if (existingUserId) {
              // Free Assignment
              await this.corporateRegistrationsService.assignAssessmentToExistingUser(
                existingUserId,
                dto,
                createdById,
              );
              row.resultType = 'ASSIGNED'; // Specific status for existing users
            } else {
              // Paid Registration
              await this.corporateRegistrationsService.registerCandidate(
                dto,
                createdById,
              );
              row.resultType = 'CREATED';
            }

            row.status = 'SUCCESS';
            successCount++;
            await this.bulkImportRowRepo.save(row);
          } catch (err: any) {
            this.logger.error(`Row ${row.rowIndex} failed`, err);
            row.status = 'FAILED';
            row.errorMessage = err.message || 'Unknown error'; // Could be 'Insufficient credits'
            row.resultType = 'FAILED_DB';
            failCount++;
            await this.bulkImportRowRepo.save(row);
          }

          batchProcessedCount++;
          // Update job progress incrementally every 5 rows
          if (batchProcessedCount % 5 === 0) {
            await this.bulkImportRepo.increment(
              { id: jobId },
              'processedCount',
              5,
            );
          }
        }
        // Update remaining progress for this batch
        const remaining = batchProcessedCount % 5;
        if (remaining > 0) {
          await this.bulkImportRepo.increment(
            { id: jobId },
            'processedCount',
            remaining,
          );
        }
      }

      job.status = 'COMPLETED';
      job.processedCount = successCount + failCount; // Should match total
      job.completedAt = new Date();
      await this.bulkImportRepo.save(job);
      this.logger.log(
        `Job ${jobId} Completed. Success: ${successCount}, Fail: ${failCount}`,
      );
    } catch (error: any) {
      this.logger.error(`Critical overarching error in processing job ${jobId}`, error);
      if (job) {
        job.status = 'FAILED';
        await this.bulkImportRepo.save(job);
      }
    }
  }

  // ---------------------------------------------------------
  // CRON JOBS
  // ---------------------------------------------------------
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupDrafts() {
    this.logger.log('Running cleanupDrafts...');
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 7);

    const oldDrafts = await this.bulkImportRepo.find({
      where: {
        status: 'DRAFT',
        createdAt: LessThan(retentionDate),
      },
      select: ['id'],
    });

    if (oldDrafts.length > 0) {
      const ids = oldDrafts.map((j) => j.id);
      // Delete rows
      await this.bulkImportRowRepo.delete({ importId: In(ids) });
      // Delete jobs
      const res = await this.bulkImportRepo.delete({ id: In(ids) });
      this.logger.log(`Deleted ${res.affected} old DRAFT bulk imports.`);
    }
  }

  /**
   * Exam Expiration Notification (1 day before)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyExpiringExams() {
    this.logger.log('Running notifyExpiringExams cron...');

    try {
      // 1. Calculate boundaries for "Tomorrow" in IST (Assuming DB is UTC)
      // We want session.valid_to to be within [Now + 24h - buffer, Now + 24h + buffer]
      // Or just sessions whose validTo is tomorrow in IST calendar.
      const tomorrow = dayjs().add(1, 'day');
      const startOfTomorrow = tomorrow.startOf('day').toISOString();
      const endOfTomorrow = tomorrow.endOf('day').toISOString();

      // 2. Find sessions expiring tomorrow
      const expiringSessions = await this.dataSource.query(
        `
        SELECT s.id, u.corporate_id, r.full_name as student_name
        FROM assessment_sessions s
        JOIN users u ON s.user_id = u.id
        JOIN registrations r ON s.registration_id = r.id
        WHERE s.status IN ('NOT_STARTED', 'IN_PROGRESS')
          AND s.valid_to >= $1 AND s.valid_to <= $2
          AND u.role = 'STUDENT'
          AND u.corporate_id IS NOT NULL
        `,
        [startOfTomorrow, endOfTomorrow],
      );

      if (!expiringSessions || expiringSessions.length === 0) {
        this.logger.log('No expiring exams found for tomorrow.');
        return;
      }

      // 3. Group by Corporate ID
      const corpMap = new Map<number, { count: number; studentNames: string[] }>();
      for (const s of expiringSessions) {
        const corpId = Number(s.corporate_id);
        if (!corpId) continue;

        if (!corpMap.has(corpId)) {
          corpMap.set(corpId, { count: 0, studentNames: [] });
        }
        const entry = corpMap.get(corpId)!;
        entry.count++;
        if (s.student_name) entry.studentNames.push(s.student_name);
      }

      // 4. Send notifications
      const adminServiceUrl =
        this.configService.get<string>('ADMIN_SERVICE_URL') ||
        'http://localhost:4002';

      for (const [corpId, data] of corpMap.entries()) {
        const corpAccount = await this.corporateAccountRepo.findOne({
          where: { id: corpId },
        });

        if (!corpAccount || !corpAccount.userId) continue;

        const message = `Candidate ${data.studentNames.join(', ')}'s assessment will be expired in 1 day.`;

        try {
          await this.notificationRepo.save({
            userId: Number(corpAccount.userId),
            role: 'CORPORATE',
            type: 'EXAM_EXPIRATION',
            title: 'Exam Expiry Warning',
            message,
            metadata: {
              corporateAccountId: corpId,
              count: data.count,
              expiryDate: startOfTomorrow,
            },
          });
          this.logger.log(`Expiry notification saved for Corp ID: ${corpId}`);
        } catch (err) {
          this.logger.error(
            `Failed to save notification for corporate account ${corpId}: ${err.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in notifyExpiringExams cron', error.stack);
    }
  }

  private getValue(row: unknown, keys: string[]): string | undefined {
    if (!row || typeof row !== 'object' || row === null) return undefined;
    for (const key of keys) {
      const val = (row as Record<string, unknown>)[key];
      if (val === undefined || val === null) continue;

      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed !== '') return trimmed;
        continue;
      }

      if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
      }
    }
    return undefined;
  }

  private parseDateAsIST(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;

    const formats = [
      'M/D/YYYY H:mm',
      'M/D/YYYY HH:mm',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD H:mm',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY H:mm',
      'MM/DD/YYYY HH:mm',
      'MM/DD/YYYY H:mm',
    ];

    // Attempt to parse strictly with formats
    for (const fmt of formats) {
      if (dayjs(dateStr, fmt, true).isValid()) {
        const d = dayjs.tz(dateStr, fmt, 'Asia/Kolkata');
        if (d.isValid()) return d.toISOString();
      }
    }

    // Fallback to standard parser if strict fails
    const fallback = dayjs.tz(dateStr, 'Asia/Kolkata');
    if (fallback.isValid()) {
      return fallback.toISOString();
    }

    return undefined;
  }

  private resolveDegreeType(
    degreeName: string,
    degreeMap: Map<string, DegreeTypeRow>,
  ): DegreeTypeRow | null {
    const norm = this.normalizeString(degreeName);
    if (!norm) return null;

    const exact = degreeMap.get(norm);
    if (exact) return exact;

    // Common CSV variants for B.Tech/B.E
    if (norm === 'btech' || norm === 'betech') {
      for (const [key, val] of degreeMap.entries()) {
        if (
          key.includes('bacheloroftechnology') ||
          key.includes('engineering')
        ) {
          return val;
        }
      }
    }

    // Generic fallback match
    for (const [key, val] of degreeMap.entries()) {
      if (key.includes(norm) || norm.includes(key)) {
        return val;
      }
    }
    return null;
  }

  private mapRowToDto(
    rawData: unknown,
    groupName: string,
    programMap: Map<string, Program>,
    deptMap: Map<string, Department>,
    degreeMap: Map<string, DegreeTypeRow>,
    deptDegreeMap: Map<string, string>,
  ) {
    const pCode = this.getValue(rawData, ['ProgramId', 'program_code']);
    let pId: any = null;
    let isCollege = false;
    let isSchool = false;

    if (pCode) {
      const pObj = programMap.get(this.normalizeString(pCode));
      if (pObj) {
        pId = pObj.code || pObj.name;
        isCollege = pObj.name.toLowerCase().includes('college') || pCode.toUpperCase().includes('COLLEGE');
        isSchool = pObj.name.toLowerCase().includes('school') || pCode.toUpperCase().includes('SCHOOL');
      }
    }

    isCollege = pCode && pCode.toUpperCase().includes('COLLEGE');
    isSchool = pCode && pCode.toUpperCase().includes('SCHOOL');

    // Resolve DepartmentDegreeId
    let departmentDegreeId: string | undefined = undefined;
    if (isCollege) {
      const deptName = this.getValue(rawData, [
        'DepartmentId',
        'department_degree',
        'department',
        'Stream',
      ]);
      const degreeName = this.getValue(rawData, [
        'DegreeId',
        'degree_name',
        'degree',
        'Degree',
      ]);

      if (deptName && degreeName) {
        const dept = deptMap.get(this.normalizeString(deptName));
        const degree = this.resolveDegreeType(degreeName, degreeMap);

        if (dept && degree) {
          const key = `${dept.id}_${degree.id}`;
          if (deptDegreeMap.has(key)) {
            departmentDegreeId = deptDegreeMap.get(key);
          }
        }
      }
    }

    const currentYear = this.getValue(rawData, [
      'CurrentYear',
      'current_year',
      'Year',
      'year',
    ]);

    return {
      fullName: this.getValue(rawData, ['FullName', 'Name', 'full_name']) || '',
      email: this.getValue(rawData, ['Email', 'email']) || '',
      mobile:
        this.getValue(rawData, ['Mobile', 'mobile', 'mobile_number']) || '',
      countryCode: (() => {
        let cc =
          this.getValue(rawData, ['CountryCode', 'country_code']) || '+91';
        if (!cc.startsWith('+')) cc = '+' + cc;
        return cc;
      })(),
      gender: (
        this.getValue(rawData, ['Gender', 'gender']) || 'FEMALE'
      ).toUpperCase() as any,

      programType: pId,
      groupName: groupName,

      schoolLevel: isSchool
        ? this.getValue(rawData, ['SchoolLevel', 'school_level'])
        : undefined,
      schoolStream: isSchool
        ? this.getValue(rawData, ['SchoolStream', 'school_stream'])
        : undefined,
      studentBoard: isSchool
        ? this.getValue(rawData, ['StudentBoard', 'student_board', 'board'])
        : undefined,

      departmentId: departmentDegreeId ? String(departmentDegreeId) : undefined, // Corporate frontend dto expects departmentId as string which maps to departmentDegreeId in backend
      degreeId: undefined, // Not used in registration directly, inferred via DepartmentDegree
      currentYear: isCollege ? String(currentYear) : undefined,
      currentRole: this.getValue(rawData, ['CurrentRole', 'current_role', 'Current Role', 'currentRole']) || undefined,
      roleDescription: this.getValue(rawData, ['RoleDescription', 'role_description', 'Role Description', 'roleDescription']) || undefined,

      password:
        this.getValue(rawData, ['Password', 'password']) || 'Welcome@123',
      sendEmail: (() => {
        const val = this.getValue(rawData, ['send_email', 'SendEmail']);
        return val ? val.toUpperCase() === 'TRUE' : false;
      })(),
      examStart: this.parseDateAsIST(
        this.getValue(rawData, ['ExamStart', 'exam_start_date', 'valid_from']),
      ),
      examEnd: this.parseDateAsIST(
        this.getValue(rawData, ['ExamEnd', 'exam_end_date', 'valid_to']),
      ),
    };
  }

  private processRow(
    rawData: any,
    index: number,
    importJob: BulkImport,
    programMap: Map<string, Program>,
    deptMap: Map<string, Department>,
    degreeMap: Map<string, DegreeTypeRow>,
    deptDegreeMap: Map<string, string>,
    allGroups: Groups[],
    groupMap: Map<string, Groups>,
    userMapByEmail: Map<string, User>, // Changed from AdminUser to User
    userMapByMobile: Map<string, User>, // Changed from AdminUser to User
    userAssessmentMap: Map<number, any[]>,
    seenEmails: Set<string>,
    seenMobiles: Set<string>,
  ): BulkImportRow {
    const rowEntity = this.bulkImportRowRepo.create({
      importId: importJob.id,
      rowIndex: index,
      rawData,
      status: 'PROCESSING',
    });

    const validationError = this.validateRules(
      rawData,
      programMap,
      deptMap,
      degreeMap,
      deptDegreeMap,
      userMapByEmail,
      userMapByMobile,
      userAssessmentMap,
      seenEmails,
      seenMobiles,
    );

    if (validationError) {
      rowEntity.status = 'INVALID';
      rowEntity.errorMessage = validationError;
      return rowEntity;
    }

    // Group Matching Logic
    const groupNameInput = this.getValue(rawData, ['GroupName', 'group_name', 'Corporate', 'corporate', 'Group']);
    if (!groupNameInput) {
      rowEntity.status = 'INVALID';
      rowEntity.errorMessage = 'Group Name/Corporate is required';
      return rowEntity;
    }

    rowEntity.status = 'READY'; // Default to READY (New Group)
    rowEntity.matchedGroupId = null;
    rowEntity.groupMatchScore = 0;

    const normalizedInput = this.normalizeString(groupNameInput);

    // 1. Exact Match
    if (groupMap.has(normalizedInput)) {
      const g = groupMap.get(normalizedInput);
      rowEntity.matchedGroupId = Number(g.id);
      rowEntity.groupMatchScore = 100;
    } else {
      // 2. Fuzzy Match
      let bestMatch: Groups | null = null;
      let minDistance = Infinity;

      for (const g of allGroups) {
        if (Math.abs(g.name.length - groupNameInput.length) > 3) continue;

        const dist = this.levenshtein(
          groupNameInput.toLowerCase(),
          g.name.toLowerCase(),
        );
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = g;
        }
      }

      if (bestMatch && minDistance <= 2) {
        rowEntity.matchedGroupId = Number(bestMatch.id);
        const len = Math.max(groupNameInput.length, bestMatch.name.length);
        const score = Math.round((1 - minDistance / len) * 100);
        rowEntity.groupMatchScore = score;
        rowEntity.status = 'NEEDS_CONFIRMATION';
      }
    }

    return rowEntity;
  }

  private validateRules(
    row: any,
    programMap: Map<string, Program>,
    deptMap: Map<string, Department>,
    degreeMap: Map<string, DegreeTypeRow>,
    deptDegreeMap: Map<string, string>,
    userMapByEmail: Map<string, User>, // Changed from AdminUser to User
    userMapByMobile: Map<string, User>, // Changed from AdminUser to User
    userAssessmentMap: Map<number, any[]>,
    seenEmails: Set<string>,
    seenMobiles: Set<string>,
  ): string | null {
    // 1. Mandatory Fields
    const email = row['Email'] || row['email'];
    const mobile = row['Mobile'] || row['mobile'] || row['mobile_number'];
    let countryCode = row['CountryCode'] || row['country_code'] || '+91';
    const programCode = row['ProgramId'] || row['program_code'];
    const gender = (row['Gender'] || row['gender'] || '').toUpperCase();

    if (!email) return 'Email is required';
    if (!mobile) return 'Mobile is required';

    if (!countryCode.startsWith('+')) {
      countryCode = '+' + countryCode;
    }
    if (!/^\+\d{1,4}$/.test(countryCode)) {
      return `Country Code '${countryCode}' invalid.`;
    }

    if (!['MALE', 'FEMALE', 'OTHER', 'OTHERS'].includes(gender)) {
      return `Gender '${gender}' invalid.`;
    }

    if (!programCode) return 'Program is required';
    const program = programMap.get(this.normalizeString(programCode));
    if (!program) return `Program '${programCode}' not found`;

    const isSchool = program.name.toLowerCase().includes('school');
    const isCollege = program.name.toLowerCase().includes('college');

    if (isSchool) {
      const level = (
        row['SchoolLevel'] ||
        row['school_level'] ||
        ''
      ).toUpperCase();
      if (!level) return 'School Level is required for School Students';
      if (!['SSLC', 'HSC'].includes(level))
        return 'School Level valid values are SSLC, HSC';

      if (level === 'HSC') {
        const stream = (
          row['SchoolStream'] ||
          row['school_stream'] ||
          ''
        ).toLowerCase();
        const validStreams = ['science', 'commerce', 'humanities'];
        if (!stream) return 'Stream is required for HSC students';
        if (!validStreams.includes(stream))
          return 'Stream must be Science, Commerce, or Humanities for HSC';
      }
    } else if (isCollege) {
      const deptName = row['DepartmentId'] || row['department_degree'] || row['department'];
      const degreeName = row['DegreeId'] || row['degree_name'] || row['degree'] || row['Degree'];
      const currentYear = row['CurrentYear'] || row['current_year'];

      if (!deptName) return 'Department is required for College students';
      const dept = deptMap.get(this.normalizeString(deptName));
      if (!dept)
        return `Department '${deptName}' not found in departments.short_name`;

      if (!degreeName) return 'Degree is required for College students';
      const deg = this.resolveDegreeType(degreeName, degreeMap);
      if (!deg) return `Degree '${degreeName}' not found`;

      if (!currentYear) return 'Current Year is required for College Students';
      if (!['1', '2', '3', '4'].includes(String(currentYear).trim()))
        return 'Current Year must be 1, 2, 3, or 4';

      // Ensure the combination maps to a valid departmentDegreeId
      const key = `${dept.id}_${deg.id}`;
      if (!deptDegreeMap.has(key)) {
        return `The combination of Department '${deptName}' and Degree '${degreeName}' is invalid or not found.`;
      }
    } else {
      // Employee / Corporate Program
      const role = row['CurrentRole'] || row['current_role'] || row['Current Role'] || row['currentRole'];
      const desc = row['RoleDescription'] || row['role_description'] || row['Role Description'] || row['roleDescription'];

      if (!role) return 'Current Role is required for Employee programs';
      if (!desc) return 'Role Description is required for Employee programs';
    }

    // 4. Dates
    const start = row['ExamStart'] || row['exam_start_date'];
    const end = row['ExamEnd'] || row['exam_end_date'];
    if (!start || !end) return 'Exam Start/End dates are required';

    const startDate = this.parseDateTime(start);
    const endDate = this.parseDateTime(end);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid Date Format.';
    }

    if (startDate < now) {
      return 'Exam Start Date > Current Time required.';
    }
    if (endDate <= startDate) {
      return 'Exam End Date > Start Date required.';
    }

    // 5. Duplication Check
    const emailNorm = this.normalizeEmail(email);
    const inputMobile = this.normalizeMobile(mobile);

    const existingByEmail = userMapByEmail.get(emailNorm);
    const existingByMobile = userMapByMobile.get(inputMobile);

    if (existingByEmail) {
      const dbMobile = this.normalizeMobile(existingByEmail.metadata?.mobile || '');
      if (dbMobile !== inputMobile) {
        return `Email '${email}' already exists with a different mobile number`;
      }
    }

    if (existingByMobile) {
      const dbEmail = this.normalizeEmail(existingByMobile.email || '');
      if (dbEmail !== emailNorm) {
        return `Mobile '${mobile}' already exists with a different email`;
      }
    }

    // Check for Active Assessment
    const finalExistingUser = existingByEmail || existingByMobile;
    if (finalExistingUser) {
      const sessions =
        userAssessmentMap.get(Number(finalExistingUser.id)) || [];
      const activeSession = sessions.find(
        (s) =>
          !['COMPLETED', 'EXPIRED', 'PARTIALLY_EXPIRED'].includes(s.status),
      );

      if (activeSession) {
        return `Error: User already has an active assessment (Status: ${activeSession.status}). Cannot create a new one.`;
      }
    }

    // Internal File Dupes
    if (seenEmails.has(emailNorm)) return `Duplicate Email in file: ${email}`;
    if (seenMobiles.has(inputMobile)) return `Duplicate Mobile in file: ${mobile}`;

    seenEmails.add(emailNorm);
    seenMobiles.add(inputMobile);

    return null;
  }

  private normalizeString(str: string): string {
    return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  }

  private parseDateTime(val: any): Date {
    if (!val) return new Date('Invalid');
    const str = String(val).trim();
    if (/^\d{4}/.test(str)) {
      return new Date(str);
    }
    // MM-DD-YYYY or DD-MM-YYYY logic
    const dmyPattern =
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = str.match(dmyPattern);
    if (match) {
      const part1 = parseInt(match[1], 10);
      const part2 = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const minute = match[5] ? parseInt(match[5], 10) : 0;
      const second = match[6] ? parseInt(match[6], 10) : 0;

      let day, month;
      if (part1 <= 12) {
        month = part1 - 1;
        day = part2;
      } else {
        day = part1;
        month = part2 - 1;
      }

      return new Date(year, month, day, hour, minute, second);
    }
    return new Date(str);
  }

  private levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    let i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
