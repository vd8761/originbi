import { Controller, Get, Query } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

@Controller('admin/assessments')
export class AssessmentController {
    constructor(private readonly assessmentService: AssessmentService) { }

    @Get('sessions')
    async findAllSessions(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Query('userId') userId?: string,
        @Query('type') type?: string,
    ) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;

        return this.assessmentService.findAllSessions(
            pageNum,
            limitNum,
            search,
            sortBy,
            sortOrder,
            startDate,
            endDate,
            status,
            userId,
            type,
        );
    }
}
