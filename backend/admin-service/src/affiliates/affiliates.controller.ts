import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Param,
    Patch,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto, UpdateAffiliateDto } from './dto/create-affiliate.dto';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'application/pdf',
];

@Controller('admin/affiliates')
export class AffiliatesController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'aadharFiles', maxCount: MAX_FILES },
                { name: 'panFiles', maxCount: MAX_FILES },
            ],
            {
                limits: { fileSize: MAX_FILE_SIZE },
                fileFilter: (_req, file, cb) => {
                    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                        cb(null, true);
                    } else {
                        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PNG, JPG, JPEG, PDF`), false);
                    }
                },
            },
        ),
    )
    async create(
        @Body() body: any,
        @UploadedFiles()
        files: {
            aadharFiles?: Express.Multer.File[];
            panFiles?: Express.Multer.File[];
        },
    ) {
        // Parse numeric fields that come as strings in FormData
        const dto: CreateAffiliateDto = {
            ...body,
            commissionPercentage: body.commissionPercentage
                ? parseFloat(body.commissionPercentage)
                : undefined,
        };

        return this.affiliatesService.create(dto, files?.aadharFiles, files?.panFiles);
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

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.affiliatesService.findById(Number(id));
    }

    @Patch(':id')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'aadharFiles', maxCount: MAX_FILES },
                { name: 'panFiles', maxCount: MAX_FILES },
            ],
            {
                limits: { fileSize: MAX_FILE_SIZE },
                fileFilter: (_req, file, cb) => {
                    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                        cb(null, true);
                    } else {
                        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: PNG, JPG, JPEG, PDF`), false);
                    }
                },
            },
        ),
    )
    async update(
        @Param('id') id: string,
        @Body() body: any,
        @UploadedFiles()
        files: {
            aadharFiles?: Express.Multer.File[];
            panFiles?: Express.Multer.File[];
        },
    ) {
        const dto: UpdateAffiliateDto = {
            ...body,
            commissionPercentage: body.commissionPercentage
                ? parseFloat(body.commissionPercentage)
                : undefined,
        };

        // Parse existing URLs from body (sent as JSON string from frontend)
        if (body.existingAadharUrls) {
            dto.aadharUrls = typeof body.existingAadharUrls === 'string'
                ? JSON.parse(body.existingAadharUrls)
                : body.existingAadharUrls;
        }
        if (body.existingPanUrls) {
            dto.panUrls = typeof body.existingPanUrls === 'string'
                ? JSON.parse(body.existingPanUrls)
                : body.existingPanUrls;
        }

        return this.affiliatesService.update(
            Number(id),
            dto,
            files?.aadharFiles,
            files?.panFiles,
        );
    }
}
