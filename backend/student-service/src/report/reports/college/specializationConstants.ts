/**
 * Specialization & Trait Mapping content — ported from the standalone
 * placement-cell "Specialization Report" (specialization-report/src/constants.ts
 * and discProfile.ts).
 *
 * Source of truth: "Specialisation Mapping with Traits .docx".
 * Maps each of the 16 DISC profile codes to:
 *   - a trait-profile name (e.g. "Driver + People Skills")
 *   - priority weights for the 5 MBA electives (1 = strongest fit .. 5 = weakest)
 *   - a worded recommended specialization (e.g. "Finance and Marketing")
 *   - top future roles
 *
 * Used by the College Level 1 short report (page 2) to show the student's
 * specialization fit alongside their behavioural archetype.
 */

export interface SpecEntry {
  /** Human-readable trait name, e.g. "Driver + People Skills". */
  trait: string;
  /** Priority weights, 1 (strongest fit) .. 5 (weakest fit). */
  finance: number;
  hr: number;
  marketing: number;
  operations: number;
  analytics: number;
  /** Worded suggestion, e.g. "Finance and Marketing". */
  suggestion: string;
  /** Top future roles for this profile (docx lists 10). */
  roles: string[];
}

/** Column keys for the five fit columns, in fixed display order. */
export const FIT_COLUMNS = [
  'finance',
  'hr',
  'marketing',
  'operations',
  'analytics',
] as const;

export type FitKey = (typeof FIT_COLUMNS)[number];

export const FIT_COLUMN_LABELS: Record<FitKey, string> = {
  finance: 'Finance',
  hr: 'HR',
  marketing: 'Marketing',
  operations: 'Operations',
  analytics: 'Business Analytics',
};

export const SPEC_MAP: Record<string, SpecEntry> = {
  D: {
    trait: 'Pure Dominance',
    finance: 1, hr: 4, marketing: 2, operations: 3, analytics: 5,
    suggestion: 'Finance and Marketing',
    roles: ['CEO', 'Managing Director', 'Investment Banker', 'Venture Capitalist', 'Private Equity Associate', 'Business Development Head', 'Sales Director', 'M&A Analyst', 'Brand Strategist', 'Entrepreneur'],
  },
  I: {
    trait: 'Pure Influence',
    finance: 4, hr: 2, marketing: 1, operations: 5, analytics: 3,
    suggestion: 'Marketing and HR',
    roles: ['Chief Marketing Officer', 'Brand Manager', 'PR Head', 'Sales Manager', 'Corporate Communications Head', 'Advertising Manager', 'Key Account Manager', 'Talent Acquisition Head', 'L&D Head', 'Employer Branding Manager'],
  },
  S: {
    trait: 'Pure Steadiness',
    finance: 5, hr: 1, marketing: 3, operations: 2, analytics: 4,
    suggestion: 'HR and Operations',
    roles: ['Chief People Officer', 'HR Manager', 'Employee Relations Manager', 'Training & Development Head', 'Talent Acquisition Lead', 'Operations Manager', 'Project Manager', 'Supply Chain Coordinator', 'Customer Success Head', 'CSR Lead'],
  },
  C: {
    trait: 'Pure Conscientiousness',
    finance: 2, hr: 5, marketing: 4, operations: 3, analytics: 1,
    suggestion: 'Business Analytics and Finance',
    roles: ['Data Analyst', 'Business Intelligence Manager', 'Financial Analyst', 'Risk Manager', 'Quantitative Analyst', 'Actuary', 'Compliance Officer', 'Financial Controller', 'Credit Analyst', 'Internal Auditor'],
  },
  DI: {
    trait: 'Driver + People Skills',
    finance: 2, hr: 4, marketing: 1, operations: 5, analytics: 3,
    suggestion: 'Marketing and Finance',
    roles: ['Chief Marketing Officer', 'Sales Director', 'Business Development Director', 'Brand Strategist', 'Key Account Head', 'Regional Sales Head', 'Investment Banker', 'Consulting Partner', 'Growth Head', 'Entrepreneur'],
  },
  DS: {
    trait: 'Driver + Stability',
    finance: 2, hr: 3, marketing: 4, operations: 1, analytics: 5,
    suggestion: 'Operations and Finance',
    roles: ['Operations Director', 'General Manager', 'Supply Chain Director', 'Plant Head', 'P&L Owner', 'Procurement Head', 'Regional Head', 'Logistics Director', 'Business Unit Head', 'Production Head'],
  },
  DC: {
    trait: 'Driver + Precision',
    finance: 1, hr: 5, marketing: 4, operations: 3, analytics: 2,
    suggestion: 'Finance and Business Analytics',
    roles: ['CFO', 'Strategy Head', 'Private Equity Manager', 'M&A Lead', 'Risk Head', 'Financial Controller', 'Investment Director', 'Portfolio Manager', 'Credit Risk Manager', 'Corporate Finance Head'],
  },
  ID: {
    trait: 'Influencer + Drive',
    finance: 3, hr: 4, marketing: 1, operations: 5, analytics: 2,
    suggestion: 'Marketing and Operations',
    roles: ['CMO', 'Sales Director', 'Brand Head', 'Business Development Head', 'Digital Marketing Head', 'Product Marketing Manager', 'Channel Sales Head', 'Retail Head', 'Trade Marketing Manager', 'Entrepreneur'],
  },
  IS: {
    trait: 'Influencer + Empathy',
    finance: 5, hr: 1, marketing: 2, operations: 4, analytics: 3,
    suggestion: 'HR and Marketing',
    roles: ['Chief People Officer', 'HR Director', 'L&D Head', 'Culture & Engagement Manager', 'Talent Management Lead', 'Employer Branding Manager', 'Corporate Communications Head', 'Customer Experience Head', 'Brand Community Manager', 'Internal Communications Lead'],
  },
  IC: {
    trait: 'Influencer + Rigour',
    finance: 3, hr: 4, marketing: 2, operations: 5, analytics: 1,
    suggestion: 'Business Analytics and Marketing',
    roles: ['Data Analytics Manager', 'Consumer Insights Head', 'Market Research Head', 'Digital Strategy Lead', 'Pricing Manager', 'Category Manager', 'CRM Head', 'Product Manager', 'Brand Analytics Manager', 'Media Strategy Lead'],
  },
  SD: {
    trait: 'Steady + Drive',
    finance: 3, hr: 2, marketing: 4, operations: 1, analytics: 5,
    suggestion: 'Operations and HR',
    roles: ['Operations Director', 'Supply Chain Head', 'Project Director', 'Plant Manager', 'Procurement Manager', 'Logistics Head', 'Production Head', 'Warehouse Operations Head', 'Vendor Management Head', 'Employee Relations Manager'],
  },
  SI: {
    trait: 'Steady + Influence',
    finance: 5, hr: 1, marketing: 2, operations: 3, analytics: 4,
    suggestion: 'HR and Marketing',
    roles: ['HR Director', 'L&D Head', 'Employee Engagement Manager', 'Talent Management Lead', 'Welfare Manager', 'Campus Relations Manager', 'Corporate Communications Head', 'Customer Success Head', 'CSR Head', 'Internal Communications Lead'],
  },
  SC: {
    trait: 'Steady + Precision',
    finance: 3, hr: 4, marketing: 5, operations: 1, analytics: 2,
    suggestion: 'Operations and Business Analytics',
    roles: ['Supply Chain Manager', 'Quality Manager', 'Process Improvement Lead', 'Project Manager', 'Logistics Manager', 'Production Planning Manager', 'Operations Analyst', 'Supply Chain Analyst', 'Process Analyst', 'Vendor Relations Manager'],
  },
  CD: {
    trait: 'Analyst + Drive',
    finance: 1, hr: 5, marketing: 4, operations: 3, analytics: 2,
    suggestion: 'Finance and Business Analytics',
    roles: ['CFO', 'Investment Banker', 'Private Equity Analyst', 'M&A Analyst', 'Risk Head', 'Financial Controller', 'Hedge Fund Analyst', 'Portfolio Manager', 'Quantitative Analyst', 'Corporate Finance Manager'],
  },
  CI: {
    trait: 'Analyst + Influence',
    finance: 3, hr: 4, marketing: 2, operations: 5, analytics: 1,
    suggestion: 'Business Analytics and Marketing',
    roles: ['Data Analytics Consultant', 'Consumer Insights Lead', 'Market Research Head', 'Pricing Analyst', 'CRM Head', 'Category Manager', 'Media Strategy Lead', 'Product Manager', 'Digital Analytics Head', 'Marketing Strategy Lead'],
  },
  CS: {
    trait: 'Analyst + Steadiness',
    finance: 2, hr: 3, marketing: 5, operations: 4, analytics: 1,
    suggestion: 'Business Analytics and Finance',
    roles: ['Data Quality Manager', 'Operations Analyst', 'Supply Chain Analyst', 'Process Analyst', 'Compliance Officer', 'Risk Analyst', 'Financial Planner', 'Internal Auditor', 'Credit Analyst', 'HR Analytics Lead'],
  },
};

/** Legend shown alongside the elective fit ranking. */
export const LEGEND_TEXT = '1 = Strongest Fit  ·  5 = Weakest Fit';

/**
 * The five MBA electives, in canonical order, each with a short brief and an
 * accent colour. `key` matches the fit-column key used in SPEC_MAP.
 */
export const ELECTIVES: ReadonlyArray<{
  label: string;
  key: FitKey;
  accent: string;
  blurb: string;
}> = [
  {
    label: 'Human Resource (HR)',
    key: 'hr',
    accent: '#17A398',
    blurb:
      'Talent acquisition, learning & development, employee relations and organisational culture. Best for empathetic, steady, people-oriented profiles.',
  },
  {
    label: 'Finance',
    key: 'finance',
    accent: '#2D5BD0',
    blurb:
      'Financial analysis, investment, corporate finance and risk management. Best for detail-driven, analytical and decisive profiles.',
  },
  {
    label: 'Marketing',
    key: 'marketing',
    accent: '#D63384',
    blurb:
      'Brand management, sales, communications and growth. Best for persuasive, energetic, influence-led profiles.',
  },
  {
    label: 'Operations',
    key: 'operations',
    accent: '#E07B2E',
    blurb:
      'Supply chain, project delivery, production and process management. Best for dependable, execution-focused profiles.',
  },
  {
    label: 'Business Analytics',
    key: 'analytics',
    accent: '#7C4DCC',
    blurb:
      'Data analysis, business intelligence and insight generation. Best for precise, structured, analytical profiles.',
  },
];

/**
 * High-factor baseline explanations, used when a student resolves to a pure
 * single-trait code (D/I/S/C override).
 */
export const HIGH_FACTOR_TEXT: Record<'D' | 'I' | 'S' | 'C', string> = {
  D: 'Pure Dominance (D): Demonstrates strong decisive output, assertive execution, and thrives in high-stakes environments.',
  I: 'Pure Influence (I): Communicates with persuasive energy, builds rapport quickly, and excels at mobilising people around ideas.',
  S: 'Pure Steadiness (S): Brings dependable, consistent delivery, a calm collaborative temperament, and sustained reliability.',
  C: 'Pure Conscientiousness (C): High-precision structural tracking, analytical rigour, and sharp detail orientation.',
};

export type DiscScores = { D: number; I: number; S: number; C: number };

/** Deterministic priority used as a tie-breaker (matches the originBI report). */
const PRIORITY: Array<keyof DiscScores> = ['C', 'D', 'I', 'S'];

/**
 * Returns the resolved DISC profile code (faithful port of the placement-cell
 * override hierarchy):
 *   - a single letter ('D' | 'I' | 'S' | 'C') when a high-factor override fires
 *   - otherwise the top two traits concatenated, e.g. 'CD'.
 */
export function calculateDiscProfile(scores: DiscScores): string {
  const sorted = (Object.keys(scores) as Array<keyof DiscScores>)
    .map((k) => ({ factor: k, score: scores[k] }))
    .sort((a, b) => {
      const diff = b.score - a.score;
      if (diff !== 0) return diff;
      return PRIORITY.indexOf(a.factor) - PRIORITY.indexOf(b.factor);
    });

  const [top, ...rest] = sorted;

  // 1. High-factor absolute override threshold.
  if (top.score >= 20) return top.factor;

  // 2. High-factor relative division rule: top/2 strictly greater than every
  //    other dimension.
  const halfTop = top.score / 2;
  if (rest.every((r) => halfTop > r.score)) return top.factor;

  // 3. Standard dual-trait profile: top two traits combined.
  return `${top.factor}${rest[0].factor}`;
}

/** True when the resolved code is a single-trait (high-factor) override. */
export function isHighFactor(code: string): boolean {
  return code.length === 1;
}
