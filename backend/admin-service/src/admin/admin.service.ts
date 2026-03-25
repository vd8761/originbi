import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  User as AdminUser,
  GroupAssessment,
  CorporateAccount,
  AssessmentSession,
  CorporateCreditLedger,
  Registration,
  AffiliateSettlementTransaction,
} from '@originbi/shared-entities';
import { AffiliatesService } from '../affiliates/affiliates.service';
import dayjs from 'dayjs';
import { Not, IsNull } from 'typeorm';

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

    @InjectRepository(CorporateCreditLedger)
    private readonly creditLedgerRepo: Repository<CorporateCreditLedger>,

    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,

    @InjectRepository(AffiliateSettlementTransaction)
    private readonly settlementRepo: Repository<AffiliateSettlementTransaction>,

    private readonly affiliatesService: AffiliatesService,
  ) {}

  async getDashboardStats() {
    try {
      const startOfToday = dayjs().startOf('day');
      const startOfWeek = dayjs().startOf('week'); // Usually Sunday
      const startOfMonth = dayjs().startOf('month');

      // 1. User Distribution (and demographics total)
      const userDistribution = await this.getUserDistribution();
      const totalUsersCount = userDistribution.totalWithTraits;

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
      const affiliateStats =
        await this.affiliatesService.getAdminDashboardStats();

      // 5. Revenue Trend (Last 12 Months)
      const revenueTrend = await this.getRevenueTrend();

      // 6. Total Commissions Paid
      const totalCommissionsPaid = await this.getTotalCommissionsPaid();

      // 7. Already calculated distribution above

      return {
        totalUsers: totalUsersCount,
        activeAssessments,
        corporateClients,
        totalReadyToPayment: affiliateStats.totalReadyToPayment,
        affiliates: affiliateStats.affiliates,
        revenueTrend,
        totalCommissionsPaid,
        userDistribution,
        // Optional: meta for frontend to show date ranges if needed
        statsContext: {
          weekStart: startOfWeek.format('YYYY-MM-DD'),
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error calculating dashboard stats: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to calculate dashboard statistics',
      );
    }
  }

  private async getRevenueTrend() {
    const twelveMonthsAgo = dayjs()
      .subtract(11, 'month')
      .startOf('month')
      .toDate();

    const individualRevenue = await this.registrationRepo
      .createQueryBuilder('r')
      .select("DATE_TRUNC('month', r.paid_at)", 'month')
      .addSelect('SUM(CAST(r.payment_amount AS NUMERIC))', 'amount')
      .where("r.payment_status IN ('PAID', 'SUCCESS')")
      .andWhere('r.paid_at >= :twelveMonthsAgo', { twelveMonthsAgo })
      .groupBy('month')
      .getRawMany();

    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('MMM YYYY'));
    }

    const trendMap = new Map<string, number>();
    months.forEach((m) => trendMap.set(m, 0));

    individualRevenue.forEach((item) => {
      const monthLabel = dayjs(item.month).format('MMM YYYY');
      if (trendMap.has(monthLabel)) {
        trendMap.set(
          monthLabel,
          trendMap.get(monthLabel)! + (parseFloat(item.amount) || 0),
        );
      }
    });

    return Array.from(trendMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  private async getTotalCommissionsPaid() {
    const result = await this.settlementRepo
      .createQueryBuilder('t')
      .select('SUM(t.settle_amount)', 'total')
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getUserDistribution() {
    const schoolCount = await this.registrationRepo.count({
      where: { schoolLevel: Not(IsNull()) },
    });
    const collegeCount = await this.registrationRepo.count({
      where: { departmentDegreeId: Not(IsNull()) },
    });
    
    // More robust way to handle JSON filtering by doing it in memory for corporate accounts
    const corporateRegs = await this.registrationRepo.find({
      where: { corporateAccountId: Not(IsNull()) },
    });

    const cxoCount = corporateRegs.filter(reg => 
      String(reg.metadata?.programType || '').toLowerCase().includes('cxo')
    ).length;

    const employeeCount = corporateRegs.length - cxoCount;

    return {
      totalWithTraits: schoolCount + collegeCount + employeeCount + cxoCount,
      topTraits: [
        {
          traitName: 'School Students',
          count: schoolCount,
          colorRgb: '#150089',
        },
        {
          traitName: 'College Students',
          count: collegeCount,
          colorRgb: '#1ED36A',
        },
        {
          traitName: 'Employee',
          count: employeeCount,
          colorRgb: '#FF5457',
        },
        {
          traitName: 'CXO General',
          count: cxoCount,
          colorRgb: '#A855F7',
        },
      ],
    };
  }

  getMessage() {
    return { message: 'Admin service working!' };
  }
}
