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
exports.CorporateDashboardController = void 0;
const common_1 = require("@nestjs/common");
const corporate_dashboard_service_1 = require("./corporate-dashboard.service");
const register_corporate_dto_1 = require("./dto/register-corporate.dto");
let CorporateDashboardController = class CorporateDashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getDashboardStats(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.dashboardService.getStats(email);
    }
    async initiateReset(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.dashboardService.initiateCorporateReset(email);
    }
    async getProfile(email) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        return this.dashboardService.getProfile(email);
    }
    async getLedger(email, page = 1, limit = 10, search) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        return this.dashboardService.getLedger(email, page, limit, search);
    }
    async topUpCredits(email, amount, reason) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        if (!amount || amount <= 0)
            throw new common_1.BadRequestException('Valid amount is required');
        return this.dashboardService.topUpCredits(email, amount, reason);
    }
    async createOrder(email, creditCount, reason) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        if (!creditCount || creditCount <= 0)
            throw new common_1.BadRequestException('Valid credit count is required');
        return this.dashboardService.createOrder(email, creditCount, reason);
    }
    async verifyPayment(email, paymentDetails) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        if (!paymentDetails)
            throw new common_1.BadRequestException('Payment details are required');
        return this.dashboardService.verifyPayment(email, paymentDetails);
    }
    async recordPaymentFailure(orderId, description) {
        return this.dashboardService.recordPaymentFailure(orderId, description);
    }
    async registerCorporate(dto) {
        return this.dashboardService.registerCorporate(dto);
    }
};
exports.CorporateDashboardController = CorporateDashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Post)('forgot-password/initiate'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "initiateReset", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)('email')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Post)('top-up'),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "topUpCredits", null);
__decorate([
    (0, common_1.Post)('create-order'),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('creditCount')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify-payment'),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('paymentDetails')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('record-payment-failure'),
    __param(0, (0, common_1.Body)('orderId')),
    __param(1, (0, common_1.Body)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "recordPaymentFailure", null);
__decorate([
    (0, common_1.Post)('register-corporate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_corporate_dto_1.RegisterCorporateDto]),
    __metadata("design:returntype", Promise)
], CorporateDashboardController.prototype, "registerCorporate", null);
exports.CorporateDashboardController = CorporateDashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [corporate_dashboard_service_1.CorporateDashboardService])
], CorporateDashboardController);
//# sourceMappingURL=corporate-dashboard.controller.js.map