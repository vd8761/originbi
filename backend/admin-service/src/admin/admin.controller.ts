import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

@Controller('admin')
@UseGuards(AdminLoginGuard)  // 👈 all routes require ADMIN login
export class AdminController {
  @Get('me')
  getMe(@Req() req: any) {
    return {
      message: 'Admin authenticated successfully',
      user: req.user,   // set in AdminLoginGuard
    };
  }

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return {
      message: 'Admin dashboard data',
      adminName: req.user?.fullName,
    };
  }
}

