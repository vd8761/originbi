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
exports.UserActionLog = exports.ActionType = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["CORPORATE"] = "CORPORATE";
})(UserRole || (exports.UserRole = UserRole = {}));
var ActionType;
(function (ActionType) {
    ActionType["RESET_PASSWORD"] = "RESET_PASSWORD";
    ActionType["EMAIL_SENT"] = "EMAIL_SENT";
})(ActionType || (exports.ActionType = ActionType = {}));
let UserActionLog = class UserActionLog {
};
exports.UserActionLog = UserActionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserActionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserActionLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], UserActionLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registration_id', nullable: true }),
    __metadata("design:type", String)
], UserActionLog.prototype, "registrationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole,
    }),
    __metadata("design:type", String)
], UserActionLog.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action_type',
        type: 'enum',
        enum: ActionType,
    }),
    __metadata("design:type", String)
], UserActionLog.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', default: 0 }),
    __metadata("design:type", Number)
], UserActionLog.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action_date', type: 'date' }),
    __metadata("design:type", String)
], UserActionLog.prototype, "actionDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserActionLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UserActionLog.prototype, "updatedAt", void 0);
exports.UserActionLog = UserActionLog = __decorate([
    (0, typeorm_1.Entity)('user_action_logs'),
    (0, typeorm_1.Unique)(['user', 'actionType', 'actionDate', 'role'])
], UserActionLog);
//# sourceMappingURL=user-action-log.entity.js.map