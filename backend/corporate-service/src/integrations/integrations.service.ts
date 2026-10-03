import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantAppConfig, CorporateAccount } from '@originbi/shared-entities';
import { google } from 'googleapis';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(TenantAppConfig)
    private readonly tenantAppConfigRepo: Repository<TenantAppConfig>,
    @InjectRepository(CorporateAccount)
    private readonly corporateAccountRepo: Repository<CorporateAccount>,
  ) {}

  // ─────────────────────────────────────────────────────────
  //  Get Google OAuth2 client configured from env
  // ─────────────────────────────────────────────────────────
  private getGoogleOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.API_URL}/corporate/integrations/oauth/google/callback`,
    );
  }

  // ─────────────────────────────────────────────────────────
  //  Step 1: Generate Google OAuth URL
  // ─────────────────────────────────────────────────────────
  generateGoogleOAuthUrl(email: string, appId: string): string {
    const oauth2Client = this.getGoogleOAuthClient();

    // Encode state to identify the tenant after callback
    const state = Buffer.from(JSON.stringify({ email, appId })).toString(
      'base64url',
    );

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.file', // scoped drive access
      'https://www.googleapis.com/auth/contacts.readonly', // people API
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'select_account consent', // force account picker
    });

    return url;
  }

  // ─────────────────────────────────────────────────────────
  //  Step 2: Handle Google OAuth Callback
  // ─────────────────────────────────────────────────────────
  async handleGoogleCallback(
    code: string,
    state: string,
  ): Promise<{ email: string; connectedAccount: string }> {
    if (!code || !state)
      throw new BadRequestException('Missing OAuth code or state');

    // Decode state
    let tenantEmail: string;
    let appId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      tenantEmail = decoded.email;
      appId = decoded.appId;
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    // Exchange code for tokens
    const oauth2Client = this.getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's Google profile via People API
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const { data: person } = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos',
    });

    const googleEmail = person.emailAddresses?.[0]?.value;
    const googleName = person.names?.[0]?.displayName;
    const googlePicture = person.photos?.[0]?.url;

    if (!googleEmail)
      throw new BadRequestException('Could not retrieve Google account email');

    // Find the corporate account
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email: tenantEmail } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    // Find the integration config
    const config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });
    if (!config)
      throw new NotFoundException('Integration not assigned to tenant');

    // Securely store tokens + connected Google account
    config.configured_features = {
      ...(config.configured_features || {}),
      connectedAccount: googleEmail,
      connectedName: googleName,
      connectedPicture: googlePicture,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date,
      connectedAt: new Date().toISOString(),
    };
    config.status = 'connected';

    await this.tenantAppConfigRepo.save(config);

    return { email: tenantEmail, connectedAccount: googleEmail };
  }

  // ─────────────────────────────────────────────────────────
  //  Get tenant integrations (unchanged)
  // ─────────────────────────────────────────────────────────
  async getMyIntegrations(email: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });

    if (!account) throw new NotFoundException('Corporate account not found');

    const configs = await this.tenantAppConfigRepo.find({
      where: { tenant_id: account.id as any },
      relations: ['app'],
    });

    // Return only globally active apps
    return configs
      .filter((c) => c.app?.is_globally_active)
      .map((c) => ({
        id: c.app_id,
        name: c.app.name,
        display_name: c.app.display_name,
        status: c.status,
        features: c.app.features,
        configured_features: c.configured_features,
        // Surface connected account info safely (no tokens)
        connectedAccount: c.configured_features?.connectedAccount || null,
        connectedName: c.configured_features?.connectedName || null,
        connectedPicture: c.configured_features?.connectedPicture || null,
        connectedAt: c.configured_features?.connectedAt || null,
      }));
  }

  // ─────────────────────────────────────────────────────────
  //  Generic update integration (unchanged)
  // ─────────────────────────────────────────────────────────
  async updateIntegration(email: string, appId: string, payload: any) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });
    if (!config)
      throw new NotFoundException('Integration not assigned to tenant');

    config.configured_features = {
      ...(config.configured_features || {}),
      ...payload,
    };
    config.status = 'connected';

    await this.tenantAppConfigRepo.save(config);
    return { success: true, status: config.status };
  }

  // ─────────────────────────────────────────────────────────
  //  Disconnect an integration
  // ─────────────────────────────────────────────────────────
  async disconnectIntegration(email: string, appId: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });
    if (!config) throw new NotFoundException('Integration not found');

    config.status = 'disconnected';
    config.configured_features = null;
    await this.tenantAppConfigRepo.save(config);
    return { success: true };
  }
}
