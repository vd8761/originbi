import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';

@Injectable()
export class CorporateDashboardService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(CorporateAccount)
        private readonly corporateRepo: Repository<CorporateAccount>,
    ) { }

    async getStats(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });

        if (!corporate) {
            throw new NotFoundException('Corporate account not found');
        }

        // TODO: Fetch real student count once Student entity is available/linked
        const studentsRegistered = 0;

        return {
            companyName: corporate.companyName,
            availableCredits: corporate.availableCredits,
            totalCredits: corporate.totalCredits,
            studentsRegistered,
            isActive: corporate.isActive,
        };
    }
}
