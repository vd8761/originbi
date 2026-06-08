import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PgBossService } from '@wavezync/nestjs-pgboss';
import { DataSource, Repository } from 'typeorm';
import {
  IatAttemptModule,
  IatIntakeProfile,
  IatKeypress,
  IatModule,
  IatReport,
  IatReportJob,
  IatStimulus,
  IatTrial,
} from '@originbi/shared-entities';
import { AssessmentAttempt } from '../entities/assessment_attempt.entity';
import { AssessmentLevel } from '../entities/assessment_level.entity';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { Registration } from '../entities/registration.entity';
import { IAT_ASSESSMENT_KIND, IAT_REPORT_QUEUE } from './iat.constants';
import { IatEligibilityService } from './iat-eligibility.service';

interface TrialEvent {
  trialId: number;
  keyPressed: string;
  responseTimeMs: number;
  eventSequence?: number;
  shownAt?: string;
  answeredAt?: string;
}

interface IntakeDto {
  studentName?: string;
  age?: number;
  gender?: string;
  hometownTier?: string;
  collegeTier?: string;
  undergraduateStream?: string;
  workExperienceYears?: number;
}

@Injectable()
export class IatService {
  private readonly logger = new Logger(IatService.name);

  constructor(
    @InjectRepository(IatModule)
    private readonly moduleRepo: Repository<IatModule>,
    @InjectRepository(IatStimulus)
    private readonly stimulusRepo: Repository<IatStimulus>,
    @InjectRepository(IatAttemptModule)
    private readonly attemptModuleRepo: Repository<IatAttemptModule>,
    @InjectRepository(IatTrial)
    private readonly trialRepo: Repository<IatTrial>,
    @InjectRepository(IatKeypress)
    private readonly keypressRepo: Repository<IatKeypress>,
    @InjectRepository(IatIntakeProfile)
    private readonly intakeRepo: Repository<IatIntakeProfile>,
    @InjectRepository(IatReportJob)
    private readonly jobRepo: Repository<IatReportJob>,
    @InjectRepository(IatReport)
    private readonly reportRepo: Repository<IatReport>,
    @InjectRepository(AssessmentAttempt)
    private readonly attemptRepo: Repository<AssessmentAttempt>,
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly dataSource: DataSource,
    private readonly pgBoss: PgBossService,
    private readonly eligibility: IatEligibilityService,
  ) {}

  async getState(attemptId: number) {
    const attempt = await this.assertIatAttempt(attemptId);
    await this.ensureAttemptStarted(attempt);
    await this.ensureAttemptModulesAndTrials(attempt);

    // Fetch the independent reads in parallel. With the DB in a different
    // region from the API, sequential round-trips dominate getState latency
    // (this runs at exam start and at every module boundary), so collapsing
    // them into a single round-trip is what removes the perceived "question
    // loading" delay in production.
    const [intake, modules, report, job] = await Promise.all([
      this.getOrCreateIntake(attempt),
      this.getAttemptModules(attemptId),
      this.reportRepo.findOne({ where: { assessmentAttemptId: attemptId } }),
      this.jobRepo.findOne({ where: { assessmentAttemptId: attemptId } }),
    ]);

    const currentModule =
      modules.find((m) => m.status !== 'COMPLETED') ||
      modules[modules.length - 1] ||
      null;

    const trials = currentModule
      ? await this.trialRepo.find({
          where: { iatAttemptModuleId: currentModule.id },
          order: { trialSequence: 'ASC' },
        })
      : [];

    return {
      attempt: this.toAttemptDto(attempt),
      intake: this.toIntakeDto(intake),
      modules: modules.map((m) => this.toModuleDto(m)),
      // Coerce the bigint id to a number so it matches the module DTO ids
      // (toModuleDto already does Number(row.id)) on the client.
      currentModuleId: currentModule ? Number(currentModule.id) : null,
      trials: trials.map((trial) => this.toTrialDto(trial)),
      reportStatus: report?.status || job?.status || 'NONE',
      job: job ? this.toJobDto(job) : null,
    };
  }

  async saveIntake(attemptId: number, dto: IntakeDto) {
    const attempt = await this.assertIatAttempt(attemptId);
    const intake = await this.getOrCreateIntake(attempt);
    intake.studentName = dto.studentName ?? intake.studentName;
    intake.age = dto.age ?? intake.age;
    intake.gender = dto.gender ?? intake.gender;
    intake.hometownTier = dto.hometownTier ?? intake.hometownTier;
    intake.collegeTier = dto.collegeTier ?? intake.collegeTier;
    intake.undergraduateStream =
      dto.undergraduateStream ?? intake.undergraduateStream;
    intake.workExperienceYears =
      dto.workExperienceYears === undefined
        ? intake.workExperienceYears
        : String(dto.workExperienceYears);
    await this.intakeRepo.save(intake);
    return { success: true, intake: this.toIntakeDto(intake) };
  }

  async saveTrialEvents(attemptId: number, events: TrialEvent[]) {
    const attempt = await this.assertIatAttempt(attemptId);
    if (!Array.isArray(events) || events.length === 0) {
      return { success: true, saved: 0 };
    }

    const trialIds = [
      ...new Set(events.map((event) => Number(event.trialId)).filter(Boolean)),
    ];
    const trials = await this.trialRepo
      .createQueryBuilder('t')
      .where('t.id IN (:...trialIds)', { trialIds })
      .andWhere('t.assessment_attempt_id = :attemptId', {
        attemptId: attempt.id,
      })
      .getMany();
    const trialsById = new Map(
      trials.map((trial) => [Number(trial.id), trial]),
    );
    if (trialsById.size !== trialIds.length) {
      throw new BadRequestException(
        'One or more IAT trials do not belong to this attempt.',
      );
    }

    const keypresses: Partial<IatKeypress>[] = [];
    for (const event of events) {
      const trial = trialsById.get(Number(event.trialId));
      if (!trial) continue;
      const key = String(event.keyPressed || '').toUpperCase();
      if (key !== 'E' && key !== 'I') continue;
      const responseTimeMs = Math.max(
        0,
        Math.round(Number(event.responseTimeMs) || 0),
      );
      const isCorrect = key === String(trial.expectedKey || '').toUpperCase();
      keypresses.push({
        iatTrialId: Number(trial.id),
        assessmentAttemptId: attempt.id,
        keyPressed: key,
        responseTimeMs,
        isCorrect,
        eventSequence: Number(event.eventSequence || 1),
      });

      if (!trial.firstKeyPressed) {
        trial.firstKeyPressed = key;
        trial.firstResponseTimeMs = responseTimeMs;
        trial.isCorrect = isCorrect;
        if (event.shownAt) trial.shownAt = new Date(event.shownAt);
      }
      trial.finalKeyPressed = key;
      if (isCorrect) {
        trial.responseTimeMs = responseTimeMs;
        trial.status = 'ANSWERED';
        trial.answeredAt = event.answeredAt
          ? new Date(event.answeredAt)
          : new Date();
      }
    }

    if (keypresses.length) await this.keypressRepo.insert(keypresses);
    await this.trialRepo.save([...trialsById.values()]);
    return { success: true, saved: keypresses.length };
  }

  async completeModule(attemptId: number, attemptModuleId: number) {
    await this.assertIatAttempt(attemptId);
    const attemptModule = await this.attemptModuleRepo.findOne({
      where: { id: attemptModuleId, assessmentAttemptId: attemptId },
      relations: ['module'],
    });
    if (!attemptModule) throw new BadRequestException('IAT module not found.');

    const trials = await this.trialRepo.find({
      where: {
        assessmentAttemptId: attemptId,
        iatAttemptModuleId: attemptModuleId,
      },
      order: { trialSequence: 'ASC' },
    });
    // Guide 4.2: drop the first 2 trials of each block FIRST (warm-ups, by
    // original sequence), THEN remove out-of-range / unanswered response times.
    const blockTrials = trials.filter(
      (trial) =>
        trial.blockType === 'COMPATIBLE' || trial.blockType === 'INCOMPATIBLE',
    );
    const afterWarmup = this.dropWarmupsByBlock(blockTrials, 2);
    const cleaned = afterWarmup.filter(
      (trial) =>
        trial.status === 'ANSWERED' &&
        Number(trial.responseTimeMs || 0) >= 150 &&
        Number(trial.responseTimeMs || 0) <= 3000,
    );
    const compatible = cleaned.filter(
      (trial) => trial.blockType === 'COMPATIBLE',
    );
    const incompatible = cleaned.filter(
      (trial) => trial.blockType === 'INCOMPATIBLE',
    );
    const compatibleAverage = this.average(
      compatible.map((trial) => Number(trial.responseTimeMs || 0)),
    );
    const incompatibleAverage = this.average(
      incompatible.map((trial) => Number(trial.responseTimeMs || 0)),
    );
    const gap = incompatibleAverage - compatibleAverage;
    const pattern = gap > 300 ? 'strong' : gap > 150 ? 'moderate' : 'low';
    const slowestWords = [...incompatible]
      .sort(
        (a, b) => Number(b.responseTimeMs || 0) - Number(a.responseTimeMs || 0),
      )
      .slice(0, 3)
      .map((trial) => trial.wordShown);
    const errorTrials = trials.filter(
      (trial) =>
        trial.firstKeyPressed &&
        String(trial.firstKeyPressed).toUpperCase() !==
          String(trial.expectedKey).toUpperCase(),
    );
    const errorWords = [
      ...new Set(errorTrials.map((trial) => trial.wordShown)),
    ];
    const answered = trials.filter(
      (trial) => trial.status === 'ANSWERED',
    ).length;
    const errorRate = answered > 0 ? (errorTrials.length / answered) * 100 : 0;

    attemptModule.compatibleAverageMs = compatibleAverage.toFixed(2);
    attemptModule.incompatibleAverageMs = incompatibleAverage.toFixed(2);
    attemptModule.speedGapMs = gap.toFixed(2);
    attemptModule.patternLabel = pattern;
    attemptModule.slowestWords = slowestWords;
    attemptModule.errorWords = errorWords;
    attemptModule.errorRate = errorRate.toFixed(2);
    attemptModule.status = 'COMPLETED';
    attemptModule.completedAt = new Date();
    await this.attemptModuleRepo.save(attemptModule);
    const nextModule = await this.attemptModuleRepo.findOne({
      where: {
        assessmentAttemptId: attemptId,
        moduleOrder: attemptModule.moduleOrder + 1,
      },
    });
    if (nextModule && nextModule.status === 'NOT_STARTED') {
      nextModule.status = 'IN_PROGRESS';
      nextModule.startedAt = new Date();
      await this.attemptModuleRepo.save(nextModule);
    }

    return { success: true, module: this.toModuleDto(attemptModule) };
  }

  async finishAttempt(attemptId: number) {
    // Serialize finish for this attempt on a dedicated connection. Concurrent
    // finishes (self-heal + normal flow, or StrictMode double-fires) would
    // otherwise each run the one-time side effects below — unlocking the next
    // level twice (no unique guard) and racing the report-job insert. The
    // session-level advisory lock makes the whole sequence run exactly once.
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('SELECT pg_advisory_lock($1)', [attemptId]);
      return await this.finishAttemptLocked(attemptId);
    } finally {
      await runner
        .query('SELECT pg_advisory_unlock($1)', [attemptId])
        .catch(() => undefined);
      await runner.release();
    }
  }

  private async finishAttemptLocked(attemptId: number) {
    const attempt = await this.assertIatAttempt(attemptId);

    // Idempotent re-finish: if a prior call already completed this attempt, the
    // level-unlock / session-completion side effects already ran — just make
    // sure a report is queued and return.
    if (attempt.status === 'COMPLETED') {
      await this.enqueueReport(attempt.id);
      return { success: true, reportQueued: true };
    }

    const modules = await this.getAttemptModules(attemptId);
    const incomplete = modules.filter(
      (module) => module.status !== 'COMPLETED',
    );
    if (incomplete.length > 0) {
      throw new BadRequestException(
        'Complete all IAT modules before finishing.',
      );
    }

    const scoreMap = this.buildScoreMap(modules);
    attempt.status = 'COMPLETED';
    attempt.completedAt = new Date();
    attempt.metadata = {
      ...(attempt.metadata || {}),
      assessment_kind: IAT_ASSESSMENT_KIND,
      iat_scores: scoreMap,
    };
    await this.attemptRepo.save(attempt);
    await this.createOrUnlockNextMandatoryLevel(attempt);
    await this.completeSessionIfAllMandatoryAttemptsDone(attempt);
    await this.enqueueReport(attempt.id);

    return { success: true, reportQueued: true };
  }

  async retryReport(attemptId: number) {
    await this.assertIatAttempt(attemptId);
    const existing = await this.reportRepo.findOne({
      where: { assessmentAttemptId: attemptId, status: 'DONE' },
    });
    if (existing) return { success: false, reason: 'report_exists' };
    await this.enqueueReport(attemptId, true);
    return { success: true, queued: true };
  }

  private async enqueueReport(attemptId: number, reset = false) {
    let job = await this.jobRepo.findOne({
      where: { assessmentAttemptId: attemptId },
    });
    if (!job) {
      try {
        job = await this.jobRepo.save(
          this.jobRepo.create({
            assessmentAttemptId: attemptId,
            status: 'PENDING',
            retryCount: 0,
            maxRetries: 5,
          }),
        );
      } catch (err) {
        // A concurrent finishAttempt may have created the job first; re-read it
        // and fall through to the update path instead of failing the request.
        if ((err as { code?: string })?.code !== '23505') throw err;
        job = await this.jobRepo.findOne({
          where: { assessmentAttemptId: attemptId },
        });
      }
    }
    if (job && (reset || job.status !== 'PROCESSING')) {
      job.status = 'PENDING';
      job.retryCount = reset ? 0 : job.retryCount;
      job.nextRetryAt = null;
      job.lastError = null;
      await this.jobRepo.save(job);
    }
    await this.pgBoss.boss.send(IAT_REPORT_QUEUE, { attemptId });
  }

  private async assertIatAttempt(
    attemptId: number,
  ): Promise<AssessmentAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
      relations: ['assessmentLevel'],
    });
    if (!attempt)
      throw new BadRequestException('Assessment attempt not found.');
    const level = attempt.assessmentLevel;
    const isLevel2 =
      level?.levelNumber === 2 ||
      level?.name?.includes('Level 2') ||
      String(level?.patternType || '').toUpperCase() === 'ACI';
    if (!isLevel2)
      throw new BadRequestException(
        'IAT Gen only applies to Level 2 attempts.',
      );

    const metadataAssessmentKind = attempt.metadata?.assessment_kind;
    const metadataKind =
      typeof metadataAssessmentKind === 'string'
        ? metadataAssessmentKind.toUpperCase()
        : '';
    if (metadataKind === IAT_ASSESSMENT_KIND) return attempt;

    const isEligible = await this.eligibility.isIatRegistration(
      attempt.registrationId,
    );
    if (!isEligible) {
      throw new BadRequestException(
        'This Level 2 attempt is configured for ACI, not IAT Gen.',
      );
    }

    attempt.metadata = {
      ...(attempt.metadata || {}),
      assessment_kind: IAT_ASSESSMENT_KIND,
    };
    await this.attemptRepo.save(attempt);
    return attempt;
  }

  private async ensureAttemptStarted(attempt: AssessmentAttempt) {
    if (
      attempt.status === 'NOT_STARTED' ||
      attempt.status === 'NOT_YET_STARTED'
    ) {
      attempt.status = 'IN_PROGRESS';
      attempt.startedAt = new Date();
      await this.attemptRepo.save(attempt);
      const session = await this.sessionRepo.findOne({
        where: { id: attempt.assessmentSessionId },
      });
      if (
        session &&
        (session.status === 'NOT_STARTED' ||
          session.status === 'NOT_YET_STARTED')
      ) {
        session.status = 'IN_PROGRESS';
        session.startedAt = new Date();
        await this.sessionRepo.save(session);
      }
    }
  }

  private async ensureAttemptModulesAndTrials(attempt: AssessmentAttempt) {
    const existingCount = await this.attemptModuleRepo.count({
      where: { assessmentAttemptId: attempt.id },
    });
    if (existingCount > 0) return;

    const modules = await this.moduleRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { moduleOrder: 'ASC' },
    });
    if (!modules.length)
      throw new BadRequestException('No active IAT modules configured.');

    const stimuli = await this.stimulusRepo.find({
      where: { isActive: true, isDeleted: false },
      order: { displayOrder: 'ASC' },
    });
    const stimuliByModule = new Map<number, IatStimulus[]>();
    for (const stimulus of stimuli) {
      const moduleStimuli =
        stimuliByModule.get(Number(stimulus.moduleId)) || [];
      moduleStimuli.push(stimulus);
      stimuliByModule.set(Number(stimulus.moduleId), moduleStimuli);
    }

    await this.dataSource.transaction(async (manager) => {
      // Serialize concurrent creators for this attempt. Without this, two
      // near-simultaneous getState calls (e.g. React StrictMode double-invokes
      // the load effect in dev) both pass the count===0 guard above and both
      // try to insert, tripping uq_iat_attempt_module and rolling back one of
      // the requests. The advisory lock is released automatically at COMMIT.
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        Number(attempt.id),
      ]);

      // Re-check inside the lock: if another request already created the
      // modules while we waited, there is nothing to do.
      const alreadyCreated = await manager
        .getRepository(IatAttemptModule)
        .count({
          where: { assessmentAttemptId: attempt.id },
        });
      if (alreadyCreated > 0) return;

      for (const module of modules) {
        const attemptModule = await manager
          .getRepository(IatAttemptModule)
          .save({
            assessmentAttemptId: attempt.id,
            assessmentSessionId: attempt.assessmentSessionId,
            userId: attempt.userId,
            registrationId: attempt.registrationId,
            programId: attempt.programId,
            assessmentLevelId: attempt.assessmentLevelId,
            moduleId: Number(module.id),
            moduleOrder: module.moduleOrder,
            status: module.moduleOrder === 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
            startedAt: module.moduleOrder === 1 ? new Date() : null,
          });
        const trials = this.buildTrialsForModule(
          attempt,
          attemptModule,
          module,
          stimuliByModule.get(Number(module.id)) || [],
        );
        await manager.getRepository(IatTrial).insert(trials);
      }
    });
  }

  private buildTrialsForModule(
    attempt: AssessmentAttempt,
    attemptModule: IatAttemptModule,
    module: IatModule,
    stimuli: IatStimulus[],
  ): Partial<IatTrial>[] {
    const byConcept = new Map<string, IatStimulus[]>();
    for (const stimulus of stimuli) {
      const rows = byConcept.get(stimulus.conceptKey) || [];
      rows.push(stimulus);
      byConcept.set(stimulus.conceptKey, rows);
    }

    let sequence = 1;
    const rows: Partial<IatTrial>[] = [];
    const addStimuli = (
      stepNumber: number,
      blockType: string,
      leftKeys: string[],
      rightKeys: string[],
      leftLabel: string,
      rightLabel: string,
      count?: number,
    ) => {
      const pool = [
        ...this.stimuliForKeys(byConcept, leftKeys).map((s) => ({
          s,
          key: 'E',
        })),
        ...this.stimuliForKeys(byConcept, rightKeys).map((s) => ({
          s,
          key: 'I',
        })),
      ];
      if (pool.length === 0) return;
      // Repeat the (re-shuffled) word pool until we reach the target trial
      // count. Word repetition within a block is expected in an IAT; when the
      // count is a multiple of the pool size the E/I split stays balanced.
      const target = count && count > 0 ? count : pool.length;
      const items: { s: IatStimulus; key: string }[] = [];
      while (items.length < target) {
        for (const item of this.shuffle(pool)) {
          if (items.length >= target) break;
          items.push(item);
        }
      }
      for (const item of items) {
        rows.push({
          assessmentAttemptId: attempt.id,
          iatAttemptModuleId: Number(attemptModule.id),
          moduleId: Number(module.id),
          stimulusId: Number(item.s.id),
          trialSequence: sequence++,
          stepNumber,
          blockType,
          wordShown: item.s.word,
          leftLabel,
          rightLabel,
          expectedKey: item.key,
          status: 'PENDING',
          metadata: { conceptKey: item.s.conceptKey },
        });
      }
    };
    // Standard 7-part IAT sequence. Targets stay on fixed sides throughout
    // (target A on E, target B on I); the attribute sides flip at the halfway
    // point, which is what makes the two combined tests compatible vs
    // incompatible. Everything is derived from the module's compatible pairing
    // so the scored pairings match the IAT guide without any DB changes.
    //
    //   target A  = the target paired on the right of the compatible block
    //   target B  = the target paired on the left of the compatible block
    //   attr A    = the attribute paired with target A when compatible
    //   attr B    = the attribute paired with target B when compatible
    const targetA = module.rightConceptKey;
    const targetB = module.leftConceptKey;
    const attrA =
      (module.compatibleRightKeys || []).find((key) => key !== targetA) || '';
    const attrB =
      (module.compatibleLeftKeys || []).find((key) => key !== targetB) || '';

    // Per-part trial counts (the word pool is repeated to reach these). The
    // combined tests/practice in the second half run longer, matching standard
    // IAT block sizing. Each count is a multiple of its pool size so the E/I
    // split stays balanced.
    // Part 1 — attribute practice (incompatible-half arrangement): attr B / attr A
    addStimuli(1, 'PRACTICE_ATTRIBUTE', [attrB], [attrA], this.title(attrB), this.title(attrA), 20);
    // Part 2 — target practice: target A / target B
    addStimuli(2, 'PRACTICE_TARGET', [targetA], [targetB], this.title(targetA), this.title(targetB), 20);
    // Part 3 — combined practice (incompatible pairing): A+attrB / B+attrA
    addStimuli(
      3,
      'PRACTICE_COMBINED',
      [targetA, attrB],
      [targetB, attrA],
      this.labelForKeys([targetA, attrB]),
      this.labelForKeys([targetB, attrA]),
      20,
    );
    // Part 4 — incompatible test (scored): A+attrB / B+attrA
    addStimuli(
      4,
      'INCOMPATIBLE',
      [targetA, attrB],
      [targetB, attrA],
      this.labelForKeys([targetA, attrB]),
      this.labelForKeys([targetB, attrA]),
      40,
    );
    // Part 5 — attribute practice (compatible-half arrangement): attr A / attr B
    addStimuli(5, 'PRACTICE_ATTRIBUTE', [attrA], [attrB], this.title(attrA), this.title(attrB), 30);
    // Part 6 — combined practice (compatible pairing): A+attrA / B+attrB
    addStimuli(
      6,
      'PRACTICE_COMBINED',
      [targetA, attrA],
      [targetB, attrB],
      this.labelForKeys([targetA, attrA]),
      this.labelForKeys([targetB, attrB]),
      40,
    );
    // Part 7 — compatible test (scored): A+attrA / B+attrB
    addStimuli(
      7,
      'COMPATIBLE',
      [targetA, attrA],
      [targetB, attrB],
      this.labelForKeys([targetA, attrA]),
      this.labelForKeys([targetB, attrB]),
      40,
    );
    return rows;
  }

  private stimuliForKeys(
    byConcept: Map<string, IatStimulus[]>,
    keys: string[],
  ): IatStimulus[] {
    return keys.flatMap((key) => byConcept.get(key) || []);
  }

  private dropWarmupsByBlock(trials: IatTrial[], count: number): IatTrial[] {
    const byBlock = new Map<string, IatTrial[]>();
    for (const trial of trials) {
      const rows = byBlock.get(trial.blockType) || [];
      rows.push(trial);
      byBlock.set(trial.blockType, rows);
    }
    return [...byBlock.values()].flatMap((rows) =>
      rows.sort((a, b) => a.trialSequence - b.trialSequence).slice(count),
    );
  }

  private average(values: number[]): number {
    const clean = values.filter((value) => Number.isFinite(value));
    if (!clean.length) return 0;
    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
  }

  private async getAttemptModules(
    attemptId: number,
  ): Promise<IatAttemptModule[]> {
    return this.attemptModuleRepo.find({
      where: { assessmentAttemptId: attemptId },
      relations: ['module'],
      order: { moduleOrder: 'ASC' },
    });
  }

  private async getOrCreateIntake(
    attempt: AssessmentAttempt,
  ): Promise<IatIntakeProfile> {
    const existing = await this.intakeRepo.findOne({
      where: { assessmentAttemptId: attempt.id },
    });
    if (existing) return existing;
    const registration = await this.registrationRepo.findOne({
      where: { id: attempt.registrationId },
    });
    const intake = this.intakeRepo.create({
      assessmentAttemptId: attempt.id,
      assessmentSessionId: attempt.assessmentSessionId,
      userId: attempt.userId,
      registrationId: attempt.registrationId,
      programId: attempt.programId,
      studentName: registration?.fullName || null,
      gender: registration?.gender || null,
      metadata: {},
    });
    try {
      return await this.intakeRepo.save(intake);
    } catch (err) {
      // Two near-simultaneous getState calls can both pass the findOne check
      // above and both insert, tripping the unique constraint on
      // assessment_attempt_id. The loser just re-reads the winner's row.
      if ((err as { code?: string })?.code === '23505') {
        const row = await this.intakeRepo.findOne({
          where: { assessmentAttemptId: attempt.id },
        });
        if (row) return row;
      }
      throw err;
    }
  }

  private buildScoreMap(modules: IatAttemptModule[]) {
    return modules.reduce(
      (acc, module) => {
        const code = module.module?.code || String(module.moduleId);
        acc[code] = {
          pattern: module.patternLabel,
          speedGapMs: Number(module.speedGapMs || 0),
          compatibleAverageMs: Number(module.compatibleAverageMs || 0),
          incompatibleAverageMs: Number(module.incompatibleAverageMs || 0),
          slowestWords: module.slowestWords || [],
          errorWords: module.errorWords || [],
          errorRate: Number(module.errorRate || 0),
        };
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  private async createOrUnlockNextMandatoryLevel(
    attempt: AssessmentAttempt,
  ): Promise<void> {
    const currentLevel = await this.levelRepo.findOne({
      where: { id: attempt.assessmentLevelId },
    });
    if (!currentLevel) return;
    const nextLevel = await this.levelRepo
      .createQueryBuilder('level')
      .where('level.level_number > :levelNumber', {
        levelNumber: currentLevel.levelNumber,
      })
      .andWhere('level.is_mandatory = true')
      .orderBy('level.level_number', 'ASC')
      .getOne();
    if (!nextLevel) return;
    let nextAttempt = await this.attemptRepo.findOne({
      where: {
        assessmentSessionId: attempt.assessmentSessionId,
        assessmentLevelId: nextLevel.id,
      },
    });
    if (!nextAttempt) {
      nextAttempt = await this.attemptRepo.save(
        this.attemptRepo.create({
          assessmentSessionId: attempt.assessmentSessionId,
          assessmentLevelId: nextLevel.id,
          userId: attempt.userId,
          registrationId: attempt.registrationId,
          programId: attempt.programId,
          status: 'NOT_STARTED',
          metadata: {},
        }),
      );
    }
    const unlockAt = new Date();
    unlockAt.setHours(
      unlockAt.getHours() + Number(nextLevel.unlockAfterHours || 0),
    );
    const expiresAt = new Date(unlockAt);
    const startWithinHours = Number(
      (nextLevel as AssessmentLevel & { startWithinHours?: number | null })
        .startWithinHours || 72,
    );
    expiresAt.setHours(expiresAt.getHours() + startWithinHours);
    nextAttempt.unlockAt = unlockAt;
    nextAttempt.expiresAt = expiresAt;
    await this.attemptRepo.save(nextAttempt);
  }

  private async completeSessionIfAllMandatoryAttemptsDone(
    attempt: AssessmentAttempt,
  ) {
    const mandatoryLevels = await this.levelRepo.find({
      where: { isMandatory: true },
    });
    if (!mandatoryLevels.length) return;
    const attempts = await this.attemptRepo.find({
      where: { assessmentSessionId: attempt.assessmentSessionId },
    });
    const byLevel = new Map(
      attempts.map((row) => [Number(row.assessmentLevelId), row]),
    );
    const done = mandatoryLevels.every(
      (level) => byLevel.get(Number(level.id))?.status === 'COMPLETED',
    );
    if (!done) return;
    const session = await this.sessionRepo.findOne({
      where: { id: attempt.assessmentSessionId },
    });
    if (!session || session.status === 'COMPLETED') return;
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    await this.sessionRepo.save(session);
  }

  private toAttemptDto(attempt: AssessmentAttempt) {
    return {
      id: attempt.id,
      status: attempt.status,
      assessmentKind: IAT_ASSESSMENT_KIND,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    };
  }

  private toIntakeDto(intake: IatIntakeProfile) {
    return {
      studentName: intake.studentName,
      age: intake.age,
      gender: intake.gender,
      hometownTier: intake.hometownTier,
      collegeTier: intake.collegeTier,
      undergraduateStream: intake.undergraduateStream,
      workExperienceYears:
        intake.workExperienceYears === null
          ? null
          : Number(intake.workExperienceYears),
    };
  }

  private toModuleDto(row: IatAttemptModule) {
    return {
      id: Number(row.id),
      moduleId: Number(row.moduleId),
      code: row.module?.code,
      name: row.module?.name,
      displayName: row.module?.displayName,
      order: row.moduleOrder,
      status: row.status,
      pattern: row.patternLabel,
      speedGapMs: Number(row.speedGapMs || 0),
      slowestWords: row.slowestWords || [],
      errorWords: row.errorWords || [],
      errorRate: Number(row.errorRate || 0),
    };
  }

  private toTrialDto(trial: IatTrial) {
    return {
      id: Number(trial.id),
      sequence: trial.trialSequence,
      stepNumber: trial.stepNumber,
      blockType: trial.blockType,
      wordShown: trial.wordShown,
      leftLabel: trial.leftLabel,
      rightLabel: trial.rightLabel,
      expectedKey: trial.expectedKey,
      status: trial.status,
    };
  }

  private toJobDto(job: IatReportJob) {
    return {
      id: Number(job.id),
      status: job.status,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
      nextRetryAt: job.nextRetryAt,
      lastError: job.lastError,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private title(key: string): string {
    return String(key || '')
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private labelForKeys(keys: string[]): string {
    return keys.map((key) => this.title(key)).join(' + ');
  }
}
