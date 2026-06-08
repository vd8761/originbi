/**
 * MBA Specialization Suitability - supporting constants.
 *
 * The MBA short report ("Origin BI MBA SpecFit") ranks five MBA specializations
 * (Finance, HR, Business Analytics, Operations, Marketing) using:
 *   1. Five work-readiness indicators (mapped from `AgileScore` fields)
 *   2. The student's DISC behavioral profile (mapped to a Behavioral Orientation)
 *
 * See the design plan and feature documentation
 * ("MBA Specialization Suitability Report.pdf") for the underlying logic.
 */

export type SpecializationCode = 'FIN' | 'HR' | 'BA' | 'OPS' | 'MKT';

export type FitLevel =
  | 'Excellent Fit'
  | 'Good Fit'
  | 'Moderate Fit'
  | 'Low Fit';

export type BehavioralAlignment = 'Strong' | 'Moderate' | 'Low';

/** Internal indicator name (matches AgileScore fields). */
export type ReadinessKey =
  | 'commitment'
  | 'focus'
  | 'openness'
  | 'respect'
  | 'courage';

/** Report-friendly label for each readiness indicator. */
export const READINESS_LABEL: Record<ReadinessKey, string> = {
  commitment: 'Ownership & Responsibility',
  focus: 'Goal Focus & Consistency',
  openness: 'Learning Adaptability',
  respect: 'Collaboration & Professional Maturity',
  courage: 'Confidence & Initiative',
};

/** Order in which readiness indicators appear in the report. */
export const READINESS_ORDER: ReadinessKey[] = [
  'commitment',
  'focus',
  'openness',
  'respect',
  'courage',
];

/** A career role with a short one-line description of what the role does. */
export interface CareerRole {
  name: string;
  description: string;
}

export interface SpecializationMeta {
  code: SpecializationCode;
  name: string;
  /** Accent color (deep) for hero card border + #1 ranking highlight. */
  accent: string;
  /** Soft tint of the accent for chip backgrounds. */
  accentSoft: string;
  /** Text color to pair against accent backgrounds. */
  accentOn: string;
  /** One-liner shown in the ranking table when this spec is at this rank. */
  reasonOnePager: string;
  /** Bullets that flesh out the "Why this recommendation" sentence. */
  bestSuitedFor: string[];
  /**
   * Curated career roles for this specialization, with short descriptions.
   * First entry is treated as the "Top Career Match" hero in the report.
   */
  defaultRoles: CareerRole[];
  /** Preparation plan items for the recommended specialization. */
  preparation: string[];
}

export const SPECIALIZATIONS: Record<SpecializationCode, SpecializationMeta> = {
  FIN: {
    code: 'FIN',
    name: 'Finance',
    accent: '#0E2A6B',
    accentSoft: '#E4EAF5',
    accentOn: '#FFFFFF',
    reasonOnePager:
      'Suited for focus, accuracy, responsibility, numerical discipline, and careful decision-making.',
    bestSuitedFor: [
      'Goal focus & analytical patience',
      'Responsibility & decision discipline',
      'Risk awareness & numerical accuracy',
    ],
    defaultRoles: [
      {
        name: 'Finance Analyst',
        description:
          'Analyses financial data and supports key business decisions.',
      },
      {
        name: 'Banking Associate',
        description:
          'Manages client relationships and core banking operations.',
      },
      {
        name: 'Equity Research Associate',
        description:
          'Researches markets, companies, and recommends investments.',
      },
      {
        name: 'Corporate Finance Trainee',
        description: 'Supports M&A, treasury, and capital planning activities.',
      },
      {
        name: 'Audit Associate',
        description:
          'Reviews financial statements for accuracy and compliance.',
      },
      {
        name: 'Treasury Analyst',
        description:
          'Manages cash flow, liquidity, and short-term risk exposure.',
      },
      {
        name: 'Risk Analyst',
        description: 'Identifies and mitigates financial risk across the firm.',
      },
    ],
    preparation: [
      'Build foundations in financial accounting and corporate finance',
      'Practise Excel modelling and ratio analysis',
      'Track market news and read company annual reports',
      'Attempt mock case interviews focused on numerical reasoning',
    ],
  },
  HR: {
    code: 'HR',
    name: 'Human Resources',
    accent: '#0A6E63',
    accentSoft: '#DCEFEB',
    accentOn: '#FFFFFF',
    reasonOnePager:
      'Best match for people interaction, communication, responsibility, and professional maturity.',
    bestSuitedFor: [
      'Collaboration & professional maturity',
      'Responsibility & communication orientation',
      'Adaptability & employee support mindset',
    ],
    defaultRoles: [
      {
        name: 'HR Executive',
        description: 'Handles day-to-day employee relations and HR operations.',
      },
      {
        name: 'Talent Acquisition Associate',
        description: 'Sources, screens, and onboards new hires across teams.',
      },
      {
        name: 'Learning & Development Coordinator',
        description: 'Designs and runs training programs for employee growth.',
      },
      {
        name: 'Employee Engagement Executive',
        description: 'Drives workplace culture and engagement initiatives.',
      },
      {
        name: 'HR Operations Associate',
        description: 'Maintains HRIS, payroll inputs, and compliance records.',
      },
      {
        name: 'Training Coordinator',
        description:
          'Schedules and tracks employee training sessions end-to-end.',
      },
      {
        name: 'Client Coordination Executive',
        description: 'Bridges client needs with internal delivery teams.',
      },
    ],
    preparation: [
      'Build basic HR fundamentals - recruitment lifecycle, engagement, L&D',
      'Practise structured interviews and group discussions weekly',
      'Strengthen Excel and HRIS documentation skills',
      'Read case studies on people management and conflict handling',
    ],
  },
  BA: {
    code: 'BA',
    name: 'Business Analytics',
    accent: '#4B2C83',
    accentSoft: '#EAE2F2',
    accentOn: '#FFFFFF',
    reasonOnePager:
      'Suited for data interpretation, logical thinking, tool-based learning, and pattern identification.',
    bestSuitedFor: [
      'Focus & analytical thinking',
      'Learning adaptability & tool interest',
      'Problem-solving & decision discipline',
    ],
    defaultRoles: [
      {
        name: 'Business Analyst',
        description: 'Translates business needs into actionable data insights.',
      },
      {
        name: 'Data Analyst',
        description:
          'Cleans, analyses data, and builds reports for stakeholders.',
      },
      {
        name: 'Reporting Analyst',
        description:
          'Produces recurring dashboards and KPI reports for leaders.',
      },
      {
        name: 'Operations Analyst',
        description: 'Improves processes through quantitative analysis.',
      },
      {
        name: 'Insights Associate',
        description: 'Synthesises data into clear business recommendations.',
      },
      {
        name: 'BI Developer Trainee',
        description: 'Builds dashboards and analytical tools end-to-end.',
      },
      {
        name: 'Analytics Consultant',
        description: 'Advises clients on data-driven strategy and execution.',
      },
    ],
    preparation: [
      'Practise SQL, advanced Excel, and one BI tool (Power BI / Tableau)',
      'Learn descriptive statistics and basic Python or R',
      'Build a small portfolio of dashboards or analysis case studies',
      'Read business case interpretations to develop pattern recognition',
    ],
  },
  OPS: {
    code: 'OPS',
    name: 'Operations',
    accent: '#A24B12',
    accentSoft: '#F6E3D6',
    accentOn: '#FFFFFF',
    reasonOnePager:
      'Strong match for planning, coordination, responsibility, focus, and execution.',
    bestSuitedFor: [
      'Responsibility & process consistency',
      'Focus & coordination',
      'Documentation & quality control',
    ],
    defaultRoles: [
      {
        name: 'Operations Executive',
        description: 'Runs daily operations and drives process execution.',
      },
      {
        name: 'Supply Chain Associate',
        description: 'Coordinates suppliers, inventory, and logistics flow.',
      },
      {
        name: 'Process Improvement Analyst',
        description: 'Identifies inefficiencies and drives lean improvements.',
      },
      {
        name: 'Operations Coordinator',
        description: 'Coordinates cross-functional operational activities.',
      },
      {
        name: 'Logistics Associate',
        description: 'Manages shipments, warehousing, and distribution.',
      },
      {
        name: 'Quality Assurance Analyst',
        description: 'Ensures product and service quality standards are met.',
      },
      {
        name: 'Service Delivery Coordinator',
        description: 'Manages client service delivery operations end-to-end.',
      },
    ],
    preparation: [
      'Learn basics of supply chain, lean, and Six Sigma concepts',
      'Practise process mapping and root-cause analysis',
      'Strengthen Excel, MS Project, and documentation skills',
      'Read operations case studies from manufacturing and services',
    ],
  },
  MKT: {
    code: 'MKT',
    name: 'Marketing',
    accent: '#A8195A',
    accentSoft: '#F4DCE7',
    accentOn: '#FFFFFF',
    reasonOnePager:
      'Suited for communication, creativity, persuasion, customer understanding, and initiative.',
    bestSuitedFor: [
      'Confidence & initiative',
      'Adaptability & customer orientation',
      'Communication & persuasion',
    ],
    defaultRoles: [
      {
        name: 'Marketing Executive',
        description: 'Plans and executes campaigns to drive brand visibility.',
      },
      {
        name: 'Brand Associate',
        description: 'Builds and maintains brand identity and positioning.',
      },
      {
        name: 'Digital Marketing Specialist',
        description: 'Runs paid, social, and SEO campaigns end-to-end.',
      },
      {
        name: 'Content Marketing Associate',
        description: 'Creates content that drives audience engagement.',
      },
      {
        name: 'Sales & Marketing Trainee',
        description: 'Supports lead generation and sales enablement.',
      },
      {
        name: 'Market Research Analyst',
        description:
          'Studies consumers and competitors for actionable insights.',
      },
      {
        name: 'Customer Insights Associate',
        description: 'Analyses customer behaviour to inform strategy.',
      },
    ],
    preparation: [
      'Build foundations in the 4Ps, segmentation, and consumer behaviour',
      'Practise pitching ideas and presentations weekly',
      'Learn fundamentals of digital marketing and analytics',
      'Read brand and campaign case studies to sharpen creativity',
    ],
  },
};

export const SPECIALIZATION_ORDER: SpecializationCode[] = [
  'FIN',
  'HR',
  'BA',
  'OPS',
  'MKT',
];

/**
 * Weights describe how heavily each readiness indicator counts toward a
 * specialization's suitability. Higher weight = more important.
 *
 * Suitability score (0–100) is computed as a weighted average of the five
 * readiness percentages: Σ(pct_i * w_i) / Σ(w_i).
 */
export const SPEC_WEIGHTS: Record<
  SpecializationCode,
  Record<ReadinessKey, number>
> = {
  FIN: {
    commitment: 1.2,
    focus: 1.5,
    openness: 0.6,
    respect: 0.7,
    courage: 1.0,
  },
  HR: {
    commitment: 1.2,
    focus: 0.8,
    openness: 1.0,
    respect: 1.5,
    courage: 1.0,
  },
  BA: {
    commitment: 0.9,
    focus: 1.4,
    openness: 1.3,
    respect: 0.7,
    courage: 1.0,
  },
  OPS: {
    commitment: 1.3,
    focus: 1.3,
    openness: 0.8,
    respect: 1.1,
    courage: 0.8,
  },
  MKT: {
    commitment: 0.8,
    focus: 0.8,
    openness: 1.2,
    respect: 1.0,
    courage: 1.5,
  },
};

/**
 * Behavioral alignment maps the dominant DISC trait to a Strong/Moderate/Low
 * fit for each specialization. Used as a multiplier on the readiness score:
 *   Strong = 1.00, Moderate = 0.92, Low = 0.82
 */
export const DISC_ALIGNMENT: Record<
  'D' | 'I' | 'S' | 'C',
  Record<SpecializationCode, BehavioralAlignment>
> = {
  D: {
    FIN: 'Moderate',
    HR: 'Low',
    BA: 'Moderate',
    OPS: 'Strong',
    MKT: 'Strong',
  },
  I: { FIN: 'Low', HR: 'Strong', BA: 'Low', OPS: 'Moderate', MKT: 'Strong' },
  S: {
    FIN: 'Moderate',
    HR: 'Strong',
    BA: 'Moderate',
    OPS: 'Strong',
    MKT: 'Moderate',
  },
  C: { FIN: 'Strong', HR: 'Moderate', BA: 'Strong', OPS: 'Strong', MKT: 'Low' },
};

export const ALIGNMENT_MULTIPLIER: Record<BehavioralAlignment, number> = {
  Strong: 1.0,
  Moderate: 0.92,
  Low: 0.82,
};

/**
 * Plain-language behavioural orientation labels for the top-two DISC traits.
 * Tries primary+secondary first, then falls back to a single-trait label.
 */
export const BEHAVIORAL_ORIENTATION: Record<string, string> = {
  // High-D combinations
  DI: 'Action-Driven & Persuasive',
  DC: 'Decisive & Analytical',
  DS: 'Steady-Driven & Goal-Focused',
  // High-I combinations
  ID: 'People-Oriented & Action-Driven',
  IS: 'People-Oriented & Supportive',
  IC: 'Communicative & Detail-Aware',
  // High-S combinations
  SD: 'Reliable & Result-Aware',
  SI: 'Supportive & Communicative',
  SC: 'Steady & Process-Oriented',
  // High-C combinations
  CD: 'Analytical & Result-Aware',
  CI: 'Analytical & Communicative',
  CS: 'Analytical & Steady',
  // Single-trait fallbacks
  D: 'Action-Driven & Goal-Focused',
  I: 'People-Oriented & Expressive',
  S: 'Steady & Collaborative',
  C: 'Analytical & Methodical',
};

/** Levels surfaced next to readiness bars (no raw scores in the student view). */
export function readinessBand(pct: number): {
  level: string;
  color: string;
} {
  if (pct >= 80) return { level: 'Excellent', color: '#2E7D32' };
  if (pct >= 60) return { level: 'Good', color: '#1976D2' };
  if (pct >= 40) return { level: 'Developing', color: '#ED6C02' };
  return { level: 'Needs Focus', color: '#C62828' };
}

/** Color + label for a Fit Level pill. */
export function fitLevelStyle(level: FitLevel): {
  bg: string;
  fg: string;
  dot: string;
} {
  switch (level) {
    case 'Excellent Fit':
      return { bg: '#E6F4EA', fg: '#1E6F36', dot: '#2E7D32' };
    case 'Good Fit':
      return { bg: '#E3EEF9', fg: '#155494', dot: '#1976D2' };
    case 'Moderate Fit':
      return { bg: '#FBEBD8', fg: '#8A4A05', dot: '#ED6C02' };
    case 'Low Fit':
    default:
      return { bg: '#ECECEE', fg: '#4A4A55', dot: '#757575' };
  }
}

/** Translates a final suitability score (0–100) into a Fit Level. */
export function fitLevelFromScore(score: number): FitLevel {
  if (score >= 78) return 'Excellent Fit';
  if (score >= 62) return 'Good Fit';
  if (score >= 48) return 'Moderate Fit';
  return 'Low Fit';
}

// ── Shared per-student specialization scoring ──────────────────────────────
// Used by both the MBA short report (collegeMBAShort.ts) and the MBA placement
// report (mbaPlacementReport.ts) so the ranking math stays identical.

export type DiscTrait = 'D' | 'I' | 'S' | 'C';

export interface SpecRanking {
  code: SpecializationCode;
  meta: SpecializationMeta;
  readinessScore: number;
  alignment: BehavioralAlignment;
  finalScore: number;
  fit: FitLevel;
  rank: number;
}

/**
 * Normalizes a single readiness indicator to a 0–100 percentage.
 * Indicators are documented on a 0–25 scale, but some pipelines emit 0–100;
 * values above 25 are treated as already-percentage.
 */
export function normalizeReadiness(raw: unknown): number {
  const v = Number(raw) || 0;
  if (v <= 0) return 0;
  const pct = v > 25 ? v : (v / 25) * 100;
  return Math.max(0, Math.min(100, pct));
}

/**
 * Ranks all five MBA specializations for a single student.
 *
 * @param readinessPct  The five readiness indicators already normalized to 0–100.
 * @param primaryTrait  The student's dominant DISC trait (D/I/S/C).
 * @returns The five specializations sorted by finalScore desc, each with a 1-based rank.
 */
export function rankSpecializations(
  readinessPct: Record<ReadinessKey, number>,
  primaryTrait: DiscTrait,
): SpecRanking[] {
  const ranked: SpecRanking[] = SPECIALIZATION_ORDER.map((code) => {
    const meta = SPECIALIZATIONS[code];
    const weights = SPEC_WEIGHTS[code];
    let weighted = 0;
    let sumW = 0;
    READINESS_ORDER.forEach((k) => {
      weighted += readinessPct[k] * weights[k];
      sumW += weights[k];
    });
    const readinessScore = sumW > 0 ? weighted / sumW : 0;
    const alignment = DISC_ALIGNMENT[primaryTrait][code];
    const finalScore = readinessScore * ALIGNMENT_MULTIPLIER[alignment];
    return {
      code,
      meta,
      readinessScore,
      alignment,
      finalScore,
      fit: fitLevelFromScore(finalScore),
      rank: 0,
    };
  });
  ranked.sort((a, b) => b.finalScore - a.finalScore);
  ranked.forEach((r, i) => (r.rank = i + 1));
  return ranked;
}

/**
 * Detects a student's declared MBA track from their department code / group name
 * (e.g. "MBA_FINANCE" or a group named "MBA - Marketing"). Returns the matching
 * specialization code, or null when no specialization keyword is present (e.g. a
 * general "MBA" department).
 */
export function detectDeclaredTrackCode(
  deptCode?: string | null,
  groupName?: string | null,
): SpecializationCode | null {
  // Tokenize on non-letters and drop the generic "MBA" marker so it can't
  // accidentally match short specialization codes (e.g. "MBA" contains "BA").
  const tokens = `${deptCode || ''} ${groupName || ''}`
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((t) => t && t !== 'MBA');

  const map: { keys: string[]; code: SpecializationCode }[] = [
    { keys: ['FINANCE', 'FIN'], code: 'FIN' },
    { keys: ['HR', 'HUMAN', 'RESOURCE', 'RESOURCES'], code: 'HR' },
    { keys: ['ANALYTICS', 'ANALYTIC', 'BA'], code: 'BA' },
    { keys: ['OPERATIONS', 'OPERATION', 'OPS'], code: 'OPS' },
    { keys: ['MARKETING', 'MKT'], code: 'MKT' },
  ];
  for (const entry of map) {
    if (entry.keys.some((k) => tokens.includes(k))) return entry.code;
  }
  return null;
}
