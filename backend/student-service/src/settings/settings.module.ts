import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OriginbiSetting } from '@originbi/shared-entities';
import { SettingsService } from './settings.service';

/**
 * Read-only SettingsModule for student-service.
 * No controller — only provides SettingsService for DI.
 */
@Module({
    imports: [TypeOrmModule.forFeature([OriginbiSetting])],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
