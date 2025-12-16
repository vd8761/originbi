"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporateDashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const corporate_dashboard_controller_1 = require("./corporate-dashboard.controller");
const corporate_dashboard_service_1 = require("./corporate-dashboard.service");
const corporate_account_entity_1 = require("../entities/corporate-account.entity");
const user_entity_1 = require("../entities/user.entity");
const corporate_credit_ledger_entity_1 = require("../entities/corporate-credit-ledger.entity");
let CorporateDashboardModule = class CorporateDashboardModule {
};
exports.CorporateDashboardModule = CorporateDashboardModule;
exports.CorporateDashboardModule = CorporateDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([corporate_account_entity_1.CorporateAccount, user_entity_1.User, corporate_credit_ledger_entity_1.CorporateCreditLedger])],
        controllers: [corporate_dashboard_controller_1.CorporateDashboardController],
        providers: [corporate_dashboard_service_1.CorporateDashboardService],
    })
], CorporateDashboardModule);
//# sourceMappingURL=corporate-dashboard.module.js.map