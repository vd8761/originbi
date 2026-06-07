import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import * as PgBoss from 'pg-boss';
import { Repository } from 'typeorm';
import { IatReportJob } from '@originbi/shared-entities';
import { IAT_REPORT_QUEUE } from './iat.constants';
import { IatReportService } from './iat-report.service';

@Injectable()
export class IatReportProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IatReportProcessor.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly reports: IatReportService,
    @InjectRepository(IatReportJob)
    private readonly jobRepo: Repository<IatReportJob>,
  ) {}

  async onModuleInit() {
    await this.pgBoss.registerJob(
      IAT_REPORT_QUEUE,
      (jobs: PgBoss.Job<{ attemptId: number }>[]) => this.handle(jobs),
      { batchSize: 1 },
    );
    this.logger.log(`${IAT_REPORT_QUEUE} worker registered`);
    this.sweepTimer = setInterval(() => void this.sweep(), this.SWEEP_INTERVAL_MS);
    setTimeout(() => void this.sweep(), 30000);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  private async handle(jobs: PgBoss.Job<{ attemptId: number }>[]) {
    for (const job of jobs) {
      const attemptId = Number(job.data?.attemptId);
      try {
        await this.reports.generateReport(attemptId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        this.logger.error(`IAT report job ${job.id} failed: ${e.message}`);
      }
    }
  }

  private async sweep(): Promise<void> {
    try {
      const due = await this.jobRepo
        .createQueryBuilder('j')
        .where('j.status IN (:...statuses)', { statuses: ['PENDING', 'FAILED'] })
        .andWhere('j.retry_count < j.max_retries')
        .andWhere('(j.next_retry_at IS NULL OR j.next_retry_at <= NOW())')
        .take(50)
        .getMany();
      for (const job of due) {
        await this.pgBoss.boss.send(IAT_REPORT_QUEUE, {
          attemptId: Number(job.assessmentAttemptId),
        });
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      this.logger.warn(`IAT report sweep failed: ${e.message}`);
    }
  }
}
