import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OriginbiSetting } from '@originbi/shared-entities';

/**
 * Service for reading and updating admin-configurable settings.
 * Settings are stored in the `originbi_settings` table, grouped by category.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(OriginbiSetting)
    private readonly settingsRepo: Repository<OriginbiSetting>,
  ) {}

  // ---------------------------------------------------------
  // READ: All settings (grouped by category)
  // ---------------------------------------------------------
  async getAllGrouped(): Promise<Record<string, any[]>> {
    const rows = await this.settingsRepo.find({
      order: { category: 'ASC', displayOrder: 'ASC' },
    });

    const grouped: Record<string, any[]> = {};
    for (const row of rows) {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      grouped[row.category].push(this.toDto(row));
    }

    return grouped;
  }

  // ---------------------------------------------------------
  // READ: Settings by category
  // ---------------------------------------------------------
  async getByCategory(category: string): Promise<any[]> {
    const rows = await this.settingsRepo.find({
      where: { category },
      order: { displayOrder: 'ASC' },
    });
    return rows.map((r) => this.toDto(r));
  }

  // ---------------------------------------------------------
  // READ: Single setting by category + key
  // ---------------------------------------------------------
  async getOne(category: string, key: string): Promise<any> {
    const row = await this.settingsRepo.findOne({
      where: { category, settingKey: key },
    });
    return row ? this.toDto(row) : null;
  }

  // ---------------------------------------------------------
  // READ: Quick typed value getter (for backend consumption)
  // ---------------------------------------------------------
  async getValue<T = any>(category: string, key: string): Promise<T | null> {
    const row = await this.settingsRepo.findOne({
      where: { category, settingKey: key },
    });
    return row ? (row.value as T) : null;
  }

  // ---------------------------------------------------------
  // UPDATE: Single setting value
  // ---------------------------------------------------------
  async updateSetting(
    category: string,
    key: string,
    value: any,
    updatedBy?: string,
  ): Promise<any> {
    const row = await this.settingsRepo.findOne({
      where: { category, settingKey: key },
    });

    if (!row) {
      throw new BadRequestException(`Setting not found: ${category}.${key}`);
    }

    if (row.isReadonly) {
      throw new BadRequestException(
        `Setting '${row.label}' is read-only and cannot be modified from the UI.`,
      );
    }

    // Type-validated write
    switch (row.valueType) {
      case 'string':
        if (typeof value !== 'string') {
          throw new BadRequestException(
            `Expected string for '${row.label}', got ${typeof value}`,
          );
        }
        row.valueString = value;
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(
            `Expected boolean for '${row.label}', got ${typeof value}`,
          );
        }
        row.valueBoolean = value;
        break;

      case 'json':
        // Accept arrays and objects
        if (typeof value !== 'object') {
          throw new BadRequestException(
            `Expected object/array for '${row.label}', got ${typeof value}`,
          );
        }
        row.valueJson = value;
        break;

      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new BadRequestException(
            `Expected number for '${row.label}', got ${typeof value}`,
          );
        }
        row.valueNumber = value;
        break;

      default:
        throw new BadRequestException(
          `Unknown value_type '${String(row.valueType)}' for setting '${key}'`,
        );
    }

    row.updatedBy = updatedBy || null;

    const saved = await this.settingsRepo.save(row);
    this.logger.log(
      `Setting updated: ${category}.${key} by ${updatedBy || 'system'}`,
    );
    return this.toDto(saved);
  }

  // ---------------------------------------------------------
  // Helper: Merge Global & Local Email Config
  // ---------------------------------------------------------
  async getEmailConfig(
    overrideKey: string,
  ): Promise<{ fromName: string; fromAddress: string; ccAddresses: string[] }> {
    const globalFromName =
      (await this.getValue<string>('email', 'from_name')) || 'Origin BI';
    const globalFromAddress =
      (await this.getValue<string>('email', 'from_address')) ||
      'no-reply@originbi.com';
    const globalCcAddresses =
      (await this.getValue<string[]>('email', 'cc_addresses')) || [];

    const localConfig = await this.getValue<{ mode?: string; from_name?: string; from_address?: string; cc_addresses?: string[] }>('email', overrideKey);

    if (localConfig && localConfig.mode === 'local') {
      return {
        fromName: localConfig.from_name || globalFromName,
        fromAddress: localConfig.from_address || globalFromAddress,
        ccAddresses: Array.isArray(localConfig.cc_addresses)
          ? localConfig.cc_addresses
          : [],
      };
    }

    return {
      fromName: globalFromName,
      fromAddress: globalFromAddress,
      ccAddresses: globalCcAddresses,
    };
  }

  // ---------------------------------------------------------
  // BULK UPDATE: Multiple settings at once
  // ---------------------------------------------------------
  async bulkUpdate(
    updates: { category: string; key: string; value: any }[],
    updatedBy?: string,
  ): Promise<any[]> {
    const results: any[] = [];
    for (const update of updates) {
      const result = await this.updateSetting(
        update.category,
        update.key,
        update.value,
        updatedBy,
      );
      results.push(result);
    }
    return results;
  }

  // ---------------------------------------------------------
  // Private: Map entity to API response DTO
  // ---------------------------------------------------------
  private toDto(row: OriginbiSetting) {
    return {
      id: row.id,
      category: row.category,
      key: row.settingKey,
      valueType: row.valueType,
      value: row.isSensitive ? '••••••••' : row.value,
      label: row.label,
      description: row.description,
      isSensitive: row.isSensitive,
      isReadonly: row.isReadonly,
      displayOrder: row.displayOrder,
      updatedBy: row.updatedBy,
      updatedAt: row.updatedAt,
    };
  }
}
