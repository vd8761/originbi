import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { User } from '../users/user.entity';
import { CorporateAccount } from './entities/corporate-account.entity';
import { CorporateCreditLedger } from './entities/corporate-credit-ledger.entity';
import { CreateCorporateRegistrationDto } from './dto/create-corporate-registration.dto';
import { getCorporateWelcomeEmailTemplate } from '../mail/templates/corporate-welcome.template';

@Injectable()
export class CorporateService {
    private readonly logger = new Logger(CorporateService.name);
    private authServiceBaseUrl =
        process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

    // Hardcoded Admin ID for 'created_by' fields if needed, 
    // or we could extract from request context if we had that passed down.
    // For now, using 1 as system admin.
    private readonly ADMIN_USER_ID = 1;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(CorporateAccount)
        private readonly corporateRepo: Repository<CorporateAccount>,

        @InjectRepository(CorporateCreditLedger)
        private readonly ledgerRepo: Repository<CorporateCreditLedger>,

        private readonly dataSource: DataSource,
        private readonly http: HttpService,
    ) { }

    // ----------------------------------------------------------------
    // Helper: Create Cognito User (Shared logic with Registrations)
    // ----------------------------------------------------------------
    private async createCognitoUser(email: string, password: string, groupName: string) {
        try {
            const url = `${this.authServiceBaseUrl}/internal/cognito/users`;
            const res$ = this.http.post(url, { email, password, groupName });
            const res = await firstValueFrom(res$);
            return res.data as { sub?: string };
        } catch (err: any) {
            const authErr = err?.response?.data || err?.message || err;
            this.logger.error('Error creating Cognito user:', authErr);
            throw new InternalServerErrorException(
                authErr?.message || 'Failed to create Cognito user'
            );
        }
    }

    // ----------------------------------------------------------------
    // FIND ALL (List)
    // ----------------------------------------------------------------
    async findAll(page: number, limit: number, search?: string) {
        try {
            const qb = this.corporateRepo
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.user', 'u')
                .orderBy('c.createdAt', 'DESC');

            if (search) {
                const s = `%${search.toLowerCase()}%`;
                qb.andWhere(
                    '(LOWER(c.companyName) LIKE :s OR LOWER(c.mobileNumber) LIKE :s OR LOWER(u.email) LIKE :s OR LOWER(c.sectorCode) LIKE :s)',
                    { s },
                );
            }

            const total = await qb.getCount();
            const rows = await qb
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();

            // Transform response to match UI expectations if needed
            // The frontend expects the entity structure mostly, but let's ensure we return what's needed.
            // Based on screenshot: Name, Gender, Email, Mobile, Company, Job Title, Status, Action
            // We return the full entity, frontend maps it.

            return {
                data: rows.map(r => ({
                    ...r, // Include original properties just in case
                    id: r.id,
                    full_name: r.user?.metadata?.fullName || '',
                    email: r.user?.email || '',
                    mobile_number: r.mobileNumber,
                    country_code: r.countryCode,
                    company_name: r.companyName,
                    job_title: r.jobTitle,
                    is_active: r.isActive,
                    sector_code: r.sectorCode,
                    business_locations: r.businessLocations,
                    available_credits: r.availableCredits,
                    total_credits: r.totalCredits,
                    employee_ref_id: r.employeeRefId,
                    linkedin_url: r.linkedinUrl,
                    is_blocked: r.isBlocked,
                })),
                total,
                page,
                limit,
            };
        } catch (error: any) {
            this.logger.error(`findAll Corporate Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Failed to fetch corporate registrations`);
        }
    }

    // ----------------------------------------------------------------
    // FIND ONE
    // ----------------------------------------------------------------
    async findOne(id: number) {
        const account = await this.corporateRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!account) {
            throw new BadRequestException('Corporate account not found');
        }
        return {
            ...account,
            email: account.user?.email,
        };
    }

    // ----------------------------------------------------------------
    // UPDATE (General)
    // ----------------------------------------------------------------
    async update(id: number, dto: any) { // Using any for partial update of fields
        const account = await this.corporateRepo.findOne({ where: { id }, relations: ['user'] });
        if (!account) {
            throw new BadRequestException('Corporate account not found');
        }

        return this.dataSource.transaction(async (manager) => {
            // 1. Update User fields if email/name changed (though name is in metadata)
            // 1. Update User fields if email/name changed (though name is in metadata)
            if (dto.email || dto.name || dto.countryCode || dto.mobile || dto.gender) {
                const user = account.user;
                let userChanged = false;

                if (dto.mobile && (dto.mobile !== account.mobileNumber || dto.countryCode !== account.countryCode)) {
                    // Check mobile uniqueness (excluding current account)
                    const existingMobile = await manager.getRepository(CorporateAccount).findOne({
                        where: {
                            mobileNumber: dto.mobile,
                            countryCode: dto.countryCode || account.countryCode
                        }
                    });
                    if (existingMobile && existingMobile.id !== account.id) {
                        throw new BadRequestException('Mobile number already exists for another corporate account');
                    }
                }

                if (dto.employeeCode && dto.employeeCode !== account.employeeRefId) {
                    const existingRef = await manager.getRepository(CorporateAccount).findOne({
                        where: { employeeRefId: dto.employeeCode }
                    });
                    if (existingRef && existingRef.id !== account.id) {
                        throw new BadRequestException(`Employee Ref ID '${dto.employeeCode}' is already in use.`);
                    }
                }

                if (dto.email && dto.email !== user.email) {
                    // Check uniqueness
                    const existing = await manager.getRepository(User).findOne({ where: { email: dto.email } });
                    if (existing && existing.id !== user.id) throw new BadRequestException('Email already in use');
                    user.email = dto.email;
                    userChanged = true;
                }

                // Update metadata
                const metadata = user.metadata || {};
                if (dto.name) { metadata.fullName = dto.name; userChanged = true; }
                if (dto.countryCode) { metadata.countryCode = dto.countryCode; userChanged = true; }
                if (dto.mobile) { metadata.mobile = dto.mobile; userChanged = true; }
                if (dto.gender) { metadata.gender = dto.gender; userChanged = true; }

                if (userChanged) {
                    user.metadata = metadata;
                    await manager.save(user);
                }
            }

            // 2. Update Corporate fields
            // explicit mapping to avoid overwriting unrelated fields
            if (dto.companyName) account.companyName = dto.companyName;
            if (dto.sector) account.sectorCode = dto.sector;
            if (dto.businessLocations) account.businessLocations = dto.businessLocations;
            if (dto.jobTitle) account.jobTitle = dto.jobTitle;
            if (dto.employeeCode) account.employeeRefId = dto.employeeCode;
            if (dto.linkedinUrl) account.linkedinUrl = dto.linkedinUrl;
            if (dto.countryCode) account.countryCode = dto.countryCode;
            if (dto.mobile) account.mobileNumber = dto.mobile;
            if (dto.gender) account.gender = dto.gender;
            if (dto.status !== undefined) account.isActive = dto.status;

            await manager.save(account);

            return { ...account, email: account.user.email };
        });
    }

    // ----------------------------------------------------------------
    // UPDATE STATUS
    // ----------------------------------------------------------------
    async updateStatus(id: number, isActive: boolean) {
        const account = await this.corporateRepo.findOne({ where: { id }, relations: ['user'] });
        if (!account) throw new BadRequestException('Account not found');

        account.isActive = isActive;
        await this.corporateRepo.save(account);

        // Also update user active status?
        account.user.isActive = isActive;
        await this.userRepo.save(account.user);

        return { success: true };
    }

    // ----------------------------------------------------------------
    // UPDATE BLOCK STATUS
    // ----------------------------------------------------------------
    async updateBlockStatus(id: number, isBlocked: boolean) {
        const account = await this.corporateRepo.findOne({ where: { id }, relations: ['user'] });
        if (!account) throw new BadRequestException('Account not found');

        account.isBlocked = isBlocked;
        await this.corporateRepo.save(account);

        // Also update user blocked status
        account.user.isBlocked = isBlocked;
        await this.userRepo.save(account.user);

        return { success: true };
    }

    // ----------------------------------------------------------------
    // UPDATE CREDITS
    // ----------------------------------------------------------------
    async updateCredits(id: number, credits: number) {
        const account = await this.corporateRepo.findOne({ where: { id } });
        if (!account) throw new BadRequestException('Account not found');

        // Calculate delta
        const oldCredits = account.totalCredits; // Assuming we are setting TOTAL credits
        // OR are we setting AVAILABLE? The prompt said "update credits", usually means setting the new balance.
        // The previous service call was "updateCredits(id, credits)".
        // Let's assume this sets the TOTAL allocated credits, and we adjust available accordingly?
        // OR it sets available?
        // Let's assume the input is the NEW value for available_credits (or we stick to the ledger logic).

        // Let's go with: Input is the NEW AVAILABLE credits balance the admin wants to set.
        const diff = credits - account.availableCredits;

        if (diff === 0) return { success: true };

        return this.dataSource.transaction(async (manager) => {
            account.availableCredits = credits;
            account.totalCredits = account.totalCredits + diff; // Keep total in sync with the added/removed amount

            await manager.save(account);

            const ledger = manager.create(CorporateCreditLedger, {
                corporateAccountId: account.id,
                creditDelta: diff,
                reason: 'Manual update by admin',
                createdByUserId: this.ADMIN_USER_ID,
            });
            await manager.save(ledger);

            return { success: true, newBalance: credits };
        });
    }

    // ----------------------------------------------------------------
    // REMOVE (Delete)
    // ----------------------------------------------------------------
    async remove(id: number) {
        // Hard delete or Soft delete? Schema doesn't have deleted_at.
        // We will do a Cascade delete via DB if configured, but here we explicitly delete.
        const account = await this.corporateRepo.findOne({ where: { id }, relations: ['user'] });
        if (!account) throw new BadRequestException('Account not found');

        return this.dataSource.transaction(async (manager) => {
            // Delete corporate account
            await manager.delete(CorporateAccount, id);

            // Optionally delete user? 
            // Usually yes if the user was created solely for this corporate account.
            // The schema FK says "ON DELETE CASCADE" on corporate_accounts -> users?
            // user_id is foreign key IN corporate_accounts referring to users(id).
            // schema: "corporate_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ... ON DELETE CASCADE"
            // This means if USER is deleted, corporate account is deleted.
            // So we should delete the USER.

            await manager.delete(User, account.userId);

            // Cognito deletion? Ideally yes.
            // Skipping cognito delete implementation for now as we don't have the method ready/exposed easily without more auth-service plumbing.
        });
    }

    // ----------------------------------------------------------------
    // CREATE CORPORATE REGISTRATION
    // ----------------------------------------------------------------
    async create(dto: CreateCorporateRegistrationDto) {
        this.logger.log(`Creating corporate registration for ${dto.email}`);

        // 1. Validation
        // 1. Validation
        if (!dto.email) {
            throw new BadRequestException('Email is required');
        }
        const email = dto.email.trim();
        const existingUser = await this.userRepo.findOne({ where: { email: email } });
        if (existingUser) {
            this.logger.warn(`Failed to create corporate user: Email '${email}' already exists. UserID: ${existingUser.id}`);
            throw new BadRequestException(`Email '${email}' is already registered (UserID: ${existingUser.id})`);
        }

        // Check Mobile uniqueness in Corporate Account
        const existingMobile = await this.corporateRepo.findOne({
            where: { mobileNumber: dto.mobile, countryCode: dto.countryCode }
        });
        if (existingMobile) {
            throw new BadRequestException('Mobile number already exists for a corporate account');
        }

        // Check Employee Ref ID uniqueness
        if (dto.employeeCode) {
            const existingRef = await this.corporateRepo.findOne({
                where: { employeeRefId: dto.employeeCode }
            });
            if (existingRef) {
                throw new BadRequestException(`Employee Ref ID '${dto.employeeCode}' is already in use.`);
            }
        }

        // 2. Create Cognito User
        let sub: string;
        try {
            const cognitoRes = await this.createCognitoUser(email, dto.password, 'CORPORATE');
            sub = cognitoRes.sub!;
        } catch (e) {
            // Re-throw to handle upstream or display error to user
            throw e;
        }

        // 3. Transaction
        return this.dataSource.transaction(async (manager) => {
            // A. Create User Record
            const user = manager.create(User, {
                email: email,
                role: 'CORPORATE',
                emailVerified: true,
                cognitoSub: sub,
                isActive: dto.status ?? true,
                isBlocked: false,
                metadata: {
                    fullName: dto.name,
                    countryCode: dto.countryCode,
                    mobile: dto.mobile,
                    gender: dto.gender,
                },
            });
            await manager.save(user);

            // B. Create Corporate Account
            const initialCredits = dto.credits ? dto.credits : 0;

            const corporateAccount = manager.create(CorporateAccount, {
                userId: user.id,
                companyName: dto.companyName,
                sectorCode: dto.sector,
                businessLocations: dto.businessLocations,
                jobTitle: dto.jobTitle,
                employeeRefId: dto.employeeCode,
                linkedinUrl: dto.linkedinUrl,
                countryCode: dto.countryCode,
                mobileNumber: dto.mobile,
                gender: dto.gender,
                totalCredits: initialCredits,
                availableCredits: initialCredits,
                isActive: dto.status ?? true,
            });
            await manager.save(corporateAccount);

            // C. Credit Ledger (if credits > 0)
            if (initialCredits > 0) {
                const ledger = manager.create(CorporateCreditLedger, {
                    corporateAccountId: corporateAccount.id,
                    creditDelta: initialCredits,
                    reason: 'Initial allocation during registration',
                    createdByUserId: this.ADMIN_USER_ID,
                });
                await manager.save(ledger);
            }

            // Send Email
            if (dto.sendEmail) {
                try {
                    await this.sendWelcomeEmail(email, dto.name, dto.password, dto.companyName, dto.mobile);
                } catch (e) {
                    this.logger.error(`Failed to send email to ${email}`, e);
                    // Do not fail transaction for email failure? 
                    // Usually best effort.
                }
            }

            return {
                corporateAccountId: corporateAccount.id,
                userId: user.id,
                email: user.email,
            };
        });
    }

    // ---------------------------------------------------------
    // Helper: Send Welcome Email
    // ---------------------------------------------------------
    private async sendWelcomeEmail(to: string, name: string, pass: string, companyName: string, mobile: string) {
        // Dynamic imports for now to avoid refactoring the whole file imports
        const SES = require('aws-sdk/clients/ses');
        const nodemailer = require('nodemailer');

        const ses = new SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        const transporter = nodemailer.createTransport({ SES: ses } as any);
        const ccEmail = process.env.EMAIL_CC || '';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4001';

        const fromName = process.env.EMAIL_SEND_FROM_NAME || 'Origin BI (Corporate)';
        const fromEmail = process.env.EMAIL_FROM || 'no-reply@originbi.com';
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        const assets = {
            popper: `${backendUrl}/test/assets/Popper.png`,
            pattern: `${backendUrl}/test/assets/Pattern_mask.png`,
            footer: `${backendUrl}/test/assets/Email_Vector.png`,
            logo: `${backendUrl}/test/assets/logo.png`,
        };

        const html = getCorporateWelcomeEmailTemplate(name, to, pass, companyName, mobile, frontendUrl, assets);

        const mailOptions = {
            from: fromAddress,
            to,
            cc: ccEmail,
            subject: 'Welcome to OriginBI - Corporate Account Created',
            html: html,
        };
        return transporter.sendMail(mailOptions);
    }
}
