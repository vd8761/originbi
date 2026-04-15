import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Get('unread-count')
  async getUnreadCount(
    @Query('userId') userId: number,
    @Query('role') role: string,
  ) {
    if (!userId || !role) {
      return { unreadCount: 0 };
    }
    const unreadCount = await this.notificationService.getUnreadCount(
      Number(userId),
      role,
    );
    return { unreadCount };
  }

  @Get()
  async getNotifications(
    @Query('userId') userId: number,
    @Query('role') role: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (!userId || !role) {
      return { items: [], total: 0, page, limit };
    }
    return this.notificationService.getNotifications(
      Number(userId),
      role,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: number, @Body('userId') userId: number) {
    return this.notificationService.markAsRead(Number(id), Number(userId));
  }

  @Patch('read-all')
  async markAllAsRead(
    @Body('userId') userId: number,
    @Body('role') role: string,
  ) {
    return this.notificationService.markAllAsRead(Number(userId), role);
  }

  // Internal endpoint for other services to create notifications via HTTP
  @Post('internal')
  async createNotification(@Body() data: any) {
    return this.notificationService.createNotification(data);
  }
}
