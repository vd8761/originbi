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
exports.CorporateDashboardController = CorporateDashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [corporate_dashboard_service_1.CorporateDashboardService])
], CorporateDashboardController);
//# sourceMappingURL=corporate-dashboard.controller.js.map