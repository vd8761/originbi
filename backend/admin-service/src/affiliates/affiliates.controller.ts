import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Param,
} from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';

@Controller('admin/affiliates')
export class AffiliatesController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    @Post()
    async create(@Body() dto: CreateAffiliateDto) {
        return this.affiliatesService.create(dto);
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
}
