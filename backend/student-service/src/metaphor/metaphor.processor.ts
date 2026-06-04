import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import * as PgBoss from 'pg-boss';
import { MetaphorTranslationJob } from '@originbi/shared-entities';
import { MetaphorTranslationService } from './metaphor-translation.service';
import { METAPHOR_TRANSLATE_QUEUE } from './metaphor.constants';

/**
 * pgboss worker for metaphor translation + a periodic sweep that re-enqueues any
 * attempt whose translation job is still PENDING/FAILED (covers crashes/misses).
 * Fully isolated: if no metaphor attempts ever finish, this queue stays empty.
 */
@Injectable()
export class MetaphorProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetaphorProcessor.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 min

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly translation: MetaphorTranslationService,
    private readonly config: ConfigService,
    @InjectRepository(MetaphorTranslationJob)
    private readonly jobRepo: Repository<MetaphorTranslationJob>,
  ) {}

  async onModuleInit() {
    await this.pgBoss.registerJob(
      METAPHOR_TRANSLATE_QUEUE,
      (jobs: PgBoss.Job<{ attemptId: number }>[]) => this.handle(jobs),
      { batchSize: 1 },
    );
    this.logger.log(`${METAPHOR_TRANSLATE_QUEUE} worker registered`);
    this.sweepTimer = setInterval(() => void this.sweep(), this.SWEEP_INTERVAL_MS);
    // initial sweep shortly after boot
    setTimeout(() => void this.sweep(), 30000);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /** Public enqueue helper (used by finish + admin manual trigger). */
  async enqueue(attemptId: number): Promise<void> {
    await this.pgBoss.boss.send(METAPHOR_TRANSLATE_QUEUE, { attemptId });
  }

  private async handle(jobs: PgBoss.Job<{ attemptId: number }>[]): Promise<void> {
    for (const job of jobs) {
      const attemptId = Number(job.data?.attemptId);
      this.logger.log(`Translating attempt ${attemptId} (job ${job.id})`);
      try {
        await this.translation.translateAttempt(attemptId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        this.logger.error(`Translation job ${job.id} failed: ${e.message}`);
        throw err; // let pgboss retry
      }
    }
  }

  /** Re-enqueue attempts whose translation is still incomplete. */
  private async sweep(): Promise<void> {
    try {
      const stuck = await this.jobRepo.find({
        where: { status: In(['PENDING', 'FAILED', 'PROCESSING']) },
        take: 50,
      });
      if (stuck.length === 0) return;
      this.logger.log(`Sweep: re-enqueuing ${stuck.length} pending translation job(s)`);
      for (const j of stuck) {
        await this.enqueue(Number(j.assessmentAttemptId));
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      this.logger.warn(`Translation sweep failed: ${e.message}`);
    }
  }
}
