import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, Not } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import {
  User as AdminUser,
  Registration,
  Program,
  AssessmentSession,
  AssessmentAttempt,
  AssessmentLevel,
  Department,
  DepartmentDegree,
  DegreeType,
  GroupAssessment,
} from '@originbi/shared-entities';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { GroupsService } from '../groups/groups.service';
import { AssessmentGenerationService } from '../assessment/assessment-generation.service';
import { MetaphorGenerationService } from '../assessment/metaphor-generation.service';
import { getStudentWelcomeEmailTemplate } from '../mail/templates/student-welcome.template';
import { SettingsService } from '../settings/settings.service';
import { WhatsappTemplatesService } from '../whatsapp/whatsapp-templates.service';
import { SmsService, SmsTemplate } from '../sms/sms.service';
import { LevelEligibilityService } from '../levels/level-eligibility.service';

import * as nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  private authServiceBaseUrl = process.env.AUTH_SERVICE_URL;

  private readonly ADMIN_USER_ID = 1;

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeMobile(mobile: string): string {
    return String(mobile || '').replace(/\D/g, '');
  }

  constructor(
    @InjectRepository(AdminUser)
    private readonly userRepo: Repository<AdminUser>,

    @InjectRepository(Registration)
    private readonly regRepo: Repository<Registration>,

    @InjectRepository(GroupAssessment)
    private readonly groupAssessmentRepo: Repository<GroupAssessment>,

    private readonly groupsService: GroupsService,
    private readonly assessmentGenService: AssessmentGenerationService,
    private readonly metaphorGenService: MetaphorGenerationService,

    private readonly dataSource: DataSource,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
    private readonly whatsappTemplates: WhatsappTemplatesService,
    private readonly smsService: SmsService,
    private readonly levelEligibility: LevelEligibilityService,
  ) {}

  /**
   * Resolve the assessment levels a registration should receive, in order.
   * Replaces the old `find({ where: { isMandatory: true }})` lookups — the
   * decision now comes from the admin-configurable `levels.*` settings via
   * LevelEligibilityService (enable flag + program/department/board scope).
   */
  private async resolveEnabledLevels(
    manager: EntityManager,
    registration: Registration,
    programId: number,
  ): Promise<AssessmentLevel[]> {
    const levels = await manager.getRepository(AssessmentLevel).find({
      order: { sortOrder: 'ASC' },
    });

    let departmentId: number | string | null = null;
    if (registration.departmentDegreeId) {
      const rows = (await manager.query(
        `SELECT department_id FROM department_degrees WHERE id = $1 LIMIT 1`,
        [registration.departmentDegreeId],
      )) as Array<{ department_id: number | string | null }>;
      departmentId = rows?.[0]?.department_id ?? null;
    }

    return this.levelEligibility.filterEnabledLevels(levels, {
      programId,
      departmentDegreeId: registration.departmentDegreeId,
      departmentId,
      studentBoard: registration.studentBoard,
    });
  }

  /** True when a level is the Metaphor level, robust to its level number. */
  private isMetaphorLevel(level: AssessmentLevel): boolean {
    return (
      String(level.patternType || '').toUpperCase() === 'METAPHOR' ||
      Boolean(level.name?.toLowerCase().includes('metaphor'))
    );
  }

  /** True when a level is the Level 1 Behavioral (DISC) level. */
  private isBehavioralLevel(level: AssessmentLevel): boolean {
    return (
      level.levelNumber === 1 ||
      String(level.patternType || '').toUpperCase() === 'DISC' ||
      level.name === 'Level 1'
    );
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    retries = 5,
    delay = 1000,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      type Retryable = {
        response?: { status?: number };
        code?: string;
        message?: string;
      };
      const err =
        typeof error === 'object' && error !== null ? (error as Retryable) : {};

      const isRateLimit =
        err.response?.status === 429 ||
        err.code === 'TooManyRequestsException' ||
        (typeof err.message === 'string' &&
          err.message.includes('Too Many Requests'));

      if (retries > 0 && isRateLimit) {
        this.logger.warn(
          `Rate limit hit in RegistrationsService. Retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((res) => setTimeout(res, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // ---------------------------------------------------------
  // Helper: Call auth-service to create a Cognito user
  // ---------------------------------------------------------
  private async createCognitoUser(email: string, password: string) {
    try {
      const res = await this.withRetry(() =>
        firstValueFrom(
          this.http.post(
            `${this.authServiceBaseUrl}/internal/cognito/users`,
            { email, password },
            { proxy: false },
          ),
        ),
      );
      return res.data as { sub?: string };
    } catch (err: unknown) {
      type AuthErr = {
        response?: { data?: any; status?: number };
        message?: string;
        code?: string;
      };
      const e = typeof err === 'object' && err !== null ? (err as AuthErr) : {};

      const authErr = e.response?.data || e.message || err;

      this.logger.error('Error creating Cognito user:', authErr);

      const msg =
        typeof authErr === 'object' && authErr !== null
          ? authErr.message || JSON.stringify(authErr)
          : String(authErr);

      throw new InternalServerErrorException(
        `Failed to create Cognito user at ${this.authServiceBaseUrl} (Proxy: ${process.env.http_proxy || 'none'}): ${msg}`,
      );
    }
  }

  // ---------------------------------------------------------
  // Normalizers
  // ---------------------------------------------------------
  private normalizeGender(
    g?: string | null,
  ): 'MALE' | 'FEMALE' | 'OTHER' | null {
    if (!g) return null;
    const v = g.trim().toUpperCase();
    return ['MALE', 'FEMALE', 'OTHER'].includes(v)
      ? (v as 'MALE' | 'FEMALE' | 'OTHER')
      : null;
  }

  private normalizeSchoolLevel(
    level?: string | null,
  ): 'SSLC' | 'HSC' | 'GCSE' | null {
    if (!level) return null;
    const v = level.trim().toUpperCase();
    return ['SSLC', 'HSC', 'GCSE'].includes(v)
      ? (v as 'SSLC' | 'HSC' | 'GCSE')
      : null;
  }

  private normalizeSchoolStream(
    stream?: string | null,
  ):
    | 'PCMB'
    | 'PCB'
    | 'PCM'
    | 'PCBZ'
    | 'SCIENCE'
    | 'COMMERCE'
    | 'HUMANITIES'
    | null {
    if (!stream) return null;
    const v = stream.trim().toUpperCase();
    return [
      'PCMB',
      'PCB',
      'PCM',
      'PCBZ',
      'SCIENCE',
      'COMMERCE',
      'HUMANITIES',
    ].includes(v)
      ? (v as
          | 'PCMB'
          | 'PCB'
          | 'PCM'
          | 'PCBZ'
          | 'SCIENCE'
          | 'COMMERCE'
          | 'HUMANITIES')
      : null;
  }

  private toBigIntOrNull(v?: string | null): number | null {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  // ---------------------------------------------------------
  // CREATE REGISTRATION
  // ---------------------------------------------------------
  async create(dto: CreateRegistrationDto) {
    dto.email = this.normalizeEmail(dto.email);
    const mobileDigits = this.normalizeMobile(dto.mobile);

    if (!mobileDigits) {
      throw new BadRequestException('Valid mobile number is required');
    }

    this.logger.log(`[AdminRegister] Payload: ${JSON.stringify(dto)}`);
    this.logger.log(`Creating registration for ${dto.email}`);

    // 1. Basic Validation
    const [existingByEmail, existingByMobile] = await Promise.all([
      this.userRepo
        .createQueryBuilder('u')
        .where('LOWER(u.email) = :email', { email: dto.email })
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
      throw new BadRequestException('Email already registered locally');
    }
    if (existingByMobile) {
      throw new BadRequestException('Mobile number already registered locally');
    }

    // 2. Cognito Creation (External Helper)
    // We do this BEFORE transaction because if it fails, we don't want to burn DB IDs.
    // If it succeeds but DB Transaction fails, we will have an orphan Cognito user.
    // Retry logic should ideally fetch existing Cognito user if error says "exists".
    const cognitoRes = await this.createCognitoUser(dto.email, dto.password);
    const sub = cognitoRes.sub!;

    // 3. Prepare Data
    const gender = this.normalizeGender(dto.gender);
    const schoolLevel = this.normalizeSchoolLevel(dto.schoolLevel);
    const schoolStream = this.normalizeSchoolStream(dto.schoolStream);
    const departmentDegreeId = this.toBigIntOrNull(dto.departmentId);
    const currentRole = dto.currentRole?.trim() || undefined;
    const roleDescription = dto.roleDescription?.trim() || undefined;

    // 4. Transaction
    try {
      return await this.dataSource.transaction(async (manager) => {
        // A. Create User
        const user = manager.create(AdminUser, {
          email: dto.email,
          role: 'STUDENT',
          emailVerified: true,
          cognitoSub: sub,
          isActive: true,
          isBlocked: false,
          metadata: {
            fullName: dto.name,
            countryCode: dto.countryCode ?? '+91',
            mobile: dto.mobile,
            gender: gender,
          },
        });
        await manager.save(user);

        // B. Get or Create Group
        let groupId: number | null = null;
        if (dto.groupName) {
          const group = await this.groupsService.findOrCreate(
            dto.groupName,
            manager,
          );
          groupId = group.id;
        }

        // C. Determine Program
        let programId: number;
        let programTitle: string;
        let selectedProgram: Program | null = null;

        if (dto.programType) {
          // Strict lookup for selected program (by ID or Name)
          const isNumericId =
            !isNaN(Number(dto.programType)) &&
            String(dto.programType).trim() !== '';

          selectedProgram = await manager.getRepository(Program).findOne({
            where: isNumericId
              ? { id: Number(dto.programType) }
              : { name: dto.programType },
          });

          if (!selectedProgram) {
            throw new BadRequestException(
              `Selected Program ('${dto.programType}') not found.`,
            );
          }
          if (!selectedProgram.isActive) {
            throw new BadRequestException(
              `Selected Program '${selectedProgram.name}' is not active.`,
            );
          }

          programId = Number(selectedProgram.id);
          programTitle =
            selectedProgram.assessmentTitle || selectedProgram.name;
        } else {
          // Fallback: Pick any active program (Legacy / Default)
          selectedProgram = await manager
            .getRepository(Program)
            .findOne({ where: { isActive: true } });

          if (!selectedProgram) {
            throw new BadRequestException(
              'No active Program found in the system. Please create a Program first.',
            );
          }

          programId = Number(selectedProgram.id);
          programTitle =
            selectedProgram.assessmentTitle || selectedProgram.name;
        }

        // D. Create Registration (INCOMPLETE)
        const registration = manager.create(Registration, {
          userId: user.id,
          registrationSource: 'ADMIN',
          createdByUserId: this.ADMIN_USER_ID,
          status: 'INCOMPLETE',
          fullName: dto.name,
          countryCode: dto.countryCode ?? '+91',
          mobileNumber: dto.mobile,
          gender: gender,
          schoolLevel,
          schoolStream,
          departmentDegreeId,
          program: { id: programId } as any, // Link to selected program
          group: groupId ? { id: groupId } : undefined,
          studentBoard: dto.studentBoard,
          metadata: {
            programType: dto.programType,
            groupName: dto.groupName,
            sendEmail: dto.sendEmail,
            currentYear: dto.currentYear,
            currentRole,
            roleDescription,
            examStart: dto.examStart,
            examEnd: dto.examEnd,
            departmentId: dto.departmentId ?? null,
            studentBoard: dto.studentBoard,
          },
          isTechAssessment: (dto.is_tech_assessment ?? 0) as any,
        });
        await manager.save(registration);

        // E. Create Assessment Session

        const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
        const validTo = dto.examEnd
          ? new Date(dto.examEnd)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days default

        // E1. Find-or-create GroupAssessment so this user shows up in the
        // Group Assessment dashboard (parity with bulk-registrations flow).
        // Dedupe by (groupId, programId) with overlapping validity window so
        // admins adding users one-by-one to the same cohort get a single
        // assessment row with an incrementing candidate count.
        let groupAssessmentId: number | null = dto.groupAssessmentId ?? null;
        if (groupId && !groupAssessmentId) {
          const gaRepo = manager.getRepository(GroupAssessment);
          const existingGa = await gaRepo
            .createQueryBuilder('ga')
            .where('ga.group_id = :groupId', { groupId })
            .andWhere('ga.program_id = :programId', { programId })
            .andWhere(
              '(ga.valid_to IS NULL OR ga.valid_to >= :from) AND (ga.valid_from IS NULL OR ga.valid_from <= :to)',
              { from: validFrom, to: validTo },
            )
            .orderBy('ga.created_at', 'DESC')
            .getOne();

          if (existingGa) {
            existingGa.totalCandidates = (existingGa.totalCandidates || 0) + 1;
            const savedGa = await gaRepo.save(existingGa);
            groupAssessmentId = Number(savedGa.id);
          } else {
            const newGa = gaRepo.create({
              groupId: Number(groupId),
              programId: Number(programId),
              validFrom,
              validTo,
              totalCandidates: 1,
              status: 'NOT_STARTED',
              createdByUserId: this.ADMIN_USER_ID,
              metadata: {
                source: 'ADMIN_SINGLE',
              },
            });
            const savedGa = await gaRepo.save(newGa);
            groupAssessmentId = Number(savedGa.id);
          }
        }

        const session = manager.create(AssessmentSession, {
          userId: user.id,
          registrationId: registration.id,
          programId: programId,
          groupId: groupId ?? null,
          groupAssessmentId: groupAssessmentId,
          status: 'NOT_STARTED',
          validFrom,
          validTo,
          metadata: {},
        });
        await manager.save(session);

        // E. Create Assessment Attempts for the levels enabled for this
        // registration (per-level enable + program/department/board scope,
        // resolved from the `levels.*` settings). Ordered Level 1 -> N.
        const levels = await this.resolveEnabledLevels(
          manager,
          registration,
          programId,
        );

        this.logger.log(
          `Resolved ${levels.length} enabled level(s) for new registration ${registration.id}.`,
        );

        if (!levels || levels.length === 0) {
          this.logger.warn(
            'No enabled assessment levels resolved. Registration will proceed without attempts.',
          );
        }

        for (const level of levels) {
          const attempt = manager.create(AssessmentAttempt, {
            userId: user.id,
            registrationId: registration.id,
            programId: programId,
            assessmentSessionId: session.id,
            assessmentLevelId: level.id,
            status: 'NOT_STARTED',
          });
          await manager.save(attempt);

          // F. Generate questions for this level.
          // Level 1 (Behavioral) is the only level whose questions are
          // generated up-front; ACI (L2) is generated lazily on first start,
          // IAT (L3) builds its trials lazily, Metaphor (L4) is gated below.
          if (this.isBehavioralLevel(level)) {
            try {
              await this.assessmentGenService.generateQuestions(
                attempt,
                manager,
              );
            } catch (err) {
              this.logger.error(
                `Failed to generate questions for Attempt ${attempt.id} (Level ${level.id}):`,
                err,
              );
              // CRITICAL: Re-throw to cause transaction rollback.
              // We cannot allow a registration without questions for Level 1.
              throw err;
            }
          }
          // Metaphor — gated; skips silently if no bank. NON-FATAL: a metaphor
          // failure must never roll back the core registration (Level 1).
          // Matched by pattern_type so it is robust to the level number.
          else if (this.isMetaphorLevel(level)) {
            try {
              await this.metaphorGenService.generate(attempt, manager);
            } catch (err) {
              this.logger.error(
                `Metaphor generation failed for Attempt ${attempt.id} (non-fatal):`,
                err,
              );
            }
          }
        }

        // G. Update Registration to COMPLETED
        registration.status = 'COMPLETED';
        await manager.save(registration);

        // H. Send Email (Best Effort — check global toggle + per-request flag)
        if (dto.sendEmail && dto.password) {
          try {
            const sendEnabled = await this.settingsService.getValue<boolean>(
              'email',
              'send_registration_email',
            );
            if (sendEnabled === false) {
              this.logger.log(
                'Registration email disabled via global settings. Skipping.',
              );
            } else {
              await this.sendWelcomeEmail(
                dto.email,
                dto.name,
                dto.password,
                validFrom,
                programTitle,
              );
            }
          } catch (emailErr) {
            this.logger.error('Failed to send welcome email', emailErr);
            // Do not rollback
          }
        }

        // I. Send Assessment Instructions WhatsApp (fire-and-forget)
        this.fireAssessmentInstructionsWhatsapp(registration).catch((err) =>
          this.logger.error(
            `Instructions WhatsApp failed for ${registration.mobileNumber}: ${err.message}`,
          ),
        );

        return {
          registrationId: registration.id,
          userId: user.id,
          email: user.email,
        };
      });
    } catch (e: unknown) {
      this.logger.error('Registration Transaction Failed', e);
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Registration Failed: ${msg}`);
    }
  }

  // ---------------------------------------------------------
  // CREATE FOR EXISTING USER (Assessment Only)
  // ---------------------------------------------------------
  async createForExistingUser(user: AdminUser, dto: CreateRegistrationDto) {
    this.logger.log(`Creating assessment for existing user ${user.email}`);

    // Check for active assessments
    const activeSession = await this.dataSource
      .getRepository(AssessmentSession)
      .findOne({
        where: {
          userId: user.id,
          status: Not(In(['COMPLETED', 'EXPIRED', 'PARTIALLY_EXPIRED'])),
        },
      });

    if (activeSession) {
      throw new BadRequestException(
        `User already has an active assessment (Status: ${activeSession.status}). Cannot assign a new one.`,
      );
    }

    // 1. Prepare Data
    const gender = this.normalizeGender(dto.gender);
    const schoolLevel = this.normalizeSchoolLevel(dto.schoolLevel);
    const schoolStream = this.normalizeSchoolStream(dto.schoolStream);
    const departmentDegreeId = this.toBigIntOrNull(dto.departmentId);
    const currentRole = dto.currentRole?.trim() || undefined;
    const roleDescription = dto.roleDescription?.trim() || undefined;

    // 2. Transaction
    return this.dataSource.transaction(async (manager) => {
      // A. Get or Create Group
      let groupId: number | null = null;
      if (dto.groupName) {
        const group = await this.groupsService.findOrCreate(
          dto.groupName,
          manager,
        );
        groupId = group.id;
      }

      // B. Create Registration
      const registration = manager.create(Registration, {
        userId: user.id,
        registrationSource: 'ADMIN',
        createdByUserId: this.ADMIN_USER_ID,
        status: 'INCOMPLETE',
        fullName: dto.name,
        countryCode: dto.countryCode ?? '+91',
        mobileNumber: dto.mobile,
        gender: gender,
        schoolLevel,
        schoolStream,
        departmentDegreeId,
        group: groupId ? { id: groupId } : undefined,
        metadata: {
          programType: dto.programType,
          groupName: dto.groupName,
          sendEmail: dto.sendEmail,
          currentYear: dto.currentYear,
          currentRole,
          roleDescription,
          examStart: dto.examStart,
          examEnd: dto.examEnd,
          departmentId: dto.departmentId ?? null,
          studentBoard: dto.studentBoard,
        },
      });
      await manager.save(registration);

      // C. Create Assessment Session & Attempts
      let programId: number;

      if (dto.programType) {
        const isNumericId =
          !isNaN(Number(dto.programType)) &&
          String(dto.programType).trim() !== '';

        const selectedProgram = await manager.getRepository(Program).findOne({
          where: isNumericId
            ? { id: Number(dto.programType) }
            : { name: dto.programType },
        });

        if (!selectedProgram)
          throw new BadRequestException(`Program ${dto.programType} not found`);
        if (!selectedProgram.isActive)
          throw new BadRequestException(`Program inactive`);

        programId = Number(selectedProgram.id);
      } else {
        const defaultProgram = await manager
          .getRepository(Program)
          .findOne({ where: { isActive: true } });
        if (!defaultProgram) throw new BadRequestException('No active Program');
        programId = Number(defaultProgram.id);
      }

      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd
        ? new Date(dto.examEnd)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = manager.create(AssessmentSession, {
        userId: user.id,
        registrationId: registration.id,
        programId: programId,
        groupId: groupId ?? null,
        groupAssessmentId: dto.groupAssessmentId ?? null,
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: {},
      });
      await manager.save(session);

      const levels = await this.resolveEnabledLevels(
        manager,
        registration,
        programId,
      );

      this.logger.log(
        `Resolved ${levels.length} enabled level(s) for existing user registration ${registration.id}.`,
      );

      if (!levels || levels.length === 0) {
        this.logger.warn(
          'No enabled assessment levels resolved. Registration will proceed without attempts.',
        );
      }

      for (const level of levels) {
        const attempt = manager.create(AssessmentAttempt, {
          userId: user.id,
          registrationId: registration.id,
          programId: programId,
          assessmentSessionId: session.id,
          assessmentLevelId: level.id,
          status: 'NOT_STARTED',
        });
        await manager.save(attempt);

        // Strictly generate questions ONLY for Level 1 (Behavioral).
        if (this.isBehavioralLevel(level)) {
          try {
            await this.assessmentGenService.generateQuestions(attempt, manager);
          } catch (err) {
            this.logger.error(
              `Failed to generate questions for Attempt ${attempt.id} (Level 1) in Existing User flow:`,
              err,
            );
            throw err;
          }
        }
        // Metaphor — gated + NON-FATAL (see create()). Matched by pattern_type.
        else if (this.isMetaphorLevel(level)) {
          try {
            await this.metaphorGenService.generate(attempt, manager);
          } catch (err) {
            this.logger.error(
              `Metaphor generation failed for Attempt ${attempt.id} (non-fatal):`,
              err,
            );
          }
        }
      }

      registration.status = 'COMPLETED';
      await manager.save(registration);

      return {
        registrationId: registration.id,
        userId: user.id,
        email: user.email,
        wasExisting: true,
      };
    });
  }

  // ---------------------------------------------------------
  // LIST REGISTRATIONS
  // ---------------------------------------------------------

  async findAll(
    page: number,
    limit: number,
    tab?: string,
    search?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
    status?: string,
    hasAiCounsellor?: boolean,
  ) {
    try {
      const qb = this.regRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.user', 'u')
        .leftJoinAndSelect('r.group', 'g')
        .leftJoinAndSelect('r.program', 'p')
        .leftJoin('DepartmentDegree', 'dd', 'r.departmentDegreeId = dd.id')
        .leftJoinAndMapOne(
          'r.deptRaw',
          'Department',
          'dept',
          'dd.departmentId = dept.id',
        )
        .leftJoinAndMapOne(
          'r.degRaw',
          'DegreeType',
          'deg',
          'dd.degreeTypeId = deg.id',
        )
        .where('r.isDeleted = false');

      if (tab === 'tech') {
        qb.andWhere('r.isTechAssessment IN (1, 2)');
      } else if (tab === 'both') {
        qb.andWhere('r.isTechAssessment = 2');
      } else {
        qb.andWhere('r.isTechAssessment IN (0, 2)');
      }

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        qb.andWhere('(LOWER(r.fullName) LIKE :s OR LOWER(u.email) LIKE :s)', {
          s,
        });
      }

      if (startDate) {
        qb.andWhere('r.createdAt >= :startDate', {
          startDate: `${startDate} 00:00:00`,
        });
      }
      if (endDate) {
        qb.andWhere('r.createdAt <= :endDate', {
          endDate: `${endDate} 23:59:59`,
        });
      }

      if (status) {
        qb.andWhere('r.status = :status', { status });
      }

      if (hasAiCounsellor !== undefined) {
        qb.andWhere('r.hasAiCounsellor = :hasAiCounsellor', {
          hasAiCounsellor,
        });
      }

      // Sorting Logic
      if (sortBy) {
        let sortCol = '';
        switch (sortBy) {
          case 'name':
            sortCol = 'r.fullName';
            break;
          case 'email':
            sortCol = 'u.email';
            break;
          case 'status':
            sortCol = 'r.status';
            break;
          case 'gender':
            sortCol = 'r.gender';
            break;
          case 'mobile_number':
            sortCol = 'r.mobileNumber';
            break;
          case 'has_ai_counsellor':
            sortCol = 'r.hasAiCounsellor';
            break;
          default:
            sortCol = 'r.createdAt';
        }
        qb.orderBy(sortCol, sortOrder);
      } else {
        qb.orderBy('r.createdAt', 'DESC');
      }

      const total = await qb.getCount();
      const rows = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const data = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        full_name: r.fullName,
        email: r.user?.email,
        country_code: r.countryCode,
        mobile_number: r.mobileNumber,
        gender: r.gender,
        programType: r.metadata?.programType || r.program?.name,
        program_name: r.program?.name || r.metadata?.programType,
        program_code:
          r.program?.code ||
          (r.metadata?.programType?.toLowerCase().includes('college')
            ? 'COLLEGE_STUDENT'
            : r.metadata?.programType?.toLowerCase().includes('school')
              ? 'SCHOOL_STUDENT'
              : r.metadata?.programType?.toLowerCase().includes('employee')
                ? 'EMPLOYEE'
                : undefined),
        groupName: r.group?.name || r.metadata?.groupName,
        status: r.status,
        school_level: r.schoolLevel,
        school_stream: r.schoolStream,
        student_board: r.studentBoard,
        current_year: r.metadata?.currentYear,
        department_degree_id: r.departmentDegreeId,
        department_name: (r as any).deptRaw?.name,
        degree_name: (r as any).degRaw?.name,
        examStart: r.metadata?.examStart,
        examEnd: r.metadata?.examEnd,
        createdAt: r.createdAt,
        has_ai_counsellor: r.hasAiCounsellor ?? false,
      }));

      return { data, total, page, limit };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `findAll Registrations Error: ${err.message}`,
        err.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch registrations: ${err.message}`,
      );
    }
  }

  // ---------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------
  async updateStatus(id: string, status: string) {
    const reg = await this.regRepo.findOne({
      where: { id: BigInt(id) as any },
    });
    if (!reg) {
      throw new BadRequestException('Registration not found');
    }

    reg.status = status as any;
    // If we need to sync with User.isActive, do it here.
    // e.g. if status === 'CANCELLED', user.isActive = false.
    return this.regRepo.save(reg);
  }

  // ---------------------------------------------------------
  // TOGGLE AI COUNSELLOR
  // ---------------------------------------------------------
  async toggleAiCounsellor(id: string, enabled: boolean) {
    const value = !!enabled;

    // Ensure column exists (safe idempotent ALTER)
    await this.dataSource
      .query(
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS has_ai_counsellor BOOLEAN NOT NULL DEFAULT false`,
      )
      .catch(() => {
        /* column already exists */
      });

    // Use raw SQL to avoid BigInt/entity serialization issues
    const result = await this.dataSource.query(
      `UPDATE registrations SET has_ai_counsellor = $1, updated_at = NOW() WHERE id = $2 RETURNING id, has_ai_counsellor`,
      [value, id],
    );

    if (!result || result.length === 0) {
      throw new BadRequestException('Registration not found');
    }

    return { success: true, hasAiCounsellor: result[0].has_ai_counsellor };
  }

  // ---------------------------------------------------------
  // CHECK AI COUNSELLOR ACCESS (public, by email)
  // ---------------------------------------------------------
  async checkCounsellorAccess(email: string): Promise<{ hasAccess: boolean }> {
    try {
      const result = await this.dataSource.query(
        `SELECT r.has_ai_counsellor
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         WHERE LOWER(u.email) = LOWER($1) AND r.is_deleted = false AND r.is_tech_assessment IN (0, 2)
         ORDER BY r.created_at DESC LIMIT 1`,
        [email],
      );
      if (result && result.length > 0) {
        return { hasAccess: !!result[0].has_ai_counsellor };
      }
      return { hasAccess: false };
    } catch (error) {
      return { hasAccess: false };
    }
  }

  // ---------------------------------------------------------
  // Helper: Send Welcome Email
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
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Instructions WhatsApp failed for ${phone}, will try SMS fallback: ${msg}`,
        );
      }
    }

    if (whatsappSucceeded) return;
    await this.trySmsFallback('assessment_instructions', phone, name);
  }

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
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`SMS fallback failed for ${template} ${phone}: ${msg}`);
    }
  }

  private async sendWelcomeEmail(
    to: string,
    name: string,
    pass: string,
    startDateTime?: Date | string,
    assessmentTitle?: string,
  ) {
    const sesClient = new SESv2Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    } as any);
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

    const mailOptions: Record<string, any> = {
      from: fromAddress,
      to,
      cc: ccEmail, // Add CC if configured
      subject: 'Welcome to OriginBI - Your Assessment is Ready!',
      html: '',
    };
    if (bccEmail) mailOptions.bcc = bccEmail;
    if (replyToAddress) mailOptions.replyTo = replyToAddress;

    // Use full URLs for assets ("from application itself")
    // Controller is at /assets/:filename in admin-service (Port 4001)
    const apiUrl = process.env.API_URL;

    const assets = {
      popper: `${apiUrl}/assets/Popper.png`,
      pattern: `${apiUrl}/assets/Pattern_mask.png`,
      footer: `${apiUrl}/assets/Email_Vector.png`,
      logo: `${apiUrl}/assets/logo-light.png`,
    };

    mailOptions.html = getStudentWelcomeEmailTemplate(
      name,
      to,
      pass,
      process.env.FRONTEND_URL ?? 'https://mind.originbi.com/',
      assets,
      startDateTime,
      assessmentTitle,
      true,
    );

    // Attachments removed in favor of hosted images
    return await transporter.sendMail(mailOptions);
  }
}
