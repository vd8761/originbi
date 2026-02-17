import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

import {
    User as AdminUser,
    AffiliateAccount,
    AffiliateReferralTransaction,
    Registration,
} from '@originbi/shared-entities';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/create-affiliate.dto';
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
        private readonly transactionRepo: Repository<AffiliateReferralTransaction>,

        private readonly dataSource: DataSource,
        private readonly http: HttpService,
        private readonly r2Service: R2Service,
    ) { }

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
            upi_id: a.upiId,
            upi_number: a.upiNumber,
            banking_name: a.bankingName,
            account_number: a.accountNumber,
            ifsc_code: a.ifscCode,
            branch_name: a.branchName,
            aadhar_documents: aadharWithSignedUrls,
            pan_documents: panWithSignedUrls,
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
    // Affiliate Portal Methods (Dashboard & Earnings)
    // ---------------------------------------------------------

    async getDashboardStats(affiliateId: number) {
        // 1. Fetch affiliate account — direct fields
        const account = await this.affiliateRepo.findOne({
            where: { id: affiliateId },
        });

        if (!account) {
            return {
                totalEarnings: 0,
                pendingEarnings: 0,
                activeReferrals: 0,
                thisMonthEarnings: 0,
                conversionRate: 0,
                trends: { earnings: 0, referrals: 0 }
            };
        }

        // Dates for Month-over-Month comparison
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // 2. Earnings (This Month vs Last Month)
        const { thisMonthEarnings } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'thisMonthEarnings')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.createdAt >= :start', { start: startOfThisMonth })
            .getRawOne();

        const { lastMonthEarnings } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'lastMonthEarnings')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.createdAt >= :start AND t.createdAt <= :end', { start: startOfLastMonth, end: endOfLastMonth })
            .getRawOne();

        const currentEarnings = Number(thisMonthEarnings) || 0;
        const previousEarnings = Number(lastMonthEarnings) || 0;
        const earningsTrend = previousEarnings === 0 ? (currentEarnings > 0 ? 100 : 0) : Math.round(((currentEarnings - previousEarnings) / previousEarnings) * 100);

        // 3. Referrals Trend (This Month vs Last Month)
        // We track 'referrals' via transactions creation (or registration creation via relation)
        // Using transactions is easier as it's the main link
        const thisMonthReferrals = await this.transactionRepo.count({
            where: {
                affiliateAccountId: affiliateId,
                createdAt: Between(startOfThisMonth.toISOString(), now.toISOString()) as any
            }
        });

        const lastMonthReferrals = await this.transactionRepo.count({
            where: {
                affiliateAccountId: affiliateId,
                createdAt: Between(startOfLastMonth.toISOString(), endOfLastMonth.toISOString()) as any
            }
        });

        const referralsTrend = lastMonthReferrals === 0 ? (thisMonthReferrals > 0 ? 100 : 0) : Math.round(((thisMonthReferrals - lastMonthReferrals) / lastMonthReferrals) * 100);

        // 4. Conversion Rate
        const totalCount = await this.transactionRepo.count({
            where: { affiliateAccountId: affiliateId },
        });

        const settledCount = await this.transactionRepo.count({
            where: { affiliateAccountId: affiliateId, settlementStatus: 2 },
        });

        const conversionRate = totalCount > 0
            ? Math.round((settledCount / totalCount) * 100)
            : 0;

        // 5. Calculate Totals Live (to ensure accuracy)
        const { totalEarnedLive } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalEarnedLive')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .getRawOne();

        const { totalPendingLive } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalPendingLive')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.settlementStatus = :status', { status: 0 })
            .getRawOne();


        return {
            totalEarnings: Number(totalEarnedLive) || 0,
            pendingEarnings: Number(totalPendingLive) || 0,
            activeReferrals: Number(account.referralCount) || 0,
            thisMonthEarnings: currentEarnings,
            conversionRate,
            trends: {
                earnings: earningsTrend,
                referrals: referralsTrend
            }
        };
    }

    /**
     * Profile endpoint: returns affiliate account details + live transaction stats
     * Data from both affiliate_accounts AND affiliate_referral_transactions tables
     */
    async getProfileWithStats(affiliateId: number) {
        // 1. Get affiliate account info (from affiliate_accounts)
        const affiliate = await this.affiliateRepo.findOne({
            where: { id: affiliateId },
            relations: ['user'],
        });
        if (!affiliate) throw new BadRequestException('Affiliate not found');

        // 2. Get live transaction stats (from affiliate_referral_transactions)
        const { totalEarned } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalEarned')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .getRawOne();

        // Settled (settlement_status = 2)
        const { totalSettled } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalSettled')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.settlementStatus = :status', { status: 2 })
            .getRawOne();

        // Pending (settlement_status = 0)
        const { totalPending } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalPending')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.settlementStatus = :status', { status: 0 })
            .getRawOne();

        const referralCount = await this.transactionRepo.count({
            where: { affiliateAccountId: affiliateId },
        });

        // 3. Get recent transactions for activity context
        const recentTransactions = await this.transactionRepo.find({
            where: { affiliateAccountId: affiliateId },
            order: { createdAt: 'DESC' },
            take: 5,
            relations: ['registration'],
        });

        return {
            // From affiliate_accounts table
            id: affiliate.id,
            user_id: affiliate.userId,
            name: affiliate.name,
            email: affiliate.email,
            country_code: affiliate.countryCode,
            mobile_number: affiliate.mobileNumber,
            address: affiliate.address,
            referral_code: affiliate.referralCode,
            commission_percentage: Number(affiliate.commissionPercentage),
            upi_id: affiliate.upiId,
            upi_number: affiliate.upiNumber,
            banking_name: affiliate.bankingName,
            account_number: affiliate.accountNumber,
            ifsc_code: affiliate.ifscCode,
            branch_name: affiliate.branchName,
            is_active: affiliate.isActive,
            created_at: affiliate.createdAt,
            updated_at: affiliate.updatedAt,

            // From affiliate_referral_transactions table (live computed)
            referral_count: referralCount,
            total_earned_commission: Number(totalEarned) || 0,
            total_settled_commission: Number(totalSettled) || 0,
            total_pending_commission: Number(totalPending) || 0,

            // Recent activity (from transactions table)
            recent_transactions: recentTransactions.map(t => ({
                id: t.id,
                settlement_status: t.settlementStatus,
                amount: Number(t.earnedCommissionAmount),
                date: t.createdAt,
                payment_at: t.paymentAt,
                registration_id: t.registrationId,
                metadata: t.metadata,
            })),
        };
    }

    async getRecentReferrals(affiliateId: number, limit = 10) {
        const transactions = await this.transactionRepo.find({
            where: { affiliateAccountId: affiliateId },
            relations: ['registration', 'registration.user'],
            order: { createdAt: 'DESC' },
            take: limit
        });

        return transactions.map(t => ({
            id: t.id.toString(),
            name: t.metadata?.orgName || t.registration?.fullName || 'Unknown',
            email: t.registration?.user?.email || (t.metadata as any)?.studentEmail || (t.registration?.metadata as any)?.email || 'N/A',
            status: t.settlementStatus === 2 ? 'converted' : 'active',
            signUpDate: t.createdAt,
            commission: Number(t.earnedCommissionAmount),
            settledDown: t.settlementStatus === 2 ? 'Completed' : t.settlementStatus === 1 ? 'Processing' : 'Incomplete'
        }));
    }

    async getEarningsHistory(affiliateId: number, page = 1, limit = 10) {
        const [transactions, total] = await this.transactionRepo.findAndCount({
            where: { affiliateAccountId: affiliateId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            data: transactions.map(t => ({
                id: t.id.toString(),
                date: t.createdAt,
                description: `Commission - ${t.metadata?.planName || 'Referral'}`,
                paymentMode: t.settlementStatus === 2 ? 'Bank Transfer' : 'Pending',
                amount: Number(t.earnedCommissionAmount),
                settlement_status: t.settlementStatus,
                payment_at: t.paymentAt,
            })),
            total,
            page,
            limit
        };
    }

    // ---------------------------------------------------------
    // Referrals Page — cards + full table
    // ---------------------------------------------------------
    async getReferralsPage(affiliateId: number, page = 1, limit = 10, status?: string, search?: string) {
        // Get affiliate account for referral_count
        const account = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        const totalReferrals = account ? Number(account.referralCount) : 0;

        // Build query
        const qb = this.transactionRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.registration', 'r')
            .leftJoinAndSelect('r.user', 'u')
            .where('t.affiliateAccountId = :id', { id: affiliateId });

        // Status filter
        if (status === 'converted') {
            qb.andWhere('r.assessmentSessionId IS NOT NULL');
        } else if (status === 'pending') {
            qb.andWhere('(r.assessmentSessionId IS NULL)');
        }

        // Search filter
        if (search) {
            qb.andWhere('(r.fullName ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
        }

        qb.orderBy('t.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [transactions, total] = await qb.getManyAndCount();

        // Completed = has assessmentSessionId, Pending = no assessmentSessionId
        const completedCount = await this.transactionRepo
            .createQueryBuilder('t')
            .leftJoin('t.registration', 'r')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('r.assessmentSessionId IS NOT NULL')
            .getCount();

        const pendingCount = await this.transactionRepo
            .createQueryBuilder('t')
            .leftJoin('t.registration', 'r')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('(r.assessmentSessionId IS NULL)')
            .getCount();

        return {
            stats: {
                totalReferrals,
                completedCount,
                pendingCount,
            },
            data: transactions.map(t => ({
                id: t.id.toString(),
                name: t.registration?.fullName || 'Unknown',
                email: t.registration?.user?.email || (t.registration?.metadata as any)?.email || 'N/A',
                status: t.registration?.assessmentSessionId ? 'converted' : 'pending',
                registeredOn: t.createdAt,
                studentBoard: t.registration?.metadata?.board || 'N/A',
                schoolLevel: t.registration?.schoolLevel || 'N/A',
                schoolStream: t.registration?.schoolStream || 'N/A',
                commissionPercentage: Number(t.commissionPercentage),
                totalEarnedCommission: Number(t.earnedCommissionAmount),
            })),
            total,
            page,
            limit,
        };
    }

    // ---------------------------------------------------------
    // Earnings Page — Stats Cards
    // ---------------------------------------------------------
    async getEarningsStats(affiliateId: number) {
        const account = await this.affiliateRepo.findOne({ where: { id: affiliateId } });
        if (!account) {
            return { totalEarned: 0, totalPending: 0, totalSettled: 0 };
        }

        // Compute totalSettled live
        const { totalSettled } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalSettled')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.settlementStatus = :status', { status: 2 })
            .getRawOne();

        // Compute totalEarned live (All commissions)
        const { totalEarned } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalEarned')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .getRawOne();

        // Compute totalPending live (Status 0)
        const { totalPending } = await this.transactionRepo
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'totalPending')
            .where('t.affiliateAccountId = :id', { id: affiliateId })
            .andWhere('t.settlementStatus = :status', { status: 0 })
            .getRawOne();

        return {
            totalEarned: Number(totalEarned) || 0,
            totalPending: Number(totalPending) || 0,
            totalSettled: Number(totalSettled) || 0,
        };
    }

    // ---------------------------------------------------------
    // Earnings Page — Chart (last 12 months)
    // ---------------------------------------------------------
    async getEarningsChart(affiliateId: number) {
        const months: { label: string; earned: number; pending: number }[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const label = d.toLocaleString('en-US', { month: 'short' });

            // Earned total for that month
            const { earned } = await this.transactionRepo
                .createQueryBuilder('t')
                .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'earned')
                .where('t.affiliateAccountId = :id', { id: affiliateId })
                .andWhere('t.createdAt >= :start AND t.createdAt < :end', { start, end })
                .getRawOne();

            // Pending (settlement_status = 0) for that month
            const { pending } = await this.transactionRepo
                .createQueryBuilder('t')
                .select('COALESCE(SUM(t.earnedCommissionAmount), 0)', 'pending')
                .where('t.affiliateAccountId = :id', { id: affiliateId })
                .andWhere('t.settlementStatus = :status', { status: 0 })
                .andWhere('t.createdAt >= :start AND t.createdAt < :end', { start, end })
                .getRawOne();

            months.push({ label, earned: Number(earned) || 0, pending: Number(pending) || 0 });
        }

        return months;
    }

    // ---------------------------------------------------------
    // Settings — Update Profile
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // Settings — Update Payout
    // ---------------------------------------------------------
    async updatePayoutSettings(affiliateId: number, dto: {
        bankingName?: string; accountNumber?: string; ifscCode?: string; branchName?: string;
        upiId?: string; upiNumber?: string;
    }) {
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

    // ---------------------------------------------------------
    // Settings — Change Password (Cognito)
    // ---------------------------------------------------------
    async changePassword(affiliateId: number, dto: { currentPassword: string; newPassword: string }) {
        const affiliate = await this.affiliateRepo.findOne({
            where: { id: affiliateId },
            relations: ['user'],
        });
        if (!affiliate || !affiliate.user) throw new BadRequestException('Affiliate not found');

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const CognitoISP = require('aws-sdk/clients/cognitoidentityserviceprovider');
            const cognito = new CognitoISP({
                region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1',
            });

            // Admin set user password (simpler approach for affiliate portal)
            await cognito.adminSetUserPassword({
                UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID,
                Username: affiliate.user.email,
                Password: dto.newPassword,
                Permanent: true,
            }).promise();

            return { message: 'Password changed successfully' };
        } catch (error: any) {
            this.logger.error('Password change failed', error);
            throw new BadRequestException(error.message || 'Password change failed');
        }
    }
}
