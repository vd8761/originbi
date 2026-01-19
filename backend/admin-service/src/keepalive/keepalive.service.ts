import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeepAliveService {
    private readonly logger = new Logger(KeepAliveService.name);

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
        private readonly dataSource: DataSource,
    ) { }

    // Run every 4 minutes (Neon sleeps after 5 mins, Render Free after 15 mins)
    @Cron('0 */4 * * * *')
    async handleCron() {
        this.logger.log('[KeepAliveService] Keep-alive pinging...');

        await this.pingDatabase();
        await this.pingServices();
    }

    private async pingDatabase() {
        try {
            // Simple lightweight query to wake up Neon
            await this.dataSource.query('SELECT 1');
            this.logger.log('[KeepAliveService] DB Ping: Success');
        } catch (err) {
            this.logger.error('[KeepAliveService] DB Ping Failed:', err);
        }
    }

    private async pingServices() {
        const services = [
            { name: 'Auth Service', url: this.config.get<string>('AUTH_SERVICE_URL') },
            { name: 'Corporate Service', url: this.config.get<string>('CORPORATE_API_URL') },
            { name: 'Exam Engine', url: this.config.get<string>('EXAM_ENGINE_API_URL') },
        ];

        for (const s of services) {
            if (!s.url) {
                this.logger.warn(`[KeepAliveService] No URL for ${s.name}, skipping.`);
                continue;
            }

            // Check for localhost to avoid pinging itself if misconfigured, 
            // though typically in prod these should be https://...onrender.com
            const healthUrl = `${s.url.replace(/\/+$/, '')}/health`;

            try {
                await firstValueFrom(this.http.get(healthUrl, { timeout: 5000 }));
                this.logger.log(`[KeepAliveService] ${s.name} Ping: Success`);
            } catch (err: any) {
                // Log simple error message
                const msg = err.message || 'Unknown error';
                this.logger.warn(`[KeepAliveService] ${s.name} Ping Failed: ${msg}`);
            }
        }
    }
}
