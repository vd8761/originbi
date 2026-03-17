/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * schoolReportJSON.ts
 * -------------------
 * Standalone JSON builder that mirrors the computation logic of SchoolReport
 * but returns structured JSON instead of generating a PDF.
 *
 * Usage:
 *   const json = await buildSchoolReportJSON(schoolData);
 *   res.json(json);
 */

import { SchoolData } from '../../types/types';
import { logger } from '../../helpers/logger';
import {
  SCHOOL_DYNAMIC_CONTENT,
  SCHOOL_BLENDED_STYLE_MAPPING,
  STREAM_NAMES,
  STREAM_SELECTION_CONTENT,
  IDENTITY_MAP,
  STRENGTH_MAP,
  DEVELOPMENT_MAP,
  CAREER_DOMAIN_MAP,
  ARCHETYPE_DATA,
  DUAL_ARCHETYPE,
  TEXT_VARIATIONS,
  TRAIT_REASONS,
  STREAM_AGILE_COMPATIBILITY,
  STREAM_FUTURE_DIRECTIONS,
  ProfilePatterns,
} from './schoolConstants';
import {
  getCompatibilityMatrixDetails,
  CourseCompatibility,
} from '../../helpers/sqlHelper';

// ─── Helper: Top-Two DISC Traits ─────────────────────────────────────────────

function getTopTwoTraits(
  mostAnswered: { ANSWER_TYPE: string; COUNT: number }[],
  scores: { score_D: number; score_I: number; score_S: number; score_C: number },
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

// ─── Helper: Compute Sorted Traits ───────────────────────────────────────────

function computeSortedTraits(data: SchoolData) {
  const D = data.score_D;
  const I = data.score_I;
  const S = data.score_S;
  const C = data.score_C;

  const scores = [
    { type: 'D', val: D },
    { type: 'I', val: I },
    { type: 'S', val: S },
    { type: 'C', val: C },
  ];

  const PRIORITY = ['C', 'D', 'I', 'S'];
  scores.sort((a, b) => {
    const diff = b.val - a.val;
    if (diff !== 0) return diff;
    return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type);
  });

  const topTwo = scores[0].type + scores[1].type;
  const careerAlignmentIntensity = Math.min(
    15,
    Math.round((scores[0].val + scores[1].val) / 10),
  );

  return { sortedTraits: scores, topTwo, careerAlignmentIntensity };
}

// ─── Helper: Detect Patterns ─────────────────────────────────────────────────

function detectPatterns(
  data: SchoolData,
  sortedTraits: { type: string; val: number }[],
): ProfilePatterns {
  const D = data.score_D;
  const I = data.score_I;
  const S = data.score_S;
  const C = data.score_C;

  const agile = data.agile_scores?.[0];
  const commitment = agile?.commitment ?? 0;
  const courage = agile?.courage ?? 0;
  const focus = agile?.focus ?? 0;
  const openness = agile?.openness ?? 0;
  const respect = agile?.respect ?? 0;

  const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
  const nCommitment = norm(commitment);
  const nCourage = norm(courage);
  const nFocus = norm(focus);
  const nOpenness = norm(openness);
  const nRespect = norm(respect);

  const top = sortedTraits[0];
  const second = sortedTraits[1];
  const gap = top.val - second.val;
  const vals = [D, I, S, C];
  const mean = vals.reduce((a, b) => a + b, 0) / 4;
  const stddev = Math.sqrt(
    vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 4,
  );

  let discType: 'dominant' | 'dual' | 'balanced';
  if (top.val > 75 && gap > 10) discType = 'dominant';
  else if (gap < 5 && top.val > 65 && second.val > 65) discType = 'dual';
  else if (stddev < 8) discType = 'balanced';
  else if (gap >= 5) discType = 'dominant';
  else discType = 'balanced';

  let agilePattern: string;
  if (nCourage > nRespect + 20) agilePattern = 'assertive-risk';
  else if (nRespect > nCourage + 20) agilePattern = 'cautious-respect';
  else if (nFocus > 70 && nCommitment > 70) agilePattern = 'execution-engine';
  else if (nOpenness > nCommitment + 20) agilePattern = 'creative-instability';
  else if (nCommitment > nOpenness + 20) agilePattern = 'steady-execution';
  else agilePattern = 'balanced';

  const leadership = Math.round((D + nCourage) / 2);
  const collaboration = Math.round((S + nRespect) / 2);
  const innovation = Math.round((I + nOpenness) / 2);
  const analytical = Math.round((C + nFocus) / 2);
  const resilience = Math.round((D + nCommitment) / 2);
  const adaptability = Math.round((I + nOpenness) / 2);

  let stressType: string;
  if (D > 70 && S < 50) stressType = 'assertive';
  else if (C > 70) stressType = 'overthink';
  else if (S > 70 && D < 40) stressType = 'withdrawal';
  else stressType = 'balanced';

  let academicStyle: string;
  if (C > 65 && nFocus > 65) academicStyle = 'structured';
  else if (I > 65 && nOpenness > 65) academicStyle = 'collaborative';
  else if (S > 65 && nCommitment > 65) academicStyle = 'self-paced';
  else if (D > 65 && nCourage > 65) academicStyle = 'competitive';
  else academicStyle = 'structured';

  const textVariant = (D + I + S + C) % 3;

  return {
    discType,
    dominantTrait: discType === 'dominant' ? top.type : undefined,
    dualTraits: discType === 'dual' ? [top.type, second.type] : undefined,
    agilePattern,
    leadership,
    collaboration,
    innovation,
    analytical,
    resilience,
    adaptability,
    stressType,
    academicStyle,
    textVariant,
  };
}

// ─── Helper: Text variation lookup ───────────────────────────────────────────

function tv(key: string, textVariant: number): string {
  const variants = TEXT_VARIATIONS[key];
  if (!variants) return '';
  return variants[textVariant % variants.length];
}

// ─── Helper: Where You Fit Best computation ──────────────────────────────────

function computeWhereYouFitBest(data: SchoolData) {
  const agile = data.agile_scores?.[0];
  if (!agile) return null;

  // Determine top-two traits for reason lookup
  const topTwoTraits = getTopTwoTraits(data.most_answered_answer_type, data);
  const traitCode = topTwoTraits[0] + topTwoTraits[1]; // e.g. "SD"
  const reasons: string[] = TRAIT_REASONS[traitCode] || ['Personality aligned'];

  // Find student's top agile dimension
  const agileScores: Record<string, number> = {
    Focus: agile.focus ?? 0,
    Courage: agile.courage ?? 0,
    Respect: agile.respect ?? 0,
    Openness: agile.openness ?? 0,
    Commitment: agile.commitment ?? 0,
  };
  const topAgile = Object.entries(agileScores).sort((a, b) => b[1] - a[1])[0][0];

  // Rank ALL streams by compatibility (top agile vs each stream's matrix)
  const rankedStreams = Object.keys(STREAM_AGILE_COMPATIBILITY)
    .map((s) => {
      const mat = STREAM_AGILE_COMPATIBILITY[s] || {};
      return { name: s, compat: mat[topAgile] ?? 65 };
    })
    .sort((a, b) => b.compat - a.compat);

  const recommended = rankedStreams[0];
  const altStreams = rankedStreams.slice(1, 4); // top 3 alternatives

  // Get stream content for full names
  const streamContent = STREAM_SELECTION_CONTENT[recommended.name];
  const streamFullTitle = streamContent?.title || '';

  return {
    recommendedStream: {
      shortName: recommended.name,
      fullName: streamFullTitle,
      compatibility: recommended.compat,
    },
    reasons,
    alternativeStreams: altStreams.map((alt) => {
      const altContent = STREAM_SELECTION_CONTENT[alt.name];
      return {
        shortName: alt.name,
        fullName: altContent?.title || '',
        compatibility: alt.compat,
        futureDirections: STREAM_FUTURE_DIRECTIONS[alt.name] || '',
      };
    }),
  };
}

// ─── Helper: Core Personality ────────────────────────────────────────────────

function buildCorePersonality(patterns: ProfilePatterns, textVariant: number) {
  const p = patterns;

  if (p.discType === 'dominant' && p.dominantTrait) {
    const archetype = ARCHETYPE_DATA[p.dominantTrait]?.dominant;
    return {
      type: 'dominant',
      archetype: archetype
        ? {
            title: archetype.title,
            superpower: archetype.superpower,
            risk: archetype.risk,
            environment: archetype.environment,
          }
        : null,
      description: tv('disc-dominant', textVariant),
    };
  } else if (p.discType === 'dual' && p.dualTraits) {
    const key = p.dualTraits[0] + p.dualTraits[1];
    const dual = DUAL_ARCHETYPE[key] || DUAL_ARCHETYPE['DC'];
    const arch1 = ARCHETYPE_DATA[p.dualTraits[0]]?.secondary;
    const arch2 = ARCHETYPE_DATA[p.dualTraits[1]]?.secondary;
    return {
      type: 'dual',
      title: dual.title,
      description: dual.description,
      archetypes: [arch1, arch2].filter(Boolean).map((a) => ({
        title: a!.title,
        superpower: a!.superpower,
        risk: a!.risk,
        environment: a!.environment,
      })),
      additionalDescription: tv('disc-dual', textVariant),
    };
  } else {
    return {
      type: 'balanced',
      title: 'Versatile Adaptive Profile',
      description: tv('disc-balanced', textVariant),
    };
  }
}

// ─── Helper: Career Fit ──────────────────────────────────────────────────────

function buildCareerFit(data: SchoolData) {
  const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
  const agile = data.agile_scores?.[0];
  const nFocus = norm(agile?.focus ?? 0);
  const nCourage = norm(agile?.courage ?? 0);
  const nOpenness = norm(agile?.openness ?? 0);
  const nRespect = norm(agile?.respect ?? 0);

  const D = data.score_D;
  const I = data.score_I;
  const S = data.score_S;
  const C = data.score_C;

  const fits = [
    { label: 'Engineering & Technology', score: Math.round((C + nFocus) / 2), strongFit: C > 65 && nFocus > 65 },
    { label: 'Management & Leadership', score: Math.round((D + nCourage) / 2), strongFit: D > 65 && nCourage > 65 },
    { label: 'Creative & Design', score: Math.round((I + nOpenness) / 2), strongFit: I > 65 && nOpenness > 65 },
    { label: 'People & HR', score: Math.round((S + nRespect) / 2), strongFit: S > 65 && nRespect > 65 },
  ];

  fits.sort((a, b) => b.score - a.score);

  return fits;
}

// ─── Helper: Career Domain Table ─────────────────────────────────────────────

function buildCareerDomainTable(topTwo: string) {
  const careerData = CAREER_DOMAIN_MAP[topTwo] || CAREER_DOMAIN_MAP['DC'];

  const domains = careerData.domains.map((d) => {
    const filledDots = Math.round(d.score / 20);
    const outlook =
      d.score >= 85
        ? 'Strong Fit'
        : d.score >= 75
          ? 'Good Fit'
          : 'Developing';
    return {
      name: d.name,
      score: d.score,
      dotsVisual: '●'.repeat(filledDots) + '○'.repeat(5 - filledDots),
      outlook,
    };
  });

  return {
    domains,
    automationRisk: careerData.automationRisk,
  };
}

// ─── Helper: Academic Strategy ───────────────────────────────────────────────

function buildAcademicStrategy(patterns: ProfilePatterns) {
  const styleTitles: Record<string, { title: string; techniques: string[] }> = {
    structured: {
      title: 'Structured Learning Approach',
      techniques: [
        'Detailed revision timetables with milestone tracking',
        'Systematic note-taking and concept mapping',
        'Regular self-assessment against defined benchmarks',
      ],
    },
    collaborative: {
      title: 'Collaborative Learning Approach',
      techniques: [
        'Group discussions and peer-teaching sessions',
        'Presentation-based learning and debate',
        'Interactive workshops and case study analysis',
      ],
    },
    'self-paced': {
      title: 'Self-Paced Learning Approach',
      techniques: [
        'Consistent daily study routines with fixed duration',
        'Repetitive practice with familiar question formats',
        'Incremental complexity progression over time',
      ],
    },
    competitive: {
      title: 'Competitive Learning Approach',
      techniques: [
        'Mock tests and timed exam simulations',
        'Leaderboard-based study challenges',
        'Goal-setting with visible progress metrics',
      ],
    },
  };

  const style = styleTitles[patterns.academicStyle] || styleTitles['structured'];
  return {
    style: patterns.academicStyle,
    title: style.title,
    techniques: style.techniques,
    description: tv(`academic-${patterns.academicStyle}`, patterns.textVariant),
  };
}

// ─── Helper: Stress Response ─────────────────────────────────────────────────

function buildStressResponse(patterns: ProfilePatterns) {
  const stressLabels: Record<string, { stages: [string, string, string] }> = {
    assertive: {
      stages: ['Focused & Direct', 'Assertive & Impatient', 'Aggressive & Dismissive'],
    },
    overthink: {
      stages: ['Analytical & Careful', 'Cautious & Hesitant', 'Paralysed by Detail'],
    },
    withdrawal: {
      stages: ['Quiet & Observant', 'Reserved & Passive', 'Withdrawn & Disengaged'],
    },
    balanced: {
      stages: ['Calm & Steady', 'Mildly Reactive', 'Moderately Affected'],
    },
  };

  const info = stressLabels[patterns.stressType] || stressLabels['balanced'];
  return {
    type: patterns.stressType,
    stages: info.stages,
    description: tv(`stress-${patterns.stressType}`, patterns.textVariant),
  };
}

// ─── Helper: Work Readiness ──────────────────────────────────────────────────

function buildWorkReadiness(data: SchoolData) {
  const agile = data.agile_scores?.[0];
  const commitment = agile?.commitment ?? 0;
  const focus = agile?.focus ?? 0;
  const openness = agile?.openness ?? 0;
  const respect = agile?.respect ?? 0;
  const courage = agile?.courage ?? 0;
  const total = commitment + focus + openness + respect + courage;

  const indicators = [
    { label: 'Completion Reliability', score: commitment, radarScore: Math.round((commitment / 25) * 10) },
    { label: 'Task Focus Stability', score: focus, radarScore: Math.round((focus / 25) * 10) },
    { label: 'Adaptability to Change', score: openness, radarScore: Math.round((openness / 25) * 10) },
    { label: 'Team Sensitivity', score: respect, radarScore: Math.round((respect / 25) * 10) },
    { label: 'Decision Courage', score: courage, radarScore: Math.round((courage / 25) * 10) },
  ];

  const THRESHOLD = 17;
  const strengths = indicators.filter((i) => i.score >= THRESHOLD);
  const growth = indicators.filter((i) => i.score < THRESHOLD);

  let readinessLevel: string;
  let readinessDescription: string;
  if (total >= 95) {
    readinessLevel = 'Advanced Track';
    readinessDescription =
      'This student is well-suited for responsibility-driven environments that value accuracy, accountability, and strategic thinking.';
  } else if (total >= 65) {
    readinessLevel = 'Developing Track';
    readinessDescription =
      'This student shows growing readiness for professional environments. Continued practice in structured settings will accelerate their transition to leadership-ready performance.';
  } else {
    readinessLevel = 'Foundational Track';
    readinessDescription =
      'This student is building foundational work habits. Mentorship, structured routines, and incremental responsibility will support their progression.';
  }

  return {
    indicators,
    strengths: strengths.map((s) => ({ label: s.label, score: s.score })),
    growthAreas: growth.map((g) => ({ label: g.label, score: g.score })),
    readinessLevel,
    readinessDescription,
    totalScore: total,
  };
}

// ─── Helper: Skill Heatmap ───────────────────────────────────────────────────

function buildSkillHeatmap(patterns: ProfilePatterns) {
  return [
    { label: 'Leadership', value: patterns.leadership },
    { label: 'Collaboration', value: patterns.collaboration },
    { label: 'Innovation', value: patterns.innovation },
    { label: 'Analytical', value: patterns.analytical },
    { label: 'Resilience', value: patterns.resilience },
    { label: 'Adaptability', value: patterns.adaptability },
  ];
}

// ─── Helper: Stream Selection Content ────────────────────────────────────────

function buildStreamSelectionContent() {
  const streams: Array<{
    shortName: string;
    title: string;
    vibe: string;
    fields: Array<{
      name: string;
      vibe: string;
      mappedDegrees: string[];
    }>;
  }> = [];
  for (const [, streamShortName] of Object.entries(STREAM_NAMES)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = STREAM_SELECTION_CONTENT[streamShortName as keyof typeof STREAM_SELECTION_CONTENT] as any;
    if (!content) continue;
    streams.push({
      shortName: content.shortName,
      title: content.title,
      vibe: content.vibe,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
      fields: (content.fields as any[]).map((f: any) => ({
        name: f.name,
        vibe: f.vibe,
        mappedDegrees: f.mappedDegrees,
      })),
    });
  }
  return streams;
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export async function buildSchoolReportJSON(data: SchoolData) {
  logger.info('[SchoolReportJSON] Building JSON report...');

  // ── 1. DISC Computation ──
  const { sortedTraits, topTwo, careerAlignmentIntensity } = computeSortedTraits(data);
  const patterns = detectPatterns(data, sortedTraits);

  const [primaryType, secondaryType] = getTopTwoTraits(
    data.most_answered_answer_type,
    data,
  );
  const dominantTrait = primaryType + secondaryType;

  // ── 2. Dynamic Content ──
  const content = SCHOOL_DYNAMIC_CONTENT[primaryType as 'D' | 'I' | 'S' | 'C'];
  const blendedContent = SCHOOL_BLENDED_STYLE_MAPPING[dominantTrait];

  // ── 3. Career Alignment Interpretation ──
  let careerAlignmentInterpretation: string;
  if (careerAlignmentIntensity >= 12) {
    careerAlignmentInterpretation =
      'This student demonstrates strong compatibility across structured, analytical, and strategic career pathways. The profile indicates multi-domain adaptability with particular strength in precision-oriented environments.';
  } else if (careerAlignmentIntensity >= 8) {
    careerAlignmentInterpretation =
      'This student shows solid career alignment across multiple professional domains. With focused development, the profile indicates strong potential for growth in both collaborative and independent work environments.';
  } else {
    careerAlignmentInterpretation =
      "This student's career profile is still developing across key domains. Targeted exposure to structured learning experiences and mentorship will accelerate alignment with high-impact career pathways.";
  }

  // ── 4. Core Identity ──
  const identity = IDENTITY_MAP[topTwo] || IDENTITY_MAP['DC'];

  // ── 5. Strength Clusters ──
  const top1 = sortedTraits[0];
  const top2 = sortedTraits[1];
  const top1Strengths = STRENGTH_MAP[top1.type] || [];
  const top2Strengths = STRENGTH_MAP[top2.type] || [];
  const strengths = [
    ...top1Strengths.map((s) => ({ ...s, value: top1.val })),
    ...top2Strengths.slice(0, 2).map((s) => ({ ...s, value: top2.val })),
  ];

  // ── 6. Development Zones ──
  const bottom1 = sortedTraits[2];
  const bottom2 = sortedTraits[3];
  const developmentAreas = [
    ...(DEVELOPMENT_MAP[bottom1.type] || []).map((d) => ({ ...d, currentVal: bottom1.val })),
    ...(DEVELOPMENT_MAP[bottom2.type] || []).map((d) => ({ ...d, currentVal: bottom2.val })),
  ];

  // ── 7. Course Compatibility (DB call) ──
  let courseCompatibility: CourseCompatibility[] = [];
  try {
    if (data.school_level_id === 1) {
      // SSLC → recommended stream
      const whereYouFitBest = computeWhereYouFitBest(data);
      // For SSLC, pass undefined as schoolStreamId to get all streams
      courseCompatibility = await getCompatibilityMatrixDetails(dominantTrait, undefined);
    } else {
      // HSC → specific stream
      courseCompatibility = await getCompatibilityMatrixDetails(dominantTrait, data.school_stream_id);
    }
  } catch (err) {
    logger.warn('[SchoolReportJSON] Course Compatibility fetch failed.', err);
  }

  // ── 8. Agile Scores normalized ──
  const agile = data.agile_scores?.[0];
  const normAgile = (v: number) => Math.min(100, Math.round((v / 25) * 100));

  // ── Build the JSON response ──
  const response = {
    meta: {
      generatedAt: new Date().toISOString(),
      reportType: 'school',
      schoolLevel: data.school_level_id === 1 ? 'SSLC' : 'HSC',
      schoolStreamId: data.school_stream_id ?? null,
    },

    student: {
      fullName: data.full_name,
      email: data.email_id,
      examRefNo: data.exam_ref_no,
      reportTitle: data.report_title,
      examStart: data.exam_start,
      examEnd: data.exam_end,
    },

    discProfile: {
      scores: {
        D: data.score_D,
        I: data.score_I,
        S: data.score_S,
        C: data.score_C,
      },
      sortedTraits: sortedTraits.map((t) => ({ type: t.type, value: t.val })),
      topTwo: topTwo,
      primaryType,
      secondaryType,
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
      normalized: agile
        ? {
            focus: normAgile(agile.focus),
            courage: normAgile(agile.courage),
            respect: normAgile(agile.respect),
            openness: normAgile(agile.openness),
            commitment: normAgile(agile.commitment),
          }
        : null,
    },

    patterns: {
      discType: patterns.discType,
      dominantTrait: patterns.dominantTrait,
      dualTraits: patterns.dualTraits,
      agilePattern: patterns.agilePattern,
      stressType: patterns.stressType,
      academicStyle: patterns.academicStyle,
    },

    sections: {
      // ── Personalized Insights ──
      generalCharacteristics: content
        ? {
            title: `General Characteristics for ${data.full_name}`,
            content1: content.general_characteristics_1,
            content2: content.general_characteristics_2,
          }
        : null,

      corePersonality: buildCorePersonality(patterns, patterns.textVariant),

      understandingYourself: content
        ? {
            content1: content.understanding_yourself_1,
            content2: content.understanding_yourself_2,
          }
        : null,

      strengths: content
        ? {
            intro: content.strengths_intro,
            list: content.strengths_list,
          }
        : null,

      motivations: content
        ? {
            intro: content.motivations_intro.replace('$full_name', data.full_name),
            whatDrives: content.what_drives_desc,
            uniqueNeeds: content.unique_needs_desc,
          }
        : null,

      communication: content
        ? {
            description: content.communication_desc,
            dos: content.communication_dos_list,
            donts: content.communication_donts_list,
            avoidDescription: content.communication_avoid_desc,
          }
        : null,

      growthAreas: content
        ? {
            html: content.growth_areas_html,
          }
        : null,

      behavioralCharts: content
        ? {
            intro: content.behavioral_snapshot_intro,
            understandingGraphs: content.understanding_graphs_list,
            keyInsights: content.key_insights_list,
          }
        : null,

      // ── Career Intelligence (CI) Sections ──
      careerAlignmentIndex: {
        score: careerAlignmentIntensity,
        maxScore: 15,
        interpretation: careerAlignmentInterpretation,
      },

      coreIdentity: {
        title: identity.title,
        description: identity.description,
      },

      strengthClusters: strengths,

      developmentZones: developmentAreas,

      skillHeatmap: buildSkillHeatmap(patterns),

      careerFit: buildCareerFit(data),

      careerDomainTable: buildCareerDomainTable(topTwo),

      stressResponse: buildStressResponse(patterns),

      academicStrategy: buildAcademicStrategy(patterns),

      workReadiness: buildWorkReadiness(data),

      // ── Blended Style / Academic Career Goals ──
      academicCareerGoals: blendedContent
        ? {
            styleName: blendedContent.style_name,
            styleDescription: blendedContent.style_desc,
            suggestions: blendedContent.nature_suggestions,
            keyBehaviours: blendedContent.key_behaviours,
            typicalScenarios: blendedContent.typical_scenarios,
            traitMapping: blendedContent.trait_mapping1,
          }
        : null,

      // ── Level-specific sections ──
      ...(data.school_level_id === 1
        ? {
            // SSLC sections
            whereYouFitBest: computeWhereYouFitBest(data),
          }
        : {}),

      courseCompatibility: courseCompatibility.length > 0
        ? {
            courses: courseCompatibility,
            description:
              'The course compatibility you\u2019ve received is based on your unique personality Report results, aiming to highlight programs that align well with your strengths and traits. However, this is not a fixed or singular recommendation. Your personal interests, evolving passions, and exposure to different fields also play a crucial role in shaping the right career path for you. We\u2019ve combined your profile with real-time industry data to give you a future-oriented perspective. Please keep in mind that course trends and career opportunities can shift from year to year as the world continues to evolve-new fields emerge, and existing ones transform. Use this as a guide, not a rulebook, to explore and make informed choices about your educational journey.',
          }
        : null,

      streamSelectionContent: data.school_level_id === 1
        ? buildStreamSelectionContent()
        : null,
    },
  };

  logger.info('[SchoolReportJSON] JSON report built successfully.');
  return response;
}
