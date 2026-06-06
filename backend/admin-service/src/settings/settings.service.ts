import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
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
    private readonly http: HttpService,
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

  async getGeminiModels(): Promise<{
    models: Array<{ value: string; label: string; description?: string }>;
    error?: string;
  }> {
    const apiKey =
      String((await this.getValue<string>('metaphor', 'gemini_api_key')) || '').trim() ||
      process.env.GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return {
        models: [],
        error: 'Gemini API key is not configured.',
      };
    }

    try {
      const res = await firstValueFrom(
        this.http.get('https://generativelanguage.googleapis.com/v1beta/models', {
          params: { key: apiKey },
          timeout: 30000,
        }),
      );
      const models = ((res as any).data?.models || [])
        .filter((model: any) =>
          Array.isArray(model.supportedGenerationMethods) &&
          model.supportedGenerationMethods.includes('generateContent'),
        )
        .map((model: any) => {
          const name = String(model.name || '').replace(/^models\//, '');
          const displayName = String(model.displayName || name);
          return {
            value: name,
            label: displayName === name ? name : `${displayName} (${name})`,
            description: model.description || undefined,
          };
        })
        .filter((model: any) => this.isMetaphorGeminiModel(model.value))
        .sort((a: any, b: any) => a.value.localeCompare(b.value));

      return { models };
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to fetch Gemini models.';
      this.logger.warn(`Failed to fetch Gemini models: ${msg}`);
      return { models: [], error: msg };
    }
  }

  async getClaudeModels(): Promise<{
    models: Array<{ value: string; label: string; description?: string }>;
    error?: string;
  }> {
    const apiKey =
      String((await this.getValue<string>('metaphor', 'claude_api_key')) || '').trim() ||
      process.env.ANTHROPIC_API_KEY ||
      '';

    if (!apiKey) {
      return {
        models: [],
        error: 'Claude API key is not configured.',
      };
    }

    try {
      const res = await firstValueFrom(
        this.http.get('https://api.anthropic.com/v1/models', {
          timeout: 30000,
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        }),
      );
      const rows = Array.isArray((res as any).data?.data)
        ? (res as any).data.data
        : Array.isArray((res as any).data?.models)
          ? (res as any).data.models
          : [];
      const models = rows
        .map((model: any) => {
          const id = String(model.id || model.name || '').trim();
          const displayName = String(model.display_name || model.displayName || id).trim();
          return {
            value: id,
            label: displayName && displayName !== id ? `${displayName} (${id})` : id,
            description: model.created_at ? `Created ${model.created_at}` : undefined,
          };
        })
        .filter((model: any) => model.value.startsWith('claude-'))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));

      return { models };
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to fetch Claude models.';
      this.logger.warn(`Failed to fetch Claude models: ${msg}`);
      return { models: [], error: msg };
    }
  }

  private isMetaphorGeminiModel(modelName: string): boolean {
    const name = String(modelName || '').toLowerCase();
    if (!name.startsWith('gemini-')) return false;
    return ![
      'image',
      'imagen',
      'embedding',
      'tts',
      'veo',
      'aqa',
      'learnlm',
    ].some((blocked) => name.includes(blocked));
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
  async getEmailConfig(overrideKey: string): Promise<{
    fromName: string;
    fromAddress: string;
    ccAddresses: string[];
    bccAddresses: string[];
    replyToAddress: string;
  }> {
    const globalFromName =
      (await this.getValue<string>('email', 'from_name')) || 'Origin BI';
    const globalFromAddress =
      (await this.getValue<string>('email', 'from_address')) ||
      'no-reply@originbi.com';
    const globalCcAddresses =
      (await this.getValue<string[]>('email', 'cc_addresses')) || [];
    const globalBccAddresses =
      (await this.getValue<string[]>('email', 'bcc_addresses')) || [];
    const globalReplyTo =
      (await this.getValue<string>('email', 'reply_to_address')) || '';

    const localConfig = await this.getValue<{
      mode?: string;
      from_name?: string;
      from_address?: string;
      cc_addresses?: string[];
      bcc_addresses?: string[];
      reply_to_address?: string;
    }>('email', overrideKey);

    if (localConfig && localConfig.mode === 'local') {
      return {
        fromName: localConfig.from_name || globalFromName,
        fromAddress: localConfig.from_address || globalFromAddress,
        ccAddresses: Array.isArray(localConfig.cc_addresses)
          ? localConfig.cc_addresses
          : [],
        bccAddresses: Array.isArray(localConfig.bcc_addresses)
          ? localConfig.bcc_addresses
          : [],
        replyToAddress: localConfig.reply_to_address ?? '',
      };
    }

    return {
      fromName: globalFromName,
      fromAddress: globalFromAddress,
      ccAddresses: globalCcAddresses,
      bccAddresses: globalBccAddresses,
      replyToAddress: globalReplyTo,
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
      value: row.value,
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
