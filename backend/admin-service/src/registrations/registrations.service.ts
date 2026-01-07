import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { User } from '../users/user.entity';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Program } from '../programs/entities/program.entity';
import { AssessmentSession } from '../assessment/assessment_session.entity';
import { AssessmentAttempt } from '../assessment/assessment_attempt.entity';
import { AssessmentLevel } from '../assessment/assessment_level.entity';
import { GroupsService } from '../groups/groups.service';
import { AssessmentGenerationService } from '../assessment/assessment-generation.service';
import { getStudentWelcomeEmailTemplate } from '../mail/templates/student-welcome.template';

import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  private authServiceBaseUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

  private readonly ADMIN_USER_ID = 1;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Registration)
    private readonly regRepo: Repository<Registration>,

    private readonly groupsService: GroupsService,
    private readonly assessmentGenService: AssessmentGenerationService,

    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) { }

  // ---------------------------------------------------------
  // Helper: Call auth-service to create a Cognito user
  // ---------------------------------------------------------
  private async createCognitoUser(email: string, password: string) {
    try {
      const res$ = this.http.post(
        `${this.authServiceBaseUrl}/internal/cognito/users`,
        { email, password },
        { proxy: false },
      );
      const res = await firstValueFrom(res$);
      return res.data as { sub?: string };
    } catch (err: any) {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const authErr = err?.response?.data || err?.message || err;

      this.logger.error('Error creating Cognito user:', authErr);

      const msg =
        typeof authErr === 'object' && authErr !== null
          ? authErr.message || JSON.stringify(authErr)
          : String(authErr);

      throw new InternalServerErrorException(
        `Failed to create Cognito user at ${this.authServiceBaseUrl} (Proxy: ${process.env.http_proxy || 'none'}): ${msg}`,
      );
      /* eslint-enable */
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

  private normalizeSchoolLevel(level?: string | null): 'SSLC' | 'HSC' | null {
    if (!level) return null;
    const v = level.trim().toUpperCase();
    return ['SSLC', 'HSC'].includes(v) ? (v as 'SSLC' | 'HSC') : null;
  }

  private normalizeSchoolStream(
    stream?: string | null,
  ): 'SCIENCE' | 'COMMERCE' | 'HUMANITIES' | null {
    if (!stream) return null;
    const v = stream.trim().toUpperCase();
    return ['SCIENCE', 'COMMERCE', 'HUMANITIES'].includes(v)
      ? (v as 'SCIENCE' | 'COMMERCE' | 'HUMANITIES')
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
    dto.email = dto.email.toLowerCase();
    this.logger.log(`Creating registration for ${dto.email}`);

    // 1. Basic Validation
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already registered locally');
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

    // 4. Transaction
    return this.dataSource.transaction(async (manager) => {
      // A. Create User
      const user = manager.create(User, {
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

      // C. Create Registration (INCOMPLETE)
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
        group: groupId ? { id: groupId } : undefined, // Assign relation object, or undefined
        metadata: {
          programType: dto.programType,
          groupName: dto.groupName,
          sendEmail: dto.sendEmail,
          currentYear: dto.currentYear,
          examStart: dto.examStart,
          examEnd: dto.examEnd,
          departmentId: dto.departmentId ?? null,
        },
      });
      await manager.save(registration);

      // D. Create Assessment Session
      // D. Create Assessment Session
      let programId: number;
      let programTitle: string;

      if (dto.programType) {
        // Strict lookup for selected program
        const selectedProgram = await manager
          .getRepository(Program)
          .findOne({ where: { id: dto.programType } });

        if (!selectedProgram) {
          throw new BadRequestException(
            `Selected Program (ID: ${dto.programType}) not found.`,
          );
        }
        if (!selectedProgram.is_active) {
          throw new BadRequestException(
            `Selected Program '${selectedProgram.name}' is not active.`,
          );
        }

        programId = Number(selectedProgram.id);
        programTitle =
          selectedProgram.assessment_title || selectedProgram.name;
      } else {
        // Fallback: Pick any active program (Legacy / Default)
        const defaultProgram = await manager
          .getRepository(Program)
          .findOne({ where: { is_active: true } });

        if (!defaultProgram) {
          throw new BadRequestException(
            'No active Program found in the system. Please create a Program first.',
          );
        }

        programId = Number(defaultProgram.id);
        programTitle =
          defaultProgram.assessment_title || defaultProgram.name;
      }

      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd
        ? new Date(dto.examEnd)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days default

      const session = manager.create(AssessmentSession, {
        userId: user.id,
        registrationId: registration.id,
        programId: programId,
        groupId: groupId ?? null,
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: {},
      });
      await manager.save(session);

      // E. Create Assessment Attempts (Mandatory Levels)
      // Fetch all mandatory levels, ordered by sequence (Level 1 -> Level 2)
      const levels = await manager.getRepository(AssessmentLevel).find({
        where: {
          isMandatory: true,
        },
        order: {
          sortOrder: 'ASC',
        },
      });

      if (!levels || levels.length === 0) {
        throw new InternalServerErrorException(
          'No mandatory assessment levels configured in the system.',
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

        // F. Generate Questions for this Level (Only Level 1)
        // F. Generate Questions for this Level (Only Level 1)
        // NOTE: This logic applies to both Single Registration and Bulk Upload.
        // We strictly generate questions ONLY for Level 1 here.
        // Level 2+ questions are generated JIT when the user starts the assessment.
        if (level.levelNumber === 1 || level.name === 'Level 1') {
          await this.assessmentGenService.generateQuestions(
            attempt,
            manager,
          );
        }
      }

      // G. Update Registration to COMPLETED
      registration.status = 'COMPLETED';
      await manager.save(registration);

      // H. Send Email (Best Effort)
      if (dto.sendEmail && dto.password) {
        try {
          await this.sendWelcomeEmail(
            dto.email,
            dto.name,
            dto.password,
            validFrom,
            programTitle,
          );
        } catch (emailErr) {
          this.logger.error('Failed to send welcome email', emailErr);
          // Do not rollback
        }
      }

      return {
        registrationId: registration.id,
        userId: user.id,
        email: user.email,
      };
    });
  }

  // ---------------------------------------------------------
  // CREATE FOR EXISTING USER (Assessment Only)
  // ---------------------------------------------------------
  async createForExistingUser(user: User, dto: CreateRegistrationDto) {
    this.logger.log(`Creating assessment for existing user ${user.email}`);

    // 1. Prepare Data
    const gender = this.normalizeGender(dto.gender);
    const schoolLevel = this.normalizeSchoolLevel(dto.schoolLevel);
    const schoolStream = this.normalizeSchoolStream(dto.schoolStream);
    const departmentDegreeId = this.toBigIntOrNull(dto.departmentId);

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
          examStart: dto.examStart,
          examEnd: dto.examEnd,
          departmentId: dto.departmentId ?? null,
        },
      });
      await manager.save(registration);

      // C. Create Assessment Session & Attempts
      let programId: number;

      if (dto.programType) {
        const selectedProgram = await manager
          .getRepository(Program)
          .findOne({ where: { id: dto.programType } });

        if (!selectedProgram) throw new BadRequestException(`Program ${dto.programType} not found`);
        if (!selectedProgram.is_active) throw new BadRequestException(`Program inactive`);

        programId = Number(selectedProgram.id);
      } else {
        const defaultProgram = await manager
          .getRepository(Program)
          .findOne({ where: { is_active: true } });
        if (!defaultProgram) throw new BadRequestException('No active Program');
        programId = Number(defaultProgram.id);
      }

      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd ? new Date(dto.examEnd) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = manager.create(AssessmentSession, {
        userId: user.id,
        registrationId: registration.id,
        programId: programId,
        groupId: groupId ?? null,
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: {},
      });
      await manager.save(session);

      const levels = await manager.getRepository(AssessmentLevel).find({
        where: { isMandatory: true },
      });

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

        // NOTE: This logic applies to Bulk Upload for Existing Users as well.
        // Strictly generate questions ONLY for Level 1.
        if (level.levelNumber === 1 || level.name === 'Level 1') {
          await this.assessmentGenService.generateQuestions(attempt, manager);
        }
      }

      registration.status = 'COMPLETED';
      await manager.save(registration);

      return {
        registrationId: registration.id,
        userId: user.id,
        email: user.email,
        wasExisting: true
      };
    });
  }

  // ---------------------------------------------------------
  // LIST REGISTRATIONS
  // ---------------------------------------------------------
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
  async findAll(
    page: number,
    limit: number,
    tab?: string,
    search?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
  ) {
    try {
      const qb = this.regRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.user', 'u')
        .leftJoinAndSelect('r.group', 'g')
        .where('r.isDeleted = false');

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        qb.andWhere('(LOWER(r.fullName) LIKE :s OR LOWER(u.email) LIKE :s)', {
          s,
        });
      }

      if (startDate) {
        qb.andWhere('r.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
      }
      if (endDate) {
        qb.andWhere('r.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
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
            sortCol = "u.metadata->>'gender'";
            break;
          case 'mobile_number':
            sortCol = "u.metadata->>'mobile'";
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
        programType: r.metadata?.programType,
        groupName: r.group?.name || r.metadata?.groupName,
        status: r.status,
        examStart: r.metadata?.examStart,
        examEnd: r.metadata?.examEnd,
        createdAt: r.createdAt,
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
  /* eslint-enable */

  // ---------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------
  async updateStatus(id: string, status: string) {
    const reg = await this.regRepo.findOne({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { id: BigInt(id) as any },
    });
    if (!reg) {
      throw new BadRequestException('Registration not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reg.status = status as any;
    // If we need to sync with User.isActive, do it here.
    // e.g. if status === 'CANCELLED', user.isActive = false.
    return this.regRepo.save(reg);
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
    const ses = new SES({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const transporter = nodemailer.createTransport({ SES: ses } as any);
    const ccEmail = process.env.EMAIL_CC || '';

    const fromName = process.env.EMAIL_SEND_FROM_NAME || 'Origin BI Mind Works';
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@originbi.com';
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      cc: ccEmail, // Add CC if configured
      subject: 'Welcome to OriginBI - Your Assessment is Ready!',
      html: '',
    };

    // Use full URLs for assets ("from application itself")
    // Controller is at /assets/:filename in admin-service (Port 4001)
    const apiUrl = process.env.API_URL || 'http://localhost:4001';

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
      process.env.FRONTEND_URL || 'http://localhost:3000',
      assets,
      startDateTime,
      assessmentTitle,
    );

    // Attachments removed in favor of hosted images
    return await transporter.sendMail(mailOptions);
  }
}
