// backend/auth-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CognitoService } from './cognito/cognito.service';
import { CognitoController } from './cognito/cognito.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [CognitoController],
  providers: [CognitoService],
})
export class AppModule {}
