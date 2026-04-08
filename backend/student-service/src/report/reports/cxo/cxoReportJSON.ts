/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
/**
 * cxoReportJSON.ts
 * ----------------
 * Standalone JSON builder that mirrors the computation logic of CxoReport
 * but returns structured JSON instead of generating a PDF.
 *
 * Usage:
 *   const json = await buildCxoReportJSON(cxoData);
 *   res.json(json);
 */

import { CxoData, COLORS } from '../../types/types';
import { logger } from '../../helpers/logger';
import {
  CXO_TOC_CONTENT,
  CXO_CONTENT,
  CXO_DYNAMIC_CONTENT,
  BLENDED_STYLE_MAPPING,
  DISCLAIMER_CONTENT,
} from './cxoConstants';
import { ACI, ACI_SCORE, DISCLAIMER } from '../BaseConstants';

// ─── Helper: Top-Two DISC Traits ─────────────────────────────────────────────

function getTopTwoTraits(
  mostAnswered: { ANSWER_TYPE: string; COUNT: number }[],
  scores: {
    score_D: number;
    score_I: number;
    score_S: number;
    score_C: number;
  },
): [string, string] {
  let traitScores: { type: string; val: number }[];

  if (mostAnswered && mostAnswered.length >= 4) {
    traitScores = mostAnswered.map((item) => ({
      type: item.ANSWER_TYPE,
      val: item.COUNT,
    }));
  } else {
    traitScores = [
      { type: 'D', val: scores.score_D },
      { type: 'I', val: scores.score_I },
      { type: 'S', val: scores.score_S },
      { type: 'C', val: scores.score_C },
    ];
  }

  const PRIORITY = ['C', 'D', 'I', 'S'];
  traitScores.sort((a, b) => {
    const diff = b.val - a.val;
    if (diff !== 0) return diff;
    return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type);
  });

  return [traitScores[0].type, traitScores[1].type];
}

// ─── Helper: Word Sketch Level ───────────────────────────────────────────────

function getWordSketchLevel(score: number): number {
  if (score <= 15) return 1;
  if (score <= 30) return 2;
  if (score <= 45) return 3;
  if (score <= 60) return 4;
  if (score <= 75) return 5;
  return 6;
}

// ─── Helper: Build Nature Style Chart Data ───────────────────────────────────

function buildNatureStyleChartData(topTrait: string, data: CxoData) {
  const chartMap: Record<
    string,
    { label: string; value: number; color: number[] }[]
  > = {
    D: [
      { label: 'D', value: 85, color: [...COLORS.D] },
      { label: 'I', value: 30, color: [...COLORS.I] },
      { label: 'S', value: 25, color: [...COLORS.S] },
      { label: 'C', value: 40, color: [...COLORS.C] },
    ],
    I: [
      { label: 'D', value: 30, color: [...COLORS.D] },
      { label: 'I', value: 80, color: [...COLORS.I] },
      { label: 'S', value: 50, color: [...COLORS.S] },
      { label: 'C', value: 30, color: [...COLORS.C] },
    ],
    S: [
      { label: 'D', value: 25, color: [...COLORS.D] },
      { label: 'I', value: 35, color: [...COLORS.I] },
      { label: 'S', value: 85, color: [...COLORS.S] },
      { label: 'C', value: 40, color: [...COLORS.C] },
    ],
    C: [
      { label: 'D', value: 20, color: [...COLORS.D] },
      { label: 'I', value: 25, color: [...COLORS.I] },
      { label: 'S', value: 40, color: [...COLORS.S] },
      { label: 'C', value: 90, color: [...COLORS.C] },
    ],
  };

  return (
    chartMap[topTrait] || [
      { label: 'D', value: data.score_D, color: [...COLORS.D] },
      { label: 'I', value: data.score_I, color: [...COLORS.I] },
      { label: 'S', value: data.score_S, color: [...COLORS.S] },
      { label: 'C', value: data.score_C, color: [...COLORS.C] },
    ]
  );
}

// ─── Helper: Build Word Sketch Data ──────────────────────────────────────────

function buildWordSketch(data: CxoData) {
  const dLevel = getWordSketchLevel(data.score_D);
  const iLevel = getWordSketchLevel(data.score_I);
  const sLevel = getWordSketchLevel(data.score_S);
  const cLevel = getWordSketchLevel(data.score_C);

  const sketchData = [
    {
      level: 6,
      d: 'argumentative daring demanding decisive domineering egocentric',
      i: 'emotional enthusiastic gregarious impulsive optimistic persuasive',
      s: 'calming loyal patient peaceful serene team person',
      c: 'accurate conservative exacting fact-finder precise systematic',
    },
    {
      level: 5,
      d: 'adventurous risk-taker direct forceful',
      i: 'charming influential sociable trusting',
      s: 'consistent cooperative possessive relaxed',
      c: 'conscientious courteous focused high standards',
    },
    {
      level: 4,
      d: 'assertive competitive determined self-reliant',
      i: 'confident friendly generous poised',
      s: 'composed deliberate stable steady',
      c: 'analytical neat sensitive tactful',
    },
    {
      level: 3,
      d: 'calculated risks moderate questioning unassuming',
      i: 'controlled discriminating rational reflective',
      s: 'alert eager flexible mobile',
      c: 'own person self assured opinionated persistent',
    },
    {
      level: 2,
      d: 'mild seeks consensus unobtrusive weighs pro/con',
      i: 'contemplative factual logical retiring',
      s: 'discontented energetic fidgety impetuous',
      c: 'autonomous independent firm stubborn',
    },
    {
      level: 1,
      d: 'agreeing cautious conservative contemplative modest restrained',
      i: 'introspective pessimistic quiet pensive reticent suspicious',
      s: 'active change-oriented fault-finding impatient restless spontaneous',
      c: 'arbitrary defiant fearless obstinate rebellious sarcastic',
    },
  ];

  const staticRows = [
    {
      label: 'Needs',
      vals: [
        'Challenges to solve, Authority',
        'Social relationship, Friendly environment',
        'Rules of follow, Data to Analyze',
        'System, Teams, Stable environment',
      ],
    },
    {
      label: 'Emotions',
      vals: [
        'Decisive, risk-taker',
        'Optimistic, trust others',
        'Caution, careful decision',
        'Patience, stabilizer',
      ],
    },
    {
      label: 'Fears',
      vals: [
        '..being taken advantage of/lack of control',
        '..being left out, loss of social approval',
        '..being criticized, loss of accuracy and quality',
        '..sudden changes/loss of stability',
      ],
    },
  ];

  return {
    levels: { D: dLevel, I: iLevel, S: sLevel, C: cLevel },
    sketchData: sketchData.map((row) => ({
      level: row.level,
      d: row.d,
      i: row.i,
      s: row.s,
      c: row.c,
      highlighted: {
        D: dLevel === row.level,
        I: iLevel === row.level,
        S: sLevel === row.level,
        C: cLevel === row.level,
      },
    })),
    staticRows,
    introText: {
      paragraph1: CXO_CONTENT.natural_style_work_sketch_desc,
      paragraph2: CXO_CONTENT.natural_style_work_sketch_desc_1,
    },
  };
}

// ─── Helper: Build ACI Section ───────────────────────────────────────────────

function buildACI(data: CxoData) {
  const traitCode = getTopTwoTraits(
    data.most_answered_answer_type,
    data,
  ).join('');

  const contentBlock = ACI[traitCode];
  if (!contentBlock) return null;

  const agile = data.agile_scores?.[0];
  const agileSum =
    (agile?.commitment ?? 0) +
    (agile?.focus ?? 0) +
    (agile?.openness ?? 0) +
    (agile?.respect ?? 0) +
    (agile?.courage ?? 0);

  let agileRef = ACI_SCORE['0'];
  if (agileSum >= 100) {
    agileRef = ACI_SCORE['100'];
  } else if (agileSum >= 75) {
    agileRef = ACI_SCORE['75'];
  } else if (agileSum >= 50) {
    agileRef = ACI_SCORE['50'];
  }

  return {
    traitTitle: contentBlock.trait_title,
    aciDescription: DISCLAIMER.aci_description,
    agileDescription: contentBlock.agile_desc_1,
    personalizedInsight: contentBlock.personalized_insight,

    agileWiseBreakdown: {
      commitment: {
        score: agile?.commitment ?? 0,
        behaviouralNote:
          contentBlock.agile_wise_breakdown.commitment.behavioural_note,
        behaviouralDescription:
          contentBlock.agile_wise_breakdown.commitment.behavioural_description,
        suggestedMicroHabit:
          contentBlock.agile_wise_breakdown.commitment.suggested_micro_habit,
      },
      focus: {
        score: agile?.focus ?? 0,
        behaviouralNote:
          contentBlock.agile_wise_breakdown.focus.behavioural_note,
        behaviouralDescription:
          contentBlock.agile_wise_breakdown.focus.behavioural_description,
        suggestedMicroHabit:
          contentBlock.agile_wise_breakdown.focus.suggested_micro_habit,
      },
      openness: {
        score: agile?.openness ?? 0,
        behaviouralNote:
          contentBlock.agile_wise_breakdown.openness.behavioural_note,
        behaviouralDescription:
          contentBlock.agile_wise_breakdown.openness.behavioural_description,
        suggestedMicroHabit:
          contentBlock.agile_wise_breakdown.openness.suggested_micro_habit,
      },
      respect: {
        score: agile?.respect ?? 0,
        behaviouralNote:
          contentBlock.agile_wise_breakdown.respect.behavioural_note,
        behaviouralDescription:
          contentBlock.agile_wise_breakdown.respect.behavioural_description,
        suggestedMicroHabit:
          contentBlock.agile_wise_breakdown.respect.suggested_micro_habit,
      },
      courage: {
        score: agile?.courage ?? 0,
        behaviouralNote:
          contentBlock.agile_wise_breakdown.courage.behavioural_note,
        behaviouralDescription:
          contentBlock.agile_wise_breakdown.courage.behavioural_description,
        suggestedMicroHabit:
          contentBlock.agile_wise_breakdown.courage.suggested_micro_habit,
      },
    },

    scoreOverview: {
      totalScore: agileSum,
      maxScore: 125,
      level: agileRef.title,
      compatibilityTag: agileRef.compatibility_tag,
      interpretation: agileRef.interpretation,
    },

    reflectionSummary: contentBlock.reflection_summary,
  };
}

// ─── Helper: Build Respond Parameter Table ───────────────────────────────────

function buildRespondParameterTable(dominantType: string) {
  const contentBlock = CXO_DYNAMIC_CONTENT[dominantType];
  if (!contentBlock) return null;

  const traitNames: Record<string, string> = {
    D: 'Dominance',
    I: 'Influence',
    S: 'Steadiness',
    C: 'Conscientiousness',
  };

  return {
    trait: traitNames[dominantType],
    headers: [
      'Trait',
      'Conflict Management',
      'Change Management',
      'Team Dynamics',
      'Communication',
      'Sustainability',
      'Social Responsibility',
    ],
    row: [traitNames[dominantType], ...contentBlock.respond_parameter_row],
  };
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export async function buildCxoReportJSON(data: CxoData): Promise<any> {
  logger.info('[CxoReportJSON] Building JSON report...');

  // ── 1. DISC Computation ──
  const [primaryType, secondaryType] = getTopTwoTraits(
    data.most_answered_answer_type,
    data,
  );
  const dominantType = primaryType as 'D' | 'I' | 'S' | 'C';
  const dominantTrait = primaryType + secondaryType;
  const contentBlock = CXO_DYNAMIC_CONTENT[dominantType];

  // ── 2. Agile Scores ──
  const agile = data.agile_scores?.[0];

  // ── 3. Blended Style ──
  const blendedContent = BLENDED_STYLE_MAPPING[dominantTrait];

  // ── Build the JSON response ──
  const response = {
    meta: {
      generatedAt: new Date().toISOString(),
      reportType: 'cxo',
      tableOfContents: CXO_TOC_CONTENT.map((item) =>
        item.replace('$full_name', data.full_name),
      ),
    },

    executive: {
      fullName: data.full_name,
      email: data.email_id,
      examRefNo: data.exam_ref_no,
      reportTitle: data.report_title,
      examStart: data.exam_start,
      examEnd: data.exam_end,
      groupName: data.group_name ?? null,
    },

    discProfile: {
      scores: {
        D: data.score_D,
        I: data.score_I,
        S: data.score_S,
        C: data.score_C,
      },
      primaryType,
      secondaryType,
      dominantTrait,
    },

    agileProfile: {
      raw: agile
        ? {
            focus: agile.focus,
            courage: agile.courage,
            respect: agile.respect,
            openness: agile.openness,
            commitment: agile.commitment,
          }
        : null,
    },

    sections: {
      // ── About the Report ──
      aboutReport: {
        title: CXO_TOC_CONTENT[0],
        content: CXO_CONTENT.about_report,
        purpose: CXO_CONTENT.purpose_items,
        whyMatters: {
          intro: CXO_CONTENT.why_matters,
          items: CXO_CONTENT.why_matters_items,
        },
        whatYouGain: CXO_CONTENT.what_you_gain,
        aboutSelfDiscovery: CXO_CONTENT.about_obi_self_discovery_report,
      },

      // ── Strategic Business Enhancement Paths ──
      strategicPaths: {
        title: CXO_TOC_CONTENT[1],
        benefitsIntro:
          CXO_CONTENT.benefits_identifying_strategic_business_paths,
        benefitsPara2:
          CXO_CONTENT.benefits_identifying_strategic_business_paths_para_2,
        whyRightStrategicPath:
          CXO_CONTENT.why_identifying_right_strategic_path,
        whyRightStrategicPathPara2:
          CXO_CONTENT.why_identifying_right_strategic_path_para_2,
        howThisReportHelps: CXO_CONTENT.how_this_report_helps_you,
        howThisReportHelpsList: CXO_CONTENT.how_this_report_helps_list,
        howThisReportHelpsPara2: CXO_CONTENT.how_this_report_helps_you_para_2,
        importantNote: CXO_CONTENT.important_note,
      },

      // ── Personalized Leadership Insights ──
      personalizedInsights: contentBlock
        ? {
            title: `Personalized Leadership Insights for ${data.full_name}`,
            generalCharacteristics1: contentBlock.general_characteristics_1,
            generalCharacteristics2: contentBlock.general_characteristics_2,
            understandingYourself: {
              content1: contentBlock.understanding_yourself_who_i_am_1,
              content2: contentBlock.understanding_yourself_who_i_am_2,
            },
          }
        : null,

      // ── Key Strengths ──
      keyStrengths: contentBlock
        ? {
            title: 'Your Key Strengths – How You Drive Impact',
            intro: contentBlock.key_strengths_1,
            list: contentBlock.key_strengths_2,
            natureStyleChartData: buildNatureStyleChartData(
              dominantType,
              data,
            ),
          }
        : null,

      // ── Motivations and Needs ──
      motivationsAndNeeds: contentBlock
        ? {
            title:
              'What Drives You – Motivations and Needs for Strategic Growth',
            intro: contentBlock.motivations_1.replace(
              '$full_name',
              data.full_name,
            ),
            whatDrives: {
              title: contentBlock.what_drives.replace(
                '$full_name',
                data.full_name,
              ),
              description: contentBlock.motivations_desc_1,
            },
            uniqueNeeds: contentBlock.unique_needs_desc_2,
            communicationTips: {
              title: `Communication Tips for Connecting with ${data.full_name}`,
              howOthersCommunicate: `How Others Can Best Communicate With ${data.full_name}`,
              description: contentBlock.communication_desc_3,
              dosTitle: `When communicating with ${data.full_name}, DO's`,
              dos: contentBlock.communication_dos,
              whatOthersShouldAvoid: 'What Others Should Avoid',
              avoidDescription: contentBlock.motivations_insights_2,
              dontsTitle: `When communicating with ${data.full_name}, DON'T`,
              donts: contentBlock.communication_donts,
            },
            growthAreas: contentBlock.growth_areas,
          }
        : null,

      // ── ACI (Agile Compatibility Index) ──
      aci: buildACI(data),

      // ── Executive Behavioral Snapshot ──
      behavioralSnapshot: contentBlock
        ? {
            title: 'Your Executive Behavioral Snapshot',
            intro: contentBlock.your_personalized_behavioral_charts_1,
            understandingGraphs:
              contentBlock.your_personalized_behavioral_understanding_the_graphs,
            understandingGraphsList:
              contentBlock.your_personalized_behavioral_understanding_the_graphs_list,
            keyInsights:
              contentBlock.your_personalized_behavioral_key_insights,
            keyInsightsList:
              contentBlock.your_personalized_behavioral_key_insights_list,
            adaptedStyleData: [
              { label: 'D', value: data.score_D },
              { label: 'I', value: data.score_I },
              { label: 'S', value: data.score_S },
              { label: 'C', value: data.score_C },
            ],
            natureStyleData: buildNatureStyleChartData(dominantType, data),
          }
        : null,

      // ── Leadership Strengths & Business Vision ──
      businessVision: blendedContent
        ? {
            title:
              'Aligning Your Leadership Strengths with Future Business Vision',
            styleName: blendedContent.style_name,
            styleDescription: blendedContent.style_desc,
            natureSuggestions: blendedContent.nature_suggestions,
            keyBehaviours: blendedContent.key_behaviours,
            typicalScenarios: blendedContent.typical_scenarios,
            traitMapping: {
              headers: [
                'Trait Combination',
                'Role Suggestions',
                'Recommended Focus Areas',
                'Stress Areas',
                'Recommendations for Outsourcing',
              ],
              rows: blendedContent.trait_combinations,
            },
          }
        : null,

      // ── Respond Parameter Table ──
      respondParameterTable: buildRespondParameterTable(dominantType),

      // ── Word Sketch ──
      wordSketch: buildWordSketch(data),

      // ── Disclaimer ──
      disclaimer: {
        title: DISCLAIMER_CONTENT.title,
        intro: DISCLAIMER_CONTENT.intro,
        limitations: {
          title: DISCLAIMER_CONTENT.limitations_title,
          bullets: DISCLAIMER_CONTENT.limitations_bullets,
        },
        noWarranties: {
          title: DISCLAIMER_CONTENT.no_warranties_title,
          intro: DISCLAIMER_CONTENT.no_warranties_intro,
          disclaimer: DISCLAIMER_CONTENT.no_warranties_disclaimer,
          bullets: DISCLAIMER_CONTENT.no_warranties_bullets,
        },
        indemnity: {
          title: DISCLAIMER_CONTENT.indemnity_title,
          intro: DISCLAIMER_CONTENT.indemnity_intro,
          bullets: DISCLAIMER_CONTENT.indemnity_bullets,
          outro: DISCLAIMER_CONTENT.indemnity_outro,
        },
        noLiability: {
          title: DISCLAIMER_CONTENT.no_liability_title,
          description: DISCLAIMER_CONTENT.no_liability_desc,
        },
        closingNote: DISCLAIMER_CONTENT.closing_note,
      },
    },
  };

  logger.info('[CxoReportJSON] JSON report built successfully.');
  return response;
}
