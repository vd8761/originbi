import { Body, Controller, Post } from '@nestjs/common';
import { CognitoService } from './cognito.service';

class CreateCognitoUserDto {
  email: string;
  password: string;
}

@Controller('internal/cognito')
export class CognitoController {
  constructor(private readonly cognitoService: CognitoService) {}

  @Post('users')
  async createUser(@Body() body: CreateCognitoUserDto) {
    const { email, password } = body;
    const result = await this.cognitoService.createUserWithPermanentPassword(
      email,
      password,
    );
    return result; // { sub: '...' }
  }
}
