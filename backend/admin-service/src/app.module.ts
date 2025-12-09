import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AdminUser } from '../../../database/entities/AdminUser';
import { AdminModule } from './admin/admin.module';
import { ProgramsModule } from './programs/programs.module';
import { AdminLoginModule } from './adminlogin/adminlogin.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [
    // Load .env (includes DATABASE_URL)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Use Neon DATABASE_URL instead of separate host/user/pass
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,   // <<--- Neon URL from .env
      entities: [AdminUser],
      autoLoadEntities: true,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,     // required for Neon TLS
      },
    }),

    AdminLoginModule,
    AdminModule,
    ProgramsModule,
    DepartmentsModule,
  ],
})
export class AppModule {}
