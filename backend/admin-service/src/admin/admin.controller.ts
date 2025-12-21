import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

interface AdminRequest extends Request {
  user?: Record<string, any>;
}

@Controller('admin')
@UseGuards(AdminLoginGuard) // 👈 all routes require ADMIN login
export class AdminController {
  @Get('me')
  getMe(@Req() req: AdminRequest) {
    return {
      message: 'Admin authenticated successfully',

      user: req.user, // set in AdminLoginGuard
    };
  }

  @Get('dashboard')
  getDashboard(@Req() req: AdminRequest) {
    return {
      message: 'Admin dashboard data',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      adminName: req.user?.fullName,
    };
  }
}
