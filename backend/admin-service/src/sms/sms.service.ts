import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../settings/settings.service';

export type SmsTemplate =
  | 'assessment_instructions'
  | 'expiry_reminder'
  | 'completion_notification'
  | 'report_sent_notification';

/**
 * SMS dispatcher for student-facing notifications (SMPP HTTP gateway).
 *
 * Message bodies are HARDCODED here by design — only the DLT template IDs,
 * sender ID, and auth key live in `originbi_settings` (category `sms`).
 *
 * Each template has an independent toggle (`sms.send_*`). Callers can ask
 * this service to send unconditionally via `send()`, or guard on the toggle
 * with `isEnabled()` first — the typical fallback flow does the latter.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly gatewayUrl =
    'http://smpp.webtechsolution.co/http-tokenkeyapi.php';

  private readonly toggleKey: Record<SmsTemplate, string> = {
    assessment_instructions: 'send_assessment_instructions',
    expiry_reminder: 'send_expiry_reminder',
    completion_notification: 'send_completion_notification',
    report_sent_notification: 'send_report_sent_notification',
  };

  private readonly templateIdKey: Record<SmsTemplate, string> = {
    assessment_instructions: 'template_id_instructions',
    expiry_reminder: 'template_id_expiry',
    completion_notification: 'template_id_completion',
    report_sent_notification: 'template_id_report_sent',
  };

  constructor(
    private readonly http: HttpService,
    private readonly settings: SettingsService,
  ) {}

  async isEnabled(template: SmsTemplate): Promise<boolean> {
    const v = await this.settings.getValue<boolean>(
      'sms',
      this.toggleKey[template],
    );
    return v !== false;
  }

  async send(
    template: SmsTemplate,
    phoneNumber: string,
    name: string,
  ): Promise<void> {
    const authKey = process.env.SMS_AUTH_KEY;
    if (!authKey) {
      this.logger.warn(
        `SMS_AUTH_KEY env var not set. Skipping SMS ${template} to ${phoneNumber}.`,
      );
      return;
    }

    const [senderId, templateId] = await Promise.all([
      this.settings.getValue<string>('sms', 'sender_id'),
      this.settings.getValue<string>('sms', this.templateIdKey[template]),
    ]);

    if (!templateId) {
      this.logger.warn(
        `sms.${this.templateIdKey[template]} not configured. Skipping SMS ${template} to ${phoneNumber}.`,
      );
      return;
    }

    const message = this.buildMessage(template, name);
    const url =
      `${this.gatewayUrl}?authentic-key=${encodeURIComponent(authKey)}` +
      `&senderid=${encodeURIComponent(senderId || 'ORGNBI')}` +
      `&route=1` +
      `&number=${encodeURIComponent(phoneNumber)}` +
      `&message=${encodeURIComponent(message)}` +
      `&templateid=${encodeURIComponent(templateId)}`;

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(url, { timeout: 15000 }),
      );
      const body =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);
      this.logger.log(`SMS ${template} → ${phoneNumber}: ${body}`);
    } catch (err: unknown) {
      const errData = isAxiosError<unknown>(err)
        ? (err.response?.data ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Unknown error';
      this.logger.error(
        `SMS gateway error for ${template} → ${phoneNumber}: ${JSON.stringify(errData)}`,
      );
      throw new Error(
        `SMS send failed for ${template}: ${JSON.stringify(errData)}`,
      );
    }
  }

  private buildMessage(template: SmsTemplate, name: string): string {
    const safeName = (name || '').trim() || 'there';
    switch (template) {
      case 'assessment_instructions':
        return (
          `Origin BI: Hi ${safeName}, your assessment is ready.\n\n` +
          `Start: https://mind.originbi.com/student\n` +
          `Guide: https://mind.originbi.com/exam-instructions\n\n` +
          `Takes 60 to 90 mins. Answer naturally, no right or wrong answers. ` +
          `Complete in one sitting without distractions.`
        );
      case 'expiry_reminder':
        return (
          `Origin BI: Hi ${safeName}, your assessment is pending and will expire in 3 days.\n\n` +
          `Start now: https://mind.originbi.com/student`
        );
      case 'completion_notification':
        return (
          `Origin BI: Hi ${safeName}, your assessment is completed.\n\n` +
          `Your report is being generated. It will be sent to your email soon.\n\n` +
          `- Team Origin BI`
        );
      case 'report_sent_notification':
        return (
          `Origin BI: Hi ${safeName}, your assessment report is ready.\n\n` +
          `Check your email (Inbox/Spam) to view it.\n\n` +
          `- Team Origin BI`
        );
    }
  }

  static formatPhoneNumber(
    mobileNumber: string | null | undefined,
    countryCode: string | null | undefined,
  ): string {
    const cleanCountryCode = (countryCode || '+91').replace(/\+/g, '').trim();
    const cleanMobile = (mobileNumber || '').replace(/\D/g, '').trim();
    return `${cleanCountryCode}${cleanMobile}`;
  }
}
