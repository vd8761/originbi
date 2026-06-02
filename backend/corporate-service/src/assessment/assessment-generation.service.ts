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
} from '@originbi/shared-entities';

/**
 * One group within the admin-configurable open-question distribution.
 * Stored in originbi_settings (category 'assessment', key 'open_question_distribution').
 */
interface OpenQuestionGroup {
  questionType?: string | null; // open_questions.question_type to draw from; null/omitted = any
  count: number; // how many to pick from this group (configurable count shown in the exam)
  selection?: 'random' | 'set_sequential'; // 'random' = shuffled; 'set_sequential' = fixed order (linked survey sets)
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

    // 1. Find Available Sets for this Program + Level
    const setsResult = await manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .select('DISTINCT q.set_number', 'setNumber')
      .where('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .getRawMany<{ setNumber: number }>();

    if (!setsResult || setsResult.length === 0) {
      this.logger.error(
        `No active question sets found for Program ${attempt.programId} Level ${attempt.assessmentLevelId}. Blocking assessment creation.`,
      );
      // Throw (not silent return) so the registration transaction rolls back and
      // the user gets a clear "questions unavailable" error instead of an empty
      // assessment. Covers the case where all questions are deactivated.
      throw new Error('No active questions available for this program/level.');
    }

    // 2. Pick One Set Randomly
    const sets = setsResult.map((s) => s.setNumber);
    const selectedSet: number = sets[Math.floor(Math.random() * sets.length)];

    this.logger.log(
      `Selected Set ${selectedSet} (from [${sets.join(', ')}]) for Attempt ${
        attempt.id
      }`,
    );

    // 3. Fetch Main Questions (Set-Based)
    const mainQuestions = await manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .where('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.set_number = :setNumber', { setNumber: selectedSet })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .orderBy('RANDOM()')
      .limit(40)
      .getMany();

    // 2. Fetch open questions per the admin-configurable distribution
    // (originbi_settings -> assessment.open_question_distribution).
    const openQuestions = await this.selectOpenQuestions(manager);

    // 3. Interleave 2 Main : 1 Open until BOTH pools are exhausted.
    // Driven by pool sizes (not a hard-coded 20) so the open-question count
    // stays admin-configurable while every main question is used.
    const answersToInsert: Partial<AssessmentAnswer>[] = [];
    let mainIdx = 0;
    let openIdx = 0;
    let seq = 1;

    while (mainIdx < mainQuestions.length || openIdx < openQuestions.length) {
      // Add up to 2 Main
      for (let j = 0; j < 2 && mainIdx < mainQuestions.length; j++) {
        const q = mainQuestions[mainIdx++];
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
          ), // Store as string
          status: 'NOT_ANSWERED',
        });
      }
      // Add 1 Open
      if (openIdx < openQuestions.length) {
        const oq = openQuestions[openIdx++];
        answersToInsert.push({
          assessmentAttemptId: attempt.id,
          assessmentSessionId: attempt.assessmentSessionId,
          userId: attempt.userId,
          registrationId: attempt.registrationId,
          programId: attempt.programId,
          assessmentLevelId: attempt.assessmentLevelId,
          questionSource: 'OPEN',
          openQuestionId: oq.id,
          questionSequence: seq++,
          questionOptionsOrder: JSON.stringify(
            this.shuffleOptions([1, 2, 3, 4]),
          ),
          status: 'NOT_ANSWERED',
        });
      }
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
