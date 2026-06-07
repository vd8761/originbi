import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

type ObjectBodyStream = AsyncIterable<Buffer | Uint8Array | string> & {
  transformToByteArray?: () => Promise<Uint8Array>;
};

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.config.get<string>('R2_BUCKET_NAME') || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    this.assertConfigured();
    this.logger.log(
      `Uploading metaphor audio to R2: ${key} (${buffer.length} bytes)`,
    );
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    this.assertConfigured();
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    const body = res.Body as ObjectBodyStream | undefined;
    if (!body) return Buffer.alloc(0);
    if (typeof body.transformToByteArray === 'function') {
      const bytes = await body.transformToByteArray();
      return Buffer.from(bytes);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(key: string): Promise<void> {
    this.assertConfigured();
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  private assertConfigured(): void {
    if (!this.bucketName) {
      throw new Error('R2_BUCKET_NAME is not configured.');
    }
  }
}
