import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../../../../database/entities/AdminUser';
import { AdminLoginService } from './adminlogin.service';
import { AdminLoginGuard } from './adminlogin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  providers: [AdminLoginService, AdminLoginGuard],
  // 👇 Export BOTH the guard and service (and TypeOrmModule so repo works)
  exports: [AdminLoginGuard, AdminLoginService, TypeOrmModule],
})
export class AdminLoginModule {}
