import { Controller, Get, Put, Param, Body, Req, UseGuards } from '@nestjs/common';

import { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

interface AdminRequest extends Request {
  user?: Record<string, any>;
}

@Controller('admin')
@UseGuards(AdminLoginGuard) // 👈 all routes require ADMIN login
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  getMe(@Req() req: AdminRequest) {
    return {
      message: 'Admin authenticated successfully',

      user: req.user, // set in AdminLoginGuard
    };
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard')
  getDashboard(@Req() req: AdminRequest) {
    return {
      message: 'Admin dashboard data',

      adminName: req.user?.fullName,
    };
  }
  
  @Put('assessments/:id/extend')
  async extendAssessment(
    @Param('id') id: string,
    @Body('newDate') newDate: string,
  ) {
    return this.adminService.extendAssessmentSession(Number(id), newDate);
  }

}

