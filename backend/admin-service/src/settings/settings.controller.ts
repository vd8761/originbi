import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

@Controller('settings')
@UseGuards(AdminLoginGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  // ---------------------------------------------------------
  // GET /settings - All settings grouped by category
  // ---------------------------------------------------------
  @Get()
  async getAll() {
    return this.settingsService.getAllGrouped();
  }

  @Get('metaphor/gemini-models')
  async getGeminiModels() {
    return this.settingsService.getGeminiModels();
  }

  @Get('metaphor/claude-models')
  async getClaudeModels() {
    return this.settingsService.getClaudeModels();
  }

  // ---------------------------------------------------------
  // GET /settings/export - Portable JSON snapshot of all settings
  // Query: ?includeSensitive=true to include API keys / passwords
  // NOTE: declared before ':category' so it is not captured by it.
  // ---------------------------------------------------------
  @Get('export')
  async exportSettings(@Query('includeSensitive') includeSensitive?: string) {
    return this.settingsService.exportSettings(includeSensitive === 'true');
  }

  // ---------------------------------------------------------
  // POST /settings/import - Apply a previously-exported snapshot
  // Body: the export envelope ({ settings: [...] })
  // Returns a report of what was applied vs. skipped.
  // ---------------------------------------------------------
  @Post('import')
  async importSettings(
    @Body() body: any,
    @Req() req: Request & { user?: { email?: string } },
  ) {
    const updatedBy = req?.user?.email;
    return this.settingsService.importSettings(body, updatedBy);
  }

  // ---------------------------------------------------------
  // GET /settings/:category - Settings for a specific category
  // ---------------------------------------------------------
  @Get(':category')
  async getByCategory(@Param('category') category: string) {
    return this.settingsService.getByCategory(category);
  }

  // ---------------------------------------------------------
  // GET /settings/:category/:key - Single setting value
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
  // PUT /settings/:category/:key - Update a single setting
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
  // PATCH /settings/bulk - Update multiple settings at once
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
