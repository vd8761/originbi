import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { WhatsappTemplatesService } from '../whatsapp/whatsapp-templates.service';

interface ExpiryRow {
  user_id: string;
  full_name: string | null;
  mobile_number: string | null;
  country_code: string | null;
}

/**
 * Sends a WhatsApp expiry reminder exactly 3 days before an assessment's
 * `valid_to`. Runs daily at 09:00 IST. Only one reminder per user.
 */
@Injectable()
export class ExpiryReminderService {
  private readonly logger = new Logger(ExpiryReminderService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
    private readonly whatsappTemplates: WhatsappTemplatesService,
  ) {}

  @Cron('0 0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async sendExpiryReminders(): Promise<void> {
    this.logger.log('[ExpiryReminder] Cron fired');

    const enabled = await this.settingsService.getValue<boolean>(
      'whatsapp',
      'send_expiry_reminder',
    );
    if (enabled === false) {
      this.logger.log(
        '[ExpiryReminder] Disabled via whatsapp.send_expiry_reminder. Skipping.',
      );
      return;
    }

    const [imageUrl, portalUrl] = await Promise.all([
      this.settingsService.getValue<string>(
        'whatsapp',
        'student_template_image_url',
      ),
      this.settingsService.getValue<string>('whatsapp', 'student_portal_url'),
    ]);

    const rows = await this.findExpiringRegistrations();
    this.logger.log(
      `[ExpiryReminder] ${rows.length} student(s) with assessments expiring in 3 days`,
    );

    for (const row of rows) {
      const phone = WhatsappTemplatesService.formatPhoneNumber(
        row.mobile_number,
        row.country_code,
      );
      try {
        await this.whatsappTemplates.send({
          templateName: 'originbi_assessment_expiry_reminder',
          phoneNumber: phone,
          components: {
            header_1: { type: 'image', value: imageUrl ?? '' },
            body_1: { type: 'text', value: row.full_name ?? '' },
            body_2: {
              type: 'text',
              value: portalUrl ?? 'https://mind.originbi.com/student',
            },
          },
        });
        this.logger.log(
          `[ExpiryReminder] sent to ${phone} (user ${row.user_id}, 3d left)`,
        );
      } catch (err: any) {
        this.logger.error(
          `[ExpiryReminder] failed for ${phone} (user ${row.user_id}): ${err.message}`,
        );
      }
    }
  }

  /**
   * Find users whose active assessment session expires exactly 3 days from
   * today (IST). De-duplicates so a user with multiple attempts gets only
   * one reminder.
   */
  private async findExpiringRegistrations(): Promise<ExpiryRow[]> {
    const sql = `
      SELECT DISTINCT ON (s.user_id)
        s.user_id::text AS user_id,
        r.full_name,
        r.mobile_number,
        r.country_code
      FROM assessment_sessions s
      JOIN registrations r ON r.id = s.registration_id
      WHERE s.status NOT IN ('COMPLETED', 'EXPIRED', 'PARTIALLY_EXPIRED')
        AND r.registration_source IN ('SELF', 'AFFILIATE')
        AND s.valid_to IS NOT NULL
        AND r.mobile_number IS NOT NULL
        AND r.mobile_number <> ''
        AND (s.valid_to::date - (NOW() AT TIME ZONE 'Asia/Kolkata')::date) = 3
      ORDER BY s.user_id, s.valid_to ASC
    `;
    return this.dataSource.query(sql) as Promise<ExpiryRow[]>;
  }
}
