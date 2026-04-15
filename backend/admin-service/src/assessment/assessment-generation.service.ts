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
} from '@originbi/shared-entities';

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

    // 2. Find Available Sets
    // Filter by Board if School Program
    let setQuery = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .select('DISTINCT q.set_number', 'setNumber')
      .where('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false');

    if (isSchool && studentBoard) {
      setQuery = setQuery.andWhere('q.board = :board', { board: studentBoard });
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
        this.logger.warn(`No active question sets found at all.`);
        return;
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

    // 4. Fetch Main Questions (Set-Based)
    let mainQuestionsQuery = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .where('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.set_number = :setNumber', { setNumber: selectedSet })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .orderBy('RANDOM()');

    if (isSchool && studentBoard && useBoardFilter) {
      mainQuestionsQuery = mainQuestionsQuery.andWhere('q.board = :board', {
        board: studentBoard,
      });
    }

    if (isLevel1) {
      mainQuestionsQuery.limit(40);
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
      // Fetch 20 Random Open Questions
      const openQuestions = await manager
        .createQueryBuilder(OpenQuestion, 'oq')
        .where('oq.is_active = true')
        .andWhere('oq.is_deleted = false')
        .orderBy('RANDOM()')
        .limit(20)
        .getMany();

      let mainIdx = 0;
      let openIdx = 0;

      // Loop 20 times to create 60 questions (20 * 3)
      for (let i = 0; i < 20; i++) {
        // Add 2 Main
        for (let j = 0; j < 2; j++) {
          if (mainIdx < mainQuestions.length) {
            const q = mainQuestions[mainIdx++];
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
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
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

  private shuffleOptions(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
