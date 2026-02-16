import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * OneDrive service for uploading affiliate KYC documents
 * Uses Microsoft Graph API with client_credentials flow
 */
@Injectable()
export class OneDriveService {
    private readonly logger = new Logger(OneDriveService.name);

    // Azure AD / Microsoft Graph config from env
    private readonly tenantId = process.env.ONEDRIVE_TENANT_ID || '';
    private readonly clientId = process.env.ONEDRIVE_CLIENT_ID || '';
    private readonly clientSecret = process.env.ONEDRIVE_CLIENT_SECRET || '';

    // The resolved drive ID and folder ID from the shared OneDrive link
    private readonly driveId = process.env.ONEDRIVE_DRIVE_ID || '';
    private readonly rootFolderId = process.env.ONEDRIVE_ROOT_FOLDER_ID || '';

    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(private readonly http: HttpService) { }

    // ---------------------------------------------------------
    // GET ACCESS TOKEN (client_credentials flow)
    // ---------------------------------------------------------
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken;
        }

        const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        params.append('scope', 'https://graph.microsoft.com/.default');

        try {
            const res = await firstValueFrom(
                this.http.post(tokenUrl, params.toString(), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }),
            );
            this.accessToken = res.data.access_token;
            this.tokenExpiry = Date.now() + res.data.expires_in * 1000;
            return this.accessToken!;
        } catch (err: any) {
            this.logger.error('Failed to get OneDrive access token', err?.response?.data || err.message);
            throw new Error('Failed to authenticate with OneDrive');
        }
    }

    // ---------------------------------------------------------
    // CREATE USER FOLDER (inside the shared root folder)
    // ---------------------------------------------------------
    async createUserFolder(affiliateName: string, affiliateId: number): Promise<string> {
        const token = await this.getAccessToken();
        const folderName = `${affiliateName.replace(/[^a-zA-Z0-9 ]/g, '_')}_${affiliateId}`;

        const url = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${this.rootFolderId}/children`;

        try {
            const res = await firstValueFrom(
                this.http.post(
                    url,
                    {
                        name: folderName,
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'rename',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );
            this.logger.log(`Created OneDrive folder: ${folderName} (ID: ${res.data.id})`);
            return res.data.id;
        } catch (err: any) {
            this.logger.error('Failed to create OneDrive folder', err?.response?.data || err.message);
            throw new Error('Failed to create user folder in OneDrive');
        }
    }

    // ---------------------------------------------------------
    // UPLOAD FILE to a folder
    // ---------------------------------------------------------
    async uploadFile(
        folderId: string,
        fileName: string,
        fileBuffer: Buffer,
        mimeType: string,
    ): Promise<{ url: string; id: string }> {
        const token = await this.getAccessToken();

        // Sanitize the file name
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // For files < 4 MB, use simple upload
        const url = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}:/${safeName}:/content`;

        try {
            const res = await firstValueFrom(
                this.http.put(url, fileBuffer, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': mimeType,
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }),
            );

            // Create a sharing link so the file is accessible
            const shareUrl = await this.createSharingLink(res.data.id, token);

            this.logger.log(`Uploaded file: ${safeName} to folder ${folderId}`);
            return {
                url: shareUrl || res.data.webUrl,
                id: res.data.id,
            };
        } catch (err: any) {
            this.logger.error(`Failed to upload file ${safeName}`, err?.response?.data || err.message);
            throw new Error(`Failed to upload file: ${safeName}`);
        }
    }

    // ---------------------------------------------------------
    // CREATE SHARING LINK for a file
    // ---------------------------------------------------------
    private async createSharingLink(itemId: string, token: string): Promise<string | null> {
        const url = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${itemId}/createLink`;

        try {
            const res = await firstValueFrom(
                this.http.post(
                    url,
                    {
                        type: 'view',
                        scope: 'organization',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );
            return res.data.link?.webUrl || null;
        } catch (err: any) {
            this.logger.warn('Failed to create sharing link, using webUrl fallback', err?.response?.data || err.message);
            return null;
        }
    }

    // ---------------------------------------------------------
    // UPLOAD MULTIPLE FILES to a specific subfolder
    // ---------------------------------------------------------
    async uploadDocuments(
        folderId: string,
        subfolderName: string,
        files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    ): Promise<string[]> {
        if (!files || files.length === 0) return [];

        const token = await this.getAccessToken();

        // Create subfolder (e.g., "aadhar" or "pan")
        let subfolderId: string;
        try {
            const subUrl = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}/children`;
            const subRes = await firstValueFrom(
                this.http.post(
                    subUrl,
                    {
                        name: subfolderName,
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'replace',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );
            subfolderId = subRes.data.id;
        } catch (err: any) {
            // If folder already exists, try to find it
            this.logger.warn(`Subfolder create failed, trying to find existing: ${subfolderName}`);
            const listUrl = `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${folderId}/children?$filter=name eq '${subfolderName}'`;
            const listRes = await firstValueFrom(
                this.http.get(listUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );
            if (listRes.data.value?.length > 0) {
                subfolderId = listRes.data.value[0].id;
            } else {
                throw new Error(`Unable to create or find subfolder: ${subfolderName}`);
            }
        }

        // Upload each file
        const urls: string[] = [];
        for (const file of files) {
            const result = await this.uploadFile(
                subfolderId,
                file.originalname,
                file.buffer,
                file.mimetype,
            );
            urls.push(result.url);
        }

        return urls;
    }

    // ---------------------------------------------------------
    // CHECK IF CONFIGURED
    // ---------------------------------------------------------
    isConfigured(): boolean {
        return !!(this.tenantId && this.clientId && this.clientSecret && this.driveId && this.rootFolderId);
    }
}
