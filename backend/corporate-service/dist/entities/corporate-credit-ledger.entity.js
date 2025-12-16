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
exports.CorporateCreditLedger = void 0;
const typeorm_1 = require("typeorm");
const corporate_account_entity_1 = require("./corporate-account.entity");
const user_entity_1 = require("./user.entity");
let CorporateCreditLedger = class CorporateCreditLedger {
};
exports.CorporateCreditLedger = CorporateCreditLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], CorporateCreditLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'corporate_account_id', type: 'bigint' }),
    __metadata("design:type", Number)
], CorporateCreditLedger.prototype, "corporateAccountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => corporate_account_entity_1.CorporateAccount, (account) => account.creditLedgers),
    (0, typeorm_1.JoinColumn)({ name: 'corporate_account_id' }),
    __metadata("design:type", corporate_account_entity_1.CorporateAccount)
], CorporateCreditLedger.prototype, "corporateAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credit_delta' }),
    __metadata("design:type", Number)
], CorporateCreditLedger.prototype, "creditDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CorporateCreditLedger.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_user_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], CorporateCreditLedger.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_user_id' }),
    __metadata("design:type", user_entity_1.User)
], CorporateCreditLedger.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CorporateCreditLedger.prototype, "createdAt", void 0);
exports.CorporateCreditLedger = CorporateCreditLedger = __decorate([
    (0, typeorm_1.Entity)('corporate_credit_ledger')
], CorporateCreditLedger);
//# sourceMappingURL=corporate-credit-ledger.entity.js.map