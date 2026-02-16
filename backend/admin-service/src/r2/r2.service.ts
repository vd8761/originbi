import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export interface R2UploadResult {
    key: string;
    url: string;
    fileName: string;
}

@Injectable()
export class R2Service {
    private readonly logger = new Logger(R2Service.name);
    private readonly s3: S3Client;
    private readonly bucketName: string;
    private readonly publicUrl: string;

    constructor(private readonly config: ConfigService) {
        const accountId = this.config.get<string>('R2_ACCOUNT_ID');
        const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
        this.bucketName = this.config.get<string>('R2_BUCKET_NAME') || 'originbi-kyc';
        this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') || '';

        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
        });

        this.logger.log(`R2 Service initialized for bucket: ${this.bucketName}`);
    }

    /**
     * Build the R2 object key for a KYC document.
     * Pattern: originBI kyc documents/{name}_{last4phone}/{docType} documents/{filename}
     */
    private buildKey(
        userName: string,
        phoneNumber: string,
        docType: 'pan' | 'aadhar',
        fileName: string,
    ): string {
        // Sanitize the user name (remove special chars, keep spaces)
        const sanitizedName = userName
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ');

        // Get last 4 digits of phone number
        const last4 = phoneNumber.replace(/\D/g, '').slice(-4);

        const userFolder = `${sanitizedName}_${last4}`;
        const docFolder = `${docType} documents`;

        return `originBI kyc documents/${userFolder}/${docFolder}/${fileName}`;
    }

    /**
     * Upload a single file to R2.
     */
    async uploadFile(
        buffer: Buffer,
        userName: string,
        phoneNumber: string,
        docType: 'pan' | 'aadhar',
        originalFileName: string,
        mimeType: string,
    ): Promise<R2UploadResult> {
        // Add a timestamp prefix to avoid filename collisions
        const timestamp = Date.now();
        const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

        const key = this.buildKey(userName, phoneNumber, docType, uniqueFileName);

        this.logger.log(`Uploading to R2: ${key} (${mimeType}, ${buffer.length} bytes)`);

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            }),
        );

        const url = this.publicUrl
            ? `${this.publicUrl}/${key}`
            : `https://${this.bucketName}.r2.dev/${key}`;

        return {
            key,
            url,
            fileName: originalFileName,
        };
    }

    /**
     * Upload multiple files for a document type.
     */
    async uploadMultipleFiles(
        files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
        userName: string,
        phoneNumber: string,
        docType: 'pan' | 'aadhar',
    ): Promise<R2UploadResult[]> {
        const results: R2UploadResult[] = [];

        for (const file of files) {
            const result = await this.uploadFile(
                file.buffer,
                userName,
                phoneNumber,
                docType,
                file.originalname,
                file.mimetype,
            );
            results.push(result);
        }

        return results;
    }

    /**
     * Delete a file from R2 by its key.
     */
    async deleteFile(key: string): Promise<void> {
        this.logger.log(`Deleting from R2: ${key}`);
        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }),
        );
    }

    /**
     * List files in a user's document folder.
     */
    async listUserDocuments(
        userName: string,
        phoneNumber: string,
        docType: 'pan' | 'aadhar',
    ): Promise<string[]> {
        const sanitizedName = userName
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ');
        const last4 = phoneNumber.replace(/\D/g, '').slice(-4);
        const prefix = `originBI kyc documents/${sanitizedName}_${last4}/${docType} documents/`;

        const response = await this.s3.send(
            new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
            }),
        );

        return (response.Contents || []).map((obj) => obj.Key!).filter(Boolean);
    }
}
