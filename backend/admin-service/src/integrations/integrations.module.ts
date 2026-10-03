import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterApp } from '@originbi/shared-entities';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

import { AdminLoginModule } from '../adminlogin/adminlogin.module';

@Module({
  imports: [TypeOrmModule.forFeature([MasterApp]), AdminLoginModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
