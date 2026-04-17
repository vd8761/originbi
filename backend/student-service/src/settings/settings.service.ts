import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OriginbiSetting } from '@originbi/shared-entities';

/**
 * Read-only settings service for student-service.
 * Reads from the shared `originbi_settings` table managed by admin-service.
 * Only exposes the getValue() helper — no write/update operations.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(OriginbiSetting)
    private readonly settingsRepo: Repository<OriginbiSetting>,
  ) {}

  /**
   * Fetch a typed setting value by category + key.
   * Returns null if the key does not exist.
   */
  async getValue<T = any>(category: string, key: string): Promise<T | null> {
    const row = await this.settingsRepo.findOne({
      where: { category, settingKey: key },
    });
    return row ? (row.value as T) : null;
  }

  /**
   * Fetch the final email configuration by merging global settings with a specific local override.
   * @param overrideKey The key for the local override config (e.g. 'registration_email_config')
   */
  async getEmailConfig(overrideKey: string): Promise<{
    fromName: string;
    fromAddress: string;
    ccAddresses: string[];
    bccAddresses: string[];
    replyToAddress: string;
  }> {
    const globalFromName =
      (await this.getValue<string>('email', 'from_name')) ||
      'Origin BI Mind Works';
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
}
