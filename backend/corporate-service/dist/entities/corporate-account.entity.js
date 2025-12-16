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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorporateAccount = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const corporate_credit_ledger_entity_1 = require("./corporate-credit-ledger.entity");
let CorporateAccount = class CorporateAccount {
};
exports.CorporateAccount = CorporateAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], CorporateAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], CorporateAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CorporateAccount.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_name', length: 250 }),
    __metadata("design:type", String)
], CorporateAccount.prototype, "companyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'available_credits', default: 0 }),
    __metadata("design:type", Number)
], CorporateAccount.prototype, "availableCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_credits', default: 0 }),
    __metadata("design:type", Number)
], CorporateAccount.prototype, "totalCredits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'employee_ref_id', length: 100, nullable: true }),
    __metadata("design:type", String)
], CorporateAccount.prototype, "employeeRefId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], CorporateAccount.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => corporate_credit_ledger_entity_1.CorporateCreditLedger, (ledger) => ledger.corporateAccount),
    __metadata("design:type", Array)
], CorporateAccount.prototype, "creditLedgers", void 0);
exports.CorporateAccount = CorporateAccount = __decorate([
    (0, typeorm_1.Entity)('corporate_accounts')
], CorporateAccount);
//# sourceMappingURL=corporate-account.entity.js.map