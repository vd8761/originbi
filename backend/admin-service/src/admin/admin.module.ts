import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminLoginModule } from '../adminlogin/adminlogin.module';

@Module({
  imports: [AdminLoginModule], // 👈 IMPORTANT
  controllers: [AdminController],
})
export class AdminModule {}
