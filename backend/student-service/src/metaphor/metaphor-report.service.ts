import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import {
  AiUsageLog,
  MetaphorAnswer,
  MetaphorReport,
  MetaphorReportJob,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { METAPHOR_REPORT_QUEUE } from './metaphor.constants';

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_RETRIES = 5;

type ReadinessAnswer = {
  sequence: number | null;
  status: string;
  translationStatus: string;
  answerTextEn: string | null;
};

@Injectable()
export class MetaphorReportService {
  private readonly logger = new Logger(MetaphorReportService.name);

  constructor(
    @InjectRepository(MetaphorAnswer)
    private readonly answerRepo: Repository<MetaphorAnswer>,
    @InjectRepository(MetaphorReport)
    private readonly reportRepo: Repository<MetaphorReport>,
    @InjectRepository(MetaphorReportJob)
    private readonly jobRepo: Repository<MetaphorReportJob>,
    @InjectRepository(AiUsageLog)
    private readonly usageRepo: Repository<AiUsageLog>,
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    private readonly http: HttpService,
    private readonly pgBoss: PgBossService,
  ) {}

  async enqueueIfReady(attemptId: number): Promise<{ queued: boolean; reason?: string }> {
    const existingReport = await this.reportRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (existingReport) return { queued: false, reason: 'report_exists' };

    const job = await this.ensureJob(attemptId);
    if (job.status === 'DONE' || job.status === 'PROCESSING') {
      return { queued: false, reason: `job_${job.status.toLowerCase()}` };
    }
    if (job.status === 'FAILED' && job.retryCount >= job.maxRetries) {
      return { queued: false, reason: 'report_retry_exhausted' };
    }

    const readiness = await this.getReadiness(attemptId);
    if (!readiness.ready) return { queued: false, reason: readiness.reason };

    await this.jobRepo.update(job.id, {
      status: 'PENDING',
      lastError: null,
      nextRetryAt: null,
    });
    await this.pgBoss.boss.send(METAPHOR_REPORT_QUEUE, { attemptId });
    return { queued: true };
  }

  async generateReport(attemptId: number): Promise<void> {
    const job = await this.ensureJob(attemptId);
    if (job.status === 'DONE') return;
    if (job.status === 'FAILED' && job.retryCount >= job.maxRetries) {
      throw new Error('Metaphor report retry limit reached.');
    }

    const existingReport = await this.reportRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (existingReport) {
      await this.jobRepo.update(job.id, {
        status: 'DONE',
        completedAt: existingReport.generatedAt || new Date(),
        lastError: null,
      });
      return;
    }

    const readiness = await this.getReadiness(attemptId);
    if (!readiness.ready) {
      await this.jobRepo.update(job.id, {
        status: 'PENDING',
        lastError: readiness.reason || 'Metaphor answers are not ready for report generation.',
      });
      return;
    }

    await this.jobRepo.update(job.id, {
      status: 'PROCESSING',
      startedAt: new Date(),
      lastError: null,
    });

    const apiKey =
      String((await this.readSetting('claude_api_key', '')) || '').trim() ||
      process.env.ANTHROPIC_API_KEY ||
      '';
    if (!apiKey) {
      await this.markFailure(job, 'Claude API key is not configured.');
      throw new Error('Claude API key is not configured.');
    }

    const model =
      String((await this.readSetting('claude_report_model', DEFAULT_CLAUDE_MODEL)) || '').trim() ||
      DEFAULT_CLAUDE_MODEL;
    const skill = String((await this.readSetting('report_skill_markdown', '')) || '').trim();
    const prompt = this.buildUserPrompt(readiness.answers);

    try {
      const res = await firstValueFrom(
        this.http.post(
          'https://api.anthropic.com/v1/messages',
          {
            model,
            max_tokens: 4096,
            system: skill || 'Generate a concise admin Markdown report from the supplied assessment answers.',
            messages: [{ role: 'user', content: prompt }],
          },
          {
            timeout: 180000,
            headers: {
              'content-type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
          },
        ),
      );

      const data: any = res.data;
      const markdown = (data?.content || [])
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => String(part.text || ''))
        .join('\n')
        .trim();
      if (!markdown) throw new Error('Claude returned an empty report.');

      const firstAnswer = readiness.rawAnswers[0];
      await this.reportRepo.save(
        this.reportRepo.create({
          assessmentAttemptId: attemptId,
          assessmentSessionId: firstAnswer?.assessmentSessionId ?? null,
          userId: firstAnswer?.userId ?? null,
          registrationId: firstAnswer?.registrationId ?? null,
          model,
          markdown,
          generatedAt: new Date(),
        }),
      );

      const usage = data?.usage || {};
      await this.usageRepo.insert({
        purpose: 'metaphor_report',
        assessmentAttemptId: attemptId,
        model,
        inputTokens: Number(usage.input_tokens || 0),
        outputTokens: Number(usage.output_tokens || 0),
        totalTokens: Number(usage.input_tokens || 0) + Number(usage.output_tokens || 0),
        questionCount: readiness.answers.length,
        questionIds: readiness.rawAnswers.map((a) => a.id),
        status: 'DONE',
      });

      await this.jobRepo.update(job.id, {
        status: 'DONE',
        completedAt: new Date(),
        lastError: null,
        nextRetryAt: null,
      });
      this.logger.log(`[Metaphor] Claude report generated for attempt ${attemptId}.`);
    } catch (err) {
      const message = this.errorMessage(err);
      await this.usageRepo.insert({
        purpose: 'metaphor_report',
        assessmentAttemptId: attemptId,
        model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        questionCount: readiness.answers.length,
        questionIds: readiness.rawAnswers.map((a) => a.id),
        status: 'FAILED',
        error: message,
      });
      await this.markFailure(job, message);
      throw err;
    }
  }

  async manualRetry(attemptId: number) {
    const job = await this.ensureJob(attemptId);
    await this.jobRepo.update(job.id, {
      status: 'PENDING',
      retryCount: 0,
      nextRetryAt: null,
      lastError: null,
    });
    const result = await this.enqueueIfReady(attemptId);
    return { success: true, ...result };
  }

  private async getReadiness(attemptId: number): Promise<{
    ready: boolean;
    reason?: string;
    answers: ReadinessAnswer[];
    rawAnswers: MetaphorAnswer[];
  }> {
    const rawAnswers = await this.answerRepo.find({
      where: { assessmentAttemptId: attemptId },
      order: { questionSequence: 'ASC' },
    });
    if (rawAnswers.length === 0) {
      return {
        ready: false,
        reason: 'No generated Metaphor answers found.',
        answers: [],
        rawAnswers,
      };
    }

    const answers = rawAnswers.map((a) => ({
      sequence: a.questionSequence,
      status: a.status,
      translationStatus: a.translationStatus,
      answerTextEn: a.answerTextEn,
    }));

    for (const answer of answers) {
      if (answer.status === 'NOT_ANSWERED') continue;
      const hasEnglish = String(answer.answerTextEn || '').trim().length > 0;
      if (answer.translationStatus !== 'DONE' || !hasEnglish) {
        return {
          ready: false,
          reason: `Answer ${answer.sequence || '?'} is not translated yet.`,
          answers,
          rawAnswers,
        };
      }
    }

    return { ready: true, answers, rawAnswers };
  }

  private buildUserPrompt(answers: ReadinessAnswer[]): string {
    const submitted = answers.filter((a) => a.status === 'ANSWERED').length;
    const missing = answers.length - submitted;
    const lines = answers.map((answer, index) => {
      const n = answer.sequence || index + 1;
      const text =
        answer.status === 'NOT_ANSWERED'
          ? '[No answer submitted]'
          : String(answer.answerTextEn || '').trim() || '[No translated answer available]';
      return `Answer ${n}: ${text}`;
    });

    return [
      `Generated questions in this attempt: ${answers.length}`,
      `Submitted answers: ${submitted}`,
      `Missing answers: ${missing}`,
      '',
      lines.join('\n'),
    ].join('\n');
  }

  private async markFailure(job: MetaphorReportJob, message: string): Promise<void> {
    const retryCount = Number(job.retryCount || 0) + 1;
    const maxRetries = Number(job.maxRetries || DEFAULT_MAX_RETRIES);
    const exhausted = retryCount >= maxRetries;
    const nextRetryAt = exhausted ? null : new Date(Date.now() + this.backoffMs(retryCount));
    await this.jobRepo.update(job.id, {
      status: 'FAILED',
      retryCount,
      nextRetryAt,
      lastError: message,
    });
  }

  private backoffMs(retryCount: number): number {
    const minutes = Math.min(60, Math.max(1, 2 ** (retryCount - 1)));
    return minutes * 60 * 1000;
  }

  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category: 'metaphor', settingKey: key },
      });
      const v = row?.value;
      return v === null || v === undefined ? fallback : (v as T);
    } catch {
      return fallback;
    }
  }

  private async ensureJob(attemptId: number): Promise<MetaphorReportJob> {
    let job = await this.jobRepo.findOne({ where: { assessmentAttemptId: attemptId } });
    if (!job) {
      job = await this.jobRepo.save(
        this.jobRepo.create({
          assessmentAttemptId: attemptId,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: DEFAULT_MAX_RETRIES,
        }),
      );
    }
    return job;
  }

  private errorMessage(err: unknown): string {
    const anyErr = err as any;
    return String(
      anyErr?.response?.data?.error?.message ||
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        err ||
        'Unknown error',
    ).slice(0, 2000);
  }
}
