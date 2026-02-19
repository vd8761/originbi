/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConsoleLogger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Not, IsNull } from 'typeorm';
import { AssessmentReport } from '../entities/assessment-report.entity';
import { getAssessmentCompletionEmailTemplate } from '../mail/templates/assessment-completion.template';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../entities/student.entity';

import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Program } from '../entities/program.entity';
import {
  Registration,
  Gender,
  RegistrationStatus,
  PaymentStatus,
  AffiliateAccount,
  AffiliateReferralTransaction,
} from '@originbi/shared-entities';
import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';
import { getStudentWelcomeEmailTemplate } from '../mail/templates/student-welcome.template';

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
    @InjectRepository(AssessmentReport)
    private assessmentReportRepository: Repository<AssessmentReport>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly httpService: HttpService,
    @InjectRepository(AffiliateAccount)
    private readonly affiliateRepo: Repository<AffiliateAccount>,
    @InjectRepository(AffiliateReferralTransaction)
    private readonly affiliateTransactionRepo: Repository<AffiliateReferralTransaction>,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit() {
    // Check if imported functions are used to avoid TS error, or just use them
    // They are used in handleAssessmentCompletion
  }
  private async createCognitoUser(email: string, password: string) {
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:4000'; // Default or Env
    try {
      const res = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/internal/cognito/users`,
          { email, password },
          { proxy: false },
        ),
      );
      return res.data as { sub?: string };
    } catch (err: any) {
      this.logger.error(
        'Error creating Cognito user:',
        err.response?.data || err.message,
      );
      // If user exists in Cognito but not in DB (edge case), we might want to proceed.
      // But for now, we throw to match admin-service behavior or at least log it.
      // If error says "User already exists", we might want to fetch the sub.
      // For simplicity in this public registration, we assume if it fails, registration fails
      // unless it's an "User already exists" error which we checked in DB earlier.
      // However, check DB first is not enough if Cognito has it.
      throw new Error('Failed to create user in Auth Service');
    }
  }

  async checkAssessmentStatus(userId: number) {
    const session = await this.sessionRepo.findOne({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });

    if (!session) {
      return { isCompleted: false, status: 'NO_SESSION' };
    }

    return {
      isCompleted: session.status === 'COMPLETED',
      status: session.status,
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
        metadata: { fullName: 'Demo User', hasChangedPassword: true },
        createdAt: new Date(),
      });
      await this.userRepo.save(user);
    }

    if (!user) {
      this.logger.warn(`User not found for email: ${email}`);
      return {
        redirectUrl: '/student/dashboard',
        isAssessmentMode: false,
        status: 'USER_NOT_FOUND',
        debug: { step: 'Find User', result: 'Not Found' },
      };
    }

    // First Login Logic (No DB Schema Identity)
    // If loginCount is low (<=1) and we haven't recorded a password change yet.
    const isFirstLogin =
      user.loginCount <= 1 && !user.metadata?.hasChangedPassword;

    if (isFirstLogin) {
      this.logger.log(
        `User ${email} requires mandatory password reset (First Login).`,
      );
      return {
        redirectUrl: '/student/first-time-reset',
        isAssessmentMode: false,
        status: 'FIRST_LOGIN',
        debug: { step: 'Check First Login', result: 'Mandatory Reset' },
      };
    }

    const incompleteStatuses = [
      'NOT_STARTED',
      'IN_PROGRESS',
      'EXPIRED',
      'CANCELLED',
    ];

    // Find latest incomplete session
    const incompleteSession = await this.sessionRepo.findOne({
      where: {
        userId: user.id,
        status: In(incompleteStatuses),
      },
      order: { createdAt: 'DESC' },
    });

    if (incompleteSession) {
      // --- DEMO USER LOOP LOGIC ---
      let shouldResume = true;
      if (email.toLowerCase() === 'demo@originbi.com') {
        const pending = await this.attemptRepo.count({
          where: {
            assessmentSessionId: incompleteSession.id,
            status: In(['NOT_STARTED', 'IN_PROGRESS']),
          },
        });

        if (pending === 0) {
          this.logger.log(
            `Demo Session ${incompleteSession.id} is finished (All levels done). Auto-Archiving to loop.`,
          );
          await this.sessionRepo.update(incompleteSession.id, {
            status: 'COMPLETED',
          });
          shouldResume = false; // Don't return, let it fall through to create new session
        }
      }

      if (shouldResume) {
        this.logger.log(
          `Found Incomplete Session: ${incompleteSession.id} [${incompleteSession.status}]`,
        );
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
            reason: 'User has an unfinished assessment session.',
          },
        };
      }
    }

    this.logger.log(`No Incomplete Sessions found for User ${user.id}.`);

    // --- DEMO MODE LOGIC ---
    if (email.toLowerCase() === 'demo@originbi.com') {
      this.logger.log(
        'Demo User detected. Creating new Mock Session (Loop Mode).',
      );
      try {
        const demoSession = await this.createDemoSession(user);
        if (demoSession) {
          return {
            redirectUrl: '/student/assessment',
            isAssessmentMode: true,
            status: 'NOT_STARTED',
            debug: { reason: 'Demo User Auto-Session' },
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
        reason: 'All sessions are completed or none exist.',
      },
    };
  }

  async getProfile(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    return user;
  }

  async createTestStudent(email: string, fullName: string) {
    let user = await this.userRepo.findOne({ where: { email: ILike(email) } });
    if (!user) {
      user = this.userRepo.create({
        email,
        metadata: { fullName },
      });
      await this.userRepo.save(user);
      return { message: 'Test user created successfully', user };
    }
    return { message: 'User already exists', user };
  }

  async getAssessmentProgress(
    email: string,
  ): Promise<AssessmentProgressItem[]> {
    this.logger.log(`[getAssessmentProgress] Fetching progress for: ${email}`);

    // Use ILike for case-insensitive match
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });

    if (!user) {
      this.logger.warn(
        `[getAssessmentProgress] User not found for email: ${email}`,
      );
      return [];
    }
    this.logger.log(`[getAssessmentProgress] User found: ${user.id}`);

    const incompleteStatuses = [
      'NOT_STARTED',
      'IN_PROGRESS',
      'EXPIRED',
      'CANCELLED',
    ];
    let session = await this.sessionRepo.findOne({
      where: { userId: user.id, status: In(incompleteStatuses) },
      order: { createdAt: 'DESC' },
    });

    if (!session) {
      this.logger.log(
        `[getAssessmentProgress] No incomplete session, checking for any session...`,
      );
      session = await this.sessionRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });
    }

    if (!session) {
      this.logger.warn(
        `[getAssessmentProgress] No session found for User ${user.id}`,
      );
      return [];
    }
    this.logger.log(
      `[getAssessmentProgress] Session found: ${session.id} [${session.status}]`,
    );

    let attempts = await this.attemptRepo.find({
      where: { assessmentSessionId: session.id },
      relations: ['assessmentLevel'],
    });

    // For Demo User, hide non-mandatory levels (cleanup visual clutter)
    if (email.toLowerCase() === 'demo@originbi.com') {
      attempts = attempts.filter(
        (a) => a.assessmentLevel && a.assessmentLevel.isMandatory,
      );
    }

    this.logger.log(
      `[getAssessmentProgress] Attempts found: ${attempts.length}`,
    );

    attempts.sort(
      (a, b) =>
        (a.assessmentLevel?.levelNumber || 0) -
        (b.assessmentLevel?.levelNumber || 0),
    );

    const progressData: AssessmentProgressItem[] = [];
    let previousAttempt: AssessmentAttempt | null = null;

    for (const attempt of attempts) {
      const answeredCount = await this.answerRepo.count({
        where: { assessmentAttemptId: attempt.id, status: 'ANSWERED' },
      });
      const totalCount = await this.answerRepo.count({
        where: { assessmentAttemptId: attempt.id },
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
          const completionDate =
            previousAttempt.completedAt || previousAttempt.updatedAt;

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
        totalQuestions: totalCount > 0
          ? totalCount
          : (level?.levelNumber === 2 || level?.name.includes('ACI') || level?.patternType === 'ACI' ? 25 : 60),
        unlockTime: unlockTime,
        dateCompleted: attempt.completedAt || attempt.updatedAt,
        attemptId: attempt.id, // Ensure attemptId is passed
      });

      previousAttempt = attempt;
    }

    return progressData;
  }

  async createDemoSession(user: User): Promise<AssessmentSession | null> {
    // 1. Find Existing Demo Program (Dynamic Lookup)
    const demoProgramArr = await this.sessionRepo.query(
      `SELECT id FROM programs WHERE is_demo = true OR name ILIKE '%Demo%' OR code ILIKE '%demo%' ORDER BY id DESC LIMIT 1`,
    );

    if (!demoProgramArr || demoProgramArr.length === 0) {
      this.logger.error(
        'No Demo Program found in database. Please create one.',
      );
      return null;
    }

    const PROGRAM_ID = demoProgramArr[0].id;
    this.logger.log(`Using Demo Program ID: ${PROGRAM_ID}`);

    // 2. Find Demo Registration
    const registration = await this.sessionRepo.query(
      `SELECT id FROM registrations WHERE user_id = $1 AND program_id = $2 LIMIT 1`,
      [user.id, PROGRAM_ID],
    );

    if (!registration || registration.length === 0) {
      this.logger.warn('Demo Registration not found. Creating one on the fly.');

      // Auto-create registration if missing
      const newReg = await this.sessionRepo.query(
        `
        INSERT INTO registrations (user_id, program_id, status, payment_status, full_name, mobile_number, created_at, updated_at)
        VALUES ($1, $2, 'COMPLETED', 'NOT_REQUIRED', 'Demo User', '0000000000', NOW(), NOW())
        RETURNING id
      `,
        [user.id, PROGRAM_ID],
      );

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
      updatedAt: new Date(),
    });
    const savedSession = await this.sessionRepo.save(session);

    // 4. Find ALL Active Levels (Mandatory Only)
    const levels = await this.levelRepo.find({
      where: { isMandatory: true },
      order: { levelNumber: 'ASC' },
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
        updatedAt: new Date(),
      });
      const savedAttempt = await this.attemptRepo.save(attempt);

      // 6. Insert Random Questions (Max 12 per level)
      // This ensures Level 1 gets questions, and if Level 2 has questions in DB, it gets them too.
      await this.answerRepo.query(
        `
            INSERT INTO assessment_answers (
              assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
              main_question_id, question_source, status, question_sequence, created_at, updated_at
            )
            SELECT $1, $2, $3, $4, $6, $5, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY RANDOM()), NOW(), NOW()
            FROM assessment_questions 
            WHERE assessment_level_id = $5 
            ORDER BY RANDOM()
            LIMIT 12
        `,
        [
          savedAttempt.id,
          savedSession.id,
          user.id,
          regId,
          level.id,
          PROGRAM_ID,
        ],
      );
    }

    this.logger.log(
      `Created Demo Session ${savedSession.id} with Attempts for ${levels.length} Levels.`,
    );
    return savedSession;
  }

  async completeFirstLogin(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });
    if (user) {
      user.metadata = { ...user.metadata, hasChangedPassword: true };
      await this.userRepo.save(user);
      this.logger.log(`Updated hasChangedPassword metadata for user: ${email}`);
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC REGISTER
  // ---------------------------------------------------------------------------
  async register(dto: CreateRegistrationDto) {
    this.logger.log(`[Register Debug] Register called for: ${dto.email}`);
    this.logger.log(`[Register Debug] Payload: ${JSON.stringify(dto)}`);
    this.logger.log(
      `[Register Debug] Public registration attempt for: ${dto.email}`,
    );

    try {
      // 1. Check if User exists
      let user = await this.userRepo.findOne({
        where: { email: ILike(dto.email) },
      });
      if (user) {
        this.logger.warn(`User ${dto.email} already exists.`);
        // return { success: false, message: 'User already exists' };
        // idempotency? or throw error? For now, throw error.
        throw new BadRequestException('User already exists');
      }

      // 2. Create User in Cognito
      let cognitoSub = '';
      try {
        const cognitoRes = await this.createCognitoUser(
          dto.email,
          dto.password,
        );
        cognitoSub = cognitoRes.sub || '';
      } catch (e) {
        this.logger.error('Cognito creation failed', e);
        // Fallback or re-throw?
        // If we want to allow login, we must have it. Re-throw.
        throw e;
      }

      // 3. Create User Entity
      // (In a real scenario, we might call Cognito here, but for now we assume
      // auth-service handles login via simple Db check or the user will be created in Cognito later)
      // Actually, the requirement says "Call auth-service...". To keep it simple and robust
      // for this specific codebase state, we'll focus on DB creation. The auth-service likely has a trigger or
      // we can add the call if needed.

      user = this.userRepo.create({
        email: dto.email,
        role: 'STUDENT',
        // cognitoSub: cognitoSub, // If User entity has this field. It doesn't seem to have it in the file view I saw earlier.
        // I checked student.entity.ts earlier and it didn't have cognitoSub column explicitly shown in `Showing lines 1 to 38`.
        // Let's check if I missed it.
        // If not, we just rely on email matching.
        metadata: {
          fullName: dto.full_name,
          mobileNumber: dto.mobile_number,
          countryCode: dto.country_code ?? '+91',
          gender: dto.gender,
          hasChangedPassword: true, // Assuming allow login immediately
          cognitoSub: cognitoSub, // Store in metadata if not in column
        },
        createdAt: new Date(),
      });
      await this.userRepo.save(user);

      // 4. Find Program
      this.logger.log(`[Register] Payload: ${JSON.stringify(dto)}`);

      const programCode = dto.program_code || 'SCHOOL_STUDENT';
      const program = await this.sessionRepo.manager.findOne(Program, {
        where: { code: programCode },
      });

      if (!program) {
        throw new Error(`Program ${programCode} not found`);
      }

      // 5. Create Registration (Force TS Check)
      const registration = this.sessionRepo.manager.create(Registration, {
        userId: user.id,
        registrationSource: 'SELF',
        fullName: dto.full_name,
        mobileNumber: dto.mobile_number,
        countryCode: dto.country_code ?? '+91',
        gender: dto.gender as Gender,
        schoolLevel: dto.school_level,
        schoolStream: dto.school_stream,
        programId: program.id,
        studentBoard: dto.student_board || dto.studentBoard, // Explicit assignment
        // metadata: { ... } below also stores it
        status: 'COMPLETED' as RegistrationStatus,
        paymentStatus: 'NOT_REQUIRED' as PaymentStatus,
        metadata: {
          groupCode: dto.group_code,
          studentBoard: dto.student_board || dto.studentBoard, // Store in metadata as well
          sendEmail: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const savedReg = await this.sessionRepo.manager.save(
        Registration,
        registration,
      );

      // Handle Affiliate Referral if code is provided
      if (dto.referral_code) {
        const affiliate = await this.affiliateRepo.findOne({
          where: { referralCode: dto.referral_code, isActive: true },
        });

        if (affiliate) {
          this.logger.log(
            `Referral code ${dto.referral_code} found for affiliate ${affiliate.id}`,
          );

          // Determine commission
          const registrationAmount = Number(
            this.configService.get('REGISTRATION_COST') || 500,
          );
          const commissionPercentage = affiliate.commissionPercentage || 0;
          const earnedCommission =
            (registrationAmount * commissionPercentage) / 100;

          // Create the referral transaction record
          const transactionData = {
            affiliateAccountId: Number(affiliate.id),
            registrationId: Number(savedReg.id),
            registrationAmount,
            commissionPercentage,
            earnedCommissionAmount: earnedCommission,
            settlementStatus: 0 as any, // 0 - Not Settled
            metadata: {
              studentName: dto.full_name,
              studentEmail: dto.email,
              referralCode: dto.referral_code,
            },
          };

          const referralTransaction =
            this.affiliateTransactionRepo.create(transactionData);
          await this.affiliateTransactionRepo.save(referralTransaction);
          this.logger.log(
            `Affiliate referral transaction recorded for registration ${savedReg.id}`,
          );

          // Update aggregate fields on AffiliateAccount
          affiliate.referralCount = (Number(affiliate.referralCount) || 0) + 1;
          affiliate.totalEarnedCommission =
            (Number(affiliate.totalEarnedCommission) || 0) + earnedCommission;
          affiliate.totalPendingCommission =
            (Number(affiliate.totalPendingCommission) || 0) + earnedCommission;
          await this.affiliateRepo.save(affiliate);
          this.logger.log(
            `Affiliate ${affiliate.id} aggregates updated: referralCount=${affiliate.referralCount}, totalEarned=${affiliate.totalEarnedCommission}, totalPending=${affiliate.totalPendingCommission}`,
          );
        } else {
          this.logger.warn(
            `Invalid or inactive referral code provided: ${dto.referral_code}`,
          );
        }
      }

      // 6. Create Assessment Session with Schedule
      // Schedule: Start = Now + 5 mins, End = Now + 7 days
      const now = new Date();
      const validFrom = new Date(now.getTime() + 5 * 60000); // +5 mins
      const validTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

      const session = this.sessionRepo.create({
        userId: user.id,
        registrationId: savedReg.id,
        programId: program.id,
        status: 'NOT_STARTED',
        validFrom: validFrom,
        validTo: validTo,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedSession = await this.sessionRepo.save(session);

      // 7. Create Attempts (Level 1 Mandated)
      // Fetch Level 1
      const levels = await this.levelRepo.find({
        where: { isMandatory: true },
        order: { levelNumber: 'ASC' },
      });

      this.logger.log(`[Register Debug] Found ${levels.length} mandatory levels`);

      for (const level of levels) {
        this.logger.log(`[Register Debug] Processing Level: ${level.id} - ${level.name}`);
        const attempt = this.attemptRepo.create({
          assessmentSessionId: savedSession.id,
          assessmentLevelId: level.id,
          userId: user.id,
          registrationId: savedReg.id,
          programId: program.id,
          status: 'NOT_STARTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const savedAttempt = await this.attemptRepo.save(attempt);

        // Generate Questions for Level 1
        if (level.levelNumber === 1 || level.name.includes('Level 1')) {
          this.logger.log(`[Register Debug] Generating questions for Level 1 (Attempt ID: ${savedAttempt.id})`);
          await this.generateQuestionsForAttempt(
            savedAttempt,
            user,
            savedReg,
            level,
          );
        }
      }

      // 8. Send Welcome Email
      if (registration.metadata?.sendEmail) {
        const validFrom = session.validFrom
          ? new Date(session.validFrom)
          : new Date();
        // program title?
        const programTitle = program.assessmentTitle || program.name;

        try {
          await this.sendWelcomeEmail(
            dto.email,
            dto.full_name,
            dto.password, // We need the password here. DTO has it.
            validFrom,
            programTitle,
          );
          this.logger.log(`Welcome email sent successfully to ${dto.email}`);
        } catch (emailErr) {
          this.logger.error(
            `[Email Failed] Failed to send welcome email to ${dto.email}`,
          );
          this.logger.error(
            `[Email Error Details] ${JSON.stringify(emailErr, Object.getOwnPropertyNames(emailErr))}`,
          );
          // Do not fail registration if email fails
        }
      } else {
        this.logger.log(
          `[Email Debug] Skipping email for ${dto.email} (sendEmail metadata is false/missing)`,
        );
      }

      return {
        success: true,
        userId: user.id,
        registrationId: savedReg.id,
        message: 'Registration successful. Exam scheduled.',
      };
    } catch (error) {
      this.logger.error(
        `[Register Critical Error] ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  // Helper to generate questions locally (simplified version of admin-service logic)
  private async generateQuestionsForAttempt(
    attempt: AssessmentAttempt,
    user: User,
    reg: Registration,
    level: AssessmentLevel,
  ) {
    // ---------------------------------------------------------
    // LEVEL 2 (ACI) LOGIC
    // ---------------------------------------------------------
    if (level.levelNumber === 2 || level.name.includes('Level 2') || level.name.includes('ACI')) {
      this.logger.log(`[Assessment] Generating Level 2 (ACI) questions for User ${user.id}`);

      // 1. Get Personality Trait ID from previous session metadata or report
      // Assumption: Level 1 completion stored the dominant trait ID in session metadata
      const session = await this.sessionRepo.findOne({
        where: { id: attempt.assessmentSessionId },
      });

      let traitId = session?.metadata?.personalityTraitId || session?.metadata?.dominantTraitId;

      if (!traitId) {
        // Fallback: Check for a completed attempt in this session that has a dominant trait (Level 1)
        this.logger.log(`[Assessment] Trait ID not in metadata. Checking previous attempts for Session ${attempt.assessmentSessionId}...`);
        const previousAttempt = await this.attemptRepo.findOne({
          where: {
            assessmentSessionId: attempt.assessmentSessionId,
            dominantTraitId: Not(IsNull()),
            status: 'COMPLETED'
          },
          order: { completedAt: 'DESC' }
        });

        if (previousAttempt && previousAttempt.dominantTraitId) {
          traitId = previousAttempt.dominantTraitId;
          this.logger.log(`[Assessment] Found Trait ID ${traitId} from previous attempt ${previousAttempt.id}`);
        }
      }

      if (!traitId) {
        this.logger.error(`[Assessment Error] Level 2 requires a Personality Trait ID, but none found in session metadata or previous attempts for User ${user.id}`);
        throw new Error('Personality Trait not found. Please complete Level 1 first.');
      }

      this.logger.log(`[Assessment] Fetching 25 questions for Trait ID: ${traitId}`);

      let query = `
        INSERT INTO assessment_answers (
          assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
          main_question_id, question_source, status, question_sequence, created_at, updated_at
        )
        SELECT $1::bigint, $2::bigint, $3::bigint, $4::bigint, $6::bigint, $5::bigint, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY RANDOM()), NOW(), NOW()
        FROM assessment_questions 
        WHERE assessment_level_id = $5::bigint 
          AND is_active = true
          AND is_deleted = false
          AND personality_trait_id = $7::bigint
      `;

      const queryParams = [
        attempt.id,
        attempt.assessmentSessionId,
        user.id,
        reg.id,
        level.id,
        attempt.programId,
        traitId
      ];

      // Board Filtering strictly for School Programs (ID 1)
      // Check attempt.programId or reg.program.id. Assuming 1 is School based on groupReportHelper usage.
      if (Number(attempt.programId) === 1) {
        const studentBoard = session?.metadata?.studentBoard || reg.metadata?.studentBoard;
        if (studentBoard) {
          this.logger.log(`[Assessment] Applying Board Filter for School Program: ${studentBoard}`);
          query += ` AND board = $8`;
          queryParams.push(studentBoard);
        } else {
          this.logger.warn(`[Assessment] School Program detected but no Student Board found in metadata. Generating without board filter.`);
        }
      }

      query += ` ORDER BY RANDOM() LIMIT 25`;

      await this.answerRepo.query(query, queryParams);

      return; // Done for Level 2
    }

    // ---------------------------------------------------------
    // LEVEL 1 (BEHAVIORAL) LOGIC
    // ---------------------------------------------------------
    // 1. Determine Program Type & Board
    const program = await this.sessionRepo.manager.findOne(Program, {
      where: { id: attempt.programId },
    });
    const isSchool = program?.code === 'SCHOOL_STUDENT';
    const studentBoard = reg.metadata?.studentBoard || null;
    let selectedSetNumber = 1;

    // 2. Select Set Number
    if (isSchool && studentBoard) {
      // School: Strict Board Filter
      const loadedSets = await this.answerRepo.query(
        `SELECT DISTINCT set_number FROM assessment_questions 
         WHERE assessment_level_id = $1 
           AND is_active = true 
           AND board = $2`, // Ensure we look for MAIN questions for sets
        [level.id, studentBoard],
      );

      if (loadedSets && loadedSets.length > 0) {
        const randomIndex = Math.floor(Math.random() * loadedSets.length);
        selectedSetNumber = loadedSets[randomIndex].set_number;
        this.logger.log(`[Assessment] Selected Set ${selectedSetNumber} for Board ${studentBoard}`);
      } else {
        this.logger.warn(`[Assessment] No sets found for Board ${studentBoard}, defaulting to Set 1`);
        selectedSetNumber = 1;
      }
    } else {
      // Non-School or No Board: Random available set
      const loadedSets = await this.answerRepo.query(
        `SELECT DISTINCT set_number FROM assessment_questions 
         WHERE assessment_level_id = $1 
           AND is_active = true`,
        [level.id],
      );

      if (loadedSets && loadedSets.length > 0) {
        const randomIndex = Math.floor(Math.random() * loadedSets.length);
        selectedSetNumber = loadedSets[randomIndex].set_number;
        this.logger.log(`[Assessment] Selected Random Set ${selectedSetNumber}`);
      }
    }

    // Save Set Number to Metadata
    const session = await this.sessionRepo.findOne({ where: { id: attempt.assessmentSessionId } });
    if (session) {
      if (!session.metadata) session.metadata = {};
      session.metadata.setNumber = selectedSetNumber;
      if (studentBoard) session.metadata.studentBoard = studentBoard;
      await this.sessionRepo.save(session);
    }

    // 3. Fetch Questions (40 Main + 20 Open)
    // Fetch MAIN Questions (Limit 40)
    let mainQuery = `
      SELECT id FROM assessment_questions 
      WHERE assessment_level_id = $1 
        AND is_active = true 
        AND is_deleted = false
        AND set_number = $2
    `;
    const mainParams: any[] = [level.id, selectedSetNumber];

    if (isSchool && studentBoard) {
      mainQuery += ` AND board = $3`;
      mainParams.push(studentBoard);
    }
    // Add School Level / Stream filters if needed, similar to before

    mainQuery += ` ORDER BY RANDOM() LIMIT 40`;
    const mainQuestions = await this.answerRepo.query(mainQuery, mainParams);

    // Fetch OPEN Questions (Limit 20)
    // Fetch OPEN Questions (Limit 20)
    const openQuery = `
      SELECT id FROM open_questions 
      WHERE is_active = true 
        AND is_deleted = false
      ORDER BY RANDOM() LIMIT 20
    `;
    const openQuestions = await this.answerRepo.query(openQuery);

    // 4. Interleave Questions (2 Main : 1 Open)
    const finalQuestions: { id: number; type: 'MAIN' | 'OPEN' }[] = [];
    let mainIdx = 0;
    let openIdx = 0;

    // We want 20 chunks of (2 Main + 1 Open) = 60 questions
    for (let i = 0; i < 20; i++) {
      if (mainIdx < mainQuestions.length) finalQuestions.push({ id: mainQuestions[mainIdx++].id, type: 'MAIN' });
      if (mainIdx < mainQuestions.length) finalQuestions.push({ id: mainQuestions[mainIdx++].id, type: 'MAIN' });
      if (openIdx < openQuestions.length) finalQuestions.push({ id: openQuestions[openIdx++].id, type: 'OPEN' });
    }

    this.logger.log(`[Assessment] Generated ${finalQuestions.length} interleaved questions (Main: ${mainIdx}, Open: ${openIdx})`);

    // 5. Bulk Insert Answers
    if (finalQuestions.length > 0) {
      const values: string[] = [];
      finalQuestions.forEach((q, index) => {
        const mainId = q.type === 'MAIN' ? q.id : 'NULL';
        const openId = q.type === 'OPEN' ? q.id : 'NULL';
        values.push(`(${attempt.id}, ${attempt.assessmentSessionId}, ${user.id}, ${reg.id}, ${attempt.programId}, ${level.id}, ${mainId}, ${openId}, '${q.type}', 'NOT_ANSWERED', ${index + 1}, NOW(), NOW())`);
      });

      const insertQuery = `
            INSERT INTO assessment_answers (
                assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
                main_question_id, open_question_id, question_source, status, question_sequence, created_at, updated_at
            ) VALUES ${values.join(',')}
        `;
      await this.answerRepo.query(insertQuery);
    }
  }

  async validateRegistration(dto: { email: string; mobile_number?: string }) {
    // 1. Check Email
    const user = await this.userRepo.findOne({
      where: { email: ILike(dto.email) },
    });
    if (user) {
      return {
        isValid: false,
        field: 'email',
        message: 'Email address is already registered.',
      };
    }

    // 2. Check Mobile (if provided)
    if (dto.mobile_number) {
      // Check in Registrations table (assuming unique constraint or business rule)
      const existingReg = await this.sessionRepo.manager.findOne(Registration, {
        where: { mobileNumber: dto.mobile_number },
      });

      if (existingReg) {
        // Note: We might want to be less strict if multiple students share a parent's phone,
        // but for a strict check:
        return {
          isValid: false,
          field: 'mobile_number',
          message: 'Mobile number is already registered.',
        };
      }
    }

    return { isValid: true, message: 'Available' };
  }

  async validateReferralCode(code: string) {
    const affiliate = await this.affiliateRepo.findOne({
      where: { referralCode: code, isActive: true },
    });

    if (!affiliate) {
      throw new BadRequestException('Invalid URL');
    }

    return { isValid: true, code: affiliate.referralCode };
  }

  // ---------------------------------------------------------
  // Helper: Send Welcome Email
  // ---------------------------------------------------------
  private async sendWelcomeEmail(
    to: string,
    name: string,
    pass: string,
    startDateTime?: Date | string,
    assessmentTitle?: string,
  ) {
    const region =
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('AWS_DEFAULT_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.logger.log(
      `[Email Debug] AWS Config Check: Region=${region}, KeyPresent=${!!accessKeyId}`,
    );

    if (!region) {
      this.logger.error(
        '[Email Critical] AWS_REGION is missing in environment variables.',
      );
      throw new Error(
        'Configuration Error: AWS_REGION is not defined in the environment.',
      );
    }

    const ses = new SES({
      accessKeyId,
      secretAccessKey,
      region,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const transporter = nodemailer.createTransport({
      SES: ses,
    } as any);

    const ccEmail = this.configService.get<string>('EMAIL_CC') || '';
    const fromName =
      this.configService.get<string>('EMAIL_SEND_FROM_NAME') ||
      'Origin BI Mind Works';
    const fromEmail =
      this.configService.get<string>('EMAIL_FROM') || 'no-reply@originbi.com';
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    this.logger.log(`[Email Debug] Sending from: ${fromAddress}, to: ${to}`);

    const assets = {
      popper: `${this.configService.get('API_URL')}/assets/Popper.png`,
      pattern: `${this.configService.get('API_URL')}/assets/Pattern_mask.png`,
      footer: `${this.configService.get('API_URL')}/assets/Email_Vector.png`,
      logo: `${this.configService.get('API_URL')}/assets/logo-light.png`,
    };

    const mailOptions = {
      from: fromAddress,
      to,
      cc: ccEmail,
      subject: 'Welcome to OriginBI - Your Assessment is Ready!',
      html: getStudentWelcomeEmailTemplate(
        name,
        to,
        pass,
        this.configService.get('FRONTEND_APP_URL') ?? 'http://localhost:3000',
        assets,
        startDateTime,
        assessmentTitle,
      ),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`[Email Debug] Email sent: ${JSON.stringify(info)}`);
      return info;
    } catch (err) {
      this.logger.error(
        `[Email Debug] SendMail threw: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async handleAssessmentCompletion(userId: number): Promise<void> {
    interface GenerateResponse {
      success: boolean;
      jobId: string;
      statusUrl: string;
    }

    interface StatusResponse {
      status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
      progress?: string;
      error?: string;
      downloadUrl?: string;
    }

    this.logger.log(`Handling assessment completion for user ${userId}`);

    try {
      // 1. Verify User and Registration
      const registration = await this.registrationRepo.findOne({
        where: { userId: userId, registrationSource: 'SELF' },
        relations: ['program'],
      });

      if (!registration) {
        this.logger.warn(
          `Skipping email: No SELF registration found for user ${userId}`,
        );
        return;
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.error(`User not found: ${userId}`);
        return;
      }

      // 2. Trigger Report Generation
      const reportServiceUrl =
        process.env.REPORT_SERVICE_URL || 'http://localhost:4006';
      const generateUrl = `${reportServiceUrl}/generate/student/${userId}`;

      this.logger.log(`Triggering report generation: ${generateUrl}`);

      const generateResponse = await lastValueFrom(
        this.httpService.get(generateUrl),
      );

      const responseData = generateResponse.data as GenerateResponse;

      if (!responseData.success || !responseData.jobId) {
        throw new Error('Failed to initiate report generation');
      }

      const jobId = responseData.jobId;
      this.logger.log(`Report generation started. Job ID: ${jobId}`);

      // 3. Poll for Completion (using json=true to avoid HTML parsing)
      let jobStatus: 'PROCESSING' | 'COMPLETED' | 'ERROR' = 'PROCESSING';
      let attempts = 0;
      const maxAttempts = 30; // 30 * 3s = 90 seconds timeout
      const pollUrl = `${reportServiceUrl}/download/status/${jobId}?json=true`;

      while (jobStatus === 'PROCESSING' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s

        try {
          const statusRes = await lastValueFrom(this.httpService.get(pollUrl));
          const statusData = statusRes.data as StatusResponse;

          jobStatus = statusData.status;

          if (jobStatus === 'ERROR') {
            throw new Error(`Report generation failed: ${statusData.error}`);
          }

          if (jobStatus === 'PROCESSING') {
            this.logger.debug(
              `Job ${jobId} processing... (${attempts + 1}/${maxAttempts})`,
            );
          }
        } catch (err) {
          // If polling fails (e.g. network blip), log and continue/retry, or throw
          this.logger.warn(`Polling failed for job ${jobId}: ${err.message}`);
          // Optional: decide to break or continue. We continue counting attempts.
        }

        attempts++;
      }

      if (jobStatus !== 'COMPLETED') {
        throw new Error(
          `Report generation timed out or failed. Final Status: ${jobStatus}`,
        );
      }

      // 4. Download PDF Content
      // Now that status is COMPLETED, calling the URL without ?json=true will return the file stream (res.download)
      const downloadUrl = `${reportServiceUrl}/download/status/${jobId}`;
      this.logger.log(`Downloading PDF from: ${downloadUrl}`);

      // 5. Fetch Report Entity for Password
      const session = await this.sessionRepo.findOne({
        where: { userId: userId, registrationId: registration.id },
        order: { createdAt: 'DESC' },
      });

      if (!session) {
        throw new Error('No assessment session found');
      }

      let password = '';
      // Quick retry for password persistence (in case report service updates DB slightly after file gen)
      for (let i = 0; i < 5; i++) {
        const reportEntity = await this.assessmentReportRepository.findOne({
          where: { assessmentSessionId: session.id },
        });
        if (reportEntity && reportEntity.reportPassword) {
          password = reportEntity.reportPassword;
          reportEntity.emailSent = true;
          reportEntity.emailSentAt = new Date();
          reportEntity.emailSentTo = user.email;
          await this.assessmentReportRepository.save(reportEntity);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!password) {
        this.logger.warn(`Report password not found for session ${session.id}`);
        password = 'Please contact support';
      }

      // 6. Get the PDF Buffer
      const pdfResponse = await lastValueFrom(
        this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const pdfBuffer = Buffer.from(pdfResponse.data, 'binary');

      // 7. Send Email
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const assets = {
        logo: `https://mind.originbi.com/Origin-BI-Logo-01.png`,
        reportCover: `https://mind.originbi.com/Origin-BI-Logo-01.png`,
      };

      const emailHtml = getAssessmentCompletionEmailTemplate(
        registration.fullName || 'Student',
        password,
        this.configService.get('FRONTEND_APP_URL') || 'http://localhost:3000',
        assets,
        dateStr,
        ((registration as any).program?.reportTitle as string) ||
        'Self Discovery Report',
      );

      // --- Transporter Setup ---
      const region =
        this.configService.get<string>('AWS_REGION') ||
        this.configService.get<string>('AWS_DEFAULT_REGION');
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error('AWS SES Config Missing');
      }

      const ses = new SES({
        accessKeyId,
        secretAccessKey,
        region,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const transporter = nodemailer.createTransport({
        SES: ses,
      } as any);
      // -------------------------

      const mailOptions = {
        from: `"${process.env.EMAIL_SEND_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        cc: [process.env.EMAIL_CC],
        subject: `Your Assessment Report is Ready - ${((registration as any).program?.reportTitle as string) || 'Origin BI'}`,
        html: emailHtml,
        attachments: [
          {
            filename: `${(registration.fullName || 'Student').replace(/\s/g, '_')}_Report.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      this.logger.log(`Assessment completion email sent to ${user.email}`);
    } catch (error) {
      this.logger.error('Failed to send assessment completion email', error);
    }
  }
}
