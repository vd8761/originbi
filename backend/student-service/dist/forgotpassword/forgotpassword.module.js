"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const forgotpassword_controller_1 = require("./forgotpassword.controller");
const forgotpassword_service_1 = require("./forgotpassword.service");
const student_entity_1 = require("../entities/student.entity");
const student_action_log_entity_1 = require("../entities/student-action-log.entity");
const config_1 = require("@nestjs/config");
let ForgotPasswordModule = class ForgotPasswordModule {
};
exports.ForgotPasswordModule = ForgotPasswordModule;
exports.ForgotPasswordModule = ForgotPasswordModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, student_action_log_entity_1.StudentActionLog]),
            axios_1.HttpModule,
            config_1.ConfigModule,
        ],
        controllers: [forgotpassword_controller_1.ForgotPasswordController],
        providers: [forgotpassword_service_1.ForgotPasswordService],
    })
], ForgotPasswordModule);
//# sourceMappingURL=forgotpassword.module.js.map