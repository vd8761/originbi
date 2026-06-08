import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  MetaphorTranscriptionJob,
  MetaphorTranslationJob,
  OriginbiSetting,
} from '@originbi/shared-entities';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import {
  METAPHOR_TRANSCRIBE_QUEUE,
  METAPHOR_TRANSLATE_QUEUE,
} from './metaphor.constants';
import { MetaphorGenerationService } from './metaphor-generation.service';
import { R2Service } from '../r2/r2.service';
import { MetaphorReportService } from './metaphor-report.service';

export interface MetaphorConfig {
  questionCount: number;
  allowTyping: boolean;
  durationOverride: boolean;
  durationMinutes: number;
  audioTranscriptionEnabled: boolean;
  supportedLanguages: unknown[];
  sttProvider: { provider: string; params?: Record<string, unknown> };
}

interface MetaphorQuestionRow {
  answer_id: number | string;
  seq: number | null;
  status: string;
  spoken_language: string | null;
  answer_text: string | null;
  question_id: number | string;
  image_url: string | null;
  image_desc_en: string | null;
  image_desc_ta: string | null;
  context_en: string | null;
  context_ta: string | null;
  question_en: string | null;
  question_ta: string | null;
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
    @InjectRepository(MetaphorTranscriptionJob)
    private readonly transcriptionJobRepo: Repository<MetaphorTranscriptionJob>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
    private readonly dataSource: DataSource,
    private readonly pgBoss: PgBossService,
    private readonly generation: MetaphorGenerationService,
    private readonly r2: R2Service,
    private readonly reports: MetaphorReportService,
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

  private async enqueueTranscription(attemptId: number): Promise<void> {
    try {
      await this.pgBoss.boss.send(METAPHOR_TRANSCRIBE_QUEUE, { attemptId });
    } catch (e) {
      this.logger.warn(
        `[Metaphor] enqueue transcription failed for attempt ${attemptId} (sweep will retry): ${
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

  async retryReport(attemptId: number) {
    return this.reports.manualRetry(attemptId);
  }

  // ---- settings (with safe defaults) ----
  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category: 'metaphor', settingKey: key },
      });
      const value = row?.value as unknown;
      return value === null || value === undefined ? fallback : (value as T);
    } catch {
      return fallback;
    }
  }

  async getConfig(): Promise<MetaphorConfig> {
    return {
      questionCount: Number(await this.readSetting('question_count', 20)),
      allowTyping: Boolean(await this.readSetting('allow_typing', false)),
      durationOverride: Boolean(
        await this.readSetting('duration_override', false),
      ),
      durationMinutes: Number(await this.readSetting('duration_minutes', 20)),
      audioTranscriptionEnabled: Boolean(
        await this.readSetting('audio_transcription_enabled', true),
      ),
      supportedLanguages: await this.readSetting<unknown[]>(
        'supported_languages',
        [],
      ),
      sttProvider: await this.readSetting<{
        provider: string;
        params?: Record<string, unknown>;
      }>('stt_provider', { provider: 'web_speech', params: {} }),
    };
  }

  /** STT config for the browser. Cloud providers get a short-lived token minted
   *  server-side (added per-provider); web_speech needs none. */
  async getSttConfig(): Promise<{
    provider: string;
    params: Record<string, unknown>;
    token: string | null;
  }> {
    const cfg = await this.readSetting<{
      provider: string;
      params?: Record<string, unknown>;
    }>('stt_provider', { provider: 'web_speech', params: {} });
    // TODO(provider): mint ephemeral token for elevenlabs/azure/etc using the
    // server-side 'stt_secret' setting. web_speech needs no token.
    return { provider: cfg.provider, params: cfg.params || {}, token: null };
  }

  private readonly QUESTIONS_SQL = `SELECT a.id              AS answer_id,
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
       ORDER BY a.question_sequence ASC`;

  /** The candidate's generated questions for an attempt + page config. Resumable. */
  async getQuestionsForAttempt(attemptId: number) {
    let rows = (await this.dataSource.query(this.QUESTIONS_SQL, [
      attemptId,
    ])) as unknown as MetaphorQuestionRow[];

    // Lazy generation: if this Level-3 attempt has no questions yet (e.g. the
    // level was enabled AFTER registration and the exam-engine created the
    // attempt on the fly), generate them now, then re-query.
    if (!rows || rows.length === 0) {
      const attempt = await this.attemptRepo.findOne({
        where: { id: attemptId },
      });
      if (attempt) {
        try {
          await this.generation.generate(
            {
              id: Number(attempt.id),
              assessmentSessionId: attempt.assessmentSessionId ?? null,
              userId: attempt.userId ?? null,
              registrationId: attempt.registrationId ?? null,
              programId: attempt.programId ?? null,
              assessmentLevelId: attempt.assessmentLevelId ?? null,
            },
            this.dataSource.manager,
          );
          rows = (await this.dataSource.query(this.QUESTIONS_SQL, [
            attemptId,
          ])) as unknown as MetaphorQuestionRow[];
        } catch (e) {
          this.logger.warn(
            `[Metaphor] lazy generation failed for attempt ${attemptId}: ${
              (e as Error)?.message
            }`,
          );
        }
      }
    }

    return this.buildQuestionsResponse(rows);
  }

  private async buildQuestionsResponse(rows: MetaphorQuestionRow[]) {
    const config = await this.getConfig();
    // Images are stored as a relative path ("/assets/images/<set>.<q>.webp");
    // the origin is admin-configurable so the whole library can be repointed.
    const imageBase = String(
      await this.readSetting('image_base_url', ''),
    ).replace(/\/+$/, '');
    const buildImageUrl = (p: string | null): string | null => {
      if (!p) return null;
      if (/^https?:\/\//i.test(p)) return p; // already absolute
      if (!imageBase) return p; // relative fallback (served from app origin)
      return `${imageBase}${p.startsWith('/') ? '' : '/'}${p}`;
    };
    return {
      config,
      total: rows.length,
      questions: rows.map((r) => ({
        answerId: Number(r.answer_id),
        questionId: Number(r.question_id),
        sequence: r.seq,
        status: r.status,
        answered: r.status === 'ANSWERED',
        spokenLanguage: r.spoken_language,
        savedAnswer: r.answer_text || '',
        imageUrl: buildImageUrl(r.image_url),
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
    audioBuffer?: Buffer;
    audioMimeType?: string;
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
    const audioTranscriptionEnabled = Boolean(
      await this.readSetting('audio_transcription_enabled', true),
    );
    const previousAudioKey = row.audioStorageKey;
    row.answerTextOriginal = dto.answerText ?? '';
    row.answerTextWeb = dto.answerText ?? '';
    row.spokenLanguage = dto.spokenLanguage ?? row.spokenLanguage;
    row.transcriptionSource = 'web';
    row.transcriptionError = null;
    row.status = 'ANSWERED';
    // Mark for translation only if there is text; empty answers stay NONE.
    row.translationStatus = (dto.answerText || '').trim() ? 'PENDING' : 'NONE';
    row.transcriptionStatus = 'NONE';
    row.audioStorageKey = null;
    await this.answerRepo.save(row);

    if (audioTranscriptionEnabled && dto.audioBuffer?.length) {
      const key = `metaphor-audio/${dto.attemptId}/${row.id}.webm`;
      try {
        await this.r2.uploadBuffer(
          key,
          dto.audioBuffer,
          dto.audioMimeType || 'audio/webm',
        );
        row.audioStorageKey = key;
        row.transcriptionStatus = 'PENDING';
        row.transcriptionError = null;
        await this.answerRepo.save(row);
      } catch (err) {
        this.logger.warn(
          `[Metaphor] audio upload failed for answer ${row.id}; using web transcript: ${
            (err as Error)?.message
          }`,
        );
        row.audioStorageKey = null;
        row.transcriptionStatus = 'NONE';
        await this.answerRepo.save(row);
      }
    }
    if (previousAudioKey && previousAudioKey !== row.audioStorageKey) {
      try {
        await this.r2.deleteFile(previousAudioKey);
      } catch {
        /* best-effort stale clip cleanup */
      }
    }
    return { success: true };
  }

  /** Finish the Level 3 attempt: mark complete + queue translation (PENDING job;
   *  the worker sweep picks it up). */
  async finishAttempt(attemptId: number) {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
    });
    if (!attempt) throw new BadRequestException('Attempt not found.');

    attempt.status = 'COMPLETED';
    attempt.completedAt = new Date();
    await this.attemptRepo.save(attempt);
    await this.completeSessionIfAllMandatoryAttemptsDone(attempt);

    const translationPendingCount = await this.answerRepo.count({
      where: { assessmentAttemptId: attemptId, translationStatus: 'PENDING' },
    });
    const transcriptionPendingCount = await this.answerRepo.count({
      where: { assessmentAttemptId: attemptId, transcriptionStatus: 'PENDING' },
    });
    const audioTranscriptionEnabled = Boolean(
      await this.readSetting('audio_transcription_enabled', true),
    );

    if (audioTranscriptionEnabled && transcriptionPendingCount > 0) {
      let transcriptionJob = await this.transcriptionJobRepo.findOne({
        where: { assessmentAttemptId: attemptId },
      });
      if (!transcriptionJob) {
        transcriptionJob = this.transcriptionJobRepo.create({
          assessmentAttemptId: attemptId,
          status: 'PENDING',
          total: transcriptionPendingCount,
          transcribed: 0,
        });
      } else {
        transcriptionJob.status = 'PENDING';
        transcriptionJob.total = transcriptionPendingCount;
      }
      await this.transcriptionJobRepo.save(transcriptionJob);
      await this.enqueueTranscription(attemptId);

      return {
        success: true,
        translationsPending: translationPendingCount,
        transcriptionsPending: transcriptionPendingCount,
      };
    }

    let job = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (!job) {
      job = this.jobRepo.create({
        assessmentAttemptId: attemptId,
        status: translationPendingCount > 0 ? 'PENDING' : 'DONE',
        total: translationPendingCount,
        translated: 0,
      });
    } else {
      job.status = translationPendingCount > 0 ? 'PENDING' : 'DONE';
      job.total = translationPendingCount;
    }
    await this.jobRepo.save(job);

    if (translationPendingCount > 0) await this.enqueueTranslation(attemptId);
    else await this.reports.enqueueIfReady(attemptId);

    return { success: true, translationsPending: translationPendingCount };
  }

  private async completeSessionIfAllMandatoryAttemptsDone(
    attempt: AssessmentAttempt,
  ): Promise<void> {
    const sessionId = Number(attempt.assessmentSessionId);
    if (!sessionId) return;

    const mandatoryLevels = await this.levelRepo.find({
      where: { isMandatory: true },
    });
    if (!mandatoryLevels.length) return;

    const mandatoryLevelIds = mandatoryLevels.map((level) => Number(level.id));
    const attempts = await this.attemptRepo.find({
      where: { assessmentSessionId: sessionId },
    });
    const attemptsByLevelId = new Map(
      attempts.map((row) => [Number(row.assessmentLevelId), row]),
    );

    const allMandatoryAttemptsDone = mandatoryLevelIds.every((levelId) => {
      const levelAttempt = attemptsByLevelId.get(levelId);
      return levelAttempt?.status === 'COMPLETED';
    });
    if (!allMandatoryAttemptsDone) return;

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session || session.status === 'COMPLETED') return;

    session.status = 'COMPLETED';
    session.completedAt = new Date();
    await this.sessionRepo.save(session);
  }
}
