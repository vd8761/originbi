import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../entities/student.entity';
import {
  UserActionLog,
  ActionType,
} from '../entities/student-action-log.entity';

@Injectable()
export class ForgotPasswordService {
  private authServiceUrl: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserActionLog)
    private actionLogRepository: Repository<UserActionLog>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:4002';
  }

  async initiateStudentReset(email: string) {
    console.log(`[ForgotPasswordService] Initiating reset for: ${email}`);

    // 1. Validate User (Case Insensitive) and Role
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.role'])
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .andWhere('LOWER(user.role) = :role', { role: 'student' })
      .getOne();

    if (!user) {
      console.log(`[ForgotPasswordService] User not found: ${email}`);
      throw new NotFoundException('User not found.');
    }

    // 2. Check Rate Limit
    const today = new Date().toISOString().split('T')[0];

    // Find existing log for today
    const existingLog = await this.actionLogRepository.findOne({
      where: {
        user: { id: user.id },
        actionType: ActionType.RESET_PASSWORD,
        actionDate: today,
      },
    });

    if (existingLog && existingLog.attemptCount >= 1) {
      console.log(
        `[ForgotPasswordService] Rate limit reached for user: ${user.id}`,
      );
      throw new BadRequestException(
        'Password reset limit reached. Try again tomorrow.',
      );
    }

    // 3. Call Auth Service to Trigger Reset
    try {
      console.log(
        `[ForgotPasswordService] Call Auth Service: ${this.authServiceUrl}/internal/cognito/forgot-password`,
      );
      await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/internal/cognito/forgot-password`,
          { email },
        ),
      );
      console.log(`[ForgotPasswordService] Auth Service success`);
    } catch (error: any) {
      console.error(
        'Auth Service Forgot Password Failed for User:',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.response?.data || error.message,
      );
      // Log full error for debugging
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to initiate password reset. Please try again.',
      );
    }

    // 4. Log the Attempt (ONLY after successful call)
    try {
      if (existingLog) {
        existingLog.attemptCount += 1;
        await this.actionLogRepository.save(existingLog);
      } else {
        const newLog = this.actionLogRepository.create({
          user: user,
          userId: user.id,
          actionType: ActionType.RESET_PASSWORD,
          actionDate: today,
          attemptCount: 1,
        });
        await this.actionLogRepository.save(newLog);
      }
    } catch (dbError) {
      console.error('Failed to save action log:', dbError);
      // We don't throw here to avoid failing the user request since the email was sent
    }

    return {
      success: true,
      message: 'If this email is registered, a reset code has been sent.',
    };
  }
}
