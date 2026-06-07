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

    const chosenSet = sets[Math.floor(Math.random() * sets.length)];
    const questions = await manager
      .createQueryBuilder(MetaphorQuestion, 'mq')
      .where('mq.is_active = true')
      .andWhere('mq.is_deleted = false')
      .andWhere('mq.set_number = :sn', { sn: chosenSet })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
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
    this.logger.log(
      `[Metaphor] Generated ${rows.length} questions (set ${chosenSet}) for attempt ${attempt.id}.`,
    );
  }
}
