import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  User as AdminUser,
  UserActionLog,
  ActionType,
  UserRole as AdminUserRole,
} from '@originbi/shared-entities';

@Injectable()
export class ForgotPasswordService {
  private authServiceUrl: string;

  constructor(
    @InjectRepository(AdminUser)
    private usersRepository: Repository<AdminUser>,
    @InjectRepository(UserActionLog)
    private actionLogRepository: Repository<UserActionLog>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:4002';
  }

  async withRetry<T>(operation: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      type Retryable = { response?: { status?: number }; code?: string; message?: string };
      const err = (typeof error === 'object' && error !== null) ? (error as Retryable) : {};

      const isRateLimit =
        (err.response?.status === 429) ||
        (err.code === 'TooManyRequestsException') ||
        (typeof err.message === 'string' && err.message.includes('Too Many Requests'));

      if (retries > 0 && isRateLimit) {
        console.warn(`Rate limit hit in ForgotPasswordService. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(res => setTimeout(res, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async checkAdminEligibility(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return false;
    if (user.role !== 'ADMIN') return false;
    return true;
  }

  async initiateAdminReset(email: string) {
    // 1. Validate User
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Access Denied. Not an Admin.');
    }

    // 2. Check Rate Limit
    const today = new Date().toISOString().split('T')[0];

    // Find existing log for today
    const existingLog = await this.actionLogRepository.findOne({
      where: {
        user: { id: user.id },
        actionType: ActionType.RESET_PASSWORD,
        role: AdminUserRole.ADMIN,
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
      await this.withRetry(() => firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/internal/cognito/forgot-password`,
          { email },
        ),
      ));
    } catch (error: unknown) {
      type ApiErr = { response?: { data?: any; status?: number }; message?: string; code?: string };
      const e = (typeof error === 'object' && error !== null) ? (error as ApiErr) : {};

      console.error(
        'Auth Service Forgot Password Failed:',
        e.response?.data || e.message || error,
      );
      throw new InternalServerErrorException(
        'Failed to initiate password reset. Please try again.',
      );
    }

    // 4. Log the Attempt (ONLY after successful call)
    if (existingLog) {
      existingLog.attemptCount += 1;
      await this.actionLogRepository.save(existingLog);
    } else {
      const newLog = this.actionLogRepository.create({
        user: user,
        userId: user.id,
        role: AdminUserRole.ADMIN,
        actionType: ActionType.RESET_PASSWORD,
        actionDate: today,
        attemptCount: 1,
      });
      await this.actionLogRepository.save(newLog);
    }

    return {
      success: true,
      message: 'Password reset initiated. Check your email.',
    };
  }
}
