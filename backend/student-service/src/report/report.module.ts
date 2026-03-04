import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportQueueService } from './services/report.queue.service';

@Module({
  controllers: [ReportController],
  providers: [ReportQueueService],
})
export class ReportModule {}
