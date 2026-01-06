import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AssessmentLevel } from './assessment_level.entity';
import { AssessmentQuestion } from './assessment_question.entity';
import { OpenQuestion } from './open_question.entity';
import { AssessmentAnswer } from './assessment_answer.entity';
import { AssessmentAttempt } from './assessment_attempt.entity';

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
  ) { }

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
  async generateQuestions(
    attempt: AssessmentAttempt,
    manager: EntityManager,
  ) {
    this.logger.log(
      `Generating questions for Attempt ID: ${attempt.id}, Program: ${attempt.programId}, Level: ${attempt.assessmentLevelId}`,
    );

    // 1. Identify Level Type
    const level = await manager.findOne(AssessmentLevel, {
      where: { id: attempt.assessmentLevelId },
    });
    // Check if Level 1 (ID 1 is a fallback assumption, Name check is safer)
    const isLevel1 =
      level && (level.id === 1 || level.name.trim().includes('Level 1'));

    // 2. Find Available Sets for this Program + Level
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
      this.logger.warn(
        `No active question sets found for Program ${attempt.programId} Level ${attempt.assessmentLevelId}. Skipping.`,
      );
      return;
    }

    // 3. Pick One Set Randomly
    const sets = setsResult.map((s) => s.setNumber);
    const selectedSet: number = sets[Math.floor(Math.random() * sets.length)];

    this.logger.log(
      `Selected Set ${selectedSet} (from [${sets.join(', ')}]) for Attempt ${attempt.id
      } (Level ${isLevel1 ? '1' : 'Other'})`,
    );

    // 4. Fetch Main Questions (Set-Based)
    const mainQuestionsQuery = manager
      .createQueryBuilder(AssessmentQuestion, 'q')
      .where('q.program_id = :programId', { programId: attempt.programId })
      .andWhere('q.assessment_level_id = :levelId', {
        levelId: attempt.assessmentLevelId,
      })
      .andWhere('q.set_number = :setNumber', { setNumber: selectedSet })
      .andWhere('q.is_active = true')
      .andWhere('q.is_deleted = false')
      .orderBy('RANDOM()'); // Shuffle within the set

    if (isLevel1) {
      mainQuestionsQuery.limit(40); // Explicit requirement for Level 1
    }

    const mainQuestions = await mainQuestionsQuery.getMany();

    if (!mainQuestions || mainQuestions.length === 0) {
      this.logger.warn(`Set ${selectedSet} has no active questions.`);
      return;
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
    // OTHER LEVELS (e.g. Level 2): Just Main Questions
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
