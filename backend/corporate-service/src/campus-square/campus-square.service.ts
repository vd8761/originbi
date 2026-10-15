import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';

import {
  CorporateAccount,
  User,
  Registration,
  Groups,
  Program,
  AssessmentSession,
  AssessmentAttempt,
  AssessmentLevel,
  AssessmentQuestion,
  OpenQuestion,
  AssessmentAnswer,
  PersonalityTrait,
} from '@originbi/shared-entities';

import { getWelcomeEmailTemplate } from '../mail/templates/welcome.template';
import { SettingsService } from '../settings/settings.service';
import { RegisterCampusSquareCandidateDto } from './dto/register-campus-square.dto';

const CAMPUS_SQUARE_CORP_ID = 22;
const CAMPUS_SQUARE_CORP_USER_ID = 1744;
const SCHOOL_PROGRAM_ID = 1;
const BEHAVIORAL_LEVEL_ID = 1;

@Injectable()
export class CampusSquareService {
  private readonly logger = new Logger(CampusSquareService.name);
  private get authServiceBaseUrl(): string {
    return (process.env.AUTH_SERVICE_URL || '').trim();
  }
  private get campusSquareWebhookUrl(): string {
    return (process.env.CAMPUS_SQUARE_WEBHOOK_URL || '').trim();
  }

  constructor(
    @InjectRepository(CorporateAccount)
    private readonly corpRepo: Repository<CorporateAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(AssessmentQuestion)
    private readonly questionRepo: Repository<AssessmentQuestion>,
    @InjectRepository(OpenQuestion)
    private readonly openQuestionRepo: Repository<OpenQuestion>,
    @InjectRepository(PersonalityTrait)
    private readonly traitRepo: Repository<PersonalityTrait>,

    private readonly dataSource: DataSource,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeMobile(mobile: string): string {
    return String(mobile || '').replace(/\D/g, '');
  }

  private resolveWelcomeFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://mind.originbi.com/';
  }

  private shuffleOptions(array: number[]): number[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Registers a student candidate for Campus Square.
   * - Corporate Account ID: 22
   * - School Students Program only (Program ID 1)
   * - Level 1 Behavioral Assessment only (Level ID 1)
   * - No credit deduction
   * - Exactly 30 questions generated (24 Main DISC + 6 Survey)
   */
  async registerCandidate(dto: RegisterCampusSquareCandidateDto) {
    const email = this.normalizeEmail(dto.email);
    const mobileDigits = this.normalizeMobile(dto.mobile);

    if (!mobileDigits) {
      throw new BadRequestException('Valid mobile number is required');
    }

    // 1. Fetch Campus Square Corporate Account
    let corporateAccount = await this.corpRepo.findOne({
      where: { id: CAMPUS_SQUARE_CORP_ID },
    });

    if (!corporateAccount) {
      corporateAccount = await this.corpRepo.findOne({
        where: { companyName: 'Campus Square' },
      });
    }

    if (!corporateAccount) {
      corporateAccount = await this.corpRepo.findOne({
        where: { userId: CAMPUS_SQUARE_CORP_USER_ID },
      });
    }

    if (!corporateAccount) {
      this.logger.error('Campus Square corporate account record not found');
      throw new BadRequestException(
        'Campus Square corporate account is not configured in database',
      );
    }

    const corpUserId = corporateAccount.userId || CAMPUS_SQUARE_CORP_USER_ID;

    // 2. Check for duplicate email or mobile
    const [existingByEmail, existingByMobile] = await Promise.all([
      this.userRepo
        .createQueryBuilder('u')
        .where('LOWER(u.email) = :email', { email })
        .getOne(),
      this.userRepo
        .createQueryBuilder('u')
        .where(
          "regexp_replace(COALESCE(u.metadata->>'mobile', ''), '\\D', '', 'g') = :mobile",
          { mobile: mobileDigits },
        )
        .getOne(),
    ]);

    if (existingByEmail) {
      throw new BadRequestException(`Email '${email}' is already registered`);
    }
    if (existingByMobile) {
      throw new BadRequestException(
        `Mobile number '${dto.mobile}' is already registered`,
      );
    }

    // 3. Auto-generate password if not provided
    const password =
      dto.password ||
      `${crypto.randomBytes(8).toString('hex')}A1!`;

    // 4. Create Cognito User
    let sub: string;
    const authUrl = this.authServiceBaseUrl;
    if (!authUrl) {
      throw new BadRequestException(
        'Authentication service URL (AUTH_SERVICE_URL) is not configured',
      );
    }
    try {
      const res = await firstValueFrom(
        this.http.post(`${authUrl}/internal/cognito/users`, {
          email,
          password,
          groupName: 'STUDENT',
        }),
      );
      sub = (res as any)?.data?.sub;
      if (!sub) {
        throw new Error('No user sub returned from auth service');
      }
    } catch (err: any) {
      this.logger.error(
        `Cognito creation failed via auth service (${err.message}):`,
        err?.response?.data || err,
      );
      throw new BadRequestException(
        `Failed to provision student login credentials: ${err?.response?.data?.message || err.message}`,
      );
    }

    // 5. Fetch Program (School Students - Program ID 1)
    let program = await this.programRepo.findOne({
      where: { id: SCHOOL_PROGRAM_ID.toString() as any },
    });
    if (!program) {
      program = await this.programRepo.findOne({
        where: { code: 'SCHOOL_STUDENT' },
      });
    }
    if (!program) {
      throw new BadRequestException('School Students program not found');
    }

    // 6. Execute Transaction (Without any credit checks or deduction)
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        // A. Create User (Candidate)
        const user = manager.create(User, {
          email,
          role: 'STUDENT',
          emailVerified: true,
          cognitoSub: sub,
          isActive: true,
          isBlocked: false,
          corporateId: String(corporateAccount.id),
          metadata: {
            fullName: dto.fullName,
            mobile: dto.mobile,
            gender: dto.gender || 'OTHER',
            source: 'CAMPUS_SQUARE',
            eventSlug: dto.eventSlug,
            eventName: dto.eventName,
          },
        });
        await manager.save(user);

        // B. Find or Create Group
        let groupId: number | null = null;
        const groupName =
          dto.groupName || dto.eventName || 'Campus Square Candidates';
        let group = await manager.getRepository(Groups).findOne({
          where: {
            name: groupName,
            corporateAccountId: corporateAccount.id,
          },
        });
        if (!group) {
          group = manager.create(Groups, {
            name: groupName,
            corporateAccountId: corporateAccount.id,
            createdByUserId: corpUserId,
            isActive: true,
          });
          await manager.save(group);
        }
        groupId = group.id;

        // C. Create Registration
        const board = dto.studentBoard?.trim().toUpperCase() || 'CBSE';
        const registration = manager.create(Registration, {
          userId: user.id,
          programId: Number(program.id),
          registrationSource: 'CORPORATE',
          createdByUserId: corpUserId,
          corporateAccountId: corporateAccount.id,
          status: 'COMPLETED',
          fullName: dto.fullName,
          mobileNumber: dto.mobile,
          gender: dto.gender || 'OTHER',
          countryCode: '+91',
          groupId: groupId,
          studentBoard: board,
          schoolLevel: dto.schoolLevel || null,
          schoolStream: dto.schoolStream || null,
          metadata: {
            source: 'CAMPUS_SQUARE',
            eventSlug: dto.eventSlug,
            eventName: dto.eventName,
            programType: 'School Students',
            groupName: groupName,
            studentBoard: board,
            schoolLevel: dto.schoolLevel || null,
            schoolStream: dto.schoolStream || null,
          },
        });
        await manager.save(registration);

        // D. Create Assessment Session (14 days validity)
        const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
        const validTo = dto.examEnd
          ? new Date(dto.examEnd)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const session = manager.create(AssessmentSession, {
          userId: user.id,
          registrationId: registration.id,
          programId: Number(program.id),
          groupId: groupId,
          status: 'NOT_STARTED',
          validFrom,
          validTo,
          metadata: {
            source: 'CAMPUS_SQUARE',
            totalQuestions: 30,
            eventSlug: dto.eventSlug,
          },
        });
        await manager.save(session);

        registration.assessmentSessionId = session.id;
        await manager.save(registration);

        // E. Create Assessment Attempt for Level 1 (Behavioral) ONLY
        const attempt = manager.create(AssessmentAttempt, {
          userId: user.id,
          registrationId: registration.id,
          assessmentSessionId: session.id,
          programId: Number(program.id),
          assessmentLevelId: BEHAVIORAL_LEVEL_ID,
          status: 'NOT_STARTED',
          metadata: {
            source: 'CAMPUS_SQUARE',
            totalQuestions: 30,
          },
        });
        await manager.save(attempt);

        // F. Generate Exactly 30 Questions (24 Main DISC + 6 Survey)
        await this.generateCampusSquareQuestions(attempt, board, manager);

        // G. Send Welcome Email (Non-blocking)
        const sendEmail = dto.sendEmail !== false;
        if (sendEmail) {
          void this.sendWelcomeEmail(
            email,
            dto.fullName,
            password,
            validFrom,
            program.assessmentTitle || program.name,
          );
        }

        return {
          success: true,
          message: 'Campus Square candidate registered successfully',
          registrationId: registration.id,
          userId: user.id,
          sessionId: session.id,
          attemptId: attempt.id,
          programId: Number(program.id),
          corporateAccountId: corporateAccount.id,
          totalQuestions: 30,
          questionBreakdown: {
            mainDiscQuestions: 24,
            surveyQuestions: 6,
          },
          student: {
            fullName: dto.fullName,
            email,
            mobile: dto.mobile,
            studentBoard: board,
          },
        };
      },
    );

    return result;
  }

  /**
   * Generates exactly 30 questions for Campus Square Level 1:
   * - 24 Main DISC Questions from assessment_questions (Program 1, Level 1)
   * - 6 Survey Questions from open_questions (question_type = 'SURVEY')
   * - Scatters survey questions among main questions
   * - Bulk inserts 30 rows in assessment_answers
   */
  private async generateCampusSquareQuestions(
    attempt: AssessmentAttempt,
    board: string,
    manager: EntityManager,
  ) {
    this.logger.log(
      `Generating 30 Campus Square questions (24 DISC + 6 Survey) for attempt ${attempt.id}, board=${board}`,
    );

    // 1. Select 24 Main DISC questions
    let setsResult = await manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .select('DISTINCT q.set_number', 'setNumber')
      .where('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .andWhere('q.board = :board', { board })
      .getRawMany<{ setNumber: number }>();

    let usedBoard: string | null = board;
    if (!setsResult || setsResult.length === 0) {
      this.logger.warn(
        `No sets found for board=${board}. Falling back to any board for Program 1, Level 1.`,
      );
      usedBoard = null;
      setsResult = await manager
        .createQueryBuilder(AssessmentQuestion, 'q')
        .select('DISTINCT q.set_number', 'setNumber')
        .where('q.program_id = :programId', { programId: attempt.programId })
        .andWhere('q.assessment_level_id = :levelId', {
          levelId: attempt.assessmentLevelId,
        })
        .andWhere('q.is_active = true')
        .andWhere('q.is_deleted = false')
        .getRawMany<{ setNumber: number }>();
    }

    if (!setsResult || setsResult.length === 0) {
      throw new Error(
        'No active DISC questions available for School Students Level 1.',
      );
    }

    const sets = setsResult
      .map((s) => s.setNumber)
      .filter((n) => n != null && n > 0);
    const selectedSet = sets[Math.floor(Math.random() * sets.length)] || 1;

    let mainQb = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .where('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .andWhere('q.set_number = :setNumber', { setNumber: selectedSet });

    if (usedBoard) {
      mainQb = mainQb.andWhere('q.board = :board', { board: usedBoard });
    }

    const mainQuestions = await mainQb
      .orderBy('RANDOM()')
      .limit(24)
      .getMany();

    if (mainQuestions.length < 24) {
      this.logger.warn(
        `Selected set ${selectedSet} had only ${mainQuestions.length} questions. Fetching remaining from all sets.`,
      );
      const remainingCount = 24 - mainQuestions.length;
      const existingIds = mainQuestions.map((q) => q.id);
      let fallbackQb = manager
        .createQueryBuilder(AssessmentQuestion, 'q')
        .where('q.program_id = :programId', { programId: attempt.programId })
        .andWhere('q.assessment_level_id = :levelId', {
          levelId: attempt.assessmentLevelId,
        })
        .andWhere('q.is_active = true')
        .andWhere('q.is_deleted = false');

      if (existingIds.length > 0) {
        fallbackQb = fallbackQb.andWhere('q.id NOT IN (:...existingIds)', {
          existingIds,
        });
      }
      const additional = await fallbackQb
        .orderBy('RANDOM()')
        .limit(remainingCount)
        .getMany();
      mainQuestions.push(...additional);
    }

    // 2. Select 6 Survey Questions
    const surveySetsResult = await manager
      .createQueryBuilder(OpenQuestion, 'oq')
      .select('DISTINCT oq.set_number', 'setNumber')
      .where('oq.is_active = true')
      .andWhere('oq.is_deleted = false')
      .andWhere('oq.question_type = :qt', { qt: 'SURVEY' })
      .andWhere('oq.set_number IS NOT NULL')
      .getRawMany<{ setNumber: number }>();

    const surveySets = surveySetsResult
      .map((s) => s.setNumber)
      .filter((n) => n != null && n > 0);
    const chosenSurveySet =
      surveySets.length > 0
        ? surveySets[Math.floor(Math.random() * surveySets.length)]
        : 1;

    const surveyQuestions = await manager
      .createQueryBuilder(OpenQuestion, 'oq')
      .where('oq.is_active = true')
      .andWhere('oq.is_deleted = false')
      .andWhere('oq.question_type = :qt', { qt: 'SURVEY' })
      .andWhere('oq.set_number = :sn', { sn: chosenSurveySet })
      .orderBy('RANDOM()')
      .limit(6)
      .getMany();

    // 3. Assemble and scatter the 6 survey questions among the 24 main questions
    const ordered: Array<{ source: 'MAIN' | 'OPEN'; id: number }> =
      mainQuestions.map((q) => ({ source: 'MAIN' as const, id: q.id }));

    for (const sq of surveyQuestions) {
      const pos = Math.floor(Math.random() * (ordered.length + 1));
      ordered.splice(pos, 0, { source: 'OPEN', id: sq.id });
    }

    // 4. Build assessment_answers entries
    const answersToInsert: Partial<AssessmentAnswer>[] = [];
    let seq = 1;

    for (const item of ordered) {
      answersToInsert.push({
        assessmentAttemptId: attempt.id,
        assessmentSessionId: attempt.assessmentSessionId,
        userId: attempt.userId,
        registrationId: attempt.registrationId,
        programId: attempt.programId,
        assessmentLevelId: attempt.assessmentLevelId,
        questionSource: item.source,
        mainQuestionId: item.source === 'MAIN' ? item.id : undefined,
        openQuestionId: item.source === 'OPEN' ? item.id : undefined,
        questionSequence: seq++,
        questionOptionsOrder: JSON.stringify(
          this.shuffleOptions([1, 2, 3, 4]),
        ),
        status: 'NOT_ANSWERED',
      });
    }

    if (answersToInsert.length > 0) {
      await manager.getRepository(AssessmentAnswer).insert(answersToInsert);
    }

    this.logger.log(
      `Successfully generated ${answersToInsert.length} questions (24 DISC + 6 Survey) for attempt ${attempt.id}`,
    );
  }

  /**
   * Automatically triggered via cron or called on-demand:
   * Finds any completed assessment attempts for Campus Square candidates
   * and delivers the evaluated results (D, I, S, C scores, primary trait, profile style)
   * to Campus Square webhook to be saved in Campus Square database.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async syncCompletedAssessments(limit = 20) {
    try {
      // Find completed attempts for Corporate ID 22 that haven't been synced to Campus Square yet
      const completedAttempts = await this.attemptRepo
        .createQueryBuilder('a')
        .innerJoin(Registration, 'r', 'r.id = a.registration_id')
        .where('r.corporate_account_id = :corpId', { corpId: CAMPUS_SQUARE_CORP_ID })
        .andWhere('a.status = :status', { status: 'COMPLETED' })
        .andWhere('a.assessment_level_id = :levelId', { levelId: BEHAVIORAL_LEVEL_ID })
        .andWhere("(a.metadata->>'syncedToCampusSquare' IS NULL OR a.metadata->>'syncedToCampusSquare' != 'true')")
        .limit(limit)
        .getMany();

      if (!completedAttempts || completedAttempts.length === 0) {
        return { syncedCount: 0, message: 'No pending completed assessments to sync' };
      }

      this.logger.log(
        `Found ${completedAttempts.length} completed Campus Square assessments to sync to Campus Square database`,
      );

      let successCount = 0;
      for (const attempt of completedAttempts) {
        try {
          const user = await this.userRepo.findOne({
            where: { id: attempt.userId },
          });
          if (!user) continue;

          // Resolve DISC scores
          let discScores = (attempt.metadata as any)?.disc_scores;
          if (!discScores) {
            // Calculate directly from answers
            const scoreRows = await this.dataSource.query(
              `SELECT o.disc_factor, SUM(o.score_value)::float as total 
               FROM assessment_answers a 
               JOIN assessment_question_options o ON a.main_option_id = o.id 
               WHERE a.assessment_attempt_id = $1 
               GROUP BY o.disc_factor`,
              [attempt.id],
            );
            discScores = {};
            for (const row of scoreRows) {
              if (row.disc_factor) {
                discScores[row.disc_factor] = row.total;
              }
            }
          }

          const scoreD = Number(discScores?.D ?? discScores?.d ?? 0);
          const scoreI = Number(discScores?.I ?? discScores?.i ?? 0);
          const scoreS = Number(discScores?.S ?? discScores?.s ?? 0);
          const scoreC = Number(discScores?.C ?? discScores?.c ?? 0);

          // Resolve dominant personality trait
          let primaryTrait = 'D';
          let profileType = 'Bold Driver';

          if (attempt.dominantTraitId) {
            const trait = await this.traitRepo.findOne({
              where: { id: attempt.dominantTraitId },
            });
            if (trait) {
              primaryTrait = trait.code;
              profileType = trait.blendedStyleName;
            }
          }

          const frontendUrl = this.resolveWelcomeFrontendUrl();
          const skillDocumentUrl = `${frontendUrl}reports/assessment/${attempt.id}`;

          // Post to Campus Square webhook
          const payload = {
            email: user.email,
            mobile: (user.metadata as any)?.mobile || user.metadata?.['mobile'],
            scoreD,
            scoreI,
            scoreS,
            scoreC,
            primaryTrait,
            profileType,
            skillDocumentUrl,
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (process.env.ORIGINBI_WEBHOOK_SECRET) {
            headers['x-webhook-secret'] = process.env.ORIGINBI_WEBHOOK_SECRET;
          }

          const webhookUrl = this.campusSquareWebhookUrl;
          if (!webhookUrl) {
            this.logger.warn(
              'CAMPUS_SQUARE_WEBHOOK_URL is not configured. Skipping webhook delivery.',
            );
            continue;
          }

          const webhookRes = await firstValueFrom(
            this.http.post(webhookUrl, payload, {
              headers,
              timeout: 10000,
            }),
          );

          if (webhookRes.status >= 200 && webhookRes.status < 300) {
            // Mark attempt as synced
            const meta = attempt.metadata || {};
            meta.syncedToCampusSquare = 'true';
            meta.syncedAt = new Date().toISOString();
            attempt.metadata = meta;
            await this.attemptRepo.save(attempt);
            successCount++;
            this.logger.log(
              `Successfully synced attempt ${attempt.id} (${user.email}) to Campus Square DB`,
            );
          }
        } catch (syncErr: any) {
          this.logger.warn(
            `Failed to sync attempt ${attempt.id} to Campus Square: ${syncErr?.message}`,
          );
        }
      }

      return {
        syncedCount: successCount,
        totalPending: completedAttempts.length,
      };
    } catch (err: any) {
      this.logger.error(`Error in syncCompletedAssessments: ${err?.message}`);
      return { syncedCount: 0, error: err?.message };
    }
  }

  private async sendWelcomeEmail(
    to: string,
    name: string,
    pass: string,
    startDateTime?: Date | string,
    assessmentTitle?: string,
  ) {
    this.logger.log(
      `Attempting to send welcome email to Campus Square candidate ${to}`,
    );

    try {
      const sesClient = new SESClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          ...(process.env.AWS_SESSION_TOKEN
            ? { sessionToken: process.env.AWS_SESSION_TOKEN }
            : {}),
        },
      });

      const apiUrl =
        process.env.API_URL || process.env.CORPORATE_SERVICE_URL || '';

      const assets = {
        popper: `${apiUrl}/email-assets/Popper.png`,
        pattern: `${apiUrl}/email-assets/Pattern_mask.png`,
        footer: `${apiUrl}/email-assets/Email_Vector.png`,
        logo: `${apiUrl}/email-assets/logo.png`,
      };
      const frontendUrl = this.resolveWelcomeFrontendUrl();

      const html = getWelcomeEmailTemplate(
        name,
        to,
        pass,
        frontendUrl,
        assets,
        startDateTime,
        assessmentTitle,
      );

      let fromName = 'Campus Square & OriginBI';
      let fromEmail = 'no-reply@originbi.com';
      try {
        const config = await this.settingsService.getEmailConfig(
          'corporate_welcome_email_config',
        );
        if (config?.fromName) fromName = config.fromName;
        if (config?.fromAddress) fromEmail = config.fromAddress;
      } catch {
        // Fallback to default
      }

      const source = `"${fromName}" <${fromEmail}>`;

      const command = new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: {
            Data: 'Your Campus Square Assessment Invitation - OriginBI',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await sesClient.send(command);
      this.logger.log(`Welcome email successfully sent to ${to}`);
    } catch (err: any) {
      this.logger.warn(`Could not dispatch welcome email: ${err.message}`);
    }
  }
}

