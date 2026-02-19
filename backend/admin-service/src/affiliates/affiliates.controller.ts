import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Param,
    Patch,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/create-affiliate.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_PER_TYPE = 5;

@Controller('admin/affiliates')
export class AffiliatesController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    @Post()
    async create(@Body() dto: CreateAffiliateDto) {
        return this.affiliatesService.create(dto);
    }

    /**
     * Upload KYC documents for an affiliate.
     * Accepts multipart form data with fields:
     *   - aadhar: up to 5 files, each max 5MB
     *   - pan: up to 5 files, each max 5MB
     */
    @Post(':id/documents')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'aadhar', maxCount: MAX_FILES_PER_TYPE },
                { name: 'pan', maxCount: MAX_FILES_PER_TYPE },
            ],
            {
                limits: {
                    fileSize: MAX_FILE_SIZE,
                    files: MAX_FILES_PER_TYPE * 2,
                },
                fileFilter: (_req, file, cb) => {
                    // Allow images and PDFs
                    const allowed = [
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'image/gif',
                        'application/pdf',
                    ];
                    if (allowed.includes(file.mimetype)) {
                        cb(null, true);
                    } else {
                        cb(
                            new BadRequestException(
                                `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, PDF`,
                            ),
                            false,
                        );
                    }
                },
            },
        ),
    )
    async uploadDocuments(
        @Param('id') id: string,
        @UploadedFiles()
        files: {
            aadhar?: Express.Multer.File[];
            pan?: Express.Multer.File[];
        },
    ) {
        if (!files.aadhar?.length && !files.pan?.length) {
            throw new BadRequestException('At least one file must be uploaded');
        }

        // Validate individual file sizes (belt and suspenders)
        const allFiles = [...(files.aadhar || []), ...(files.pan || [])];
        for (const file of allFiles) {
            if (file.size > MAX_FILE_SIZE) {
                throw new BadRequestException(
                    `File "${file.originalname}" exceeds the 5MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
                );
            }
        }

        return this.affiliatesService.uploadDocuments(
            Number(id),
            files.aadhar || [],
            files.pan || [],
        );
    }

    @Post('refresh-ready-status')
    async refreshReadyStatus() {
        return this.affiliatesService.updateReadyToProcessStatus();
    }

    @Get('dashboard-stats')
    async getDashboardStats() {
        return this.affiliatesService.getAdminDashboardStats();
    }

    @Get()
    async list(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    ) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        return this.affiliatesService.findAll(
            pageNum,
            limitNum,
            search,
            sortBy,
            sortOrder,
        );
    }

    @Get(':id/settle-preview')
    async settlePreview(@Param('id') id: string, @Query('amount') amount: string) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new BadRequestException('Amount must be a positive number');
        }
        return this.affiliatesService.previewSettlement(Number(id), numAmount);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.affiliatesService.findById(Number(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateAffiliateDto) {
        return this.affiliatesService.update(Number(id), dto);
    }

    @Post(':id/settle')
    async settle(@Param('id') id: string, @Body() dto: CreateSettlementDto) {
        return this.affiliatesService.settleAffiliate(Number(id), dto);
    }
}
