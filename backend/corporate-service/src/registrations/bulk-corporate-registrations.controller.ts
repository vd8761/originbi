import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkCorporateRegistrationsService } from './bulk-corporate-registrations.service';

@Controller('corporate/registrations/bulk')
export class BulkCorporateRegistrationsController {
    constructor(
        private readonly bulkService: BulkCorporateRegistrationsService
    ) { }

    @Post('preview')
    @UseInterceptors(FileInterceptor('file'))
    async preview(
        @UploadedFile() file: Express.Multer.File,
        @Body('userId') userId: number
    ) {
        if (!file) throw new BadRequestException('File is required');
        if (!userId) throw new BadRequestException('User ID is required');

        return this.bulkService.preview(file.buffer, file.originalname, Number(userId));
    }

    @Post('execute')
    async execute(@Body() body: { importId: string; overrides?: any[] }) {
        if (!body.importId) throw new BadRequestException('Import ID is required');
        return this.bulkService.execute({
            import_id: body.importId,
            overrides: body.overrides
        });
    }

    @Get('status/:id')
    async getStatus(@Param('id') id: string) {
        return this.bulkService.getJobStatus(id);
    }

    @Get('rows/:id')
    async getRows(@Param('id') id: string) {
        return this.bulkService.getJobRows(id);
    }
}
