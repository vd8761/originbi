import { Controller, Get } from '@nestjs/common';
import { MindcoreService } from './mindcore.service';

@Controller('mindcore')
export class MindcoreController {
  constructor(private readonly mindcoreService: MindcoreService) {}

  @Get('aggregation')
  async getAggregation() {
    return this.mindcoreService.getAggregationData();
  }
}
