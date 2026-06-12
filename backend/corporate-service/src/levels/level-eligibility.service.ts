import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

/**
 * Resolves which assessment levels a corporate registration should receive,
 * based on the admin-configurable `levels.*` settings (per-level enable flag +
 * scope rules). Mirrors the admin-service copy of this service.
 *
 * `assessment_levels.is_mandatory` is honoured only as a defensive fallback
 * when a level's setting row is missing. Empty rules on an enabled level =
 * applies to everyone.
 */

export interface ScopeRule {
  programIds?: Array<number | string>;
  departmentDegreeIds?: Array<number | string>;
  departmentIds?: Array<number | string>;
  studentBoards?: string[];
}

export interface RegistrationScope {
  programId?: number | string | null;
  departmentDegreeId?: number | string | null;
  departmentId?: number | string | null;
  studentBoard?: string | null;
}

export interface LevelLike {
  levelNumber: number;
  isMandatory?: boolean;
}

@Injectable()
export class LevelEligibilityService {
  private readonly logger = new Logger(LevelEligibilityService.name);

  constructor(private readonly settings: SettingsService) {}

  /** Keep only the levels enabled for this registration, preserving order. */
  async filterEnabledLevels<T extends LevelLike>(
    levels: T[],
    scope: RegistrationScope,
  ): Promise<T[]> {
    const out: T[] = [];
    for (const level of levels) {
      if (await this.isLevelEnabled(level, scope)) out.push(level);
    }
    return out;
  }

  async isLevelEnabled(
    level: LevelLike,
    scope: RegistrationScope,
  ): Promise<boolean> {
    const enabled = await this.readBool(`level${level.levelNumber}_enabled`);
    if (enabled === null) return Boolean(level.isMandatory);
    if (enabled === false) return false;

    const rules = await this.readRules(`level${level.levelNumber}_scope_rules`);
    if (rules.length === 0) return true; // empty = everyone
    return rules.some((rule) => this.matchesRule(rule, scope));
  }

  private async readBool(key: string): Promise<boolean | null> {
    try {
      const value = await this.settings.getValue<boolean>('levels', key);
      return typeof value === 'boolean' ? value : null;
    } catch (err) {
      this.logger.warn(
        `Unable to read levels.${key}; using fallback. ${(err as Error)?.message}`,
      );
      return null;
    }
  }

  private async readRules(key: string): Promise<ScopeRule[]> {
    try {
      const cfg = await this.settings.getValue<{ rules?: ScopeRule[] }>(
        'levels',
        key,
      );
      return Array.isArray(cfg?.rules) ? (cfg as { rules: ScopeRule[] }).rules : [];
    } catch {
      return [];
    }
  }

  // OR semantics: a registration matches when ANY selected dimension matches
  // (program OR department-degree OR department OR board). Empty fields are
  // ignored; a rule with nothing selected applies to everyone.
  private matchesRule(rule: ScopeRule, scope: RegistrationScope): boolean {
    const programIds = this.normalizeIds(rule.programIds);
    const degreeIds = this.normalizeIds(rule.departmentDegreeIds);
    const departmentIds = this.normalizeIds(rule.departmentIds);
    const boards = (rule.studentBoards || [])
      .map((board) => String(board || '').trim().toLowerCase())
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
}
