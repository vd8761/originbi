// reports/placement/mbaCharacterConstants.ts
//
// The MBA "16-character" framework for the MBA Consolidated Placement Report.
//
// The platform resolves every completed assessment to one of 16 behavioural
// characters: the 12 two-letter DISC blends + 4 single-letter Pure Traits
// (see migration 032_pure_traits.sql and helpers/discTrait.ts). The canonical
// `name` of each character matches `personality_traits.blended_style_name` so
// the report stays consistent with the rest of the platform.
//
// This module layers an MBA-specific reading on top of each character: an
// MBA persona (a plain-language role identity the reader sees instead of a
// cryptic code), the best-fit MBA specialization(s), concrete future roles with
// the reasoning behind each suggestion, and targeted preparation recommendations.
//
// Authored content — intentionally self-contained so the report does not depend
// on per-trait DB career rows being populated for the MBA department.

import { SpecializationCode } from '../college/mbaConstants';

/** A future MBA role this character is well suited to, with the "why". */
export interface MBACharacterRole {
  /** Role title, e.g. "Business Analyst". */
  name: string;
  /** One line on why this character fits the role. */
  why: string;
}

export interface MBACharacter {
  /** DISC code — 2-letter blend or single-letter Pure Trait. */
  code: string;
  /** Canonical archetype name (matches personality_traits.blended_style_name). */
  name: string;
  /** MBA role identity shown to the reader instead of the raw code. */
  mbaPersona: string;
  /** One-line summary of the character's placement edge. */
  tagline: string;
  /** 2–3 sentence narrative framed for an MBA placement context. */
  narrative: string;
  /** Best-fit MBA specialization. */
  primarySpec: SpecializationCode;
  /** Second-strongest specialization fit. */
  secondarySpec: SpecializationCode;
  /** Curated future roles with the reasoning behind each. */
  futureRoles: MBACharacterRole[];
  /** Targeted preparation / grooming recommendations. */
  recommendations: string[];
  /** Why these careers are recommended for this character. */
  reasoning: string;
}

/**
 * Canonical display order: the 12 blends first (matching ORDERED_STYLES), then
 * the 4 Pure Traits. The report iterates this order and skips empty characters.
 */
export const MBA_CHARACTER_ORDER: string[] = [
  'DI',
  'DS',
  'DC',
  'ID',
  'IS',
  'IC',
  'SD',
  'SI',
  'SC',
  'CD',
  'CI',
  'CS',
  'D',
  'I',
  'S',
  'C',
];

export const MBA_CHARACTERS: Record<string, MBACharacter> = {
  // ── High-D blends ─────────────────────────────────────────────────────────
  DI: {
    code: 'DI',
    name: 'Charismatic Leader',
    mbaPersona: 'The Growth Driver',
    tagline: 'Bold, persuasive, and energised by winning new business.',
    narrative:
      'Growth Drivers combine decisive drive with natural influence — they set ambitious targets and rally people behind them. In a cohort they are the candidates who pitch confidently, take ownership of outcomes, and thrive when results are visible and measured.',
    primarySpec: 'MKT',
    secondarySpec: 'OPS',
    futureRoles: [
      {
        name: 'Sales & Marketing Lead',
        why: 'Their persuasive drive converts directly into revenue-facing roles.',
      },
      {
        name: 'Business Development Manager',
        why: 'Comfortable opening conversations and closing high-stakes deals.',
      },
      {
        name: 'Brand / Category Manager',
        why: 'Pairs market instinct with the confidence to own a P&L line.',
      },
    ],
    recommendations: [
      'Channel drive into structured pitching — practise consultative selling, not just confident talking',
      'Build numerical fluency (pricing, margins, ROI) so ambition is backed by data',
      'Take a visible team-lead role in a live project before campus drives',
    ],
    reasoning:
      'High drive plus strong influence is the classic growth-leadership profile. These students close, persuade, and push outcomes — so revenue-facing marketing, sales, and business-development tracks reward their strengths fastest, with operations leadership as a strong second path.',
  },
  DS: {
    code: 'DS',
    name: 'Strategic Stabilizer',
    mbaPersona: 'The Operations Strategist',
    tagline: 'Drives results while keeping delivery steady and on-plan.',
    narrative:
      'Operations Strategists pair a results focus with patience and follow-through. They push goals forward without destabilising the team, making them dependable owners of plans, timelines, and execution.',
    primarySpec: 'OPS',
    secondarySpec: 'FIN',
    futureRoles: [
      {
        name: 'Operations Manager',
        why: 'Drives throughput while holding processes steady and predictable.',
      },
      {
        name: 'Project / Program Coordinator',
        why: 'Balances assertive delivery with consistent, on-plan execution.',
      },
      {
        name: 'Supply Chain Associate',
        why: 'Goal focus and reliability suit coordination-heavy operations roles.',
      },
    ],
    recommendations: [
      'Learn lean / Six Sigma fundamentals to formalise an instinct for steady execution',
      'Practise stakeholder communication so decisiveness reads as leadership, not pressure',
      'Strengthen Excel and project-planning tools for delivery-tracking roles',
    ],
    reasoning:
      'The blend of drive and steadiness is built for execution at scale. Operations rewards leaders who can both push and stabilise; finance is a strong second fit where disciplined, goal-focused delivery matters.',
  },
  DC: {
    code: 'DC',
    name: 'Decisive Analyst',
    mbaPersona: 'The Finance Strategist',
    tagline: 'Makes fast, evidence-backed calls under pressure.',
    narrative:
      'Finance Strategists combine a bias for action with analytical rigour. They are comfortable making high-stakes decisions from numbers, which positions them well for finance, risk, and strategy roles where judgement and accuracy both matter.',
    primarySpec: 'FIN',
    secondarySpec: 'OPS',
    futureRoles: [
      {
        name: 'Finance Analyst',
        why: 'Turns analysis into confident, decision-ready recommendations.',
      },
      {
        name: 'Risk Analyst',
        why: 'Decisive judgement plus rigour suits identifying and pricing risk.',
      },
      {
        name: 'Corporate Strategy Associate',
        why: 'Pairs analytical depth with the nerve to back a recommendation.',
      },
    ],
    recommendations: [
      'Build foundations in financial modelling, valuation, and ratio analysis',
      'Practise structuring case interviews so decisions are visibly evidence-led',
      'Develop patience to validate assumptions before committing',
    ],
    reasoning:
      'Drive paired with analytical discipline is the finance-strategy profile: these students decide quickly but defend their calls with data. Finance and corporate strategy reward that combination, with operations a strong analytical-execution alternative.',
  },
  // ── High-I blends ─────────────────────────────────────────────────────────
  ID: {
    code: 'ID',
    name: 'Energetic Visionary',
    mbaPersona: 'The Brand Builder',
    tagline: 'Turns ideas and energy into market momentum.',
    narrative:
      'Brand Builders lead with enthusiasm and creative drive. They generate ideas, energise teams, and move fast — a natural fit for brand, campaign, and growth roles that reward initiative and communication.',
    primarySpec: 'MKT',
    secondarySpec: 'HR',
    futureRoles: [
      {
        name: 'Marketing Executive',
        why: 'Creative energy and drive suit fast-moving campaign work.',
      },
      {
        name: 'Brand Associate',
        why: 'Builds and champions brand stories with visible enthusiasm.',
      },
      {
        name: 'Digital Marketing Specialist',
        why: 'Initiative and adaptability fit experiment-driven digital roles.',
      },
    ],
    recommendations: [
      'Anchor ideas in consumer insight and the 4Ps so creativity stays strategic',
      'Practise finishing campaigns end-to-end to convert energy into delivery',
      'Learn marketing analytics to measure the impact of bold ideas',
    ],
    reasoning:
      'Influence plus drive creates persuasive, idea-led professionals. Marketing rewards their visible energy and initiative; people-facing HR roles are a strong second path where rallying others matters.',
  },
  IS: {
    code: 'IS',
    name: 'Supportive Energizer',
    mbaPersona: 'The People Champion',
    tagline: 'Builds morale, trust, and engagement across teams.',
    narrative:
      'People Champions blend warmth with people-energy. They make others feel included, smooth over friction, and keep teams motivated — strengths that map directly onto human-resources and engagement roles.',
    primarySpec: 'HR',
    secondarySpec: 'MKT',
    futureRoles: [
      {
        name: 'HR Executive',
        why: 'People-first warmth suits employee relations and HR operations.',
      },
      {
        name: 'Employee Engagement Executive',
        why: 'Naturally lifts morale and drives culture initiatives.',
      },
      {
        name: 'Talent Acquisition Associate',
        why: 'Rapport-building makes candidate engagement effortless.',
      },
    ],
    recommendations: [
      'Learn the recruitment lifecycle, engagement, and L&D fundamentals',
      'Build documentation/HRIS discipline to balance people focus with structure',
      'Practise handling difficult conversations and conflict resolution',
    ],
    reasoning:
      'People-orientation plus supportiveness is the engagement profile. HR rewards their ability to connect and sustain morale; marketing (especially customer-facing roles) is a strong second fit for the same relational strengths.',
  },
  IC: {
    code: 'IC',
    name: 'Creative Thinker',
    mbaPersona: 'The Market Storyteller',
    tagline: 'Pairs communication flair with an eye for detail.',
    narrative:
      'Market Storytellers combine expressive communication with attention to detail. They craft messages that land and back them with substance — well suited to research-led marketing, content, and customer-insight roles.',
    primarySpec: 'MKT',
    secondarySpec: 'BA',
    futureRoles: [
      {
        name: 'Market Research Analyst',
        why: 'Joins curiosity about people with disciplined analysis.',
      },
      {
        name: 'Content Marketing Associate',
        why: 'Communication flair plus detail produces sharp, credible content.',
      },
      {
        name: 'Customer Insights Associate',
        why: 'Translates behavioural data into a compelling narrative.',
      },
    ],
    recommendations: [
      'Build research methods and basic analytics (surveys, segmentation, dashboards)',
      'Practise turning data into a clear, persuasive story',
      'Develop fundamentals of digital marketing and consumer behaviour',
    ],
    reasoning:
      'Communication plus detail orientation makes for credible storytellers. Marketing and customer insight reward that mix; business analytics is a strong second path where the same rigour applies to data.',
  },
  // ── High-S blends ─────────────────────────────────────────────────────────
  SD: {
    code: 'SD',
    name: 'Reliable Executor',
    mbaPersona: 'The Delivery Manager',
    tagline: 'Gets things done consistently, under any conditions.',
    narrative:
      'Delivery Managers are steady, responsible, and quietly driven. They deliver on commitments without drama and keep operations running — the backbone of execution-heavy teams.',
    primarySpec: 'OPS',
    secondarySpec: 'FIN',
    futureRoles: [
      {
        name: 'Operations Executive',
        why: 'Consistency and ownership keep daily operations dependable.',
      },
      {
        name: 'Service Delivery Coordinator',
        why: 'Reliability is exactly what delivery and SLA roles demand.',
      },
      {
        name: 'Logistics Associate',
        why: 'Steady follow-through suits coordination and fulfilment work.',
      },
    ],
    recommendations: [
      'Learn process mapping, lean basics, and root-cause analysis',
      'Strengthen Excel and project-tracking tools for delivery roles',
      'Practise speaking up early so reliability is paired with initiative',
    ],
    reasoning:
      'Steadiness with an undercurrent of drive is the dependable-delivery profile. Operations rewards consistent executors; finance operations is a strong second fit where accuracy and reliability matter.',
  },
  SI: {
    code: 'SI',
    name: 'Collaborative Optimist',
    mbaPersona: 'The Engagement Partner',
    tagline: 'Keeps teams aligned, positive, and working together.',
    narrative:
      'Engagement Partners are supportive communicators who keep groups cohesive. They listen, mediate, and maintain a positive tone — strengths that suit HR partnering and client-coordination roles.',
    primarySpec: 'HR',
    secondarySpec: 'MKT',
    futureRoles: [
      {
        name: 'HR Operations Associate',
        why: 'Collaboration and patience suit people-systems and support roles.',
      },
      {
        name: 'Client Coordination Executive',
        why: 'Bridges teams and clients with a steady, positive style.',
      },
      {
        name: 'Learning & Development Coordinator',
        why: 'Supportive optimism makes training and enablement land well.',
      },
    ],
    recommendations: [
      'Build HR fundamentals and structured-interview practice',
      'Strengthen documentation and HRIS/coordination tooling',
      'Develop assertiveness so collaboration includes advocating a position',
    ],
    reasoning:
      'Supportiveness plus communication is the partnering profile. HR rewards their alignment-building; marketing and client-facing coordination are a strong second path for the same relational strengths.',
  },
  SC: {
    code: 'SC',
    name: 'Dependable Specialist',
    mbaPersona: 'The Process Custodian',
    tagline: 'Guards quality, accuracy, and consistency.',
    narrative:
      'Process Custodians combine steadiness with precision. They follow process meticulously, catch errors early, and hold standards — ideal for quality, compliance, and process-governance roles.',
    primarySpec: 'OPS',
    secondarySpec: 'FIN',
    futureRoles: [
      {
        name: 'Quality Assurance Analyst',
        why: 'Precision and patience are exactly what QA roles reward.',
      },
      {
        name: 'Process Improvement Analyst',
        why: 'Spots inefficiencies and standardises them out methodically.',
      },
      {
        name: 'Audit / Compliance Associate',
        why: 'Reliability plus accuracy suits controls and compliance work.',
      },
    ],
    recommendations: [
      'Learn Six Sigma, SOP design, and quality-control frameworks',
      'Build Excel and documentation depth for controls-heavy roles',
      'Practise pace — set review cut-offs so thoroughness stays time-bound',
    ],
    reasoning:
      'Steadiness with precision is the process-and-controls profile. Operations and quality rewards meticulous, consistent specialists; finance (audit, compliance) is a strong second fit.',
  },
  // ── High-C blends ─────────────────────────────────────────────────────────
  CD: {
    code: 'CD',
    name: 'Analytical Leader',
    mbaPersona: 'The Business Analyst',
    tagline: 'Leads with logic, structure, and data-backed decisions.',
    narrative:
      'Business Analysts combine analytical depth with the confidence to drive conclusions. They structure ambiguous problems, interrogate data, and make recommendations stick — the core business-analytics and strategy profile.',
    primarySpec: 'BA',
    secondarySpec: 'FIN',
    futureRoles: [
      {
        name: 'Business Analyst',
        why: 'Translates business problems into structured, data-led answers.',
      },
      {
        name: 'Data Analyst',
        why: 'Analytical rigour plus drive turns data into decisions.',
      },
      {
        name: 'Analytics / Strategy Consultant',
        why: 'Comfortable owning a recommendation and defending it with evidence.',
      },
    ],
    recommendations: [
      'Build SQL, advanced Excel, and one BI tool (Power BI / Tableau)',
      'Learn descriptive statistics and basic Python or R',
      'Assemble a small portfolio of dashboards or analysis case studies',
    ],
    reasoning:
      'Analytical strength paired with drive is the business-analyst profile — the reason this character reads as "Business Analyst" rather than a code. Analytics rewards their structured problem-solving; finance is a strong second fit for the same quantitative discipline.',
  },
  CI: {
    code: 'CI',
    name: 'Logical Innovator',
    mbaPersona: 'The Data Storyteller',
    tagline: 'Finds patterns and explains them clearly.',
    narrative:
      'Data Storytellers pair analytical thinking with communication. They uncover insight in data and make it understandable to non-technical stakeholders — a natural fit for analytics, BI, and insight roles.',
    primarySpec: 'BA',
    secondarySpec: 'MKT',
    futureRoles: [
      {
        name: 'Reporting / BI Analyst',
        why: 'Turns recurring data into clear dashboards leaders actually use.',
      },
      {
        name: 'Insights Associate',
        why: 'Bridges analysis and communication to drive decisions.',
      },
      {
        name: 'Marketing Analytics Associate',
        why: 'Applies analytical clarity to campaign and customer data.',
      },
    ],
    recommendations: [
      'Build SQL, Excel, and dashboarding plus data-visualisation skills',
      'Practise presenting analysis to non-technical audiences',
      'Learn marketing/operations metrics to apply analytics in context',
    ],
    reasoning:
      'Analytical thinking plus communication is the insight-translation profile. Analytics rewards their pattern-finding; marketing analytics is a strong second path where the same clarity drives campaigns.',
  },
  CS: {
    code: 'CS',
    name: 'Structured Supporter',
    mbaPersona: 'The Risk & Compliance Analyst',
    tagline: 'Methodical, accurate, and steady with detail.',
    narrative:
      'Risk & Compliance Analysts combine precision with patience and reliability. They work systematically, document thoroughly, and keep things compliant — well matched to finance operations, audit, and risk roles.',
    primarySpec: 'FIN',
    secondarySpec: 'OPS',
    futureRoles: [
      {
        name: 'Audit Associate',
        why: 'Methodical accuracy is the core of audit work.',
      },
      {
        name: 'Treasury / Risk Analyst',
        why: 'Patient precision suits exposure tracking and controls.',
      },
      {
        name: 'Financial Operations Analyst',
        why: 'Structured, steady detail handling keeps finance ops clean.',
      },
    ],
    recommendations: [
      'Build financial accounting, controls, and reconciliation fundamentals',
      'Strengthen Excel modelling and documentation accuracy',
      'Practise communicating findings concisely to decision-makers',
    ],
    reasoning:
      'Precision with steadiness is the controls-and-risk profile. Finance rewards their accuracy and method; operations (quality, process) is a strong second fit.',
  },
  // ── Pure Traits ──────────────────────────────────────────────────────────
  D: {
    code: 'D',
    name: 'Bold Driver',
    mbaPersona: 'The Frontline Leader',
    tagline: 'Decisive, competitive, and energised by ownership.',
    narrative:
      'Frontline Leaders are direct and results-focused — they take charge, decide fast, and thrive under pressure. They suit roles where ownership and a competitive edge convert directly into performance.',
    primarySpec: 'OPS',
    secondarySpec: 'MKT',
    futureRoles: [
      {
        name: 'Operations / Team Lead',
        why: 'Decisive ownership drives frontline execution and targets.',
      },
      {
        name: 'Sales Executive',
        why: 'Competitive drive converts directly into revenue results.',
      },
      {
        name: 'Business Development Associate',
        why: 'Comfortable initiating and pushing deals forward.',
      },
    ],
    recommendations: [
      'Pair drive with listening — invite input before committing decisions',
      'Build the data fluency (targets, margins, KPIs) that backs bold calls',
      'Take a measurable, target-owning role before campus drives',
    ],
    reasoning:
      'Pure drive is the frontline-leadership profile: these students push results and own outcomes. Operations and sales-led marketing reward decisiveness and competitiveness fastest.',
  },
  I: {
    code: 'I',
    name: 'Inspiring Motivator',
    mbaPersona: 'The Relationship Builder',
    tagline: 'Wins people over with optimism and energy.',
    narrative:
      'Relationship Builders are outgoing, persuasive, and people-first. They build rapport quickly and spark enthusiasm — strengths that shine in customer-facing marketing and people-facing HR roles.',
    primarySpec: 'MKT',
    secondarySpec: 'HR',
    futureRoles: [
      {
        name: 'Marketing / Brand Executive',
        why: 'Persuasive warmth suits audience- and brand-facing work.',
      },
      {
        name: 'Talent Acquisition Associate',
        why: 'Rapport-building makes candidate engagement natural.',
      },
      {
        name: 'Client Relationship Executive',
        why: 'Connects quickly and keeps relationships positive.',
      },
    ],
    recommendations: [
      'Ground enthusiasm in strategy — learn the 4Ps and segmentation',
      'Build focus and follow-through to finish what energy starts',
      'Practise active listening so persuasion is balanced with empathy',
    ],
    reasoning:
      'Pure people-energy is the relationship-building profile. Marketing rewards their persuasive warmth; HR is a strong second path where connecting with people is the job.',
  },
  S: {
    code: 'S',
    name: 'Steadfast Anchor',
    mbaPersona: 'The Dependable Coordinator',
    tagline: 'Calm, consistent, and trusted to follow through.',
    narrative:
      'Dependable Coordinators bring calm, patience, and dependability. They support others, honour commitments, and keep teams stable — ideal for coordination, support, and people-operations roles.',
    primarySpec: 'OPS',
    secondarySpec: 'HR',
    futureRoles: [
      {
        name: 'Operations Coordinator',
        why: 'Consistency and follow-through keep coordination dependable.',
      },
      {
        name: 'HR Operations Associate',
        why: 'Patient, people-aware support suits HR systems and care.',
      },
      {
        name: 'Service / Support Associate',
        why: 'Steady reliability is exactly what support roles need.',
      },
    ],
    recommendations: [
      'Practise adapting quickly when priorities change',
      'Build assertiveness — voice your views as openly as you support others',
      'Strengthen Excel and coordination tooling for operations roles',
    ],
    reasoning:
      'Pure steadiness is the dependable-coordination profile. Operations rewards reliable follow-through; HR operations is a strong second fit for the same supportive consistency.',
  },
  C: {
    code: 'C',
    name: 'Precise Perfectionist',
    mbaPersona: 'The Analytical Specialist',
    tagline: 'Accurate, evidence-led, and quality-driven.',
    narrative:
      'Analytical Specialists hold a high bar for accuracy and structure. They think things through, rely on evidence, and produce work that withstands scrutiny — a natural fit for finance and analytics roles.',
    primarySpec: 'FIN',
    secondarySpec: 'BA',
    futureRoles: [
      {
        name: 'Finance / Audit Analyst',
        why: 'Accuracy and rigour are the foundation of finance roles.',
      },
      {
        name: 'Data / Reporting Analyst',
        why: 'Quality-driven analysis suits data and reporting work.',
      },
      {
        name: 'Risk / Compliance Associate',
        why: 'High standards map directly onto controls and compliance.',
      },
    ],
    recommendations: [
      'Build financial accounting, modelling, and analytics fundamentals',
      'Set review cut-offs so thoroughness does not slow delivery',
      'Practise communicating findings with warmth and brevity',
    ],
    reasoning:
      'Pure precision is the analytical-specialist profile. Finance rewards their accuracy and evidence-led judgement; business analytics is a strong second fit for the same rigour.',
  },
};

/**
 * Resolves a raw trait code to one of the 16 MBA characters. Normalises case,
 * accepts a 1- or 2-letter code, and falls back to the closest valid character
 * (the 2-letter blend of the first two valid DISC letters, else the pure trait,
 * else the Charismatic Leader) so the report never crashes on odd data.
 */
export function getMBACharacter(rawCode: string | null | undefined): MBACharacter {
  const code = (rawCode || '').toUpperCase().replace(/[^DISC]/g, '');
  if (MBA_CHARACTERS[code]) return MBA_CHARACTERS[code];
  if (code.length >= 2 && MBA_CHARACTERS[code.slice(0, 2)]) {
    return MBA_CHARACTERS[code.slice(0, 2)];
  }
  if (code.length >= 1 && MBA_CHARACTERS[code[0]]) {
    return MBA_CHARACTERS[code[0]];
  }
  return MBA_CHARACTERS.DI;
}
