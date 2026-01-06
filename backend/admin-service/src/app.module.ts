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
import { TestController } from './test/test.controller';
import { MailAssetsController } from './mail/mail-assets.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.local',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // ✅ important
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd =
          (config.get<string>('NODE_ENV') || 'development') === 'production';

        if (isProd) {
          const url = config.get<string>('DATABASE_URL');
          if (!url)
            throw new Error(
              'DATABASE_URL is missing in production environment',
            );

          return {
            type: 'postgres',
            url,
            autoLoadEntities: true,
            synchronize: config.get<string>('DB_SYNC') === 'true',
            ssl: { rejectUnauthorized: false },
            schema: 'public',
          };
        }

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT') || 5432),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS') || '',
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNC') === 'true',
          ssl: false,
          schema: 'public',
        };
      },
    }),

    AdminLoginModule,
    AdminModule,
    ProgramsModule,
    DepartmentsModule,
    RegistrationsModule,
    GroupsModule,
    AssessmentModule,
    CorporateModule,
    ForgotPasswordModule,
  ],
  controllers: [TestController, MailAssetsController],
})
export class AppModule { }
