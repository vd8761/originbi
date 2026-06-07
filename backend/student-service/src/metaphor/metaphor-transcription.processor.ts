import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import * as PgBoss from 'pg-boss';
import { In, Repository } from 'typeorm';
import { MetaphorTranscriptionJob } from '@originbi/shared-entities';
import { METAPHOR_TRANSCRIBE_QUEUE } from './metaphor.constants';
import { MetaphorTranscriptionService } from './metaphor-transcription.service';

@Injectable()
export class MetaphorTranscriptionProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MetaphorTranscriptionProcessor.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly transcription: MetaphorTranscriptionService,
    @InjectRepository(MetaphorTranscriptionJob)
    private readonly jobRepo: Repository<MetaphorTranscriptionJob>,
  ) {}

  async onModuleInit() {
    await this.pgBoss.registerJob(
      METAPHOR_TRANSCRIBE_QUEUE,
      (jobs: PgBoss.Job<{ attemptId: number }>[]) => this.handle(jobs),
      { batchSize: 1 },
    );
    this.logger.log(`${METAPHOR_TRANSCRIBE_QUEUE} worker registered`);
    this.sweepTimer = setInterval(
      () => void this.sweep(),
      this.SWEEP_INTERVAL_MS,
    );
    setTimeout(() => void this.sweep(), 30000);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  async enqueue(attemptId: number): Promise<void> {
    await this.pgBoss.boss.send(METAPHOR_TRANSCRIBE_QUEUE, { attemptId });
  }

  private async handle(
    jobs: PgBoss.Job<{ attemptId: number }>[],
  ): Promise<void> {
    for (const job of jobs) {
      const attemptId = Number(job.data?.attemptId);
      this.logger.log(`Transcribing attempt ${attemptId} (job ${job.id})`);
      try {
        await this.transcription.transcribeAttempt(attemptId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        this.logger.error(`Transcription job ${job.id} failed: ${e.message}`);
        throw err;
      }
    }
  }

  private async sweep(): Promise<void> {
    try {
      const stuck = await this.jobRepo.find({
        where: { status: In(['PENDING', 'FAILED', 'PROCESSING']) },
        take: 50,
      });
      if (stuck.length === 0) return;
      this.logger.log(
        `Sweep: re-enqueuing ${stuck.length} pending transcription job(s)`,
      );
      for (const j of stuck) {
        await this.enqueue(Number(j.assessmentAttemptId));
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      this.logger.warn(`Transcription sweep failed: ${e.message}`);
    }
  }
}
