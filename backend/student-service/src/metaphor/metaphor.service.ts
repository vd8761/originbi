import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  MetaphorTranslationJob,
  AssessmentAttempt,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { METAPHOR_TRANSLATE_QUEUE } from './metaphor.constants';

export interface MetaphorConfig {
  questionCount: number;
  allowTyping: boolean;
  durationOverride: boolean;
  durationMinutes: number;
  checkpointLabel: string;
  segmentLimit: number;
  limitBehavior: string;
  supportedLanguages: any[];
  sttProvider: { provider: string; params?: any };
}

@Injectable()
export class MetaphorService {
  private readonly logger = new Logger(MetaphorService.name);

  constructor(
    @InjectRepository(MetaphorQuestion)
    private readonly questionRepo: Repository<MetaphorQuestion>,
    @InjectRepository(MetaphorAnswer)
    private readonly answerRepo: Repository<MetaphorAnswer>,
    @InjectRepository(MetaphorTranslationJob)
    private readonly jobRepo: Repository<MetaphorTranslationJob>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    private readonly dataSource: DataSource,
    private readonly pgBoss: PgBossService,
  ) {}

  /** Enqueue a translation job for an attempt (best-effort; the sweep is the safety net). */
  private async enqueueTranslation(attemptId: number): Promise<void> {
    try {
      await this.pgBoss.boss.send(METAPHOR_TRANSLATE_QUEUE, { attemptId });
    } catch (e) {
      this.logger.warn(
        `[Metaphor] enqueue translation failed for attempt ${attemptId} (sweep will retry): ${
          (e as Error)?.message
        }`,
      );
    }
  }

  /** Manual (admin) re-translate trigger. */
  async translateNow(attemptId: number) {
    await this.enqueueTranslation(attemptId);
    return { success: true, queued: true };
  }

  // ---- settings (with safe defaults) ----
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

  async getConfig(): Promise<MetaphorConfig> {
    return {
      questionCount: Number(await this.readSetting('question_count', 20)),
      allowTyping: Boolean(await this.readSetting('allow_typing', false)),
      durationOverride: Boolean(await this.readSetting('duration_override', false)),
      durationMinutes: Number(await this.readSetting('duration_minutes', 20)),
      checkpointLabel: String(await this.readSetting('checkpoint_label', 'Capture')),
      segmentLimit: Number(await this.readSetting('segment_limit', 5)),
      limitBehavior: String(await this.readSetting('limit_behavior', 'disable')),
      supportedLanguages: await this.readSetting<any[]>('supported_languages', []),
      sttProvider: await this.readSetting<{ provider: string; params?: any }>(
        'stt_provider',
        { provider: 'web_speech', params: {} },
      ),
    };
  }

  /** STT config for the browser. Cloud providers get a short-lived token minted
   *  server-side (added per-provider); web_speech needs none. */
  async getSttConfig(): Promise<{ provider: string; params: any; token: string | null }> {
    const cfg = await this.readSetting<{ provider: string; params?: any }>(
      'stt_provider',
      { provider: 'web_speech', params: {} },
    );
    // TODO(provider): mint ephemeral token for elevenlabs/azure/etc using the
    // server-side 'stt_secret' setting. web_speech needs no token.
    return { provider: cfg.provider, params: cfg.params || {}, token: null };
  }

  /** The candidate's generated questions for an attempt + page config. Resumable. */
  async getQuestionsForAttempt(attemptId: number) {
    const rows = await this.dataSource.query(
      `SELECT a.id              AS answer_id,
              a.question_sequence AS seq,
              a.status           AS status,
              a.spoken_language  AS spoken_language,
              a.answer_text_original AS answer_text,
              q.id               AS question_id,
              q.image_url        AS image_url,
              q.image_description_en AS image_desc_en,
              q.image_description_ta AS image_desc_ta,
              q.context_text_en  AS context_en,
              q.context_text_ta  AS context_ta,
              q.question_text_en AS question_en,
              q.question_text_ta AS question_ta
       FROM metaphor_answers a
       JOIN metaphor_questions q ON a.metaphor_question_id = q.id
       WHERE a.assessment_attempt_id = $1
       ORDER BY a.question_sequence ASC`,
      [attemptId],
    );

    const config = await this.getConfig();
    return {
      config,
      total: rows.length,
      questions: rows.map((r: any) => ({
        answerId: Number(r.answer_id),
        questionId: Number(r.question_id),
        sequence: r.seq,
        status: r.status,
        answered: r.status === 'ANSWERED',
        spokenLanguage: r.spoken_language,
        savedAnswer: r.answer_text || '',
        imageUrl: r.image_url,
        imageDescEn: r.image_desc_en,
        imageDescTa: r.image_desc_ta,
        contextEn: r.context_en,
        contextTa: r.context_ta,
        questionEn: r.question_en,
        questionTa: r.question_ta,
      })),
    };
  }

  /** Save one question's answer (the final assembled transcript). Upsert by attempt+question. */
  async saveAnswer(dto: {
    attemptId: number;
    metaphorQuestionId: number;
    spokenLanguage?: string;
    answerText: string;
  }) {
    const row = await this.answerRepo.findOne({
      where: {
        assessmentAttemptId: dto.attemptId,
        metaphorQuestionId: dto.metaphorQuestionId,
      },
    });
    if (!row) {
      throw new BadRequestException(
        'Metaphor answer slot not found for this attempt/question.',
      );
    }
    row.answerTextOriginal = dto.answerText ?? '';
    row.spokenLanguage = dto.spokenLanguage ?? row.spokenLanguage;
    row.status = 'ANSWERED';
    // Mark for translation only if there is text; empty answers stay NONE.
    row.translationStatus = (dto.answerText || '').trim() ? 'PENDING' : 'NONE';
    await this.answerRepo.save(row);
    return { success: true };
  }

  /** Finish the Level 3 attempt: mark complete + queue translation (PENDING job;
   *  the worker sweep picks it up). */
  async finishAttempt(attemptId: number) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) throw new BadRequestException('Attempt not found.');

    attempt.status = 'COMPLETED';
    (attempt as any).completedAt = new Date();
    await this.attemptRepo.save(attempt);

    const pendingCount = await this.answerRepo.count({
      where: { assessmentAttemptId: attemptId, translationStatus: 'PENDING' },
    });

    let job = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (!job) {
      job = this.jobRepo.create({
        assessmentAttemptId: attemptId,
        status: pendingCount > 0 ? 'PENDING' : 'DONE',
        total: pendingCount,
        translated: 0,
      });
    } else {
      job.status = pendingCount > 0 ? 'PENDING' : 'DONE';
      job.total = pendingCount;
    }
    await this.jobRepo.save(job);

    if (pendingCount > 0) await this.enqueueTranslation(attemptId);

    return { success: true, translationsPending: pendingCount };
  }
}
