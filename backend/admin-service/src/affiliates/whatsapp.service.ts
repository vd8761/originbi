import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import * as QRCode from 'qrcode';
import { R2Service } from '../r2/r2.service';

type AffiliateAudience = 'college' | 'school' | 'employee';

/**
 * Default registration URLs per audience (mirrors frontend config).
 * Env vars can override these at runtime if set.
 */
const REGISTER_URLS: Record<AffiliateAudience, string> = {
  school:
    process.env.AFFILIATE_SCHOOL_REGISTER_URL ||
    'https://pickmycareer.originbi.com/register',
  college:
    process.env.AFFILIATE_COLLEGE_REGISTER_URL ||
    'https://discover.originbi.com/register',
  employee:
    process.env.AFFILIATE_EMPLOYEE_REGISTER_URL ||
    'https://grow.originbi.com/register',
};

/**
 * MSG91 WhatsApp template names per audience.
 */
const TEMPLATE_NAMES: Record<AffiliateAudience, string> = {
  college: 'college_platform',
  school: 'school_platform',
  employee: 'employee_platform',
};

/**
 * Poster image filenames stored in src/mail/assets/.
 * The other developer will replace school/employee images later.
 */
const POSTER_FILENAMES: Record<AffiliateAudience, string> = {
  college: 'college-poster-without-qr.jpeg',
  school: 'school-poster-without-qr.jpeg',
  employee: 'employee-poster-without-qr.jpeg',
};

/**
 * QR code position on the 1080×1920 poster (matches frontend overlay logic).
 */
const QR_POSITION = {
  x: 440,
  y: 1560,
  size: 220,
  padding: 10,
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  /** MSG91 WhatsApp Outbound API endpoint */
  private readonly msg91Url =
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

  /** Integrated WhatsApp number registered with MSG91 */
  private readonly integratedNumber = '919445997283';

  /** MSG91 template namespace */
  private readonly templateNamespace = '371d8e5e_4dfb_4ead_b9c7_55bc570d1027';

  constructor(
    private readonly http: HttpService,
    private readonly r2Service: R2Service,
  ) {}

  // =================================================================
  // Public entry point — called by AffiliatesService after registration
  // =================================================================

  /**
   * Send all 3 WhatsApp welcome posters (college, school, employee)
   * to the newly registered affiliate.
   *
   * Runs fire-and-forget; errors are logged but never thrown.
   */
  async sendAllWelcomePosters(
    mobileNumber: string,
    countryCode: string,
    referralCode: string,
  ): Promise<void> {
    const authKey = process.env.MSG91_WHATSAPP_AUTH_KEY;
    if (!authKey) {
      this.logger.warn(
        'MSG91_WHATSAPP_AUTH_KEY not configured. Skipping WhatsApp welcome posters.',
      );
      return;
    }

    const phoneNumber = this.formatPhoneNumber(mobileNumber, countryCode);

    const audiences: AffiliateAudience[] = ['college', 'school', 'employee'];

    for (const audience of audiences) {
      try {
        const referralLink = `${REGISTER_URLS[audience]}?ref=${encodeURIComponent(referralCode)}`;

        // 1. Generate poster with QR code overlay
        const posterBuffer = await this.generatePosterWithQR(
          audience,
          referralCode,
        );

        // 2. Upload to R2 and get a public URL
        const imageUrl = await this.uploadPosterToR2(
          audience,
          referralCode,
          posterBuffer,
        );

        // 3. Send the WhatsApp message via MSG91
        await this.sendWhatsAppMessage(
          phoneNumber,
          TEMPLATE_NAMES[audience],
          imageUrl,
          referralCode,
          referralLink,
          authKey,
        );

        this.logger.log(
          `✅ WhatsApp ${audience} poster sent to ${phoneNumber} (ref: ${referralCode})`,
        );
      } catch (err: any) {
        this.logger.error(
          `❌ Failed to send ${audience} WhatsApp poster to ${phoneNumber}: ${err.message}. Triggering SMS fallback...`,
        );
        
        try {
          await this.sendSmsFallback(audience, phoneNumber, referralCode);
        } catch (smsErr: any) {
          this.logger.error(
            `❌ SMS fallback failed for ${audience} to ${phoneNumber}: ${smsErr.message}`,
          );
        }
      }
    }
  }

  // =================================================================
  // Fallback: Send SMS if WhatsApp fails
  // =================================================================

  private async sendSmsFallback(
    audience: AffiliateAudience,
    phoneNumber: string,
    referralCode: string,
  ): Promise<void> {
    const authKey = process.env.SMS_AUTH_KEY;
    if (!authKey) {
      this.logger.warn(`SMS_AUTH_KEY not configured. Skipping SMS fallback for ${audience}.`);
      return;
    }

    let url = '';

    if (audience === 'school') {
      url = `http://smpp.webtechsolution.co/http-tokenkeyapi.php?authentic-key=${authKey}&senderid=ORGNBI&route=1&number=${phoneNumber}&message=Confused%20about%20your%20subject%20choice%3F%20Get%20clarity%20on%20streams%2C%20strengths%20%26%20future%20career%20path.%20Start%20now%20for%20INR%20749%3A%20https%3A%2F%2Fpickmycareer.originbi.com%2Fregister%3Fref%3D${referralCode}&templateid=1707177631775371277`;
    } else if (audience === 'college') {
      url = `http://smpp.webtechsolution.co/http-tokenkeyapi.php?authentic-key=${authKey}&senderid=ORGNBI&route=1&number=${phoneNumber}&message=Finished%20college%20but%20unsure%20what%20next%3F%20Discover%20the%20right%20career%20path%20for%20you.%20Start%20now%20for%20INR%20499%3A%20https%3A%2F%2Fdiscover.originbi.com%2Fregister%3Fref%3D${referralCode}&templateid=1707177631813422154`;
    } else if (audience === 'employee') {
      url = `http://smpp.webtechsolution.co/http-tokenkeyapi.php?authentic-key=${authKey}&senderid=ORGNBI&route=1&number=${phoneNumber}&message=Ready%20for%20your%20next%20career%20move%3F%20Get%20leadership%20insights%2C%20growth%20areas%20%26%20role%20clarity.%20Unlock%20for%20INR%20499%3A%20https%3A%2F%2Fgrow.originbi.com%2Fregister%3Fref%3D${referralCode}&templateid=1707177631823308700`;
    }

    try {
      const response = await firstValueFrom(
        this.http.get(url, { timeout: 15000 }),
      );
      this.logger.log(
        `✅ SMS fallback sent successfully for ${audience}: ${
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        }`,
      );
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  // =================================================================
  // Step 1: Generate the poster image with QR code overlay
  // =================================================================

  private async generatePosterWithQR(
    audience: AffiliateAudience,
    referralCode: string,
  ): Promise<Buffer> {
    // Build the referral link for this audience
    const referralLink = `${REGISTER_URLS[audience]}?ref=${encodeURIComponent(referralCode)}`;

    // Read the base poster image
    const posterPath = path.join(
      process.cwd(),
      'src/mail/assets',
      POSTER_FILENAMES[audience],
    );

    if (!fs.existsSync(posterPath)) {
      throw new Error(`Poster image not found: ${posterPath}`);
    }

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(referralLink, {
      width: 400,
      margin: 1,
      color: { dark: '#150089', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });

    // Resize QR code to the target size
    const qrResized = await sharp(qrBuffer)
      .resize(QR_POSITION.size, QR_POSITION.size)
      .png()
      .toBuffer();

    // Create white background rectangle for QR padding
    const padSize = QR_POSITION.size + QR_POSITION.padding * 2;
    const whiteBg = await sharp({
      create: {
        width: padSize,
        height: padSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Composite: white background with QR code centered on it
    const qrWithPadding = await sharp(whiteBg)
      .composite([
        {
          input: qrResized,
          left: QR_POSITION.padding,
          top: QR_POSITION.padding,
        },
      ])
      .png()
      .toBuffer();

    // Composite QR (with padding) onto the poster
    const finalPoster = await sharp(posterPath)
      .composite([
        {
          input: qrWithPadding,
          left: QR_POSITION.x - QR_POSITION.padding,
          top: QR_POSITION.y - QR_POSITION.padding,
        },
      ])
      .png()
      .toBuffer();

    return finalPoster;
  }

  // =================================================================
  // Step 2: Upload the generated poster to R2
  // =================================================================

  private async uploadPosterToR2(
    audience: AffiliateAudience,
    referralCode: string,
    buffer: Buffer,
  ): Promise<string> {
    const key = `affiliate-posters/${referralCode}/${audience}.png`;
    return this.r2Service.uploadPosterBuffer(key, buffer, 'image/png');
  }

  // =================================================================
  // Step 3: Send a single WhatsApp message via MSG91
  // =================================================================

  private async sendWhatsAppMessage(
    phoneNumber: string,
    templateName: string,
    imageUrl: string,
    referralCode: string,
    referralLink: string,
    authKey: string,
  ): Promise<void> {
    const payload = {
      integrated_number: this.integratedNumber,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en',
            policy: 'deterministic',
          },
          namespace: this.templateNamespace,
          to_and_components: [
            {
              to: [phoneNumber],
              components: {
                header_1: {
                  type: 'image',
                  value: imageUrl,
                },
                body_1: {
                  type: 'text',
                  value: referralCode,
                },
                button_1: {
                  subtype: 'url',
                  type: 'text',
                  value: referralLink,
                },
              },
            },
          ],
        },
      },
    };

    try {
      const response = await firstValueFrom(
        this.http.post(this.msg91Url, payload, {
          headers: {
            'Content-Type': 'application/json',
            authkey: authKey,
          },
          timeout: 30000,
        }),
      );

      // Check for structural failure response from MSG91
      if (
        response.data?.status === 'fail' ||
        response.data?.hasError === true
      ) {
        throw new Error(
          `MSG91 returned fail status: ${JSON.stringify(response.data)}`,
        );
      }

      this.logger.log(
        `MSG91 response for ${templateName}: ${JSON.stringify(response.data)}`,
      );
    } catch (err: any) {
      const errData = err.response?.data || err.message;
      this.logger.error(
        `MSG91 API error for ${templateName}: ${JSON.stringify(errData)}`,
      );
      throw new Error(
        `MSG91 send failed for ${templateName}: ${JSON.stringify(errData)}`,
      );
    }
  }

  // =================================================================
  // Helpers
  // =================================================================

  /**
   * Format phone number for MSG91.
   * MSG91 expects digits only, no `+` prefix.
   * e.g. countryCode="+91", mobileNumber="9876543210" → "919876543210"
   */
  private formatPhoneNumber(mobileNumber: string, countryCode: string): string {
    const cleanCountryCode = (countryCode || '+91').replace(/\+/g, '').trim();
    const cleanMobile = (mobileNumber || '').replace(/\D/g, '').trim();
    return `${cleanCountryCode}${cleanMobile}`;
  }
}
