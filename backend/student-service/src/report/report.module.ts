import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportQueueService } from './services/report.queue.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [ReportController],
  providers: [ReportQueueService],
})
export class ReportModule {}
