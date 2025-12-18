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
exports.CognitoController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const cognito_service_1 = require("./cognito.service");
class CreateCognitoUserDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCognitoUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCognitoUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCognitoUserDto.prototype, "groupName", void 0);
class LoginDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "group", void 0);
let CognitoController = class CognitoController {
    constructor(cognitoService) {
        this.cognitoService = cognitoService;
    }
    async createUser(body) {
        console.log('[auth-service] /internal/cognito/users body =', Object.assign(Object.assign({}, body), { password: body.password ? '***hidden***' : undefined }));
        const { email, password, groupName } = body;
        if (!email || !password) {
            throw new common_1.BadRequestException('email and password are required');
        }
        const result = await this.cognitoService.createUserWithPermanentPassword(email, password, groupName || 'STUDENT');
        console.log('[auth-service] Cognito result =', result);
        return result;
    }
    async login(body) {
        console.log('[auth-service] /internal/cognito/login body =', {
            email: body.email,
            group: body.group,
        });
        return this.cognitoService.login(body.email, body.password, body.group);
    }
    async forgotPassword(email) {
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        return this.cognitoService.forgotPassword(email);
    }
};
exports.CognitoController = CognitoController;
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCognitoUserDto]),
    __metadata("design:returntype", Promise)
], CognitoController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], CognitoController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CognitoController.prototype, "forgotPassword", null);
exports.CognitoController = CognitoController = __decorate([
    (0, common_1.Controller)('internal/cognito'),
    __metadata("design:paramtypes", [cognito_service_1.CognitoService])
], CognitoController);
//# sourceMappingURL=cognito.controller.js.map