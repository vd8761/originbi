import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TenantAppConfig,
  CorporateAccount,
  MasterApp,
} from '@originbi/shared-entities';
import { CorporateIntegration } from '../entities/corporate-integration.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { ZenroSyncService } from './zenro-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantAppConfig,
      CorporateAccount,
      MasterApp,
      CorporateIntegration,
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleStrategy, ZenroSyncService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
