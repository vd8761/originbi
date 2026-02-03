import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdministratorCounsellingService } from './counselling.service';
import { CreateCounsellingTypeDto, UpdateCounsellingTypeDto } from './dto/counselling-type.dto';
// import { AuthGuard } from '@nestjs/passport'; // Example, verify actual global guard usage

@Controller('admin/counselling')
// @UseGuards(AuthGuard('jwt')) 
export class AdministratorCounsellingController {
    constructor(private readonly counsellingService: AdministratorCounsellingService) { }

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
}
