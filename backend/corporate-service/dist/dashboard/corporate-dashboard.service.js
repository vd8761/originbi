"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporateDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const Razorpay = require("razorpay");
const user_entity_1 = require("../entities/user.entity");
const corporate_account_entity_1 = require("../entities/corporate-account.entity");
const corporate_credit_ledger_entity_1 = require("../entities/corporate-credit-ledger.entity");
const user_action_log_entity_1 = require("../entities/user-action-log.entity");
let CorporateDashboardService = class CorporateDashboardService {
    constructor(userRepo, corporateRepo, actionLogRepository, ledgerRepo, httpService, configService, dataSource) {
        this.userRepo = userRepo;
        this.corporateRepo = corporateRepo;
        this.actionLogRepository = actionLogRepository;
        this.ledgerRepo = ledgerRepo;
        this.httpService = httpService;
        this.configService = configService;
        this.dataSource = dataSource;
        this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL') || 'http://localhost:4002';
        if (this.authServiceUrl.includes('4003')) {
            console.warn(`[CorporateDashboardService] AUTH_SERVICE_URL misconfigured to ${this.authServiceUrl}. Forcing http://localhost:4002`);
            this.authServiceUrl = 'http://localhost:4002';
        }
        this.perCreditCost = parseFloat(this.configService.get('PER_CREDIT_COST') || '200');
        const keyId = this.configService.get('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
        if (keyId && keySecret) {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
    }
    async getStats(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
        });
        if (!corporate) {
            throw new common_1.NotFoundException('Corporate account not found');
        }
        const studentsRegistered = 0;
        return {
            companyName: corporate.companyName,
            availableCredits: corporate.availableCredits,
            totalCredits: corporate.totalCredits,
            studentsRegistered,
            isActive: corporate.isActive,
        };
    }
    async initiateCorporateReset(email) {
        var _a;
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException('User not found.');
        }
        if (user.role !== 'CORPORATE') {
            throw new common_1.NotFoundException('Corporate user not found.');
        }
        const corporate = await this.corporateRepo.findOne({ where: { userId: user.id } });
        if (!corporate) {
            throw new common_1.NotFoundException('Corporate account not found.');
        }
        const today = new Date().toISOString().split('T')[0];
        const existingLog = await this.actionLogRepository.findOne({
            where: {
                user: { id: user.id },
                actionType: user_action_log_entity_1.ActionType.RESET_PASSWORD,
                role: user_action_log_entity_1.UserRole.CORPORATE,
                actionDate: today,
            },
        });
        if (existingLog && existingLog.attemptCount >= 1) {
            throw new common_1.BadRequestException('Password reset limit reached for today. Please try again tomorrow.');
        }
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.authServiceUrl}/internal/cognito/forgot-password`, { email }));
        }
        catch (error) {
            console.error('Auth Service Forgot Password Failed:', ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw new common_1.InternalServerErrorException('Failed to initiate password reset. Please try again.');
        }
        if (existingLog) {
            existingLog.attemptCount += 1;
            await this.actionLogRepository.save(existingLog);
        }
        else {
            const newLog = this.actionLogRepository.create({
                user: user,
                userId: user.id,
                role: user_action_log_entity_1.UserRole.CORPORATE,
                actionType: user_action_log_entity_1.ActionType.RESET_PASSWORD,
                actionDate: today,
                attemptCount: 1,
                registrationId: corporate.id.toString(),
            });
            await this.actionLogRepository.save(newLog);
        }
        return { success: true, message: 'Password reset initiated. Check your email.' };
    }
    async createCognitoUser(email, password, groupName) {
        var _a, _b, _c;
        console.log(`[CorporateDashboardService] createCognitoUser calling Auth Service at: ${this.authServiceUrl}`);
        try {
            const baseUrl = this.authServiceUrl.replace(/\/$/, '');
            const url = `${baseUrl}/internal/cognito/users`;
            const res$ = this.httpService.post(url, { email, password, groupName });
            const res = await (0, rxjs_1.firstValueFrom)(res$);
            return res.data;
        }
        catch (err) {
            console.error('Error creating Cognito user:', err);
            const status = (_a = err.response) === null || _a === void 0 ? void 0 : _a.status;
            const msg = ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || err.message;
            if (status && status >= 400 && status < 500) {
                throw new common_1.BadRequestException(`Auth Service: ${msg}`);
            }
            throw new common_1.InternalServerErrorException(`Auth Service Failed: ${msg}`);
        }
    }
    async registerCorporate(dto) {
        const email = dto.email.trim();
        const existingUser = await this.userRepo.findOne({ where: { email: email } });
        if (existingUser) {
            throw new common_1.BadRequestException(`Email '${email}' is already registered`);
        }
        const existingMobile = await this.corporateRepo.findOne({
            where: { mobileNumber: dto.mobile, countryCode: dto.countryCode }
        });
        if (existingMobile) {
            throw new common_1.BadRequestException('Mobile number already exists for a corporate account');
        }
        let sub;
        try {
            const cognitoRes = await this.createCognitoUser(email, dto.password, 'CORPORATE');
            sub = cognitoRes.sub;
        }
        catch (e) {
            throw e;
        }
        try {
            const result = await this.dataSource.transaction(async (manager) => {
                const user = manager.create(user_entity_1.User, {
                    email: email,
                    role: 'CORPORATE',
                    emailVerified: true,
                    cognitoSub: sub,
                    isActive: false,
                    isBlocked: false,
                    metadata: {
                        fullName: dto.name,
                        countryCode: dto.countryCode,
                        mobile: dto.mobile,
                        gender: dto.gender,
                    },
                });
                await manager.save(user);
                const corporateAccount = manager.create(corporate_account_entity_1.CorporateAccount, {
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
                    totalCredits: 0,
                    availableCredits: 0,
                    isActive: false,
                });
                await manager.save(corporateAccount);
                return { success: true, message: 'Registration successful. Account pending approval.' };
            });
            this.sendRegistrationSuccessEmail(email, {
                name: dto.name,
                companyName: dto.companyName,
                email: email,
                mobile: dto.mobile,
                password: dto.password,
                loginUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000'
            }).catch(emailErr => console.error("Failed to send registration email:", emailErr));
            return result;
        }
        catch (dbError) {
            console.error(`Database Transaction Failed in Public Register: ${dbError.message}`, dbError.stack);
            if (dbError.code === '23505') {
                throw new common_1.BadRequestException('Duplicate entry detected (Email or Mobile).');
            }
            throw new common_1.InternalServerErrorException(`Database Transaction Failed: ${dbError.message}`);
        }
    }
    async sendRegistrationSuccessEmail(toAddress, data) {
        const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
        const fs = require('fs');
        const path = require('path');
        const sesClient = new SESClient({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
        });
        const templatePath = path.join(__dirname, '..', 'mail', 'templates', 'registration-success.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        const assets = {
            logo: "https://originbi.com/wp-content/uploads/2023/11/Origin-BI-Logo-01.png",
            popper: "https://originbi-assets.s3.ap-south-1.amazonaws.com/email-assets/celebration-popper.png",
            pattern: "https://originbi-assets.s3.ap-south-1.amazonaws.com/email-assets/pattern-bg.png",
            footer: "https://originbi-assets.s3.ap-south-1.amazonaws.com/email-assets/email-footer.png"
        };
        htmlContent = htmlContent.replace('{{name}}', data.name);
        htmlContent = htmlContent.replace('{{companyName}}', data.companyName);
        htmlContent = htmlContent.replace('{{email}}', data.email);
        htmlContent = htmlContent.replace('{{mobile}}', data.mobile);
        htmlContent = htmlContent.replace('{{password}}', data.password);
        htmlContent = htmlContent.replace('{{loginUrl}}', `${data.loginUrl}/corporate/login`);
        htmlContent = htmlContent.replace('{{year}}', new Date().getFullYear().toString());
        htmlContent = htmlContent.replace('{{logo}}', assets.logo);
        htmlContent = htmlContent.replace('{{popper}}', "https://img.icons8.com/emoji/96/party-popper.png");
        htmlContent = htmlContent.replace('{{pattern}}', "");
        htmlContent = htmlContent.replace('{{footer}}', "");
        const params = {
            Source: this.configService.get('EMAIL_FROM'),
            Destination: {
                ToAddresses: [toAddress],
                CcAddresses: this.configService.get('EMAIL_CC') ? [this.configService.get('EMAIL_CC')] : [],
            },
            Message: {
                Subject: {
                    Data: "Welcome to Origin BI - Registration Received",
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        };
        try {
            const command = new SendEmailCommand(params);
            await sesClient.send(command);
            const cc = this.configService.get('EMAIL_CC') || 'None';
            console.log(`Registration email sent to ${toAddress}, CC: ${cc}`);
        }
        catch (error) {
            console.error("Error sending registration SES email:", error);
        }
    }
    async getProfile(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const corporate = await this.corporateRepo.findOne({
            where: { userId: user.id },
            relations: ['user'],
        });
        if (!corporate) {
            throw new common_1.NotFoundException('Corporate account not found');
        }
        return Object.assign(Object.assign({}, corporate), { id: corporate.id, company_name: corporate.companyName, sector_code: corporate.sectorCode, employee_ref_id: corporate.employeeRefId, job_title: corporate.jobTitle, gender: corporate.gender, email: user.email, country_code: corporate.countryCode, mobile_number: corporate.mobileNumber, linkedin_url: corporate.linkedinUrl, business_locations: corporate.businessLocations, available_credits: corporate.availableCredits, total_credits: corporate.totalCredits, is_active: corporate.isActive, is_blocked: user.isBlocked, full_name: corporate.fullName, created_at: corporate.createdAt, updated_at: corporate.updatedAt, per_credit_cost: this.perCreditCost });
    }
    async createOrder(email, creditCount, reason) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const corporate = await this.corporateRepo.findOne({ where: { userId: user.id } });
        if (!corporate)
            throw new common_1.NotFoundException('Corporate account not found');
        if (creditCount <= 0)
            throw new common_1.BadRequestException('Invalid credit count');
        const totalAmount = creditCount * this.perCreditCost;
        const options = {
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                creditCount: creditCount,
                userId: corporate.userId,
                corporateAccountId: corporate.id,
                perCreditCost: this.perCreditCost,
                reason: reason || 'Credit Top-up',
            }
        };
        try {
            const order = await this.razorpay.orders.create(options);
            return {
                orderId: order.id,
                amount: totalAmount * 100,
                currency: 'INR',
                key: this.configService.get('RAZORPAY_KEY_ID'),
                perCreditCost: this.perCreditCost,
            };
        }
        catch (error) {
            console.error('Razorpay Error:', error);
            throw new common_1.InternalServerErrorException('Failed to create payment order');
        }
    }
    async verifyPayment(email, paymentDetails) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'));
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
        if (generated_signature !== razorpay_signature) {
            throw new common_1.BadRequestException('Payment verification failed');
        }
        let order;
        try {
            order = await this.razorpay.orders.fetch(razorpay_order_id);
        }
        catch (e) {
            throw new common_1.InternalServerErrorException('Failed to fetch order details from Razorpay');
        }
        const notes = order.notes;
        const creditDelta = Number(notes.creditCount);
        const corporateAccountId = Number(notes.corporateAccountId);
        const createdByUserId = Number(notes.userId);
        const perCreditCost = Number(notes.perCreditCost);
        const totalAmount = creditDelta * perCreditCost;
        const reason = notes.reason || 'Credit Top-up';
        const queryRunner = this.ledgerRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const existingLedger = await queryRunner.manager.findOne(corporate_credit_ledger_entity_1.CorporateCreditLedger, {
                where: { razorpayOrderId: razorpay_order_id },
            });
            if (existingLedger) {
                return { success: true, message: 'Already processed' };
            }
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
            const corporate = await queryRunner.manager.findOne(corporate_account_entity_1.CorporateAccount, {
                where: { id: corporateAccountId },
            });
            if (corporate) {
                corporate.availableCredits += creditDelta;
                corporate.totalCredits += creditDelta;
                await queryRunner.manager.save(corporate);
            }
            await queryRunner.commitTransaction();
            try {
                const user = await this.userRepo.findOne({ where: { id: createdByUserId } });
                const emailToSend = user ? user.email : email;
                await this.sendPaymentSuccessEmail(emailToSend, {
                    paymentId: razorpay_payment_id,
                    amount: totalAmount.toFixed(2),
                    credits: creditDelta,
                    date: new Date().toLocaleDateString(),
                    dashboardUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
                });
            }
            catch (emailErr) {
                console.error("Failed to send payment success email:", emailErr);
            }
            return { success: true };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async recordPaymentFailure(razorpayOrderId, errorDescription) {
        let order;
        try {
            order = await this.razorpay.orders.fetch(razorpayOrderId);
        }
        catch (e) {
            console.error("Failed to fetch order for failure recording", e);
            return;
        }
        const notes = order.notes;
        const existing = await this.ledgerRepo.findOne({ where: { razorpayOrderId: razorpayOrderId } });
        if (existing)
            return;
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
    async sendPaymentSuccessEmail(toAddress, data) {
        const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
        const fs = require('fs');
        const path = require('path');
        const sesClient = new SESClient({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
        });
        const templatePath = path.join(__dirname, '..', 'mail', 'templates', 'payment-success.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        htmlContent = htmlContent.replace('{{paymentId}}', data.paymentId);
        htmlContent = htmlContent.replace('{{amount}}', data.amount);
        htmlContent = htmlContent.replace('{{credits}}', data.credits);
        htmlContent = htmlContent.replace('{{date}}', data.date);
        htmlContent = htmlContent.replace('{{dashboardUrl}}', `${data.dashboardUrl}/corporate/dashboard`);
        htmlContent = htmlContent.replace('{{year}}', new Date().getFullYear().toString());
        const params = {
            Source: this.configService.get('EMAIL_FROM'),
            Destination: {
                ToAddresses: [toAddress],
                CcAddresses: [this.configService.get('EMAIL_CC')],
            },
            Message: {
                Subject: {
                    Data: "Payment Successful - Credits Added",
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: "UTF-8",
                    },
                },
            },
        };
        const command = new SendEmailCommand(params);
        await sesClient.send(command);
    }
    async getLedger(email, page = 1, limit = 10, search) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const corporate = await this.corporateRepo.findOne({ where: { userId: user.id } });
        if (!corporate)
            throw new common_1.NotFoundException('Corporate account not found');
        const { ILike, Raw } = require('typeorm');
        let whereCondition = { corporateAccountId: corporate.id };
        if (search) {
            whereCondition = [
                { corporateAccountId: corporate.id, reason: ILike(`%${search}%`) },
                { corporateAccountId: corporate.id, ledgerType: ILike(`%${search}%`) },
                { corporateAccountId: corporate.id, paymentStatus: ILike(`%${search}%`) },
                { corporateAccountId: corporate.id, razorpayPaymentId: ILike(`%${search}%`) },
                {
                    corporateAccountId: corporate.id,
                    createdAt: Raw(alias => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`)
                },
                {
                    corporateAccountId: corporate.id,
                    paidOn: Raw(alias => `TO_CHAR(${alias}, 'MM/DD/YYYY') ILIKE '%${search}%'`)
                }
            ];
        }
        const [items, total] = await this.ledgerRepo.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        const mappedItems = items.map(item => ({
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
    async topUpCredits(email, amount, reason) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const corporate = await this.corporateRepo.findOne({ where: { userId: user.id } });
        if (!corporate)
            throw new common_1.NotFoundException('Corporate account not found');
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
};
exports.CorporateDashboardService = CorporateDashboardService;
exports.CorporateDashboardService = CorporateDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(corporate_account_entity_1.CorporateAccount)),
    __param(2, (0, typeorm_1.InjectRepository)(user_action_log_entity_1.UserActionLog)),
    __param(3, (0, typeorm_1.InjectRepository)(corporate_credit_ledger_entity_1.CorporateCreditLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.DataSource])
], CorporateDashboardService);
//# sourceMappingURL=corporate-dashboard.service.js.map