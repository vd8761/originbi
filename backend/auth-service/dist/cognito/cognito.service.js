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
exports.CognitoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
let CognitoService = class CognitoService {
    constructor(config) {
        this.config = config;
        const region = this.config.get('COGNITO_REGION');
        this.userPoolId = this.config.get('COGNITO_USER_POOL_ID');
        const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
        if (!this.userPoolId)
            throw new Error('COGNITO_USER_POOL_ID is not set');
        if (!region)
            throw new Error('COGNITO_REGION is not set');
        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in auth-service env file.');
        }
        this.cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async createUserWithPermanentPassword(email, password, groupName = 'STUDENT') {
        var _a, _b, _c, _d, _e, _f;
        try {
            let username = email;
            let userSub = null;
            try {
                const createRes = await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
                    UserPoolId: this.userPoolId,
                    Username: email,
                    UserAttributes: [
                        { Name: 'email', Value: email },
                        { Name: 'email_verified', Value: 'true' },
                    ],
                    MessageAction: 'SUPPRESS',
                }));
                username = ((_a = createRes.User) === null || _a === void 0 ? void 0 : _a.Username) || email;
                userSub =
                    ((_d = (_c = (_b = createRes.User) === null || _b === void 0 ? void 0 : _b.Attributes) === null || _c === void 0 ? void 0 : _c.find((a) => a.Name === 'sub')) === null || _d === void 0 ? void 0 : _d.Value) ||
                        null;
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.name) === 'UsernameExistsException') {
                    username = email;
                }
                else {
                    throw err;
                }
            }
            await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
                UserPoolId: this.userPoolId,
                Username: username,
                Password: password,
                Permanent: true,
            }));
            if (groupName) {
                await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                    UserPoolId: this.userPoolId,
                    Username: username,
                    GroupName: groupName,
                }));
            }
            if (!userSub) {
                try {
                    const getUserRes = await this.cognitoClient.send(new client_cognito_identity_provider_1.AdminGetUserCommand({
                        UserPoolId: this.userPoolId,
                        Username: username,
                    }));
                    userSub =
                        ((_f = (_e = getUserRes.UserAttributes) === null || _e === void 0 ? void 0 : _e.find((a) => a.Name === 'sub')) === null || _f === void 0 ? void 0 : _f.Value) ||
                            null;
                }
                catch (_g) { }
            }
            return { sub: userSub !== null && userSub !== void 0 ? userSub : username, email, group: groupName };
        }
        catch (error) {
            console.error('[CognitoService] AWS error details:', {
                name: error === null || error === void 0 ? void 0 : error.name,
                message: error === null || error === void 0 ? void 0 : error.message,
            });
            throw new common_1.InternalServerErrorException(`Cognito error: ${(error === null || error === void 0 ? void 0 : error.name) || 'Unknown'} - ${(error === null || error === void 0 ? void 0 : error.message) || 'No message'}`);
        }
    }
};
exports.CognitoService = CognitoService;
exports.CognitoService = CognitoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CognitoService);
//# sourceMappingURL=cognito.service.js.map