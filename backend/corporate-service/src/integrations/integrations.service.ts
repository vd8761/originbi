import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TenantAppConfig,
  CorporateAccount,
  MasterApp,
} from '@originbi/shared-entities';
import { CorporateIntegration } from '../entities/corporate-integration.entity';
import { google } from 'googleapis';
import * as xlsx from 'xlsx';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import * as crypto from 'crypto';
import axios from 'axios';

function getEncryptionKey(): string {
  let key =
    process.env.ENCRYPTION_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;
  if (key) {
    key = key.replace(/^"|"$/g, '').trim(); // Remove surrounding quotes just in case
  }
  if (!key || key.length !== 32) {
    console.error(
      `[FATAL] ENCRYPTION_KEY invalid. Length is ${key?.length || 0}. Expected 32.`,
    );
    throw new Error(
      'ENCRYPTION_KEY must be set and exactly 32 characters long in your .env file.',
    );
  }
  return key;
}

const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(getEncryptionKey()),
      iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    return text;
  }
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(getEncryptionKey()),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text;
  }
}

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(TenantAppConfig)
    private readonly tenantAppConfigRepo: Repository<TenantAppConfig>,
    @InjectRepository(CorporateAccount)
    private readonly corporateAccountRepo: Repository<CorporateAccount>,
    @InjectRepository(CorporateIntegration)
    private readonly corporateIntegrationRepo: Repository<CorporateIntegration>,
    @InjectRepository(MasterApp)
    private readonly masterAppRepo: Repository<MasterApp>,
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

    const googleInt = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'google_drive' },
    });

    const clickupInt = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });

    const activeMasterApps = await this.masterAppRepo.find({
      where: { is_globally_active: true },
    });

    // Return all globally active apps, checking their local tenant connection status
    return activeMasterApps.map((masterApp) => {
      const config = configs.find((c) => c.app_id === masterApp.id);
      let configuredFeatures = config?.configured_features
        ? { ...config.configured_features }
        : {};
      const appNameLower = masterApp.name?.toLowerCase() || '';
      const isGoogle =
        appNameLower.includes('google') || appNameLower.includes('drive');
      let appStatus = config?.status || 'disconnected';

      if (isGoogle && googleInt?.metadata) {
        if (googleInt.status === 'active') {
          appStatus = 'connected';
        }
        configuredFeatures = {
          ...configuredFeatures,
          connectedAccount:
            googleInt.metadata.connectedAccount ||
            configuredFeatures.connectedAccount,
          connectedName:
            googleInt.metadata.connectedName ||
            configuredFeatures.connectedName,
          connectedPicture:
            googleInt.metadata.connectedPicture ||
            configuredFeatures.connectedPicture,
          connectedAt:
            googleInt.metadata.connectedAt ||
            configuredFeatures.connectedAt,
          syncFolderId: googleInt.metadata.syncFolderId,
          syncFolderName: googleInt.metadata.syncFolderName,
          lastSyncAt: googleInt.metadata.syncedAt,
        };
      }

      const isClickUp = appNameLower.includes('clickup');
      if (isClickUp && clickupInt?.metadata) {
        if (clickupInt.status === 'active') {
          appStatus = 'connected';
        }
        configuredFeatures = {
          ...configuredFeatures,
          connectedAccount:
            clickupInt.metadata.connectedAccount ||
            clickupInt.metadata.email ||
            configuredFeatures.connectedAccount,
          connectedName:
            clickupInt.metadata.connectedName ||
            clickupInt.metadata.username ||
            configuredFeatures.connectedName,
          connectedPicture:
            clickupInt.metadata.connectedPicture ||
            configuredFeatures.connectedPicture,
          connectedAt:
            clickupInt.metadata.connectedAt ||
            configuredFeatures.connectedAt,
          teamName:
            clickupInt.metadata.defaultTeamName ||
            clickupInt.metadata.teamName ||
            configuredFeatures.teamName,
          teamId:
            clickupInt.metadata.defaultTeamId ||
            clickupInt.metadata.teamId ||
            configuredFeatures.teamId,
          syncListId:
            clickupInt.metadata.syncListId || configuredFeatures.syncListId,
          syncListName:
            clickupInt.metadata.syncListName || configuredFeatures.syncListName,
          syncSpaceName:
            clickupInt.metadata.syncSpaceName || configuredFeatures.syncSpaceName,
          lastSyncAt:
            clickupInt.metadata.lastSyncAt || configuredFeatures.lastSyncAt,
          taskCount:
            clickupInt.metadata.taskCount || configuredFeatures.taskCount || 0,
        };
      }

      // Mask password so it doesn't get sent to frontend
      if (configuredFeatures.db_pass) {
        configuredFeatures.db_pass = '********';
      }

      return {
        id: masterApp.id,
        name: masterApp.name,
        display_name: masterApp.display_name,
        status: appStatus,
        features: masterApp.features,
        configured_features: configuredFeatures,
        connectedAccount: configuredFeatures.connectedAccount || null,
        connectedName: configuredFeatures.connectedName || null,
        connectedPicture: configuredFeatures.connectedPicture || null,
        connectedAt: configuredFeatures.connectedAt || null,
      };
    });
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
      where: { corporateAccount: { id: account.id }, provider: 'google_drive' },
    });

    if (!integration || !integration.access_token) {
      throw new BadRequestException(
        'Google Drive is not connected or token is missing',
      );
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
        q =
          "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false";
      } else {
        q =
          "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
        if (search && search.trim() !== '') {
          const safeSearch = search
            .trim()
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
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
        files = files.filter((f) => f.name && !f.name.startsWith('.'));
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
      where: { corporateAccount: { id: account.id }, provider: 'google_drive' },
    });
    if (!integration)
      throw new NotFoundException('Google Drive integration not found');

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
      where: {
        corporate_account_id: account.id as any,
        provider: 'google_drive',
      },
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
      } else if (
        mimeType ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'text/csv'
      ) {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' },
        );
        const buffer = Buffer.from(response.data as any);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let extractedText = '';
        workbook.SheetNames.forEach((sheetName) => {
          extractedText += `--- Sheet: ${sheetName} ---\n`;
          const sheet = workbook.Sheets[sheetName];
          extractedText += xlsx.utils.sheet_to_csv(sheet);
          extractedText += '\n\n';
        });
        content = extractedText;
      } else if (mimeType === 'application/pdf') {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' },
        );
        const buffer = Buffer.from(response.data as any);
        const parsed = await pdfParse(buffer);
        content = parsed.text;
      } else if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const response = await drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'arraybuffer' },
        );
        const buffer = Buffer.from(response.data as any);
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
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
  async getFolderContext(
    email: string,
  ): Promise<{ success: boolean; content: string }> {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: {
        corporate_account_id: account.id as any,
        provider: 'google_drive',
      },
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
      // Find up to 100 latest files inside the synced folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
        pageSize: 100,
        orderBy: 'modifiedTime desc',
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
          if (
            mimeType?.includes('application/vnd.google-apps.document') ||
            mimeType?.includes('application/vnd.google-apps.presentation')
          ) {
            const r = await drive.files.export(
              { fileId: file.id, mimeType: 'text/plain' },
              { responseType: 'text' },
            );
            text = r.data as any;
          } else if (
            mimeType?.includes('application/vnd.google-apps.spreadsheet')
          ) {
            const r = await drive.files.export(
              { fileId: file.id, mimeType: 'text/csv' },
              { responseType: 'text' },
            );
            text = r.data as any;
          } else if (
            mimeType ===
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'text/csv'
          ) {
            const r = await drive.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'arraybuffer' },
            );
            const buffer = Buffer.from(r.data as any);
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              text +=
                `\n--- Sheet: ${sheetName} ---\n` +
                xlsx.utils.sheet_to_csv(sheet);
            });
          } else if (mimeType === 'application/pdf') {
            const r = await drive.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'arraybuffer' },
            );
            const buffer = Buffer.from(r.data as any);
            const parsed = await pdfParse(buffer);
            text = parsed.text;
          } else if (
            mimeType ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            const r = await drive.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'arraybuffer' },
            );
            const buffer = Buffer.from(r.data as any);
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
          } else {
            const r = await drive.files.get(
              { fileId: file.id, alt: 'media' },
              { responseType: 'text' },
            );
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

    let config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });

    if (!config) {
      // Create it if it doesn't exist yet
      config = this.tenantAppConfigRepo.create({
        tenant_id: account.id as any,
        app_id: appId,
        status: payload.status || 'connected',
        configured_features: {},
      });
    }

    const featuresToMerge = payload.configured_features
      ? { ...payload.configured_features }
      : { ...payload };
    delete featuresToMerge.status; // ensure status doesn't pollute JSON features

    // Verify DB Connection if provided
    if (featuresToMerge.db_host && featuresToMerge.db_user) {
      featuresToMerge.connectedAccount = `${featuresToMerge.db_user}@${featuresToMerge.db_host}`;
      try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
          host: featuresToMerge.db_host,
          port: parseInt(featuresToMerge.db_port || '3306'),
          user: featuresToMerge.db_user,
          password: featuresToMerge.db_pass,
          database: featuresToMerge.db_name,
        });
        await connection.ping();
        await connection.end();
      } catch (err: any) {
        throw new BadRequestException(
          'Database connection failed: ' + err.message,
        );
      }
    }

    // Encrypt password before saving
    if (featuresToMerge.db_pass) {
      featuresToMerge.db_pass = encrypt(featuresToMerge.db_pass);
    }

    config.configured_features = {
      ...(config.configured_features || {}),
      ...featuresToMerge,
    };
    if (payload.status) {
      config.status = payload.status;
    } else if (!config.status) {
      config.status = 'connected';
    }

    await this.tenantAppConfigRepo.save(config);
    return { success: true, status: config.status };
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Credentials loader (reads process.env or .env.local dynamically)
  // ─────────────────────────────────────────────────────────
  private getClickUpCredentials(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } {
    let clientId = process.env.CLICKUP_CLIENT_ID || '';
    let clientSecret = process.env.CLICKUP_CLIENT_SECRET || '';
    let redirectUri = process.env.CLICKUP_REDIRECT_URI || '';

    // If empty in active process.env, dynamically re-read from .env.local
    if (!clientId.trim() || !clientSecret.trim()) {
      try {
        const fs = require('fs');
        const path = require('path');
        const dotenv = require('dotenv');
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const parsed = dotenv.parse(fs.readFileSync(envPath));
          if (parsed.CLICKUP_CLIENT_ID) {
            clientId = parsed.CLICKUP_CLIENT_ID;
            process.env.CLICKUP_CLIENT_ID = parsed.CLICKUP_CLIENT_ID;
          }
          if (parsed.CLICKUP_CLIENT_SECRET) {
            clientSecret = parsed.CLICKUP_CLIENT_SECRET;
            process.env.CLICKUP_CLIENT_SECRET = parsed.CLICKUP_CLIENT_SECRET;
          }
          if (parsed.CLICKUP_REDIRECT_URI) {
            redirectUri = parsed.CLICKUP_REDIRECT_URI;
            process.env.CLICKUP_REDIRECT_URI = parsed.CLICKUP_REDIRECT_URI;
          }
        }
      } catch (err) {
        // ignore
      }
    }

    if (!redirectUri) {
      redirectUri = `${process.env.API_URL || 'http://localhost:4003'}/corporate/integrations/oauth/clickup/callback`;
    }

    return {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      redirectUri: redirectUri.trim(),
    };
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp Step 1: Generate OAuth URL
  // ─────────────────────────────────────────────────────────
  generateClickUpOAuthUrl(email: string, appId: string): string {
    const { clientId, redirectUri } = this.getClickUpCredentials();
    if (!clientId) {
      throw new BadRequestException(
        'CLICKUP_CLIENT_ID is not configured in environment variables (.env.local)',
      );
    }

    const state = Buffer.from(JSON.stringify({ email, appId })).toString(
      'base64url',
    );

    return `https://app.clickup.com/api?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(
      state,
    )}`;
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp Step 2: Handle OAuth Callback
  // ─────────────────────────────────────────────────────────
  async handleClickUpCallback(
    code: string,
    state: string,
  ): Promise<{ email: string; connectedAccount: string; teamName?: string }> {
    if (!code || !state) {
      throw new BadRequestException('Missing ClickUp OAuth code or state');
    }

    let tenantEmail: string;
    let appId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      tenantEmail = decoded.email;
      appId = decoded.appId;
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    const { clientId, clientSecret } = this.getClickUpCredentials();
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'ClickUp client credentials are not configured in environment',
      );
    }

    // Exchange code for token
    let accessToken: string;
    try {
      const tokenRes = await axios.post(
        'https://api.clickup.com/api/v2/oauth/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      accessToken = tokenRes.data.access_token;
    } catch (err: any) {
      const msg =
        err.response?.data?.err ||
        err.response?.data?.error ||
        err.message;
      throw new BadRequestException(`ClickUp token exchange failed: ${msg}`);
    }

    if (!accessToken) {
      throw new BadRequestException('Did not receive access token from ClickUp');
    }

    // Fetch ClickUp user profile
    let clickupUser: any = {};
    try {
      const userRes = await axios.get('https://api.clickup.com/api/v2/user', {
        headers: { Authorization: accessToken },
      });
      clickupUser = userRes.data.user || {};
    } catch (err: any) {
      console.warn('Could not fetch ClickUp user profile:', err.message);
    }

    // Fetch ClickUp teams (workspaces)
    let teams: any[] = [];
    try {
      const teamRes = await axios.get('https://api.clickup.com/api/v2/team', {
        headers: { Authorization: accessToken },
      });
      teams = teamRes.data.teams || [];
    } catch (err: any) {
      console.warn('Could not fetch ClickUp teams:', err.message);
    }

    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email: tenantEmail } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    // Pick workspace with the most members (e.g. corporate workspace with 13 members vs personal/empty workspace)
    const sortedTeams = [...teams].sort(
      (a, b) => (b.members?.length || 0) - (a.members?.length || 0),
    );
    const defaultTeam = sortedTeams[0] || teams[0] || {};
    const connectedAccount =
      clickupUser.email || clickupUser.username || 'ClickUp User';
    const connectedName = clickupUser.username || connectedAccount;
    const connectedPicture = clickupUser.profilePicture || null;

    // Save to CorporateIntegration
    let integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });

    if (!integration) {
      integration = this.corporateIntegrationRepo.create({
        corporateAccount: account,
        provider: 'clickup',
      });
    }

    integration.access_token = accessToken;
    integration.status = 'active';
    integration.metadata = {
      clickupUserId: clickupUser.id,
      username: connectedName,
      email: clickupUser.email,
      teams: teams.map((t) => ({ id: t.id, name: t.name })),
      defaultTeamId: defaultTeam.id,
      defaultTeamName: defaultTeam.name,
      connectedAccount,
      connectedName,
      connectedPicture,
      connectedAt: new Date().toISOString(),
      ...(integration.metadata || {}),
    };

    await this.corporateIntegrationRepo.save(integration);

    // Save to TenantAppConfig
    let config = await this.tenantAppConfigRepo.findOne({
      where: { tenant_id: account.id as any, app_id: appId },
    });
    if (!config) {
      config = this.tenantAppConfigRepo.create({
        tenant_id: account.id as any,
        app_id: appId,
        status: 'connected',
        configured_features: {},
      });
    }
    config.configured_features = {
      ...(config.configured_features || {}),
      connectedAccount,
      connectedName,
      connectedPicture,
      teamId: defaultTeam.id,
      teamName: defaultTeam.name,
      connectedAt: new Date().toISOString(),
    };
    config.status = 'connected';
    await this.tenantAppConfigRepo.save(config);

    // Immediately trigger initial sync in background so user doesn't wait
    this.syncClickUpData(tenantEmail).catch((err) => {
      console.warn('Initial ClickUp background sync error:', err.message);
    });

    return {
      email: tenantEmail,
      connectedAccount,
      teamName: defaultTeam.name,
    };
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Get Workspaces (Teams)
  // ─────────────────────────────────────────────────────────
  async getClickUpWorkspaces(email: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token) {
      throw new BadRequestException('ClickUp is not connected or token is missing');
    }

    try {
      const res = await axios.get('https://api.clickup.com/api/v2/team', {
        headers: { Authorization: integration.access_token },
      });
      return { success: true, teams: res.data.teams || [] };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to fetch ClickUp teams: ${err.response?.data?.err || err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Get Spaces in a Team
  // ─────────────────────────────────────────────────────────
  async getClickUpSpaces(email: string, teamId: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token) {
      throw new BadRequestException('ClickUp is not connected');
    }

    try {
      const res = await axios.get(
        `https://api.clickup.com/api/v2/team/${teamId}/space`,
        {
          headers: { Authorization: integration.access_token },
        },
      );
      return { success: true, spaces: res.data.spaces || [] };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to fetch ClickUp spaces: ${err.response?.data?.err || err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Get Lists in a Space
  // ─────────────────────────────────────────────────────────
  async getClickUpLists(email: string, spaceId: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token) {
      throw new BadRequestException('ClickUp is not connected');
    }

    try {
      // 1. Folderless lists directly in space
      const listsRes = await axios.get(
        `https://api.clickup.com/api/v2/space/${spaceId}/list`,
        {
          headers: { Authorization: integration.access_token },
        },
      );
      const folderlessLists = (listsRes.data.lists || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        folderName: null,
      }));

      // 2. Lists inside folders
      const foldersRes = await axios.get(
        `https://api.clickup.com/api/v2/space/${spaceId}/folder`,
        {
          headers: { Authorization: integration.access_token },
        },
      );
      const folderLists: any[] = [];
      for (const folder of foldersRes.data.folders || []) {
        for (const l of folder.lists || []) {
          folderLists.push({
            id: l.id,
            name: l.name,
            folderName: folder.name,
          });
        }
      }

      return { success: true, lists: [...folderlessLists, ...folderLists] };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to fetch ClickUp lists: ${err.response?.data?.err || err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Save Sync List Destination
  // ─────────────────────────────────────────────────────────
  async saveClickUpSyncList(
    email: string,
    listId: string,
    listName: string,
    spaceName?: string,
  ) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration)
      throw new NotFoundException('ClickUp integration not found');

    integration.metadata = {
      ...(integration.metadata || {}),
      syncListId: listId,
      syncListName: listName,
      syncSpaceName: spaceName,
      lastSyncAt: new Date().toISOString(),
    };
    await this.corporateIntegrationRepo.save(integration);

    // Also update TenantAppConfig
    const masterApp = await this.masterAppRepo.findOne({
      where: { name: 'clickup' },
    });
    if (masterApp) {
      let config = await this.tenantAppConfigRepo.findOne({
        where: { tenant_id: account.id as any, app_id: masterApp.id },
      });
      if (!config) {
        config = this.tenantAppConfigRepo.create({
          tenant_id: account.id as any,
          app_id: masterApp.id,
          status: 'connected',
          configured_features: {},
        });
      }
      config.configured_features = {
        ...(config.configured_features || {}),
        syncListId: listId,
        syncListName: listName,
        syncSpaceName: spaceName,
        lastSyncAt: new Date().toISOString(),
      };
      config.status = 'connected';
      await this.tenantAppConfigRepo.save(config);
    }

    return { success: true, syncListId: listId, syncListName: listName };
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Create Test Task or Assessment Task
  // ─────────────────────────────────────────────────────────
  async createClickUpTask(
    email: string,
    taskData: {
      name: string;
      description?: string;
      listId?: string;
      priority?: number;
      dueDate?: number;
    },
  ) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token) {
      throw new BadRequestException('ClickUp is not connected or token is missing');
    }

    const listId = taskData.listId || integration.metadata?.syncListId;
    if (!listId) {
      throw new BadRequestException(
        'No ClickUp List selected. Please select a destination list in ClickUp settings.',
      );
    }

    try {
      const res = await axios.post(
        `https://api.clickup.com/api/v2/list/${listId}/task`,
        {
          name: taskData.name,
          description: taskData.description || 'Created by OriginBI',
          status: 'to do',
          priority: taskData.priority || 3,
          due_date: taskData.dueDate,
        },
        {
          headers: {
            Authorization: integration.access_token,
            'Content-Type': 'application/json',
          },
        },
      );

      // Update lastSyncAt
      integration.metadata = {
        ...(integration.metadata || {}),
        lastSyncAt: new Date().toISOString(),
      };
      await this.corporateIntegrationRepo.save(integration);

      return {
        success: true,
        task: {
          id: res.data.id,
          name: res.data.name,
          url: res.data.url,
          status: res.data.status?.status,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to create ClickUp task: ${err.response?.data?.err || err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Full Workspace Sync (Tasks & Employee Assignments)
  // ─────────────────────────────────────────────────────────
  async syncClickUpData(email: string) {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) throw new NotFoundException('Corporate account not found');

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token) {
      throw new BadRequestException('ClickUp is not connected or token is missing');
    }

    const teamId =
      integration.metadata?.defaultTeamId ||
      integration.metadata?.teams?.[0]?.id;
    if (!teamId) {
      throw new BadRequestException('ClickUp workspace ID not found');
    }

    try {
      let rawTasks: any[] = [];
      let page = 0;
      while (page < 6) {
        try {
          const res = await axios.get(
            `https://api.clickup.com/api/v2/team/${teamId}/task?page=${page}&include_closed=true&subtasks=true`,
            {
              headers: { Authorization: integration.access_token },
            },
          );
          const pageTasks = res.data.tasks || [];
          rawTasks = rawTasks.concat(pageTasks);
          if (pageTasks.length < 100) break;
          page++;
        } catch (pageErr: any) {
          console.warn(`ClickUp task page ${page} fetch failed:`, pageErr.message);
          break;
        }
      }

      const normalizedTasks = rawTasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status?.status || 'open',
        priority: t.priority?.priority || 'none',
        dueDate: t.due_date
          ? new Date(parseInt(t.due_date)).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : null,
        dueTimestamp: t.due_date ? parseInt(t.due_date) : null,
        listName: t.list?.name || 'General',
        spaceName: t.space?.name || '',
        folderName: t.folder?.name || '',
        creator: t.creator?.username || t.creator?.email || 'Unknown',
        assignees: (t.assignees || []).map((a: any) => ({
          id: a.id,
          username: a.username,
          email: a.email,
        })),
        url: t.url,
      }));

      // Group tasks employee-wise and project-wise
      const employeeMap: Record<string, any[]> = {};
      const projectMap: Record<string, any[]> = {};
      const unassigned: any[] = [];

      normalizedTasks.forEach((t: any) => {
        const listKey = t.listName || 'General';
        if (!projectMap[listKey]) projectMap[listKey] = [];
        projectMap[listKey].push(t);

        if (!t.assignees || t.assignees.length === 0) {
          unassigned.push(t);
        } else {
          t.assignees.forEach((a: any) => {
            const key = a.username || a.email || 'Unknown';
            if (!employeeMap[key]) employeeMap[key] = [];
            employeeMap[key].push(t);
          });
        }
      });

      const now = new Date().toISOString();
      integration.metadata = {
        ...(integration.metadata || {}),
        lastSyncAt: now,
        taskCount: normalizedTasks.length,
        tasks: normalizedTasks,
        employeeMap,
        projectMap,
        unassignedCount: unassigned.length,
      };
      await this.corporateIntegrationRepo.save(integration);

      // Also update TenantAppConfig
      const masterApp = await this.masterAppRepo.findOne({
        where: { name: 'clickup' },
      });
      if (masterApp) {
        let config = await this.tenantAppConfigRepo.findOne({
          where: { tenant_id: account.id as any, app_id: masterApp.id },
        });
        if (!config) {
          config = this.tenantAppConfigRepo.create({
            tenant_id: account.id as any,
            app_id: masterApp.id,
            status: 'connected',
            configured_features: {},
          });
        }
        config.configured_features = {
          ...(config.configured_features || {}),
          teamId,
          lastSyncAt: now,
          taskCount: normalizedTasks.length,
        };
        await this.tenantAppConfigRepo.save(config);
      }

      return {
        success: true,
        taskCount: normalizedTasks.length,
        lastSyncAt: now,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `ClickUp sync failed: ${err.response?.data?.err || err.message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Scheduled Hourly Sync
  // ─────────────────────────────────────────────────────────
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyClickUpSync() {
    try {
      const integrations = await this.corporateIntegrationRepo.find({
        where: { provider: 'clickup', status: 'active' },
        relations: ['corporateAccount', 'corporateAccount.user'],
      });
      for (const int of integrations) {
        const email = int.corporateAccount?.user?.email;
        if (email) {
          try {
            await this.syncClickUpData(email);
          } catch (e: any) {
            console.warn(`Hourly ClickUp sync failed for ${email}:`, e.message);
          }
        }
      }
    } catch (err: any) {
      console.warn('ClickUp hourly cron failed:', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────
  //  ClickUp: Get Formatted Context for Ask AI
  // ─────────────────────────────────────────────────────────
  async getClickUpContext(email: string): Promise<string> {
    const account = await this.corporateAccountRepo.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    if (!account) return '';

    const integration = await this.corporateIntegrationRepo.findOne({
      where: { corporateAccount: { id: account.id }, provider: 'clickup' },
    });
    if (!integration?.access_token || integration.status !== 'active') {
      return '';
    }

    const lastSyncTime = integration.metadata?.lastSyncAt
      ? new Date(integration.metadata.lastSyncAt).getTime()
      : 0;
    const isStale = Date.now() - lastSyncTime > 15 * 60 * 1000; // 15 mins

    // Auto-sync if no tasks cached yet OR cache is stale (>15 mins)
    if (
      !integration.metadata?.tasks ||
      integration.metadata.tasks.length === 0 ||
      isStale
    ) {
      try {
        await this.syncClickUpData(email);
        const refreshed = await this.corporateIntegrationRepo.findOne({
          where: { id: integration.id },
        });
        if (refreshed?.metadata) {
          integration.metadata = refreshed.metadata;
        }
      } catch (err: any) {
        console.warn('ClickUp auto-sync on context fetch failed:', err.message);
      }
    }

    const tasks: any[] = integration.metadata?.tasks || [];
    if (tasks.length === 0) return '';

    const teamName =
      integration.metadata?.defaultTeamName || 'ClickUp Workspace';
    const employeeMap: Record<string, any[]> =
      integration.metadata?.employeeMap || {};
    const projectMap: Record<string, any[]> =
      integration.metadata?.projectMap || {};

    const now = Date.now();

    let context = `WORKSPACE: ${teamName} (Total Synced ClickUp Tasks: ${tasks.length})\n\n`;

    // 1. Employee-wise task summary & detailed breakdown
    context += `### 👥 EMPLOYEE-WISE TASK ASSIGNMENTS & WORKLOAD (${Object.keys(employeeMap).length} active team members):\n`;
    for (const [employee, empTasks] of Object.entries(employeeMap)) {
      const openTasks = empTasks.filter(
        (t) =>
          !['complete', 'closed', 'resolved', 'done'].includes(
            t.status.toLowerCase(),
          ),
      );
      const completedTasks = empTasks.filter((t) =>
        ['complete', 'closed', 'resolved', 'done'].includes(
          t.status.toLowerCase(),
        ),
      );
      const overdueTasks = openTasks.filter(
        (t) => t.dueTimestamp && t.dueTimestamp < now,
      );

      context += `\n👤 Employee: ${employee}\n`;
      context += `  - Total Assigned: ${empTasks.length} | Pending/Active: ${openTasks.length} | Completed: ${completedTasks.length} | Overdue: ${overdueTasks.length}\n`;
      context += `  - Active / Pending Tasks:\n`;
      if (openTasks.length === 0) {
        context += `    * No pending tasks (all assigned tasks are completed).\n`;
      } else {
        openTasks.slice(0, 25).forEach((t: any) => {
          const isOverdue =
            t.dueTimestamp && t.dueTimestamp < now ? ' [OVERDUE!]' : '';
          context += `    * [${t.status.toUpperCase()}] "${t.name}" (List: ${t.listName}${t.folderName ? ` in ${t.folderName}` : ''}, Priority: ${t.priority}, Due: ${t.dueDate || 'No due date'})${isOverdue}\n`;
        });
        if (openTasks.length > 25) {
          context += `    * ...and ${openTasks.length - 25} more pending tasks.\n`;
        }
      }
      if (completedTasks.length > 0) {
        context += `  - Recent Completed Tasks: ${completedTasks.slice(0, 6).map((t) => `"${t.name}"`).join(', ')}\n`;
      }
    }

    // 2. Project / List wise breakdown
    context += `\n### 📁 PROJECT & LIST BREAKDOWN:\n`;
    for (const [project, pTasks] of Object.entries(projectMap)) {
      const pOpen = pTasks.filter(
        (t) =>
          !['complete', 'closed', 'resolved', 'done'].includes(
            t.status.toLowerCase(),
          ),
      );
      const pCompleted = pTasks.filter((t) =>
        ['complete', 'closed', 'resolved', 'done'].includes(
          t.status.toLowerCase(),
        ),
      );
      context += `- Project/List: "${project}" (Total: ${pTasks.length} tasks | Active: ${pOpen.length} | Completed: ${pCompleted.length})\n`;
      pOpen.slice(0, 5).forEach((t: any) => {
        const assignees =
          t.assignees?.map((a: any) => a.username).join(', ') || 'Unassigned';
        context += `  * [${t.status.toUpperCase()}] "${t.name}" (Assignees: ${assignees}, Priority: ${t.priority}, Due: ${t.dueDate || 'None'})\n`;
      });
    }

    // 3. Unassigned tasks
    const unassigned = tasks.filter(
      (t: any) => !t.assignees || t.assignees.length === 0,
    );
    if (unassigned.length > 0) {
      context += `\n### 📋 UNASSIGNED & GENERAL PROJECT TASKS (${unassigned.length} tasks):\n`;
      unassigned.slice(0, 15).forEach((t: any) => {
        context += `- [${t.status.toUpperCase()}] "${t.name}" (List: ${t.listName}, Due: ${t.dueDate || 'None'}, Priority: ${t.priority})\n`;
      });
    }

    return context;
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
      relations: ['app'],
    });
    if (!config) throw new NotFoundException('Integration not found');

    config.status = 'disconnected';
    config.configured_features = null;
    await this.tenantAppConfigRepo.save(config);

    if (config.app?.name === 'google_drive') {
      await this.corporateIntegrationRepo.delete({
        corporateAccount: { id: account.id },
        provider: 'google_drive',
      });
    } else if (config.app?.name === 'clickup') {
      await this.corporateIntegrationRepo.delete({
        corporateAccount: { id: account.id },
        provider: 'clickup',
      });
    }

    return { success: true };
  }
}

