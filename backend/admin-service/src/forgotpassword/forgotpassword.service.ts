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
import { User } from '../users/user.entity';
import {
  UserActionLog,
  ActionType,
  UserRole,
} from '../entities/user-action-log.entity';

@Injectable()
export class ForgotPasswordService {
  private authServiceUrl: string;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserActionLog)
    private actionLogRepository: Repository<UserActionLog>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:4002';
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
        role: UserRole.ADMIN,
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.response?.data || error.message,
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
        role: UserRole.ADMIN,
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
