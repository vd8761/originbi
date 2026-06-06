import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { firstValueFrom } from 'rxjs';
import { In, IsNull, Not, Repository } from 'typeorm';
import {
  AiUsageLog,
  MetaphorAnswer,
  MetaphorTranscriptionJob,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { R2Service } from '../r2/r2.service';
import { METAPHOR_TRANSLATE_QUEUE } from './metaphor.constants';

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_TRANSCRIPTION_RETRIES = 5;

@Injectable()
export class MetaphorTranscriptionService {
  private readonly logger = new Logger(MetaphorTranscriptionService.name);

  constructor(
    @InjectRepository(MetaphorAnswer)
    private readonly answerRepo: Repository<MetaphorAnswer>,
    @InjectRepository(MetaphorTranscriptionJob)
    private readonly jobRepo: Repository<MetaphorTranscriptionJob>,
    @InjectRepository(AiUsageLog)
    private readonly usageRepo: Repository<AiUsageLog>,
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    private readonly r2: R2Service,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly pgBoss: PgBossService,
  ) {}

  async transcribeAttempt(attemptId: number): Promise<void> {
    const job = await this.ensureJob(attemptId);
    await this.jobRepo.update(job.id, { status: 'PROCESSING', lastError: null });

    const pending = await this.answerRepo
      .createQueryBuilder('a')
      .where('a.assessment_attempt_id = :attemptId', { attemptId })
      .andWhere('a.transcription_status = :status', { status: 'PENDING' })
      .andWhere('a.audio_storage_key IS NOT NULL')
      .andWhere('(a.transcription_next_retry_at IS NULL OR a.transcription_next_retry_at <= NOW())')
      .orderBy('a.question_sequence', 'ASC')
      .getMany();

    if (pending.length === 0) {
      await this.completeIfTerminal(attemptId, job.id);
      return;
    }

    const apiKey =
      String(await this.readSetting('gemini_api_key', '') || '').trim() ||
      this.config.get<string>('GEMINI_API_KEY') ||
      '';
    if (!apiKey) {
      const msg = 'Gemini API key is not configured.';
      await this.jobRepo.update(job.id, { status: 'FAILED', lastError: msg });
      throw new Error(msg);
    }

    const model =
      String(await this.readSetting('gemini_model', DEFAULT_GEMINI_MODEL) || '').trim() ||
      DEFAULT_GEMINI_MODEL;

    for (const answer of pending) {
      await this.answerRepo.update(answer.id, {
        transcriptionStatus: 'PROCESSING',
        transcriptionError: null,
        transcriptionLastAttemptAt: new Date(),
      });
      try {
        const buffer = await this.r2.getObjectBuffer(answer.audioStorageKey);
        const { transcript, usage } = await this.callGemini({
          apiKey,
          model,
          buffer,
          spokenLanguage: answer.spokenLanguage || 'unknown',
        });
        await this.usageRepo.insert({
          purpose: 'metaphor_transcription',
          assessmentAttemptId: attemptId,
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          questionCount: 1,
          questionIds: [answer.id],
          status: 'DONE',
        });
        let deletedAudio = false;
        try {
          await this.r2.deleteFile(answer.audioStorageKey);
          deletedAudio = true;
        } catch (deleteErr) {
          this.logger.warn(
            `[Metaphor] Transcript saved but R2 delete failed for ${answer.audioStorageKey}: ${this.errorMessage(
              deleteErr,
            )}`,
          );
        }
        await this.answerRepo.update(answer.id, {
          answerTextOriginal: transcript,
          transcriptionSource: 'gemini',
          transcriptionStatus: 'DONE',
          transcriptionError: null,
          transcriptionRetryCount: 0,
          transcriptionNextRetryAt: null,
          transcriptionLastAttemptAt: new Date(),
          translationStatus: transcript.trim() ? 'PENDING' : 'NONE',
          audioStorageKey: deletedAudio ? null : answer.audioStorageKey,
        });
      } catch (err) {
        const message = this.errorMessage(err);
        await this.usageRepo.insert({
          purpose: 'metaphor_transcription',
          assessmentAttemptId: attemptId,
          model,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          questionCount: 1,
          questionIds: [answer.id],
          status: 'FAILED',
          error: message,
        });
        const retryCount = Number(answer.transcriptionRetryCount || 0) + 1;
        if (retryCount >= MAX_TRANSCRIPTION_RETRIES) {
          const fallback = String(answer.answerTextWeb || answer.answerTextOriginal || '').trim();
          let deletedAudio = false;
          if (answer.audioStorageKey) {
            try {
              await this.r2.deleteFile(answer.audioStorageKey);
              deletedAudio = true;
            } catch (deleteErr) {
              this.logger.warn(
                `[Metaphor] Final fallback set but R2 delete failed for ${answer.audioStorageKey}: ${this.errorMessage(
                  deleteErr,
                )}`,
              );
            }
          }
          await this.answerRepo.update(answer.id, {
            answerTextOriginal: fallback,
            transcriptionStatus: 'FAILED',
            transcriptionError: message,
            transcriptionSource: 'web',
            transcriptionRetryCount: retryCount,
            transcriptionNextRetryAt: null,
            transcriptionLastAttemptAt: new Date(),
            translationStatus: fallback ? 'PENDING' : 'NONE',
            audioStorageKey: deletedAudio ? null : answer.audioStorageKey,
          });
        } else {
          await this.answerRepo.update(answer.id, {
            transcriptionStatus: 'PENDING',
            transcriptionError: message,
            transcriptionSource: answer.transcriptionSource || 'web',
            transcriptionRetryCount: retryCount,
            transcriptionNextRetryAt: new Date(Date.now() + this.backoffMs(retryCount)),
            transcriptionLastAttemptAt: new Date(),
          });
        }
        this.logger.warn(
          `[Metaphor] Gemini transcription failed for answer ${answer.id} (retry ${retryCount}/${MAX_TRANSCRIPTION_RETRIES}): ${message}`,
        );
      }
    }

    await this.completeIfTerminal(attemptId, job.id);
  }

  private async callGemini(args: {
    apiKey: string;
    model: string;
    buffer: Buffer;
    spokenLanguage: string;
  }): Promise<{
    transcript: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      args.model,
    )}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
    const prompt =
      `Transcribe this speech verbatim. The speaker may mix English with ${args.spokenLanguage}. ` +
      `Write each word in the language it was actually spoken. Use the native script for native-language words. ` +
      `Output only the transcript, with no commentary.`;

    const res = await firstValueFrom(
      this.http.post(
        url,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'audio/webm',
                    data: args.buffer.toString('base64'),
                  },
                },
              ],
            },
          ],
        },
        { timeout: 120000 },
      ),
    );

    const data: any = res.data;
    const transcript = String(
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
    ).trim();
    if (!transcript) throw new Error('Gemini returned an empty transcript.');

    const usage = data?.usageMetadata || {};
    return {
      transcript,
      usage: {
        inputTokens: Number(usage.promptTokenCount || 0),
        outputTokens: Number(usage.candidatesTokenCount || 0),
        totalTokens: Number(usage.totalTokenCount || 0),
      },
    };
  }

  private async completeIfTerminal(attemptId: number, jobId: number): Promise<void> {
    const total = await this.answerRepo.count({
      where: {
        assessmentAttemptId: attemptId,
        transcriptionStatus: In(['PENDING', 'PROCESSING', 'DONE', 'FAILED']),
      },
    });
    const transcribed = await this.answerRepo.count({
      where: {
        assessmentAttemptId: attemptId,
        transcriptionStatus: In(['DONE', 'FAILED']),
      },
    });
    const retryable = await this.answerRepo.count({
      where: {
        assessmentAttemptId: attemptId,
        transcriptionStatus: In(['PENDING', 'PROCESSING']),
        audioStorageKey: Not(IsNull()),
      },
    });

    await this.jobRepo.update(jobId, {
      total,
      transcribed,
      status: retryable > 0 ? 'PENDING' : 'DONE',
      lastError: retryable > 0 ? `${retryable} answer(s) still need transcription.` : null,
    });

    if (retryable > 0) {
      return;
    }

    await this.pgBoss.boss.send(METAPHOR_TRANSLATE_QUEUE, { attemptId });
    this.logger.log(
      `[Metaphor] Transcription complete for attempt ${attemptId}; translation queued.`,
    );
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

  private async ensureJob(attemptId: number): Promise<MetaphorTranscriptionJob> {
    let job = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (!job) {
      job = this.jobRepo.create({
        assessmentAttemptId: attemptId,
        status: 'PENDING',
        total: 0,
        transcribed: 0,
      });
      job = await this.jobRepo.save(job);
    }
    return job;
  }

  private backoffMs(retryCount: number): number {
    const minutes = Math.min(60, Math.max(1, 2 ** (retryCount - 1)));
    return minutes * 60 * 1000;
  }

  private errorMessage(err: unknown): string {
    if (!err) return 'Unknown error';
    const anyErr = err as any;
    const apiMessage =
      anyErr?.response?.data?.error?.message ||
      anyErr?.response?.data?.message ||
      anyErr?.message;
    return String(apiMessage || err).slice(0, 2000);
  }
}
