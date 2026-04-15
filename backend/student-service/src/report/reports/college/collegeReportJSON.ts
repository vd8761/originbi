/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * collegeReportJSON.ts
 * --------------------
 * Standalone JSON builder that mirrors the computation logic of CollegeReport
 * but returns structured JSON instead of generating a PDF.
 *
 * Usage:
 *   const json = await buildCollegeReportJSON(collegeData);
 *   res.json(json);
 */

import { CollegeData } from '../../types/types';
import { logger } from '../../helpers/logger';
import {
  COLLEGE_TOC_CONTENT,
  CONTENT,
  MAPPING,
  blendedTraits,
} from './collegeConstants';
import {
  getCareerGuidanceByTrait,
  CareerRoleData,
} from '../../helpers/sqlHelper';
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

// ─── Helper: Build Word Sketch Data ──────────────────────────────────────────

function buildWordSketch(data: CollegeData) {
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
      paragraph1: CONTENT.word_sketch_1,
      paragraph2: CONTENT.word_sketch_2,
      paragraph3: CONTENT.word_sketch_3,
    },
  };
}

// ─── Helper: Build ACI Section ───────────────────────────────────────────────

function buildACI(data: CollegeData) {
  const traitCode = getTopTwoTraits(data.most_answered_answer_type, data).join(
    '',
  );

  const contentBlock = ACI[traitCode];
  if (!contentBlock) return null;

  const agile = data.agile_scores?.[0];
  const agileSum =
    (agile?.commitment ?? 0) +
    (agile?.focus ?? 0) +
    (agile?.openness ?? 0) +
    (agile?.respect ?? 0) +
    (agile?.courage ?? 0);

  // Determine ACI score level
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

// ─── Helper: Build Nature Style Chart Data ───────────────────────────────────

function buildNatureStyleChartData(dominantType: string) {
  const contentBlock = CONTENT[dominantType as 'D' | 'I' | 'S' | 'C'];
  if (!contentBlock?.natural_bar_chart_data) return null;

  return contentBlock.natural_bar_chart_data.map(
    (item: [string, number, number[]]) => ({
      label: item[0],
      value: item[1],
      color: item[2],
    }),
  );
}

// ─── Helper: Build Respond Parameter Table ───────────────────────────────────

function buildRespondParameterTable(dominantType: string) {
  const contentBlock = CONTENT[dominantType as 'D' | 'I' | 'S' | 'C'];
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

// ─── Helper: Build Future Tech Areas ─────────────────────────────────────────

function buildFutureTechAreas(dominantTrait: string) {
  const skills = MAPPING[dominantTrait];
  if (!skills) return null;

  return skills.map((skill) => ({
    label: skill.label,
    startYear: 2000 + skill.start,
    endYear: 2000 + skill.end,
  }));
}

// ─── Helper: Build Career Guidance ───────────────────────────────────────────

function buildCareerGuidance(
  careerDataList: CareerRoleData[],
  dominantTraits: [string, string],
) {
  if (!careerDataList || careerDataList.length === 0) return null;

  const DISC_COLORS: Record<string, string> = {
    D: '#D82A29',
    I: '#FEDD10',
    C: '#01AADB',
    S: '#4FB965',
  };
  const DISC_TEXT_COLORS: Record<string, string> = {
    D: '#FFFFFF',
    I: '#000000',
    C: '#FFFFFF',
    S: '#FFFFFF',
  };

  return careerDataList.slice(0, 3).map((role, index) => {
    const traitKey = dominantTraits[index % 2];
    const bgColor = DISC_COLORS[traitKey] || '#150089';
    const txtColor = DISC_TEXT_COLORS[traitKey] || '#FFFFFF';

    return {
      suggestion: index + 1,
      roleName: role.roleName,
      shortDescription: role.shortDescription,
      traitKey,
      bgColor,
      textColor: txtColor,
      tools: role.tools,
      guidanceSections: role.guidanceSections,
    };
  });
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export async function buildCollegeReportJSON(
  data: CollegeData,
): Promise<Record<string, unknown>> {
  logger.info('[CollegeReportJSON] Building JSON report...');

  // ── 1. DISC Computation ──
  const [primaryType, secondaryType] = getTopTwoTraits(
    data.most_answered_answer_type,
    data,
  );
  const dominantType = primaryType as 'D' | 'I' | 'S' | 'C';
  const dominantTrait = primaryType + secondaryType;
  const contentBlock = CONTENT[dominantType];

  // ── 2. Fetch Career Guidance Data ──
  let careerDataList: CareerRoleData[] = [];
  try {
    const deptId = data.department_deg_id;
    logger.info(
      `[CollegeReportJSON] Fetching career guidance for trait: ${dominantTrait} & Dept ID: ${deptId}`,
    );
    careerDataList = await getCareerGuidanceByTrait(dominantTrait, deptId);
    logger.info(
      `[CollegeReportJSON] Received ${careerDataList.length} career roles from DB.`,
    );
  } catch (error) {
    logger.error(
      '[CollegeReportJSON] Failed to fetch career guidance data:',
      error,
    );
  }

  // ── 3. Agile Scores ──
  const agile = data.agile_scores?.[0];

  // ── 4. Blended Traits ──
  const blendedContent = blendedTraits[dominantTrait];

  // ── Build the JSON response ──
  const response = {
    meta: {
      generatedAt: new Date().toISOString(),
      reportType: 'college',
      tableOfContents: COLLEGE_TOC_CONTENT.map((item) =>
        item.replace('$full_name', data.full_name),
      ),
    },

    student: {
      fullName: data.full_name,
      email: data.email_id,
      examRefNo: data.exam_ref_no,
      reportTitle: data.report_title,
      examStart: data.exam_start,
      examEnd: data.exam_end,
      departmentDegId: data.department_deg_id ?? null,
      deptCode: data.dept_code ?? null,
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
        title: COLLEGE_TOC_CONTENT[0],
        content: CONTENT.about_report,
        purpose: CONTENT.purpose_items,
        whyMatters: {
          intro: CONTENT.why_matters,
          items: CONTENT.why_matters_items,
        },
        whatYouGain: CONTENT.what_you_gain,
        aboutSelfDiscovery: CONTENT.about_obi_self_discovery_report,
      },

      // ── Career Path Identification ──
      careerPathIdentification: {
        title: COLLEGE_TOC_CONTENT[1],
        benefitsIntro: CONTENT.benefits_identifying_suitable_career_paths,
        benefitsPara2:
          CONTENT.benefits_identifying_suitable_career_paths_para_2,
        whyRightCareer: CONTENT.why_identifying_right_career,
        whyRightCareerPara2: CONTENT.why_identifying_right_career_para_2,
        howThisReportHelps: CONTENT.how_this_report_helps_you,
        howThisReportHelpsList: CONTENT.how_this_report_helps_list,
        howThisReportHelpsPara2: CONTENT.how_this_report_helps_you_para_2,
        importantNote: CONTENT.important_note,
      },

      // ── Personalized Insights ──
      personalizedInsights: contentBlock
        ? {
            title: `Personalised Insights for ${data.full_name}`,
            generalCharacteristics1:
              contentBlock.general_characteristics_for_student_1,
            generalCharacteristics2:
              contentBlock.general_characteristics_for_student_2,
            understandingYourself: {
              content1: contentBlock.understanding_yourself_who_i_am_1,
              content2: contentBlock.understanding_yourself_who_i_am_2,
            },
          }
        : null,

      // ── Key Strengths ──
      keyStrengths: contentBlock
        ? {
            intro:
              contentBlock.your_strength_what_you_bring_to_the_organization_1,
            list: contentBlock.your_strength_what_you_bring_to_the_organization_2,
            natureStyleChartData: buildNatureStyleChartData(dominantType),
          }
        : null,

      // ── Motivations and Needs ──
      motivationsAndNeeds: contentBlock
        ? {
            intro:
              contentBlock.motivations_and_need_your_personalized_insights_1.replace(
                '$full_name',
                data.full_name,
              ),
            whatDrives: {
              title:
                contentBlock.motivations_and_need_your_personalized_insights_what_drives.replace(
                  '$full_name',
                  data.full_name,
                ),
              description:
                contentBlock.motivations_and_need_your_personalized_insights_desc_1,
            },
            uniqueNeeds:
              contentBlock.motivations_and_need_your_personalized_insights_desc_2,
            communicationTips: {
              title:
                contentBlock.motivations_and_need_your_personalized_insights_communication_tips.replace(
                  '$full_name',
                  data.full_name,
                ),
              howOthersCommunicate:
                contentBlock.motivations_and_need_your_personalized_insights_communication_with_others.replace(
                  '$full_name',
                  data.full_name,
                ),
              description:
                contentBlock.motivations_and_need_your_personalized_insights_desc_3,
              dosTitle:
                contentBlock.when_communicating_with_student_dos_title.replace(
                  '$full_name',
                  data.full_name,
                ),
              dos: contentBlock.when_communicating_with_student_dos,
              whatOthersShouldAvoid:
                contentBlock.motivations_and_need_your_personalized_what_others_should_avoid,
              avoidDescription:
                contentBlock.motivations_and_need_your_personalized_insights_2,
              dontsTitle:
                contentBlock.motivations_and_need_your_personalized_insights_3.replace(
                  '$full_name',
                  data.full_name,
                ),
              donts: contentBlock.when_communicating_with_student_dont,
            },
            growthAreas:
              contentBlock.motivations_and_need_your_personalized_insights_4,
          }
        : null,

      // ── ACI (Agile Compatibility Index) ──
      aci: buildACI(data),

      // ── Behavioral Snapshot ──
      behavioralSnapshot: contentBlock
        ? {
            intro: contentBlock.your_personalized_behavioral_charts_1,
            understandingGraphs:
              contentBlock.your_personalized_behavioral_understanding_the_graphs,
            understandingGraphsList:
              contentBlock.your_personalized_behavioral_understanding_the_graphs_list,
            keyInsights: contentBlock.your_personalized_behavioral_key_insights,
            keyInsightsList:
              contentBlock.your_personalized_behavioral_key_insights_list,
            adaptedStyleData: [
              { label: 'D', value: data.score_D },
              { label: 'I', value: data.score_I },
              { label: 'S', value: data.score_S },
              { label: 'C', value: data.score_C },
            ],
          }
        : null,

      // ── Future Tech Areas ──
      futureTechAreas: buildFutureTechAreas(dominantTrait),

      // ── Future Outlook ──
      futureOutlook: {
        title: 'Future Outlook',
        centerLabel: 'Interdisciplinary, tech-driven expertise',
        leftValue: '39%',
        leftLabel: 'current job skills',
        rightValue: '2030',
        rightLabel: 'obsolete',
        sourceText:
          'Source : World Economic Forum (WEF) Future of Jobs Report 2025.',
      },

      // ── Blended Style / Academic Career Goals ──
      academicCareerChoices: blendedContent
        ? {
            title:
              'Applying Self-Discovery to Your Academic and Career Choices',
            styleName: blendedContent.name,
            styleDescription: blendedContent.description,
            suggestions: blendedContent.suggestions,
            keyBehaviours: blendedContent.key_behaviours,
            typicalScenarios: blendedContent.typical_scenarios,
            traitMapping: blendedContent.trait_mapping1,
          }
        : null,

      // ── Respond Parameter Table ──
      respondParameterTable: buildRespondParameterTable(dominantType),

      // ── Career Guidance & Roadmap ──
      careerGuidance: buildCareerGuidance(careerDataList, [
        primaryType,
        secondaryType,
      ]),

      // ── Word Sketch ──
      wordSketch: buildWordSketch(data),

      // ── Disclaimer ──
      disclaimer: {
        content: CONTENT.disclaimer,
        limitations: CONTENT.limitations,
        warranties: {
          statement1: CONTENT.warranties_1,
          statement2: CONTENT.warranties_2,
          list: CONTENT.warranty_list,
        },
        indemnity: {
          description1: CONTENT.indemnity_desc_1,
          description2: CONTENT.indemnity_desc_2,
          list: CONTENT.indemnity_list,
        },
        damages: {
          description1: CONTENT.damages_desc_1,
          description2: CONTENT.damages_desc_2,
        },
      },
    },
  };

  logger.info('[CollegeReportJSON] JSON report built successfully.');
  return response;
}
