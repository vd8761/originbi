/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { logger } from './logger';
import { getPool } from './dbPool';
import { ReportVariant } from './reportFactory';

/**
 * Admin-configured settings that drive the student preview variant decision.
 * Sourced from the `report` category of `originbi_settings`.
 */
export interface PreviewVariantSettings {
  /** Variant MBA students see in the preview (default 'level1'). */
  mbaVariant: ReportVariant;
  /** Variant non-MBA students see in the preview (default 'short'). */
  nonMbaVariant: ReportVariant;
  /** Message shown when the variant's required assessment is incomplete. */
  blockedMessage: string;
  /**
   * When true, `short`/`full` variants still require ACI completion (legacy
   * behaviour). When false (default), ACI is optional: the report generates
   * from DISC alone and ACI-dependent sections are skipped at render time.
   * DISC is always required regardless of this flag.
   */
  requireAci?: boolean;
}

export interface PreviewResolution {
  /** True when generation should be blocked (required assessment missing). */
  blocked: boolean;
  /** Resolved variant when not blocked. */
  variant?: ReportVariant;
  /** Message to show the student when blocked. */
  message?: string;
}

/** Case-insensitive "MBA" check, mirroring reportFactory's detection. */
function containsMba(...values: (string | null | undefined)[]): boolean {
  return values.some((v) => !!v && v.toUpperCase().includes('MBA'));
}

/**
 * Resolves which report variant a student should see in their preview, or
 * blocks generation when the required assessment data is missing.
 *
 * Rules:
 *  - MBA student      -> `settings.mbaVariant`     (default Level 1, DISC only)
 *  - non-MBA student  -> `settings.nonMbaVariant`  (default Short, DISC + ACI)
 *  - `level1` needs DISC; `short`/`full` need DISC **and** ACI. When the
 *    required data is absent, returns `{ blocked, message }` so the caller can
 *    tell the student to contact their administrator (the DISC-only report is
 *    reserved for MBA cohorts).
 *
 * MBA detection uses the student's department short-name / group name (any
 * containing "MBA"). ACI completion = a COMPLETED attempt whose metadata holds
 * `agile_scores`; DISC completion = a COMPLETED attempt holding `disc_scores`.
 */
export async function resolveStudentPreviewVariant(
  userId: string,
  settings: PreviewVariantSettings,
): Promise<PreviewResolution> {
  const client = await getPool().connect();
  try {
    // Latest completed-or-started session for this student, with the fields
    // needed to detect an MBA cohort (dept short-name + group name).
    const sessionQuery = `
      SELECT DISTINCT ON (s.user_id)
        s.id AS session_id,
        d.short_name AS dept_code,
        q.name AS group_name
      FROM assessment_sessions s
      JOIN registrations r ON s.registration_id = r.id
      LEFT JOIN department_degrees dd ON r.department_degree_id = dd.id
      LEFT JOIN departments d ON dd.department_id = d.id
      LEFT JOIN groups q ON s.group_id = q.id
      WHERE s.user_id = $1
      ORDER BY s.user_id,
               s.completed_at DESC NULLS LAST,
               s.started_at DESC NULLS LAST
      LIMIT 1
    `;
    const sessionResult = await client.query(sessionQuery, [userId]);
    const session = sessionResult.rows[0];

    if (!session) {
      logger.warn(`[PreviewResolver] No session found for user ${userId}.`);
      return { blocked: true, message: settings.blockedMessage };
    }

    // Which assessments has the student completed?
    const attemptsQuery = `
      SELECT metadata
      FROM assessment_attempts
      WHERE assessment_session_id = $1
      AND status = 'COMPLETED'
    `;
    const attemptsResult = await client.query(attemptsQuery, [
      session.session_id,
    ]);

    let discCompleted = false;
    let aciCompleted = false;
    for (const row of attemptsResult.rows) {
      const meta = row.metadata || {};
      if (meta.disc_scores) discCompleted = true;
      if (meta.agile_scores) aciCompleted = true;
    }

    const isMba = containsMba(session.dept_code, session.group_name);
    const variant: ReportVariant = isMba
      ? settings.mbaVariant
      : settings.nonMbaVariant;
    // ACI is optional by default: only `level1` strictly needs DISC, and
    // `short`/`full` previously also required ACI. With dynamic generation the
    // report skips ACI sections when data is absent, so we no longer block on
    // a missing ACI unless an admin has explicitly opted back in via setting.
    const needsAci =
      settings.requireAci === true && (variant === 'short' || variant === 'full');

    // DISC is always mandatory - there is no DISC-less report.
    if (!discCompleted || (needsAci && !aciCompleted)) {
      logger.info(
        `[PreviewResolver] User ${userId} blocked (variant=${variant}, ` +
          `isMba=${isMba}, disc=${discCompleted}, aci=${aciCompleted}, ` +
          `requireAci=${settings.requireAci === true}).`,
      );
      return { blocked: true, message: settings.blockedMessage };
    }

    logger.info(
      `[PreviewResolver] User ${userId} -> variant=${variant} ` +
        `(isMba=${isMba}, aci=${aciCompleted}).`,
    );
    return { blocked: false, variant };
  } catch (error) {
    logger.error('[PreviewResolver] Resolution failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
