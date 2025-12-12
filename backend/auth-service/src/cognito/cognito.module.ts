import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CognitoController } from './cognito.controller';
import { CognitoService } from './cognito.service';

@Module({
  imports: [ConfigModule],
  controllers: [CognitoController],
  providers: [CognitoService],
})
export class CognitoModule {}
