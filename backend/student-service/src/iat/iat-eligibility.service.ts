import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OriginbiSetting } from '@originbi/shared-entities';
import { Registration } from '../entities/registration.entity';
import { IAT_ASSESSMENT_KIND } from './iat.constants';

interface IatRule {
  programIds?: Array<number | string>;
  departmentDegreeIds?: Array<number | string>;
  departmentIds?: Array<number | string>;
  studentBoards?: string[];
  // Only used by module_scope_rules: the IAT Module Set this rule grants
  // (one set per rule; id references iat.module_sets).
  moduleSetId?: number | string;
}

/** A named, reusable collection of IAT modules (iat.module_sets). */
interface IatModuleSet {
  id: number | string;
  name?: string;
  moduleIds?: Array<number | string>;
}

interface RegistrationEligibilityRow {
  id: number;
  programId: number | string | null;
  departmentDegreeId: number | string | null;
  departmentId: number | string | null;
  studentBoard: string | null;
}

@Injectable()
export class IatEligibilityService {
  private readonly logger = new Logger(IatEligibilityService.name);

  constructor(
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
  ) {}

  async getAssessmentKindForRegistration(
    registrationId: number,
  ): Promise<'ACI' | 'IAT_GEN'> {
    const enabled = Boolean(await this.readSetting('enabled', false));
    if (!enabled) return 'ACI';

    const rulesConfig = await this.readSetting<{ rules?: IatRule[] }>(
      'level2_replacement_rules',
      { rules: [] },
    );
    const rules = Array.isArray(rulesConfig?.rules) ? rulesConfig.rules : [];
    if (rules.length === 0) return 'ACI';

    const rows = (await this.settingRepo.manager.query(
      `SELECT r.id,
              r.program_id AS "programId",
              r.department_degree_id AS "departmentDegreeId",
              r.student_board AS "studentBoard",
              dd.department_id AS "departmentId"
       FROM registrations r
       LEFT JOIN department_degrees dd ON dd.id = r.department_degree_id
       WHERE r.id = $1
       LIMIT 1`,
      [registrationId],
    )) as unknown as RegistrationEligibilityRow[];
    const row = rows?.[0];
    if (!row) return 'ACI';

    const match = rules.some((rule) => this.matchesRule(rule, row));
    return match ? IAT_ASSESSMENT_KIND : 'ACI';
  }

  async isIatRegistration(
    registrationOrId: Registration | number | string,
  ): Promise<boolean> {
    const raw =
      typeof registrationOrId === 'number' ||
      typeof registrationOrId === 'string'
        ? registrationOrId
        : registrationOrId?.id;
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return false;
    return (
      (await this.getAssessmentKindForRegistration(id)) === IAT_ASSESSMENT_KIND
    );
  }

  /**
   * Filters IAT modules for a registration using the Level-3 scope rules
   * (`levels.level3_scope_rules`) - the SAME rules that decide who receives
   * Level 3 also carry an optional `moduleSetId` (from `iat.module_sets`) that
   * routes which module set the scope gets.
   *
   * Rules:
   *  - A module belonging to a set referenced by >=1 rule is "assigned" and is
   *    kept only when a rule whose set contains it MATCHES this registration.
   *  - A module in no rule-referenced set is "global" and is always kept.
   *  - No rules (or no rule names a set) => modules returned unchanged
   *    (back-compat: everyone gets all active modules).
   */
  async filterModulesForRegistration<T extends { id: number | string }>(
    registrationId: number | null | undefined,
    programId: number | string | null | undefined,
    modules: T[],
  ): Promise<T[]> {
    const rulesConfig = await this.readSetting<{ rules?: IatRule[] }>(
      'level3_scope_rules',
      { rules: [] },
      'levels',
    );
    const rules = Array.isArray(rulesConfig?.rules) ? rulesConfig.rules : [];
    if (rules.length === 0) return modules;

    // setId -> member module ids (as strings), from iat.module_sets.
    const setsConfig = await this.readSetting<IatModuleSet[]>(
      'module_sets',
      [],
    );
    const sets = Array.isArray(setsConfig) ? setsConfig : [];
    const setMembers = new Map<string, string[]>();
    for (const set of sets) {
      if (set?.id === undefined || set?.id === null) continue;
      setMembers.set(String(set.id), this.normalizeIds(set.moduleIds));
    }

    // Modules belonging to any set referenced by a rule are "assigned".
    const assignedIds = new Set<string>();
    for (const rule of rules) {
      if (rule.moduleSetId === undefined || rule.moduleSetId === null) continue;
      for (const mid of setMembers.get(String(rule.moduleSetId)) || []) {
        assignedIds.add(mid);
      }
    }
    if (assignedIds.size === 0) return modules; // no rule routes a non-empty set

    // Collect the matched modules IN THE ORDER the admin configured them in the
    // set (the set's moduleIds order = the order the exam plays them).
    const id = Number(registrationId);
    let row: RegistrationEligibilityRow | null = null;
    if (Number.isFinite(id) && id > 0) {
      const rows = (await this.settingRepo.manager.query(
        `SELECT r.id,
                r.program_id AS "programId",
                r.department_degree_id AS "departmentDegreeId",
                r.student_board AS "studentBoard",
                dd.department_id AS "departmentId"
         FROM registrations r
         LEFT JOIN department_degrees dd ON dd.id = r.department_degree_id
         WHERE r.id = $1
         LIMIT 1`,
        [id],
      )) as unknown as RegistrationEligibilityRow[];
      row = rows?.[0] ?? null;
    }

    // registrations.program_id is NULL for corporate registrations (they set
    // the program only on the session/attempt). Prefer the attempt's programId
    // so program-scoped rules still match; dept/degree/board come from the
    // registration row.
    const scope: RegistrationEligibilityRow = {
      id: row?.id ?? id,
      programId: programId ?? row?.programId ?? null,
      departmentDegreeId: row?.departmentDegreeId ?? null,
      departmentId: row?.departmentId ?? null,
      studentBoard: row?.studentBoard ?? null,
    };

    const matchedOrder: string[] = [];
    const matchedSeen = new Set<string>();
    for (const rule of rules) {
      if (rule.moduleSetId === undefined || rule.moduleSetId === null) {
        continue;
      }
      if (this.matchesRule(rule, scope)) {
        for (const mid of setMembers.get(String(rule.moduleSetId)) || []) {
          if (!matchedSeen.has(mid)) {
            matchedSeen.add(mid);
            matchedOrder.push(mid);
          }
        }
      }
    }

    const byId = new Map(modules.map((m) => [String(m.id), m]));
    const result: T[] = [];
    // 1. Matched set modules, in the admin-configured (selection) order.
    for (const mid of matchedOrder) {
      const m = byId.get(mid);
      if (m) result.push(m);
    }
    // 2. Global modules (in no routed set), in their natural module_order.
    for (const m of modules) {
      if (!assignedIds.has(String(m.id))) result.push(m);
    }

    this.logger.log(
      `[IatModules] reg=${registrationId} scope=${JSON.stringify(
        scope,
      )} activeModuleIds=[${modules
        .map((m) => m.id)
        .join(',')}] | sets=${JSON.stringify(
        sets.map((s) => ({ id: s.id, moduleIds: s.moduleIds })),
      )} | ruleSetIds=[${rules
        .map((r) => r.moduleSetId)
        .join(',')}] | assigned=[${[...assignedIds].join(
        ',',
      )}] | matched=[${matchedOrder.join(',')}] | kept=${result.length}`,
    );

    return result;
  }

  // OR semantics: matches when ANY selected dimension matches (program OR
  // department-degree OR department OR board). Empty fields are ignored; a rule
  // with nothing selected applies to everyone. Kept in sync with
  // LevelEligibilityService.matchesRule.
  private matchesRule(rule: IatRule, row: RegistrationEligibilityRow): boolean {
    const programIds = this.normalizeIds(rule.programIds);
    const degreeIds = this.normalizeIds(rule.departmentDegreeIds);
    const departmentIds = this.normalizeIds(rule.departmentIds);
    const boards = (rule.studentBoards || [])
      .map((board) =>
        String(board || '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

    if (
      programIds.length === 0 &&
      degreeIds.length === 0 &&
      departmentIds.length === 0 &&
      boards.length === 0
    ) {
      return true; // nothing selected => everyone
    }

    const programMatch =
      programIds.length > 0 && programIds.includes(String(row.programId || ''));
    const degreeMatch =
      degreeIds.length > 0 &&
      degreeIds.includes(String(row.departmentDegreeId || ''));
    const departmentMatch =
      departmentIds.length > 0 &&
      departmentIds.includes(String(row.departmentId || ''));
    const boardMatch =
      boards.length > 0 &&
      boards.includes(
        String(row.studentBoard || '')
          .trim()
          .toLowerCase(),
      );

    return programMatch || degreeMatch || departmentMatch || boardMatch;
  }

  private normalizeIds(values: Array<number | string> | undefined): string[] {
    return (values || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }

  private async readSetting<T>(
    key: string,
    fallback: T,
    category = 'iat',
  ): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category, settingKey: key },
      });
      const value = row?.value as unknown;
      return value === undefined || value === null ? fallback : (value as T);
    } catch (err) {
      this.logger.warn(
        `Unable to read iat.${key}; using fallback. ${(err as Error)?.message}`,
      );
      return fallback;
    }
  }
}
