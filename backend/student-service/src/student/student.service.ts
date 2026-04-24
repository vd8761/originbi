/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, ConsoleLogger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Not, IsNull } from 'typeorm';
import { AssessmentReport } from '../entities/assessment-report.entity';
import { getAssessmentCompletionEmailTemplate } from '../mail/templates/assessment-completion.template';
import { getReportDeliveryEmailTemplate } from '../mail/templates/report-delivery.template';
import { getPlacementReportEmailTemplate } from '../mail/templates/placement-report.template';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { User } from '../entities/student.entity';

import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentAnswer } from '../entities/assessment_answer.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Program } from '../entities/program.entity';
import { SchoolStream } from '../entities/school-stream.entity';
import { Department } from '@originbi/shared-entities';
import {
  Registration,
  Gender,
  RegistrationStatus,
  PaymentStatus,
  AffiliateAccount,
  AffiliateReferralTransaction,
  Notification,
  DepartmentDegree,
} from '@originbi/shared-entities';
import * as nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { getStudentWelcomeEmailTemplate } from '../mail/templates/student-welcome.template';

import { getDebriefTeamNotificationEmailTemplate } from '../mail/templates/debrief-team-notification.template';
import { SettingsService } from '../settings/settings.service';
import { WhatsappTemplatesService } from '../whatsapp/whatsapp-templates.service';
import { SmsService, SmsTemplate } from '../sms/sms.service';
import { SubscriptionService } from './subscription.service';

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
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(SchoolStream)
    private readonly schoolStreamRepo: Repository<SchoolStream>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(DepartmentDegree)
    private readonly departmentDegreeRepo: Repository<DepartmentDegree>,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly whatsappTemplates: WhatsappTemplatesService,
    private readonly smsService: SmsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Creates a configured nodemailer transporter backed by AWS SES v2.
   * Throws if any required AWS credentials are missing from the environment.
   */
  private createEmailTransporter() {
    const region =
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('AWS_DEFAULT_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS SES configuration is missing. Ensure AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.',
      );
    }

    const sesClient = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // nodemailer's SES v2 transport has no official @types declaration;
    // the `as any` cast is unavoidable here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    } as any);
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

    let reportPassword = null;
    if (session.status === 'COMPLETED') {
      const report = await this.assessmentReportRepository.findOne({
        where: { assessmentSessionId: session.id },
        select: ['reportPassword'],
      });
      if (report) {
        reportPassword = report.reportPassword;
      }
    }

    return {
      isCompleted: session.status === 'COMPLETED',
      status: session.status,
      reportPassword: reportPassword,
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

  async getProfile(email: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email: ILike(email) },
    });

    if (!user) return null;

    // Fetch the dominant trait from the latest completed assessment attempt
    const traitQuery = `
      SELECT 
        pt.id, 
        pt.blended_style_name as name, 
        pt.code,
        pt.color_rgb
      FROM assessment_attempts aa
      JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
      WHERE aa.user_id = $1 AND aa.status = 'COMPLETED'
      ORDER BY aa.completed_at DESC
      LIMIT 1
    `;
    const traitResult = await this.userRepo.query(traitQuery, [user.id]);
    const trait = traitResult && traitResult.length > 0 ? traitResult[0] : null;

    // Fetch program type and academic details from registration
    const programQuery = `
      SELECT p.code as program_code, p.id as program_id,
             r.school_level, r.school_stream, r.student_board,
             r.department_degree_id, r.metadata,
             r.full_name, r.mobile_number, r.gender,
             d.name as department_name
      FROM registrations r
      JOIN programs p ON r.program_id = p.id
      LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
      LEFT JOIN departments d ON dd.department_id = d.id
      WHERE r.user_id = $1 AND r.is_deleted = false
      ORDER BY r.created_at DESC
      LIMIT 1
    `;
    const programResult = await this.userRepo.query(programQuery, [user.id]);
    const programCode = programResult?.[0]?.program_code || null;
    const academicDetails = {
      schoolLevel: programResult?.[0]?.school_level || null,
      schoolStream: programResult?.[0]?.school_stream || null,
      studentBoard: programResult?.[0]?.student_board || null,
      departmentDegreeId: programResult?.[0]?.department_degree_id || null,
      departmentName: programResult?.[0]?.department_name || null,
      currentYear:
        programResult?.[0]?.metadata?.current_year ||
        programResult?.[0]?.metadata?.currentYear ||
        null,
    };

    // Fetch DISC scores and agile scores for impact assessment
    let impactData = null;
    if (programCode) {
      const scoresQuery = `
        SELECT 
          aa_disc.metadata->'disc_scores'->>'D' as score_d,
          aa_disc.metadata->'disc_scores'->>'I' as score_i,
          aa_disc.metadata->'disc_scores'->>'S' as score_s,
          aa_disc.metadata->'disc_scores'->>'C' as score_c,
          aa_agile.metadata->'agile_scores'->>'Courage' as courage,
          aa_agile.metadata->'agile_scores'->>'Respect' as respect,
          aa_agile.metadata->'agile_scores'->>'Focus' as focus,
          aa_agile.metadata->'agile_scores'->>'Commitment' as commitment,
          aa_agile.metadata->'agile_scores'->>'Openness' as openness
        FROM assessment_sessions asess
        JOIN assessment_attempts aa_disc ON aa_disc.assessment_session_id = asess.id AND aa_disc.assessment_level_id = 1
        LEFT JOIN assessment_attempts aa_agile ON aa_agile.assessment_session_id = asess.id AND aa_agile.assessment_level_id = 2
        WHERE asess.user_id = $1 AND asess.status = 'COMPLETED'
          AND aa_disc.status = 'COMPLETED' 
          AND aa_disc.metadata->'disc_scores' IS NOT NULL
        ORDER BY asess.created_at DESC
        LIMIT 1
      `;
      const scoresResult = await this.userRepo.query(scoresQuery, [user.id]);

      if (scoresResult?.[0]) {
        const s = scoresResult[0];
        const D = Number(s.score_d) || 0;
        const I = Number(s.score_i) || 0;
        const S = Number(s.score_s) || 0;
        const C = Number(s.score_c) || 0;

        const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
        const courage = norm(Number(s.courage) || 0);
        const respect = norm(Number(s.respect) || 0);
        const focus = norm(Number(s.focus) || 0);
        const commitment = norm(Number(s.commitment) || 0);
        const openness = norm(Number(s.openness) || 0);

        const personalityAvg = Math.round((D + I + S + C) / 4);
        const agilityAvg = Math.round(
          (courage + respect + focus + commitment + openness) / 5,
        );
        // Leadership score: same formula as CI patterns in the report
        const leadershipScore = Math.min(
          100,
          Math.round(D * 0.4 + I * 0.3 + norm(Number(s.courage) || 0) * 0.3),
        );

        impactData = {
          discScores: { D, I, S, C },
          agileScores: { courage, respect, focus, commitment, openness },
          impactStats: {
            personalityAvg,
            agilityAvg,
            leadershipScore,
          },
        };
      }
    }

    return {
      ...user,
      fullName: programResult?.[0]?.full_name || user.metadata?.fullName || null,
      mobileNumber: programResult?.[0]?.mobile_number || user.metadata?.mobileNumber || null,
      gender: programResult?.[0]?.gender || user.metadata?.gender || null,
      personalityTrait: trait,
      programCode,
      academicDetails,
      ...(impactData || {}),
    };
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
        totalQuestions:
          totalCount > 0
            ? totalCount
            : level?.levelNumber === 2 ||
                level?.name.includes('ACI') ||
                level?.patternType === 'ACI'
              ? 25
              : 60,
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
          ...(dto.metadata || {}), // Merge extra metadata
          currentRole: dto.current_role || dto.metadata?.current_role,
          roleDescription:
            dto.role_description || dto.metadata?.role_description,
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

      // 5. Calculate Registration Amount
      const configAmount = this.configService.get('REGISTRATION_COST') || 500;
      const registrationAmountStr = (
        dto.payment_amount || configAmount
      ).toString();

      // 6. Create Registration (Force TS Check)
      const registration = this.sessionRepo.manager.create(Registration, {
        userId: user.id,
        registrationSource: dto.referral_code ? 'AFFILIATE' : 'SELF',
        fullName: dto.full_name,
        mobileNumber: dto.mobile_number,
        countryCode: dto.country_code ?? '+91',
        gender: dto.gender as Gender,
        schoolLevel: dto.school_level,
        schoolStream: dto.school_stream,
        programId: program.id,
        departmentDegreeId: dto.department_degree_id || dto.departmentDegreeId,
        studentBoard: dto.student_board || dto.studentBoard, // Explicit assignment
        // metadata: { ... } below also stores it
        status: 'COMPLETED' as RegistrationStatus,
        paymentStatus: 'PAID' as PaymentStatus,
        paymentAmount: registrationAmountStr,
        paymentProvider: dto.payment_provider || 'RAZORPAY',
        paymentReference: dto.payment_reference,
        paidAt: new Date(),
        metadata: {
          groupCode: dto.group_code,
          studentBoard: dto.student_board || dto.studentBoard, // Store in metadata as well
          sendEmail: true,
          currentYear: dto.current_year || dto.currentYear,
          ...(dto.metadata || {}), // Merge extra metadata
          currentRole: dto.current_role || dto.metadata?.current_role,
          roleDescription:
            dto.role_description || dto.metadata?.role_description,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const savedReg = await this.sessionRepo.manager.save(
        Registration,
        registration,
      );

      // Handle Affiliate Referral if code is provided
      let registeredWithAffiliate = false;
      let affiliateName = '';

      if (dto.referral_code) {
        const affiliate = await this.affiliateRepo.findOne({
          where: { referralCode: dto.referral_code, isActive: true },
        });

        if (affiliate) {
          registeredWithAffiliate = true;
          affiliateName = affiliate.name;
          this.logger.log(
            `Referral code ${dto.referral_code} found for affiliate ${affiliate.id}`,
          );

          // Determine commission
          const registrationAmount = Number(registrationAmountStr);
          const commissionPercentage = affiliate.commissionPercentage || 0;
          const earnedCommission =
            (registrationAmount * commissionPercentage) / 100;

          let currentReferralCount = 0;
          await this.affiliateRepo.manager.transaction(async (manager) => {
            // Re-fetch with pessimistic write lock to prevent race conditions
            const lockedAffiliate = await manager
              .getRepository(AffiliateAccount)
              .findOne({
                where: { id: affiliate.id },
                lock: { mode: 'pessimistic_write' },
              });

            if (lockedAffiliate) {
              const transactionData = {
                affiliateAccountId: Number(lockedAffiliate.id),
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

              const referralTransaction = manager
                .getRepository(AffiliateReferralTransaction)
                .create(transactionData);
              await manager.save(referralTransaction);

              currentReferralCount =
                (Number(lockedAffiliate.referralCount) || 0) + 1;
              lockedAffiliate.referralCount = currentReferralCount;
              lockedAffiliate.totalEarnedCommission =
                (Number(lockedAffiliate.totalEarnedCommission) || 0) +
                earnedCommission;
              lockedAffiliate.totalPendingCommission =
                (Number(lockedAffiliate.totalPendingCommission) || 0) +
                earnedCommission;

              await manager.save(lockedAffiliate);
            }
          });

          this.logger.log(
            `Affiliate ${affiliate.id} aggregates updated atomically: referralCount=${currentReferralCount}, earned=${earnedCommission}`,
          );

          // 1. Notify Affiliate of Successful Referral
          try {
            await this.notificationRepo.save({
              userId: Number(affiliate.userId),
              role: 'AFFILIATE',
              type: 'AFFILIATE_NEW_REFERRAL',
              title: 'New Registration',
              message: `${dto.full_name} is registered using your referral link.`,
              metadata: {
                studentName: dto.full_name,
                referralCode: dto.referral_code,
              },
            });
          } catch (err) {
            this.logger.error(
              `Failed to notify affiliate of new referral: ${err.message}`,
            );
          }

          // 2. Milestone Notification Check
          const milestones = [10, 50, 100];
          let isMilestone = milestones.includes(currentReferralCount);
          if (
            !isMilestone &&
            currentReferralCount > 100 &&
            currentReferralCount % 100 === 0
          ) {
            isMilestone = true;
          }

          if (isMilestone) {
            try {
              await this.notificationRepo.save({
                userId: Number(affiliate.userId),
                role: 'AFFILIATE',
                type: 'AFFILIATE_MILESTONE_REACHED',
                title: 'Referral Milestone Reached!',
                message: `Congratulations! You've reached ${currentReferralCount} referrals.`,
                metadata: {
                  count: currentReferralCount,
                },
              });
            } catch (err) {
              this.logger.error(
                `Failed to notify affiliate of milestone: ${err.message}`,
              );
            }
          }
        } else {
          this.logger.warn(
            `Invalid or inactive referral code provided: ${dto.referral_code}`,
          );
        }
      }

      // Send Admin Notification
      try {
        const message = registeredWithAffiliate
          ? `${dto.full_name} signed up using ${affiliateName}'s referral link.`
          : `${dto.full_name} signed up without a referral link.`;

        await this.sendAdminNotification({
          role: 'ADMIN',
          type: registeredWithAffiliate
            ? 'STUDENT_REFERRAL_REGISTRATION'
            : 'STUDENT_DIRECT_REGISTRATION',
          title: 'New Student registration',
          message: message,
          metadata: {
            studentEmail: dto.email,
            studentName: dto.full_name,
            referralCode: dto.referral_code,
            affiliateName: registeredWithAffiliate ? affiliateName : undefined,
          },
        });
      } catch (err) {
        this.logger.error(
          'Failed to send admin notification for registration',
          err.stack,
        );
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

      this.logger.log(
        `[Register Debug] Found ${levels.length} mandatory levels`,
      );

      for (const level of levels) {
        this.logger.log(
          `[Register Debug] Processing Level: ${level.id} - ${level.name}`,
        );
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
          this.logger.log(
            `[Register Debug] Generating questions for Level 1 (Attempt ID: ${savedAttempt.id})`,
          );
          await this.generateQuestionsForAttempt(
            savedAttempt,
            user,
            savedReg,
            level,
          );
        }
      }

      // 8a. Send Assessment Instructions WhatsApp (fire-and-forget)
      this.fireAssessmentInstructionsWhatsapp(savedReg).catch((err) =>
        this.logger.error(
          `Instructions WhatsApp failed for ${savedReg.mobileNumber}: ${err.message}`,
        ),
      );

      // 8. Send Welcome Email
      const shouldSendEmail =
        savedReg.metadata?.sendEmail === true ||
        savedReg.metadata?.sendEmail === 'true';

      if (shouldSendEmail) {
        const validFrom = session.validFrom
          ? new Date(session.validFrom)
          : new Date();
        // program title?
        const programTitle = program.assessmentTitle || program.name;

        try {
          this.logger.log(`[Email] Triggering welcome email to ${dto.email}`);
          await this.sendWelcomeEmail(
            dto.email,
            dto.full_name,
            dto.password, // We need the password here. DTO has it.
            validFrom,
            programTitle,
            savedReg.metadata?.debrief === true || savedReg.metadata?.debrief === 'true',
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

  async getSchoolStreams() {
    return this.schoolStreamRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getDepartments() {
    const rows = await this.departmentDegreeRepo.find({
      relations: ['department', 'degreeType'],
      where: {
        isActive: true,
        department: { isActive: true, isDeleted: false },
      },
    });

    const result = rows.map((row) => {
      const degreeName = row.degreeType?.name || '';
      const deptName = row.department?.name || '';
      const fullName = `${degreeName} ${deptName}`.trim();
      return {
        id: row.id,
        name: this.normalizeDepartmentDisplayName(fullName),
        isActive: row.isActive,
      };
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  private normalizeDepartmentDisplayName(label: string | undefined | null) {
    if (!label) return '';

    let normalized = label.replace(/\s+/g, ' ').trim();

    while (true) {
      const words = normalized.split(' ');
      const duplicatePrefixWordCount = this.getDuplicatePrefixWordCount(words);

      if (!duplicatePrefixWordCount) break;

      words.splice(duplicatePrefixWordCount, duplicatePrefixWordCount);
      normalized = words.join(' ');
    }

    return normalized;
  }

  private getDuplicatePrefixWordCount(words: string[]) {
    const maxPrefixWordCount = Math.min(Math.floor(words.length / 2), 6);

    for (
      let prefixWordCount = maxPrefixWordCount;
      prefixWordCount >= 1;
      prefixWordCount--
    ) {
      const firstPrefix = words
        .slice(0, prefixWordCount)
        .map((w) => w.toLowerCase().replace(/[.,;:!?-]+$/g, ''));
      const repeatedPrefix = words
        .slice(prefixWordCount, prefixWordCount * 2)
        .map((w) => w.toLowerCase().replace(/[.,;:!?-]+$/g, ''));

      const isDuplicate = firstPrefix.every(
        (word, index) => word !== '' && word === repeatedPrefix[index],
      );

      if (isDuplicate) return prefixWordCount;
    }

    return 0;
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
    if (
      level.levelNumber === 2 ||
      level.name.includes('Level 2') ||
      level.name.includes('ACI')
    ) {
      this.logger.log(
        `[Assessment] Generating Level 2 (ACI) questions for User ${user.id}`,
      );

      // 1. Get Personality Trait ID from previous session metadata or report
      // Assumption: Level 1 completion stored the dominant trait ID in session metadata
      const session = await this.sessionRepo.findOne({
        where: { id: attempt.assessmentSessionId },
      });

      let traitId =
        session?.metadata?.personalityTraitId ||
        session?.metadata?.dominantTraitId;

      if (!traitId) {
        // Fallback: Check for a completed attempt in this session that has a dominant trait (Level 1)
        this.logger.log(
          `[Assessment] Trait ID not in metadata. Checking previous attempts for Session ${attempt.assessmentSessionId}...`,
        );
        const previousAttempt = await this.attemptRepo.findOne({
          where: {
            assessmentSessionId: attempt.assessmentSessionId,
            dominantTraitId: Not(IsNull()),
            status: 'COMPLETED',
          },
          order: { completedAt: 'DESC' },
        });

        if (previousAttempt && previousAttempt.dominantTraitId) {
          traitId = previousAttempt.dominantTraitId;
          this.logger.log(
            `[Assessment] Found Trait ID ${traitId} from previous attempt ${previousAttempt.id}`,
          );
        }
      }

      if (!traitId) {
        this.logger.error(
          `[Assessment Error] Level 2 requires a Personality Trait ID, but none found in session metadata or previous attempts for User ${user.id}`,
        );
        throw new Error(
          'Personality Trait not found. Please complete Level 1 first.',
        );
      }

      this.logger.log(
        `[Assessment] Fetching 25 questions for Trait ID: ${traitId}`,
      );

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
        traitId,
      ];

      // Board Filtering strictly for School Programs (ID 1)
      // Check attempt.programId or reg.program.id. Assuming 1 is School based on groupReportHelper usage.
      if (Number(attempt.programId) === 1) {
        const studentBoard =
          session?.metadata?.studentBoard || reg.metadata?.studentBoard;
        if (studentBoard) {
          this.logger.log(
            `[Assessment] Applying Board Filter for School Program: ${studentBoard}`,
          );
          query += ` AND board = $8`;
          queryParams.push(studentBoard);
        } else {
          this.logger.warn(
            `[Assessment] School Program detected but no Student Board found in metadata. Generating without board filter.`,
          );
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
        this.logger.log(
          `[Assessment] Selected Set ${selectedSetNumber} for Board ${studentBoard}`,
        );
      } else {
        this.logger.warn(
          `[Assessment] No sets found for Board ${studentBoard}, defaulting to Set 1`,
        );
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
        this.logger.log(
          `[Assessment] Selected Random Set ${selectedSetNumber}`,
        );
      }
    }

    // Save Set Number to Metadata
    const session = await this.sessionRepo.findOne({
      where: { id: attempt.assessmentSessionId },
    });
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
      if (mainIdx < mainQuestions.length)
        finalQuestions.push({ id: mainQuestions[mainIdx++].id, type: 'MAIN' });
      if (mainIdx < mainQuestions.length)
        finalQuestions.push({ id: mainQuestions[mainIdx++].id, type: 'MAIN' });
      if (openIdx < openQuestions.length)
        finalQuestions.push({ id: openQuestions[openIdx++].id, type: 'OPEN' });
    }

    this.logger.log(
      `[Assessment] Generated ${finalQuestions.length} interleaved questions (Main: ${mainIdx}, Open: ${openIdx})`,
    );

    // 5. Bulk Insert Answers
    if (finalQuestions.length > 0) {
      const values: string[] = [];
      finalQuestions.forEach((q, index) => {
        const mainId = q.type === 'MAIN' ? q.id : 'NULL';
        const openId = q.type === 'OPEN' ? q.id : 'NULL';
        values.push(
          `(${attempt.id}, ${attempt.assessmentSessionId}, ${user.id}, ${reg.id}, ${attempt.programId}, ${level.id}, ${mainId}, ${openId}, '${q.type}', 'NOT_ANSWERED', ${index + 1}, NOW(), NOW())`,
        );
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

    return {
      isValid: true,
      code: affiliate.referralCode,
      name: affiliate.name,
    };
  }

  // ---------------------------------------------------------
  // Helpers: Student-facing WhatsApp templates
  // ---------------------------------------------------------
  private async fireAssessmentInstructionsWhatsapp(
    registration: Registration,
  ): Promise<void> {
    const source = registration.registrationSource;
    if (source !== 'SELF' && source !== 'AFFILIATE') return;

    const phone = WhatsappTemplatesService.formatPhoneNumber(
      registration.mobileNumber,
      registration.countryCode,
    );
    const name = registration.fullName ?? '';

    const whatsappEnabled = await this.settingsService.getValue<boolean>(
      'whatsapp',
      'send_assessment_instructions',
    );

    let whatsappSucceeded = false;
    if (whatsappEnabled !== false) {
      try {
        const [imageUrl, youtubeUrl, portalUrl] = await Promise.all([
          this.settingsService.getValue<string>(
            'whatsapp',
            'student_template_image_url',
          ),
          this.settingsService.getValue<string>(
            'whatsapp',
            'instructions_youtube_url',
          ),
          this.settingsService.getValue<string>(
            'whatsapp',
            'student_portal_url',
          ),
        ]);

        await this.whatsappTemplates.send({
          templateName: 'assessment_instructions_v6',
          phoneNumber: phone,
          components: {
            header_1: { type: 'image', value: imageUrl ?? '' },
            body_1: { type: 'text', value: name },
            body_2: { type: 'text', value: youtubeUrl ?? '' },
            button_1: {
              subtype: 'url',
              type: 'text',
              value: portalUrl ?? 'https://mind.originbi.com/student',
            },
          },
        });
        whatsappSucceeded = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
        this.logger.warn(
          `Instructions WhatsApp failed for ${phone}, will try SMS fallback: ${msg}`,
        );
      }
    }

    if (whatsappSucceeded) return;
    await this.trySmsFallback('assessment_instructions', phone, name);
  }

  private async fireCompletionWhatsapp(
    registration: Registration,
  ): Promise<void> {
    const source = registration.registrationSource;
    if (source !== 'SELF' && source !== 'AFFILIATE') return;

    const phone = WhatsappTemplatesService.formatPhoneNumber(
      registration.mobileNumber,
      registration.countryCode,
    );
    const name = registration.fullName ?? '';

    const whatsappEnabled = await this.settingsService.getValue<boolean>(
      'whatsapp',
      'send_completion_notification',
    );

    let whatsappSucceeded = false;
    if (whatsappEnabled !== false) {
      try {
        const imageUrl = await this.settingsService.getValue<string>(
          'whatsapp',
          'student_template_image_url',
        );

        await this.whatsappTemplates.send({
          templateName: 'assessment_completion_notification',
          phoneNumber: phone,
          components: {
            header_1: { type: 'image', value: imageUrl ?? '' },
            body_1: { type: 'text', value: name },
          },
        });
        whatsappSucceeded = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
        this.logger.warn(
          `Completion WhatsApp failed for ${phone}, will try SMS fallback: ${msg}`,
        );
      }
    }

    if (whatsappSucceeded) return;
    await this.trySmsFallback('completion_notification', phone, name);
  }

  private async fireReportSentWhatsapp(
    registration: Registration,
  ): Promise<void> {
    const source = registration.registrationSource;
    if (source !== 'SELF' && source !== 'AFFILIATE') return;

    const phone = WhatsappTemplatesService.formatPhoneNumber(
      registration.mobileNumber,
      registration.countryCode,
    );
    const name = registration.fullName ?? '';

    const whatsappEnabled = await this.settingsService.getValue<boolean>(
      'whatsapp',
      'send_report_sent_notification',
    );

    let whatsappSucceeded = false;
    if (whatsappEnabled !== false) {
      try {
        const imageUrl = await this.settingsService.getValue<string>(
          'whatsapp',
          'student_template_image_url',
        );

        await this.whatsappTemplates.send({
          templateName: 'assessment_report_sent_notification',
          phoneNumber: phone,
          components: {
            header_1: { type: 'image', value: imageUrl ?? '' },
            body_1: { type: 'text', value: name },
          },
        });
        whatsappSucceeded = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
        this.logger.warn(
          `Report-sent WhatsApp failed for ${phone}, will try SMS fallback: ${msg}`,
        );
      }
    }

    if (whatsappSucceeded) return;
    await this.trySmsFallback('report_sent_notification', phone, name);
  }

  /**
   * Sends an SMS when WhatsApp was skipped (disabled) or failed. No-op if
   * the per-template SMS toggle is off. Errors are swallowed — SMS is a
   * best-effort fallback.
   */
  private async trySmsFallback(
    template: SmsTemplate,
    phone: string,
    name: string,
  ): Promise<void> {
    try {
      const smsOn = await this.smsService.isEnabled(template);
      if (!smsOn) return;
      await this.smsService.send(template, phone, name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
      this.logger.error(`SMS fallback failed for ${template} ${phone}: ${msg}`);
    }
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
    isDebrief?: boolean,
  ) {
    this.logger.log(`[Email Debug] AWS Config Check triggered for: ${to}`);

    const transporter = this.createEmailTransporter();

    const {
      fromName,
      fromAddress: fromEmail,
      ccAddresses,
      bccAddresses,
      replyToAddress,
    } = await this.settingsService.getEmailConfig('registration_email_config');
    const ccEmail = ccAddresses.join(', ');
    const bccEmail = bccAddresses.join(', ');
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    this.logger.log(`[Email Debug] Sending from: ${fromAddress}, to: ${to}`);

    const assets = {
      popper: `${this.configService.get('API_URL')}/assets/Popper.png`,
      pattern: `${this.configService.get('API_URL')}/assets/Pattern_mask.png`,
      footer: `${this.configService.get('API_URL')}/assets/Email_Vector.png`,
      logo: `${this.configService.get('API_URL')}/assets/logo-light.png`,
    };

    const mailOptions: Record<string, any> = {
      from: fromAddress,
      to,
      cc: ccEmail,
      subject: 'Welcome to OriginBI - Your Assessment is Ready!',
      html: getStudentWelcomeEmailTemplate(
        name,
        to,
        pass,
        this.configService.get('FRONTEND_URL') ?? 'https://mind.originbi.com/',
        assets,
        startDateTime,
        assessmentTitle,
        isDebrief,
      ),
    };
    if (bccEmail) mailOptions.bcc = bccEmail;
    if (replyToAddress) mailOptions.replyTo = replyToAddress;

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
      // 1. Find the latest completed session for this user to get the correct registration
      const session = await this.sessionRepo.findOne({
        where: { userId: userId, status: 'COMPLETED' },
        order: { updatedAt: 'DESC' },
      });

      if (!session) {
        this.logger.warn(
          `Skipping process: No completed session found for user ${userId}`,
        );
        return;
      }

      const registration = await this.registrationRepo.findOne({
        where: { id: session.registrationId },
      });

      if (!registration) {
        this.logger.warn(
          `Skipping process: No registration found for user ${userId} / session ${session.id}`,
        );
        return;
      }

      const program = await this.sessionRepo.manager
        .getRepository(Program)
        .findOne({
          where: { id: session.programId },
        });

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.error(`User not found: ${userId}`);
        return;
      }

      // Fire Completion WhatsApp (fire-and-forget) — before report generation
      this.fireCompletionWhatsapp(registration).catch((err) =>
        this.logger.error(
          `Completion WhatsApp failed for user ${userId}: ${err.message}`,
        ),
      );

      // --- 8. Notify Corporate User (MOVED UP) ---
      if (registration.registrationSource === 'CORPORATE') {
        let corporateNotificationUserId = registration.createdByUserId;

        // If createdByUserId is missing, try to resolve from corporateAccountId
        if (!corporateNotificationUserId && registration.corporateAccountId) {
          const corpAccount = await this.sessionRepo.manager.query(
            `SELECT user_id FROM corporate_accounts WHERE id = $1`,
            [registration.corporateAccountId],
          );
          if (corpAccount && corpAccount.length > 0) {
            corporateNotificationUserId = corpAccount[0].user_id;
          }
        }

        if (corporateNotificationUserId) {
          try {
            // Check if already notified for this registration using JSONB path query
            const existingNotif = await this.notificationRepo
              .createQueryBuilder('n')
              .where('n.user_id = :userId', {
                userId: Number(corporateNotificationUserId),
              })
              .andWhere('n.type = :type', { type: 'EMPLOYEE_TEST_COMPLETED' })
              .andWhere("n.metadata ->> 'registrationId' = :regId", {
                regId: registration.id.toString(),
              })
              .getOne();

            if (!existingNotif) {
              await this.notificationRepo.save({
                userId: Number(corporateNotificationUserId),
                role: 'CORPORATE',
                type: 'EMPLOYEE_TEST_COMPLETED',
                title: 'Assessment Completed',
                message: `${registration.fullName || 'An employee'} has successfully completed the ${program?.name || 'Employee'} assessment.`,
                metadata: {
                  studentId: userId,
                  studentName: registration.fullName,
                  programName: program?.name,
                  registrationId: registration.id,
                },
              });
              this.logger.log(
                `Corporate notification saved for corporate user ${corporateNotificationUserId} (Student: ${userId})`,
              );
            } else {
              this.logger.log(
                `Corporate notification already exists for student ${userId}, skipping duplicate.`,
              );
            }
          } catch (err) {
            this.logger.error(
              `Failed to handle corporate notification: ${err.message}`,
            );
          }
        }
      }
      // --------------------------------------------

      if (
        registration.registrationSource !== 'SELF' &&
        registration.registrationSource !== 'AFFILIATE'
      ) {
        this.logger.log(
          `Skipping automatic report generation and email for registration source: ${registration.registrationSource} (User: ${userId})`,
        );
        return;
      }


      // 2. Trigger Report Generation
      const port = process.env.PORT || 4004;
      const reportServiceUrl = `http://localhost:${port}/report`;
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
      // session is already fetched at the beginning of this function

      let password = '';
      // Quick retry for password persistence (in case report service updates DB slightly after file gen)
      for (let i = 0; i < 5; i++) {
        const reportEntity = await this.assessmentReportRepository.findOne({
          where: { assessmentSessionId: session.id },
        });
        if (reportEntity && reportEntity.reportPassword) {
          password = reportEntity.reportPassword;
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

      let attachmentFileName = `${(registration.fullName || 'Student').replace(/\s/g, '_')}_Report.pdf`;
      const contentDisposition = pdfResponse.headers['content-disposition'];
      if (contentDisposition && typeof contentDisposition === 'string') {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          attachmentFileName = match[1];
        }
      }

      // 9. Save in-app notification first (do not block on email delivery)
      try {
        const existingNotif = await this.notificationRepo
          .createQueryBuilder('n')
          .where('n.user_id = :userId', { userId: Number(userId) })
          .andWhere('n.type = :type', { type: 'ASSESSMENT_REPORT_READY' })
          .andWhere("n.metadata ->> 'registrationId' = :regId", {
            regId: registration.id.toString(),
          })
          .getOne();

        if (!existingNotif) {
          await this.notificationRepo.save({
            userId: Number(userId),
            role: user.role || 'STUDENT',
            type: 'ASSESSMENT_REPORT_READY',
            title: 'Assessment Report Ready',
            message:
              'Your assessment report is ready. Please check it in your email.',
            metadata: {
              registrationId: registration.id,
            },
          });
          this.logger.log(
            `Student notification saved for user ${userId} (Assessment Report Ready)`,
          );
        } else {
          this.logger.log(
            `Assessment report-ready notification already exists for user ${userId}, skipping duplicate.`,
          );
        }

        // --- Debrief Promotion Notification ---
        const isSchool = program?.code?.toUpperCase().includes('SCHOOL');
        const debriefEnabled =
          registration.metadata?.debrief === true ||
          registration.metadata?.debrief === 'true';

        if (isSchool && !debriefEnabled) {
          const existingDebriefNotif = await this.notificationRepo
            .createQueryBuilder('n')
            .where('n.user_id = :userId', { userId: Number(userId) })
            .andWhere('n.type = :type', { type: 'DEBRIEF_PROMOTION' })
            .andWhere("n.metadata ->> 'registrationId' = :regId", {
              regId: registration.id.toString(),
            })
            .getOne();

          if (!existingDebriefNotif) {
            await this.notificationRepo.save({
              userId: Number(userId),
              role: user.role || 'STUDENT',
              type: 'DEBRIEF_PROMOTION',
              title: 'Unlock Your Expert Debrief',
              message:
                'Your assessment is complete! Book a 1-on-1 expert debrief session to get personalised insights and career guidance.',
              metadata: {
                registrationId: registration.id,
              },
            });
            this.logger.log(
              `Student debrief promotion notification saved for user ${userId}`,
            );
          }
        }
      } catch (err) {
        this.logger.error(
          `Failed to save student notification: ${err.message}`,
        );
      }

      // 10. Send Email (check global toggle)
      const sendReportEmailEnabled =
        await this.settingsService.getValue<boolean>(
          'email',
          'send_report_email',
        );

      if (sendReportEmailEnabled === false) {
        this.logger.log(
          `Report email disabled via admin settings (send_report_email=false). Skipping email for user ${userId}.`,
        );
      } else {
        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const assets = {
          logo: `https://mind.originbi.com/Origin-BI-Logo-01.png`,
          reportCover: `https://mind.originbi.com/Origin-BI-Logo-01.png`,
          footer: `${this.configService.get('API_URL') || 'https://mind.originbi.com'}/assets/Email_Vector.png`,
          popper: `${this.configService.get('API_URL') || 'https://mind.originbi.com'}/assets/Popper.png`,
        };

        const emailHtml = getAssessmentCompletionEmailTemplate(
          registration.fullName || 'Student',
          password,
          this.configService.get('FRONTEND_URL') ||
            'https://mind.originbi.com/',
          assets,
          dateStr,
          ((registration as any).program?.reportTitle as string) ||
            'Self Discovery Report',
          new Date().getFullYear().toString(),
          registration.metadata?.debrief === true ||
            registration.metadata?.debrief === 'true',
        );

        try {
          const transporter = this.createEmailTransporter();

          const {
            fromName,
            fromAddress: fromEmail,
            ccAddresses,
            bccAddresses,
            replyToAddress,
          } = await this.settingsService.getEmailConfig('report_email_config');

          const mailOptions: Record<string, any> = {
            from: `"${fromName}" <${fromEmail}>`,
            to: user.email,
            cc: ccAddresses,
            subject: `Your Assessment Report is Ready - ${((registration as any).program?.reportTitle as string) || 'Origin BI'}`,
            html: emailHtml,
            attachments: [
              {
                filename: attachmentFileName,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ],
          };
          if (bccAddresses.length > 0) mailOptions.bcc = bccAddresses;
          if (replyToAddress) mailOptions.replyTo = replyToAddress;

          await transporter.sendMail(mailOptions);
          this.logger.log(`Assessment completion email sent to ${user.email}`);

          // Fire Report-Sent WhatsApp (fire-and-forget)
          this.fireReportSentWhatsapp(registration).catch((whatsappErr) =>
            this.logger.error(
              `Report-sent WhatsApp failed for user ${userId}: ${whatsappErr.message}`,
            ),
          );

          // --- Send Debrief Team Notification (with report attached, once report is ready) ---
          // Student confirmation was already sent immediately after payment in SubscriptionService.
          // Here we only send the team notification with the report attached.
          if (
            (registration.metadata?.debrief === true || registration.metadata?.debrief === 'true') &&
            registration.metadata?.debriefTeamEmailSent !== true &&
            registration.metadata?.debriefTeamEmailSent !== 'true'
          ) {
            try {
              const debriefForwardEmails = (this.configService.get('DEBRIEF_FORWARD_EMAILS') || 'info@originbi.com,vikashuvi07@gmail.com')
                .split(',')
                .map((e: string) => e.trim())
                .filter((e: string) => e.length > 0);

              // Construct academic details string
              let academicDetails = 'Not specified';
              if (registration.schoolLevel) {
                academicDetails = `Class ${registration.schoolLevel}`;
                if (registration.schoolStream) academicDetails += `, ${registration.schoolStream}`;
                if (registration.studentBoard) academicDetails += `, ${registration.studentBoard}`;
              } else if (registration.departmentDegreeId) {
                academicDetails = `College/University Degree`;
                if (registration.metadata?.currentYear) academicDetails += ` (Year ${registration.metadata.currentYear})`;
              }

              const teamHtml = getDebriefTeamNotificationEmailTemplate(
                registration.fullName || 'Student',
                user.email,
                `${registration.countryCode || '+91'} ${registration.mobileNumber}`,
                registration.gender || 'Not specified',
                registration.paymentAmount?.toString() || '0',
                registration.paymentReference || 'N/A',
                registration.createdAt
                  ? new Date(registration.createdAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                      hour12: true,
                    })
                  : 'N/A',
                (registration as any).program?.assessmentTitle || (registration as any).program?.name || 'Assessment Program',
                academicDetails,
                assets,
              );

              for (const forwardEmail of debriefForwardEmails) {
                const teamMailOptions: Record<string, any> = {
                  from: `"${fromName}" <${fromEmail}>`,
                  to: forwardEmail,
                  subject: `[Debrief Booking] ${registration.fullName || 'Student'} - Expert Debrief Session`,
                  html: teamHtml,
                  attachments: [
                    {
                      filename: attachmentFileName,
                      content: pdfBuffer,
                      contentType: 'application/pdf',
                    },
                  ],
                };
                await transporter.sendMail(teamMailOptions);
                this.logger.log(`Debrief team notification sent to ${forwardEmail}`);
              }

              // Mark team notification as sent
              const meta = registration.metadata || {};
              meta.debriefTeamEmailSent = true;
              await this.registrationRepo.update(registration.id, { metadata: meta });
              this.logger.log(`Debrief team email marked as sent for user ${userId}`);

            } catch (debriefErr) {
              this.logger.error(
                `Failed to send debrief team notification: ${debriefErr.message}`,
              );
            }
          }

        } catch (err) {
          this.logger.error(
            `Failed to send assessment completion email to ${user.email}: ${err.message}`,
          );
        }
      }

      // Update assessment_reports to track the sent email
      if (session) {
        const reportEntity = await this.assessmentReportRepository.findOne({
          where: { assessmentSessionId: session.id },
        });
        if (reportEntity) {
          reportEntity.emailSent = true;
          reportEntity.emailSentAt = new Date();
          reportEntity.emailSentTo = user.email;
          await this.assessmentReportRepository.save(reportEntity);
          this.logger.log(
            `assessment_reports updated: email_sent=true for session ${session.id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to send assessment completion email', error);
      throw error; // Re-throw so pg-boss marks the job as failed and retries
    }
  }

  async sendManualReportEmail(userId: number, toEmail?: string): Promise<void> {
    this.logger.log(
      `Manual report email requested for user ${userId}${toEmail ? ` to ${toEmail}` : ''}`,
    );

    try {
      // 1. Look up user
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const recipientEmail = toEmail || user.email;

      // 2. Look up registration
      const registration = await this.registrationRepo.findOne({
        where: { userId },
        relations: ['program'],
      });
      if (!registration) {
        throw new Error(`No registration found for user ${userId}`);
      }

      // 3. Find the latest completed session
      const session = await this.sessionRepo.findOne({
        where: { userId, registrationId: registration.id, status: 'COMPLETED' },
        order: { createdAt: 'DESC' },
      });
      if (!session) {
        throw new Error(`No completed session found for user ${userId}`);
      }

      // 4. Get report entity to update later
      let reportEntity = await this.assessmentReportRepository.findOne({
        where: { assessmentSessionId: session.id },
      });

      // 5. Generate + download PDF
      const port = this.configService.get<number>('PORT') || 4004;
      const reportServiceUrl = `http://localhost:${port}/report`;
      const generateUrl = `${reportServiceUrl}/generate/student/${userId}`;
      this.logger.log(`Triggering report generation: ${generateUrl}`);

      const generateResponse = await lastValueFrom(
        this.httpService.get(generateUrl),
      );
      const responseData = generateResponse.data as {
        success: boolean;
        jobId: string;
      };
      if (!responseData.success || !responseData.jobId) {
        throw new Error('Failed to initiate report generation');
      }

      const jobId = responseData.jobId;
      this.logger.log(`Report generation started. Job ID: ${jobId}`);

      // Poll for completion
      let jobStatus: 'PROCESSING' | 'COMPLETED' | 'ERROR' = 'PROCESSING';
      let attempts = 0;
      const maxAttempts = 30;
      const pollUrl = `${reportServiceUrl}/download/status/${jobId}?json=true`;

      while (jobStatus === 'PROCESSING' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const statusRes = await lastValueFrom(this.httpService.get(pollUrl));
          const statusData = statusRes.data as {
            status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
            error?: string;
          };
          jobStatus = statusData.status;
          if (jobStatus === 'ERROR') {
            throw new Error(`Report generation failed: ${statusData.error}`);
          }
        } catch (err) {
          this.logger.warn(
            `Polling failed for job ${jobId}: ${(err as Error).message}`,
          );
        }
        attempts++;
      }

      if (jobStatus !== 'COMPLETED') {
        throw new Error(
          `Report generation timed out. Final Status: ${jobStatus}`,
        );
      }

      // Re-fetch report entity for password since generation creates it if missing
      reportEntity = await this.assessmentReportRepository.findOne({
        where: { assessmentSessionId: session.id },
      });
      const password = reportEntity?.reportPassword || 'Please contact support';

      // Download PDF
      const downloadUrl = `${reportServiceUrl}/download/status/${jobId}`;
      const pdfResponse = await lastValueFrom(
        this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const pdfBuffer = Buffer.from(pdfResponse.data, 'binary');

      let attachmentFileName = `${(registration.fullName || 'Student').replace(/\s/g, '_')}_Report.pdf`;
      const contentDisposition = pdfResponse.headers['content-disposition'];
      if (contentDisposition && typeof contentDisposition === 'string') {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          attachmentFileName = match[1];
        }
      }

      // 6. Build exam date from session
      const examDate = session.updatedAt
        ? new Date(session.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

      const reportTitle =
        ((registration as any).program?.reportTitle as string) ||
        'Self Discovery Report';

      const assets = {
        logo: 'https://mind.originbi.com/Origin-BI-Logo-01.png',
        reportCover: 'https://mind.originbi.com/Origin-BI-Logo-01.png',
      };

      const isThirdParty = !!toEmail;

      const emailHtml = getReportDeliveryEmailTemplate(
        registration.fullName || 'Student',
        password,
        this.configService.get('FRONTEND_URL') || 'https://mind.originbi.com/',
        assets,
        examDate,
        reportTitle,
        undefined,
        isThirdParty,
      );

      // 7. Send email
      const transporter = this.createEmailTransporter();

      const subject = isThirdParty
        ? `${registration.fullName || 'Student'}'s Assessment Report – ${reportTitle}`
        : `Your Assessment Report – ${reportTitle}`;

      const {
        fromName,
        fromAddress: fromEmail,
        ccAddresses,
        bccAddresses,
        replyToAddress,
      } = await this.settingsService.getEmailConfig(
        'manual_report_email_config',
      );

      const mailOptions: Record<string, any> = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipientEmail,
        cc: ccAddresses,
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: attachmentFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };
      if (bccAddresses.length > 0) mailOptions.bcc = bccAddresses;
      if (replyToAddress) mailOptions.replyTo = replyToAddress;

      await transporter.sendMail(mailOptions);
      this.logger.log(
        `Manual report email sent to ${recipientEmail} for user ${userId}`,
      );

      // 8. Update assessment_reports tracking
      if (reportEntity) {
        reportEntity.emailSent = true;
        reportEntity.emailSentAt = new Date();
        reportEntity.emailSentTo = recipientEmail;
        await this.assessmentReportRepository.save(reportEntity);
        this.logger.log(
          `assessment_reports updated: email_sent=true for session ${session.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send manual report email', error);
      throw error;
    }
  }

  async sendPlacementReportEmail(
    groupId: number,
    departmentId: number,
    toEmail: string,
    downloadUrl: string,
    studentCount: number,
    degreeType: string,
    departmentName: string,
  ): Promise<void> {
    this.logger.log(
      `Sending placement report email for group ${groupId}, dept ${departmentId} to ${toEmail} (${studentCount} students, ${degreeType} ${departmentName})`,
    );

    try {
      // 1. Download the already-generated PDF from the report service
      const pdfResponse = await lastValueFrom(
        this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
      );
      const pdfBuffer = Buffer.from(pdfResponse.data as ArrayBuffer);
      this.logger.log(
        `Downloaded placement report PDF: ${pdfBuffer.length} bytes`,
      );

      // 2. Create email transporter
      const transporter = this.createEmailTransporter();

      const {
        fromName,
        fromAddress: fromEmail,
        ccAddresses,
        bccAddresses,
        replyToAddress,
      } = await this.settingsService.getEmailConfig(
        'manual_report_email_config',
      );

      const emailHtml = getPlacementReportEmailTemplate(
        studentCount,
        degreeType,
        departmentName,
        this.configService.get('FRONTEND_URL') || 'https://mind.originbi.com/',
      );

      const mailOptions: Record<string, any> = {
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        cc: ccAddresses,
        subject: `Students Handbook – ${degreeType} ${departmentName}`,
        html: emailHtml,
        attachments: [
          {
            filename: `Students_Handbook_${degreeType}_${departmentName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };
      if (bccAddresses.length > 0) mailOptions.bcc = bccAddresses;
      if (replyToAddress) mailOptions.replyTo = replyToAddress;

      await transporter.sendMail(mailOptions);
      this.logger.log(
        `Placement report email sent to ${toEmail} for group ${groupId}, dept ${departmentId}`,
      );
    } catch (error) {
      this.logger.error('Failed to send placement report email', error);
      throw error;
    }
  }

  async handleLevelUnlocked(
    userId: number,
    levelNumber: number,
  ): Promise<void> {
    this.logger.log(
      `Handling level unlocked notification for user ${userId}, level ${levelNumber}`,
    );
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const userRole = user?.role || 'STUDENT';

      const levelNames: Record<number, string> = {
        1: 'DISC Behavioral Insight',
        2: 'ACI Agile Compatibility Index',
      };

      const assessmentName = levelNames[levelNumber] || `Level ${levelNumber}`;

      await this.notificationRepo.save({
        userId: Number(userId),
        role: userRole,
        type: 'LEVEL_UNLOCKED',
        title: `Level ${levelNumber} Unlocked`,
        message: `Level ${levelNumber} : ${assessmentName} Assessment is now Unlocked`,
        metadata: {
          levelNumber,
        },
      });
      this.logger.log(
        `Level unlocked notification saved for user ${userId}, level ${levelNumber}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to save level unlocked notification: ${err.message}`,
      );
    }
  }

  private async sendAdminNotification(data: any) {
    const adminServiceUrl =
      this.configService.get('ADMIN_SERVICE_URL') || 'http://localhost:4001';
    try {
      await lastValueFrom(
        this.httpService.post(
          `${adminServiceUrl}/notifications/internal`,
          data,
        ),
      );
      this.logger.log('Admin notification sent successfully');
    } catch (err) {
      this.logger.error(
        'Failed to send admin notification via internal API',
        err.message,
      );
    }
  }
}
