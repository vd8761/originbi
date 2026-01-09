/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-base-to-string */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('fast-csv');
import { Readable } from 'stream';

import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';
import { Groups } from '../groups/groups.entity';
import { RegistrationsService } from './registrations.service';
import { User } from '../users/user.entity';
import { Program } from '../programs/entities/program.entity';
import { Department } from '../departments/department.entity';
import { GroupAssessment } from '../assessment/group_assessment.entity';

@Injectable()
export class BulkRegistrationsService {
    private readonly logger = new Logger(BulkRegistrationsService.name);

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
        @InjectRepository(Department)
        private departmentRepo: Repository<Department>,
        @InjectRepository(GroupAssessment)
        private groupAssessmentRepo: Repository<GroupAssessment>,
        private dataSource: DataSource,
        private readonly registrationsService: RegistrationsService,
    ) { }

    /**
     * Phase 1: Preview & Validate
     */
    async preview(fileBuffer: Buffer, filename: string, userId: number) {
        // Validate File Format
        if (!filename.toLowerCase().endsWith('.csv')) {
            throw new BadRequestException('Invalid file format. Only CSV files are allowed.');
        }

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
        allPrograms.forEach(p => {
            programMap.set(this.normalizeString(p.code), p);
            programMap.set(this.normalizeString(p.name), p);
        });

        // Fetch Groups for Matching
        const allGroups = await this.groupsRepo.find();
        const groupMap = new Map<string, Groups>();
        allGroups.forEach(g => {
            groupMap.set(this.normalizeString(g.name), g);
        });

        const allDepartments = await this.departmentRepo.find();
        const deptMap = new Map<string, Department>();
        allDepartments.forEach(d => {
            deptMap.set(this.normalizeString(d.name), d);
            if (d.shortName) deptMap.set(this.normalizeString(d.shortName), d);
        });

        const degreeMap = new Map<string, any>();
        try {
            const allDegrees: any[] = await this.dataSource.query('SELECT * FROM degree_types');
            allDegrees.forEach(d => {
                degreeMap.set(this.normalizeString(d.name), d);
            });
        } catch (e) {
            this.logger.warn('Could not fetch degree_types table, skipping degree validation', e);
        }

        // 3. Parse All Rows First
        const rawRows: any[] = [];
        const stream = Readable.from(fileBuffer);

        await new Promise((resolve, reject) => {
            csv
                .parseStream(stream, { headers: true, ignoreEmpty: true, trim: true })
                .on('error', (error: any) => reject(new BadRequestException(`Invalid CSV format: ${error.message}`)))
                .on('data', (row: any) => rawRows.push(row))
                .on('end', () => resolve(true));
        });

        // 4. Batch Validation Checks (Enhanced for Existing Users)
        const emails = rawRows.map(r => r['Email'] || r['email']).filter(Boolean);
        const mobiles = rawRows.map(r => r['Mobile'] || r['mobile'] || r['mobile_number']).filter(Boolean);

        // Fetch users by Email OR Mobile
        let existingUsers: User[] = [];

        if (emails.length > 0 || mobiles.length > 0) {
            const qb = this.userRepo.createQueryBuilder('u')
                .select(['u.id', 'u.email', 'u.metadata']);

            if (emails.length > 0) {
                qb.where('u.email IN (:...emails)', { emails });
            }
            if (mobiles.length > 0) {
                // If emails exist, use OR, otherwise just WHERE
                if (emails.length > 0) {
                    qb.orWhere("u.metadata->>'mobile' IN (:...mobiles)", { mobiles });
                } else {
                    qb.where("u.metadata->>'mobile' IN (:...mobiles)", { mobiles });
                }
            }
            existingUsers = await qb.getMany();
        }

        // Build User Maps
        const userMapByEmail = new Map<string, User>();
        const userMapByMobile = new Map<string, User>();

        existingUsers.forEach(u => {
            if (u.email) userMapByEmail.set(u.email, u); // Email is unique
            const m = u.metadata?.mobile;
            if (m) userMapByMobile.set(String(m).trim(), u);
        });

        // Fetch Assessment Sessions for these existing users to check overlaps
        // Map: userId -> AssessmentSession[]
        const userAssessmentMap = new Map<number, any[]>();
        if (existingUsers.length > 0) {
            const userIds = existingUsers.map(u => u.id);
            try {
                // We use raw query or partial select for performance
                const sessions = await this.dataSource.query(
                    `SELECT id, user_id, valid_from, valid_to, program_id, status FROM assessment_sessions WHERE user_id IN (${userIds.join(',')})`
                );
                sessions.forEach((s: any) => {
                    const uid = Number(s.user_id);
                    if (!userAssessmentMap.has(uid)) {
                        userAssessmentMap.set(uid, []);
                    }
                    userAssessmentMap.get(uid)?.push(s);
                });
            } catch (err) {
                this.logger.warn('Failed to fetch existing sessions for validation', err);
            }
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
                deptMap,
                degreeMap,
                allGroups,
                groupMap, // Pass group map
                userMapByEmail,
                userMapByMobile,
                userAssessmentMap,
                seenEmails,
                seenMobiles
            );
            rowsToInsert.push(processedRow);

            if (processedRow.status === 'READY') validCount++;
            else if (processedRow.status === 'NEEDS_CONFIRMATION') needsConfirmCount++;
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

        const previewRows = rowsToInsert.slice(0, 100).map(r => ({
            ...r,
            import: undefined
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
        if (job.status !== 'DRAFT') throw new BadRequestException(`Job is ${job.status}, cannot execute.`)

        if (overrides && overrides.length > 0) {
            for (const override of overrides) {
                const { row_index, group_id } = override;
                await this.bulkImportRowRepo.update(
                    { importId: import_id, rowIndex: row_index },
                    {
                        status: 'READY',
                        matchedGroupId: group_id,
                        overridden: true,
                        overrideData: { group_id }
                    }
                );
            }
        }

        job.status = 'QUEUED';
        await this.bulkImportRepo.save(job);
        this.processJob(job.id).catch(err => this.logger.error(`Job ${job.id} failed`, err));
        return { jobId: job.id, status: 'QUEUED' };
    }

    async getJobStatus(jobId: string) {
        const job = await this.bulkImportRepo.findOne({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Job not found');

        const failedCount = await this.bulkImportRowRepo.count({
            where: { importId: jobId, status: 'FAILED' }
        });

        const successCount = await this.bulkImportRowRepo.count({
            where: { importId: jobId, status: 'SUCCESS' }
        });

        return {
            status: job.status,
            total: job.totalRecords,
            processed: job.processedCount,
            success: successCount,
            failed: failedCount,
            progress: job.totalRecords > 0 ? Math.round((job.processedCount / job.totalRecords) * 100) : 0
        };
    }

    async getJobRows(jobId: string) {
        return this.bulkImportRowRepo.find({
            where: { importId: jobId },
            order: { rowIndex: 'ASC' }
        });
    }

    /**
     * Worker
     */
    async processJob(jobId: string) {
        this.logger.log(`Starting processing for Job ${jobId}`);

        const job = await this.bulkImportRepo.findOne({ where: { id: jobId } });
        if (!job) return;
        job.status = 'PROCESSING';
        await this.bulkImportRepo.save(job);

        // Pre-fetch reference data
        const allGroups = await this.groupsRepo.find({ select: ['id', 'name'] });
        const groupMap = new Map(allGroups.map(g => [Number(g.id), g.name]));

        const allPrograms = await this.programRepo.find();
        const programMap = new Map<string, Program>();
        allPrograms.forEach(p => {
            programMap.set(this.normalizeString(p.code), p);
            programMap.set(this.normalizeString(p.name), p);
        });

        const allDepartments = await this.departmentRepo.find();
        const deptMap = new Map<string, Department>();
        allDepartments.forEach(d => {
            deptMap.set(this.normalizeString(d.name), d);
            if (d.shortName) deptMap.set(this.normalizeString(d.shortName), d);
        });

        const degreeMap = new Map<string, any>();
        try {
            const allDegrees: any[] = await this.dataSource.query('SELECT * FROM degree_types');
            allDegrees.forEach(d => {
                degreeMap.set(this.normalizeString(d.name), d);
            });
        } catch (e) {
            this.logger.warn('Could not fetch degree_types table, skipping degree validation', e);
        }

        const rows = await this.bulkImportRowRepo.find({
            where: { importId: jobId, status: 'READY' },
            order: { rowIndex: 'ASC' }
        });

        // 1. Group Rows by Batch (Group + Program + Dates)
        const batchMap = new Map<string, {
            groupName: string,
            dtoTemplate: any,
            rows: BulkImportRow[],
            dtos: any[]
        }>();

        for (const row of rows) {
            try {
                let effectiveGroupName = row.rawData['GroupName'] || row.rawData['group_name'];
                if (row.matchedGroupId) {
                    const matchedName = groupMap.get(Number(row.matchedGroupId));
                    if (matchedName) effectiveGroupName = matchedName;
                }
                const dto = this.mapRowToDto(row.rawData, effectiveGroupName, programMap, deptMap, degreeMap);

                // Use a composite key to group assessments
                const pId = dto.programType || '0';
                const sDate = dto.examStart ? new Date(dto.examStart).toISOString() : 'default_start';
                const eDate = dto.examEnd ? new Date(dto.examEnd).toISOString() : 'default_end';
                const gNameNorm = this.normalizeString(effectiveGroupName);

                const key = `${gNameNorm}|${pId}|${sDate}|${eDate}`;

                if (!batchMap.has(key)) {
                    batchMap.set(key, {
                        groupName: effectiveGroupName,
                        dtoTemplate: dto, // Store sample for dates/program
                        rows: [],
                        dtos: []
                    });
                }
                const batch = batchMap.get(key)!;
                batch.rows.push(row);
                batch.dtos.push(dto);

            } catch (err: any) {
                this.logger.error(`Row ${row.rowIndex} mapping failed`, err);
                row.status = 'FAILED';
                row.errorMessage = err.message || 'Mapping error';
                row.resultType = 'FAILED_VALIDATION';
                await this.bulkImportRowRepo.save(row);
            }
        }

        let successCount = 0;
        let failCount = 0;

        // 2. Process Batches
        for (const [key, batch] of batchMap) {
            let groupAssessmentId: number | null = null;
            this.logger.log(`Processing Batch: ${batch.groupName} with ${batch.rows.length} rows`);

            try {
                // A. Ensure Group Exists
                let group = await this.groupsRepo.findOne({
                    where: { name: batch.groupName }
                });

                if (!group) {
                    group = await this.groupsRepo.createQueryBuilder('g')
                        .where('LOWER(g.name) = :name', { name: batch.groupName.toLowerCase() })
                        .getOne();
                }

                if (!group) {
                    this.logger.log(`Creating new group: ${batch.groupName}`);
                    group = this.groupsRepo.create({
                        name: batch.groupName,
                        createdByUserId: job.createdById,
                        isActive: true
                    });
                    group = await this.groupsRepo.save(group);
                }

                // B. Create Group Assessment Header
                // Use first dto as template
                const templateDto = batch.dtos[0];
                const { programType, examStart, examEnd } = templateDto;

                if (programType) {
                    const validFrom = examStart ? new Date(examStart) : new Date();
                    const validTo = examEnd ? new Date(examEnd) : null;
                    const program = await this.programRepo.findOne({ where: { id: programType } });
                    const title = program ? program.name : 'Bulk Assessment';

                    this.logger.log(`Creating GroupAssessment: GroupID=${group.id}, ProgramID=${programType}`);

                    const groupAssessment = this.groupAssessmentRepo.create({
                        groupId: Number(group.id),
                        programId: Number(programType),
                        validFrom,
                        validTo,
                        totalCandidates: batch.rows.length,
                        status: 'NOT_STARTED',
                        createdByUserId: job.createdById,
                        metadata: {
                            importId: jobId,
                            source: 'BULK_UPLOAD'
                        }
                    });
                    const savedGA = await this.groupAssessmentRepo.save(groupAssessment);
                    groupAssessmentId = Number(savedGA.id);
                    this.logger.log(`Created GroupAssessment ID: ${groupAssessmentId}`);
                } else {
                    this.logger.warn(`Skipping GroupAssessment creation: No programType found in batch`);
                }

            } catch (err) {
                this.logger.error(`CRITICAL: Failed to create Group/Assessment Header for batch ${batch.groupName}. Stopping batch processing.`, err);
                // Mark all rows in this batch as FAILED
                for (const row of batch.rows) {
                    row.status = 'FAILED';
                    row.errorMessage = 'System Error: Failed to create Group Assessment Header';
                    row.resultType = 'FAILED_DB';
                    failCount++;
                }
                await this.bulkImportRowRepo.save(batch.rows);

                // Continue to next batch? Or stop entire job? 
                // "stop the process immediately" usually refers to the current atomic operation. 
                // I will skip to next batch.
                continue;
            }

            // C. Process Rows
            for (let i = 0; i < batch.rows.length; i++) {
                const row = batch.rows[i];
                const dto = batch.dtos[i];

                try {
                    // Inject Header ID - Critical Check
                    if (!groupAssessmentId) {
                        throw new Error("Group Assessment ID is missing despite successful header creation.");
                    }
                    dto.groupAssessmentId = groupAssessmentId;

                    // Check Redundancy
                    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });

                    if (existingUser) {
                        await this.registrationsService.createForExistingUser(existingUser, dto);
                        row.resultType = 'SKIPPED_USER_CREATE';
                    } else {
                        await this.registrationsService.create(dto);
                        row.resultType = 'CREATED';
                    }

                    row.status = 'SUCCESS';
                    successCount++;
                    await this.bulkImportRowRepo.save(row);

                } catch (err: any) {
                    this.logger.error(`Row ${row.rowIndex} failed execution`, err);
                    row.status = 'FAILED';
                    row.errorMessage = err.message || 'Unknown error';
                    row.resultType = 'FAILED_DB';
                    failCount++;
                    await this.bulkImportRowRepo.save(row);
                }
            }

            // Update Progress
            await this.bulkImportRepo.increment({ id: jobId }, 'processedCount', batch.rows.length);
        }

        job.status = 'COMPLETED';
        job.processedCount = successCount + failCount;
        job.completedAt = new Date();
        await this.bulkImportRepo.save(job);
        this.logger.log(`Job ${jobId} Completed. Success: ${successCount}, Fail: ${failCount}`);
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
                createdAt: LessThan(retentionDate)
            },
            select: ['id']
        });

        if (oldDrafts.length > 0) {
            const ids = oldDrafts.map(j => j.id);
            // Delete rows
            await this.bulkImportRowRepo.delete({ importId: In(ids) });
            // Delete jobs
            const res = await this.bulkImportRepo.delete({ id: In(ids) });
            this.logger.log(`Deleted ${res.affected} old DRAFT bulk imports.`);
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

            if (Array.isArray(val)) {
                if (val.length === 0) continue;
                return val.map(v => (v === undefined || v === null) ? '' : String(v)).join(', ');
            }
        }
        return undefined;
    }

    private mapRowToDto(
        rawData: unknown,
        groupName: string,
        programMap: Map<string, Program>,
        deptMap: Map<string, Department>,
        degreeMap: Map<string, any>
    ) {
        let pCode = this.getValue(rawData, ['ProgramId', 'program_code']);
        let pId: any = null;
        if (pCode) {
            const pObj = programMap.get(this.normalizeString(pCode));
            if (pObj) pId = pObj.id;
        }

        let dId = this.getValue(rawData, ['DepartmentId', 'department_degree', 'department']);
        if (dId) {
            const dObj = deptMap.get(this.normalizeString(dId));
            if (dObj) dId = dObj.id;
        }

        let degId = this.getValue(rawData, ['DegreeId', 'degree_name', 'degree', 'Degree']);
        if (degId && degreeMap.size > 0) {
            const found = degreeMap.get(this.normalizeString(degId));
            if (found) degId = found.id;
        }

        const isCollege = pCode && pCode.toUpperCase().includes('COLLEGE');
        const isSchool = pCode && pCode.toUpperCase().includes('SCHOOL');

        return {
            name: this.getValue(rawData, ['FullName', 'Name', 'full_name']) || '',
            email: this.getValue(rawData, ['Email', 'email']) || '',
            mobile: this.getValue(rawData, ['Mobile', 'mobile', 'mobile_number']) || '',
            countryCode: (() => {
                let cc = this.getValue(rawData, ['CountryCode', 'country_code']) || '+91';
                if (!cc.startsWith('+')) cc = '+' + cc;
                return cc;
            })(),
            gender: (this.getValue(rawData, ['Gender', 'gender']) || 'FEMALE').toUpperCase(),

            programType: pId,
            groupName: groupName,

            schoolLevel: isSchool ? this.getValue(rawData, ['SchoolLevel', 'school_level']) : undefined,
            schoolStream: isSchool ? this.getValue(rawData, ['SchoolStream', 'school_stream']) : undefined,

            departmentId: isCollege ? dId : undefined,
            degreeId: isCollege ? degId : undefined,
            currentYear: isCollege ? this.getValue(rawData, ['current_year', 'CurrentYear', 'Year', 'year']) : undefined,

            password: this.getValue(rawData, ['Password', 'password']) || 'Admin@123',
            sendEmail: true,
            examStart: this.getValue(rawData, ['ExamStart', 'exam_start_date', 'valid_from']),
            examEnd: this.getValue(rawData, ['ExamEnd', 'exam_end_date', 'valid_to']),
        };
    }

    private processRow(
        rawData: any,
        index: number,
        importJob: BulkImport,
        programMap: Map<string, Program>,
        deptMap: Map<string, Department>,
        degreeMap: Map<string, any>,
        allGroups: Groups[],
        groupMap: Map<string, Groups>,
        userMapByEmail: Map<string, User>,
        userMapByMobile: Map<string, User>,
        userAssessmentMap: Map<number, any[]>,
        seenEmails: Set<string>,
        seenMobiles: Set<string>
    ): BulkImportRow {
        const rowEntity = new BulkImportRow();
        rowEntity.import = importJob;
        rowEntity.rowIndex = index;
        rowEntity.rawData = rawData;
        rowEntity.normalizedData = { ...rawData };

        const validationError = this.validateRules(
            rawData,
            programMap,
            deptMap,
            degreeMap,
            userMapByEmail,
            userMapByMobile,
            userAssessmentMap,
            seenEmails,
            seenMobiles
        );

        if (validationError) {
            rowEntity.status = 'INVALID';
            rowEntity.errorMessage = validationError;
            return rowEntity;
        }

        // Group Matching Logic
        const groupNameInput = rawData['GroupName'] || rawData['group_name'];
        if (!groupNameInput) {
            rowEntity.status = 'INVALID';
            rowEntity.errorMessage = 'Group Name is required';
            return rowEntity;
        }

        rowEntity.status = 'READY'; // Default to READY (New Group)
        rowEntity.matchedGroupId = null;
        rowEntity.groupMatchScore = 0;

        const normalizedInput = this.normalizeString(groupNameInput);

        // 1. Exact Match
        if (groupMap.has(normalizedInput)) {
            const g = groupMap.get(normalizedInput);
            rowEntity.matchedGroupId = Number(g!.id);
            rowEntity.groupMatchScore = 100;
            // Status remains READY (Exact match is good to go)
        } else {
            // 2. Fuzzy Match
            // Find closest group
            let bestMatch: Groups | null = null;
            let minDistance = Infinity;

            for (const g of allGroups) {
                // Optimization: Skip if length difference is too big
                if (Math.abs(g.name.length - groupNameInput.length) > 3) continue;

                const dist = this.levenshtein(groupNameInput.toLowerCase(), g.name.toLowerCase());
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatch = g;
                }
            }

            // Thresholds: Distance <= 2 usually implies typo (School A vs SchoolA or Schol A)
            if (bestMatch && minDistance <= 2) {
                rowEntity.matchedGroupId = Number(bestMatch.id);
                // Calculate rough score
                const len = Math.max(groupNameInput.length, bestMatch.name.length);
                const score = Math.round((1 - minDistance / len) * 100);
                rowEntity.groupMatchScore = score;

                // Mark for Confirmation
                rowEntity.status = 'NEEDS_CONFIRMATION';
            }
            // 3. Else: No Match found -> New Group (Status READY, matchId null)
        }

        return rowEntity;
    }

    private validateRules(
        row: any,
        programMap: Map<string, Program>,
        deptMap: Map<string, Department>,
        degreeMap: Map<string, any>,
        userMapByEmail: Map<string, User>,
        userMapByMobile: Map<string, User>,
        userAssessmentMap: Map<number, any[]>,
        seenEmails: Set<string>,
        seenMobiles: Set<string>
    ): string | null {
        // 1. Mandatory Fields
        const email = row['Email'] || row['email'];
        const mobile = row['Mobile'] || row['mobile'] || row['mobile_number'];
        let countryCode = row['CountryCode'] || row['country_code'] || '+91';
        const programCode = row['ProgramId'] || row['program_code'];
        const gender = (row['Gender'] || row['gender'] || '').toUpperCase();

        if (!email) return "Email is required";
        if (!mobile) return "Mobile is required";

        // Country Code Normalization (Auto-add +)
        if (!countryCode.startsWith('+')) {
            countryCode = '+' + countryCode;
            // Update row so it reflects in data that might be used later or shown in UI if rawData is used?
            // Note: rawData is usually read-only or reference. 
            // Better to just validate the normalized version.
        }
        // Ensure it is valid (e.g. +91, +1)
        if (!/^\+\d{1,4}$/.test(countryCode)) {
            return `Country Code '${countryCode}' invalid. Must be + followed by digits (e.g. +91)`;
        }

        // 2. Gender
        if (!['MALE', 'FEMALE', 'OTHER', 'OTHERS'].includes(gender)) {
            return `Gender '${gender}' invalid. Must be Male, Female, or Others`;
        }

        // 3. Program
        if (!programCode) return "Program is required";
        const program = programMap.get(this.normalizeString(programCode));
        if (!program) return `Program '${programCode}' not found`;

        const isSchool = program.name.toLowerCase().includes('school');
        const isCollege = program.name.toLowerCase().includes('college');

        if (isSchool) {
            const level = (row['SchoolLevel'] || row['school_level'] || '').toUpperCase();
            if (!level) return "School Level is required for School Students";
            if (!['SSLC', 'HSC'].includes(level)) return "School Level valid values are SSLC, HSC";

            if (level === 'HSC') {
                const stream = (row['SchoolStream'] || row['school_stream'] || '').toLowerCase();
                const validStreams = ['science', 'commerce', 'humanities'];
                if (!stream) return "Stream is required for HSC students";
                if (!validStreams.includes(stream)) return "Stream must be Science, Commerce, or Humanities for HSC";
            }
        }
        else if (isCollege) {
            const deptName = row['DepartmentId'] || row['department_degree'] || row['department'];
            const degreeName = row['Degree'] || row['degree'];
            const year = row['CurrentYear'] || row['current_year'];

            if (!deptName) return "Department is required for College students";
            const dept = deptMap.get(this.normalizeString(deptName));
            if (!dept) return `Department '${deptName}' not found`;

            if (!degreeName) return "Degree is required for College students";
            if (degreeMap.size > 0) {
                const deg = degreeMap.get(this.normalizeString(degreeName));
                if (!deg) return `Degree '${degreeName}' not found`;
            }

            if (!year) return "Current Year is required";
            if (!['1', '2', '3', '4'].includes(String(year).trim())) return "Current Year must be 1, 2, 3, or 4";
        }

        // 4. Dates
        const start = row['ExamStart'] || row['exam_start_date'];
        const end = row['ExamEnd'] || row['exam_end_date'];
        if (!start || !end) return "Exam Start/End dates are required";

        // Parse using custom helper to support DD-MM-YYYY
        const startDate = this.parseDateTime(start);
        const endDate = this.parseDateTime(end);
        const now = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return "Invalid Date Format. Please use 'DD-MM-YYYY HH:mm' (e.g., 10-01-2026 09:00)";
        }

        // Logic: Exam Start >= Now (approx)
        if (startDate < now) {
            return "Exam Start Date & Time must be greater than or equal to current time.";
        }

        // Logic: Exam End > Exam Start
        if (endDate <= startDate) {
            return "Exam End Date & Time must be greater than Start Date & Time.";
        }

        // 5. Duplication Check (Existing Users)
        const normalizeMobile = (m: any) => String(m).trim();
        const inputMobile = normalizeMobile(mobile);

        const existingByEmail = userMapByEmail.get(email);
        const existingByMobile = userMapByMobile.get(inputMobile);

        // Case: User Exists by Email
        if (existingByEmail) {
            const dbMobile = normalizeMobile(existingByEmail.metadata?.mobile || '');
            if (dbMobile !== inputMobile) {
                return `Error: Email ${email} already exists with different phone no`;
            }
        }

        // Case: User Exists by Mobile
        if (existingByMobile) {
            const dbEmail = existingByMobile.email;
            if (dbEmail !== email) {
                return `Error: Mobile no ${mobile} already exists with different email id`;
            }
        }

        // If both exist and match, or one exists and matches -> Existing User
        const finalExistingUser = existingByEmail; // We know they match if we are here and one exists

        // If Existing User, Check Active Assessment
        if (finalExistingUser) {
            const sessions = userAssessmentMap.get(Number(finalExistingUser.id)) || [];

            // Check if ANY active assessment exists
            // We consider an assessment "Active" if it is NOT in a terminal state (COMPLETED or EXPIRED).
            // This includes: NOT_STARTED, ON_GOING, PARTIALLY_EXP (if used).
            const activeSession = sessions.find(s =>
                s.status !== 'COMPLETED' &&
                s.status !== 'EXPIRED'
            );

            if (activeSession) {
                return `Error: User already has an active assessment (Status: ${activeSession.status}). Cannot create a new one.`;
            }
        } else {
            // New User -> Check Duplicates within the file itself
            if (seenEmails.has(email)) return `Duplicate Email in file: ${email}`;
            if (seenMobiles.has(mobile)) return `Duplicate Mobile in file: ${mobile}`;

            seenEmails.add(email);
            seenMobiles.add(mobile);
        }

        return null;
    }

    private normalizeString(str: string): string {
        return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    }

    /**
     * Helper to parse dates supporting DD-MM-YYYY or DD/MM/YYYY formats
     */
    private parseDateTime(val: any): Date {
        if (!val) return new Date('Invalid');
        const str = String(val).trim();

        // 1. Try generic ISO (YYYY-MM-DD)
        // If it starts with YYYY (4 digits), assume built-in parser is fine
        if (/^\d{4}/.test(str)) {
            return new Date(str);
        }

        // 2. Regex for DD-MM-YYYY or MM-DD-YYYY with optional time
        // Matches: 01-07-2026 (Jan 7 or July 1), 13-01-2026 (Jan 13)
        const dmyPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

        const match = str.match(dmyPattern);
        if (match) {
            const part1 = parseInt(match[1], 10);
            const part2 = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            const hour = match[4] ? parseInt(match[4], 10) : 0;
            const minute = match[5] ? parseInt(match[5], 10) : 0;
            const second = match[6] ? parseInt(match[6], 10) : 0;

            // User preference: "01-07-2026 means Jan 7" => MM-DD-YYYY preference for ambiguous cases.
            // Heuristic: If part1 <= 12, treat as Month (MM-DD). Else treat as Day (DD-MM).
            let day, month;
            if (part1 <= 12) {
                month = part1 - 1; // Month is 0-indexed
                day = part2;
            } else {
                day = part1;
                month = part2 - 1;
            }

            return new Date(year, month, day, hour, minute, second);
        }

        // 3. Fallback to standard
        return new Date(str);
    }

    /**
     * Levenshtein Distance Calculation for Fuzzy Matching
     */
    private levenshtein(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix: number[][] = [];

        // increment along the first column of each row
        let i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        let j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1, // deletion
                        ),
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}
