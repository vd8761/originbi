import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Not, IsNull } from 'typeorm';
import {
  AssessmentLevel,
  AssessmentQuestion,
  OpenQuestion,
  AssessmentAnswer,
  AssessmentAttempt,
  Registration,
  AssessmentSession,
  Program,
  OriginbiSetting,
} from '@originbi/shared-entities';

/**
 * One group within the admin-configurable open-question distribution.
 * Stored in originbi_settings (category 'assessment', key 'open_question_distribution').
 */
interface OpenQuestionGroup {
  questionType?: string | null; // open_questions.question_type to draw from; null/omitted = any
  count: number; // how many to pick from this group (configurable count shown in the exam)
  selection?: 'random' | 'set_random' | 'set_sequential'; // 'random' = N random of type; 'set_random' = pick one set then N random within; 'set_sequential' = one set in fixed order
}

/**
 * Per-program main-question generation mode, stored in originbi_settings
 * (category 'assessment', key 'question_generation_mode') as an object keyed by
 * program id -> QuestionGenerationConfig. See the corporate generation service
 * for the full description of each mode.
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
  /**
   * Generates questions for a specific assessment attempt based on Program and Level.
   * Logic:
   * 1. Identify valid Question Sets (set_number) for the (Program, Level).
   * 2. Pick ONE Set randomly.
   * 3. Fetch ALL active questions for that Set.
   * 4. Insert into assessment_answers.
   */
  /**
   * Generates questions for a specific assessment attempt.
   * Logic:
   * 1. Pick a Random Set (set_number) for the (Program, Level).
   * 2. Fetch Main Questions for that Set.
   * 3. IF Level 1:
   *    - Limit Main Questions to 40.
   *    - Fetch 20 Random Open Questions.
   *    - Interleave 2 Main : 1 Open.
   * 4. ELSE (Level 2+):
   *    - Use all Main Questions from the Set.
   *    - No Open Questions.
   */
  async generateQuestions(attempt: AssessmentAttempt, manager: EntityManager) {
    this.logger.log(
      `Generating questions for Attempt ID: ${attempt.id}, Program: ${attempt.programId}, Level: ${attempt.assessmentLevelId}`,
    );

    // Fetch Registration and Session to get Metadata
    const registration = await manager.findOne(Registration, {
      where: { id: attempt.registrationId },
    });

    const studentBoard = registration?.metadata?.studentBoard || null;
    this.logger.log(
      `[Assessment] Context -> Board: ${studentBoard || 'N/A'}, Registration: ${attempt.registrationId}`,
    );

    const session = await manager.findOne(AssessmentSession, {
      where: { id: attempt.assessmentSessionId },
    });

    let traitId =
      session?.metadata?.personalityTraitId ||
      session?.metadata?.dominantTraitId;

    // 1. Identify Level Type
    const level = await manager.findOne(AssessmentLevel, {
      where: { id: attempt.assessmentLevelId },
    });

    // Check Level 2 (ACI)
    const isLevel2 =
      level &&
      (level.levelNumber === 2 ||
        level.name.trim().includes('Level 2') ||
        level.name.includes('ACI'));
    // Check Level 1
    const isLevel1 =
      level &&
      !isLevel2 &&
      (level.levelNumber === 1 || level.name.trim().includes('Level 1'));

    // Check Program (School vs Other)
    const program = await manager.findOne(Program, {
      where: { id: attempt.programId },
    });
    const isSchool = program?.code === 'SCHOOL_STUDENT';
    const isEmployee =
      program?.code === 'EMPLOYEE' ||
      String(program?.name || '')
        .trim()
        .toUpperCase() === 'EMPLOYEE';

    // The `board` column sub-segments main questions: by exam board for School,
    // and by difficulty level (Entry/Medium/Executive) for the Employee program
    // ONLY. Other programs (e.g. College) ignore employeeLevel even if it was
    // sent on the registration.
    const employeeLevel =
      isEmployee && registration?.metadata?.employeeLevel
        ? String(registration.metadata.employeeLevel).trim()
        : null;
    const boardFilter: string | null = isSchool ? studentBoard : employeeLevel;

    // ---------------------------------------------------------
    // LEVEL 2 (ACI) LOGIC
    // ---------------------------------------------------------
    if (isLevel2) {
      if (!traitId) {
        // Fallback: Check for a completed attempt in this session that has a dominant trait (Level 1)
        this.logger.log(
          `[Assessment] Trait ID not in metadata. Checking previous attempts for Session ${attempt.assessmentSessionId}...`,
        );
        const previousAttempt = await manager.findOne(AssessmentAttempt, {
          where: {
            assessmentSessionId: attempt.assessmentSessionId,
            dominantTraitId: Not(IsNull()),
            status: 'COMPLETED',
          },
          order: { completedAt: 'DESC' },
        });

        if (previousAttempt && previousAttempt.dominantTraitId) {
          traitId = previousAttempt.dominantTraitId;
          this.logger.log(
            `[Assessment] Found Trait ID ${traitId} from previous attempt ${previousAttempt.id}`,
          );
        }
      }

      if (!traitId) {
        this.logger.error(
          `[Assessment Error] Level 2 requires a Personality Trait ID, but none found in session metadata or previous attempts for User ${attempt.userId}`,
        );
        throw new Error(
          'Personality Trait not found. Please complete Level 1 first.',
        );
      }

      this.logger.log(
        `Generating Level 2 Questions for Trait ID: ${traitId} (5 questions per category)`,
      );

      const categories = [
        'Commitment',
        'Courage',
        'Focus',
        'Openness',
        'Respect',
      ];
      const aciQuestions: AssessmentQuestion[] = [];

      for (const category of categories) {
        let categoryQuery = manager
          .createQueryBuilder(AssessmentQuestion, 'q')
          .where('q.assessment_level_id = :levelId', {
            levelId: attempt.assessmentLevelId,
          })
          .andWhere('q.personality_trait_id = :traitId', { traitId })
          .andWhere('UPPER(q.category) = :category', {
            category: category.toUpperCase(),
          })
          .andWhere('q.is_active = true')
          .andWhere('q.is_deleted = false');

        if (isSchool && studentBoard) {
          categoryQuery = categoryQuery.andWhere('q.board = :board', {
            board: studentBoard,
          });
        }

        let catQuestions = await categoryQuery
          .orderBy('RANDOM()')
          .limit(5)
          .getMany();

        // Fallback: If board-specific questions are missing for this category, try generic trait-based ones
        if (catQuestions.length < 5 && isSchool && studentBoard) {
          this.logger.warn(
            `Found only ${catQuestions.length}/5 questions for category ${category} with board ${studentBoard}. Falling back to generic trait questions.`,
          );
          const fallbackQuery = manager
            .createQueryBuilder(AssessmentQuestion, 'q')
            .where('q.assessment_level_id = :levelId', {
              levelId: attempt.assessmentLevelId,
            })
            .andWhere('q.personality_trait_id = :traitId', { traitId })
            .andWhere('UPPER(q.category) = :category', {
              category: category.toUpperCase(),
            })
            .andWhere('q.is_active = true')
            .andWhere('q.is_deleted = false')
            .orderBy('RANDOM()')
            .limit(5);

          catQuestions = await fallbackQuery.getMany();
        }

        if (catQuestions.length === 0) {
          this.logger.error(
            `CRITICAL: No questions found for category ${category} and Trait ${traitId}. Assessment may be incomplete.`,
          );
        }

        aciQuestions.push(...catQuestions);
      }

      const answersToInsert: Partial<AssessmentAnswer>[] = [];
      let seq = 1;

      for (const q of aciQuestions) {
        answersToInsert.push({
          assessmentAttemptId: attempt.id,
          assessmentSessionId: attempt.assessmentSessionId,
          userId: attempt.userId, // Critical Field
          registrationId: attempt.registrationId, // Critical Field
          programId: attempt.programId,
          assessmentLevelId: attempt.assessmentLevelId,
          questionSource: 'MAIN',
          mainQuestionId: q.id,
          questionSequence: seq++,
          questionOptionsOrder: JSON.stringify(
            this.shuffleOptions([1, 2, 3, 4]),
          ),
          status: 'NOT_ANSWERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (answersToInsert.length > 0) {
        await manager.getRepository(AssessmentAnswer).insert(answersToInsert);
      }
      return;
    }

    // ---------------------------------------------------------
    // LEVEL 1 & GENERIC LOGIC
    // ---------------------------------------------------------

    // Admin-configured per-program main-question generation mode.
    const genConfig = await this.getGenerationConfig(
      manager,
      attempt.programId,
    );

    // 2. Find Available Sets
    // Filter by Board (School board OR Employee difficulty level)
    let setQuery = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .select('DISTINCT q.set_number', 'setNumber')
      .where('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false');

    if (boardFilter) {
      setQuery = setQuery.andWhere('q.board = :board', { board: boardFilter });
    }

    const setsResult = await setQuery.getRawMany<{ setNumber: number }>();

    let selectedSet = 1;
    let useBoardFilter = true;

    if (!setsResult || setsResult.length === 0) {
      if (isSchool && studentBoard) {
        this.logger.warn(
          `No sets found for Board ${studentBoard}, falling back to generic/any sets.`,
        );
        // Fallback logic
        const fallbackSets = await manager
          .createQueryBuilder(AssessmentQuestion, 'q')
          .select('DISTINCT q.set_number', 'setNumber')
          .where('q.assessment_level_id = :levelId', {
            levelId: attempt.assessmentLevelId,
          })
          .andWhere('q.program_id = :programId', {
            programId: attempt.programId,
          })
          .andWhere('q.is_active = true')
          .getRawMany<{ setNumber: number }>();

        if (fallbackSets.length > 0) {
          const sets = fallbackSets.map((s) => s.setNumber);
          selectedSet = sets[Math.floor(Math.random() * sets.length)];
          useBoardFilter = false; // Disable strict filter since we are using generic sets
        }
      } else {
        this.logger.error(
          `No active question sets found for Program ${attempt.programId} Level ${attempt.assessmentLevelId}. Blocking assessment creation.`,
        );
        // Throw (not silent return) so the registration transaction rolls back
        // and the user gets a clear "questions unavailable" error instead of an
        // empty assessment. Covers the case where all questions are deactivated.
        throw new Error(
          'No active questions available for this program/level.',
        );
      }
    } else {
      const sets = setsResult.map((s) => s.setNumber);
      this.logger.log(`Found valid sets for Level 1: ${sets.join(', ')}`);
      selectedSet = sets[Math.floor(Math.random() * sets.length)];
    }

    this.logger.log(
      `Selected Set ${selectedSet} for Attempt ${attempt.id} (Level ${isLevel1 ? '1' : 'Other'})`,
    );
    // Update Metadata with Set Info
    if (session) {
      if (!session.metadata) session.metadata = {};
      session.metadata.setNumber = selectedSet;
      if (studentBoard) session.metadata.studentBoard = studentBoard;
      await manager.save(session);
    }

    // 4. Fetch Main Questions per the configured generation mode.
    let mainQuestionsQuery = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .where('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false');

    // random_all_sets draws across every set; the other modes stay within the
    // single set chosen above.
    if (genConfig.mode !== 'random_all_sets') {
      mainQuestionsQuery = mainQuestionsQuery.andWhere(
        'q.set_number = :setNumber',
        { setNumber: selectedSet },
      );
    }

    if (boardFilter && useBoardFilter) {
      mainQuestionsQuery = mainQuestionsQuery.andWhere('q.board = :board', {
        board: boardFilter,
      });
    }

    // random_set_ordered keeps authored order; the others randomize.
    mainQuestionsQuery =
      genConfig.mode === 'random_set_ordered'
        ? mainQuestionsQuery
            .orderBy('q.external_code', 'ASC')
            .addOrderBy('q.id', 'ASC')
        : mainQuestionsQuery.orderBy('RANDOM()');

    if (isLevel1 || genConfig.mode === 'random_all_sets') {
      mainQuestionsQuery.limit(genConfig.count);
    }

    const mainQuestions = await mainQuestionsQuery.getMany();

    if (!mainQuestions || mainQuestions.length === 0) {
      this.logger.error(
        `Set ${selectedSet} has no active questions for Level ${attempt.assessmentLevelId} (Program: ${program?.code || 'Unknown'}, Board: ${studentBoard || 'None'}).`,
      );
      throw new Error(
        `No active questions found for the selected set (${selectedSet}) and board (${studentBoard || 'None'}).`,
      );
    }

    const answersToInsert: Partial<AssessmentAnswer>[] = [];
    let seq = 1;

    // ---------------------------------------------------------
    // LEVEL 1 LOGIC: Interleave 40 Main + 20 Open (2:1 Pattern)
    // ---------------------------------------------------------
    if (isLevel1) {
      // Fetch open questions per the admin-configurable distribution
      // (originbi_settings -> assessment.open_question_distribution).
      const openQuestions = await this.selectOpenQuestions(manager);

      // Build the final order: all main questions, with the open/survey
      // questions SCATTERED at random positions among them (they "appear
      // anywhere in the exam"). No fixed ratio.
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
          userId: attempt.userId, // Critical Field
          registrationId: attempt.registrationId, // Critical Field
          programId: attempt.programId,
          assessmentLevelId: attempt.assessmentLevelId,
          questionSource: item.source,
          mainQuestionId: item.source === 'MAIN' ? item.id : undefined,
          openQuestionId: item.source === 'OPEN' ? item.id : undefined,
          questionSequence: seq++,
          questionOptionsOrder: JSON.stringify(
            this.shuffleOptions([1, 2, 3, 4]),
          ),
          status: 'NOT_ANSWERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    // ---------------------------------------------------------
    // OTHER LEVELS (e.g. non-Level 2, non-Level 1): Just Main Questions
    // ---------------------------------------------------------
    else {
      // Just insert all Main Questions from the Set
      for (const q of mainQuestions) {
        answersToInsert.push({
          assessmentAttemptId: attempt.id,
          assessmentSessionId: attempt.assessmentSessionId,
          userId: attempt.userId,
          registrationId: attempt.registrationId,
          programId: attempt.programId,
          assessmentLevelId: attempt.assessmentLevelId,
          questionSource: 'MAIN',
          mainQuestionId: q.id,
          questionSequence: seq++,
          questionOptionsOrder: JSON.stringify(
            this.shuffleOptions([1, 2, 3, 4]),
          ),
          status: 'NOT_ANSWERED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 5. Bulk Insert
    if (answersToInsert.length > 0) {
      await manager.getRepository(AssessmentAnswer).insert(answersToInsert);
      this.logger.log(
        `Generated ${answersToInsert.length} answers (Set ${selectedSet}) for Attempt ${attempt.id}`,
      );
    }
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
          count:
            Number(cfg.count) > 0
              ? Number(cfg.count)
              : DEFAULT_GENERATION_CONFIG.count,
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
