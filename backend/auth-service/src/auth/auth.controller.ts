import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { CognitoService } from '../cognito/cognito.service';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

class LoginDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    group?: string;
}

class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

class LogoutDto {
    @IsString()
    @IsNotEmpty()
    accessToken: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly cognitoService: CognitoService) { }

    @Post('login')
    async login(@Body() body: LoginDto) {
        console.log(`[AuthController] Login attempt for: ${body.email}`);
        // Mobile apps typically don't have hard strict group checks unless specified
        // Defaulting to allow any valid user, or pass group if mobile specifically needs it
        return this.cognitoService.login(body.email, body.password, body.group);
    }

    @Post('refresh')
    async refresh(@Body() body: RefreshTokenDto) {
        console.log('[AuthController] Refresh token attempt');
        return this.cognitoService.refreshToken(body.refreshToken);
    }

    @Post('logout')
    async logout(@Body() body: LogoutDto) {
        console.log('[AuthController] Logout attempt');
        return this.cognitoService.logout(body.accessToken);
    }
}
