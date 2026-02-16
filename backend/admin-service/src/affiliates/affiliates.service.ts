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
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/create-affiliate.dto';
import { R2Service, R2UploadResult } from '../r2/r2.service';

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
            return await this.dataSource.transaction(async (manager) => {
                const user = manager.create(AdminUser, {
                    email: dto.email,
                    role: 'AFFILIATE',
                    emailVerified: true,
                    cognitoSub: sub,
                    isActive: true,
                    metadata: { fullName: dto.name, mobile: dto.mobileNumber },
                });
                await manager.save(user);

                const affiliate = manager.create(AffiliateAccount, {
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
                await manager.save(affiliate);
                return affiliate;
            });
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
}
