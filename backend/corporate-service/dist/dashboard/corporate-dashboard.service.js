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
const user_entity_1 = require("../entities/user.entity");
const corporate_account_entity_1 = require("../entities/corporate-account.entity");
const user_action_log_entity_1 = require("../entities/user-action-log.entity");
let CorporateDashboardService = class CorporateDashboardService {
    constructor(userRepo, corporateRepo, actionLogRepository, httpService, configService) {
        this.userRepo = userRepo;
        this.corporateRepo = corporateRepo;
        this.actionLogRepository = actionLogRepository;
        this.httpService = httpService;
        this.configService = configService;
        this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL') || 'http://localhost:4002';
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
};
exports.CorporateDashboardService = CorporateDashboardService;
exports.CorporateDashboardService = CorporateDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(corporate_account_entity_1.CorporateAccount)),
    __param(2, (0, typeorm_1.InjectRepository)(user_action_log_entity_1.UserActionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService])
], CorporateDashboardService);
//# sourceMappingURL=corporate-dashboard.service.js.map