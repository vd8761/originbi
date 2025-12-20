import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateDashboardModule } from './dashboard/corporate-dashboard.module';

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

                if (isProd) {
                    const databaseUrl = config.get<string>('DATABASE_URL');
                    return {
                        type: 'postgres',
                        url: databaseUrl,
                        autoLoadEntities: true,
                        synchronize: false,
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
                    synchronize: false,
                    ssl: false,
                };
            },
        }),
        CorporateDashboardModule,
    ],
})
export class AppModule { }
