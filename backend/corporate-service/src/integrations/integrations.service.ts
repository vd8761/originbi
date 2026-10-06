import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantAppConfig, CorporateAccount } from '@originbi/shared-entities';
import { CorporateIntegration } from '../entities/corporate-integration.entity';
import { google } from 'googleapis';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(TenantAppConfig)
    private readonly tenantAppConfigRepo: Repository<TenantAppConfig>,
    @InjectRepository(CorporateAccount)
    private readonly corporateAccountRepo: Repository<CorporateAccount>,
    @InjectRepository(CorporateIntegration)
    private readonly corporateIntegrationRepo: Repository<CorporateIntegration>,
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
      'https://www.googleapis.com/auth/drive.readonly', // read access to list and read files
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
  //  Step 2: Handle Google OAuth Callback (Legacy without Passport)
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
  //  Step 2: Handle Google OAuth Callback (With Passport)
  // ─────────────────────────────────────────────────────────
  async handleGoogleCallbackPassport(
    user: any,
    state: string,
  ): Promise<{ email: string; connectedAccount: string }> {
    if (!user || !state)
      throw new BadRequestException('Missing user profile or state');

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

    const googleEmail = user.email;
    const googleName = `${user.firstName} ${user.lastName}`.trim();
    const googlePicture = user.picture;

    // Find the corporate account
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email: tenantEmail } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    // Update or create CorporateIntegration record
    let integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'google_drive' },
    });

    if (!integration) {
      integration = this.corporateIntegrationRepo.create({
        corporateAccount: account,
        provider: 'google_drive',
      });
    }

    integration.access_token = user.accessToken;
    integration.refresh_token = user.refreshToken || integration.refresh_token; // keep old refresh token if not provided
    integration.metadata = {
      connectedAccount: googleEmail,
      connectedName: googleName,
      connectedPicture: googlePicture,
      connectedAt: new Date().toISOString(),
    };
    integration.status = 'active';

    await this.corporateIntegrationRepo.save(integration);

    // Also update TenantAppConfig to keep backward compatibility with frontend
    const config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });
    if (config) {
      config.configured_features = {
        ...(config.configured_features || {}),
        connectedAccount: googleEmail,
        connectedName: googleName,
        connectedPicture: googlePicture,
        connectedAt: new Date().toISOString(),
      };
      config.status = 'connected';
      await this.tenantAppConfigRepo.save(config);
    }

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
  //  List Google Drive Files
  // ─────────────────────────────────────────────────────────
  async listGoogleDriveFiles(email: string, search?: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    // Tokens are saved by Passport callback in corporate_integrations table
    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporate_account_id: account.id as any, provider: 'google_drive' },
    });

    if (!integration || !integration.access_token) {
      throw new BadRequestException('Google Drive is not connected or token is missing');
    }

    const oauth2Client = this.getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    try {
      let q: string;
      if (search === 'folders_only') {
        // Return only top-level (root-parented), non-hidden Google Drive folders
        q = "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false";
      } else {
        q = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
        if (search && search.trim() !== '') {
          const safeSearch = search.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          q += ` and name contains '${safeSearch}'`;
        }
      }

      const response = await drive.files.list({
        q,
        pageSize: 100,
        orderBy: 'name',
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
      });

      let files = response.data.files || [];
      // Remove hidden/system folders (those starting with '.')
      if (search === 'folders_only') {
        files = files.filter(f => f.name && !f.name.startsWith('.'));
      }

      return {
        success: true,
        files,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to fetch files: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Save Selected Sync Folder
  // ─────────────────────────────────────────────────────────
  async saveSyncFolder(email: string, folderId: string, folderName: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporate_account_id: account.id as any, provider: 'google_drive' },
    });
    if (!integration) throw new NotFoundException('Google Drive integration not found');

    // Save the selected folder ID to metadata — only files inside this folder will be indexed
    integration.metadata = {
      ...(integration.metadata || {}),
      syncFolderId: folderId,
      syncFolderName: folderName,
      syncedAt: new Date().toISOString(),
    };
    await this.corporateIntegrationRepo.save(integration);

    return { success: true, folderId, folderName };
  }

  // ─────────────────────────────────────────────────────────
  //  Get Google Drive File Content
  // ─────────────────────────────────────────────────────────
  async getGoogleDriveFileContent(email: string, fileId: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporate_account_id: account.id as any, provider: 'google_drive' },
    });
    if (!integration || !integration.access_token) {
      throw new BadRequestException('Google Drive is not connected');
    }

    const oauth2Client = this.getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    try {
      const fileMeta = await drive.files.get({
        fileId,
        fields: 'mimeType, name',
      });
      const mimeType = fileMeta.data.mimeType;

      let content = '';

      if (mimeType?.includes('application/vnd.google-apps.document')) {
        const response = await drive.files.export(
          { fileId, mimeType: 'text/plain' },
          { responseType: 'text' },
        );
        content = response.data as any;
      } else if (
        mimeType?.includes('application/vnd.google-apps.spreadsheet')
      ) {
        const response = await drive.files.export(
          { fileId, mimeType: 'text/csv' },
          { responseType: 'text' },
        );
        content = response.data as any;
      } else if (
        mimeType?.includes('application/vnd.google-apps.presentation')
      ) {
        const response = await drive.files.export(
          { fileId, mimeType: 'text/plain' },
          { responseType: 'text' },
        );
        content = response.data as any;
      } else {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'text' },
        );
        content = response.data as any;
      }

      // Truncate if too large to prevent blowing up the LLM context
      if (typeof content === 'string' && content.length > 50000) {
        content = content.substring(0, 50000) + '\n\n...[Content Truncated]...';
      }

      return { success: true, content };
    } catch (error: any) {
      console.error(`[getGoogleDriveFileContent] Failed: ${error.message}`);
      return {
        success: false,
        error:
          'Failed to extract text from this file format or file is too large.',
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Get Combined Folder Context for Knowledge Base
  // ─────────────────────────────────────────────────────────
  async getFolderContext(email: string): Promise<{ success: boolean; content: string }> {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporate_account_id: account.id as any, provider: 'google_drive' },
    });
    
    if (!integration || !integration.access_token) {
      return { success: false, content: '' };
    }

    const folderId = integration.metadata?.syncFolderId;
    if (!folderId) {
      return { success: false, content: '' };
    }

    const oauth2Client = this.getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    try {
      // Find up to 5 text/doc files inside the synced folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        pageSize: 5,
        fields: 'files(id, name, mimeType)',
      });

      const files = response.data.files || [];
      if (files.length === 0) {
        return { success: true, content: 'Knowledge Base folder is empty.' };
      }

      const filePromises = files.map(async (file) => {
        try {
          let text = '';
          const mimeType = file.mimeType;
          if (mimeType?.includes('application/vnd.google-apps.document') || mimeType?.includes('application/vnd.google-apps.presentation')) {
            const r = await drive.files.export({ fileId: file.id as string, mimeType: 'text/plain' }, { responseType: 'text' });
            text = r.data as any;
          } else if (mimeType?.includes('application/vnd.google-apps.spreadsheet')) {
            const r = await drive.files.export({ fileId: file.id as string, mimeType: 'text/csv' }, { responseType: 'text' });
            text = r.data as any;
          } else {
            const r = await drive.files.get({ fileId: file.id as string, alt: 'media' }, { responseType: 'text' });
            text = r.data as any;
          }
          if (typeof text === 'string' && text.length > 20000) {
            text = text.substring(0, 20000) + '...';
          }
          return `\n\n--- KnowledgeBase Document: ${file.name} ---\n${text}`;
        } catch (e) {
          return '';
        }
      });

      const contents = await Promise.all(filePromises);
      return { success: true, content: contents.join('') };
    } catch (e) {
      return { success: false, content: '' };
    }
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
