import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AdminUser } from '../../../../database/entities/AdminUser';
import { AdminLoginService } from './adminlogin.service';
import { AdminLoginGuard } from './adminlogin.guard';

@Module({
  imports: [
    ConfigModule,                 // ✅ needed for ConfigService in guard
    TypeOrmModule.forFeature([AdminUser]),
  ],
  providers: [AdminLoginService, AdminLoginGuard],
  exports: [AdminLoginGuard, AdminLoginService, TypeOrmModule],
})
export class AdminLoginModule {}
