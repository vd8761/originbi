import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './admin/admin.module';
import { ProgramsModule } from './programs/programs.module';
import { AdminLoginModule } from './adminlogin/adminlogin.module';
import { DepartmentsModule } from './departments/departments.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { GroupsModule } from './groups/groups.module';
import { AssessmentModule } from './assessment/assessment.module';
import { CorporateModule } from './corporate/corporate.module';
import { ForgotPasswordModule } from './forgotpassword/forgotpassword.module';
import { RagModule } from './rag/rag.module';
import { TestController } from './test/test.controller';
import { MailAssetsController } from './mail/mail-assets.controller';
import { HealthController } from './health.controller';
import { KeepAliveModule } from './keepalive/keepalive.module';
import { AdministratorCounsellingModule } from './counselling/counselling.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { AffiliateLoginModule } from './affiliatelogin/affiliatelogin.module';
import { R2Module } from './r2/r2.module';
import { NotificationModule } from './notification/notification.module';
import { SettingsModule } from './settings/settings.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SmsModule } from './sms/sms.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // ✅ important
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        console.log('DEBUG: NODE_ENV is:', config.get('NODE_ENV'));
        console.log(
          'DEBUG: DATABASE_URL is:',
          databaseUrl ? 'PRESENT' : 'MISSING',
        );
        console.log('DEBUG: DB_HOST is:', config.get('DB_HOST'));

        if (databaseUrl) {
          const isLocal =
            databaseUrl.includes('localhost') ||
            databaseUrl.includes('127.0.0.1');

          let url = databaseUrl;
          if (!isLocal) {
            // Ensure sslmode=require in the URL for production/remote connections
            url = databaseUrl.includes('sslmode=')
              ? databaseUrl
              : databaseUrl.includes('?')
                ? `${databaseUrl}&sslmode=require`
                : `${databaseUrl}?sslmode=require`;
          }

          return {
            type: 'postgres',
            url,
            autoLoadEntities: true,
            // Never use schema sync in runtime; use migrations instead.
            // Sync can generate destructive/invalid ALTER statements on large schemas.
            synchronize: false,
            ssl: isLocal ? false : { rejectUnauthorized: false },
            schema: 'public',
            // Connection pooling for better performance
            extra: {
              max: 20, // Maximum number of connections in pool
              min: 5, // Minimum number of connections in pool
              acquire: 30000, // Maximum time (ms) to try getting connection
              idle: 10000, // Maximum time (ms) a connection can be idle
              connectionTimeoutMillis: 5000, // Connection timeout
              query_timeout: 30000, // Query timeout
            },
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST') || 'localhost',
          port: Number(config.get<string>('DB_PORT') || 5432),
          username: config.get<string>('DB_USER') || 'origin_user',
          password: config.get<string>('DB_PASS') || '',
          database: config.get<string>('DB_NAME') || 'originbi',
          autoLoadEntities: true,
          // Never use schema sync in runtime; use migrations instead.
          synchronize: false,
          ssl: false,
          schema: 'public',
          // Connection pooling for better performance
          extra: {
            max: 20, // Maximum number of connections in pool
            min: 5, // Minimum number of connections in pool
            acquire: 30000, // Maximum time (ms) to try getting connection
            idle: 10000, // Maximum time (ms) a connection can be idle
            connectionTimeoutMillis: 5000, // Connection timeout
            query_timeout: 30000, // Query timeout
          },
        };
      },
    }),

    ProgramsModule,
    RegistrationsModule,
    AdminLoginModule,
    AdminModule,
    DepartmentsModule,
    GroupsModule,
    AssessmentModule,
    CorporateModule,
    ForgotPasswordModule,
    RagModule,
    KeepAliveModule,
    AdministratorCounsellingModule,
    AffiliatesModule,
    AffiliateLoginModule,
    R2Module,
    NotificationModule,
    SettingsModule,
    WhatsappModule,
    SmsModule,
    RemindersModule,
  ],
  controllers: [TestController, MailAssetsController, HealthController],
})
export class AppModule {}
