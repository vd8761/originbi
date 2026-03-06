/* eslint-disable @typescript-eslint/no-unused-vars, no-useless-catch */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import Razorpay = require('razorpay');

import { User } from '@originbi/shared-entities';
import { CorporateAccount } from '@originbi/shared-entities';
import { CorporateCreditLedger } from '@originbi/shared-entities';
import { UserActionLog, ActionType, UserRole } from '@originbi/shared-entities';
import { Registration } from '@originbi/shared-entities';
import { AssessmentSession } from '@originbi/shared-entities';
import { Program } from '@originbi/shared-entities';
import { GroupAssessment } from '@originbi/shared-entities';
import { Groups } from '@originbi/shared-entities';
import { CorporateCounsellingAccess } from '@originbi/shared-entities';
import { CounsellingType } from '@originbi/shared-entities';
import { CounsellingSession } from '@originbi/shared-entities';
import { CounsellingResponse } from '@originbi/shared-entities';

@Injectable()
export class CorporateDashboardService {
  private authServiceUrl: string;
  private razorpay: any;
  private perCreditCost: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CorporateAccount)
    private readonly corporateRepo: Repository<CorporateAccount>,
    @InjectRepository(UserActionLog)
    private actionLogRepository: Repository<UserActionLog>,
    @InjectRepository(CorporateCreditLedger)
    private readonly ledgerRepo: Repository<CorporateCreditLedger>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(GroupAssessment)
    private readonly groupAssessmentRepo: Repository<GroupAssessment>,
    @InjectRepository(Groups)
    private readonly groupRepo: Repository<Groups>,
    @InjectRepository(CorporateCounsellingAccess)
    private readonly accessRepo: Repository<CorporateCounsellingAccess>,
    @InjectRepository(CounsellingType)
    private readonly typeRepo: Repository<CounsellingType>,
    @InjectRepository(CounsellingSession)
    private readonly counsellingSessionRepo: Repository<CounsellingSession>,
    @InjectRepository(CounsellingResponse)
    private readonly counsellingResponseRepo: Repository<CounsellingResponse>,
    private httpService: HttpService,
    private configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ?? '';

    // Safety check: specific fix for local dev misconfiguration
    if (this.authServiceUrl.includes('4003')) {
      console.warn(
        `[CorporateDashboardService] AUTH_SERVICE_URL misconfigured to ${this.authServiceUrl}.`,
      );
    }

    this.perCreditCost = parseFloat(
      this.configService.get<string>('PER_CREDIT_COST') || '200',
    );

    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    retries = 5,
    delay = 1000,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (
        retries > 0 &&
        (error.response?.status === 429 ||
          error.code === 'TooManyRequestsException' ||
          error.message?.includes('Too Many Requests'))
      ) {
        console.warn(
          `Rate limit hit in CorporateDashboardService. Retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((res) => setTimeout(res, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // ========================================================================
  // Helper: Get Corporate Account ID by User Email
  // ========================================================================
  async getCorporateAccountIdByEmail(email: string): Promise<number> {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });

    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }

    if (!corporate) {
      throw new NotFoundException('Corporate account not found');
    }

    return corporate.id;
  }

  async getStats(email: string, startDate?: string, endDate?: string) {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strategy A: Direct link
    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });

    // Strategy B: Fallback via corporateId in User table
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }

    if (!corporate) {
      throw new NotFoundException('Corporate account not found');
    }

    const corpId = corporate.id;

    // Run all dashboard queries in parallel for performance
    const [
      miniStatsResult,
      assessmentInsightsResult,
      pipelineResult,
      personalityResult,
      recentParticipantsResult,
    ] = await Promise.all([
      this.getMiniStats(corpId, startDate, endDate),
      this.getAssessmentInsights(corpId, startDate, endDate),
      this.getPipelineOverview(corpId, startDate, endDate),
      this.getPersonalityDistribution(corpId, startDate, endDate),
      this.getRecentParticipants(corpId),
    ]);

    return {
      companyName: corporate.companyName,
      availableCredits: corporate.availableCredits,
      totalCredits: corporate.totalCredits,
      studentsRegistered: miniStatsResult.totalRegistrations,
      isActive: corporate.isActive,
      perCreditCost: this.perCreditCost,
      miniStats: miniStatsResult,
      assessmentInsights: assessmentInsightsResult,
      pipelineOverview: pipelineResult,
      personalityDistribution: personalityResult,
      recentParticipants: recentParticipantsResult,
    };
  }

  // ========================================================================
  // Dashboard Data Helpers
  // ========================================================================

  private async getMiniStats(
    corpId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRegistrations: number;
    newRegistrationsThisMonth: number;
    assessmentsAssigned: number;
    assessmentsCompleted: number;
    registrationsTrend: number;
    assessmentsAssignedTrend: number;
    assessmentsCompletedTrend: number;
  }> {
    const now = new Date();

    // Default ranges for trend calculation (current vs last month)
    let currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // If user provided a specific filter (e.g. Feb 2026)
    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);

      // Use the filter as "current" for trend
      currentStart = filterStart;

      // Calculate "previous" period of same length
      const diffTime = Math.abs(filterEnd.getTime() - filterStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      prevStart = new Date(filterStart);
      prevStart.setDate(prevStart.getDate() - diffDays);
      prevEnd = new Date(filterStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
    }

    const baseQuery = `corporate_account_id = $1 AND is_deleted = false`;
    const dateQueryFromFilter =
      startDate && endDate
        ? ` AND created_at >= '${startDate} 00:00:00' AND created_at <= '${endDate} 23:59:59'`
        : '';

    const result = await this.dataSource.query(
      `
      SELECT
        -- Main count (respects filter or shows all)
        COUNT(r.id) AS total_registrations,
        -- Count for "Current" period in trend
        COUNT(r.id) FILTER (WHERE r.created_at >= $2) AS current_period_count,
        -- Count for "Previous" period in trend
        COUNT(r.id) FILTER (WHERE r.created_at >= $3 AND r.created_at <= $4) AS previous_period_count
      FROM registrations r
      WHERE ${baseQuery} ${dateQueryFromFilter}
      `,
      [
        corpId,
        currentStart.toISOString(),
        prevStart.toISOString(),
        prevEnd.toISOString(),
      ],
    );

    const sessionDateQuery =
      startDate && endDate
        ? ` AND s.created_at >= '${startDate} 00:00:00' AND s.created_at <= '${endDate} 23:59:59'`
        : '';

    const sessionResult = await this.dataSource.query(
      `
      SELECT
        -- Main stats (respects filter)
        COUNT(s.id) AS total_assigned,
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED') AS total_completed,
        -- Trend counts
        COUNT(s.id) FILTER (WHERE s.created_at >= $2) AS assigned_current,
        COUNT(s.id) FILTER (WHERE s.created_at >= $3 AND s.created_at <= $4) AS assigned_prev,
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED' AND s.completed_at >= $2) AS completed_current,
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED' AND s.completed_at >= $3 AND s.completed_at <= $4) AS completed_prev
      FROM assessment_sessions s
      JOIN registrations r ON s.registration_id = r.id
      WHERE r.corporate_account_id = $1 AND r.is_deleted = false ${sessionDateQuery}
      `,
      [
        corpId,
        currentStart.toISOString(),
        prevStart.toISOString(),
        prevEnd.toISOString(),
      ],
    );

    const reg = result[0] || {};
    const sess = sessionResult[0] || {};

    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalRegistrations: parseInt(
        (reg.total_registrations as string) || '0',
        10,
      ),
      newRegistrationsThisMonth: parseInt(
        (reg.current_period_count as string) || '0',
        10,
      ),
      assessmentsAssigned: parseInt((sess.total_assigned as string) || '0', 10),
      assessmentsCompleted: parseInt(
        (sess.total_completed as string) || '0',
        10,
      ),
      registrationsTrend: calcTrend(
        parseInt((reg.current_period_count as string) || '0', 10),
        parseInt((reg.previous_period_count as string) || '0', 10),
      ),
      assessmentsAssignedTrend: calcTrend(
        parseInt((sess.assigned_current as string) || '0', 10),
        parseInt((sess.assigned_prev as string) || '0', 10),
      ),
      assessmentsCompletedTrend: calcTrend(
        parseInt((sess.completed_current as string) || '0', 10),
        parseInt((sess.completed_prev as string) || '0', 10),
      ),
    };
  }

  private async getAssessmentInsights(
    corpId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    let dateQuery = ` AND s.created_at >= NOW() - INTERVAL '5 months'`;

    // If a month is filtered, show 6 months ending in that month
    if (startDate && endDate) {
      const end = new Date(endDate);
      const startOfRange = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      dateQuery = ` AND s.created_at >= '${startOfRange.toISOString().split('T')[0]} 00:00:00' AND s.created_at <= '${endDate} 23:59:59'`;
    }

    const result = await this.dataSource.query(
      `
      SELECT
        TO_CHAR(s.created_at, 'Mon') AS month,
        EXTRACT(YEAR FROM s.created_at)::int AS year,
        EXTRACT(MONTH FROM s.created_at)::int AS month_num,
        COUNT(s.id) AS assigned,
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED') AS completed
      FROM assessment_sessions s
      JOIN registrations r ON s.registration_id = r.id
      WHERE r.corporate_account_id = $1
        AND r.is_deleted = false
        ${dateQuery}
      GROUP BY TO_CHAR(s.created_at, 'Mon'), EXTRACT(YEAR FROM s.created_at), EXTRACT(MONTH FROM s.created_at)
      ORDER BY year, month_num
      `,
      [corpId],
    );

    return ((result || []) as any[]).map((row: any) => ({
      month: row.month as string,
      year: row.year as number,
      assigned: parseInt((row.assigned as string) || '0', 10),
      completed: parseInt((row.completed as string) || '0', 10),
    }));
  }

  private async getPipelineOverview(
    corpId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const dateQuery =
      startDate && endDate
        ? ` AND r.created_at >= '${startDate} 00:00:00' AND r.created_at <= '${endDate} 23:59:59'`
        : '';

    const result = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT r.id) AS total_registered,
        COUNT(s.id) AS assessments_assigned,
        COUNT(s.id) FILTER (WHERE s.status = 'IN_PROGRESS') AS assessments_in_progress,
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED') AS assessments_completed
      FROM registrations r
      LEFT JOIN assessment_sessions s ON s.registration_id = r.id
      WHERE r.corporate_account_id = $1 AND r.is_deleted = false ${dateQuery}
      `,
      [corpId],
    );

    const row = result[0] || {};
    return {
      totalRegistered: parseInt((row.total_registered as string) || '0', 10),
      assessmentsAssigned: parseInt(
        (row.assessments_assigned as string) || '0',
        10,
      ),
      assessmentsInProgress: parseInt(
        (row.assessments_in_progress as string) || '0',
        10,
      ),
      assessmentsCompleted: parseInt(
        (row.assessments_completed as string) || '0',
        10,
      ),
    };
  }

  private async getPersonalityDistribution(
    corpId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const dateQuery =
      startDate && endDate
        ? ` AND aa.created_at >= '${startDate} 00:00:00' AND aa.created_at <= '${endDate} 23:59:59'`
        : '';

    const result = await this.dataSource.query(
      `
      SELECT
        pt.blended_style_name AS trait_name,
        pt.color_rgb,
        COUNT(aa.id) AS count
      FROM assessment_attempts aa
      JOIN registrations r ON aa.registration_id = r.id
      JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
      WHERE r.corporate_account_id = $1
        AND r.is_deleted = false
        AND aa.dominant_trait_id IS NOT NULL
        ${dateQuery}
      GROUP BY pt.id, pt.blended_style_name, pt.color_rgb
      ORDER BY count DESC
      LIMIT 4
      `,
      [corpId],
    );

    // Get total count with traits
    const totalResult = await this.dataSource.query(
      `
      SELECT COUNT(aa.id) AS total
      FROM assessment_attempts aa
      JOIN registrations r ON aa.registration_id = r.id
      WHERE r.corporate_account_id = $1
        AND r.is_deleted = false
        AND aa.dominant_trait_id IS NOT NULL
        ${dateQuery}
      `,
      [corpId],
    );

    return {
      totalWithTraits: parseInt((totalResult[0]?.total as string) || '0', 10),
      topTraits: (result || []).map((row: any) => ({
        traitName: row.trait_name as string,
        count: parseInt((row.count as string) || '0', 10),
        colorRgb:
          row.color_rgb &&
            !row.color_rgb.startsWith('#') &&
            !row.color_rgb.startsWith('rgb') &&
            row.color_rgb.includes(',')
            ? `rgb(${row.color_rgb})`
            : (row.color_rgb as string) || '#1ED36A',
      })),
    };
  }

  private async getRecentParticipants(corpId: number): Promise<any[]> {
    const result = await this.dataSource.query(
      `
      SELECT
        r.id,
        r.full_name AS name,
        COALESCE(
          p_direct.name,
          (SELECT p_sess.name FROM assessment_sessions s JOIN programs p_sess ON s.program_id = p_sess.id WHERE s.registration_id = r.id ORDER BY s.created_at DESC LIMIT 1),
          r.metadata->>'programType'
        ) AS program_type,
        r.status,
        r.created_at AS register_date,
        r.mobile_number AS mobile
      FROM registrations r
      LEFT JOIN programs p_direct ON r.program_id = p_direct.id
      WHERE r.corporate_account_id = $1 AND r.is_deleted = false
      ORDER BY r.created_at DESC
      LIMIT 5
      `,
      [corpId],
    );

    return ((result || []) as any[]).map((row: any) => ({
      id: String(row.id),
      name: (row.name as string) || 'Unknown',
      programType: (row.program_type as string) || 'N/A',
      status: row.status === 'COMPLETED',
      registerDate: row.register_date
        ? new Date(row.register_date as string).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        : 'N/A',
      mobile: (row.mobile as string) || 'N/A',
    }));
  }

  async initiateCorporateReset(email: string) {
    // ... method content ...
    // (Keeping it brief for the sake of tool usage, assuming I don't need to touch this again unless it's broken)
    // Actually, user wants "Again the same error", so I should probably leave this method alone
    // But for safety and cleaner replacing, I'll copy the known good state below.

    // 1. Validate User
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.role !== 'CORPORATE') {
      throw new NotFoundException('Corporate user not found.');
    }

    const corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
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
      throw new BadRequestException(
        'Password reset limit reached for today. Please try again tomorrow.',
      );
    }

    // 3. Call Auth Service to Trigger Reset
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/internal/cognito/forgot-password`,
          { email },
        ),
      );
    } catch (error: any) {
      console.error(
        'Auth Service Forgot Password Failed:',
        error?.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to initiate password reset. Please try again.',
      );
    }

    // 4. Log Action
    if (existingLog) {
      existingLog.attemptCount += 1;
      await this.actionLogRepository.save(existingLog);
    } else {
      const newLog = this.actionLogRepository.create({
        user,
        actionType: ActionType.RESET_PASSWORD,
        role: UserRole.CORPORATE, // 'CORPORATE'
        actionDate: today,
        attemptCount: 1,
      });
      await this.actionLogRepository.save(newLog);
    }

    return {
      message: 'Password reset link sent to your email.',
    };
  }

  async getProfile(email: string) {
    // FORCE UPDATE: String lookup
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strategy A: Direct link
    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
      relations: ['user'],
    });

    // Strategy B: Fallback via corporateId in User table
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
        relations: ['user'],
      });
    }

    if (!corporate) {
      throw new NotFoundException('Corporate account not found');
    }

    return {
      ...corporate,
      id: corporate.id,
      company_name: corporate.companyName,
      sector_code: corporate.sectorCode,
      employee_ref_id: corporate.employeeRefId,
      job_title: corporate.jobTitle,
      gender: corporate.gender,
      email: user.email,
      country_code: corporate.countryCode,
      mobile_number: corporate.mobileNumber,
      linkedin_url: corporate.linkedinUrl,
      business_locations: corporate.businessLocations,
      available_credits: corporate.availableCredits,
      total_credits: corporate.totalCredits,
      is_active: corporate.isActive,
      is_blocked: user.isBlocked,
      full_name: corporate.fullName,
      created_at: corporate.createdAt,
      updated_at: corporate.updatedAt,
      per_credit_cost: this.perCreditCost,
    };
  }

  // Helper: Create Cognito User
  private async createCognitoUser(
    email: string,
    password: string,
    groupName: string,
  ) {
    console.log(
      `[CorporateDashboardService] createCognitoUser calling Auth Service at: ${this.authServiceUrl}`,
    );
    try {
      const baseUrl = this.authServiceUrl.replace(/\/$/, '');
      const url = `${baseUrl}/internal/cognito/users`;
      const res = await this.withRetry(() =>
        firstValueFrom(
          this.httpService.post(url, { email, password, groupName }),
        ),
      );
      return res.data as { sub?: string };
    } catch (err: any) {
      console.error('Error creating Cognito user:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;

      if (status && status >= 400 && status < 500) {
        throw new BadRequestException(`Auth Service: ${msg}`);
      }
      throw new InternalServerErrorException(`Auth Service Failed: ${msg}`);
    }
  }

  async registerCorporate(dto: RegisterCorporateDto) {
    const email = dto.email.trim();
    const existingUser = await this.userRepo.findOne({
      where: { email: email },
    });
    if (existingUser) {
      throw new BadRequestException(`Email '${email}' is already registered`);
    }

    const existingMobile = await this.corporateRepo.findOne({
      where: { mobileNumber: dto.mobile, countryCode: dto.countryCode },
    });
    if (existingMobile) {
      throw new BadRequestException(
        'Mobile number already exists for a corporate account',
      );
    }

    let sub: string;
    try {
      const cognitoRes = await this.createCognitoUser(
        email,
        dto.password,
        'CORPORATE',
      );
      sub = cognitoRes.sub!;
    } catch (e) {
      throw e;
    }

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const user = manager.create(User, {
          email: email,
          role: 'CORPORATE',
          emailVerified: true,
          cognitoSub: sub,
          isActive: false, // Inactive by default for public registration
          isBlocked: false,
          metadata: {
            fullName: dto.name,
            countryCode: dto.countryCode,
            mobile: dto.mobile,
            gender: dto.gender,
          },
        });
        await manager.save(user);

        const corporateAccount = manager.create(CorporateAccount, {
          userId: user.id,
          fullName: dto.name,
          companyName: dto.companyName,
          sectorCode: dto.sector,
          businessLocations: dto.businessLocations,
          jobTitle: dto.jobTitle,
          employeeRefId: dto.employeeCode,
          linkedinUrl: dto.linkedinUrl,
          countryCode: dto.countryCode,
          mobileNumber: dto.mobile,
          gender: dto.gender,
          totalCredits: 0, // No credits for self-registration
          availableCredits: 0,
          isActive: false, // Inactive
        });
        await manager.save(corporateAccount);

        return {
          success: true,
          message: 'Registration successful. Account pending approval.',
        };
      });

      // Notify Admins
      this.sendAdminNotification({
        role: 'ADMIN',
        type: 'NEW_CORPORATE_SIGNUP',
        title: 'New Corporate Signup',
        message: `A registration request from "${dto.companyName}" is awaiting your approval.`,
        metadata: {
          email: email,
          companyName: dto.companyName,
          name: dto.name,
        },
      }).catch((err) => console.error('Admin notification failed:', err));

      // Send Confirmation Email after successful transaction
      this.sendRegistrationSuccessEmail(email, {
        name: dto.name,
        companyName: dto.companyName,
        email: email,
        mobile: dto.mobile,
        password: dto.password,
        loginUrl: this.configService.get<string>('FRONTEND_URL') ?? '',
      }).catch((emailErr) =>
        console.error('Failed to send registration email:', emailErr),
      );

      return result;
    } catch (dbError: any) {
      console.error(
        `Database Transaction Failed in Public Register: ${dbError.message}`,
        dbError.stack,
      );
      // Handle Unique Constraint Violations (Postgres code 23505)
      if (dbError.code === '23505') {
        throw new BadRequestException(
          'Duplicate entry detected (Email or Mobile).',
        );
      }
      throw new InternalServerErrorException(
        `Database Transaction Failed: ${dbError.message}`,
      );
    }
  }

  private async sendAdminNotification(data: {
    userId?: number;
    role: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    const adminServiceUrl =
      this.configService.get('ADMIN_SERVICE_URL') || 'http://localhost:4001';
    try {
      await firstValueFrom(
        this.httpService.post(`${adminServiceUrl}/notifications/internal`, data),
      );
    } catch (err: any) {
      console.error(
        'Failed to notify admin via internal API:',
        err.response?.data || err.message,
      );
    }
  }

  private async sendRegistrationSuccessEmail(toAddress: string, data: any) {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    // Imported locally to avoid top-level issues if file structure changes, though standard import is better.
    // For now, let's keep it clean.
    const {
      getRegistrationSuccessEmailTemplate,
    } = require('../mail/templates/registration-success.template');

    const sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });

    // Assets (Using public URLs or placeholders similar to Admin Service)
    const serviceUrl =
      this.configService.get<string>('CORPORATE_SERVICE_URL') ?? '';
    // Assets served statically from /assets (via MailAssetsController)
    const assets = {
      logo: `${serviceUrl}/email-assets/logo.png`,
      popper: `${serviceUrl}/email-assets/Popper.png`,
      pattern: `${serviceUrl}/email-assets/Pattern_mask.png`,
      footer: `${serviceUrl}/email-assets/Email_Vector.png`,
    };

    // Use the TS template function
    const htmlContent = getRegistrationSuccessEmailTemplate(
      data.name,
      data.companyName,
      data.email,
      data.mobile,
      data.password,
      `${data.loginUrl}/corporate/login`, // Ensure full login URL path
      assets,
    );

    const params = {
      Source: this.configService.get<string>('EMAIL_FROM'),
      Destination: {
        ToAddresses: [toAddress],
        CcAddresses: this.configService.get<string>('EMAIL_CC')
          ? [this.configService.get<string>('EMAIL_CC')]
          : [],
      },
      Message: {
        Subject: {
          Data: 'Welcome to Origin BI - Registration Received',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await sesClient.send(command);
      const cc = this.configService.get<string>('EMAIL_CC') || 'None';
      console.log(`Registration email sent to ${toAddress}, CC: ${cc}`);
    } catch (error) {
      console.error('Error sending registration SES email:', error);
      // Don't throw, just log
    }
  }

  async createOrder(email: string, creditCount: number, reason: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate) throw new NotFoundException('Corporate account not found');

    if (creditCount <= 0) throw new BadRequestException('Invalid credit count');

    const totalAmount = creditCount * this.perCreditCost;
    const options = {
      amount: totalAmount * 100, // amount in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        creditCount: creditCount,
        userId: corporate.userId, // Use corporate user ID
        corporateAccountId: corporate.id,
        perCreditCost: this.perCreditCost,
        reason: reason || 'Credit Top-up',
      },
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return {
        orderId: order.id,
        amount: totalAmount * 100,
        currency: 'INR',
        key: this.configService.get<string>('RAZORPAY_KEY_ID'),
        perCreditCost: this.perCreditCost,
      };
    } catch (error: any) {
      console.error('Razorpay Error:', JSON.stringify(error, null, 2));
      const msg =
        error?.error?.description ||
        error.message ||
        'Failed to create payment order';
      throw new BadRequestException(msg); // Return specific error to frontend
    }
  }

  async verifyPayment(
    email: string,
    paymentDetails: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      paymentDetails;

    // 1. Verify Signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac(
      'sha256',
      this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    );
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new BadRequestException('Payment verification failed');
    }

    // 2. Fetch Order Details from Razorpay
    let order;
    try {
      order = await this.razorpay.orders.fetch(razorpay_order_id);
    } catch (e) {
      throw new InternalServerErrorException(
        'Failed to fetch order details from Razorpay',
      );
    }

    const notes = order.notes;
    const creditDelta = Number(notes.creditCount);
    const corporateAccountId = Number(notes.corporateAccountId);
    const createdByUserId = Number(notes.userId); // This is the corporate user id
    const perCreditCost = Number(notes.perCreditCost);
    const totalAmount = creditDelta * perCreditCost;
    const reason = notes.reason || 'Credit Top-up';

    // 3. Transactional Update
    const queryRunner = this.ledgerRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if transaction already recorded
      const existingLedger = await queryRunner.manager.findOne(
        CorporateCreditLedger,
        {
          where: { razorpayOrderId: razorpay_order_id },
        },
      );

      if (existingLedger) {
        return { success: true, message: 'Already processed' };
      }

      // Create Ledger Entry
      const ledgerEntry = this.ledgerRepo.create({
        corporateAccountId: corporateAccountId,
        creditDelta: creditDelta,
        ledgerType: 'CREDIT',
        reason: reason,
        createdByUserId: createdByUserId,
        perCreditCost: perCreditCost,
        totalAmount: totalAmount,
        paymentStatus: 'SUCCESS',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidOn: new Date(),
      });

      await queryRunner.manager.save(ledgerEntry);

      // Update Corporate Credits
      const corporate = await queryRunner.manager.findOne(CorporateAccount, {
        where: { id: corporateAccountId },
      });

      if (corporate) {
        corporate.availableCredits += creditDelta;
        corporate.totalCredits += creditDelta;
        await queryRunner.manager.save(corporate);
      }

      await queryRunner.commitTransaction();

      // --- Send Success Email ---
      try {
        const user = await this.userRepo.findOne({
          where: { id: createdByUserId },
        });
        const emailToSend = user ? user.email : email;

        // Get updated corporate account to ensure we have the name
        const updatedCorporate = await queryRunner.manager.findOne(
          CorporateAccount,
          {
            where: { id: corporateAccountId },
          },
        );

        await this.sendPaymentSuccessEmail(emailToSend, {
          name: updatedCorporate?.fullName || 'Valued Customer',
          paymentId: razorpay_payment_id,
          amount: totalAmount.toFixed(2),
          credits: creditDelta,
          date: new Date().toLocaleDateString(),
          dashboardUrl: this.configService.get<string>('FRONTEND_URL') ?? '',
        });
      } catch (emailErr) {
        console.error('Failed to send payment success email:', emailErr);
      }

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async recordPaymentFailure(
    razorpayOrderId: string,
    errorDescription: string,
  ) {
    let order;
    try {
      order = await this.razorpay.orders.fetch(razorpayOrderId);
    } catch (e) {
      console.error('Failed to fetch order for failure recording', e);
      return;
    }

    const notes = order.notes;
    const existing = await this.ledgerRepo.findOne({
      where: { razorpayOrderId: razorpayOrderId },
    });
    if (existing) return;

    const ledgerEntry = this.ledgerRepo.create({
      corporateAccountId: Number(notes.corporateAccountId),
      creditDelta: Number(notes.creditCount),
      ledgerType: 'CREDIT',
      reason: `Payment Failed: ${errorDescription}`,
      createdByUserId: Number(notes.userId),
      perCreditCost: Number(notes.perCreditCost),
      totalAmount: Number(notes.creditCount) * Number(notes.perCreditCost),
      paymentStatus: 'FAILED',
      razorpayOrderId: razorpayOrderId,
    });

    await this.ledgerRepo.save(ledgerEntry);
    return { success: true };
  }

  private async sendPaymentSuccessEmail(toAddress: string, data: any) {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const {
      getPaymentSuccessEmailTemplate,
    } = require('../mail/templates/payment-success.template');

    const sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });

    // Assets (Using public URLs or placeholders similar to Admin Service)
    const serviceUrl =
      this.configService.get<string>('CORPORATE_SERVICE_URL') ?? '';
    // Assets served statically from /assets (via MailAssetsController)
    const assets = {
      logo: `${serviceUrl}/email-assets/logo.png`,
      popper: `${serviceUrl}/email-assets/Popper.png`,
      pattern: `${serviceUrl}/email-assets/Pattern_mask.png`,
      footer: `${serviceUrl}/email-assets/Email_Vector.png`,
    };

    const htmlContent = getPaymentSuccessEmailTemplate(
      data.name,
      data.paymentId,
      data.amount,
      data.credits,
      data.date,
      `${data.dashboardUrl}/corporate/dashboard`,
      assets,
    );

    const params = {
      Source: this.configService.get<string>('EMAIL_FROM'),
      Destination: {
        ToAddresses: [toAddress],
        CcAddresses: this.configService.get<string>('EMAIL_CC')
          ? [this.configService.get<string>('EMAIL_CC')]
          : [],
      },
      Message: {
        Subject: {
          Data: 'Payment Successful - Credits Added',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await sesClient.send(command);
      console.log(`Payment success email sent to ${toAddress}`);
    } catch (error) {
      console.error('Failed to send payment success email:', error);
    }
  }

  async getLedger(
    email: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate) throw new NotFoundException('Corporate account not found');

    const { ILike, Raw } = require('typeorm');
    let whereCondition: any = { corporateAccountId: corporate.id };

    if (search) {
      whereCondition = [
        { corporateAccountId: corporate.id, reason: ILike(`%${search}%`) },
        { corporateAccountId: corporate.id, ledgerType: ILike(`%${search}%`) },
        {
          corporateAccountId: corporate.id,
          paymentStatus: ILike(`%${search}%`),
        },
        {
          corporateAccountId: corporate.id,
          razorpayPaymentId: ILike(`%${search}%`),
        },
        {
          corporateAccountId: corporate.id,
          createdAt: Raw(
            (alias) => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`,
          ),
        },
        {
          corporateAccountId: corporate.id,
          paidOn: Raw(
            (alias) => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`,
          ),
        },
      ];
    }

    const [items, total] = await this.ledgerRepo.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mappedItems = items.map((item) => ({
      id: item.id,
      corporate_account_id: item.corporateAccountId,
      credit_delta: item.creditDelta,
      ledger_type: item.ledgerType,
      reason: item.reason,
      created_by_user_id: item.createdByUserId,
      created_at: item.createdAt,
      per_credit_cost: item.perCreditCost,
      total_amount: item.totalAmount,
      payment_status: item.paymentStatus,
      paid_on: item.paidOn,
    }));

    return {
      data: mappedItems,
      total,
      page,
      limit,
    };
  }

  async topUpCredits(email: string, amount: number, reason: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate) throw new NotFoundException('Corporate account not found');

    corporate.availableCredits += amount;
    corporate.totalCredits += amount;
    await this.corporateRepo.save(corporate);

    const ledger = this.ledgerRepo.create({
      corporateAccountId: corporate.id,
      creditDelta: amount,
      ledgerType: 'CREDIT',
      reason: reason || 'Top-up',
      createdByUserId: corporate.userId, // This is already using userId, ensuring it is correct.
      paymentStatus: 'NA',
      totalAmount: 0,
    });
    await this.ledgerRepo.save(ledger);

    return {
      success: true,
      newAvailable: corporate.availableCredits,
      newTotal: corporate.totalCredits,
    };
  }

  async getMyEmployees(
    email: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) throw new NotFoundException('User not found');

    // Strategy A: Direct link
    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });

    // Strategy B: Fallback via corporateId in User table
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }
    if (!corporate) throw new NotFoundException('Corporate account not found');

    const query = this.registrationRepo
      .createQueryBuilder('registration')
      .leftJoinAndSelect('registration.user', 'user')
      .leftJoinAndSelect('registration.group', 'group')
      .where('registration.corporateAccountId = :corpId', {
        corpId: corporate.id,
      });

    if (search) {
      query.andWhere(
        '(registration.fullName ILIKE :search OR registration.mobileNumber ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      query.andWhere('registration.createdAt >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }
    if (endDate) {
      query.andWhere('registration.createdAt <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('registration.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: data || [],
      total: total || 0,
      page,
      limit,
    };
  }

  async getAssessmentSessions(
    email: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
    status?: string,
    userId?: number,
    type?: string,
  ) {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) throw new NotFoundException('User not found');

    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });

    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }
    if (!corporate) throw new NotFoundException('Corporate account not found');

    // GROUP ASSESSMENT LOGIC
    if (type === 'group') {
      const qb = this.groupAssessmentRepo
        .createQueryBuilder('ga')
        .leftJoinAndMapOne('ga.program', Program, 'p', 'p.id = ga.programId')
        .leftJoinAndMapOne('ga.group', Groups, 'g', 'g.id = ga.groupId')
        .where('ga.corporateAccountId = :corpId', { corpId: corporate.id });

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(g.name) LIKE :s)',
          { s },
        );
      }

      if (startDate)
        qb.andWhere('ga.validFrom >= :startDate', {
          startDate: `${startDate} 00:00:00`,
        });
      if (endDate)
        qb.andWhere('ga.validFrom <= :endDate', {
          endDate: `${endDate} 23:59:59`,
        });
      if (status) qb.andWhere('ga.status = :status', { status });

      if (sortBy) {
        let sortCol = '';
        switch (sortBy) {
          case 'exam_title':
            sortCol = 'p.assessment_title';
            break;
          case 'program_name':
            sortCol = 'p.name';
            break;
          case 'group_name':
            sortCol = 'g.name';
            break;
          case 'exam_status':
            sortCol = 'ga.status';
            break;
          case 'exam_starts_on':
            sortCol = 'ga.validFrom';
            break;
          case 'exam_ends_on':
            sortCol = 'ga.validTo';
            break;
          default:
            sortCol = 'ga.validFrom';
        }
        qb.orderBy(sortCol, sortOrder);
      } else {
        qb.orderBy('ga.id', 'DESC');
      }

      const [rows, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const data = rows.map((r) => ({
        id: r.id,
        programId: r.programId,
        program: r.program,
        status: r.status,
        validFrom: r.validFrom,
        validTo: r.validTo,
        createdAt: r.validFrom,
        groupId: r.groupId,
        groupName: (r as any).group?.name || 'N/A',
        userId: 0,
        registrationId: 0,
        currentLevel: 0,
        totalLevels: 0,
        totalCandidates: r.totalCandidates,
      }));

      return {
        data,
        total,
        page,
        limit,
      };
    }

    // INDIVIDUAL ASSESSMENT LOGIC
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u')
      .leftJoinAndSelect('s.registration', 'r')
      // Map Program entity
      .leftJoinAndMapOne('s.program', Program, 'p', 'p.id = s.programId')
      .where('r.corporateAccountId = :corpId', { corpId: corporate.id });

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere('(LOWER(r.fullName) LIKE :s OR LOWER(u.email) LIKE :s)', {
        s,
      });
    }

    if (startDate) {
      qb.andWhere('s.validFrom >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      });
    }
    if (endDate) {
      qb.andWhere('s.validFrom <= :endDate', {
        endDate: `${endDate} 23:59:59`,
      });
    }

    if (status && status !== 'All') {
      qb.andWhere('s.status = :status', { status });
    }

    if (userId) {
      qb.andWhere('u.id = :userId', { userId });
    }

    // Filter out grouped ones if fetching individual
    // Actually, individual view usually wants non-grouped.
    // But previously it showed everything?
    // Admin service logic: if 'individual' -> filter out grouped.
    // User request: "in the Employee management page also, introfuce ne tabs like in admin Individual assesment and group assessments"
    // So yes, split them.
    if (type === 'individual') {
      qb.andWhere('(s.groupId IS NULL OR s.groupId = 0)');
    }

    if (sortBy) {
      let sortCol = '';
      switch (sortBy) {
        // Mappings for AssessmentSessionsTable
        case 'exam_title':
          sortCol = 'p.assessment_title';
          break;
        case 'exam_status':
          sortCol = 's.status';
          break;
        case 'program_name':
          sortCol = 'p.name';
          break;
        case 'exam_starts_on':
          sortCol = 's.validFrom';
          break;
        case 'exam_ends_on':
          sortCol = 's.validTo';
          break;
        // Fallbacks/Others
        case 'name':
          sortCol = 'r.fullName';
          break;
        case 'email':
          sortCol = 'u.email';
          break;
        case 'status':
          sortCol = 's.status';
          break;
        case 'validFrom':
          sortCol = 's.validFrom';
          break;
        case 'validTo':
          sortCol = 's.validTo';
          break;
        default:
          sortCol = 's.createdAt';
      }
      qb.orderBy(sortCol, sortOrder);
    } else {
      qb.orderBy('s.createdAt', 'DESC');
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Populate groupName for individual sessions if they happen to belong to group but shown here (unlikely if filtered)
    // or just return as is.
    // But wait, the frontend expects `groupName` if we reuse the table.
    // Individual sessions usually don't have groupName or we can fetch it.
    // But if filtering `groupId IS NULL`, no group name needed.

    // However, we need to adapt structure to match frontend expectations if it changed.
    // Frontend `AssessmentSessionsTable` uses `session.groupName`.

    return {
      data: data || [],
      total: total || 0,
      page,
      limit,
    };
  }
  async getCounsellingAccess(email: string) {
    const { ILike, In } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) throw new NotFoundException('User not found');

    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }
    if (!corporate) throw new NotFoundException('Corporate account not found');

    const accessRecords = await this.accessRepo.find({
      where: { corporateAccountId: corporate.id, isEnabled: true },
    });

    if (accessRecords.length === 0) {
      return { data: [] };
    }

    const typeIds = accessRecords.map((a) => a.counsellingTypeId);
    const types = await this.typeRepo.find({
      where: { id: In(typeIds), isActive: true, isDeleted: false },
    });

    return { data: types };
  }

  async getCounsellingSessions(
    email: string,
    typeId: number,
    page = 1,
    limit = 10,
    search = '',
    status = '',
  ) {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) throw new NotFoundException('User not found');

    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }
    if (!corporate) throw new NotFoundException('Corporate account not found');

    const qb = this.counsellingSessionRepo
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.counsellingType', 'ct')
      .where('cs.corporateAccountId = :corpId', { corpId: corporate.id })
      .andWhere('cs.counsellingTypeId = :typeId', { typeId });

    if (status && status !== 'All') {
      qb.andWhere('cs.status = :status', { status });
    }

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(cs.mobileNumber) LIKE :s OR LOWER(cs.email) LIKE :s)',
        { s },
      );
    }

    qb.orderBy('cs.createdAt', 'DESC');

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data || [],
      total: total || 0,
      page,
      limit,
    };
  }

  async getCounsellingSessionById(email: string, id: number) {
    const { ILike } = require('typeorm');
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (!user) throw new NotFoundException('User not found');

    let corporate = await this.corporateRepo.findOne({
      where: { userId: user.id },
    });
    if (!corporate && user.corporateId) {
      corporate = await this.corporateRepo.findOne({
        where: { id: Number(user.corporateId) },
      });
    }
    if (!corporate) throw new NotFoundException('Corporate account not found');

    const session = await this.counsellingSessionRepo.findOne({
      where: { id, corporateAccountId: corporate.id },
      relations: ['counsellingType'],
    });

    if (!session)
      throw new NotFoundException('Session not found or access denied');

    return session;
  }

  async getSessionResponses(sessionId: number) {
    const responses = await this.counsellingResponseRepo.find({
      where: { sessionId: sessionId },
      relations: ['question', 'selectedOption'],
      order: { questionId: 'ASC' },
    });

    return responses.map((r) => ({
      id: r.id,
      question: r.question.questionTextEn,
      question_ta: r.question.questionTextTa,
      selected_option: r.selectedOption.optionTextEn,
      selected_option_ta: r.selectedOption.optionTextTa,
    }));
  }

  // ========================================================================
  // SEARCH BY REPORT NUMBER
  // ========================================================================
  async searchByReportNumber(reportNumber: string, corporateAccountId: number) {
    const query = `
      SELECT
        ar.report_number,
        ar.generated_at,
        r.full_name,
        r.mobile_number,
        r.gender,
        r.metadata as registration_metadata,
        u.email,
        pt.id as trait_id,
        pt.code as trait_code,
        pt.blended_style_name,
        pt.blended_style_desc,
        pt.color_rgb,
        pt.metadata as trait_metadata,
        aa.metadata as attempt_metadata,
        aa.total_score,
        aa.sincerity_index,
        aa.sincerity_class,
        aa.status as attempt_status,
        aa.completed_at,
        p.name as program_name,
        p.assessment_title,
        dpt.name as department_name,
        dt.name as degree_type_name
      FROM assessment_reports ar
      JOIN assessment_attempts aa ON aa.assessment_session_id = ar.assessment_session_id
      JOIN registrations r ON aa.registration_id = r.id
      JOIN users u ON aa.user_id = u.id
      LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
      LEFT JOIN programs p ON aa.program_id = p.id
      LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
      LEFT JOIN departments dpt ON dd.department_id = dpt.id
      LEFT JOIN degree_types dt ON dd.degree_type_id = dt.id
      WHERE ar.report_number = $1
        AND r.corporate_account_id = $2
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [
      reportNumber,
      corporateAccountId,
    ]);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Report not found for ID: ${reportNumber}`);
    }

    const row = result[0];

    // Parse DISC scores from attempt metadata
    const attemptMeta = row.attempt_metadata || {};
    const discScores = attemptMeta.disc_scores || attemptMeta.discScores || {};

    // Parse trait metadata for key strengths, role alignment, etc.
    const traitMeta = row.trait_metadata || {};
    const regMeta = row.registration_metadata || {};

    // Build the trait name for image mapping (e.g., "Supportive Energizer" -> "Supportive_Energizer")
    const traitName = (row.blended_style_name || '').trim();
    const traitImageKey = traitName.replace(/\s+/g, '_');

    return {
      reportNumber: row.report_number,
      generatedAt: row.generated_at,
      candidateName: row.full_name,
      email: row.email,
      mobile: row.mobile_number,
      gender: row.gender,
      programName: row.program_name,
      assessmentTitle: row.assessment_title,
      departmentName: row.department_name,
      degreeTypeName: row.degree_type_name,
      currentYear: regMeta.currentYear || regMeta.year_of_study || null,
      institutionName:
        regMeta.institutionName ||
        regMeta.institution ||
        regMeta.collegeName ||
        null,
      personalityTrait: {
        id: row.trait_id,
        code: row.trait_code,
        name: traitName,
        description: row.blended_style_desc,
        colorRgb:
          row.color_rgb &&
            !row.color_rgb.startsWith('#') &&
            !row.color_rgb.startsWith('rgb') &&
            row.color_rgb.includes(',')
            ? `rgb(${row.color_rgb})`
            : (row.color_rgb as string) || '#1ED36A',
        imageKey: traitImageKey,
        characterImage: `/traits/Corporate_${traitImageKey}.png`,
        strengthChartImage: `/charts/${traitImageKey}_Strength_Chart.png`,
        metadata: traitMeta,
      },
      discScores: {
        D: discScores.D || discScores.d || 0,
        I: discScores.I || discScores.i || 0,
        S: discScores.S || discScores.s || 0,
        C: discScores.C || discScores.c || 0,
      },
      totalScore: row.total_score,
      sincerityIndex: row.sincerity_index,
      sincerityClass: row.sincerity_class,
      attemptStatus: row.attempt_status,
      completedAt: row.completed_at,
      keyStrengths: traitMeta.key_strengths || traitMeta.keyStrengths || [],
      roleAlignment: traitMeta.role_alignment || traitMeta.roleAlignment || [],
      careerGrowthTips:
        traitMeta.career_growth_tips || traitMeta.careerGrowthTips || [],
      keyBehaviors: traitMeta.key_behaviors || traitMeta.keyBehaviors || [],
      typicalScenarios:
        traitMeta.typical_scenarios || traitMeta.typicalScenarios || [],
    };
  }
}
