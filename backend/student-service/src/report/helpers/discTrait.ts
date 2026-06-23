/**
 * DISC trait resolver - TypeScript mirror of
 * backend/exam-engine/internal/service/disc_trait.go.
 *
 * The exam engine is the single source of truth for `dominant_trait_id`; the
 * report layer should prefer that stored value for the HEADLINE / narrative
 * trait. This helper exists for (a) a fallback when an attempt predates the
 * engine change, and (b) the top-two blend used by the career/compatibility
 * lookups (see below). `resolveDominantFactor` MUST stay byte-for-byte
 * equivalent to the Go resolver - both are validated against the same canonical
 * cases (disc_trait_test.go and validate_disc_trait_ts.js).
 */

const DISC_FACTOR_PRIORITY: Record<string, number> = { C: 0, D: 1, I: 2, S: 3 };

interface FactorScore {
  factor: string;
  score: number;
}

/** Factors present in `scores`, sorted by score desc, tie-break C>D>I>S. */
function sortedFactors(scores: Record<string, number>): FactorScore[] {
  const list: FactorScore[] = [];
  for (const f of ['D', 'I', 'S', 'C']) {
    const v = scores[f];
    if (v === undefined || v === null) continue;
    list.push({ factor: f, score: Number(v) });
  }
  list.sort((a, b) =>
    a.score !== b.score
      ? b.score - a.score
      : DISC_FACTOR_PRIORITY[a.factor] - DISC_FACTOR_PRIORITY[b.factor],
  );
  return list;
}

/**
 * Resolves the HEADLINE trait code from raw DISC factor sums. Returns a single
 * letter ("D"/"I"/"S"/"C") - a Pure Trait - when one DISC dimension is dominant
 * enough, otherwise the top-two blend (e.g. "DI").
 *
 * Rule (total = D+I+S+C): pure when `top*2 >= total` OR `top/2 > every other`;
 * tie-break C>D>I>S; guard when top/total <= 0.
 */
export function resolveDominantFactor(scores: Record<string, number>): string {
  const list = sortedFactors(scores);
  if (list.length === 0) return '';

  const total = list.reduce((sum, x) => sum + x.score, 0);
  const top = list[0];
  if (list.length === 1) return top.factor;

  if (top.score > 0 && total > 0) {
    if (top.score * 2 >= total) return top.factor; // rule (1): >= 50% of total
    if (list.slice(1).every((r) => top.score / 2 > r.score)) return top.factor; // rule (2)
  }

  return top.factor + list[1].factor;
}

/**
 * The top-two DISC blend (two highest factors, tie-break C>D>I>S) - always the
 * 2-letter code, with NO pure-trait override. This is what the existing 12-blend
 * content keyed by `trait_id` expects.
 */
export function topTwoBlend(scores: Record<string, number>): string {
  const list = sortedFactors(scores);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0].factor;
  return list[0].factor + list[1].factor;
}

/**
 * Resolves the HEADLINE trait code from per-student report data, honouring the
 * exam engine as the single source of truth. Order of preference:
 *   1. `dominant_trait_code` - the code the engine already stored (authoritative,
 *      pure-capable). In production this is always present for completed attempts.
 *   2. the raw DISC sums in `most_answered_answer_type` (these COUNT values ARE the
 *      engine's `disc_scores` input - see groupReportHelper), applying the same
 *      rule the engine uses, so the fallback matches the engine byte-for-byte.
 *   3. the percentage-scaled `score_*` as a last resort (e.g. legacy mock data
 *      with no counts) - ordering is preserved even if the absolute cutoff is not.
 */
export function resolveHeadlineFromReportData(data: {
  dominant_trait_code?: string;
  most_answered_answer_type?: { ANSWER_TYPE: string; COUNT: number }[];
  score_D?: number;
  score_I?: number;
  score_S?: number;
  score_C?: number;
}): string {
  if (data.dominant_trait_code) return data.dominant_trait_code;

  const counts = data.most_answered_answer_type;
  if (counts && counts.length >= 4) {
    const m: Record<string, number> = {};
    for (const c of counts) m[c.ANSWER_TYPE] = Number(c.COUNT);
    return resolveDominantFactor(m);
  }

  return resolveDominantFactor({
    D: data.score_D ?? 0,
    I: data.score_I ?? 0,
    S: data.score_S ?? 0,
    C: data.score_C ?? 0,
  });
}

/** True when a resolved code is a single-letter Pure Trait (D/I/S/C). */
export function isPureTrait(code: string): boolean {
  return code.length === 1 && code !== '';
}

/**
 * Splits a resolved code into [primary, secondary]. For a Pure Trait the
 * secondary is '' - callers that look up two-letter maps should guard on that.
 */
export function splitTrait(code: string): [string, string] {
  return [code.charAt(0) || '', code.charAt(1) || ''];
}

/**
 * Whether the pure traits have their own rows in the `trait_id`-keyed content
 * tables (`career_roles`, `career_role_*`, `trait_based_course_details`).
 *
 * While `false`, a Pure-Trait student's career-guidance and course-compatibility
 * sections fall back to their **top-two blend** (their two highest factors) - the
 * blend rows always exist. Flip to `true` once pure rows are authored to switch
 * pure students onto their own data; nothing else changes.
 */
export const PURE_CAREER_ROWS_AVAILABLE = false;

/**
 * The trait code to use for the `trait_id`-keyed career/compatibility lookups,
 * given the resolved headline trait. This is the single seam where "pure traits
 * borrow the top-two blend's data" lives - see PURE_CAREER_ROWS_AVAILABLE.
 */
export function careerLookupCode(
  resolvedTrait: string,
  scores: Record<string, number>,
): string {
  if (PURE_CAREER_ROWS_AVAILABLE && isPureTrait(resolvedTrait)) {
    return resolvedTrait;
  }
  return topTwoBlend(scores);
}
