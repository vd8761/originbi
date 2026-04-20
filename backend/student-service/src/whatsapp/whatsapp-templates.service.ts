import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface WhatsappComponent {
  type: string;
  subtype?: string;
  value: string;
}

export interface SendTemplateParams {
  templateName: string;
  phoneNumber: string;
  components: Record<string, WhatsappComponent>;
}

interface Msg91Response {
  status?: string;
  hasError?: boolean;
}

/**
 * Generic MSG91 WhatsApp template dispatcher — student-service copy.
 * Mirrors admin-service/WhatsappTemplatesService; duplicated so student-service
 * can send without cross-service HTTP hops.
 */
@Injectable()
export class WhatsappTemplatesService {
  private readonly logger = new Logger(WhatsappTemplatesService.name);

  private readonly msg91Url =
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';
  private readonly integratedNumber = '919445997283';
  private readonly templateNamespace = '371d8e5e_4dfb_4ead_b9c7_55bc570d1027';

  constructor(private readonly http: HttpService) {}

  async send(params: SendTemplateParams): Promise<void> {
    const authKey = process.env.MSG91_WHATSAPP_AUTH_KEY;
    if (!authKey) {
      this.logger.warn(
        `MSG91_WHATSAPP_AUTH_KEY not configured. Skipping WhatsApp send: ${params.templateName}`,
      );
      return;
    }

    const payload = {
      integrated_number: this.integratedNumber,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: 'en', policy: 'deterministic' },
          namespace: this.templateNamespace,
          to_and_components: [
            {
              to: [params.phoneNumber],
              components: params.components,
            },
          ],
        },
      },
    };

    try {
      const response = await firstValueFrom(
        this.http.post<Msg91Response>(this.msg91Url, payload, {
          headers: {
            'Content-Type': 'application/json',
            authkey: authKey,
          },
          timeout: 30000,
        }),
      );

      if (
        response.data?.status === 'fail' ||
        response.data?.hasError === true
      ) {
        throw new Error(
          `MSG91 returned fail status: ${JSON.stringify(response.data)}`,
        );
      }

      this.logger.log(
        `MSG91 ${params.templateName} → ${params.phoneNumber}: ${JSON.stringify(response.data)}`,
      );
    } catch (err: unknown) {
      const errData = isAxiosError<unknown>(err)
        ? (err.response?.data ?? err.message)
        : err instanceof Error
          ? err.message
          : 'Unknown error';
      this.logger.error(
        `MSG91 API error for ${params.templateName}: ${JSON.stringify(errData)}`,
      );
      throw new Error(
        `MSG91 send failed for ${params.templateName}: ${JSON.stringify(errData)}`,
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
