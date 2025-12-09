import { Body, Controller, Post, Req } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  async create(@Body() dto: CreateRegistrationDto, @Req() req: any) {
    // later you can get admin id from req.user.id if you add auth
    const adminId = null;
    return this.registrationsService.create(dto, adminId);
  }
}
