import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';
import * as path from 'path';

import { CorporateAccount } from '../entities/corporate-account.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';
import { User } from '../entities/user.entity';
import { Registration } from '../entities/registration.entity';
import { Groups } from '../entities/groups.entity';
import { Program } from '../entities/program.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';

import { AssessmentGenerationService } from '../assessment/assessment-generation.service';
import { getWelcomeEmailTemplate } from '../mail/templates/welcome.template';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CorporateRegistrationsService {
    private readonly logger = new Logger(CorporateRegistrationsService.name);
    private authServiceBaseUrl =
        process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

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
            const res$ = this.http.post(
                `${this.authServiceBaseUrl}/internal/cognito/users`,
                {
                    email: dto.email,
                    password,
                    groupName: 'STUDENT',
                },
            );
            const res = await firstValueFrom(res$);
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
                status: 'NOT_STARTED',
                validFrom,
                validTo,
                metadata: {},
            });
            await manager.save(session);

            // F. Create Attempt (Level 1)
            // F. Create Attempt (Level 1)
            const levels = await manager.getRepository(AssessmentLevel).find({
                where: {
                    levelNumber: 1
                }
            });

            if (levels.length === 0) {
                const mandatory = await manager.getRepository(AssessmentLevel).find({
                    where: { isMandatory: true }
                });
                if (mandatory.length > 0) levels.push(mandatory[0]);
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

                await this.assessmentGenService.generateLevel1Questions(attempt, manager);
            }

            // G. Send Email
            try {
                await this.sendWelcomeEmail(
                    dto.email,
                    dto.fullName,
                    password,
                    validFrom,
                    program.assessment_title || program.name,
                );
            } catch (e) {
                this.logger.error('Failed to send welcome email', e);
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
        // Use AWS SDK v3 for Nodemailer compatibility
        const aws = require('@aws-sdk/client-ses');

        const ses = new aws.SES({
            apiVersion: '2010-12-01',
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Pass both the client instance and the AWS module to nodemailer
        const transporter = nodemailer.createTransport({
            ses: { ses, aws }, // Use lowercase 'ses' as per nodemailer v7 docs for @aws-sdk/client-ses
        } as any);

        // Use full URLs for assets ("from application itself")
        // Static assets served at /email-assets in corporate-service (Port 4003)
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

        await transporter.sendMail({
            from: `"${process.env.EMAIL_SEND_FROM_NAME || 'Origin BI'}" <${process.env.EMAIL_FROM || 'no-reply@originbi.com'}>`,
            to,
            subject: 'Welcome to OriginBI - Assessment Invitation',
            html,
            // Attachments removed in favor of hosted images
        });
    }
}
