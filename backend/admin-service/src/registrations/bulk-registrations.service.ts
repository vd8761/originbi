import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const csv = require('fast-csv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const levenshtein = require('fast-levenshtein');
import { Readable } from 'stream';

import { BulkImport } from './entities/bulk-import.entity';
import { BulkImportRow } from './entities/bulk-import-row.entity';
import { Groups } from '../groups/groups.entity';
import { RegistrationsService } from './registrations.service';
import { User } from '../users/user.entity';
import { Program } from '../programs/entities/program.entity';
import { Department } from '../departments/department.entity';

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
        private dataSource: DataSource,
        private readonly registrationsService: RegistrationsService,
    ) { }

    /**
     * Phase 1: Preview & Validate
     */
    async preview(fileBuffer: Buffer, filename: string, userId: number) {
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

        // 4. Batch Validation Checks
        const emails = rawRows.map(r => r['Email'] || r['email']).filter(Boolean);
        const mobiles = rawRows.map(r => r['Mobile'] || r['mobile'] || r['mobile_number']).filter(Boolean);

        const existingUsers = await this.userRepo.find({
            where: { email: In(emails) }, // Simple In clause
            select: ['email', 'metadata']
        });
        const existingEmails = new Set(existingUsers.map(u => u.email));

        const existingMobiles = new Set<string>();
        existingUsers.forEach(u => {
            if (u.metadata?.mobile) existingMobiles.add(u.metadata.mobile);
        });

        if (mobiles.length > 0) {
            const mobileUsers = await this.userRepo
                .createQueryBuilder('u')
                .where("u.metadata->>'mobile' IN (:...mobiles)", { mobiles })
                .getMany();

            mobileUsers.forEach(u => {
                if (u.metadata?.mobile) existingMobiles.add(u.metadata.mobile);
                if (u.email) existingEmails.add(u.email);
            });
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
                existingEmails,
                existingMobiles,
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

        let successCount = 0;
        let failCount = 0;

        for (const row of rows) {
            try {
                let effectiveGroupName = row.rawData['GroupName'] || row.rawData['group_name'];
                if (row.matchedGroupId) {
                    const matchedName = groupMap.get(Number(row.matchedGroupId));
                    if (matchedName) effectiveGroupName = matchedName;
                }

                const dto = this.mapRowToDto(row.rawData, effectiveGroupName, programMap, deptMap, degreeMap);

                // Check redundancy
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

                if (successCount % 10 === 0) {
                    await this.bulkImportRepo.increment({ id: jobId }, 'processedCount', 10);
                }

            } catch (err: any) {
                this.logger.error(`Row ${row.rowIndex} failed`, err);
                row.status = 'FAILED';
                row.errorMessage = err.message || 'Unknown error';
                row.resultType = 'FAILED_DB';
                failCount++;
                await this.bulkImportRowRepo.save(row);
            }
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

        // Delete DRAFTs older than 7 days
        // Note: Cascade delete should handle rows if configured, otherwise we delete rows first.
        // Assuming TypeORM cascade or database constraints handle it. 
        // If not, we should query IDs first, delete rows, then delete job.
        // Safe approach: Fetch first.

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
            if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
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
            countryCode: this.getValue(rawData, ['CountryCode', 'country_code']) || '+91',
            gender: (this.getValue(rawData, ['Gender', 'gender']) || 'FEMALE').toUpperCase(),

            programType: pId,
            groupName: groupName,

            schoolLevel: isSchool ? this.getValue(rawData, ['SchoolLevel', 'school_level']) : undefined,
            schoolStream: isSchool ? this.getValue(rawData, ['SchoolStream', 'school_stream']) : undefined,

            departmentId: isCollege ? dId : undefined,
            degreeId: isCollege ? degId : undefined,
            currentYear: isCollege ? this.getValue(rawData, ['current_year', 'CurrentYear', 'Year', 'year']) : undefined,

            password: 'Welcome@123',
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
        existingEmails: Set<string>,
        existingMobiles: Set<string>,
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
            existingEmails,
            existingMobiles,
            seenEmails,
            seenMobiles
        );

        if (validationError) {
            rowEntity.status = 'INVALID';
            rowEntity.errorMessage = validationError;
            return rowEntity;
        }

        const groupNameInput = rawData['GroupName'] || rawData['group_name'];
        if (!groupNameInput) {
            rowEntity.status = 'INVALID';
            rowEntity.errorMessage = 'Group Name is required';
            return rowEntity;
        }

        rowEntity.status = 'READY';
        rowEntity.matchedGroupId = null;
        rowEntity.groupMatchScore = 0;

        return rowEntity;
    }

    private validateRules(
        row: any,
        programMap: Map<string, Program>,
        deptMap: Map<string, Department>,
        degreeMap: Map<string, any>,
        existingEmails: Set<string>,
        existingMobiles: Set<string>,
        seenEmails: Set<string>,
        seenMobiles: Set<string>
    ): string | null {
        // 1. Mandatory Fields
        const email = row['Email'] || row['email'];
        const mobile = row['Mobile'] || row['mobile'] || row['mobile_number'];
        const programCode = row['ProgramId'] || row['program_code'];
        const gender = (row['Gender'] || row['gender'] || '').toUpperCase();

        if (!email) return "Email is required";
        if (!mobile) return "Mobile is required";

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

        // 5. Duplication
        if (existingEmails.has(email)) return `Email ${email} already exists`;
        if (existingMobiles.has(mobile)) return `Mobile ${mobile} already exists`;
        if (seenEmails.has(email)) return `Duplicate Email in file: ${email}`;
        if (seenMobiles.has(mobile)) return `Duplicate Mobile in file: ${mobile}`;

        seenEmails.add(email);
        seenMobiles.add(mobile);

        return null;
    }

    private normalizeString(str: string): string {
        return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    }
}
