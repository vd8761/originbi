import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentModule } from './student/student.module';
import { ForgotPasswordModule } from './forgotpassword/forgotpassword.module';
import { CounsellingModule } from './modules/counselling/counselling.module';
import { PgBossModule } from '@wavezync/nestjs-pgboss';
import { ReportModule } from './report/report.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SmsModule } from './sms/sms.module';

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
        const databaseUrl = config.get<string>('DATABASE_URL');
        // Shared tables are managed via SQL migrations, not service-level synchronize.
        const shouldSync = false;

        if (databaseUrl) {
          const isLocal =
            databaseUrl.includes('localhost') ||
            databaseUrl.includes('127.0.0.1');
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: shouldSync,
            ssl: isLocal ? false : { rejectUnauthorized: false },
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
          synchronize: shouldSync,
          ssl: false,
        };
      },
    }),
    PgBossModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        let connectionString = databaseUrl;

        if (!connectionString) {
          const host = config.get<string>('DB_HOST') || 'localhost';
          const port = config.get<number>('DB_PORT') || 5432;
          const user = config.get<string>('DB_USER') || 'origin_user';
          const pass = config.get<string>('DB_PASS') || '';
          const dbName = config.get<string>('DB_NAME') || 'originbi';
          connectionString = `postgresql://${user}:${pass}@${host}:${port}/${dbName}`;
        }

        return {
          connectionString,
          application_name: 'student-service-boss',
        };
      },
    }),
    StudentModule,
    ForgotPasswordModule,
    CounsellingModule,
    ReportModule,
    WhatsappModule,
    SmsModule,
  ],
})
export class AppModule {}
