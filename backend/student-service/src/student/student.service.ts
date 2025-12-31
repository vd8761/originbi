import { Injectable, ConsoleLogger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/student.entity';

import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';

@Injectable()
export class StudentService {
  private readonly logger = new ConsoleLogger(StudentService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
  ) { }

  async checkAssessmentStatus(userId: number) {
    const session = await this.sessionRepo.findOne({
      where: { userId: userId },
      order: { createdAt: 'DESC' }
    });

    if (!session) {
      return { isCompleted: false, status: 'NO_SESSION' };
    }

    return {
      isCompleted: session.status === 'COMPLETED',
      status: session.status
    };
  }

  async checkLoginStatus(email: string) {
    this.logger.log(`Debugging Login Status for: ${email}`);

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      return {
        redirectUrl: '/student/dashboard',
        isAssessmentMode: false,
        status: 'USER_NOT_FOUND',
        debug: { step: 'Find User', result: 'Not Found' }
      };
    }

    const incompleteStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'EXPIRED', 'CANCELLED'];

    // Find latest incomplete session
    const incompleteSession = await this.sessionRepo.findOne({
      where: {
        userId: user.id,
        status: In(incompleteStatuses)
      },
      order: { createdAt: 'DESC' }
    });

    if (incompleteSession) {
      this.logger.log(`Found Incomplete Session: ${incompleteSession.id} [${incompleteSession.status}]`);
      return {
        redirectUrl: '/student/assessment',
        isAssessmentMode: true,
        status: incompleteSession.status,
        debug: {
          step: 'Check Sessions',
          userId: user.id,
          foundIncomplete: true,
          sessionId: incompleteSession.id,
          sessionStatus: incompleteSession.status,
          reason: 'User has an unfinished assessment session.'
        }
      };
    }

    this.logger.log(`No Incomplete Sessions found for User ${user.id}. Redirecting to Dashboard.`);
    return {
      redirectUrl: '/student/dashboard',
      isAssessmentMode: false,
      status: 'COMPLETED',
      debug: {
        step: 'Check Sessions',
        userId: user.id,
        foundIncomplete: false,
        reason: 'All sessions are completed or none exist.'
      }
    };
  }

  async getProfile(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    return user;
  }

  async createTestStudent(email: string, fullName: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({
        email,
        metadata: { fullName }
      });
      await this.userRepo.save(user);
      return { message: 'Test user created successfully', user };
    }
    return { message: 'User already exists', user };
  }

  async getAssessmentProgress(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return [];

    const incompleteStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'EXPIRED', 'CANCELLED'];
    let session = await this.sessionRepo.findOne({
      where: { userId: user.id, status: In(incompleteStatuses) },
      order: { createdAt: 'DESC' }
    });

    if (!session) {
      session = await this.sessionRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' }
      });
    }

    if (!session) return [];

    const attempts = await this.attemptRepo.find({
      where: { assessmentSessionId: session.id },
      relations: ['assessmentLevel']
    });

    attempts.sort((a, b) => (a.assessmentLevel?.levelNumber || 0) - (b.assessmentLevel?.levelNumber || 0));

    return attempts.map(attempt => ({
      id: attempt.id,
      stepName: attempt.assessmentLevel?.name || `Level ${attempt.assessmentLevel?.levelNumber}`,
      description: attempt.assessmentLevel?.description || '',
      status: attempt.status,
      levelNumber: attempt.assessmentLevel?.levelNumber
    }));
  }
}
