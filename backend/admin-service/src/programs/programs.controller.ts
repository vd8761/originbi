import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { Program } from './entities/program.entity';

@Controller('admin/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // GET ALL (with pagination + search)
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveBool =
      is_active === 'true' ? true : is_active === 'false' ? false : undefined;
    return this.programsService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
      isActiveBool,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Program> {
    return this.programsService.findOne(id);
  }

  @Post()
  create(@Body() body: any): Promise<Program> {
    return this.programsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any): Promise<Program> {
    return this.programsService.update(id, body);
  }

  // ⭐ FIXED: Status Toggle API
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
  ): Promise<Program> {
    return this.programsService.updateStatus(id, is_active);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.programsService.remove(id);
    return { success: true };
  }
}
