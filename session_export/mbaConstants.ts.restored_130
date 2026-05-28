/**
 * MBA Specialization Suitability — supporting constants.
 *
 * The MBA short report ("Origin BI MBA SpecFit") ranks five MBA specializations
 * (Finance, HR, Business Analytics, Operations, Marketing) using:
 *   1. Five work-readiness indicators (mapped from `AgileScore` fields)
 *   2. The student's DISC behavioral profile (mapped to a Behavioral Orientation)
 *
 * See the design plan and feature documentation
 * ("MBA Specialization Suitability Report.pdf") for the underlying logic.
 */

export type SpecializationCode =
  | 'FIN'
  | 'HR'
  | 'BA'
  | 'OPS'
  | 'MKT';

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
  /** Default career roles surfaced if the DB returns nothing for this spec. */
  defaultRoles: string[];
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
      'Finance Analyst',
      'Banking Associate',
      'Equity Research Associate',
      'Corporate Finance Trainee',
      'Audit Associate',
      'Treasury Analyst',
      'Risk Analyst',
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
      'HR Executive',
      'Talent Acquisition Associate',
      'Learning and Development Coordinator',
      'Employee Engagement Executive',
      'HR Operations Associate',
      'Training Coordinator',
      'Client Coordination Executive',
    ],
    preparation: [
      'Build basic HR fundamentals — recruitment lifecycle, engagement, L&D',
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
      'Business Analyst',
      'Data Analyst',
      'Reporting Analyst',
      'Operations Analyst',
      'Insights Associate',
      'BI Developer Trainee',
      'Analytics Consultant',
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
      'Operations Executive',
      'Supply Chain Associate',
      'Process Improvement Analyst',
      'Operations Coordinator',
      'Logistics Associate',
      'Quality Assurance Analyst',
      'Service Delivery Coordinator',
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
      'Marketing Executive',
      'Brand Associate',
      'Digital Marketing Specialist',
      'Content Marketing Associate',
      'Sales & Marketing Trainee',
      'Market Research Analyst',
      'Customer Insights Associate',
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
export const SPEC_WEIGHTS: Record<SpecializationCode, Record<ReadinessKey, number>> = {
  FIN: { commitment: 1.2, focus: 1.5, openness: 0.6, respect: 0.7, courage: 1.0 },
  HR:  { commitment: 1.2, focus: 0.8, openness: 1.0, respect: 1.5, courage: 1.0 },
  BA:  { commitment: 0.9, focus: 1.4, openness: 1.3, respect: 0.7, courage: 1.0 },
  OPS: { commitment: 1.3, focus: 1.3, openness: 0.8, respect: 1.1, courage: 0.8 },
  MKT: { commitment: 0.8, focus: 0.8, openness: 1.2, respect: 1.0, courage: 1.5 },
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
  D: { FIN: 'Moderate', HR: 'Low',      BA: 'Moderate', OPS: 'Strong',   MKT: 'Strong'   },
  I: { FIN: 'Low',      HR: 'Strong',   BA: 'Low',      OPS: 'Moderate', MKT: 'Strong'   },
  S: { FIN: 'Moderate', HR: 'Strong',   BA: 'Moderate', OPS: 'Strong',   MKT: 'Moderate' },
  C: { FIN: 'Strong',   HR: 'Moderate', BA: 'Strong',   OPS: 'Strong',   MKT: 'Low'      },
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
