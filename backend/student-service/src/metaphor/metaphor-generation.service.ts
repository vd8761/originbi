import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  MetaphorQuestion,
  MetaphorAnswer,
  AssessmentAttempt,
  OriginbiSetting,
} from '@originbi/shared-entities';

/**
 * Generates the candidate's Level 3 (Metaphor) questions for an attempt.
 *
 * Isolation: this is ONLY invoked when the attempt's level is Metaphor. If the
 * metaphor bank is empty it **skips silently** (like Level 2) — it never blocks
 * the main registration / Level 1 flow.
 */
@Injectable()
export class MetaphorGenerationService {
  private readonly logger = new Logger(MetaphorGenerationService.name);

  async generate(attempt: AssessmentAttempt, manager: EntityManager): Promise<void> {
    // How many questions to show (admin setting, default 20).
    let count = 20;
    try {
      const setting = await manager.findOne(OriginbiSetting, {
        where: { category: 'metaphor', settingKey: 'question_count' },
      });
      const v = setting?.value;
      if (typeof v === 'number' && v > 0) count = Math.floor(v);
    } catch {
      /* default 20 */
    }

    // Distinct active sets in the bank.
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
      return; // skip silently — never blocks the main flow
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
      assessmentSessionId: attempt.assessmentSessionId,
      userId: attempt.userId,
      registrationId: attempt.registrationId,
      programId: attempt.programId,
      assessmentLevelId: attempt.assessmentLevelId,
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
