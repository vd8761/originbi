import { PgBossService } from '@wavezync/nestjs-pgboss';
import * as PgBoss from 'pg-boss';
import { StudentService } from './student.service';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StudentProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StudentProcessor.name);
  private checkTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private checkIntervalMs: number;

  constructor(
    private readonly studentService: StudentService,
    private readonly pgBossService: PgBossService,
    private readonly configService: ConfigService,
  ) {
    const checkMinutes =
      Number(this.configService.get('QUEUE_CHECK_INTERVAL')) || 15;
    this.checkIntervalMs = checkMinutes * 60 * 1000;
  }

  async onModuleInit() {
    const concurrency =
      Number(this.configService.get('QUEUE_CONCURRENCY')) || 1;
    const checkMinutes = this.checkIntervalMs / 60000;
    this.logger.log(
      `Registering assessment-email-queue (concurrency: ${concurrency}, recovery check: every ${checkMinutes}min after idle)`,
    );

    for (let i = 0; i < concurrency; i++) {
      await this.pgBossService.registerJob(
        'assessment-email-queue',
        this.handleJobs.bind(this),
        { batchSize: 1 },
      );
    }

    this.logger.log('assessment-email-queue worker registered successfully');

    // Start the first recovery check
    this.scheduleRecoveryCheck();
  }

  onModuleDestroy() {
    this.clearRecoveryCheck();
  }

  async handleJobs(jobs: PgBoss.Job<{ userId: number }>[]): Promise<void> {
    this.isProcessing = true;
    this.clearRecoveryCheck();

    try {
      for (const job of jobs) {
        this.logger.log(
          `Processing job ${job.id} for user ${job.data.userId}...`,
        );
        try {
          await this.studentService.handleAssessmentCompletion(job.data.userId);
          this.logger.log(`Job ${job.id} completed successfully.`);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.logger.error(
            `Job ${job.id} FAILED: ${error.message}`,
            error.stack,
          );
          throw err;
        }
      }
    } finally {
      this.isProcessing = false;
      this.scheduleRecoveryCheck();
    }
  }

  private scheduleRecoveryCheck() {
    this.clearRecoveryCheck();
    const minutes = this.checkIntervalMs / 60000;
    this.logger.debug(`Recovery check scheduled in ${minutes} minutes`);
    this.checkTimer = setTimeout(() => {
      void this.runRecoveryCheck();
    }, this.checkIntervalMs);
  }

  private clearRecoveryCheck() {
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private async runRecoveryCheck() {
    if (this.isProcessing) {
      this.logger.debug('Recovery check skipped: a job is currently running');
      this.scheduleRecoveryCheck();
      return;
    }

    this.logger.log('Running recovery check for incomplete jobs...');

    try {
      const boss = this.pgBossService.boss;
      const stats = await boss.getQueueStats('assessment-email-queue');

      this.logger.log(
        `Queue stats — queued: ${stats.queuedCount}, active: ${stats.activeCount}, total: ${stats.totalCount}`,
      );

      // If there are queued jobs sitting idle, the normal worker should pick them up.
      // But if there are failed jobs, we need to re-queue them.
      if (stats.totalCount > 0) {
        // Find failed jobs and retry them
        const failedJobs = await boss.findJobs('assessment-email-queue', {
          queued: false,
        });
        const jobsToRetry = failedJobs.filter(
          (j) => j.state === 'failed' || j.state === 'cancelled',
        );

        if (jobsToRetry.length > 0) {
          this.logger.warn(
            `Found ${jobsToRetry.length} failed/cancelled job(s). Re-queuing...`,
          );
          for (const failedJob of jobsToRetry) {
            try {
              const jobData = failedJob.data as { userId?: number } | undefined;
              await boss.retry('assessment-email-queue', failedJob.id);
              this.logger.log(
                `Re-queued job ${failedJob.id} for user ${String(jobData?.userId)}`,
              );
            } catch (retryErr) {
              const error =
                retryErr instanceof Error
                  ? retryErr
                  : new Error(String(retryErr));
              this.logger.error(
                `Failed to re-queue job ${failedJob.id}: ${error.message}`,
              );
            }
          }
        } else {
          this.logger.log('Recovery check: no failed jobs found. All good!');
        }
      } else {
        this.logger.log('Recovery check: queue is empty. Nothing to do.');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Recovery check failed: ${error.message}`, error.stack);
    }

    // Schedule the next check
    this.scheduleRecoveryCheck();
  }
}
