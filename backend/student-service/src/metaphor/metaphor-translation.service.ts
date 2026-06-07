import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import {
  AiUsageLog,
  MetaphorAnswer,
  MetaphorTranslationJob,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { MetaphorReportService } from './metaphor-report.service';

const DEFAULT_MODEL = 'gemini-2.0-flash';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Translates a Level-3 attempt's answers to English in one batched Gemini call,
 * stores the English text, and logs token usage. Idempotent per attempt: only
 * rows still needing translation are sent; success requires all to be done.
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
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    private readonly http: HttpService,
    private readonly reports: MetaphorReportService,
  ) {}

  /** Translate everything pending for one attempt. Throws on failure so the
   * queue retries; the job row reflects PROCESSING/DONE/FAILED. */
  async translateAttempt(attemptId: number): Promise<void> {
    const job = await this.ensureJob(attemptId);
    await this.jobRepo.update(job.id, {
      status: 'PROCESSING',
      lastError: null,
    });

    const pending = await this.answerRepo.find({
      where: { assessmentAttemptId: attemptId, translationStatus: 'PENDING' },
      order: { questionSequence: 'ASC' },
    });

    if (pending.length === 0) {
      await this.jobRepo.update(job.id, {
        status: 'DONE',
        translated: job.translated,
      });
      await this.reports.enqueueIfReady(attemptId);
      return;
    }

    const apiKey =
      String((await this.readSetting('gemini_api_key', '')) || '').trim() ||
      process.env.GEMINI_API_KEY ||
      '';
    if (!apiKey) {
      const msg = 'Gemini API key not configured - cannot translate.';
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }

    const model =
      String(
        (await this.readSetting('gemini_model', DEFAULT_MODEL)) || '',
      ).trim() || DEFAULT_MODEL;

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
    let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await firstValueFrom(
        this.http.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          },
          { timeout: 120000 },
        ),
      );
      const data = res.data as GeminiResponse;
      respText = String(
        data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
      ).trim();
      const usageMetadata = data.usageMetadata || {};
      usage = {
        inputTokens: Number(usageMetadata.promptTokenCount || 0),
        outputTokens: Number(usageMetadata.candidatesTokenCount || 0),
        totalTokens: Number(usageMetadata.totalTokenCount || 0),
      };
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: { error?: { message?: string } };
        };
        message?: string;
      };
      const fallback =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Unknown error';
      const msg = `Gemini translation API call failed: ${
        apiErr?.response?.data?.error?.message || apiErr?.message || fallback
      }`;
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }

    await this.usageRepo.insert({
      purpose: 'metaphor_translation',
      assessmentAttemptId: attemptId,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      questionCount: pending.length,
      questionIds: pending.map((p) => p.id),
      status: 'DONE',
    });

    let parsed: { id: number; en: string }[];
    try {
      const clean = respText
        .replace(/^```(json)?/i, '')
        .replace(/```$/, '')
        .trim();
      parsed = JSON.parse(clean) as { id: number; en: string }[];
      if (!Array.isArray(parsed)) throw new Error('not an array');
    } catch (e) {
      const msg = `Failed to parse Gemini translation JSON response: ${
        (e as Error).message
      }`;
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
      const msg = `${stillPending} answer(s) missing from Gemini response - will retry.`;
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
    await this.reports.enqueueIfReady(attemptId);
    this.logger.log(
      `[Metaphor] Translated ${done} answers for attempt ${attemptId}.`,
    );
  }

  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category: 'metaphor', settingKey: key },
      });
      const v = row?.value as unknown;
      return v === null || v === undefined ? fallback : (v as T);
    } catch {
      return fallback;
    }
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
