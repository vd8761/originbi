import { Controller, Get, Put, Param, Body, Post, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { AdminLoginGuard } from '../adminlogin/adminlogin.guard';

@UseGuards(AdminLoginGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  findAll() {
    return this.integrationsService.findAll();
  }

  @Put(':id/toggle')
  toggleStatus(
    @Param('id') id: string,
    @Body('is_globally_active') isGloballyActive: boolean,
  ) {
    return this.integrationsService.toggleStatus(id, isGloballyActive);
  }

  // Temporary endpoint to populate DB for testing
  @Post('seed')
  seedApps() {
    return this.integrationsService.createInitialApps();
  }
}
