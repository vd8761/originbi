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
import { getWelcomeEmailTemplate } from '../mail/templates/welcome.template';

import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

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
      );
      const res = await firstValueFrom(res$);
      return res.data as { sub?: string };
    } catch (err: any) {
      const authErr = err?.response?.data || err?.message || err;

      this.logger.error('Error creating Cognito user:', authErr);

      const msg = (typeof authErr === 'object' && authErr !== null)
        ? (authErr.message || JSON.stringify(authErr))
        : String(authErr);

      throw new InternalServerErrorException(
        `Failed to create Cognito user: ${msg}`,
      );
    }
  }

  // ---------------------------------------------------------
  // Normalizers
  // ---------------------------------------------------------
  private normalizeGender(g?: string | null): 'MALE' | 'FEMALE' | 'OTHER' | null {
    if (!g) return null;
    const v = g.trim().toUpperCase();
    return (['MALE', 'FEMALE', 'OTHER'].includes(v)) ? v as any : null;
  }

  private normalizeSchoolLevel(level?: string | null): 'SSLC' | 'HSC' | null {
    if (!level) return null;
    const v = level.trim().toUpperCase();
    return (['SSLC', 'HSC'].includes(v)) ? v as any : null;
  }

  private normalizeSchoolStream(stream?: string | null): 'SCIENCE' | 'COMMERCE' | 'HUMANITIES' | null {
    if (!stream) return null;
    const v = stream.trim().toUpperCase();
    return (['SCIENCE', 'COMMERCE', 'HUMANITIES'].includes(v)) ? v as any : null;
  }

  private toBigIntOrNull(v?: string | null): number | null {
    if (!v) return null;
    const n = Number(v);
    return (Number.isFinite(n) && n > 0) ? n : null;
  }

  // ---------------------------------------------------------
  // CREATE REGISTRATION
  // ---------------------------------------------------------
  async create(dto: CreateRegistrationDto) {
    this.logger.log(`Creating registration for ${dto.email}`);

    // 1. Basic Validation
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered locally');
    }

    // 2. Cognito Creation (External Helper)
    // We do this BEFORE transaction because if it fails, we don't want to burn DB IDs.
    // If it succeeds but DB Transaction fails, we will have an orphan Cognito user.
    // Retry logic should ideally fetch existing Cognito user if error says "exists".
    let sub: string;
    try {
      const cognitoRes = await this.createCognitoUser(dto.email, dto.password);
      sub = cognitoRes.sub!;
    } catch (e: any) {
      // If error message indicates "User already exists", we should probably handle it?
      // For now, rethrow.
      throw e;
    }

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
        const group = await this.groupsService.findOrCreate(dto.groupName, manager);
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
      // Fetch a valid Program (e.g., first active one or matching type if we had logic)
      const defaultProgram = await manager.getRepository(Program).findOne({ where: { is_active: true } });
      if (!defaultProgram) {
        throw new BadRequestException('No active Program found in the system. Please create a Program first.');
      }
      const programId = Number(defaultProgram.id);

      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd ? new Date(dto.examEnd) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days default

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
      // Check based on new schema: Filter by programId and isMandatory
      const levels = await manager.getRepository(AssessmentLevel).find({
        where: {
          programId: programId, // Filter by the program we selected!
          isMandatory: true
        }
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

        // F. Generate Questions for Level 1
        if (level.name.includes('Level 1') || level.id === 1) {
          // Need to update generation service to populate all new required fields (user_id, reg_id, etc)
          await this.assessmentGenService.generateLevel1Questions(
            attempt, // Pass full attempt object to get context
            manager
          );
        }
      }

      // G. Update Registration to COMPLETED
      registration.status = 'COMPLETED';
      await manager.save(registration);

      // H. Send Email (Best Effort)
      if (dto.sendEmail && dto.password) {
        try {
          await this.sendWelcomeEmail(dto.email, dto.name, dto.password);
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
  // LIST REGISTRATIONS
  // ---------------------------------------------------------
  async findAll(page: number, limit: number, tab?: string, search?: string) {
    try {
      const qb = this.regRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.user', 'u')
        .leftJoinAndSelect('r.group', 'g')
        .where('r.isDeleted = false');

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        qb.andWhere('(LOWER(r.fullName) LIKE :s OR LOWER(u.email) LIKE :s)', { s });
      }

      const total = await qb.getCount();
      const rows = await qb
        .orderBy('r.createdAt', 'DESC')
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
      this.logger.error(`findAll Registrations Error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch registrations: ${error.message}`);
    }
  }

  // ---------------------------------------------------------
  // Helper: Send Welcome Email
  // ---------------------------------------------------------
  private async sendWelcomeEmail(to: string, name: string, pass: string, startDateTime?: Date | string, assessmentTitle?: string) {
    const ses = new SES({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
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

    // Use hosted assets for consistent rendering without attachments
    // In production, BACKEND_URL must be set to the public domain
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4001';

    const assets = {
      popper: `${baseUrl}/test/assets/Popper.png`,
      pattern: `${baseUrl}/test/assets/Pattern_mask.png`,
      footer: `${baseUrl}/test/assets/Email_Vector.png`,
    };

    mailOptions.html = getWelcomeEmailTemplate(
      name,
      to,
      pass,
      process.env.FRONTEND_URL || 'http://localhost:3000',
      assets,
      startDateTime,
      assessmentTitle
    );

    return transporter.sendMail(mailOptions);
  }
}
