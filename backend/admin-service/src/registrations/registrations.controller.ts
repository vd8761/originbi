import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegistrationsService } from './registrations.service';
import { BulkRegistrationsService } from './bulk-registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

import { GroupsService } from '../groups/groups.service';

// Local interface for Multer file
interface MulterFile {
  buffer: Buffer;
  originalname: string;
}

// Type guard
function isMulterFile(obj: unknown): obj is MulterFile {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    'buffer' in o &&
    Buffer.isBuffer(o.buffer) &&
    'originalname' in o &&
    typeof o.originalname === 'string'
  );
}

@Controller('admin/registrations')
export class RegistrationsController {
  constructor(
    private readonly registrationsService: RegistrationsService,
    private readonly bulkRegistrationsService: BulkRegistrationsService,
    private readonly groupsService: GroupsService,
  ) { }

  @Get('groups')
  async getGroups() {
    return this.groupsService.findAll();
  }

  @Post('bulk/preview')
  @UseInterceptors(FileInterceptor('file'))
  async bulkPreview(@UploadedFile() file: MulterFile) {
    if (!isMulterFile(file)) {
      throw new BadRequestException('File is required');
    }
    // Hardcoded adminId = 1 as per existing pattern
    const adminId = 1;
    return this.bulkRegistrationsService.preview(file.buffer, file.originalname, adminId);
  }

  @Post('bulk/execute')
  async bulkExecute(@Body() body: { import_id: string; overrides?: Record<string, any>[] }) {
    return this.bulkRegistrationsService.execute(body);
  }

  @Get('bulk-jobs/:id')
  async getBulkJobStatus(@Param('id') id: string) {
    return this.bulkRegistrationsService.getJobStatus(id);
  }

  @Get('bulk-jobs/:id/rows')
  async getBulkJobRows(@Param('id') id: string) {
    return this.bulkRegistrationsService.getJobRows(id);
  }

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
