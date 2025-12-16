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
const user_entity_1 = require("../entities/user.entity");
const corporate_account_entity_1 = require("../entities/corporate-account.entity");
let CorporateDashboardService = class CorporateDashboardService {
    constructor(userRepo, corporateRepo) {
        this.userRepo = userRepo;
        this.corporateRepo = corporateRepo;
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
};
exports.CorporateDashboardService = CorporateDashboardService;
exports.CorporateDashboardService = CorporateDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(corporate_account_entity_1.CorporateAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CorporateDashboardService);
//# sourceMappingURL=corporate-dashboard.service.js.map