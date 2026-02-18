import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, MoreThanOrEqual, ILike } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

import {
    User as AdminUser,
    AffiliateAccount,
    AffiliateReferralTransaction,
    Registration,
    AffiliateSettlementTransaction,
} from '@originbi/shared-entities';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/create-affiliate.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { R2Service, R2UploadResult } from '../r2/r2.service';
import { getAffiliateWelcomeEmailTemplate } from '../mail/templates/affiliate-welcome.template';

@Injectable()
export class AffiliatesService {
    private readonly logger = new Logger(AffiliatesService.name);
    private authServiceBaseUrl = process.env.AUTH_SERVICE_URL;

    constructor(
        @InjectRepository(AdminUser)
        private readonly userRepo: Repository<AdminUser>,

        @InjectRepository(AffiliateAccount)
        private readonly affiliateRepo: Repository<AffiliateAccount>,

        @InjectRepository(AffiliateReferralTransaction)
        private readonly referralTransactionRepo: Repository<AffiliateReferralTransaction>,

        @InjectRepository(AffiliateSettlementTransaction)
        private readonly settlementTransactionRepo: Repository<AffiliateSettlementTransaction>,

        private readonly dataSource: DataSource,
        private readonly http: HttpService,
        private readonly r2Service: R2Service,
    ) { }

    async updateReadyToProcessStatus() {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        try {
            const result = await this.referralTransactionRepo
                .createQueryBuilder()
                .update(AffiliateReferralTransaction)
                .set({ settlementStatus: 1 })
                .where('settlement_status = 0')
                .andWhere('created_at <= :fortyEightHoursAgo', { fortyEightHoursAgo })
                .execute();
            const affected = result.affected || 0;
            if (affected > 0) {
                this.logger.log(`Updated ${affected} referral transactions to status 1 (Processing)`);
            }
            return { message: 'Ready to payment status refreshed', updated: affected };
        } catch (error: any) {
            this.logger.error(`Error updating referral statuses: ${error.message}`);
            throw new InternalServerErrorException(`Failed to refresh ready to payment status: ${error.message}`);
        }
    }

    private async withRetry<T>(
        operation: () => Promise<T>,
        retries = 5,
        delay = 1000,
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            const isRateLimit =
                error.response?.status === 429 ||
                error.code === 'TooManyRequestsException' ||
                (error.message && error.message.includes('Too Many Requests'));

            if (retries > 0 && isRateLimit) {
                this.logger.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} left)`);
                await new Promise((res) => setTimeout(res, delay));
                return this.withRetry(operation, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    private async createCognitoUser(email: string, password: string, groupName: string = 'AFFILIATE') {
        try {
            const res = await this.withRetry(() =>
                firstValueFrom(
                    this.http.post(`${this.authServiceBaseUrl}/internal/cognito/users`, { email, password, groupName }, { proxy: false })
                )
            );
            return res.data;
        } catch (err: any) {
            const authErr = err.response?.data || err.message || err;
            this.logger.error('Error creating Cognito user:', authErr);
            throw new InternalServerErrorException(`Failed to create Cognito user: ${authErr.message || JSON.stringify(authErr)}`);
        }
    }

    private generateReferralCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }

    private async generateUniqueReferralCode(): Promise<string> {
        let code: string;
        let exists: boolean;
        let attempts = 0;
        do {
            code = this.generateReferralCode();
            const existing = await this.affiliateRepo.findOne({ where: { referralCode: code } });
            exists = !!existing;
            attempts++;
        } while (exists && attempts < 10);
        if (exists) throw new InternalServerErrorException('Unable to generate unique referral code');
        return code;
    }

    async create(dto: CreateAffiliateDto) {
        dto.email = dto.email.toLowerCase();
        const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existingUser) throw new BadRequestException('Email already registered');

        const cognitoRes = await this.createCognitoUser(dto.email, dto.password);
        const sub = cognitoRes.sub!;
        const referralCode = await this.generateUniqueReferralCode();

        try {
            const affiliate = await this.dataSource.transaction(async (manager) => {
                const user = manager.create(AdminUser, {
                    email: dto.email,
                    role: 'AFFILIATE',
                    emailVerified: true,
                    cognitoSub: sub,
                    isActive: true,
                    metadata: { fullName: dto.name, mobile: dto.mobileNumber },
                });
                await manager.save(user);

                const affiliateAccount = manager.create(AffiliateAccount, {
                    userId: user.id,
                    name: dto.name,
                    email: dto.email,
                    countryCode: dto.countryCode ?? '+91',
                    mobileNumber: dto.mobileNumber,
                    address: dto.address ?? null,
                    referralCode,
                    commissionPercentage: dto.commissionPercentage ?? 0,
                    upiId: dto.upiId ?? null,
                    upiNumber: dto.upiNumber ?? null,
                    bankingName: dto.bankingName ?? null,
                    accountNumber: dto.accountNumber ?? null,
                    ifscCode: dto.ifscCode ?? null,
                    branchName: dto.branchName ?? null,
                });
                await manager.save(affiliateAccount);
                return affiliateAccount;
            });

            // Send Welcome Email after successful creation
            try {
                const referralBaseUrl = process.env.REFERAL_BASE_URL || '';
                const fullReferralLink = `${referralBaseUrl}?ref=${referralCode}`;

                // Redirection URL for affiliate login
                const affiliateLoginUrl = 'https://mind.originbi.com/affiliate/login';

                await this.sendWelcomeEmail(
                    dto.email,
                    dto.name,
                    dto.password,
                    dto.mobileNumber,
                    dto.countryCode ?? '+91',
                    dto.commissionPercentage ?? 0,
                    fullReferralLink,
                    affiliateLoginUrl,
                );
                this.logger.log(`Welcome email sent to affiliate: ${dto.email}`);
            } catch (emailErr: any) {
                this.logger.error(`Failed to send welcome email to affiliate ${dto.email}: ${emailErr.message}`, emailErr.stack);
                // Don't fail the creation if email fails
            }

            return affiliate;
        } catch (e: any) {
            throw new BadRequestException(`Affiliate creation failed: ${e.message}`);
        }
    }

    async findAll(page: number, limit: number, search?: string, sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'DESC') {
        try {
            // Auto-refresh 48-hour ready-to-process statuses before fetching
            await this.updateReadyToProcessStatus().catch((err) =>
                this.logger.warn(`Non-critical: Failed to refresh ready-to-process statuses: ${err.message}`)
            );

            const qb = this.affiliateRepo.createQueryBuilder('a').leftJoinAndSelect('a.user', 'u');

            if (search) {
                const s = `%${search.toLowerCase()}%`;
                qb.where('(LOWER(a.name) LIKE :s OR LOWER(a.email) LIKE :s OR LOWER(a.referralCode) LIKE :s)', { s });
            }

            if (sortBy) {
                const sortCols: any = { name: 'a.name', email: 'a.email', referralCount: 'a.referralCount', commissionPercentage: 'a.commissionPercentage' };
                qb.orderBy(sortCols[sortBy] || 'a.createdAt', sortOrder);
            } else {
                qb.orderBy('a.createdAt', 'DESC');
            }

            const total = await qb.getCount();
            const rows = await qb.skip((page - 1) * limit).take(limit).getMany();
            const data = await Promise.all(rows.map((a) => this.formatAffiliate(a)));

            return { data, total, page, limit };
        } catch (error: any) {
            this.logger.error(`findAll Affiliates Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Failed to fetch affiliates: ${error.message}`);
        }
    }

    private async calculateReadyToProcessAmount(affiliateId: number, totalSettledCommission: number): Promise<number> {
        // Calculate ready-to-process amount (settlement_status = 1)
        const readyToProcessRes = await this.referralTransactionRepo
            .createQueryBuilder('t')
            .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
            .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
            .andWhere('t.settlement_status = 1')
            .getRawOne();

        const rawReadyAmount = parseFloat(readyToProcessRes?.sum) || 0;

        // Sum of transactions already officially marked as settled (status = 2)
        const settledTxnSumRes = await this.referralTransactionRepo
            .createQueryBuilder('t')
            .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
            .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
            .andWhere('t.settlement_status = 2')
            .getRawOne();
        const settledTxnSum = parseFloat(settledTxnSumRes?.sum) || 0;

        // Total amount actually paid per account record
        const totalPaid = Number(totalSettledCommission) || 0;

        // Amount paid that hasn't yet exhausted whole transactions into status 2
        const unpaidOverflow = Math.max(0, totalPaid - settledTxnSum);

        // Net Ready to Process = Raw Ready - Overflow Paid
        return Math.max(0, rawReadyAmount - unpaidOverflow);
    }

    async getAdminDashboardStats() {
        try {
            await this.updateReadyToProcessStatus().catch((err) =>
                this.logger.warn(`Non-critical: Failed to refresh ready-to-process statuses: ${err.message}`)
            );

            const affiliates = await this.affiliateRepo.find();

            let totalReadyToPayment = 0;
            const affiliatesWithPayment: any[] = [];

            // We can optimize this with a single complex query if performance becomes an issue
            // For now, consistent logic via helper is preferred
            for (const a of affiliates) {
                const amount = await this.calculateReadyToProcessAmount(a.id, Number(a.totalSettledCommission) || 0);
                if (amount > 0) {
                    totalReadyToPayment += amount;
                    affiliatesWithPayment.push({
                        id: a.id,
                        name: a.name,
                        email: a.email,
                        countryCode: a.countryCode || '+91',
                        mobileNumber: a.mobileNumber,
                        amount: amount,
                        upiId: a.upiId,
                        bankName: a.bankingName
                    });
                }
            }

            // Sort descending by amount
            affiliatesWithPayment.sort((a, b) => b.amount - a.amount);

            return {
                totalReadyToPayment,
                affiliates: affiliatesWithPayment
            };
        } catch (error: any) {
            this.logger.error(`Error getting admin dashboard stats: ${error.message}`);
            throw new InternalServerErrorException('Failed to get dashboard stats');
        }
    }

    private async formatAffiliate(a: AffiliateAccount) {
        // Generate presigned URLs for Aadhar documents
        const aadharWithSignedUrls = await Promise.all(
            (a.aadharDocuments || []).map(async (doc) => ({
                ...doc,
                url: await this.r2Service.getPresignedUrl(doc.key).catch(() => doc.url),
            }))
        );

        // Generate presigned URLs for PAN documents
        const panWithSignedUrls = await Promise.all(
            (a.panDocuments || []).map(async (doc) => ({
                ...doc,
                url: await this.r2Service.getPresignedUrl(doc.key).catch(() => doc.url),
            }))
        );

        const readyToProcessAmount = await this.calculateReadyToProcessAmount(a.id, Number(a.totalSettledCommission) || 0);

        // Fetch settlement history
        const settlements = await this.settlementTransactionRepo.find({
            where: { affiliateAccountId: a.id },
            order: { createdAt: 'DESC' } as any
        });

        return {
            id: a.id,
            user_id: a.userId,
            name: a.name || 'N/A',
            email: a.email || a.user?.email || 'N/A',
            country_code: a.countryCode || '+91',
            mobile_number: a.mobileNumber || '',
            address: a.address,
            referral_code: a.referralCode,
            referral_count: Number(a.referralCount) || 0,
            commission_percentage: Number(a.commissionPercentage) || 0,
            total_earned_commission: Number(a.totalEarnedCommission) || 0,
            total_settled_commission: Number(a.totalSettledCommission) || 0,
            total_pending_commission: Number(a.totalPendingCommission) || 0,
            ready_to_process_commission: readyToProcessAmount,
            upi_id: a.upiId,
            upi_number: a.upiNumber,
            banking_name: a.bankingName,
            account_number: a.accountNumber,
            ifsc_code: a.ifscCode,
            branch_name: a.branchName,
            aadhar_documents: aadharWithSignedUrls,
            pan_documents: panWithSignedUrls,
            settlements: settlements,
            is_active: a.isActive,
            created_at: a.createdAt,
            updated_at: a.updatedAt,
        };
    }

    async findById(id: number) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id }, relations: ['user'] });
        if (!affiliate) throw new BadRequestException('Affiliate not found');
        return await this.formatAffiliate(affiliate);
    }

    async update(id: number, dto: UpdateAffiliateDto) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        Object.assign(affiliate, dto);
        return this.affiliateRepo.save(affiliate);
    }

    async findByReferralCode(code: string) {
        return this.affiliateRepo.findOne({ where: { referralCode: code, isActive: true } });
    }

    async incrementReferralCount(referralCode: string) {
        const affiliate = await this.affiliateRepo.findOne({ where: { referralCode } });
        if (affiliate) {
            affiliate.referralCount += 1;
            await this.affiliateRepo.save(affiliate);
        }
    }

    async uploadDocuments(affiliateId: number, aadharFiles: any[], panFiles: any[]) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        let aadharResults: R2UploadResult[] = [];
        if (aadharFiles.length > 0) {
            aadharResults = await this.r2Service.uploadMultipleFiles(aadharFiles, affiliate.referralCode, 'aadhar');
        }

        let panResults: R2UploadResult[] = [];
        if (panFiles.length > 0) {
            panResults = await this.r2Service.uploadMultipleFiles(panFiles, affiliate.referralCode, 'pan');
        }

        affiliate.aadharDocuments = [...(affiliate.aadharDocuments || []), ...aadharResults].slice(0, 5);
        affiliate.panDocuments = [...(affiliate.panDocuments || []), ...panResults].slice(0, 5);

        await this.affiliateRepo.save(affiliate);

        return { message: 'Documents uploaded successfully', aadharDocuments: affiliate.aadharDocuments, panDocuments: affiliate.panDocuments };
    }

    // ---------------------------------------------------------
    // Helper: Send Welcome Email to Affiliate
    // ---------------------------------------------------------
    private async sendWelcomeEmail(
        to: string,
        name: string,
        pass: string,
        mobile: string,
        countryCode: string,
        commissionPercentage: number,
        referralLink: string,
        loginUrl: string,
    ) {
        const ses = new AWS.SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
            region: process.env.AWS_REGION,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const transporter = nodemailer.createTransport({
            SES: ses,
        } as any);

        const ccEmail = process.env.EMAIL_CC || '';
        const frontendUrl = process.env.FRONTEND_URL ?? '';
        const backendUrl = process.env.BACKEND_URL ?? '';

        const fromName = process.env.EMAIL_SEND_FROM_NAME || 'Origin BI (Affiliate)';
        const fromEmail = process.env.EMAIL_FROM || 'no-reply@originbi.com';
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        const assets = {
            popper: `${backendUrl}/assets/Popper.png`,
            pattern: `${backendUrl}/assets/Pattern_mask.png`,
            footer: `${backendUrl}/assets/Email_Vector.png`,
            logo: `${backendUrl}/assets/logo.png`,
        };

        const html = getAffiliateWelcomeEmailTemplate(
            name,
            to,
            pass,
            mobile,
            countryCode,
            commissionPercentage,
            referralLink,
            loginUrl,
            assets,
        );

        const mailOptions = {
            from: fromAddress,
            to,
            cc: ccEmail,
            subject: 'Welcome to OriginBI - Affiliate Partner Account Created',
            html: html,
        };

        return transporter.sendMail(mailOptions);
    }

    // ---------------------------------------------------------
    // Preview Settlement — shows which transactions will be settled
    // ---------------------------------------------------------
    async previewSettlement(affiliateId: number, amount: number) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        const processingTransactions = await this.referralTransactionRepo
            .createQueryBuilder('t')
            .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
            .andWhere('t.settlement_status = 1')
            .orderBy('t.created_at', 'ASC')
            .getMany();

        // Calculate current unpaid overflow (amount paid but not yet enough to clear a transaction)
        const settledTxnSumRes = await this.referralTransactionRepo
            .createQueryBuilder('t')
            .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
            .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
            .andWhere('t.settlement_status = 2')
            .getRawOne();
        const settledTxnSum = parseFloat(settledTxnSumRes?.sum) || 0;
        const currentUnpaidOverflow = Math.max(0, (Number(affiliate.totalSettledCommission) || 0) - settledTxnSum);

        let pool = currentUnpaidOverflow + amount;
        let fullySettledCount = 0;
        const transactionBreakdown: Array<{
            id: number; studentName: string; amount: number;
            coveredAmount: number; remainingAmount: number;
            status: 'fully_settled' | 'partial' | 'not_settled';
        }> = [];
        const cumulativeBoundaries: number[] = [];
        let runningTotal = 0;

        for (const txn of processingTransactions) {
            const txnAmount = parseFloat(String(txn.earnedCommissionAmount)) || 0;
            runningTotal += txnAmount;

            // Boundary is the amount needed from ENTERED amount to settle this
            // neededAmount = total_needed_for_this_and_previous - existing_overflow
            const boundary = Math.max(0, runningTotal - currentUnpaidOverflow);
            if (boundary > 0) cumulativeBoundaries.push(boundary);

            let status: 'fully_settled' | 'partial' | 'not_settled' = 'not_settled';
            let coveredAmount = 0;

            if (pool >= txnAmount) {
                status = 'fully_settled';
                coveredAmount = txnAmount;
                pool -= txnAmount;
                fullySettledCount++;
            } else if (pool > 0) {
                status = 'partial';
                coveredAmount = pool;
                pool = 0;
            }

            transactionBreakdown.push({
                id: Number(txn.id),
                studentName: txn.metadata?.studentName || 'Unknown',
                amount: txnAmount,
                coveredAmount: Math.round(coveredAmount * 100) / 100,
                remainingAmount: Math.round((txnAmount - coveredAmount) * 100) / 100,
                status,
            });
        }

        let suggestedLower: number | null = null;
        let suggestedUpper: number | null = null;
        for (const b of cumulativeBoundaries) {
            if (b <= amount + 0.01) suggestedLower = b;
            if (b >= amount - 0.01 && suggestedUpper === null) suggestedUpper = b;
        }

        if (suggestedLower !== null && Math.abs(suggestedLower - amount) < 0.01) suggestedLower = null;
        if (suggestedUpper !== null && Math.abs(suggestedUpper - amount) < 0.01) suggestedUpper = null;

        return {
            fullySettledCount,
            isCleanBoundary: cumulativeBoundaries.some(b => Math.abs(b - amount) < 0.01),
            transactions: transactionBreakdown,
            suggestedLower: suggestedLower ? Math.round(suggestedLower * 100) / 100 : null,
            suggestedUpper: suggestedUpper ? Math.round(suggestedUpper * 100) / 100 : null,
        };
    }

    // =================================================================
    // Portal Methods (called by AffiliatePortalController)
    // =================================================================

    async getDashboardStats(affiliateId: number) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        // Count referrals from affiliate_referral_transactions
        const totalReferrals = await this.referralTransactionRepo.count({
            where: { affiliateAccountId: affiliateId },
        });

        const totalEarned = Number(affiliate.totalEarnedCommission) || 0;
        const totalSettled = Number(affiliate.totalSettledCommission) || 0;
        const totalPending = Number(affiliate.totalPendingCommission) || 0;

        // Active referrals in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeReferrals = await this.referralTransactionRepo.count({
            where: { affiliateAccountId: affiliateId, createdAt: MoreThanOrEqual(thirtyDaysAgo) },
        });

        // Completed (settled) referrals
        const completedReferrals = await this.referralTransactionRepo.count({
            where: { affiliateAccountId: affiliateId, settlementStatus: 2 as any },
        });

        // This month earnings
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const thisMonthRes = await this.referralTransactionRepo
            .createQueryBuilder('t')
            .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
            .where('t.affiliate_account_id = :affiliateId', { affiliateId })
            .andWhere('t.created_at BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
            .getRawOne();
        const thisMonthEarnings = parseFloat(thisMonthRes?.sum) || 0;

        // Conversion rate: (settled / total) * 100
        const conversionRate = totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0;

        return {
            totalReferrals,
            activeReferrals,
            completedReferrals,
            totalEarnings: totalEarned,
            pendingEarnings: totalPending,
            thisMonthEarnings,
            conversionRate,
            totalClicks: totalReferrals,
            totalSettled,
            commissionPercentage: Number(affiliate.commissionPercentage) || 0,
            referralCode: affiliate.referralCode,
            trends: {
                referrals: 0,
                earnings: 0,
            },
        };
    }

    async getRecentReferrals(affiliateId: number, limit: number) {
        // Query affiliate_referral_transactions joined with registration data
        const transactions = await this.referralTransactionRepo.find({
            where: { affiliateAccountId: affiliateId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['registration', 'registration.user'],
        });

        return transactions.map((t) => {
            const reg = t.registration as any;
            const studentName = reg?.fullName || reg?.user?.email?.split('@')[0] || 'N/A';
            const studentEmail = reg?.user?.email || 'N/A';
            const settledDown: string = t.settlementStatus === 2 ? 'Completed' : 'Incomplete';
            return {
                id: t.id,
                name: studentName,
                email: studentEmail,
                signUpDate: t.createdAt,
                status: t.settlementStatus === 2 ? 'converted' : t.settlementStatus === 1 ? 'active' : 'pending',
                commission: Number(t.earnedCommissionAmount) || 0,
                settledDown,
                registrationAmount: Number(t.registrationAmount) || 0,
                commissionPercentage: Number(t.commissionPercentage) || 0,
                schoolLevel: reg?.schoolLevel || '—',
                schoolStream: reg?.schoolStream || '—',
                paymentStatus: reg?.paymentStatus || 'N/A',
            };
        });
    }

    async getReferralsPage(
        affiliateId: number, page: number, limit: number, status?: string, search?: string,
    ) {
        // Build where conditions for findAndCount (avoids queryBuilder metadata issues)
        const where: any[] = [];
        const baseWhere: any = { affiliateAccountId: affiliateId };

        // Map frontend filter values to settlement_status
        if (status !== undefined && status !== '' && status !== 'all') {
            if (status === 'pending') {
                // pending = status 0 or 1 — need two where clauses ORed
                where.push({ ...baseWhere, settlementStatus: 0 });
                where.push({ ...baseWhere, settlementStatus: 1 });
            } else if (status === 'converted') {
                where.push({ ...baseWhere, settlementStatus: 2 });
            } else {
                where.push({ ...baseWhere, settlementStatus: Number(status) });
            }
        }

        const finalWhere = where.length > 0 ? where : baseWhere;

        const [rows, total] = await this.referralTransactionRepo.findAndCount({
            where: finalWhere,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['registration', 'registration.user'],
        });

        // If search is provided, do a post-filter (for small result sets this is fine;
        // for large datasets, a raw SQL query would be more efficient)
        let filteredRows = rows;
        let filteredTotal = total;
        if (search) {
            const s = search.toLowerCase();
            // Re-query all matching transactions for accurate counts when searching
            const [allRows, allTotal] = await this.referralTransactionRepo.findAndCount({
                where: finalWhere,
                relations: ['registration', 'registration.user'],
            });
            const matched = allRows.filter((t) => {
                const reg = t.registration as any;
                const name = (reg?.fullName || '').toLowerCase();
                const email = (reg?.user?.email || '').toLowerCase();
                return name.includes(s) || email.includes(s);
            });
            filteredTotal = matched.length;
            filteredRows = matched.slice((page - 1) * limit, page * limit);
        }

        // Summary stats for cards
        const allCount = await this.referralTransactionRepo.count({ where: { affiliateAccountId: affiliateId } });
        const pendingCount = await this.referralTransactionRepo.count({ where: { affiliateAccountId: affiliateId, settlementStatus: 0 as any } })
            + await this.referralTransactionRepo.count({ where: { affiliateAccountId: affiliateId, settlementStatus: 1 as any } });
        const completedCount = await this.referralTransactionRepo.count({ where: { affiliateAccountId: affiliateId, settlementStatus: 2 as any } });

        const data = filteredRows.map((t) => {
            const reg = t.registration as any;
            return {
                id: t.id,
                name: reg?.fullName || reg?.user?.email?.split('@')[0] || 'N/A',
                email: reg?.user?.email || 'N/A',
                registeredOn: t.createdAt,
                studentBoard: (reg?.metadata as any)?.board || (reg?.metadata as any)?.studentBoard || '—',
                schoolLevel: reg?.schoolLevel || '—',
                schoolStream: reg?.schoolStream || '—',
                commissionPercentage: Number(t.commissionPercentage) || 0,
                totalEarnedCommission: Number(t.earnedCommissionAmount) || 0,
                status: t.settlementStatus === 2 ? 'converted' : 'pending',
                paymentStatus: reg?.paymentStatus || 'N/A',
                paymentAmount: Number(reg?.paymentAmount) || 0,
            };
        });

        return {
            data,
            total: filteredTotal,
            page,
            limit,
            stats: { totalReferrals: allCount, completedCount, pendingCount },
        };
    }

    async getEarningsStats(affiliateId: number) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        // settled sum from settlement transactions
        const settledRes = await this.settlementTransactionRepo
            .createQueryBuilder('s')
            .select('SUM(CAST(s.settle_amount AS NUMERIC))', 'sum')
            .where('s.affiliate_account_id = :affiliateId', { affiliateId })
            .getRawOne();

        return {
            totalEarned: Number(affiliate.totalEarnedCommission) || 0,
            totalSettled: parseFloat(settledRes?.sum) || Number(affiliate.totalSettledCommission) || 0,
            totalPending: Number(affiliate.totalPendingCommission) || 0,
            commissionPercentage: Number(affiliate.commissionPercentage) || 0,
        };
    }

    async getEarningsChart(affiliateId: number) {
        const months: { label: string; earned: number; pending: number }[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

            const earnedRes = await this.referralTransactionRepo
                .createQueryBuilder('t')
                .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
                .where('t.affiliate_account_id = :affiliateId', { affiliateId })
                .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
                .getRawOne();

            // pending = earned that month that hasn't been settled yet (status 0 or 1)
            const pendingRes = await this.referralTransactionRepo
                .createQueryBuilder('t')
                .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
                .where('t.affiliate_account_id = :affiliateId', { affiliateId })
                .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
                .andWhere('t.settlement_status IN (0, 1)')
                .getRawOne();

            months.push({
                label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                earned: parseFloat(earnedRes?.sum) || 0,
                pending: parseFloat(pendingRes?.sum) || 0,
            });
        }

        return months;
    }

    async getEarningsHistory(affiliateId: number, page: number, limit: number) {
        // Show commission transactions from affiliate_referral_transactions
        const [rows, total] = await this.referralTransactionRepo.findAndCount({
            where: { affiliateAccountId: affiliateId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['registration', 'registration.user'],
        });

        const data = rows.map((t) => {
            const reg = t.registration as any;
            const studentName = reg?.fullName || reg?.user?.email?.split('@')[0] || 'N/A';
            const statusMap: Record<number, string> = { 0: 'Pending', 1: 'Processing', 2: 'Settled' };

            return {
                id: t.id,
                date: t.createdAt,
                description: `Commission — ${studentName}`,
                paymentMode: 'Referral Commission',
                amount: Number(t.earnedCommissionAmount) || 0,
                registrationAmount: Number(t.registrationAmount) || 0,
                commissionPercentage: Number(t.commissionPercentage) || 0,
                type: 'commission',
                status: statusMap[t.settlementStatus] || 'Pending',
                settlementStatus: t.settlementStatus,
                paymentAt: t.paymentAt,
            };
        });

        return { data, total, page, limit };
    }

    async getProfileWithStats(affiliateId: number) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId }, relations: ['user'] });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        return {
            id: affiliate.id,
            user_id: affiliate.userId,
            name: affiliate.name,
            email: affiliate.email,
            // camelCase (for components that use camelCase)
            countryCode: affiliate.countryCode,
            mobileNumber: affiliate.mobileNumber,
            referralCode: affiliate.referralCode,
            commissionPercentage: Number(affiliate.commissionPercentage) || 0,
            bankingName: affiliate.bankingName,
            accountNumber: affiliate.accountNumber,
            ifscCode: affiliate.ifscCode,
            branchName: affiliate.branchName,
            upiId: affiliate.upiId,
            upiNumber: affiliate.upiNumber,
            // snake_case (for Settings/Profile pages that use snake_case)
            country_code: affiliate.countryCode,
            mobile_number: affiliate.mobileNumber,
            address: affiliate.address,
            referral_code: affiliate.referralCode,
            referral_count: Number(affiliate.referralCount) || 0,
            commission_percentage: Number(affiliate.commissionPercentage) || 0,
            total_earned_commission: Number(affiliate.totalEarnedCommission) || 0,
            total_settled_commission: Number(affiliate.totalSettledCommission) || 0,
            total_pending_commission: Number(affiliate.totalPendingCommission) || 0,
            banking_name: affiliate.bankingName,
            account_number: affiliate.accountNumber,
            ifsc_code: affiliate.ifscCode,
            branch_name: affiliate.branchName,
            upi_id: affiliate.upiId,
            upi_number: affiliate.upiNumber,
            is_active: affiliate.isActive,
            created_at: affiliate.createdAt,
        };
    }

    async updateProfile(affiliateId: number, dto: { name?: string; mobileNumber?: string; countryCode?: string; address?: string }) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        if (dto.name !== undefined) affiliate.name = dto.name;
        if (dto.mobileNumber !== undefined) affiliate.mobileNumber = dto.mobileNumber;
        if (dto.countryCode !== undefined) affiliate.countryCode = dto.countryCode;
        if (dto.address !== undefined) affiliate.address = dto.address;

        await this.affiliateRepo.save(affiliate);
        return { message: 'Profile updated successfully' };
    }

    async updatePayoutSettings(
        affiliateId: number,
        dto: { bankingName?: string; accountNumber?: string; ifscCode?: string; branchName?: string; upiId?: string; upiNumber?: string },
    ) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        if (dto.bankingName !== undefined) affiliate.bankingName = dto.bankingName;
        if (dto.accountNumber !== undefined) affiliate.accountNumber = dto.accountNumber;
        if (dto.ifscCode !== undefined) affiliate.ifscCode = dto.ifscCode;
        if (dto.branchName !== undefined) affiliate.branchName = dto.branchName;
        if (dto.upiId !== undefined) affiliate.upiId = dto.upiId;
        if (dto.upiNumber !== undefined) affiliate.upiNumber = dto.upiNumber;

        await this.affiliateRepo.save(affiliate);
        return { message: 'Payout settings updated successfully' };
    }

    async changePassword(affiliateId: number, dto: { currentPassword: string; newPassword: string }) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId }, relations: ['user'] });
        if (!affiliate || !affiliate.user) throw new BadRequestException('Affiliate not found');

        try {
            const res = await firstValueFrom(
                this.http.post(
                    `${this.authServiceBaseUrl}/internal/cognito/change-password`,
                    { email: affiliate.email, currentPassword: dto.currentPassword, newPassword: dto.newPassword },
                    { proxy: false },
                ),
            );
            return { message: 'Password changed successfully' };
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            throw new BadRequestException(`Password change failed: ${msg}`);
        }
    }

    // =================================================================
    // Admin Settlement Method (called by AffiliatesController)
    // =================================================================

    async settleAffiliate(affiliateId: number, dto: CreateSettlementDto) {
        const affiliate = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        try {
            return await this.dataSource.transaction(async (manager) => {
                // Create settlement transaction record
                const settlement = manager.create(AffiliateSettlementTransaction, {
                    affiliateAccountId: affiliateId,
                    settleAmount: dto.settleAmount,
                    transactionMode: dto.transactionMode,
                    settlementTransactionId: dto.transactionId,
                    paymentDate: new Date(dto.paymentDate),
                    metadata: {
                        earnedAsOfSettlement: Number(affiliate.totalEarnedCommission) || 0,
                        pendingAsOfSettlement: Number(affiliate.totalPendingCommission) || 0,
                        settledAsOfSettlement: Number(affiliate.totalSettledCommission) || 0,
                    },
                });
                await manager.save(settlement);

                // 2. Update referral transactions: mark as settled (status = 2)
                // We calculate how much "unpaid overflow" exists from previous partial settlements
                const settledTxnSumRes = await manager
                    .getRepository(AffiliateReferralTransaction)
                    .createQueryBuilder('t')
                    .select('SUM(CAST(t.earned_commission_amount AS NUMERIC))', 'sum')
                    .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
                    .andWhere('t.settlement_status = 2')
                    .getRawOne();
                const settledTxnSum = parseFloat(settledTxnSumRes?.sum) || 0;

                // Overflow available to clear new transactions = (Already Settled - Already officially marked status 2) + New Settle Amount
                const currentUnpaidOverflow = Math.max(0, (Number(affiliate.totalSettledCommission) || 0) - settledTxnSum);
                let remainingAmountForStatusUpdate = currentUnpaidOverflow + dto.settleAmount;

                // Get all processing transactions ordered by oldest first
                const processingTransactions = await manager
                    .getRepository(AffiliateReferralTransaction)
                    .createQueryBuilder('t')
                    .where('t.affiliate_account_id = :affiliateAccountId', { affiliateAccountId: affiliateId })
                    .andWhere('t.settlement_status = 1')
                    .orderBy('t.created_at', 'ASC')
                    .getMany();

                const idsToSettle: number[] = [];

                for (const txn of processingTransactions) {
                    if (remainingAmountForStatusUpdate <= 0) break;
                    const txnAmount = parseFloat(String(txn.earnedCommissionAmount)) || 0;

                    // Using a small epsilon or rounding to handle potential precision floating point issues
                    if (txnAmount <= remainingAmountForStatusUpdate + 0.01) {
                        idsToSettle.push(Number(txn.id));
                        remainingAmountForStatusUpdate -= txnAmount;
                    } else {
                        // We settle in strict chronological order
                        break;
                    }
                }

                if (idsToSettle.length > 0) {
                    await manager
                        .getRepository(AffiliateReferralTransaction)
                        .createQueryBuilder()
                        .update(AffiliateReferralTransaction)
                        .set({ settlementStatus: 2, paymentAt: new Date(dto.paymentDate) })
                        .whereInIds(idsToSettle)
                        .execute();
                }

                // 3. Update affiliate account totals
                affiliate.totalSettledCommission =
                    Number(affiliate.totalSettledCommission || 0) + dto.settleAmount;
                affiliate.totalPendingCommission =
                    Number(affiliate.totalPendingCommission || 0) - dto.settleAmount;
                await manager.save(affiliate);

                return {
                    message: 'Settlement completed successfully',
                    settlement: {
                        id: settlement.id,
                        settleAmount: settlement.settleAmount,
                        transactionMode: settlement.transactionMode,
                        transactionId: settlement.settlementTransactionId,
                        paymentDate: settlement.paymentDate,
                        transactionsSettled: idsToSettle.length,
                    },
                };
            });
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error(`Settlement failed for affiliate ${affiliateId}: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Settlement failed: ${error.message}`);
        }
    }
}
