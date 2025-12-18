import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { UserActionLog, ActionType, UserRole } from '../entities/user-action-log.entity';

@Injectable()
export class CorporateDashboardService {
    private authServiceUrl: string;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(CorporateAccount)
        private readonly corporateRepo: Repository<CorporateAccount>,
        @InjectRepository(UserActionLog)
        private actionLogRepository: Repository<UserActionLog>,
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:4002';
    }

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

    async initiateCorporateReset(email: string) {
        // 1. Validate User
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found.');
        }

        if (user.role !== 'CORPORATE') {
            throw new NotFoundException('Corporate user not found.');
        }

        // Fetch Corporate Account to get its ID for registration_id
        const corporate = await this.corporateRepo.findOne({ where: { userId: user.id } });
        if (!corporate) {
            throw new NotFoundException('Corporate account not found.');
        }

        // 2. Check Rate Limit
        const today = new Date().toISOString().split('T')[0];

        const existingLog = await this.actionLogRepository.findOne({
            where: {
                user: { id: user.id },
                actionType: ActionType.RESET_PASSWORD,
                role: UserRole.CORPORATE,
                actionDate: today,
            },
        });

        if (existingLog && existingLog.attemptCount >= 1) {
            throw new BadRequestException('Password reset limit reached for today. Please try again tomorrow.');
        }

        // 3. Call Auth Service to Trigger Reset
        try {
            await firstValueFrom(
                this.httpService.post(`${this.authServiceUrl}/internal/cognito/forgot-password`, { email })
            );
        } catch (error: any) {
            console.error('Auth Service Forgot Password Failed:', error?.response?.data || error.message);
            throw new InternalServerErrorException('Failed to initiate password reset. Please try again.');
        }

        // 4. Log the Attempt (ONLY after successful call)
        if (existingLog) {
            existingLog.attemptCount += 1;
            await this.actionLogRepository.save(existingLog);
        } else {
            const newLog = this.actionLogRepository.create({
                user: user,
                userId: user.id,
                role: UserRole.CORPORATE,
                actionType: ActionType.RESET_PASSWORD,
                actionDate: today,
                attemptCount: 1,
                registrationId: corporate.id.toString(), // Use corporate account ID
            });
            await this.actionLogRepository.save(newLog);
        }

        return { success: true, message: 'Password reset initiated. Check your email.' };
    }
}
