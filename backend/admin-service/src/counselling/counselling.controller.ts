import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { AdministratorCounsellingService } from './counselling.service';
import { CounsellingReportService } from './counselling-report.service';
import { CreateCounsellingTypeDto, UpdateCounsellingTypeDto } from './dto/counselling-type.dto';
// import { AuthGuard } from '@nestjs/passport'; // Example, verify actual global guard usage

@Controller('admin/counselling')
// @UseGuards(AuthGuard('jwt')) 
export class AdministratorCounsellingController {
    constructor(
        private readonly counsellingService: AdministratorCounsellingService,
        private readonly reportService: CounsellingReportService
    ) { }

    // ========================================================================
    // COUNSELLING TYPES ENDPOINTS
    // ========================================================================

    @Get('types')
    async getAllTypes() {
        return this.counsellingService.getAllTypes();
    }

    @Get('types/:id')
    async getTypeById(@Param('id', ParseIntPipe) id: number) {
        return this.counsellingService.getTypeById(id);
    }

    @Post('types')
    async createType(@Body() dto: CreateCounsellingTypeDto) {
        return this.counsellingService.createType(dto);
    }

    @Put('types/:id')
    async updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCounsellingTypeDto) {
        return this.counsellingService.updateType(id, dto);
    }

    @Delete('types/:id')
    async deleteType(@Param('id', ParseIntPipe) id: number) {
        return this.counsellingService.deleteType(id);
    }

    // ========================================================================
    // COUNSELLING SESSIONS & REPORTS ENDPOINTS
    // ========================================================================

    /**
     * Get all sessions with their report status
     */
    @Get('sessions')
    async getSessions(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        return this.reportService.getSessionsWithReportStatus(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            status
        );
    }

    /**
     * Get report for a specific session
     */
    @Get('sessions/:id/report')
    async getReport(@Param('id', ParseIntPipe) id: number) {
        const report = await this.reportService.getReport(id);
        return {
            success: true,
            data: report,
            hasReport: !!report
        };
    }

    /**
     * Generate report for a completed session
     */
    @Post('sessions/:id/report/generate')
    async generateReport(@Param('id', ParseIntPipe) id: number) {
        const report = await this.reportService.generateReport(id);
        return {
            success: true,
            message: 'Report generated successfully',
            data: report
        };
    }

    /**
     * Regenerate report (force new generation)
     */
    @Post('sessions/:id/report/regenerate')
    async regenerateReport(@Param('id', ParseIntPipe) id: number) {
        const report = await this.reportService.regenerateReport(id);
        return {
            success: true,
            message: 'Report regenerated successfully',
            data: report
        };
    }
}
