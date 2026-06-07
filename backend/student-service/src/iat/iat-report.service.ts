import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import {
  AiUsageLog,
  IatAttemptModule,
  IatIntakeProfile,
  IatReport,
  IatReportJob,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { Registration } from '../entities/registration.entity';
import { IAT_REPORT_QUEUE } from './iat.constants';

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_RETRIES = 5;

@Injectable()
export class IatReportService {
  private readonly logger = new Logger(IatReportService.name);

  constructor(
    @InjectRepository(IatAttemptModule)
    private readonly moduleRepo: Repository<IatAttemptModule>,
    @InjectRepository(IatIntakeProfile)
    private readonly intakeRepo: Repository<IatIntakeProfile>,
    @InjectRepository(IatReport)
    private readonly reportRepo: Repository<IatReport>,
    @InjectRepository(IatReportJob)
    private readonly jobRepo: Repository<IatReportJob>,
    @InjectRepository(AiUsageLog)
    private readonly usageRepo: Repository<AiUsageLog>,
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly http: HttpService,
    private readonly pgBoss: PgBossService,
  ) {}

  async enqueue(attemptId: number): Promise<{ queued: boolean; reason?: string }> {
    const report = await this.reportRepo.findOne({
      where: { assessmentAttemptId: attemptId, status: 'DONE' },
    });
    if (report) return { queued: false, reason: 'report_exists' };

    const job = await this.ensureJob(attemptId);
    if (job.status === 'PROCESSING') return { queued: false, reason: 'processing' };
    if (job.status === 'FAILED' && job.retryCount >= job.maxRetries) {
      return { queued: false, reason: 'retry_exhausted' };
    }
    await this.jobRepo.update(job.id, {
      status: 'PENDING',
      lastError: null,
      nextRetryAt: null,
    });
    await this.pgBoss.boss.send(IAT_REPORT_QUEUE, { attemptId });
    return { queued: true };
  }

  async generateReport(attemptId: number): Promise<void> {
    const job = await this.ensureJob(attemptId);
    if (job.status === 'DONE') return;
    if (job.status === 'FAILED' && job.retryCount >= job.maxRetries) {
      throw new Error('IAT report retry limit reached.');
    }

    const existing = await this.reportRepo.findOne({
      where: { assessmentAttemptId: attemptId, status: 'DONE' },
    });
    if (existing) {
      await this.jobRepo.update(job.id, {
        status: 'DONE',
        completedAt: existing.generatedAt || new Date(),
        lastError: null,
      });
      return;
    }

    const payload = await this.buildReportPayload(attemptId);
    if (!payload.ready) {
      await this.jobRepo.update(job.id, {
        status: 'PENDING',
        lastError: payload.reason || 'IAT attempt is not ready for report generation.',
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
      await this.upsertFailedReport(attemptId, payload.input, 'Claude API key is not configured.');
      throw new Error('Claude API key is not configured.');
    }

    const model =
      String((await this.readSetting('claude_report_model', DEFAULT_CLAUDE_MODEL)) || '').trim() ||
      DEFAULT_CLAUDE_MODEL;
    const skill =
      String((await this.readSetting('report_skill_markdown', '')) || '').trim() ||
      this.defaultSkillPrompt();

    try {
      const res = await firstValueFrom(
        this.http.post(
          'https://api.anthropic.com/v1/messages',
          {
            model,
            max_tokens: 4096,
            system: skill,
            messages: [
              {
                role: 'user',
                content: JSON.stringify(payload.input, null, 2),
              },
            ],
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
      const text = (data?.content || [])
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => String(part.text || ''))
        .join('\n')
        .trim();
      if (!text) throw new Error('Claude returned an empty IAT report.');

      // Upsert: a prior failed attempt may already have left a FAILED row for
      // this attempt (assessment_attempt_id is UNIQUE). Update it in place so a
      // retry can succeed instead of tripping the unique constraint forever.
      const reportRow =
        (await this.reportRepo.findOne({ where: { assessmentAttemptId: attemptId } })) ||
        this.reportRepo.create({ assessmentAttemptId: attemptId });
      reportRow.assessmentSessionId = payload.attempt.assessmentSessionId;
      reportRow.userId = payload.attempt.userId;
      reportRow.registrationId = payload.attempt.registrationId;
      reportRow.programId = payload.attempt.programId;
      reportRow.groupId = payload.groupId;
      reportRow.status = 'DONE';
      reportRow.model = model;
      reportRow.reportText = text;
      reportRow.reportInput = payload.input;
      reportRow.biasMap = payload.biasMap;
      reportRow.error = null;
      reportRow.generatedAt = new Date();
      await this.reportRepo.save(reportRow);

      const usage = data?.usage || {};
      await this.usageRepo.insert({
        purpose: 'iat_report_generation',
        assessmentAttemptId: attemptId,
        model,
        inputTokens: Number(usage.input_tokens || 0),
        outputTokens: Number(usage.output_tokens || 0),
        totalTokens: Number(usage.input_tokens || 0) + Number(usage.output_tokens || 0),
        questionCount: payload.modules.length,
        questionIds: payload.modules.map((m: any) => m.id),
        status: 'DONE',
      });

      await this.jobRepo.update(job.id, {
        status: 'DONE',
        completedAt: new Date(),
        lastError: null,
        nextRetryAt: null,
      });
      this.logger.log(`[IAT] Claude report generated for attempt ${attemptId}.`);
    } catch (err) {
      const message = this.errorMessage(err);
      await this.usageRepo.insert({
        purpose: 'iat_report_generation',
        assessmentAttemptId: attemptId,
        model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        questionCount: payload.modules.length,
        questionIds: payload.modules.map((m: any) => m.id),
        status: 'FAILED',
        error: message,
      });
      await this.upsertFailedReport(attemptId, payload.input, message);
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
      startedAt: null,
      completedAt: null,
    });
    await this.pgBoss.boss.send(IAT_REPORT_QUEUE, { attemptId });
    return { success: true, queued: true };
  }

  private async buildReportPayload(attemptId: number) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) return { ready: false, reason: 'Attempt not found.' } as const;
    const modules = await this.moduleRepo.find({
      where: { assessmentAttemptId: attemptId },
      relations: ['module'],
      order: { moduleOrder: 'ASC' },
    });
    if (!modules.length) return { ready: false, reason: 'No IAT modules found.' } as const;
    const incomplete = modules.filter((m) => m.status !== 'COMPLETED');
    if (incomplete.length) return { ready: false, reason: 'IAT modules are incomplete.' } as const;

    const intake = await this.intakeRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    const registration = await this.registrationRepo.findOne({
      where: { id: attempt.registrationId },
    });
    const registrationMetaRows = await this.registrationRepo.query(
      `SELECT group_id AS "groupId" FROM registrations WHERE id = $1 LIMIT 1`,
      [attempt.registrationId],
    );

    const areas: Record<string, any> = {};
    for (const module of modules) {
      const code = module.module?.code || String(module.moduleId);
      areas[code] = {
        pattern: module.patternLabel || 'low',
        slowed_on: module.module?.slowedOnDescription || 'none significant',
        slowest_words: module.slowestWords || [],
        error_words: module.errorWords || [],
      };
    }

    const sortedByGap = [...modules].sort(
      (a, b) => Number(b.speedGapMs || 0) - Number(a.speedGapMs || 0),
    );
    const sortedLow = [...modules].sort(
      (a, b) => Number(a.speedGapMs || 0) - Number(b.speedGapMs || 0),
    );
    const input = {
      student: {
        name: intake?.studentName || registration?.fullName || 'Student',
        age: Number(intake?.age || 0),
        gender: intake?.gender || registration?.gender || 'other',
        hometown_tier: intake?.hometownTier || 'tier_2',
        college_tier: intake?.collegeTier || 'tier_2',
        undergraduate_stream: intake?.undergraduateStream || 'other',
        work_experience_years: Number(intake?.workExperienceYears || 0),
      },
      areas,
      summary: {
        strongest_bias: sortedByGap[0]?.module?.code || '',
        weakest_bias: sortedLow[0]?.module?.code || '',
        high_error_areas: modules
          .filter((m) => Number(m.errorRate || 0) > 15)
          .map((m) => m.module?.code || String(m.moduleId)),
      },
    };
    const biasMap = modules.map((module) => ({
      code: module.module?.code,
      name: module.module?.displayName || module.module?.name,
      pattern: module.patternLabel,
      speedGapMs: Number(module.speedGapMs || 0),
      errorRate: Number(module.errorRate || 0),
    }));
    return {
      ready: true,
      attempt,
      modules,
      input,
      biasMap,
      groupId: registrationMetaRows?.[0]?.groupId || null,
    } as const;
  }

  private async upsertFailedReport(attemptId: number, input: any, message: string) {
    let report = await this.reportRepo.findOne({ where: { assessmentAttemptId: attemptId } });
    if (!report) {
      report = this.reportRepo.create({
        assessmentAttemptId: attemptId,
        status: 'FAILED',
        reportInput: input || {},
        biasMap: [],
        error: message,
      });
    } else if (report.status !== 'DONE') {
      report.status = 'FAILED';
      report.reportInput = input || report.reportInput || {};
      report.error = message;
    }
    if (report.status !== 'DONE') await this.reportRepo.save(report);
  }

  private async markFailure(job: IatReportJob, message: string): Promise<void> {
    const retryCount = Number(job.retryCount || 0) + 1;
    const maxRetries = Number(job.maxRetries || DEFAULT_MAX_RETRIES);
    const exhausted = retryCount >= maxRetries;
    await this.jobRepo.update(job.id, {
      status: 'FAILED',
      retryCount,
      nextRetryAt: exhausted ? null : new Date(Date.now() + this.backoffMs(retryCount)),
      lastError: message,
    });
  }

  private async ensureJob(attemptId: number): Promise<IatReportJob> {
    const existing = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (existing) return existing;
    try {
      return await this.jobRepo.save(
        this.jobRepo.create({
          assessmentAttemptId: attemptId,
          status: 'PENDING',
          retryCount: 0,
          maxRetries: DEFAULT_MAX_RETRIES,
        }),
      );
    } catch (err) {
      // Concurrent enqueue/worker created it first — return the existing row.
      if ((err as { code?: string })?.code !== '23505') throw err;
      const row = await this.jobRepo.findOne({
        where: { assessmentAttemptId: attemptId },
      });
      if (row) return row;
      throw err;
    }
  }

  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category: 'iat', settingKey: key },
      });
      const value = row?.value;
      return value === null || value === undefined ? fallback : (value as T);
    } catch {
      return fallback;
    }
  }

  private backoffMs(retryCount: number): number {
    const minutes = Math.min(60, Math.max(1, 2 ** (retryCount - 1)));
    return minutes * 60 * 1000;
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

  private defaultSkillPrompt(): string {
    return [
      'You are a senior leadership coach and trusted mentor who understands Indian corporate culture and MBA career development.',
      'Write a deeply personal, honest, actionable report as a letter from a trusted senior mentor based on the supplied JSON.',
      'Use exactly these sections: SECTION 1 — OPENING, SECTION 2 — YOUR BIAS MAP, SECTION 3 — YOUR LEADERSHIP SHADOW, SECTION 4 — YOUR 90 DAY RESET.',
      'Write flowing prose only, no bullet points. Keep paragraphs short.',
      'Never use the word caste. Never use D-score, IAT, implicit association, or technical assessment language.',
      'Do not say "your results show"; prefer "your responses revealed" or "when these words appeared".',
      'Ground observations in Indian corporate reality and frame every bias as a career opportunity, not a character flaw.',
    ].join('\n');
  }
}
