import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { UserActionLog } from '../entities/user-action-log.entity';
export declare class CorporateDashboardService {
    private readonly userRepo;
    private readonly corporateRepo;
    private actionLogRepository;
    private httpService;
    private configService;
    private authServiceUrl;
    constructor(userRepo: Repository<User>, corporateRepo: Repository<CorporateAccount>, actionLogRepository: Repository<UserActionLog>, httpService: HttpService, configService: ConfigService);
    getStats(email: string): Promise<{
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        studentsRegistered: number;
        isActive: boolean;
    }>;
    initiateCorporateReset(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
