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
    constructor(userRepo, corporateRepo, actionLogRepository, ledgerRepo, httpService, configService) {
        this.userRepo = userRepo;
        this.corporateRepo = corporateRepo;
        this.actionLogRepository = actionLogRepository;
        this.ledgerRepo = ledgerRepo;
        this.httpService = httpService;
        this.configService = configService;
        this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL') || 'http://localhost:4002';
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
        const templatePath = path.join(__dirname, '..', 'mail', 'payment-success.html');
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
        config_1.ConfigService])
], CorporateDashboardService);
//# sourceMappingURL=corporate-dashboard.service.js.map