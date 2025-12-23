import { Controller, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { CorporateRegistrationsService } from './corporate-registrations.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Controller('corporate/registrations')
export class CorporateRegistrationsController {
    constructor(private readonly service: CorporateRegistrationsService) { }

    @Post()
    async register(
        @Body() dto: CreateCandidateDto,
        @Query('userId') userId: number,
    ) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }
        return this.service.registerCandidate(dto, Number(userId));
    }
}
