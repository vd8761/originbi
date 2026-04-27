import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, In, And } from 'typeorm';

import {
  User as AdminUser,
  GroupAssessment,
  CorporateAccount,
  AssessmentSession,
  CorporateCreditLedger,
  Registration,
  AffiliateSettlementTransaction,
  StudentSubscription,
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

    @InjectRepository(StudentSubscription)
    private readonly subscriptionRepo: Repository<StudentSubscription>,

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
      const totalRevenue = revenueTrend.reduce((acc, curr) => acc + curr.revenue, 0);

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
        totalRevenue,
        totalCommissionsPaid,
        userDistribution,
        recentExpiredAssessments: await this.getRecentExpiredAssessments(),
        todaysRegistrations: await this.getTodaysRegistrations(),
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

    // Add Subscription Revenue (e.g. Debrief extra payments)
    const subscriptionRevenue = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select("DATE_TRUNC('month', s.purchased_at)", 'month')
      .addSelect('SUM(CAST(s.amount AS NUMERIC))', 'amount')
      .where("s.status = 'active'")
      .andWhere('s.purchased_at >= :twelveMonthsAgo', { twelveMonthsAgo })
      .groupBy('month')
      .getRawMany();

    subscriptionRevenue.forEach((item) => {
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
    const [schoolCount, collegeCount, totalCorporateCount, cxoCount] =
      await Promise.all([
        this.registrationRepo.count({
          where: { schoolLevel: Not(IsNull()) },
        }),
        this.registrationRepo.count({
          where: { departmentDegreeId: Not(IsNull()) },
        }),
        this.registrationRepo.count({
          where: { corporateAccountId: Not(IsNull()) },
        }),
        this.registrationRepo
          .createQueryBuilder('r')
          .where('r.corporate_account_id IS NOT NULL')
          .andWhere("r.metadata->>'programType' ILIKE :type", { type: '%cxo%' })
          .getCount(),
      ]);

    const employeeCount = totalCorporateCount - cxoCount;

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

  private async getRecentExpiredAssessments() {
    const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();
    return this.sessionRepo.find({
      where: {
        validTo: And(LessThan(new Date()), MoreThanOrEqual(sevenDaysAgo)),
        status: In([
          'NOT_STARTED',
          'IN_PROGRESS',
          'EXPIRED',
          'PARTIALLY_EXPIRED',
        ]),
      },
      relations: ['user', 'program', 'registration'],
      order: { validTo: 'DESC' },
      take: 5,
    });
  }

  private async getTodaysRegistrations() {
    const startOfToday = dayjs().startOf('day').toDate();
    return this.registrationRepo.find({
      where: {
        createdAt: MoreThanOrEqual(startOfToday),
      },
      relations: ['user', 'program'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
  }

  async extendAssessmentSession(sessionId: number, newDate: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new Error('Assessment session not found');
    }

    session.validTo = new Date(newDate);

    // If it was EXPIRED, we should reset it to ASSIGNED or STARTED to allow the user back in
    if (session.status === 'EXPIRED') {
      session.status = 'IN_PROGRESS'; // Or appropriately 'NOT_STARTED' if never opened
    }

    return this.sessionRepo.save(session);
  }

  getMessage() {
    return { message: 'Admin service working!' };
  }
}
