import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CognitoModule } from './cognito/cognito.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local',
    }),
    CognitoModule,
    AuthModule,
  ],
})
export class AppModule { }
