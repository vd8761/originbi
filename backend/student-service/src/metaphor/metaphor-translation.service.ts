import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  MetaphorAnswer,
  MetaphorTranslationJob,
  AiUsageLog,
} from '@originbi/shared-entities';

const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Translates a Level-3 attempt's answers to English in ONE batched Claude call,
 * stores the English text, and logs token usage. Idempotent per attempt: only
 * rows still needing translation are sent; success requires ALL to be done.
 */
@Injectable()
export class MetaphorTranslationService {
  private readonly logger = new Logger(MetaphorTranslationService.name);

  constructor(
    @InjectRepository(MetaphorAnswer)
    private readonly answerRepo: Repository<MetaphorAnswer>,
    @InjectRepository(MetaphorTranslationJob)
    private readonly jobRepo: Repository<MetaphorTranslationJob>,
    @InjectRepository(AiUsageLog)
    private readonly usageRepo: Repository<AiUsageLog>,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  /** Translate everything pending for one attempt. Throws on failure so the
   *  queue retries; the job row reflects PROCESSING/DONE/FAILED. */
  async translateAttempt(attemptId: number): Promise<void> {
    const job = await this.ensureJob(attemptId);
    await this.jobRepo.update(job.id, { status: 'PROCESSING', lastError: null });

    const pending = await this.answerRepo.find({
      where: { assessmentAttemptId: attemptId, translationStatus: 'PENDING' },
      order: { questionSequence: 'ASC' },
    });

    if (pending.length === 0) {
      await this.jobRepo.update(job.id, { status: 'DONE', translated: job.translated });
      return;
    }

    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      const msg = 'ANTHROPIC_API_KEY not configured — cannot translate.';
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }
    const model = this.config.get<string>('CLAUDE_MODEL') || DEFAULT_MODEL;

    // Build batched input: id + source language + text.
    const items = pending.map((a) => ({
      id: a.id,
      source_language: a.spokenLanguage || 'unknown',
      text: a.answerTextOriginal || '',
    }));

    const prompt =
      `You are a precise translator. Translate each item's "text" into natural, ` +
      `faithful English. Preserve meaning and tone; do not add commentary. ` +
      `Return ONLY a JSON array, no prose, no code fences, in the form ` +
      `[{"id": <id>, "en": "<english translation>"}]. ` +
      `If a text is already English, return it as-is.\n\n` +
      `Items:\n${JSON.stringify(items)}`;

    let respText = '';
    let usage = { input_tokens: 0, output_tokens: 0 };
    try {
      const res = await firstValueFrom(
        this.http.post(
          CLAUDE_URL,
          {
            model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            timeout: 120000,
          },
        ),
      );
      const data: any = res.data;
      respText = (data?.content?.[0]?.text || '').trim();
      usage = data?.usage || usage;
    } catch (err: any) {
      const msg = `Claude API call failed: ${err?.message || err}`;
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }

    // Log usage regardless of parse outcome.
    await this.usageRepo.insert({
      purpose: 'metaphor_translation',
      assessmentAttemptId: attemptId,
      model,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      questionCount: pending.length,
      questionIds: pending.map((p) => p.id),
      status: 'DONE',
    });

    // Parse JSON (strip accidental code fences).
    let parsed: { id: number; en: string }[];
    try {
      const clean = respText.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) throw new Error('not an array');
    } catch (e) {
      const msg = `Failed to parse Claude JSON response: ${(e as Error).message}`;
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }

    const byId = new Map(parsed.map((p) => [String(p.id), p.en]));
    let done = 0;
    for (const a of pending) {
      const en = byId.get(String(a.id));
      if (en !== undefined && en !== null) {
        await this.answerRepo.update(a.id, {
          answerTextEn: String(en),
          translationStatus: 'DONE',
        });
        done++;
      }
    }

    const stillPending = pending.length - done;
    const translatedTotal = await this.answerRepo.count({
      where: { assessmentAttemptId: attemptId, translationStatus: 'DONE' },
    });

    if (stillPending > 0) {
      const msg = `${stillPending} answer(s) missing from Claude response — will retry.`;
      await this.jobRepo.update(job.id, {
        status: 'FAILED',
        translated: translatedTotal,
        lastError: msg,
      });
      throw new Error(msg);
    }

    await this.jobRepo.update(job.id, {
      status: 'DONE',
      translated: translatedTotal,
      lastError: null,
    });
    this.logger.log(`[Metaphor] Translated ${done} answers for attempt ${attemptId}.`);
  }

  private async ensureJob(attemptId: number): Promise<MetaphorTranslationJob> {
    let job = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (!job) {
      job = this.jobRepo.create({
        assessmentAttemptId: attemptId,
        status: 'PENDING',
        total: 0,
        translated: 0,
      });
      job = await this.jobRepo.save(job);
    }
    return job;
  }
}
