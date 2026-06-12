import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  AssessmentLevel,
  AssessmentQuestion,
  OpenQuestion,
  AssessmentAnswer,
  AssessmentAttempt,
  OriginbiSetting,
  Registration,
} from '@originbi/shared-entities';

/**
 * Per-program main-question generation mode, stored in originbi_settings
 * (category 'assessment', key 'question_generation_mode'). The stored value is
 * an object keyed by program id -> QuestionGenerationConfig.
 *
 *  - random_set_shuffled: pick ONE random set, then `count` questions in random
 *    order (the legacy behaviour).
 *  - random_set_ordered:  pick ONE random set, then the first `count` questions
 *    in their authored order (external_code / id ascending).
 *  - random_all_sets:     ignore set boundaries, pick `count` random questions
 *    across every set for the program/level.
 */
type QuestionGenerationMode =
  | 'random_set_shuffled'
  | 'random_set_ordered'
  | 'random_all_sets';

interface QuestionGenerationConfig {
  mode: QuestionGenerationMode;
  count: number;
}

const DEFAULT_GENERATION_CONFIG: QuestionGenerationConfig = {
  mode: 'random_set_shuffled',
  count: 40,
};

/**
 * One group within the admin-configurable open-question distribution.
 * Stored in originbi_settings (category 'assessment', key 'open_question_distribution').
 */
interface OpenQuestionGroup {
  questionType?: string | null; // open_questions.question_type to draw from; null/omitted = any
  count: number; // how many to pick from this group (configurable count shown in the exam)
  selection?: 'random' | 'set_random' | 'set_sequential'; // 'random' = N random of type; 'set_random' = pick one set then N random within; 'set_sequential' = one set in fixed order
}

@Injectable()
export class AssessmentGenerationService {
  private readonly logger = new Logger(AssessmentGenerationService.name);

  constructor(
    @InjectRepository(AssessmentLevel)
    private levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentQuestion)
    private questionRepo: Repository<AssessmentQuestion>,
    @InjectRepository(OpenQuestion)
    private openQuestionRepo: Repository<OpenQuestion>,
  ) {}

  /**
   * Generates Level 1 questions following the 2:1 pattern (2 Main : 1 Open).
   * Total 60 questions: 40 Main, 20 Open.
   *
   * @param attemptId ID of the assessment_attempt
   * @param programId Program ID (used to filter main questions)
   * @param manager Transactional entity manager
   */
  async generateLevel1Questions(
    attempt: AssessmentAttempt,
    manager: EntityManager,
  ) {
    this.logger.log(
      `Generating Level 1 questions for attempt ${attempt.id}, program ${attempt.programId}`,
    );

    // 1-3. Resolve the level (Entry/Medium/Executive) and pick the main
    // questions per the admin-configured per-program generation mode.
    const mainQuestions = await this.selectMainQuestions(manager, attempt);

    // 2. Fetch open questions per the admin-configurable distribution
    // (originbi_settings -> assessment.open_question_distribution).
    const openQuestions = await this.selectOpenQuestions(manager);

    // 3. Build the final order: all main questions, with the open/survey
    // questions SCATTERED at random positions among them (no fixed ratio —
    // they "appear anywhere in the exam").
    const answersToInsert: Partial<AssessmentAnswer>[] = [];
    let seq = 1;

    const ordered: Array<{ source: 'MAIN' | 'OPEN'; id: number }> =
      mainQuestions.map((q) => ({ source: 'MAIN' as const, id: q.id }));
    for (const oq of openQuestions) {
      const pos = Math.floor(Math.random() * (ordered.length + 1));
      ordered.splice(pos, 0, { source: 'OPEN', id: oq.id });
    }

    for (const item of ordered) {
      answersToInsert.push({
        assessmentAttemptId: attempt.id,
        assessmentSessionId: attempt.assessmentSessionId,
        userId: attempt.userId,
        registrationId: attempt.registrationId,
        programId: attempt.programId,
        assessmentLevelId: attempt.assessmentLevelId,
        questionSource: item.source,
        mainQuestionId: item.source === 'MAIN' ? item.id : undefined,
        openQuestionId: item.source === 'OPEN' ? item.id : undefined,
        questionSequence: seq++,
        questionOptionsOrder: JSON.stringify(this.shuffleOptions([1, 2, 3, 4])),
        status: 'NOT_ANSWERED',
      });
    }

    // 4. Bulk Insert
    if (answersToInsert.length > 0) {
      await manager.getRepository(AssessmentAnswer).insert(answersToInsert);
    }

    this.logger.log(
      `Generated ${answersToInsert.length} answers for attempt ${attempt.id}`,
    );
  }

  /**
   * Resolves the Employee difficulty level (Entry/Medium/Executive) stored on
   * the registration. Returns null for non-employee registrations (no board
   * filtering), so other programs keep their existing behaviour.
   */
  private async resolveEmployeeLevel(
    manager: EntityManager,
    attempt: AssessmentAttempt,
  ): Promise<string | null> {
    if (!attempt.registrationId) return null;
    const registration = await manager.findOne(Registration, {
      where: { id: attempt.registrationId },
    });
    const level = registration?.metadata?.employeeLevel;
    return level ? String(level).trim() : null;
  }

  /**
   * Reads the per-program main-question generation config from
   * originbi_settings (category 'assessment', key 'question_generation_mode').
   * The stored value is an object keyed by program id. Falls back to the legacy
   * default (random_set_shuffled, 40) when missing/invalid.
   */
  private async getGenerationConfig(
    manager: EntityManager,
    programId: number,
  ): Promise<QuestionGenerationConfig> {
    try {
      const setting = await manager.findOne(OriginbiSetting, {
        where: {
          category: 'assessment',
          settingKey: 'question_generation_mode',
        },
      });
      const value = setting?.value as
        | Record<string, Partial<QuestionGenerationConfig>>
        | undefined;
      const cfg = value?.[String(programId)];
      if (cfg && cfg.mode) {
        return {
          mode: cfg.mode,
          count: Number(cfg.count) > 0 ? Number(cfg.count) : DEFAULT_GENERATION_CONFIG.count,
        };
      }
    } catch (err) {
      this.logger.warn(
        `Could not read question_generation_mode setting, using default. ${
          (err as Error)?.message
        }`,
      );
    }
    return DEFAULT_GENERATION_CONFIG;
  }

  /**
   * Selects the main (DISC) questions for an attempt, applying:
   *  - the Program + Level filter (always),
   *  - the Employee difficulty level filter via the `board` column (when set),
   *  - the admin-configured per-program generation mode.
   */
  private async selectMainQuestions(
    manager: EntityManager,
    attempt: AssessmentAttempt,
  ): Promise<AssessmentQuestion[]> {
    const boardLevel = await this.resolveEmployeeLevel(manager, attempt);
    const config = await this.getGenerationConfig(manager, attempt.programId);

    const applyBaseFilters = (qb: ReturnType<EntityManager['createQueryBuilder']>) => {
      qb.where('q.program_id = :programId', { programId: attempt.programId })
        .andWhere('q.assessment_level_id = :levelId', {
          levelId: attempt.assessmentLevelId,
        })
        .andWhere('q.is_active = true')
        .andWhere('q.is_deleted = false');
      if (boardLevel) {
        qb.andWhere('q.board = :board', { board: boardLevel });
      }
      return qb;
    };

    // random_all_sets: ignore set boundaries entirely.
    if (config.mode === 'random_all_sets') {
      const rows = await applyBaseFilters(
        manager.createQueryBuilder(AssessmentQuestion, 'q'),
      )
        .orderBy('RANDOM()')
        .limit(config.count)
        .getMany();
      this.ensureQuestionsFound(rows, attempt, boardLevel, null);
      return rows;
    }

    // set-based modes: find the available sets first, then pick one at random.
    const setsResult = await applyBaseFilters(
      manager
        .createQueryBuilder(AssessmentQuestion, 'q')
        .select('DISTINCT q.set_number', 'setNumber'),
    ).getRawMany<{ setNumber: number }>();

    if (!setsResult || setsResult.length === 0) {
      this.ensureQuestionsFound([], attempt, boardLevel, null);
    }

    const sets = setsResult.map((s) => s.setNumber);
    const selectedSet = sets[Math.floor(Math.random() * sets.length)];
    this.logger.log(
      `Selected Set ${selectedSet} (from [${sets.join(', ')}]) for Attempt ${
        attempt.id
      } [mode=${config.mode}, level=${boardLevel ?? 'N/A'}]`,
    );

    const qb = applyBaseFilters(
      manager.createQueryBuilder(AssessmentQuestion, 'q'),
    ).andWhere('q.set_number = :setNumber', { setNumber: selectedSet });

    // random_set_ordered keeps authored order; random_set_shuffled randomizes.
    const rows = await (config.mode === 'random_set_ordered'
      ? qb.orderBy('q.external_code', 'ASC').addOrderBy('q.id', 'ASC')
      : qb.orderBy('RANDOM()')
    )
      .limit(config.count)
      .getMany();

    this.ensureQuestionsFound(rows, attempt, boardLevel, selectedSet);
    return rows;
  }

  /**
   * Throws a clear error (rolling back the registration transaction) when no
   * questions are available, so the user never gets an empty assessment.
   */
  private ensureQuestionsFound(
    rows: AssessmentQuestion[],
    attempt: AssessmentAttempt,
    boardLevel: string | null,
    selectedSet: number | null,
  ): void {
    if (rows && rows.length > 0) return;
    this.logger.error(
      `No active questions found for Program ${attempt.programId} Level ${
        attempt.assessmentLevelId
      } (level=${boardLevel ?? 'N/A'}, set=${selectedSet ?? 'any'}). Blocking assessment creation.`,
    );
    throw new Error(
      `No active questions available for this program/level${
        boardLevel ? ` (${boardLevel})` : ''
      }.`,
    );
  }

  /**
   * Selects the open (non-DISC) questions for a Level-1 assessment based on the
   * admin-configurable distribution stored in originbi_settings
   * (category 'assessment', key 'open_question_distribution').
   *
   * Falls back to the legacy behaviour (20 random, any type) if the setting is
   * missing or malformed, so the assessment never silently breaks.
   *
   * NOTE: 'set_sequential' groups (linked survey sets) are currently picked in
   * fixed id order (no shuffle). Full set-grouping selection is pending and will
   * slot in here without touching the three generation services.
   */
  private async selectOpenQuestions(
    manager: EntityManager,
  ): Promise<OpenQuestion[]> {
    const groups = await this.getOpenQuestionDistribution(manager);

    const picked: OpenQuestion[] = [];
    for (const group of groups) {
      const count = Number(group?.count) || 0;
      if (count <= 0) continue;

      // 'set_random': pick ONE random set for this type, then `count` random
      // questions from within that set (the SURVEY rule).
      if (group.selection === 'set_random') {
        let setsQb = manager
          .createQueryBuilder(OpenQuestion, 'oq')
          .select('DISTINCT oq.set_number', 'setNumber')
          .where('oq.is_active = true')
          .andWhere('oq.is_deleted = false')
          .andWhere('oq.set_number IS NOT NULL');
        if (group.questionType) {
          setsQb = setsQb.andWhere('oq.question_type = :qt', {
            qt: group.questionType,
          });
        }
        const sets = (await setsQb.getRawMany<{ setNumber: number }>()).map(
          (s) => s.setNumber,
        );
        if (sets.length === 0) continue;
        const chosenSet = sets[Math.floor(Math.random() * sets.length)];

        let qb = manager
          .createQueryBuilder(OpenQuestion, 'oq')
          .where('oq.is_active = true')
          .andWhere('oq.is_deleted = false')
          .andWhere('oq.set_number = :sn', { sn: chosenSet });
        if (group.questionType) {
          qb = qb.andWhere('oq.question_type = :qt', {
            qt: group.questionType,
          });
        }
        const rows = await qb.orderBy('RANDOM()').limit(count).getMany();
        picked.push(...rows);
        continue;
      }

      let qb = manager
        .createQueryBuilder(OpenQuestion, 'oq')
        .where('oq.is_active = true')
        .andWhere('oq.is_deleted = false');

      if (group.questionType) {
        qb = qb.andWhere('oq.question_type = :qt', { qt: group.questionType });
      }

      // Linked/survey groups must keep their authored order (no shuffle);
      // legacy open questions are randomized.
      qb =
        group.selection === 'set_sequential'
          ? qb.orderBy('oq.id', 'ASC')
          : qb.orderBy('RANDOM()');

      const rows = await qb.limit(count).getMany();
      picked.push(...rows);
    }

    return picked;
  }

  /**
   * Reads and validates the open-question distribution setting.
   * Returns the legacy default ([{ count: 20, selection: 'random' }]) on any issue.
   */
  private async getOpenQuestionDistribution(
    manager: EntityManager,
  ): Promise<OpenQuestionGroup[]> {
    const legacyDefault: OpenQuestionGroup[] = [
      { questionType: null, count: 20, selection: 'random' },
    ];
    try {
      const setting = await manager.findOne(OriginbiSetting, {
        where: {
          category: 'assessment',
          settingKey: 'open_question_distribution',
        },
      });
      const value = setting?.value as OpenQuestionGroup[] | undefined;
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
    } catch (err) {
      this.logger.warn(
        `Could not read open_question_distribution setting, using legacy default (20 random). ${
          (err as Error)?.message
        }`,
      );
    }
    return legacyDefault;
  }

  private shuffleOptions(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
