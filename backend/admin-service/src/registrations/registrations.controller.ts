import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Param,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('admin/registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) { }

  @Post()
  async create(@Body() dto: CreateRegistrationDto) {
    // ✅ adminId handled inside service (fixed to 1)
    return this.registrationsService.create(dto);
  }

  @Post('test-email')
  async sendTestEmail(@Body('email') email: string) {
    // Send a dummy welcome email to the provided address
    await this.registrationsService['sendWelcomeEmail'](
      email,
      'Test User',
      'TestPassword123!',
    );
    return { success: true, message: 'Test email sent' };
  }

  // 🔹 List registrations
  @Get()
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('tab') tab?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return this.registrationsService.findAll(
      pageNum,
      limitNum,
      tab,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    );
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.registrationsService.updateStatus(id, status);
  }
}
