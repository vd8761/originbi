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
import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';
import * as path from 'path';

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
} from '@originbi/shared-entities';

import { AssessmentGenerationService } from '../assessment/assessment-generation.service';
import { getWelcomeEmailTemplate } from '../mail/templates/welcome.template';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CorporateRegistrationsService {
    private readonly logger = new Logger(CorporateRegistrationsService.name);
    private authServiceBaseUrl =
        process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

    async withRetry<T>(operation: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (retries > 0 && (error.response?.status === 429 || error.code === 'TooManyRequestsException' || error.message?.includes('Too Many Requests'))) {
                this.logger.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(res => setTimeout(res, delay));
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

        private readonly dataSource: DataSource,
        private readonly http: HttpService,
        private readonly assessmentGenService: AssessmentGenerationService,
    ) { }

    async registerCandidate(
        dto: CreateCandidateDto,
        corporateUserId: number,
    ) {
        // 0. (Optional) Verify User exists if needed, but we can trust the ID for now or just let the Corp lookup fail

        // 1. Fetch Corporate Account using the passed User ID
        // Strategy A: Direct link (userId column in corporate_accounts)
        let corporateAccount = await this.corpRepo.findOne({
            where: { userId: corporateUserId },
        });

        // Strategy B: Fallback via corporateId in User table
        if (!corporateAccount) {
            const user = await this.userRepo.findOne({ where: { id: corporateUserId } });
            if (user && user.corporateId) {
                corporateAccount = await this.corpRepo.findOne({
                    where: { id: Number(user.corporateId) }
                });
            }
        }

        if (!corporateAccount) {
            this.logger.error(`Corporate account not found for User ID: ${corporateUserId}`);
            throw new BadRequestException('Corporate account not found for this user');
        }

        if (corporateAccount.availableCredits <= 0) {
            throw new BadRequestException('Insufficient credits to register candidate');
        }

        // 2. Auto-generate password if not provided
        // 2. Auto-generate password if not provided
        const password = dto.password ||
            (Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-4).toUpperCase() +
                '1!');

        // 3. Create Cognito User
        let sub: string;
        try {
            const res = await this.withRetry(() =>
                firstValueFrom(
                    this.http.post(
                        `${this.authServiceBaseUrl}/internal/cognito/users`,
                        {
                            email: dto.email,
                            password,
                            groupName: 'STUDENT',
                        },
                    )
                )
            );
            sub = res.data.sub;
        } catch (err: any) {
            this.logger.error('Error creating Cognito user', err.response?.data || err);
            throw new InternalServerErrorException(
                `Failed to create Cognito user: ${err.response?.data?.message || err.message}`,
            );
        }

        // 4. Transaction
        return this.dataSource.transaction(async (manager: EntityManager) => {
            // A. Debit Credit & Ledger
            corporateAccount.availableCredits -= 1;
            await manager.save(corporateAccount);

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
                email: dto.email,
                role: 'STUDENT',
                emailVerified: true,
                cognitoSub: sub,
                isActive: true,
                isBlocked: false,
                createdByUserId: corporateAccount.id,
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
                metadata: {
                    programType: dto.programType,
                    groupName: dto.groupName,
                    sendEmail: true,
                },
            });
            await manager.save(registration);

            // E. Create Assessment Session
            // Search for Program
            // We expect 'Employee' or 'CXO General' sent in dto.programType
            // We search name containing this string or exact match
            const program = await manager.getRepository(Program).findOne({
                where: { name: dto.programType },
            });

            if (!program) {
                // Try finding by like if exact match fails, or rely on frontend sending exact name
                // For now, assume exact name 'Employee' or 'CXO General'
                throw new BadRequestException(`Program '${dto.programType}' not found.`);
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
                this.logger.warn('No mandatory levels found in AssessmentLevel table. Candidate created without assessment attempt.');
            }

            for (const level of levels) {
                const attempt = manager.create(AssessmentAttempt, {
                    userId: user.id,
                    registrationId: registration.id,
                    assessmentSessionId: session.id,
                    programId: Number(program.id),
                    assessmentLevelId: level.id,
                    status: 'NOT_STARTED'
                });
                await manager.save(attempt);

                // G. Generate Questions for this Level (Only Level 1)
                // We strictly generate questions ONLY for Level 1 here.
                if (level.levelNumber === 1 || level.name === 'Level 1') {
                    await this.assessmentGenService.generateLevel1Questions(attempt, manager);
                }
            }

            // G. Send Email
            if (dto.sendEmail) {
                try {
                    await this.sendWelcomeEmail(
                        dto.email,
                        dto.fullName,
                        password,
                        validFrom,
                        program.assessmentTitle || program.name,
                    );
                } catch (e) {
                    this.logger.error('Failed to send welcome email', e);
                }
            }

            return {
                message: 'Candidate registered successfully',
                registrationId: registration.id,
                userId: user.id,
                creditsLeft: corporateAccount.availableCredits
            };
        });
    }

    private async sendWelcomeEmail(
        to: string,
        name: string,
        pass: string,
        startDateTime?: Date | string,
        assessmentTitle?: string,
    ) {
        this.logger.log(`Attempting to send welcome email to ${to} (sendEmail=true)`);

        try {
            // Use aws-sdk v2 (Standard, matches Admin Service)
            const ses = new SES({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN, // Optional
                region: process.env.AWS_REGION,
            });

            // Create transport securely
            const transporter = nodemailer.createTransport({
                SES: ses,
            } as any);

            // Use full URLs for assets ("from application itself")
            const apiUrl = process.env.API_URL || 'http://localhost:4003';

            const assets = {
                popper: `${apiUrl}/email-assets/Popper.png`,
                pattern: `${apiUrl}/email-assets/Pattern_mask.png`,
                footer: `${apiUrl}/email-assets/Email_Vector.png`,
                logo: `${apiUrl}/email-assets/logo.png`,
            };

            const html = getWelcomeEmailTemplate(
                name,
                to,
                pass,
                process.env.FRONTEND_URL || 'http://localhost:3000',
                assets,
                startDateTime,
                assessmentTitle
            );

            const info = await transporter.sendMail({
                from: `"${process.env.EMAIL_SEND_FROM_NAME || 'Origin BI'}" <${process.env.EMAIL_FROM || 'no-reply@originbi.com'}>`,
                to,
                subject: 'Welcome to OriginBI - Assessment Invitation',
                html,
            });

            this.logger.log(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            // We do not throw here to avoid failing the transaction/process if email fails
        }
    }
    async assignAssessmentToExistingUser(
        userId: number,
        dto: CreateCandidateDto,
        corporateUserId: number
    ) {
        // Check for active assessments
        const activeSession = await this.dataSource.getRepository(AssessmentSession).findOne({
            where: {
                userId: userId,
                status: Not(In(['COMPLETED', 'EXPIRED', 'PARTIALLY_EXPIRED'])),
            }
        });

        if (activeSession) {
            throw new BadRequestException(`User already has an active assessment (Status: ${activeSession.status}). Cannot assign a new one.`);
        }
        // 1. Fetch Corporate Account (needed for linking)
        let corporateAccount = await this.corpRepo.findOne({ where: { userId: corporateUserId } });
        if (!corporateAccount) {
            const u = await this.userRepo.findOne({ where: { id: corporateUserId } });
            if (u && u.corporateId) {
                corporateAccount = await this.corpRepo.findOne({ where: { id: Number(u.corporateId) } });
            }
        }
        if (!corporateAccount) throw new BadRequestException('Corporate account not found');

        return this.dataSource.transaction(async (manager: EntityManager) => {
            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) throw new BadRequestException('User not found');

            // 2. Ensure Registration Exists for this Corporate
            let registration = await manager.findOne(Registration, {
                where: { userId: user.id, corporateAccountId: corporateAccount.id }
            });

            if (!registration) {
                // Determine Group ID if provided
                let groupId: number | null = null;
                if (dto.groupName) {
                    let group = await manager.getRepository(Groups).findOne({
                        where: { name: dto.groupName, corporateAccountId: corporateAccount.id }
                    });
                    if (!group) {
                        // Should we create group? Yes, consistent with registerCandidate
                        group = manager.create(Groups, {
                            name: dto.groupName,
                            corporateAccountId: corporateAccount.id,
                            createdByUserId: corporateUserId,
                            isActive: true
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
                    metadata: {
                        programType: dto.programType,
                        groupName: dto.groupName,
                        sendEmail: true
                    }
                });
                await manager.save(registration);
            }

            // 3. Find Program
            const program = await manager.getRepository(Program).findOne({ where: { name: dto.programType } });
            if (!program) throw new BadRequestException(`Program '${dto.programType}' not found.`);

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
                metadata: {}
            });
            await manager.save(session);

            // 5. Create Attempts
            const levels = await manager.getRepository(AssessmentLevel).find({
                where: { isMandatory: true },
                order: { sortOrder: 'ASC' }
            });

            for (const level of levels) {
                const attempt = manager.create(AssessmentAttempt, {
                    userId: user.id,
                    registrationId: registration.id,
                    assessmentSessionId: session.id,
                    programId: Number(program.id),
                    assessmentLevelId: level.id,
                    status: 'NOT_STARTED'
                });
                await manager.save(attempt);

                if (level.levelNumber === 1 || level.name === 'Level 1') {
                    await this.assessmentGenService.generateLevel1Questions(attempt, manager);
                }
            }

            // 6. Send Email
            if (dto.sendEmail) {
                try {
                    // Pass null password as we didn't create it
                    await this.sendWelcomeEmail(
                        user.email,
                        user.metadata?.fullName || dto.fullName,
                        '******', // Masked password for existing users
                        validFrom,
                        program.assessmentTitle || program.name
                    );
                } catch (e) {
                    this.logger.error('Failed to send welcome email', e);
                }
            }

            return {
                message: 'Assessment assigned to existing user successfully',
                registrationId: registration.id,
                userId: user.id
            };
        });
    }
}
