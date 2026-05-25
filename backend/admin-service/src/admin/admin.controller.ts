import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Req,
  UseGuards,
  Post,
  BadRequestException,
} from '@nestjs/common';

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

  @Post('record-login')
  async recordLogin(@Req() req: AdminRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User context missing');
    }
    let ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '';
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    await this.adminService.recordLogin(userId, ip);
    return { success: true };
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
