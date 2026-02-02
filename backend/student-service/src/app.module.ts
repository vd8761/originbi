import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentModule } from './student/student.module';
import { ForgotPasswordModule } from './forgotpassword/forgotpassword.module';
import { CounsellingModule } from './modules/counselling/counselling.module';

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

        if (databaseUrl) {
          const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: false,
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
          synchronize: false,
          ssl: false,
        };
      },
    }),
    StudentModule,
    ForgotPasswordModule,
    CounsellingModule,
  ],
})
export class AppModule { }
