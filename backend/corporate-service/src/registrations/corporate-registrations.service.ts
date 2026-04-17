import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, Not } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import {
  CorporateAccount,
  CorporateCreditLedger,
  User,
  Registration,
  Groups,
  Program,
  AssessmentSession,
  AssessmentAttempt,
  AssessmentLevel,
  Notification,
} from '@originbi/shared-entities';

import { AssessmentGenerationService } from '../assessment/assessment-generation.service';
import { getWelcomeEmailTemplate } from '../mail/templates/welcome.template';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CorporateRegistrationsService {
  private readonly logger = new Logger(CorporateRegistrationsService.name);
  private authServiceBaseUrl = process.env.AUTH_SERVICE_URL;
  private adminServiceBaseUrl = process.env.ADMIN_SERVICE_URL || 'http://localhost:4001';

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeMobile(mobile: string): string {
    return String(mobile || '').replace(/\D/g, '');
  }

  private resolveWelcomeFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://mind.originbi.com/';
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    retries = 5,
    delay = 1000,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (
        retries > 0 &&
        (error.response?.status === 429 ||
          error.code === 'TooManyRequestsException' ||
          error.message?.includes('Too Many Requests'))
      ) {
        this.logger.warn(
          `Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((res) => setTimeout(res, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  constructor(
    @InjectRepository(CorporateAccount)
    private readonly corpRepo: Repository<CorporateAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    private readonly dataSource: DataSource,
    private readonly http: HttpService,
    private readonly assessmentGenService: AssessmentGenerationService,
    private readonly settingsService: SettingsService,
  ) { }

  async registerCandidate(dto: CreateCandidateDto, corporateUserId: number) {
    const email = this.normalizeEmail(dto.email);
    const mobileDigits = this.normalizeMobile(dto.mobile);

    if (!mobileDigits) {
      throw new BadRequestException('Valid mobile number is required');
    }

    // 0. (Optional) Verify User exists if needed, but we can trust the ID for now or just let the Corp lookup fail

    // 1. Fetch Corporate Account using the passed User ID
    // Strategy A: Direct link (userId column in corporate_accounts)
    let corporateAccount = await this.corpRepo.findOne({
      where: { userId: corporateUserId },
    });

    // Strategy B: Fallback via corporateId in User table
    if (!corporateAccount) {
      const user = await this.userRepo.findOne({
        where: { id: corporateUserId },
      });
      if (user && user.corporateId) {
        corporateAccount = await this.corpRepo.findOne({
          where: { id: Number(user.corporateId) },
        });
      }
    }

    if (!corporateAccount) {
      this.logger.error(
        `Corporate account not found for User ID: ${corporateUserId}`,
      );
      throw new BadRequestException(
        'Corporate account not found for this user',
      );
    }

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

    if (corporateAccount.availableCredits <= 0) {
      throw new BadRequestException(
        'Insufficient credits to register candidate',
      );
    }

    // 2. Auto-generate password if not provided
    // 2. Auto-generate password if not provided
    const password =
      dto.password ||
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-4).toUpperCase() +
      '1!';

    // 3. Create Cognito User
    let sub: string;
    try {
      const res = await this.withRetry(() =>
        firstValueFrom(
          this.http.post(`${this.authServiceBaseUrl}/internal/cognito/users`, {
            email,
            password,
            groupName: 'STUDENT',
          }),
        ),
      );
      sub = (res as any).data.sub;
    } catch (err: any) {
      this.logger.error(
        'Error creating Cognito user',
        err.response?.data || err,
      );
      throw new InternalServerErrorException(
        `Failed to create Cognito user: ${err.response?.data?.message || err.message}`,
      );
    }

    // 4. Transaction
    const result = await this.dataSource.transaction(async (manager: EntityManager) => {
      // A. Debit Credit & Ledger
      const oldCredits = Number(corporateAccount.availableCredits);
      corporateAccount.availableCredits -= 1;
      await manager.save(corporateAccount);

      this.logger.log(`Credit Update: Old=${oldCredits}, New=${corporateAccount.availableCredits}, CorporateUserId=${corporateUserId}`);

      // Notify if credits just dropped below 10
      if (oldCredits >= 10 && Number(corporateAccount.availableCredits) < 10) {
        this.logger.log(`Triggering LOW_CREDITS notification for user ${corporateUserId}`);
        try {
          await manager.save(Notification, {
            userId: corporateUserId,
            role: 'CORPORATE',
            type: 'LOW_CREDITS',
            title: 'Low Credits Alert',
            message: `Your account balance is low (${corporateAccount.availableCredits} credits remaining). Please top up now to ensure uninterrupted service.`,
          });
        } catch (err) {
          this.logger.error(
            `Failed to save low credits notification: ${err.message}`,
          );
        }
      } else {
        this.logger.log(`Notification NOT triggered. Condition (oldCredits >= 10 && newCredits < 10) not met.`);
      }

      const ledger = manager.create(CorporateCreditLedger, {
        corporateAccountId: corporateAccount.id,
        ledgerType: 'DEBIT',
        creditDelta: 1,
        reason: 'One credit used for candidate registration.',
        createdByUserId: corporateUserId, // Use the actual User ID, not Corporate Account ID
      });
      await manager.save(ledger);

      // B. Create User (Candidate)
      const user = manager.create(User, {
        email,
        role: 'STUDENT',
        emailVerified: true,
        cognitoSub: sub,
        isActive: true,
        isBlocked: false,
        corporateId: corporateAccount.id.toString(),
        metadata: {
          fullName: dto.fullName,
          mobile: dto.mobile,
          gender: dto.gender,
        },
      });
      await manager.save(user);

      // C. Find or Create Group
      let groupId: number | null = null;
      if (dto.groupName) {
        let group = await manager.getRepository(Groups).findOne({
          where: {
            name: dto.groupName,
            corporateAccountId: corporateAccount.id,
          },
        });
        if (!group) {
          group = manager.create(Groups, {
            name: dto.groupName,
            corporateAccountId: corporateAccount.id,
            createdByUserId: corporateUserId, // Use actual User ID
            isActive: true,
          });
          await manager.save(group);
        }
        groupId = group.id;
      }

      // D. Create Registration
      const registration = manager.create(Registration, {
        userId: user.id,
        registrationSource: 'CORPORATE',
        createdByUserId: corporateUserId, // Use actual User ID
        corporateAccountId: corporateAccount.id,
        status: 'COMPLETED',
        fullName: dto.fullName,
        mobileNumber: dto.mobile,
        gender: dto.gender,
        countryCode: '+91',
        groupId: groupId,
        departmentDegreeId: dto.departmentId ? Number(dto.departmentId) : null,
        metadata: {
          programType: dto.programType,
          groupName: dto.groupName,
          sendEmail: true,
          currentYear: dto.currentYear,
        },
      });
      await manager.save(registration);

      // E. Create Assessment Session
      // Search for Program (Robust lookup)
      const program = await this.findProgram(manager, dto.programType);

      if (!program) {
        // Try finding by like if exact match fails, or rely on frontend sending exact name
        // For now, assume exact name 'Employee' or 'CXO General'
        throw new BadRequestException(
          `Program '${dto.programType}' not found.`,
        );
      }

      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd ? new Date(dto.examEnd) : new Date();
      if (!dto.examEnd) {
        validTo.setDate(validTo.getDate() + 7);
      }

      const session = manager.create(AssessmentSession, {
        userId: user.id,
        registrationId: registration.id,
        programId: Number(program.id), // program.id is string in entity, cast if needed or use as is
        groupId: groupId,
        groupAssessmentId: dto.groupAssessmentId, // Link to Header
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: {},
      });
      await manager.save(session);

      // F. Create Attempt (Level 1)
      // F. Create Attempts (Mandatory Levels)
      // Fetch all mandatory levels, ordered by sequence (Level 1 -> Level 2)
      const levels = await manager.getRepository(AssessmentLevel).find({
        where: {
          isMandatory: true,
        },
        order: {
          sortOrder: 'ASC',
        },
      });

      if (levels.length === 0) {
        this.logger.warn(
          'No mandatory levels found in AssessmentLevel table. Candidate created without assessment attempt.',
        );
      }

      for (const level of levels) {
        const attempt = manager.create(AssessmentAttempt, {
          userId: user.id,
          registrationId: registration.id,
          assessmentSessionId: session.id,
          programId: Number(program.id),
          assessmentLevelId: level.id,
          status: 'NOT_STARTED',
        });
        await manager.save(attempt);

        // G. Generate Questions for this Level (Only Level 1)
        // We strictly generate questions ONLY for Level 1 here.
        if (level.levelNumber === 1 || level.name === 'Level 1') {
          await this.assessmentGenService.generateLevel1Questions(
            attempt,
            manager,
          );
        }
      }

      // G. Send Email (non-blocking)
      if (dto.sendEmail) {
        void this.sendWelcomeEmail(
          email,
          dto.fullName,
          password,
          validFrom,
          program.assessmentTitle || program.name,
        );
      }

      return {
        message: 'Candidate registered successfully',
        registrationId: registration.id,
        userId: user.id,
        creditsLeft: corporateAccount.availableCredits,
      };
    });

    return result;
  }

  private async sendWelcomeEmail(
    to: string,
    name: string,
    pass: string,
    startDateTime?: Date | string,
    assessmentTitle?: string,
  ) {
    this.logger.log(
      `Attempting to send welcome email to ${to} (sendEmail=true)`,
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

      // Use full URLs for assets ("from application itself")
      const apiUrl = process.env.API_URL || process.env.CORPORATE_SERVICE_URL || '';

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

      const { fromName, fromAddress: fromEmail, ccAddresses } = await this.settingsService.getEmailConfig('corporate_welcome_email_config');
      const ccEmail = ccAddresses.join(', ');
      const source = `"${fromName}" <${fromEmail}>`;

      const command = new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: {
            Data: 'Welcome to OriginBI - Assessment Invitation',
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
      const result = await sesClient.send(command);

      const info = await sesClient.send(command);

      this.logger.log(
        `Email sent successfully to ${to}. MessageId: ${result.MessageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      // We do not throw here to avoid failing the transaction/process if email fails
    }
  }
  async assignAssessmentToExistingUser(
    userId: number,
    dto: CreateCandidateDto,
    corporateUserId: number,
  ) {
    // Check for active assessments
    const activeSession = await this.dataSource
      .getRepository(AssessmentSession)
      .findOne({
        where: {
          userId: userId,
          status: Not(In(['COMPLETED', 'EXPIRED', 'PARTIALLY_EXPIRED'])),
        },
      });

    if (activeSession) {
      throw new BadRequestException(
        `User already has an active assessment (Status: ${activeSession.status}). Cannot assign a new one.`,
      );
    }
    // 1. Fetch Corporate Account (needed for linking)
    let corporateAccount = await this.corpRepo.findOne({
      where: { userId: corporateUserId },
    });
    if (!corporateAccount) {
      const u = await this.userRepo.findOne({ where: { id: corporateUserId } });
      if (u && u.corporateId) {
        corporateAccount = await this.corpRepo.findOne({
          where: { id: Number(u.corporateId) },
        });
      }
    }
    if (!corporateAccount)
      throw new BadRequestException('Corporate account not found');

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new BadRequestException('User not found');

      // Link user to this corporate for notifications
      user.corporateId = corporateAccount.id.toString();
      await manager.save(user);

      // 2. Ensure Registration Exists for this Corporate
      let registration = await manager.findOne(Registration, {
        where: { userId: user.id, corporateAccountId: corporateAccount.id },
      });

      if (!registration) {
        // Determine Group ID if provided
        let groupId: number | null = null;
        if (dto.groupName) {
          let group = await manager.getRepository(Groups).findOne({
            where: {
              name: dto.groupName,
              corporateAccountId: corporateAccount.id,
            },
          });
          if (!group) {
            // Should we create group? Yes, consistent with registerCandidate
            group = manager.create(Groups, {
              name: dto.groupName,
              corporateAccountId: corporateAccount.id,
              createdByUserId: corporateUserId,
              isActive: true,
            });
            await manager.save(group);
          }
          groupId = group.id;
        }

        // Create Registration (No Debit)
        registration = manager.create(Registration, {
          userId: user.id,
          registrationSource: 'CORPORATE',
          createdByUserId: corporateUserId,
          corporateAccountId: corporateAccount.id,
          status: 'COMPLETED',
          fullName: user.metadata?.fullName || dto.fullName,
          mobileNumber: user.metadata?.mobile || dto.mobile,
          gender: user.metadata?.gender || dto.gender || 'FEMALE',
          countryCode: '+91',
          groupId: groupId,
          departmentDegreeId: dto.departmentId ? Number(dto.departmentId) : null,
          metadata: {
            programType: dto.programType,
            groupName: dto.groupName,
            sendEmail: true,
            currentYear: dto.currentYear,
          },
        });
        await manager.save(registration);
      }

      // 3. Find Program (Robust lookup)
      const program = await this.findProgram(manager, dto.programType);

      // 4. Create Session (Linked to GroupAssessment Header)
      const validFrom = dto.examStart ? new Date(dto.examStart) : new Date();
      const validTo = dto.examEnd ? new Date(dto.examEnd) : new Date();
      if (!dto.examEnd) validTo.setDate(validTo.getDate() + 7);

      const session = manager.create(AssessmentSession, {
        userId: user.id,
        registrationId: registration.id,
        programId: Number(program.id),
        groupId: registration.groupId, // Use group from registration
        groupAssessmentId: dto.groupAssessmentId,
        status: 'NOT_STARTED',
        validFrom,
        validTo,
        metadata: {},
      });
      await manager.save(session);

      // 5. Create Attempts
      const levels = await manager.getRepository(AssessmentLevel).find({
        where: { isMandatory: true },
        order: { sortOrder: 'ASC' },
      });

      for (const level of levels) {
        const attempt = manager.create(AssessmentAttempt, {
          userId: user.id,
          registrationId: registration.id,
          assessmentSessionId: session.id,
          programId: Number(program.id),
          assessmentLevelId: level.id,
          status: 'NOT_STARTED',
        });
        await manager.save(attempt);

        if (level.levelNumber === 1 || level.name === 'Level 1') {
          await this.assessmentGenService.generateLevel1Questions(
            attempt,
            manager,
          );
        }
      }

      // 6. Send Email (non-blocking)
      if (dto.sendEmail) {
        // Pass masked password as this account already exists.
        void this.sendWelcomeEmail(
          user.email,
          (user.metadata?.fullName as string) || dto.fullName,
          '******',
          validFrom,
          program.assessmentTitle || program.name,
        );
      }

      return {
        message: 'Assessment assigned to existing user successfully',
        registrationId: registration.id,
        userId: user.id,
      };
    });
  }

  private normalizeString(str: string): string {
    return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  }

  private async findProgram(manager: EntityManager, programType: string): Promise<Program> {
    const programRepo = manager.getRepository(Program);
    const normInput = this.normalizeString(programType);

    // 1. Try exact match first via DB
    let program = await programRepo.findOne({
      where: [
        { name: programType },
        { code: programType },
      ]
    });

    if (program) return program;

    // 2. Case insensitive exact match or code match
    program = await programRepo.createQueryBuilder('p')
      .where('LOWER(p.name) = :name', { name: programType.toLowerCase() })
      .orWhere('LOWER(p.code) = :code', { code: programType.toLowerCase() })
      .getOne();

    if (program) return program;

    // 3. Normalized matching (fallback to fetching all active programs once)
    const allPrograms = await programRepo.find({ where: { isActive: true } });

    // Handle Singular/Plural mismatch (specifically for College Student/Students)
    if (normInput === 'collegestudent') {
      program = allPrograms.find(p => this.normalizeString(p.name) === 'collegestudents');
    } else if (normInput === 'collegestudents') {
      program = allPrograms.find(p => this.normalizeString(p.name) === 'collegestudent');
    }

    // 4. Partial match (last resort)
    if (!program) {
      program = allPrograms.find(p =>
        this.normalizeString(p.name).includes(normInput) ||
        normInput.includes(this.normalizeString(p.name))
      );
    }

    if (!program) {
      throw new BadRequestException(`Program '${programType}' not found.`);
    }

    return program;
  }
}
