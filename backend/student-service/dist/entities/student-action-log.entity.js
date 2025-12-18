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
exports.StudentActionLog = exports.ActionType = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
var ActionType;
(function (ActionType) {
    ActionType["RESET_PASSWORD"] = "RESET_PASSWORD";
    ActionType["EMAIL_SENT"] = "EMAIL_SENT";
})(ActionType || (exports.ActionType = ActionType = {}));
let StudentActionLog = class StudentActionLog {
};
exports.StudentActionLog = StudentActionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentActionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], StudentActionLog.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'integer' }),
    __metadata("design:type", Number)
], StudentActionLog.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action_type',
        type: 'enum',
        enum: ActionType,
    }),
    __metadata("design:type", String)
], StudentActionLog.prototype, "actionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', default: 0 }),
    __metadata("design:type", Number)
], StudentActionLog.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action_date', type: 'date' }),
    __metadata("design:type", String)
], StudentActionLog.prototype, "actionDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StudentActionLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], StudentActionLog.prototype, "updatedAt", void 0);
exports.StudentActionLog = StudentActionLog = __decorate([
    (0, typeorm_1.Entity)('student_action_logs'),
    (0, typeorm_1.Unique)(['student', 'actionType', 'actionDate'])
], StudentActionLog);
//# sourceMappingURL=student-action-log.entity.js.map