import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  OriginbiSetting,
} from '@originbi/shared-entities';

/** Minimal attempt shape (structural — works with any AssessmentAttempt entity). */
export interface MetaphorAttemptCtx {
  id: number;
  assessmentSessionId?: number | null;
  userId?: number | null;
  registrationId?: number | null;
  programId?: number | null;
  assessmentLevelId?: number | null;
}

/**
 * Level 3 (Metaphor) question generation for admin-registered candidates.
 * Mirrors the student-service generator. Gated + skip-silently: if there is no
 * active metaphor bank it does nothing, so it never affects Level 1/2.
 */
@Injectable()
export class MetaphorGenerationService {
  private readonly logger = new Logger(MetaphorGenerationService.name);

  async generate(
    attempt: MetaphorAttemptCtx,
    manager: EntityManager,
  ): Promise<void> {
    // ── Guard: skip if questions were already generated for this attempt ──
    const existingCount = await manager.count(MetaphorAnswer, {
      where: { assessmentAttemptId: attempt.id },
    });
    if (existingCount > 0) {
      this.logger.log(
        `[Metaphor] Attempt ${attempt.id} already has ${existingCount} questions — skipping duplicate generation.`,
      );
      return;
    }

    let count = 20;
    try {
      const setting = await manager.findOne(OriginbiSetting, {
        where: { category: 'metaphor', settingKey: 'question_count' },
      });
      const v = setting?.value;
      if (typeof v === 'number' && v > 0) count = Math.floor(v);
    } catch {
      /* default */
    }

    // Question selection mode: 'random_single_set' (default) or 'random_all_sets'.
    let selectionMode = 'random_single_set';
    try {
      const modeSetting = await manager.findOne(OriginbiSetting, {
        where: { category: 'metaphor', settingKey: 'question_selection_mode' },
      });
      const modeVal = modeSetting?.value;
      if (modeVal === 'random_all_sets') selectionMode = 'random_all_sets';
    } catch {
      /* default random_single_set */
    }

    const setsRaw = await manager
      .createQueryBuilder(MetaphorQuestion, 'mq')
      .select('DISTINCT mq.set_number', 'setNumber')
      .where('mq.is_active = true')
      .andWhere('mq.is_deleted = false')
      .getRawMany<{ setNumber: number }>();
    const sets = setsRaw.map((s) => s.setNumber);
    if (sets.length === 0) {
      this.logger.warn(
        `[Metaphor] No active metaphor questions — skipping generation for attempt ${attempt.id}.`,
      );
      return;
    }

    let questions: MetaphorQuestion[];

    if (selectionMode === 'random_all_sets') {
      // Pick random N questions from ALL active sets combined.
      questions = await manager
        .createQueryBuilder(MetaphorQuestion, 'mq')
        .where('mq.is_active = true')
        .andWhere('mq.is_deleted = false')
        .orderBy('RANDOM()')
        .limit(count)
        .getMany();
    } else {
      // Default: pick a random set, then pick random N from that set.
      const chosenSet = sets[Math.floor(Math.random() * sets.length)];
      questions = await manager
        .createQueryBuilder(MetaphorQuestion, 'mq')
        .where('mq.is_active = true')
        .andWhere('mq.is_deleted = false')
        .andWhere('mq.set_number = :sn', { sn: chosenSet })
        .orderBy('RANDOM()')
        .limit(count)
        .getMany();
    }

    if (questions.length === 0) return;

    const rows: Partial<MetaphorAnswer>[] = questions.map((q, i) => ({
      assessmentAttemptId: attempt.id,
      assessmentSessionId: attempt.assessmentSessionId ?? null,
      userId: attempt.userId ?? null,
      registrationId: attempt.registrationId ?? null,
      programId: attempt.programId ?? null,
      assessmentLevelId: attempt.assessmentLevelId ?? null,
      metaphorQuestionId: q.id,
      questionSequence: i + 1,
      translationStatus: 'NONE',
      status: 'NOT_ANSWERED',
    }));
    await manager.getRepository(MetaphorAnswer).insert(rows);
    const modeLabel = selectionMode === 'random_all_sets' ? 'all sets' : `set ${questions[0]?.setNumber ?? '?'}`;
    this.logger.log(
      `[Metaphor] Generated ${rows.length} questions (${modeLabel}) for attempt ${attempt.id}.`,
    );
  }
}
