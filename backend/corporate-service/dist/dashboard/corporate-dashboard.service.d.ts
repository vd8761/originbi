import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
export declare class CorporateDashboardService {
    private readonly userRepo;
    private readonly corporateRepo;
    constructor(userRepo: Repository<User>, corporateRepo: Repository<CorporateAccount>);
    getStats(email: string): Promise<{
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        studentsRegistered: number;
        isActive: boolean;
    }>;
}
