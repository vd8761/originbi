import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  User as AdminUser,
  GroupAssessment,
  CorporateAccount,
  AssessmentSession,
} from '@originbi/shared-entities';
import { AffiliatesService } from '../affiliates/affiliates.service';
import dayjs from 'dayjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly userRepo: Repository<AdminUser>,

    @InjectRepository(GroupAssessment)
    private readonly groupAssessmentRepo: Repository<GroupAssessment>,

    @InjectRepository(CorporateAccount)
    private readonly corporateRepo: Repository<CorporateAccount>,

    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,

    private readonly affiliatesService: AffiliatesService,
  ) { }

  async getDashboardStats() {
    try {
      const startOfToday = dayjs().startOf('day');
      const startOfWeek = dayjs().startOf('week'); // Usually Sunday
      const startOfMonth = dayjs().startOf('month');

      // 1. Total Users (Count students)
      const totalUsersCount = await this.userRepo.count({
        where: { role: 'STUDENT' } as any,
      });

      // 2. Active Assessments (This Week)
      // Count both individual sessions and group assessments created/starts this week
      const [weeklySessions, weeklyGroups] = await Promise.all([
        this.sessionRepo.count({
          where: { createdAt: MoreThanOrEqual(startOfWeek.toDate()) },
        }),
        this.groupAssessmentRepo.count({
          where: { createdAt: MoreThanOrEqual(startOfWeek.toDate()) },
        }),
      ]);
      const activeAssessments = weeklySessions + weeklyGroups;

      // 3. Corporate Clients
      const corporateClients = await this.corporateRepo.count();

      // 4. Affiliate Data (from AffiliatesService)
      const affiliateStats = await this.affiliatesService.getAdminDashboardStats();

      return {
        totalUsers: totalUsersCount,
        activeAssessments,
        corporateClients,
        totalReadyToPayment: affiliateStats.totalReadyToPayment,
        affiliates: affiliateStats.affiliates,
        // Optional: meta for frontend to show date ranges if needed
        statsContext: {
          weekStart: startOfWeek.format('YYYY-MM-DD'),
        }
      };
    } catch (error: any) {
      this.logger.error(`Error calculating dashboard stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to calculate dashboard statistics');
    }
  }

  getMessage() {
    return { message: 'Admin service working!' };
  }
}
