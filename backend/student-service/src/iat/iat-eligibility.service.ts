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
}

@Injectable()
export class IatEligibilityService {
  private readonly logger = new Logger(IatEligibilityService.name);

  constructor(
    @InjectRepository(OriginbiSetting)
    private readonly settingRepo: Repository<OriginbiSetting>,
  ) {}

  async getAssessmentKindForRegistration(registrationId: number): Promise<'ACI' | 'IAT_GEN'> {
    const enabled = Boolean(await this.readSetting('enabled', false));
    if (!enabled) return 'ACI';

    const rulesConfig = await this.readSetting<{ rules?: IatRule[] }>(
      'level2_replacement_rules',
      { rules: [] },
    );
    const rules = Array.isArray(rulesConfig?.rules) ? rulesConfig.rules : [];
    if (rules.length === 0) return 'ACI';

    const rows = await this.settingRepo.manager.query(
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
    );
    const row = rows?.[0];
    if (!row) return 'ACI';

    const match = rules.some((rule) => this.matchesRule(rule, row));
    return match ? IAT_ASSESSMENT_KIND : 'ACI';
  }

  async isIatRegistration(registrationOrId: Registration | number | string): Promise<boolean> {
    const raw =
      typeof registrationOrId === 'number' || typeof registrationOrId === 'string'
        ? registrationOrId
        : (registrationOrId as Registration)?.id;
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) return false;
    return (await this.getAssessmentKindForRegistration(id)) === IAT_ASSESSMENT_KIND;
  }

  private matchesRule(rule: IatRule, row: any): boolean {
    const programMatch = this.idListMatches(rule.programIds, row.programId);
    if (!programMatch) return false;

    const degreeIds = this.normalizeIds(rule.departmentDegreeIds);
    const departmentIds = this.normalizeIds(rule.departmentIds);
    const boards = (rule.studentBoards || [])
      .map((board) => String(board || '').trim().toLowerCase())
      .filter(Boolean);

    const hasSpecificScope =
      degreeIds.length > 0 || departmentIds.length > 0 || boards.length > 0;
    if (!hasSpecificScope) return true;

    const degreeMatch =
      degreeIds.length > 0 && degreeIds.includes(String(row.departmentDegreeId || ''));
    const departmentMatch =
      departmentIds.length > 0 && departmentIds.includes(String(row.departmentId || ''));
    const boardMatch =
      boards.length > 0 &&
      boards.includes(String(row.studentBoard || '').trim().toLowerCase());

    return degreeMatch || departmentMatch || boardMatch;
  }

  private idListMatches(values: Array<number | string> | undefined, actual: any): boolean {
    const ids = this.normalizeIds(values);
    return ids.length === 0 || ids.includes(String(actual || ''));
  }

  private normalizeIds(values: Array<number | string> | undefined): string[] {
    return (values || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }

  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const row = await this.settingRepo.findOne({
        where: { category: 'iat', settingKey: key },
      });
      const value = row?.value;
      return value === undefined || value === null ? fallback : (value as T);
    } catch (err) {
      this.logger.warn(
        `Unable to read iat.${key}; using fallback. ${(err as Error)?.message}`,
      );
      return fallback;
    }
  }
}
