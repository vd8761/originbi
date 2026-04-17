import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OriginbiSetting } from '@originbi/shared-entities';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AdminLoginModule } from '../adminlogin/adminlogin.module';

@Module({
  imports: [AdminLoginModule, TypeOrmModule.forFeature([OriginbiSetting])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService], // exported so other modules (e.g. Registrations) can inject it
})
export class SettingsModule {}
