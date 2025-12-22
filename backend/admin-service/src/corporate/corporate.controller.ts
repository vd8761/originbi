import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CreateCorporateRegistrationDto } from './dto/create-corporate-registration.dto';
import { UpdateCorporateRegistrationDto } from './dto/update-corporate-registration.dto';

@Controller('admin/corporate-accounts')
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  @Post()
  async register(@Body() dto: CreateCorporateRegistrationDto) {
    return this.corporateService.create(dto);
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return this.corporateService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.corporateService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCorporateRegistrationDto,
  ) {
    return this.corporateService.update(+id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('is_active') isActive: boolean,
  ) {
    return this.corporateService.updateStatus(+id, isActive);
  }

  @Patch(':id/block')
  async updateBlockStatus(
    @Param('id') id: string,
    @Body('is_blocked') isBlocked: boolean,
  ) {
    return this.corporateService.updateBlockStatus(+id, isBlocked);
  }

  @Patch(':id/credits')
  async updateCredits(
    @Param('id') id: string,
    @Body('credits') credits: number,
  ) {
    return this.corporateService.updateCredits(+id, credits);
  }

  @Post(':id/top-up')
  async topUpCredits(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason?: string,
  ) {
    return this.corporateService.topUpCredits(+id, amount, reason);
  }

  @Get(':id/ledger')
  async getLedger(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.corporateService.getLedger(+id, +page, +limit);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.corporateService.remove(+id);
  }
}
