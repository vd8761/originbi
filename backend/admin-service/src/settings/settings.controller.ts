import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

@Controller('settings')
@UseGuards(AdminLoginGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  // ---------------------------------------------------------
  // GET /settings — All settings grouped by category
  // ---------------------------------------------------------
  @Get()
  async getAll() {
    return this.settingsService.getAllGrouped();
  }

  // ---------------------------------------------------------
  // GET /settings/:category — Settings for a specific category
  // ---------------------------------------------------------
  @Get(':category')
  async getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  // ---------------------------------------------------------
  // GET /settings/:category/:key — Single setting value
  // ---------------------------------------------------------
  @Get(':category/:key')
  async getOne(@Param('category') category: string, @Param('key') key: string) {
    const setting = await this.settingsService.getOne(category, key);
    if (!setting) {
      return { error: `Setting not found: ${category}.${key}` };
    }
    return setting;
  }

  // ---------------------------------------------------------
  // PUT /settings/:category/:key — Update a single setting
  // Body: { value: ..., updatedBy?: string }
  // ---------------------------------------------------------
  @Put(':category/:key')
  async updateOne(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body('value') value: any,
    @Body('updatedBy') updatedBy?: string,
  ) {
    return this.settingsService.updateSetting(category, key, value, updatedBy);
  }

  // ---------------------------------------------------------
  // PATCH /settings/bulk — Update multiple settings at once
  // Body: { updates: [{ category, key, value }], updatedBy?: string }
  // ---------------------------------------------------------
  @Patch('bulk')
  async bulkUpdate(
    @Body('updates') updates: { category: string; key: string; value: any }[],
    @Body('updatedBy') updatedBy?: string,
  ) {
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return { error: 'No updates provided' };
    }
    const results = await this.settingsService.bulkUpdate(updates, updatedBy);
    return { success: true, updated: results.length, results };
  }
}
