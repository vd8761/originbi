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
exports.ForgotPasswordService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const student_entity_1 = require("../entities/student.entity");
const student_action_log_entity_1 = require("../entities/student-action-log.entity");
let ForgotPasswordService = class ForgotPasswordService {
    constructor(studentRepository, actionLogRepository, httpService, configService) {
        this.studentRepository = studentRepository;
        this.actionLogRepository = actionLogRepository;
        this.httpService = httpService;
        this.configService = configService;
        this.authServiceUrl = this.configService.get('AUTH_SERVICE_URL') || 'http://localhost:4002';
    }
    async initiateStudentReset(email) {
        var _a;
        console.log(`[ForgotPasswordService] Initiating reset for: ${email}`);
        const student = await this.studentRepository.findOne({ where: { email } });
        if (!student) {
            console.log(`[ForgotPasswordService] Student not found: ${email}`);
            throw new common_1.NotFoundException('User not found.');
        }
        const today = new Date().toISOString().split('T')[0];
        const existingLog = await this.actionLogRepository.findOne({
            where: {
                student: { id: student.id },
                actionType: student_action_log_entity_1.ActionType.RESET_PASSWORD,
                actionDate: today,
            },
        });
        if (existingLog && existingLog.attemptCount >= 1) {
            console.log(`[ForgotPasswordService] Rate limit reached for student: ${student.id}`);
            throw new common_1.BadRequestException('Password reset limit reached. Try again tomorrow.');
        }
        try {
            console.log(`[ForgotPasswordService] Call Auth Service: ${this.authServiceUrl}/internal/cognito/forgot-password`);
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.authServiceUrl}/internal/cognito/forgot-password`, { email }));
            console.log(`[ForgotPasswordService] Auth Service success`);
        }
        catch (error) {
            console.error('Auth Service Forgot Password Failed for Student:', ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            console.error(error);
            throw new common_1.InternalServerErrorException('Failed to initiate password reset. Please try again.');
        }
        try {
            if (existingLog) {
                existingLog.attemptCount += 1;
                await this.actionLogRepository.save(existingLog);
            }
            else {
                const newLog = this.actionLogRepository.create({
                    student: student,
                    studentId: student.id,
                    actionType: student_action_log_entity_1.ActionType.RESET_PASSWORD,
                    actionDate: today,
                    attemptCount: 1,
                });
                await this.actionLogRepository.save(newLog);
            }
        }
        catch (dbError) {
            console.error('Failed to save action log:', dbError);
        }
        return { success: true, message: 'If this email is registered, a reset code has been sent.' };
    }
};
exports.ForgotPasswordService = ForgotPasswordService;
exports.ForgotPasswordService = ForgotPasswordService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(student_action_log_entity_1.StudentActionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService])
], ForgotPasswordService);
//# sourceMappingURL=forgotpassword.service.js.map