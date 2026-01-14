/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConsoleLogger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User } from '../entities/student.entity';

import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';

export interface AssessmentProgressItem {
  id: number;
  stepName: string;
  description: string;
  status: string;
  levelNumber?: number;
  completedQuestions: number;
  totalQuestions: number;
  unlockTime: Date | null;
  dateCompleted: Date | null;
  attemptId: number;
}

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
    @InjectRepository(AssessmentAnswer)
    private readonly answerRepo: Repository<AssessmentAnswer>,
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

    // Robust case-insensitive lookup
    let user = await this.userRepo.findOne({ where: { email: ILike(email) } });

    // Auto-provision Demo User if missing (Zero-Config Mock)
    if (!user && email.toLowerCase() === 'demo@originbi.com') {
      this.logger.log('Auto-provisioning Demo User in DB...');
      user = this.userRepo.create({
        email: 'demo@originbi.com',
        role: 'STUDENT',
        metadata: { fullName: 'Demo User' },
        createdAt: new Date()
      });
      await this.userRepo.save(user);
    }

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
      // --- DEMO USER LOOP LOGIC ---
      let shouldResume = true;
      if (email.toLowerCase() === 'demo@originbi.com') {
        const pending = await this.attemptRepo.count({
          where: {
            assessmentSessionId: incompleteSession.id,
            status: In(['NOT_STARTED', 'IN_PROGRESS'])
          }
        });

        if (pending === 0) {
          this.logger.log(`Demo Session ${incompleteSession.id} is finished (All levels done). Auto-Archiving to loop.`);
          await this.sessionRepo.update(incompleteSession.id, { status: 'COMPLETED' });
          shouldResume = false; // Don't return, let it fall through to create new session
        }
      }

      if (shouldResume) {
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
    }

    this.logger.log(`No Incomplete Sessions found for User ${user.id}.`);

    // --- DEMO MODE LOGIC ---
    if (email.toLowerCase() === 'demo@originbi.com') {
      this.logger.log('Demo User detected. Creating new Mock Session (Loop Mode).');
      try {
        const demoSession = await this.createDemoSession(user);
        if (demoSession) {
          return {
            redirectUrl: '/student/assessment',
            isAssessmentMode: true,
            status: 'NOT_STARTED',
            debug: { reason: 'Demo User Auto-Session' }
          };
        }
      } catch (err) {
        this.logger.error('Failed to create Demo Session', err);
      }
    }
    // -----------------------

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
    const user = await this.userRepo.findOne({ where: { email: ILike(email) } });
    return user;
  }

  async createTestStudent(email: string, fullName: string) {
    let user = await this.userRepo.findOne({ where: { email: ILike(email) } });
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

  async getAssessmentProgress(email: string): Promise<AssessmentProgressItem[]> {
    this.logger.log(`[getAssessmentProgress] Fetching progress for: ${email}`);

    // Use ILike for case-insensitive match
    const user = await this.userRepo.findOne({ where: { email: ILike(email) } });

    if (!user) {
      this.logger.warn(`[getAssessmentProgress] User not found for email: ${email}`);
      return [];
    }
    this.logger.log(`[getAssessmentProgress] User found: ${user.id}`);

    const incompleteStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'EXPIRED', 'CANCELLED'];
    let session = await this.sessionRepo.findOne({
      where: { userId: user.id, status: In(incompleteStatuses) },
      order: { createdAt: 'DESC' }
    });

    if (!session) {
      this.logger.log(`[getAssessmentProgress] No incomplete session, checking for any session...`);
      session = await this.sessionRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' }
      });
    }

    if (!session) {
      this.logger.warn(`[getAssessmentProgress] No session found for User ${user.id}`);
      return [];
    }
    this.logger.log(`[getAssessmentProgress] Session found: ${session.id} [${session.status}]`);

    let attempts = await this.attemptRepo.find({
      where: { assessmentSessionId: session.id },
      relations: ['assessmentLevel']
    });

    // For Demo User, hide non-mandatory levels (cleanup visual clutter)
    if (email.toLowerCase() === 'demo@originbi.com') {
      attempts = attempts.filter(a => a.assessmentLevel && a.assessmentLevel.isMandatory);
    }

    this.logger.log(`[getAssessmentProgress] Attempts found: ${attempts.length}`);

    attempts.sort((a, b) => (a.assessmentLevel?.levelNumber || 0) - (b.assessmentLevel?.levelNumber || 0));

    const progressData: AssessmentProgressItem[] = [];
    let previousAttempt: AssessmentAttempt | null = null;

    for (const attempt of attempts) {
      const answeredCount = await this.answerRepo.count({
        where: { assessmentAttemptId: attempt.id, status: 'ANSWERED' }
      });
      const totalCount = await this.answerRepo.count({
        where: { assessmentAttemptId: attempt.id }
      });

      const level = attempt.assessmentLevel;
      let status = attempt.status;
      let unlockTime: Date | null = null;

      // Unlock Logic for Level 2+
      if (level && level.levelNumber > 1) {
        if (!previousAttempt || previousAttempt.status !== 'COMPLETED') {
          // Locked if previous is not completed
          status = 'LOCKED';
        } else {
          // Check Time Lock
          const completionDate = previousAttempt.completedAt || previousAttempt.updatedAt;

          if (level.unlockAfterHours > 0 && completionDate) {
            const unlockDate = new Date(completionDate);
            unlockDate.setHours(unlockDate.getHours() + level.unlockAfterHours);

            if (new Date() < unlockDate) {
              status = 'LOCKED';
              unlockTime = unlockDate;
            }
          }
        }
      }

      // If attempt already started/completed, ignore lock
      if (attempt.status === 'IN_PROGRESS' || attempt.status === 'COMPLETED') {
        status = attempt.status;
        unlockTime = null;
      }

      progressData.push({
        id: attempt.id,
        stepName: level?.name || `Level ${level?.levelNumber}`,
        description: level?.description || '',
        status: status,
        levelNumber: level?.levelNumber,
        completedQuestions: answeredCount,
        totalQuestions: totalCount > 0 ? totalCount : 60,
        unlockTime: unlockTime,
        dateCompleted: attempt.completedAt || attempt.updatedAt,
        attemptId: attempt.id // Ensure attemptId is passed
      });

      previousAttempt = attempt;
    }

    return progressData;
  }


  async createDemoSession(user: User): Promise<AssessmentSession | null> {

    // 1. Find Existing Demo Program (Dynamic Lookup)
    const demoProgramArr = (await this.sessionRepo.query(
      `SELECT id FROM programs WHERE is_demo = true OR name ILIKE 'Demo' OR code ILIKE '%demo%' ORDER BY id DESC LIMIT 1`
    )) as { id: number }[];

    if (!demoProgramArr || demoProgramArr.length === 0) {
      this.logger.error('No Demo Program found in database. Please create one.');
      return null;
    }

    const PROGRAM_ID = demoProgramArr[0].id;
    this.logger.log(`Using Demo Program ID: ${PROGRAM_ID}`);

    // 2. Find Demo Registration
    const registration = (await this.sessionRepo.query(
      `SELECT id FROM registrations WHERE user_id = $1 AND program_id = $2 LIMIT 1`,
      [user.id, PROGRAM_ID]
    )) as { id: number }[];

    if (!registration || registration.length === 0) {
      this.logger.warn('Demo Registration not found. Creating one on the fly.');

      // Auto-create registration if missing
      const newReg = (await this.sessionRepo.query(`
        INSERT INTO registrations (user_id, program_id, status, payment_status, full_name, mobile_number, created_at, updated_at)
        VALUES ($1, $2, 'COMPLETED', 'NOT_REQUIRED', 'Demo User', '0000000000', NOW(), NOW())
        RETURNING id
      `, [user.id, PROGRAM_ID])) as { id: number }[];

      if (newReg && newReg.length > 0) {
        registration.push({ id: newReg[0].id });
      } else {
        return null;
      }
    }
    const regId = registration[0].id;

    // 3. Create Session
    const session = this.sessionRepo.create({
      userId: user.id,
      registrationId: regId,
      programId: PROGRAM_ID,
      status: 'NOT_STARTED',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const savedSession = await this.sessionRepo.save(session);

    // 4. Find ALL Active Levels (Mandatory Only)
    const levels = await this.levelRepo.find({
      where: { isMandatory: true },
      order: { levelNumber: 'ASC' }
    });
    if (!levels || levels.length === 0) {
      this.logger.error('No Assessment Levels found');
      return null;
    }

    // 5. Create Attempts for ALL Levels
    for (const level of levels) {
      const attempt = this.attemptRepo.create({
        assessmentSessionId: savedSession.id,
        assessmentLevelId: level.id,
        userId: user.id,
        registrationId: regId,
        programId: PROGRAM_ID,
        // Level 1 is NOT_STARTED, others can be NOT_STARTED (UI logic handles locking)
        status: 'NOT_STARTED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const savedAttempt = await this.attemptRepo.save(attempt);

      // 6. Insert Random Questions (Max 12 per level)
      // This ensures Level 1 gets questions, and if Level 2 has questions in DB, it gets them too.
      await this.answerRepo.query(`
           INSERT INTO assessment_answers (
              assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
              main_question_id, question_source, status, question_sequence, created_at, updated_at
           )
           SELECT $1, $2, $3, $4, $6, $5, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY RANDOM()), NOW(), NOW()
           FROM assessment_questions 
           WHERE assessment_level_id = $5 
           ORDER BY RANDOM()
           LIMIT 12
       `, [savedAttempt.id, savedSession.id, user.id, regId, level.id, PROGRAM_ID]);
    }

    this.logger.log(`Created Demo Session ${savedSession.id} with Attempts for ${levels.length} Levels.`);
    return savedSession;
  }
}
