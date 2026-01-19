import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateDashboardModule } from './dashboard/corporate-dashboard.module';
import { MailAssetsController } from './mail/mail-assets.controller';
import { HealthController } from './health.controller';
import { CorporateRegistrationsModule } from './registrations/corporate-registrations.module';
import { AssessmentModule } from './assessment/assessment.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.local',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const isProd = config.get<string>('NODE_ENV') === 'production';
                // DB_SYNC is now SAFE because all services use @originbi/shared-entities
                const shouldSync = config.get<string>('DB_SYNC') === 'true';

                if (isProd) {
                    const databaseUrl = config.get<string>('DATABASE_URL');
                    return {
                        type: 'postgres',
                        url: databaseUrl,
                        autoLoadEntities: true,
                        synchronize: shouldSync,
                        ssl: { rejectUnauthorized: false },
                    };
                }

                return {
                    type: 'postgres',
                    host: config.get<string>('DB_HOST'),
                    port: Number(config.get<string>('DB_PORT') || 5432),
                    username: config.get<string>('DB_USER'),
                    password: config.get<string>('DB_PASS'),
                    database: config.get<string>('DB_NAME'),
                    autoLoadEntities: true,
                    synchronize: shouldSync,
                    ssl: false,
                };
            },
        }),
        CorporateDashboardModule,
        CorporateRegistrationsModule,
        AssessmentModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [MailAssetsController, HealthController],
})
export class AppModule { }
