import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AssessmentLevel,
  AssessmentQuestion,
  OpenQuestion,
  MetaphorQuestion,
  Program,
} from '@originbi/shared-entities';
import { SettingsService } from '../settings/settings.service';
import {
  LevelEligibilityService,
  RegistrationScope,
} from '../levels/level-eligibility.service';

/** Scope the preview is computed for (comes straight from the form inputs). */
export interface ExamPreviewScope {
  programId: number;
  departmentDegreeId?: number | null;
  studentBoard?: string | null;
  employeeLevel?: string | null;
  schoolLevel?: string | null;
  currentYear?: string | number | null;
}

export interface PreviewLine {
  label: string;
  value: string;
}

export interface PreviewLevel {
  levelNumber: number;
  name: string; // e.g. "Level 1"
  title: string; // human title e.g. "Behavioral", "ACI", "IAT Gen"
  patternType: string | null;
  status: 'enabled' | 'disabled' | 'unavailable';
  reason: string | null;
  items: PreviewLine[];
  tags: string[]; // e.g. ["SURVEY (10)", "DISTRACTION (10)"]
  note: string | null;
}

interface OpenQuestionGroup {
  questionType?: string | null;
  count: number;
  selection?: string;
}

interface IatRule {
  programIds?: Array<number | string>;
  departmentDegreeIds?: Array<number | string>;
  departmentIds?: Array<number | string>;
  studentBoards?: string[];
  moduleSetId?: number | string;
}

interface IatModuleSet {
  id: number | string;
  name?: string;
  moduleIds?: Array<number | string>;
}

/**
 * Builds the "Exam Preview" shown in the admin Add-Registration form: for a
 * chosen program + sub-category (department / board / employee level) it reports
 * what the candidate WILL receive, level by level, using the same live settings
 * + question banks that the real assignment uses. There is no registration yet,
 * so everything is resolved from the scope inputs directly.
 */
@Injectable()
export class ExamPatternPreviewService {
  private readonly logger = new Logger(ExamPatternPreviewService.name);

  private static readonly DEFAULT_MAIN_COUNT = 40;
  private static readonly DEFAULT_OPEN_COUNT = 20;
  private static readonly DEFAULT_METAPHOR_COUNT = 20;
  // Level 2 (ACI) is a fixed 5 values x 5 questions structure.
  private static readonly ACI_VALUES = 5;
  private static readonly ACI_PER_VALUE = 5;

  constructor(
    @InjectRepository(AssessmentLevel)
    private readonly levelRepo: Repository<AssessmentLevel>,
    @InjectRepository(AssessmentQuestion)
    private readonly questionRepo: Repository<AssessmentQuestion>,
    @InjectRepository(OpenQuestion)
    private readonly openQuestionRepo: Repository<OpenQuestion>,
    @InjectRepository(MetaphorQuestion)
    private readonly metaphorRepo: Repository<MetaphorQuestion>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly levelEligibility: LevelEligibilityService,
  ) {}

  async preview(input: ExamPreviewScope) {
    const programId = Number(input.programId);
    const program = await this.programRepo.findOne({
      where: { id: programId as any },
    });

    // Derive departmentId from the department-degree, matching the assignment
    // path (resolveEnabledLevelsForRegistration).
    let departmentId: number | string | null = null;
    if (input.departmentDegreeId) {
      const rows = await this.dataSource.query(
        `SELECT department_id FROM department_degrees WHERE id = $1 LIMIT 1`,
        [input.departmentDegreeId],
      );
      departmentId = rows?.[0]?.department_id ?? null;
    }

    const scope: RegistrationScope = {
      programId,
      departmentDegreeId: input.departmentDegreeId ?? null,
      departmentId,
      studentBoard: input.studentBoard ?? null,
    };

    const levels = await this.levelRepo
      .createQueryBuilder('al')
      .where("UPPER(COALESCE(al.pattern_type, '')) <> :placeholder", {
        placeholder: 'TBD',
      })
      .orderBy('al.sort_order', 'ASC')
      .getMany();

    const previewLevels: PreviewLevel[] = [];
    for (const level of levels) {
      previewLevels.push(await this.buildLevel(level, scope, program, input));
    }

    return {
      program: program
        ? {
            id: Number(program.id),
            name: program.name,
            assessmentTitle: program.assessmentTitle ?? null,
          }
        : null,
      levels: previewLevels,
    };
  }

  private classify(level: AssessmentLevel): {
    kind: 'DISC' | 'ACI' | 'IAT' | 'METAPHOR' | 'OTHER';
    title: string;
  } {
    const pt = String(level.patternType || '').toUpperCase();
    const nm = String(level.name || '').toUpperCase();
    if (pt === 'DISC' || level.levelNumber === 1 || nm.includes('BEHAV')) {
      return { kind: 'DISC', title: 'Behavioral' };
    }
    if (pt.includes('IAT') || nm.includes('IAT')) {
      return { kind: 'IAT', title: 'IAT Gen' };
    }
    if (pt === 'ACI' || nm.includes('ACI') || level.levelNumber === 2) {
      return { kind: 'ACI', title: 'ACI' };
    }
    if (pt === 'METAPHOR' || nm.includes('METAPHOR')) {
      return { kind: 'METAPHOR', title: 'Metaphor' };
    }
    return { kind: 'OTHER', title: level.name };
  }

  private async buildLevel(
    level: AssessmentLevel,
    scope: RegistrationScope,
    program: Program | null,
    input: ExamPreviewScope,
  ): Promise<PreviewLevel> {
    const { kind, title } = this.classify(level);
    const base: PreviewLevel = {
      levelNumber: level.levelNumber,
      name: level.name,
      title,
      patternType: level.patternType,
      status: 'enabled',
      reason: null,
      items: [],
      tags: [],
      note: null,
    };

    // 1. Is the level enabled for this scope?
    const enabled = await this.levelEligibility.isLevelEnabled(level, scope);
    if (!enabled) {
      base.status = 'disabled';
      base.reason = await this.disabledReason(level.levelNumber);
      return base;
    }

    // 2. Enabled -> compute the per-kind detail.
    try {
      if (kind === 'DISC') {
        await this.fillBehavioral(base, program, input);
      } else if (kind === 'ACI') {
        await this.fillAci(base, scope);
      } else if (kind === 'IAT') {
        await this.fillIat(base, scope);
      } else if (kind === 'METAPHOR') {
        await this.fillMetaphor(base);
      } else {
        base.items.push({ label: 'Assessment', value: level.name });
      }
    } catch (err) {
      this.logger.warn(
        `Preview detail failed for level ${level.levelNumber}: ${
          (err as Error)?.message
        }`,
      );
    }
    return base;
  }

  /** Reason a level is disabled: explicit flag vs no scope match. */
  private async disabledReason(levelNumber: number): Promise<string> {
    const enabledFlag = await this.safeGet<boolean>(
      'levels',
      `level${levelNumber}_enabled`,
    );
    if (enabledFlag === false) {
      return 'Disabled in settings for all candidates.';
    }
    const rules = await this.safeGet<{ rules?: unknown[] }>(
      'levels',
      `level${levelNumber}_scope_rules`,
    );
    if (rules?.rules && rules.rules.length > 0) {
      return 'Not available for this program / department / board.';
    }
    return 'Not available for this candidate.';
  }

  // ---- Level 1: Behavioral (DISC) ----
  private async fillBehavioral(
    base: PreviewLevel,
    program: Program | null,
    input: ExamPreviewScope,
  ): Promise<void> {
    // Main-question count from the per-program generation config.
    let mainCount = ExamPatternPreviewService.DEFAULT_MAIN_COUNT;
    const genCfg = await this.safeGet<
      Record<string, { mode?: string; count?: number }>
    >('assessment', 'question_generation_mode');
    const cfg = genCfg?.[String(program?.id ?? '')];
    if (cfg && Number(cfg.count) > 0) mainCount = Number(cfg.count);

    // Open-question distribution -> total + per-type breakdown.
    const groups = await this.safeGet<OpenQuestionGroup[]>(
      'assessment',
      'open_question_distribution',
    );
    const distribution: OpenQuestionGroup[] =
      Array.isArray(groups) && groups.length > 0
        ? groups
        : [
            {
              questionType: null,
              count: ExamPatternPreviewService.DEFAULT_OPEN_COUNT,
            },
          ];
    const openTotal = distribution.reduce(
      (sum, g) => sum + (Number(g.count) || 0),
      0,
    );

    base.items.push({ label: 'Questions', value: String(mainCount) });
    base.items.push({ label: 'Open Questions', value: String(openTotal) });
    base.tags = distribution
      .filter((g) => (Number(g.count) || 0) > 0)
      .map(
        (g) =>
          `${(g.questionType || 'ANY').toString().toUpperCase()} (${Number(
            g.count,
          )})`,
      );

    // Note the sub-segmentation actually applied to the main bank.
    const code = String(program?.code || '').toUpperCase();
    if (code === 'SCHOOL_STUDENT' && input.studentBoard) {
      base.note = `Main questions drawn for board: ${input.studentBoard}.`;
    } else if (code === 'EMPLOYEE' && input.employeeLevel) {
      base.note = `Main questions drawn for level: ${input.employeeLevel}.`;
    }
  }

  // ---- Level 2: ACI (may be delivered as IAT-Gen) ----
  private async fillAci(
    base: PreviewLevel,
    scope: RegistrationScope,
  ): Promise<void> {
    const total =
      ExamPatternPreviewService.ACI_VALUES *
      ExamPatternPreviewService.ACI_PER_VALUE;
    base.items.push({ label: 'Questions', value: String(total) });
    base.items.push({
      label: 'Structure',
      value: `${ExamPatternPreviewService.ACI_VALUES} values × ${ExamPatternPreviewService.ACI_PER_VALUE} questions`,
    });

    // ACI -> IAT-Gen replacement (iat.enabled + iat.level2_replacement_rules).
    const iatEnabled = await this.safeGet<boolean>('iat', 'enabled');
    if (iatEnabled) {
      const cfg = await this.safeGet<{ rules?: IatRule[] }>(
        'iat',
        'level2_replacement_rules',
      );
      const rules = Array.isArray(cfg?.rules) ? cfg!.rules! : [];
      if (rules.some((r) => this.matchesRule(r, scope))) {
        base.title = 'IAT Gen (replaces ACI)';
        base.note = 'This scope receives IAT-Gen in place of ACI at Level 2.';
        base.items = [];
        await this.fillIat(base, scope);
      }
    }
  }

  // ---- IAT-Gen: modules + set (Level 3, or Level 2 replacement) ----
  private async fillIat(
    base: PreviewLevel,
    scope: RegistrationScope,
  ): Promise<void> {
    const modules = await this.dataSource.query(
      `SELECT id, code, display_name AS name
         FROM iat_modules
        WHERE is_active = true AND is_deleted = false
        ORDER BY module_order ASC`,
    );
    if (!modules || modules.length === 0) {
      base.status = 'unavailable';
      base.reason = 'No active IAT modules configured.';
      return;
    }

    const resolved = await this.resolveIatModules(scope, modules);
    base.items.push({ label: 'Modules', value: String(resolved.count) });
    if (resolved.setName) {
      base.items.push({ label: 'Set', value: resolved.setName });
    }
  }

  /**
   * Mirrors student-service IatEligibilityService.filterModulesForRegistration,
   * but takes the scope directly (no registration row). Returns the resolved
   * module count and, when a rule-routed set matched, its name.
   */
  private async resolveIatModules(
    scope: RegistrationScope,
    modules: Array<{ id: number | string }>,
  ): Promise<{ count: number; setName: string | null }> {
    const rulesCfg = await this.safeGet<{ rules?: IatRule[] }>(
      'levels',
      'level3_scope_rules',
    );
    const rules = Array.isArray(rulesCfg?.rules) ? rulesCfg!.rules! : [];
    if (rules.length === 0) {
      return { count: modules.length, setName: null };
    }

    const setsCfg = await this.safeGet<IatModuleSet[]>('iat', 'module_sets');
    const sets = Array.isArray(setsCfg) ? setsCfg : [];
    const setMembers = new Map<string, string[]>();
    const setNames = new Map<string, string>();
    for (const set of sets) {
      if (set?.id === undefined || set?.id === null) continue;
      setMembers.set(String(set.id), this.normalizeIds(set.moduleIds));
      if (set.name) setNames.set(String(set.id), set.name);
    }

    const assignedIds = new Set<string>();
    for (const rule of rules) {
      if (rule.moduleSetId === undefined || rule.moduleSetId === null) continue;
      for (const mid of setMembers.get(String(rule.moduleSetId)) || []) {
        assignedIds.add(mid);
      }
    }
    if (assignedIds.size === 0) {
      return { count: modules.length, setName: null };
    }

    const matched: string[] = [];
    const matchedSeen = new Set<string>();
    const matchedSetNames: string[] = [];
    for (const rule of rules) {
      if (rule.moduleSetId === undefined || rule.moduleSetId === null) continue;
      if (this.matchesRule(rule, scope)) {
        const name = setNames.get(String(rule.moduleSetId));
        if (name && !matchedSetNames.includes(name)) matchedSetNames.push(name);
        for (const mid of setMembers.get(String(rule.moduleSetId)) || []) {
          if (!matchedSeen.has(mid)) {
            matchedSeen.add(mid);
            matched.push(mid);
          }
        }
      }
    }

    const activeIds = new Set(modules.map((m) => String(m.id)));
    // Matched set modules that are actually active + global (unrouted) modules.
    const keptMatched = matched.filter((id) => activeIds.has(id));
    const globalCount = modules.filter(
      (m) => !assignedIds.has(String(m.id)),
    ).length;

    return {
      count: keptMatched.length + globalCount,
      setName: matchedSetNames.length ? matchedSetNames.join(', ') : null,
    };
  }

  // ---- Metaphor ----
  private async fillMetaphor(base: PreviewLevel): Promise<void> {
    const active = await this.metaphorRepo
      .createQueryBuilder('mq')
      .where('mq.is_active = true')
      .andWhere('mq.is_deleted = false')
      .getCount();
    if (active === 0) {
      base.status = 'unavailable';
      base.reason = 'No active metaphor question bank configured.';
      return;
    }
    let count = ExamPatternPreviewService.DEFAULT_METAPHOR_COUNT;
    const configured = await this.safeGet<number>('metaphor', 'question_count');
    if (typeof configured === 'number' && configured > 0) {
      count = Math.floor(configured);
    }
    base.items.push({
      label: 'Questions',
      value: String(Math.min(count, active)),
    });
  }

  // OR semantics, kept in sync with LevelEligibilityService.matchesRule.
  private matchesRule(rule: IatRule, scope: RegistrationScope): boolean {
    const programIds = this.normalizeIds(rule.programIds);
    const degreeIds = this.normalizeIds(rule.departmentDegreeIds);
    const departmentIds = this.normalizeIds(rule.departmentIds);
    const boards = (rule.studentBoards || [])
      .map((b) => String(b || '').trim().toLowerCase())
      .filter(Boolean);

    if (
      programIds.length === 0 &&
      degreeIds.length === 0 &&
      departmentIds.length === 0 &&
      boards.length === 0
    ) {
      return true;
    }

    const programMatch =
      programIds.length > 0 &&
      programIds.includes(String(scope.programId || ''));
    const degreeMatch =
      degreeIds.length > 0 &&
      degreeIds.includes(String(scope.departmentDegreeId || ''));
    const departmentMatch =
      departmentIds.length > 0 &&
      departmentIds.includes(String(scope.departmentId || ''));
    const boardMatch =
      boards.length > 0 &&
      boards.includes(String(scope.studentBoard || '').trim().toLowerCase());

    return programMatch || degreeMatch || departmentMatch || boardMatch;
  }

  private normalizeIds(values: Array<number | string> | undefined): string[] {
    return (values || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }

  private async safeGet<T>(category: string, key: string): Promise<T | null> {
    try {
      return await this.settings.getValue<T>(category, key);
    } catch (err) {
      this.logger.warn(
        `Unable to read ${category}.${key}: ${(err as Error)?.message}`,
      );
      return null;
    }
  }
}
