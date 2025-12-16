// auth-service/src/cognito/cognito.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CognitoService } from './cognito.service';

class CreateCognitoUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // Optional: if you want to pass group from admin-service later
  @IsOptional()
  @IsString()
  groupName?: string;
}

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  group?: string;
}

@Controller('internal/cognito')
export class CognitoController {
  constructor(private readonly cognitoService: CognitoService) { }

  /**
   * Create user in Cognito with permanent password.
   * POST /internal/cognito/users
   */
  @Post('users')
  async createUser(@Body() body: CreateCognitoUserDto) {
    console.log('[auth-service] /internal/cognito/users body =', {
      ...body,
      password: body.password ? '***hidden***' : undefined, // do not log real password
    });

    const { email, password, groupName } = body;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    // If group not sent, default to STUDENT
    const result = await this.cognitoService.createUserWithPermanentPassword(
      email,
      password,
      groupName || 'STUDENT',
    );

    console.log('[auth-service] Cognito result =', result);
    return result;
  }
  /**
   * Login user
   * POST /internal/cognito/login
   */
  @Post('login')
  async login(@Body() body: LoginDto) {
    console.log('[auth-service] /internal/cognito/login body =', {
      email: body.email,
      group: body.group,
    });

    return this.cognitoService.login(body.email, body.password, body.group);
  }
}
