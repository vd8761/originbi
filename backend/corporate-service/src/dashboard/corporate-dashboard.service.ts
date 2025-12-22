/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, no-useless-catch */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import Razorpay = require('razorpay');

import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';
import {
    UserActionLog,
    ActionType,
    UserRole,
} from '../entities/user-action-log.entity';
import { Registration } from '../entities/registration.entity';

@Injectable()
export class CorporateDashboardService {
    private authServiceUrl: string;
    private razorpay: any;
    private perCreditCost: number;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(CorporateAccount)
        private readonly corporateRepo: Repository<CorporateAccount>,
        @InjectRepository(UserActionLog)
        private actionLogRepository: Repository<UserActionLog>,
        @InjectRepository(CorporateCreditLedger)
        private readonly ledgerRepo: Repository<CorporateCreditLedger>,
        @InjectRepository(Registration)
        private readonly registrationRepo: Repository<Registration>,
        private httpService: HttpService,
        private configService: ConfigService,
        private readonly dataSource: DataSource,
    ) {
        this.authServiceUrl =
            this.configService.get<string>('AUTH_SERVICE_URL') ||
            'http://localhost:4002';

        // Safety check: specific fix for local dev misconfiguration
        if (this.authServiceUrl.includes('4003')) {
            console.warn(
                `[CorporateDashboardService] AUTH_SERVICE_URL misconfigured to ${this.authServiceUrl}. Forcing http://localhost:4002`,
            );
            this.authServiceUrl = 'http://localhost:4002';
        }

        this.perCreditCost = parseFloat(
            this.configService.get<string>('PER_CREDIT_COST') || '200',
        );

        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (keyId && keySecret) {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
    }

    async getStats(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });

        if (!corporate) {
            throw new NotFoundException('Corporate account not found');
        }

        // TODO: Fetch real student count once Student entity is available/linked
        const studentsRegistered = 0;

        return {
            companyName: corporate.companyName,
            availableCredits: corporate.availableCredits,
            totalCredits: corporate.totalCredits,
            studentsRegistered,
            isActive: corporate.isActive,
        };
    }

    async initiateCorporateReset(email: string) {
        // 1. Validate User
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found.');
        }

        if (user.role !== 'CORPORATE') {
            throw new NotFoundException('Corporate user not found.');
        }

        // Fetch Corporate Account to get its ID for registration_id
        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) {
            throw new NotFoundException('Corporate account not found.');
        }

        // 2. Check Rate Limit
        const today = new Date().toISOString().split('T')[0];

        const existingLog = await this.actionLogRepository.findOne({
            where: {
                user: { id: user.id },
                actionType: ActionType.RESET_PASSWORD,
                role: UserRole.CORPORATE,
                actionDate: today,
            },
        });

        if (existingLog && existingLog.attemptCount >= 1) {
            throw new BadRequestException(
                'Password reset limit reached for today. Please try again tomorrow.',
            );
        }

        // 3. Call Auth Service to Trigger Reset
        try {
            await firstValueFrom(
                this.httpService.post(
                    `${this.authServiceUrl}/internal/cognito/forgot-password`,
                    { email },
                ),
            );
        } catch (error: any) {
            console.error(
                'Auth Service Forgot Password Failed:',
                error?.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                'Failed to initiate password reset. Please try again.',
            );
        }

        // 4. Log the Attempt (ONLY after successful call)
        if (existingLog) {
            existingLog.attemptCount += 1;
            await this.actionLogRepository.save(existingLog);
        } else {
            const newLog = this.actionLogRepository.create({
                user: user,
                userId: user.id,
                role: UserRole.CORPORATE,
                actionType: ActionType.RESET_PASSWORD,
                actionDate: today,
                attemptCount: 1,
                registrationId: corporate.id.toString(), // Use corporate account ID
            });
            await this.actionLogRepository.save(newLog);
        }

        return {
            success: true,
            message: 'Password reset initiated. Check your email.',
        };
    }

    // Helper: Create Cognito User
    private async createCognitoUser(
        email: string,
        password: string,
        groupName: string,
    ) {
        console.log(
            `[CorporateDashboardService] createCognitoUser calling Auth Service at: ${this.authServiceUrl}`,
        );
        try {
            const baseUrl = this.authServiceUrl.replace(/\/$/, '');
            const url = `${baseUrl}/internal/cognito/users`;
            const res$ = this.httpService.post(url, { email, password, groupName });
            const res = await firstValueFrom(res$);
            return res.data as { sub?: string };
        } catch (err: any) {
            console.error('Error creating Cognito user:', err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message;

            if (status && status >= 400 && status < 500) {
                throw new BadRequestException(`Auth Service: ${msg}`);
            }
            throw new InternalServerErrorException(`Auth Service Failed: ${msg}`);
        }
    }

    async registerCorporate(dto: RegisterCorporateDto) {
        const email = dto.email.trim();
        const existingUser = await this.userRepo.findOne({
            where: { email: email },
        });
        if (existingUser) {
            throw new BadRequestException(`Email '${email}' is already registered`);
        }

        const existingMobile = await this.corporateRepo.findOne({
            where: { mobileNumber: dto.mobile, countryCode: dto.countryCode },
        });
        if (existingMobile) {
            throw new BadRequestException(
                'Mobile number already exists for a corporate account',
            );
        }

        let sub: string;
        try {
            const cognitoRes = await this.createCognitoUser(
                email,
                dto.password,
                'CORPORATE',
            );
            sub = cognitoRes.sub!;
        } catch (e) {
            throw e;
        }

        try {
            const result = await this.dataSource.transaction(async (manager) => {
                const user = manager.create(User, {
                    email: email,
                    role: 'CORPORATE',
                    emailVerified: true,
                    cognitoSub: sub,
                    isActive: false, // Inactive by default for public registration
                    isBlocked: false,
                    metadata: {
                        fullName: dto.name,
                        countryCode: dto.countryCode,
                        mobile: dto.mobile,
                        gender: dto.gender,
                    },
                });
                await manager.save(user);

                const corporateAccount = manager.create(CorporateAccount, {
                    userId: user.id,
                    fullName: dto.name,
                    companyName: dto.companyName,
                    sectorCode: dto.sector,
                    businessLocations: dto.businessLocations,
                    jobTitle: dto.jobTitle,
                    employeeRefId: dto.employeeCode,
                    linkedinUrl: dto.linkedinUrl,
                    countryCode: dto.countryCode,
                    mobileNumber: dto.mobile,
                    gender: dto.gender,
                    totalCredits: 0, // No credits for self-registration
                    availableCredits: 0,
                    isActive: false, // Inactive
                });
                await manager.save(corporateAccount);

                return {
                    success: true,
                    message: 'Registration successful. Account pending approval.',
                };
            });

            // Send Confirmation Email after successful transaction
            this.sendRegistrationSuccessEmail(email, {
                name: dto.name,
                companyName: dto.companyName,
                email: email,
                mobile: dto.mobile,
                password: dto.password,
                loginUrl:
                    this.configService.get<string>('FRONTEND_URL') ||
                    'http://localhost:3000',
            }).catch((emailErr) =>
                console.error('Failed to send registration email:', emailErr),
            );

            return result;
        } catch (dbError: any) {
            console.error(
                `Database Transaction Failed in Public Register: ${dbError.message}`,
                dbError.stack,
            );
            // Handle Unique Constraint Violations (Postgres code 23505)
            if (dbError.code === '23505') {
                throw new BadRequestException(
                    'Duplicate entry detected (Email or Mobile).',
                );
            }
            throw new InternalServerErrorException(
                `Database Transaction Failed: ${dbError.message}`,
            );
        }
    }

    private async sendRegistrationSuccessEmail(toAddress: string, data: any) {
        const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
        // Imported locally to avoid top-level issues if file structure changes, though standard import is better.
        // For now, let's keep it clean.
        const {
            getRegistrationSuccessEmailTemplate,
        } = require('../mail/templates/registration-success.template');

        const sesClient = new SESClient({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>(
                    'AWS_SECRET_ACCESS_KEY',
                ),
            },
        });

        // Assets (Using public URLs or placeholders similar to Admin Service)
        const serviceUrl =
            this.configService.get<string>('CORPORATE_SERVICE_URL') ||
            'http://localhost:4003';
        // Assets served statically from /assets (via MailAssetsController)
        const assets = {
            logo: `${serviceUrl}/assets/logo.png`,
            popper: `${serviceUrl}/assets/Popper.png`,
            pattern: `${serviceUrl}/assets/Pattern_mask.png`,
            footer: `${serviceUrl}/assets/Email_Vector.png`,
        };

        // Use the TS template function
        const htmlContent = getRegistrationSuccessEmailTemplate(
            data.name,
            data.companyName,
            data.email,
            data.mobile,
            data.password,
            `${data.loginUrl}/corporate/login`, // Ensure full login URL path
            assets,
        );

        const params = {
            Source: this.configService.get<string>('EMAIL_FROM'),
            Destination: {
                ToAddresses: [toAddress],
                CcAddresses: this.configService.get<string>('EMAIL_CC')
                    ? [this.configService.get<string>('EMAIL_CC')]
                    : [],
            },
            Message: {
                Subject: {
                    Data: 'Welcome to Origin BI - Registration Received',
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: 'UTF-8',
                    },
                },
            },
        };

        try {
            const command = new SendEmailCommand(params);
            await sesClient.send(command);
            const cc = this.configService.get<string>('EMAIL_CC') || 'None';
            console.log(`Registration email sent to ${toAddress}, CC: ${cc}`);
        } catch (error) {
            console.error('Error sending registration SES email:', error);
            // Don't throw, just log
        }
    }

    async getProfile(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
            relations: ['user'],
        });

        if (!corporate) {
            throw new NotFoundException('Corporate account not found');
        }

        return {
            ...corporate,
            id: corporate.id,
            company_name: corporate.companyName,
            sector_code: corporate.sectorCode,
            employee_ref_id: corporate.employeeRefId,
            job_title: corporate.jobTitle,
            gender: corporate.gender,
            email: user.email,
            country_code: corporate.countryCode,
            mobile_number: corporate.mobileNumber,
            linkedin_url: corporate.linkedinUrl,
            business_locations: corporate.businessLocations,
            available_credits: corporate.availableCredits,
            total_credits: corporate.totalCredits,
            is_active: corporate.isActive,
            is_blocked: user.isBlocked,
            full_name: corporate.fullName,
            created_at: corporate.createdAt,
            updated_at: corporate.updatedAt,
            per_credit_cost: this.perCreditCost,
        };
    }

    async createOrder(email: string, creditCount: number, reason: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) throw new NotFoundException('Corporate account not found');

        if (creditCount <= 0) throw new BadRequestException('Invalid credit count');

        const totalAmount = creditCount * this.perCreditCost;
        const options = {
            amount: totalAmount * 100, // amount in paisa
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                creditCount: creditCount,
                userId: corporate.userId, // Use corporate user ID
                corporateAccountId: corporate.id,
                perCreditCost: this.perCreditCost,
                reason: reason || 'Credit Top-up',
            },
        };

        try {
            const order = await this.razorpay.orders.create(options);
            return {
                orderId: order.id,
                amount: totalAmount * 100,
                currency: 'INR',
                key: this.configService.get<string>('RAZORPAY_KEY_ID'),
                perCreditCost: this.perCreditCost,
            };
        } catch (error) {
            console.error('Razorpay Error:', error);
            throw new InternalServerErrorException('Failed to create payment order');
        }
    }

    async verifyPayment(
        email: string,
        paymentDetails: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        },
    ) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            paymentDetails;

        // 1. Verify Signature
        const crypto = require('crypto');
        const hmac = crypto.createHmac(
            'sha256',
            this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        );
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new BadRequestException('Payment verification failed');
        }

        // 2. Fetch Order Details from Razorpay
        let order;
        try {
            order = await this.razorpay.orders.fetch(razorpay_order_id);
        } catch (e) {
            throw new InternalServerErrorException(
                'Failed to fetch order details from Razorpay',
            );
        }

        const notes = order.notes;
        const creditDelta = Number(notes.creditCount);
        const corporateAccountId = Number(notes.corporateAccountId);
        const createdByUserId = Number(notes.userId); // This is the corporate user id
        const perCreditCost = Number(notes.perCreditCost);
        const totalAmount = creditDelta * perCreditCost;
        const reason = notes.reason || 'Credit Top-up';

        // 3. Transactional Update
        const queryRunner = this.ledgerRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if transaction already recorded
            const existingLedger = await queryRunner.manager.findOne(
                CorporateCreditLedger,
                {
                    where: { razorpayOrderId: razorpay_order_id },
                },
            );

            if (existingLedger) {
                return { success: true, message: 'Already processed' };
            }

            // Create Ledger Entry
            const ledgerEntry = this.ledgerRepo.create({
                corporateAccountId: corporateAccountId,
                creditDelta: creditDelta,
                ledgerType: 'CREDIT',
                reason: reason,
                createdByUserId: createdByUserId,
                perCreditCost: perCreditCost,
                totalAmount: totalAmount,
                paymentStatus: 'SUCCESS',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                paidOn: new Date(),
            });

            await queryRunner.manager.save(ledgerEntry);

            // Update Corporate Credits
            const corporate = await queryRunner.manager.findOne(CorporateAccount, {
                where: { id: corporateAccountId },
            });

            if (corporate) {
                corporate.availableCredits += creditDelta;
                corporate.totalCredits += creditDelta;
                await queryRunner.manager.save(corporate);
            }

            await queryRunner.commitTransaction();

            // --- Send Success Email ---
            try {
                const user = await this.userRepo.findOne({
                    where: { id: createdByUserId },
                });
                const emailToSend = user ? user.email : email;

                // Get updated corporate account to ensure we have the name
                const updatedCorporate = await queryRunner.manager.findOne(
                    CorporateAccount,
                    {
                        where: { id: corporateAccountId },
                    },
                );

                await this.sendPaymentSuccessEmail(emailToSend, {
                    name: updatedCorporate?.fullName || 'Valued Customer',
                    paymentId: razorpay_payment_id,
                    amount: totalAmount.toFixed(2),
                    credits: creditDelta,
                    date: new Date().toLocaleDateString(),
                    dashboardUrl:
                        this.configService.get<string>('FRONTEND_URL') ||
                        'http://localhost:3000',
                });
            } catch (emailErr) {
                console.error('Failed to send payment success email:', emailErr);
            }

            return { success: true };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async recordPaymentFailure(
        razorpayOrderId: string,
        errorDescription: string,
    ) {
        let order;
        try {
            order = await this.razorpay.orders.fetch(razorpayOrderId);
        } catch (e) {
            console.error('Failed to fetch order for failure recording', e);
            return;
        }

        const notes = order.notes;
        const existing = await this.ledgerRepo.findOne({
            where: { razorpayOrderId: razorpayOrderId },
        });
        if (existing) return;

        const ledgerEntry = this.ledgerRepo.create({
            corporateAccountId: Number(notes.corporateAccountId),
            creditDelta: Number(notes.creditCount),
            ledgerType: 'CREDIT',
            reason: `Payment Failed: ${errorDescription}`,
            createdByUserId: Number(notes.userId),
            perCreditCost: Number(notes.perCreditCost),
            totalAmount: Number(notes.creditCount) * Number(notes.perCreditCost),
            paymentStatus: 'FAILED',
            razorpayOrderId: razorpayOrderId,
        });

        await this.ledgerRepo.save(ledgerEntry);
        return { success: true };
    }

    private async sendPaymentSuccessEmail(toAddress: string, data: any) {
        const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
        const {
            getPaymentSuccessEmailTemplate,
        } = require('../mail/templates/payment-success.template');

        const sesClient = new SESClient({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>(
                    'AWS_SECRET_ACCESS_KEY',
                ),
            },
        });

        // Assets (Using public URLs or placeholders similar to Admin Service)
        const serviceUrl =
            this.configService.get<string>('CORPORATE_SERVICE_URL') ||
            'http://localhost:4003';
        // Assets served statically from /assets (via MailAssetsController)
        const assets = {
            logo: `${serviceUrl}/assets/logo.png`,
            popper: `${serviceUrl}/assets/Popper.png`,
            pattern: `${serviceUrl}/assets/Pattern_mask.png`,
            footer: `${serviceUrl}/assets/Email_Vector.png`,
        };

        const htmlContent = getPaymentSuccessEmailTemplate(
            data.name,
            data.paymentId,
            data.amount,
            data.credits,
            data.date,
            `${data.dashboardUrl}/corporate/dashboard`,
            assets,
        );

        const params = {
            Source: this.configService.get<string>('EMAIL_FROM'),
            Destination: {
                ToAddresses: [toAddress],
                CcAddresses: this.configService.get<string>('EMAIL_CC')
                    ? [this.configService.get<string>('EMAIL_CC')]
                    : [],
            },
            Message: {
                Subject: {
                    Data: 'Payment Successful - Credits Added',
                    Charset: 'UTF-8',
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: 'UTF-8',
                    },
                },
            },
        };

        try {
            const command = new SendEmailCommand(params);
            await sesClient.send(command);
            console.log(`Payment success email sent to ${toAddress}`);
        } catch (error) {
            console.error('Failed to send payment success email:', error);
        }
    }

    async getLedger(
        email: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
    ) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) throw new NotFoundException('Corporate account not found');

        const { ILike, Raw } = require('typeorm');
        let whereCondition: any = { corporateAccountId: corporate.id };

        if (search) {
            whereCondition = [
                { corporateAccountId: corporate.id, reason: ILike(`%${search}%`) },
                { corporateAccountId: corporate.id, ledgerType: ILike(`%${search}%`) },
                {
                    corporateAccountId: corporate.id,
                    paymentStatus: ILike(`%${search}%`),
                },
                {
                    corporateAccountId: corporate.id,
                    razorpayPaymentId: ILike(`%${search}%`),
                },
                {
                    corporateAccountId: corporate.id,
                    createdAt: Raw(
                        (alias) => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`,
                    ),
                },
                {
                    corporateAccountId: corporate.id,
                    paidOn: Raw(
                        (alias) => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`,
                    ),
                },
            ];
        }

        const [items, total] = await this.ledgerRepo.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const mappedItems = items.map((item) => ({
            id: item.id,
            corporate_account_id: item.corporateAccountId,
            credit_delta: item.creditDelta,
            ledger_type: item.ledgerType,
            reason: item.reason,
            created_by_user_id: item.createdByUserId,
            created_at: item.createdAt,
            per_credit_cost: item.perCreditCost,
            total_amount: item.totalAmount,
            payment_status: item.paymentStatus,
            paid_on: item.paidOn,
        }));

        return {
            data: mappedItems,
            total,
            page,
            limit,
        };
    }

    async topUpCredits(email: string, amount: number, reason: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) throw new NotFoundException('Corporate account not found');

        corporate.availableCredits += amount;
        corporate.totalCredits += amount;
        await this.corporateRepo.save(corporate);

        const ledger = this.ledgerRepo.create({
            corporateAccountId: corporate.id,
            creditDelta: amount,
            ledgerType: 'CREDIT',
            reason: reason || 'Top-up',
            createdByUserId: corporate.userId,
            paymentStatus: 'NA',
            totalAmount: 0,
        });
        await this.ledgerRepo.save(ledger);

        return {
            success: true,
            newAvailable: corporate.availableCredits,
            newTotal: corporate.totalCredits,
        };
    }

    async getMyEmployees(
        email: string,
        page: number = 1,
        limit: number = 10,
        search?: string,
    ) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');

        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) throw new NotFoundException('Corporate account not found');

        const query = this.registrationRepo
            .createQueryBuilder('registration')
            .leftJoinAndSelect('registration.user', 'user')
            .where('registration.corporateAccountId = :corpId', {
                corpId: corporate.id,
            });

        if (search) {
            query.andWhere(
                '(registration.fullName ILIKE :search OR registration.mobileNumber ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [data, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('registration.createdAt', 'DESC')
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
        };
    }
}
