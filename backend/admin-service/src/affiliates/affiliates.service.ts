import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import {
    User as AdminUser,
    AffiliateAccount,
} from '@originbi/shared-entities';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';

@Injectable()
export class AffiliatesService {
    private readonly logger = new Logger(AffiliatesService.name);
    private authServiceBaseUrl = process.env.AUTH_SERVICE_URL;

    constructor(
        @InjectRepository(AdminUser)
        private readonly userRepo: Repository<AdminUser>,

        @InjectRepository(AffiliateAccount)
        private readonly affiliateRepo: Repository<AffiliateAccount>,

        private readonly dataSource: DataSource,
        private readonly http: HttpService,
    ) { }

    // ---------------------------------------------------------
    // Helper: Retry with exponential backoff
    // ---------------------------------------------------------
    private async withRetry<T>(
        operation: () => Promise<T>,
        retries = 5,
        delay = 1000,
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: unknown) {
            type Retryable = {
                response?: { status?: number };
                code?: string;
                message?: string;
            };
            const err =
                typeof error === 'object' && error !== null ? (error as Retryable) : {};

            const isRateLimit =
                err.response?.status === 429 ||
                err.code === 'TooManyRequestsException' ||
                (typeof err.message === 'string' &&
                    err.message.includes('Too Many Requests'));

            if (retries > 0 && isRateLimit) {
                this.logger.warn(
                    `Rate limit hit. Retrying in ${delay}ms... (${retries} left)`,
                );
                await new Promise((res) => setTimeout(res, delay));
                return this.withRetry(operation, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    // ---------------------------------------------------------
    // Helper: Create Cognito user via Auth Service
    // ---------------------------------------------------------
    private async createCognitoUser(
        email: string,
        password: string,
        groupName: string = 'AFFILIATE',
    ) {
        try {
            const res = await this.withRetry(() =>
                firstValueFrom(
                    this.http.post(
                        `${this.authServiceBaseUrl}/internal/cognito/users`,
                        { email, password, groupName },
                        { proxy: false },
                    ),
                ),
            );
            return res.data as { sub?: string; email?: string };
        } catch (err: unknown) {
            type AuthErr = {
                response?: { data?: any; status?: number };
                message?: string;
            };
            const e = typeof err === 'object' && err !== null ? (err as AuthErr) : {};
            const authErr = e.response?.data || e.message || err;
            this.logger.error('Error creating Cognito user for affiliate:', authErr);

            const msg =
                typeof authErr === 'object' && authErr !== null
                    ? authErr.message || JSON.stringify(authErr)
                    : String(authErr);

            throw new InternalServerErrorException(
                `Failed to create Cognito user: ${msg}`,
            );
        }
    }

    // ---------------------------------------------------------
    // Helper: Generate random 8-character alphanumeric code
    // ---------------------------------------------------------
    private generateReferralCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Ensure uniqueness
    private async generateUniqueReferralCode(): Promise<string> {
        let code: string;
        let exists: boolean;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            code = this.generateReferralCode();
            const existing = await this.affiliateRepo.findOne({
                where: { referralCode: code },
            });
            exists = !!existing;
            attempts++;
        } while (exists && attempts < maxAttempts);

        if (exists) {
            throw new InternalServerErrorException(
                'Unable to generate unique referral code. Please try again.',
            );
        }

        return code;
    }

    // ---------------------------------------------------------
    // CREATE AFFILIATE
    // ---------------------------------------------------------
    async create(dto: CreateAffiliateDto) {
        dto.email = dto.email.toLowerCase();
        this.logger.log(`Creating affiliate account for ${dto.email}`);

        // 1. Check if email already exists
        const existingUser = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        const existingAffiliate = await this.affiliateRepo.findOne({
            where: { email: dto.email },
        });
        if (existingAffiliate) {
            throw new BadRequestException('Affiliate account already exists for this email');
        }

        // 2. Create Cognito user with "AFFILIATE" group
        const cognitoRes = await this.createCognitoUser(dto.email, dto.password);
        const sub = cognitoRes.sub!;
        this.logger.log(`Cognito user created with sub: ${sub}`);

        // 3. Generate unique 8-character alphanumeric referral code
        const referralCode = await this.generateUniqueReferralCode();
        this.logger.log(`Generated referral code: ${referralCode}`);

        // 4. Transaction: Create User + AffiliateAccount
        try {
            return await this.dataSource.transaction(async (manager) => {
                // A. Create User entity
                const user = manager.create(AdminUser, {
                    email: dto.email,
                    role: 'AFFILIATE',
                    emailVerified: true,
                    cognitoSub: sub,
                    isActive: true,
                    isBlocked: false,
                    metadata: {
                        fullName: dto.name,
                        countryCode: dto.countryCode ?? '+91',
                        mobile: dto.mobileNumber,
                    },
                });
                await manager.save(user);

                // B. Create AffiliateAccount entity
                const affiliate = manager.create(AffiliateAccount, {
                    userId: user.id,
                    name: dto.name,
                    email: dto.email,
                    countryCode: dto.countryCode ?? '+91',
                    mobileNumber: dto.mobileNumber,
                    address: dto.address ?? null,
                    referralCode,
                    referralCount: 0,
                    commissionPercentage: dto.commissionPercentage ?? 0,
                    totalEarnedCommission: 0,
                    totalSettledCommission: 0,
                    totalPendingCommission: 0,
                    upiId: dto.upiId ?? null,
                    upiNumber: dto.upiNumber ?? null,
                    bankingName: dto.bankingName ?? null,
                    accountNumber: dto.accountNumber ?? null,
                    ifscCode: dto.ifscCode ?? null,
                    branchName: dto.branchName ?? null,
                    aadharUrl: dto.aadharUrl ?? null,
                    panUrl: dto.panUrl ?? null,
                    isActive: true,
                    metadata: {},
                });
                await manager.save(affiliate);

                return {
                    id: affiliate.id,
                    userId: user.id,
                    email: user.email,
                    referralCode: affiliate.referralCode,
                    name: affiliate.name,
                };
            });
        } catch (e: unknown) {
            this.logger.error('Affiliate creation transaction failed', e);
            const msg = e instanceof Error ? e.message : String(e);
            throw new BadRequestException(`Affiliate creation failed: ${msg}`);
        }
    }

    // ---------------------------------------------------------
    // LIST AFFILIATES
    // ---------------------------------------------------------
    async findAll(
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder: 'ASC' | 'DESC' = 'DESC',
    ) {
        try {
            const qb = this.affiliateRepo
                .createQueryBuilder('a')
                .leftJoinAndSelect('a.user', 'u')
                .where('a.isActive = true');

            if (search) {
                const s = `%${search.toLowerCase()}%`;
                qb.andWhere(
                    '(LOWER(a.name) LIKE :s OR LOWER(a.email) LIKE :s OR LOWER(a.referralCode) LIKE :s)',
                    { s },
                );
            }

            // Sorting
            if (sortBy) {
                let sortCol = '';
                switch (sortBy) {
                    case 'name':
                        sortCol = 'a.name';
                        break;
                    case 'email':
                        sortCol = 'a.email';
                        break;
                    case 'referralCount':
                        sortCol = 'a.referralCount';
                        break;
                    case 'commissionPercentage':
                        sortCol = 'a.commissionPercentage';
                        break;
                    default:
                        sortCol = 'a.createdAt';
                }
                qb.orderBy(sortCol, sortOrder);
            } else {
                qb.orderBy('a.createdAt', 'DESC');
            }

            const total = await qb.getCount();
            const rows = await qb
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();

            const data = rows.map((a) => ({
                id: a.id,
                user_id: a.userId,
                name: a.name,
                email: a.email,
                country_code: a.countryCode,
                mobile_number: a.mobileNumber,
                address: a.address,
                referral_code: a.referralCode,
                referral_count: a.referralCount,
                commission_percentage: a.commissionPercentage,
                total_earned_commission: a.totalEarnedCommission,
                total_settled_commission: a.totalSettledCommission,
                total_pending_commission: a.totalPendingCommission,
                upi_id: a.upiId,
                upi_number: a.upiNumber,
                banking_name: a.bankingName,
                account_number: a.accountNumber,
                ifsc_code: a.ifscCode,
                branch_name: a.branchName,
                aadhar_url: a.aadharUrl,
                pan_url: a.panUrl,
                is_active: a.isActive,
                created_at: a.createdAt,
                updated_at: a.updatedAt,
            }));

            return { data, total, page, limit };
        } catch (error) {
            const err = error as Error;
            this.logger.error(`findAll Affiliates Error: ${err.message}`, err.stack);
            throw new InternalServerErrorException(
                `Failed to fetch affiliates: ${err.message}`,
            );
        }
    }

    // ---------------------------------------------------------
    // FIND BY ID
    // ---------------------------------------------------------
    async findById(id: number) {
        const affiliate = await this.affiliateRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!affiliate) {
            throw new BadRequestException('Affiliate not found');
        }
        return affiliate;
    }

    // ---------------------------------------------------------
    // FIND BY REFERRAL CODE
    // ---------------------------------------------------------
    async findByReferralCode(code: string) {
        return this.affiliateRepo.findOne({
            where: { referralCode: code, isActive: true },
        });
    }

    // ---------------------------------------------------------
    // INCREMENT REFERRAL COUNT
    // ---------------------------------------------------------
    async incrementReferralCount(referralCode: string) {
        const affiliate = await this.affiliateRepo.findOne({
            where: { referralCode },
        });
        if (!affiliate) return;

        affiliate.referralCount += 1;
        await this.affiliateRepo.save(affiliate);
    }
}
