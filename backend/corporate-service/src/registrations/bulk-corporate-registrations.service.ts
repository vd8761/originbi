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
import { Groups } from '../entities/groups.entity';
import { User } from '../entities/user.entity';
import { Program } from '../entities/program.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { CorporateRegistrationsService } from './corporate-registrations.service';
import { GroupAssessment } from '../entities/group_assessment.entity';

@Injectable()
export class BulkCorporateRegistrationsService {
    private readonly logger = new Logger(BulkCorporateRegistrationsService.name);

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
        private dataSource: DataSource,
        private readonly corporateRegistrationsService: CorporateRegistrationsService,
    ) { }

    /**
     * Phase 1: Preview & Validate
     */
    async preview(fileBuffer: Buffer, filename: string, userId: number) {
        // Validate File Format
        if (!filename.toLowerCase().endsWith('.csv')) {
            throw new BadRequestException('Invalid file format. Only CSV files are allowed.');
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
                    where: { id: Number(user.corporateId) }
                });
            }
        }

        if (!corporateAccount) {
            throw new BadRequestException('Corporate Account not found for this user.');
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
        allPrograms.forEach(p => {
            // Only allow Employee and CXO General
            const normName = this.normalizeString(p.name);
            if (normName.includes('employee') || normName.includes('cxo') || normName.includes('general')) {
                programMap.set(this.normalizeString(p.code), p);
                programMap.set(normName, p);
            }
        });

        // Fetch Groups for Matching (Only for this Corporate Account)
        const allGroups = await this.groupsRepo.find({ where: { corporateAccountId: corporateAccountId } });
        const groupMap = new Map<string, Groups>();
        allGroups.forEach(g => {
            groupMap.set(this.normalizeString(g.name), g);
        });

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

        // Check Credits
        if (rawRows.length > corporateAccount.availableCredits) {
            this.logger.warn(`Insufficient credits. Required: ${rawRows.length}, Available: ${corporateAccount.availableCredits}`);
            throw new BadRequestException(`Insufficient credits. You have ${corporateAccount.availableCredits} credits but uploaded ${rawRows.length} users.`);
        }

        // 4. Batch Validation Checks (Duplicates)
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
            if (u.email) userMapByEmail.set(u.email, u);
            const m = u.metadata?.mobile;
            if (m) userMapByMobile.set(String(m).trim(), u);
        });

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
                allGroups,
                groupMap, // Pass group map
                userMapByEmail,
                userMapByMobile,
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
        this.processJob(job.id, Number(job.createdById)).catch(err => this.logger.error(`Job ${job.id} failed`, err));
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
    async processJob(jobId: string, createdById: number) {
        this.logger.log(`Starting processing for Job ${jobId}`);

        const job = await this.bulkImportRepo.findOne({ where: { id: jobId } });
        if (!job) return;
        job.status = 'PROCESSING';
        await this.bulkImportRepo.save(job);

        // Fetch Corporate Account
        let corporateAccount = await this.corporateAccountRepo.findOne({ where: { userId: createdById } });
        // Fallback for sub-users
        if (!corporateAccount) {
            const user = await this.userRepo.findOne({ where: { id: createdById } });
            if (user && user.corporateId) {
                corporateAccount = await this.corporateAccountRepo.findOne({ where: { id: Number(user.corporateId) } });
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
        const allGroups = await this.groupsRepo.find({ where: { corporateAccountId } });
        const groupMap = new Map(allGroups.map(g => [Number(g.id), g.name]));

        const allPrograms = await this.programRepo.find();
        const programMap = new Map<string, Program>();
        allPrograms.forEach(p => {
            programMap.set(this.normalizeString(p.name), p);
            programMap.set(this.normalizeString(p.code), p); // Add code mapping too
        });

        const rows = await this.bulkImportRowRepo.find({
            where: { importId: jobId, status: 'READY' },
            order: { rowIndex: 'ASC' }
        });

        // 1. Group Rows into Batches
        const batches = new Map<string, {
            key: string;
            groupName: string;
            programType: string;
            examStart: string | undefined;
            examEnd: string | undefined;
            rows: BulkImportRow[];
            dtos: any[];
        }>();

        for (const row of rows) {
            let effectiveGroupName = row.rawData['GroupName'] || row.rawData['group_name'];
            if (row.matchedGroupId) {
                const matchedName = groupMap.get(Number(row.matchedGroupId));
                if (matchedName) effectiveGroupName = matchedName;
            }

            const dto = this.mapRowToDto(row.rawData, effectiveGroupName, programMap);

            // Find Program ID for Header
            let programId: number | null = null;
            if (dto.programType) {
                const p = programMap.get(this.normalizeString(dto.programType));
                if (p) programId = Number(p.id);
            }

            // Create Batch Key
            const batchKey = `${this.normalizeString(effectiveGroupName)}|${programId || 'UNKNOWN'}|${dto.examStart}|${dto.examEnd}`;

            if (!batches.has(batchKey)) {
                batches.set(batchKey, {
                    key: batchKey,
                    groupName: effectiveGroupName,
                    programType: String(programId || 0), // store ID as string key
                    examStart: dto.examStart,
                    examEnd: dto.examEnd,
                    rows: [],
                    dtos: []
                });
            }
            batches.get(batchKey)?.rows.push(row);
            batches.get(batchKey)?.dtos.push(dto);
        }

        let successCount = 0;
        let failCount = 0;

        // 2. Process Batches
        for (const batch of batches.values()) {
            this.logger.log(`Processing Batch: ${batch.groupName} - Rows: ${batch.rows.length}`);

            let groupAssessmentId = null;

            // A. Create/Find Group
            let group = allGroups.find(g => this.normalizeString(g.name) === this.normalizeString(batch.groupName));
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
                this.logger.error(`Failed to find/create group ${batch.groupName}`, err);
                // Fail all rows in batch
                for (const row of batch.rows) {
                    row.status = 'FAILED';
                    row.errorMessage = 'System Error: Failed to create Group';
                    row.resultType = 'FAILED_DB';
                    failCount++;
                }
                await this.bulkImportRowRepo.save(batch.rows);
                continue;
            }

            // B. Create Header (GroupAssessment)
            try {
                // Determine Dates
                const dtoTemplate = batch.dtos[0];
                const validFrom = dtoTemplate.examStart ? new Date(dtoTemplate.examStart) : new Date();
                const validTo = dtoTemplate.examEnd ? new Date(dtoTemplate.examEnd) : new Date();

                const programId = Number(batch.programType);
                if (!programId) {
                    throw new Error(`Program ${dtoTemplate.programType} not found in system.`);
                }

                this.logger.log(`Creating GroupAssessment for Group: ${group.id}, Program: ${programId}`);

                const groupAssessment = this.groupAssessmentRepo.create({
                    groupId: Number(group.id),
                    programId: programId,
                    validFrom,
                    validTo,
                    totalCandidates: batch.rows.length,
                    status: 'NOT_STARTED',
                    corporateAccountId: corporateAccountId,
                    createdByUserId: createdById,
                    metadata: { importId: jobId, source: 'BULK_UPLOAD' }
                });

                const savedGA = await this.groupAssessmentRepo.save(groupAssessment);
                groupAssessmentId = savedGA.id;

            } catch (err) {
                this.logger.error(`CRITICAL: Failed to create GroupAssessment Header for batch ${batch.groupName}`, err);

                for (const row of batch.rows) {
                    row.status = 'FAILED';
                    row.errorMessage = 'System Error: Failed to create Group Assessment Header';
                    row.resultType = 'FAILED_DB';
                    failCount++;
                }
                await this.bulkImportRowRepo.save(batch.rows);
                continue; // Stop processing this batch
            }

            // C. Process Rows (Inject ID)
            for (let i = 0; i < batch.rows.length; i++) {
                const row = batch.rows[i];
                const dto = batch.dtos[i];

                try {
                    if (!groupAssessmentId) {
                        throw new Error("Group Assessment ID missing.");
                    }
                    dto.groupAssessmentId = Number(groupAssessmentId);

                    // Call Registration Service
                    // Note: registerCandidate also tries to create Group if not exists, but we did it above.
                    // It also deducts credits.
                    await this.corporateRegistrationsService.registerCandidate(dto, createdById);

                    row.resultType = 'CREATED';
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

                // 200ms delay to throttle requests (Approx 5 req/sec)
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            // Update progress
            await this.bulkImportRepo.increment({ id: jobId }, 'processedCount', batch.rows.length);
        }

        job.status = 'COMPLETED';
        job.processedCount = successCount + failCount; // Should match total
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
        }
        return undefined;
    }

    private mapRowToDto(
        rawData: unknown,
        groupName: string,
        programMap: Map<string, Program>
    ) {
        let pCode = this.getValue(rawData, ['ProgramId', 'program_code']);
        let pName = 'Employee'; // Default fallback? Or strict?

        if (pCode) {
            // Check if matches specific keywords
            const norm = this.normalizeString(pCode);
            if (norm.includes('cxo')) pName = 'CXO General';
            else if (norm.includes('employee')) pName = 'Employee';
            else {
                // If user provided exact name 'CXO General Assessment' etc.
                if (programMap.has(norm)) pName = programMap.get(norm)!.name;
            }
        }

        return {
            fullName: this.getValue(rawData, ['FullName', 'Name', 'full_name']) || '',
            email: this.getValue(rawData, ['Email', 'email']) || '',
            mobile: this.getValue(rawData, ['Mobile', 'mobile', 'mobile_number']) || '',
            countryCode: (() => {
                let cc = this.getValue(rawData, ['CountryCode', 'country_code']) || '+91';
                if (!cc.startsWith('+')) cc = '+' + cc;
                return cc;
            })(),
            gender: (this.getValue(rawData, ['Gender', 'gender']) || 'FEMALE').toUpperCase() as any,
            programType: pName,
            groupName: groupName,
            password: this.getValue(rawData, ['Password', 'password']) || 'Welcome@123',
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
        allGroups: Groups[],
        groupMap: Map<string, Groups>,
        userMapByEmail: Map<string, User>,
        userMapByMobile: Map<string, User>,
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
            userMapByEmail,
            userMapByMobile,
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
        } else {
            // 2. Fuzzy Match
            let bestMatch: Groups | null = null;
            let minDistance = Infinity;

            for (const g of allGroups) {
                if (Math.abs(g.name.length - groupNameInput.length) > 3) continue;

                const dist = this.levenshtein(groupNameInput.toLowerCase(), g.name.toLowerCase());
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
        userMapByEmail: Map<string, User>,
        userMapByMobile: Map<string, User>,
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

        if (!countryCode.startsWith('+')) {
            countryCode = '+' + countryCode;
        }
        if (!/^\+\d{1,4}$/.test(countryCode)) {
            return `Country Code '${countryCode}' invalid.`;
        }

        if (!['MALE', 'FEMALE', 'OTHER', 'OTHERS'].includes(gender)) {
            return `Gender '${gender}' invalid.`;
        }

        if (!programCode) return "Program is required";
        const program = programMap.get(this.normalizeString(programCode));
        // Also allow generic keywords
        const pNorm = this.normalizeString(programCode);
        const isValidProgram = program || pNorm.includes('employee') || pNorm.includes('cxo') || pNorm.includes('general');

        if (!isValidProgram) {
            return `Program '${programCode}' invalid. Must be 'Employee' or 'CXO General'.`;
        }

        // 4. Dates
        const start = row['ExamStart'] || row['exam_start_date'];
        const end = row['ExamEnd'] || row['exam_end_date'];
        if (!start || !end) return "Exam Start/End dates are required";

        const startDate = this.parseDateTime(start);
        const endDate = this.parseDateTime(end);
        const now = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return "Invalid Date Format.";
        }

        if (startDate < now) {
            return "Exam Start Date > Current Time required.";
        }
        if (endDate <= startDate) {
            return "Exam End Date > Start Date required.";
        }

        // 5. Duplication Check
        const normalizeMobile = (m: any) => String(m).trim();
        const inputMobile = normalizeMobile(mobile);

        const existingByEmail = userMapByEmail.get(email);
        const existingByMobile = userMapByMobile.get(inputMobile);

        if (existingByEmail) {
            const dbMobile = normalizeMobile(existingByEmail.metadata?.mobile || '');
            if (dbMobile !== inputMobile) {
                return `Email ${email} exists with different phone no`;
            }
        }

        if (existingByMobile) {
            const dbEmail = existingByMobile.email;
            if (dbEmail !== email) {
                return `Mobile no ${mobile} exists with different email id`;
            }
        }

        // Internal File Dupes
        if (seenEmails.has(email)) return `Duplicate Email in file: ${email}`;
        if (seenMobiles.has(mobile)) return `Duplicate Mobile in file: ${mobile}`;

        seenEmails.add(email);
        seenMobiles.add(mobile);

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
        const dmyPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
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
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}
