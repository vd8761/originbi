/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import * as fs from 'fs';
import { SchoolData, COLORS } from '../../types/types';
import {
  BaseReport,
  FutureOutlookData,
  FutureOutlookOptions,
} from '../BaseReport';
import {
  SCHOOL_TOC_CONTENT,
  SCHOOL_CONTENT,
  SCHOOL_DYNAMIC_CONTENT,
  SCHOOL_BLENDED_STYLE_MAPPING,
  WORD_SKETCH_DATA,
  DISCLAIMER_CONTENT,
  MAPPING,
} from './schoolConstants';
import {
  getCompatibilityMatrixDetails,
  CourseCompatibility,
} from '../../helpers/sqlHelper';
import { ACI, ACI_SCORE, DISCLAIMER } from '../BaseConstants';
import { logger } from '../../helpers/logger';

export const CI_COLORS = {
  // Brand primaries
  INDIGO: '#2c2a7d', // base indigo — high values
  INDIGO_MID: '#4e4ba6', // medium shade
  INDIGO_LIGHT: '#9896cc', // light shade — low values / tracks
  INDIGO_PALE: '#e8e7f5', // very light — backgrounds / row stripes
  GREEN: '#4cb966', // base green — secondary / accent
  GREEN_DARK: '#2d8a45', // darker green
  GREEN_LIGHT: '#a8e0b3', // light green tint
  // Neutrals
  LIGHT_GRAY: '#F5F5F5',
  DARK_TEXT: '#1A1A1A',
  MEDIUM_TEXT: '#444444',
  // Semantic
  STRONG_GREEN: '#2d8a45',
  MODERATE_AMBER: '#C68A00',
  DEVELOPING_RED: '#D04A4A',
  // Kept for non-bar usage only
  SECTION_BLUE: '#2c2a7d', // alias for INDIGO
  ACCENT_GREEN: '#4cb966', // alias for GREEN
  ACCENT_TEAL: '#4e4ba6', // remapped to indigo-mid
  TEAL_LIGHT: '#e8e7f5', // remapped to indigo-pale
  TEAL_MID: '#9896cc', // remapped to indigo-light
  TILE_BLUE: '#e8e7f5',
  TILE_TEAL: '#e8e7f5',
  GAUGE_START: '#4cb966', // green start
  GAUGE_END: '#2c2a7d', // indigo end
  GAUGE_BG: '#e8e7f5',
  RADAR_FILL: '#9896cc',
  RADAR_STROKE: '#2c2a7d',
  RADAR_GRID: '#BCBEC0',
  BAR_BLUE: '#2c2a7d',
  BAR_GREEN: '#4cb966',
  BAR_TEAL: '#4e4ba6',
  BAR_PURPLE: '#2c2a7d',
  BAR_INDIGO: '#4e4ba6',
};

// Non-DISC axis labels for the behavioral radar
const BEHAVIOR_LABELS: Record<string, string> = {
  D: 'Drive',
  I: 'Expression',
  S: 'Stability',
  C: 'Precision',
};

/**
 * SchoolReport Class
 * ------------------
 * Generates the School Student Report PDF.
 * Focuses on:
 * - Personalized Insights based on DISC scores.
 * - Study Habits and Learning Styles.
 * - Academic and Career stream recommendations.
 * - Course Compatibility Matrix.
 */

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CAREER INTELLIGENCE â€” Static Data Maps (migrated from schoolReport2.ts)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// ─── STATIC DATA (Non-DISC Career Language) ────────────────────────────────

/** Maps two-letter trait combos to professional identity titles and descriptions */
const IDENTITY_MAP: Record<string, { title: string; description: string }> = {
  DC: {
    title: 'Structured Strategic Performer',
    description:
      'This student naturally prefers clarity, defined systems, and logical decision-making environments. They perform best where expectations are clear, processes are structured, and outcomes are measurable. They evaluate, plan, and then execute with discipline.',
  },
  CD: {
    title: 'Precision-Driven Strategist',
    description:
      'This student thrives in environments where quality standards are high and decisions are supported by evidence. They bring thoroughness and strategic thinking together, preferring to analyse before acting and holding themselves to exacting standards.',
  },
  DI: {
    title: 'Adaptive Collaborative Driver',
    description:
      'This student combines a goal-oriented mindset with strong interpersonal energy. They take charge confidently while engaging others, and perform best in dynamic settings that reward initiative, persuasion, and visible results.',
  },
  ID: {
    title: 'Expressive Initiative Leader',
    description:
      'This student leads through enthusiasm and social connection. They naturally rally people around ideas, communicate with energy, and thrive where creativity, collaboration, and rapid action intersect.',
  },
  DS: {
    title: 'Resilient Operational Executor',
    description:
      'This student blends a drive for results with steady follow-through. They set clear targets and build practical processes to reach them, bringing determination and patience together in equal measure.',
  },
  SD: {
    title: 'Dependable Performance Anchor',
    description:
      'This student brings reliability and quiet resolve to every environment. They follow systems faithfully, execute with discipline, and provide a stabilising force that others depend on during change.',
  },
  IS: {
    title: 'Empathic Engagement Specialist',
    description:
      'This student creates trust and collaboration effortlessly. They sense team dynamics, build inclusive environments, and perform best where cooperation, empathy, and steady contribution are valued.',
  },
  SI: {
    title: 'Supportive Team Catalyst',
    description:
      'This student combines warmth with cooperative energy, naturally encouraging others while maintaining steady output. They thrive in team-first environments that value harmony and shared achievement.',
  },
  IC: {
    title: 'Creative Analytical Innovator',
    description:
      'This student brings a rare blend of imagination and logical rigour. They design thoughtful solutions, balance creativity with evidence, and perform best in environments that value both innovation and accuracy.',
  },
  CI: {
    title: 'Methodical Creative Planner',
    description:
      'This student approaches creativity with discipline. They merge analytical depth with expressive communication, thriving where structured innovation and evidence-based storytelling are required.',
  },
  SC: {
    title: 'Steady Quality Guardian',
    description:
      'This student values consistency, precision, and calm performance. They maintain high standards through patience and systematic work, excelling in environments that reward reliability and thoroughness.',
  },
  CS: {
    title: 'Careful Stability Architect',
    description:
      'This student brings order and meticulous care to every project. They prefer predictable environments with clear processes, and their attention to detail ensures that standards are never compromised.',
  },
};

/** Maps each trait letter to career-relevant strength labels + short descriptions */
const STRENGTH_MAP: Record<string, { label: string; desc: string }[]> = {
  D: [
    {
      label: 'Goal-Driven Decision Making',
      desc: 'Maintains focus on measurable results and defined objectives.',
    },
    {
      label: 'Strategic Execution Authority',
      desc: 'Comfortable taking ownership and driving outcomes independently.',
    },
    {
      label: 'Rapid Problem Resolution',
      desc: 'Cuts through ambiguity and delivers solutions under pressure.',
    },
  ],
  I: [
    {
      label: 'Collaborative Influence',
      desc: 'Strong ability to rally teams and build consensus around ideas.',
    },
    {
      label: 'Adaptive Communication',
      desc: 'Adjusts messaging instinctively to engage diverse audiences.',
    },
    {
      label: 'Creative Solution Design',
      desc: 'Generates fresh approaches and inspires innovative thinking.',
    },
  ],
  S: [
    {
      label: 'Consistency & Reliability',
      desc: 'Demonstrates dependable performance under structured expectations.',
    },
    {
      label: 'Team Cohesion Building',
      desc: 'Fosters trust and psychological safety within groups.',
    },
    {
      label: 'Sustained Task Commitment',
      desc: 'Maintains steady effort over extended timelines without burnout.',
    },
  ],
  C: [
    {
      label: 'Analytical Accuracy',
      desc: 'Strong ability to evaluate information carefully and make data-driven decisions.',
    },
    {
      label: 'Structured Execution Discipline',
      desc: 'Performs consistently in environments that require procedure adherence.',
    },
    {
      label: 'Strategic Planning Orientation',
      desc: 'Comfortable setting goals and aligning resources for long-term outcomes.',
    },
  ],
};

/** Maps each trait letter to positive development opportunity descriptions */
const DEVELOPMENT_MAP: Record<string, { label: string; desc: string }[]> = {
  D: [
    {
      label: 'Emotional Flexibility',
      desc: 'May benefit from adapting communication tone based on audience sensitivity.',
    },
    {
      label: 'Delegation Comfort',
      desc: 'Should gradually build confidence in sharing control and trusting team execution.',
    },
  ],
  I: [
    {
      label: 'Sustained Focus Depth',
      desc: 'Can strengthen performance by completing deep-work cycles without distraction.',
    },
    {
      label: 'Detail Verification',
      desc: 'May benefit from building routine checks before finalising deliverables.',
    },
  ],
  S: [
    {
      label: 'Spontaneous Adaptability',
      desc: 'Can strengthen performance in rapidly changing or ambiguous environments.',
    },
    {
      label: 'Social Influence Confidence',
      desc: 'May need to express ideas more assertively in collaborative discussions.',
    },
  ],
  C: [
    {
      label: 'Pace Flexibility',
      desc: 'May benefit from releasing work incrementally rather than waiting for perfection.',
    },
    {
      label: 'Interpersonal Warmth',
      desc: 'Can strengthen impact by adding informal, empathetic elements to communication.',
    },
  ],
};

/** Maps trait combos to career domains and automation risk */
const CAREER_DOMAIN_MAP: Record<
  string,
  { domains: { name: string; score: number }[]; automationRisk: string }
> = {
  DC: {
    domains: [
      { name: 'Engineering & Robotics', score: 95 },
      { name: 'Data & Systems Management', score: 90 },
      { name: 'Governance & Compliance', score: 85 },
      { name: 'Research & Structured Technology', score: 80 },
      { name: 'Risk & Strategic Planning', score: 75 },
    ],
    automationRisk:
      'Low risk in analytical and strategic domains. Higher risk only in repetitive, low-decision roles.',
  },
  CD: {
    domains: [
      { name: 'Quality Assurance & Standards', score: 95 },
      { name: 'Financial Analysis & Auditing', score: 90 },
      { name: 'Research & Development', score: 85 },
      { name: 'Policy Design & Regulation', score: 80 },
      { name: 'Data Science & Machine Learning', score: 78 },
    ],
    automationRisk:
      'Low risk due to analytical depth. Roles requiring human oversight remain resilient.',
  },
  DI: {
    domains: [
      { name: 'Business Development & Sales', score: 92 },
      { name: 'Product Management', score: 88 },
      { name: 'Startup & Entrepreneurship', score: 85 },
      { name: 'Marketing Strategy', score: 82 },
      { name: 'Consulting & Advisory', score: 78 },
    ],
    automationRisk:
      'Low risk in leadership and relationship-driven roles. Higher risk only in transactional functions.',
  },
  ID: {
    domains: [
      { name: 'Creative Direction & Content', score: 90 },
      { name: 'Public Relations & Comms', score: 88 },
      { name: 'Brand Management', score: 85 },
      { name: 'Event & Experience Design', score: 80 },
      { name: 'Media Production', score: 76 },
    ],
    automationRisk:
      'Low risk in creative and people-facing domains. AI augments but does not replace persuasive leadership.',
  },
  DS: {
    domains: [
      { name: 'Operations Management', score: 94 },
      { name: 'Project & Program Management', score: 90 },
      { name: 'Supply Chain & Logistics', score: 86 },
      { name: 'Construction & Infrastructure', score: 82 },
      { name: 'Defence Strategy', score: 78 },
    ],
    automationRisk:
      'Low risk in operational leadership. Steady execution roles remain critical.',
  },
  SD: {
    domains: [
      { name: 'Healthcare Administration', score: 92 },
      { name: 'Education & Training', score: 88 },
      { name: 'Facilities & Operations', score: 84 },
      { name: 'Government & Public Service', score: 80 },
      { name: 'Agricultural Management', score: 76 },
    ],
    automationRisk:
      'Low risk in service-oriented leadership. Human judgment remains indispensable.',
  },
  IS: {
    domains: [
      { name: 'Human Resources & People Ops', score: 94 },
      { name: 'Counselling & Social Work', score: 90 },
      { name: 'Customer Success', score: 86 },
      { name: 'Community Development', score: 82 },
      { name: 'Teaching & Academic Mentoring', score: 78 },
    ],
    automationRisk:
      'Low risk in empathy-driven roles. Human connection is irreplaceable.',
  },
  SI: {
    domains: [
      { name: 'Team Coordination', score: 90 },
      { name: 'Patient Care & Allied Health', score: 88 },
      { name: 'Hospitality & Guest Experience', score: 84 },
      { name: 'Retail Management', score: 80 },
      { name: 'Nonprofit Program Management', score: 76 },
    ],
    automationRisk:
      'Low risk in people-first service environments. Supportive roles require human presence.',
  },
  IC: {
    domains: [
      { name: 'UX/UI Design & Research', score: 92 },
      { name: 'Advertising & Creative Strategy', score: 88 },
      { name: 'Architecture & Interior Design', score: 84 },
      { name: 'Content Creation & Storytelling', score: 80 },
      { name: 'Innovation Labs & R&D', score: 76 },
    ],
    automationRisk:
      'Low risk where human creativity meets analytical rigour. AI assists but does not replace design judgment.',
  },
  CI: {
    domains: [
      { name: 'Technical Writing', score: 90 },
      { name: 'Information Architecture', score: 86 },
      { name: 'Product Design & Prototyping', score: 84 },
      { name: 'Data Visualisation & Analytics', score: 80 },
      { name: 'EdTech & Instructional Design', score: 76 },
    ],
    automationRisk:
      'Low risk in structured creative domains. Methodical innovation requires human oversight.',
  },
  SC: {
    domains: [
      { name: 'Compliance & Regulatory Affairs', score: 92 },
      { name: 'Laboratory Science', score: 88 },
      { name: 'Archival & Library Science', score: 84 },
      { name: 'Accounting & Financial Planning', score: 80 },
      { name: 'Environmental Safety', score: 76 },
    ],
    automationRisk:
      'Low risk in precision-driven stability roles. Quality-focused work resists full automation.',
  },
  CS: {
    domains: [
      { name: 'Software Quality Assurance', score: 92 },
      { name: 'Pharmaceutical R&D', score: 88 },
      { name: 'Legal Research', score: 84 },
      { name: 'Actuarial Science', score: 80 },
      { name: 'Clinical Data Management', score: 76 },
    ],
    automationRisk:
      'Low risk in detail-critical domains. Precision roles demand human verification.',
  },
};

interface ProfilePatterns {
  discType: 'dominant' | 'dual' | 'balanced';
  dominantTrait?: string;
  dualTraits?: [string, string];
  agilePattern: string;
  leadership: number;
  collaboration: number;
  innovation: number;
  analytical: number;
  resilience: number;
  adaptability: number;
  stressType: string;
  academicStyle: string;
  textVariant: number;
}

// ─── ARCHETYPE DATA ────────────────────────────────────────────────────────

const ARCHETYPE_DATA: Record<
  string,
  {
    dominant: {
      title: string;
      superpower: string;
      risk: string;
      environment: string;
    };
    secondary: {
      title: string;
      superpower: string;
      risk: string;
      environment: string;
    };
  }
> = {
  D: {
    dominant: {
      title: 'Strategic Driver',
      superpower: 'Decisive action under pressure',
      risk: 'May overlook team sentiment in pursuit of results',
      environment: 'Competitive, fast-paced, outcome-driven',
    },
    secondary: {
      title: 'Assertive Contributor',
      superpower: 'Confident initiative in group settings',
      risk: 'Can become impatient with slower processes',
      environment: 'Project-based, target-oriented',
    },
  },
  I: {
    dominant: {
      title: 'Dynamic Communicator',
      superpower: 'Energising teams and building enthusiasm',
      risk: 'May prioritise engagement over follow-through',
      environment: 'Collaborative, creative, socially active',
    },
    secondary: {
      title: 'Expressive Collaborator',
      superpower: 'Building rapport and inspiring action',
      risk: 'May struggle with sustained solo tasks',
      environment: 'Team-based, interactive learning',
    },
  },
  S: {
    dominant: {
      title: 'Steady Anchor',
      superpower: 'Reliable consistency and calm under pressure',
      risk: 'May resist necessary changes or new methods',
      environment: 'Structured, predictable, supportive',
    },
    secondary: {
      title: 'Supportive Stabiliser',
      superpower: 'Creating trust and psychological safety',
      risk: 'May avoid confrontation when needed',
      environment: 'Team-oriented, routine-based',
    },
  },
  C: {
    dominant: {
      title: 'Precision Architect',
      superpower: 'Analytical depth and quality control',
      risk: 'May delay action while seeking perfect data',
      environment: 'Research-oriented, standard-driven, detail-rich',
    },
    secondary: {
      title: 'Quality Analyst',
      superpower: 'Systematic evaluation and process design',
      risk: 'May over-analyse in time-sensitive situations',
      environment: 'Data-centric, structured planning',
    },
  },
};

const DUAL_ARCHETYPE: Record<string, { title: string; description: string }> = {
  DC: {
    title: 'Strategic Executor',
    description:
      'You combine decisiveness with structured thinking — a rare blend of action and precision.',
  },
  CD: {
    title: 'Analytical Commander',
    description: 'Your leadership style is analytical rather than impulsive.',
  },
  DI: {
    title: 'Charismatic Driver',
    description: 'You prefer taking charge while energising those around you.',
  },
  ID: {
    title: 'Influential Initiator',
    description: 'You lead through inspiration and bold action.',
  },
  DS: {
    title: 'Resilient Operator',
    description: 'You drive results with patient determination.',
  },
  SD: {
    title: 'Steadfast Director',
    description: 'You build systems while maintaining calm authority.',
  },
  IS: {
    title: 'Empathetic Motivator',
    description: 'You combine warmth with persuasive energy.',
  },
  SI: {
    title: 'Harmonious Facilitator',
    description: 'You build consensus through genuine care.',
  },
  IC: {
    title: 'Creative Analyst',
    description: 'You balance imagination with methodical evaluation.',
  },
  CI: {
    title: 'Methodical Innovator',
    description: 'You bring structure to creative problem-solving.',
  },
  SC: {
    title: 'Reliable Perfectionist',
    description: 'You combine steady commitment with quality focus.',
  },
  CS: {
    title: 'Careful Maintainer',
    description: 'You sustain high standards through disciplined patience.',
  },
};

// ─── TEXT VARIATIONS ───────────────────────────────────────────────────────

const TEXT_VARIATIONS: Record<string, string[]> = {
  'disc-dominant': [
    'You naturally take control in complex situations and prefer driving results rather than waiting for direction.',
    'You show a strong preference for leading decisions and influencing outcomes, often stepping forward in high-pressure moments.',
    'Your strong drive gives you an edge in competitive environments. Developing patience will multiply your leadership impact.',
  ],
  'disc-dual': [
    'You combine two strong capabilities that create a distinctive professional identity.',
    'Your profile blends complementary strengths that few others possess naturally.',
    'Your dual strengths position you uniquely — leveraging both will accelerate career growth.',
  ],
  'disc-balanced': [
    'You demonstrate adaptability across different environments without extreme behavioural shifts.',
    'You can comfortably adjust between leadership, collaboration, and analysis.',
    'Your flexibility makes you versatile. Developing deeper expertise in one area will amplify your impact.',
  ],
  'agile-assertive-risk': [
    'You are bold in expressing ideas, but strengthening listening skills will elevate your influence.',
    'You challenge situations confidently. Building empathy will increase long-term trust.',
    'Your confidence is powerful. Balancing it with patience will amplify impact.',
  ],
  'agile-execution-engine': [
    'You show consistency in completing tasks even under pressure.',
    "You don't just start strong — you sustain performance across the finish line.",
    'You convert ideas into measurable outcomes with reliable follow-through.',
  ],
  'agile-creative-instability': [
    'You generate ideas easily but may lose momentum in execution.',
    'Your creativity thrives in flexible environments. Structure will increase success rate.',
    'You adapt quickly, but consistency will turn potential into achievement.',
  ],
  'agile-balanced': [
    'Your agile competencies are balanced, showing well-rounded readiness for professional environments.',
    'You maintain consistent performance across all behavioural agility dimensions.',
    'Your even distribution of agile capabilities supports adaptable career growth.',
  ],
  'stress-assertive': [
    'Under pressure, your communication may become more direct and results-focused.',
    'In high-stakes moments, you may prioritise outcomes over relationship management.',
    'Stress can sharpen your decisiveness but may reduce diplomacy. Awareness is key.',
  ],
  'stress-overthink': [
    'You may delay decisions seeking more data when under pressure.',
    'Perfectionism can increase under uncertainty, slowing your response time.',
    'Stress may push you toward over-analysis. Setting decision deadlines helps.',
  ],
  'stress-withdrawal': [
    'Under pressure, you may become quieter and avoid confrontation.',
    'Stress may lead you to internalise concerns rather than voicing them.',
    'In difficult moments, building confidence to speak up will strengthen your resilience.',
  ],
  'stress-balanced': [
    'You manage pressure with a reasonably steady approach, without strong behavioural shifts.',
    'Under moderate stress, you maintain your typical work patterns and communication style.',
    'Your stress responses are relatively balanced, allowing consistent performance in most environments.',
  ],
  'academic-structured': [
    'You perform best with planned schedules and defined milestones.',
    'Structured revision timetables and detailed notes align with your natural approach.',
    'Clear deadlines and systematic preparation maximise your academic output.',
  ],
  'academic-collaborative': [
    'Interactive environments and discussion-based learning increase retention.',
    'Group projects, study circles, and presentation-based learning suit your style.',
    'You learn best when you can engage with peers and exchange perspectives.',
  ],
  'academic-self-paced': [
    'You prefer steady, self-paced study with consistent daily routines.',
    'Regular practice with familiar materials builds your confidence and mastery.',
    'You excel when given time to absorb content at your own speed.',
  ],
  'academic-competitive': [
    'You thrive in competitive academic settings with visible rankings and challenges.',
    'Mock tests, timed exercises, and performance benchmarks fuel your motivation.',
    'Goal-setting and progress tracking align naturally with your approach to learning.',
  ],
};

export class SchoolReport extends BaseReport {
  private data: SchoolData;

  constructor(data: SchoolData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  /**
   * Main Generation Method
   * ----------------------
   * Orchestrates the creation of the School Report PDF.
   * Flow:
   * 1. Cover Page
   * 2. Table of Contents
   * 3. Introductory Pages (About, Purpose)
   * 4. Personalized Insights (General Characteristics, Strengths)
   * 5. Nature Style Graph (Charts)
   * 6. Academic & Career Goals (Leadership, Trait Mapping)
   * 7. Course Compatibility Matrix
   * 8. Disclaimer & Closing
   */
  public async generate(outputPath: string): Promise<void> {
    logger.info('[School REPORT] Starting PDF Generation...');
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    const streamFinished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // 1. Cover Page
    this.generateCoverPage();
    logger.info('[School REPORT] Cover Page Generated.');

    // 2. Table of Contents
    this._currentBackground = 'public/assets/images/Content_Background.jpg';
    this._useStdMargins = false;
    this.doc.addPage();
    this.generateTableOfContents();
    logger.info('[School REPORT] TOC Generated.');

    // 3. Introductory Pages
    this._currentBackground = 'public/assets/images/Watermark_Background.jpg';
    this._useStdMargins = true;
    this.doc.addPage();
    this.generateIntroductoryPages();
    logger.info('[School REPORT] Intro Pages Generated.');

    // --- CI INTRO: Personality Profile ---
    this.ci_computeTraits();

    // 4. Personalized Insights
    this.generatePersonalizedInsights();
    logger.info('[School REPORT] Personalized Insights Generated.');

    // --- CI CORE: Strengths Bars ---
    this.ci_generateCoreIdentityAndStrengths();

    // 5. Nature Style Graph (Charts)
    this.generateNatureGraphSection();
    logger.info('[School REPORT] Nature Graph Section Generated.');

    // --- CI BEHAVIOR: Radar, Impact, Stress ---

    this.ci_generateBehavioralRadar();
    this.ci_generate360Impact();
    this.ci_generateStressBehavior();

    // --- CI PROFESSIONAL READINESS: Agile, Readiness, Skills ---

    this.ci_generateAgileMaturity();
    this.ci_generateWorkReadinessRadar();
    this.ci_generateSkillHeatmap();

    // --- CI ACADEMICS: Setup for existing goals ---

    this.ci_generateAcademicStrategy();

    // 6. Leadership Strengths - Business Vision

    this.generateAcademicCareerGoals();
    logger.info('[School REPORT] Academic Career Goals Generated.');

    // 7. Course Compatability Matrix
    try {
      await this.generateCourseCompatability();
      logger.info('[School REPORT] Course Compatability Generated.');
    } catch (err) {
      logger.warn(
        '[School REPORT] Course Compatability skipped (DB unavailable).',
      );
    }

    // --- CI FUTURE: Alignment, Fit, Domains, Dev Zones ---
    this.ci_generateCareerAlignmentIndex();
    this.ci_generateCareerFit();
    this.ci_generateCareerDomainTable();
    this.ci_generateDevelopmentZones();

    // 8. Disclaimer & Closing
    this.generateDisclaimerSection();
    logger.info('[School REPORT] Disclaimer Generated.');

    this.addFooters(this.data.exam_ref_no);
    this.doc.end();

    await streamFinished;
    logger.info(`[School REPORT] PDF generated successfully at: ${outputPath}`);
  }

  // --- Section Methods (Placeholders) ---

  private generateCoverPage(): void {
    const bgPath = 'public/assets/images/Cover_Background.jpg';
    if (fs.existsSync(bgPath))
      this.doc.image(bgPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    else this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#f0f0f0');

    // --- Title Wrapping ---
    const titleWidth = this.PAGE_WIDTH - 100;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(38)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.data.report_title, 35, 30, {
        width: titleWidth,
        align: 'left',
      });

    // --- Vertical Reference Number ---
    const refNoX = this.PAGE_WIDTH - 47;
    const refNoY = 150;

    this.doc.save(); // Save state before rotation

    this.doc.translate(refNoX, refNoY);
    this.doc.rotate(-90, { origin: [0, 0] });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor(this.COLOR_BLACK)
      .opacity(0.4)
      .text(this.data.exam_ref_no, 0, 0);

    this.doc.restore(); // Restore state (undo rotation)

    // --- Footer Elements ---
    const footerY = this.PAGE_HEIGHT - 90;
    this.doc.opacity(1);

    // Draw "Self Guidance" Label
    this.doc
      .font(this.FONT_SEMIBOLD)
      .fontSize(20)
      .fillColor(this.COLOR_BLACK)
      .text('Self Guidance', 35, footerY);

    // Draw Date
    const dateString = new Date(this.data.exam_start).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(16)
      .text(dateString, 35, footerY + 25);

    // --- FIX 2: Name Alignment with Smart Wrapping ---

    // 1. Set font first so width calculations are accurate
    this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

    const nameWidthLimit = 300; // Half page limit
    const rawName = this.data.full_name;

    // 2. Calculate the smart string (returns "First Last" or "First\nLast")
    const nameText = this.getSmartSplitName(rawName, nameWidthLimit);

    // 3. Define Position
    const rightMarginLimit = 35;
    // X position: Page Width - Text Box Width - Margin - Gap
    const nameX = this.PAGE_WIDTH - nameWidthLimit - rightMarginLimit - 20;
    const nameBaseY = footerY + 20; // This is where the bottom line should sit

    const nameOptions = {
      width: nameWidthLimit + 20,
      align: 'right' as const,
    };

    // 4. Calculate Height for "Bottom-Up" positioning
    // heightOfString handles the \n correctly
    const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
    const singleLineHeight = this.doc.heightOfString('M', nameOptions);

    // AdjustedY ensures the last line of text is always at nameBaseY
    const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);

    this.doc
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(nameText, nameX, adjustedNameY, nameOptions);
  }

  private generateTableOfContents(): void {
    const headerX = 15 * this.MM;
    const circleCenterX = 25 * this.MM;

    // Define the bottom limit (Page Height - Footer Margin)
    const bottomLimit = this.PAGE_HEIGHT - 30 * this.MM;

    // 1. Print Header on the first page
    this.h1('Table of Contents', { x: headerX, y: headerX, fontSize: 38 });

    // Set the starting Y position for the first item
    let currentY = 45 * this.MM;

    // TOC items gap by TOC items count
    let tocItemsGap = 10;
    if (SCHOOL_TOC_CONTENT.length > 10 && SCHOOL_TOC_CONTENT.length < 13) {
      tocItemsGap = 8;
    } else if (SCHOOL_TOC_CONTENT.length >= 13) {
      tocItemsGap = 10;
    }

    SCHOOL_TOC_CONTENT.forEach((item, index) => {
      // 2. Check for overflow
      if (currentY > bottomLimit) {
        this.doc.addPage();

        // 3. Re-print the Header on the new page
        this.h1('Table of Contents', {
          x: headerX,
          y: headerX,
          fontSize: 38,
        });

        // 4. Reset Y position for the content (same as the first page start)
        currentY = 45 * this.MM;
      }

      const contentText = item.replace('$full_name', this.data.full_name);
      const circleY = currentY + 5 * this.MM;

      // Draw the Circle
      this.doc
        .lineWidth(0.4 * this.MM)
        .strokeColor(this.COLOR_BRIGHT_GREEN)
        .circle(circleCenterX, circleY, 5 * this.MM)
        .stroke();

      // Draw the Number inside the circle
      this.renderTextBase((index + 1).toString(), {
        x: 20 * this.MM,
        y: circleY - 7,
        width: 10 * this.MM,
        align: 'center',
        font: this.FONT_SORA_REGULAR,
        fontSize: 12,
        color: this.COLOR_DEEP_BLUE,
      });

      // Draw the Content Text
      this.renderTextBase(contentText, {
        x: 35 * this.MM,
        y: currentY + 1.5 * this.MM,
        width: this.PAGE_WIDTH - 60 * this.MM,
        font: this.FONT_SORA_SEMIBOLD,
        fontSize: 16,
        color: this.COLOR_BLACK,
      });

      // Increment Y for the next loop
      currentY = this.doc.y + tocItemsGap * this.MM;
    });
  }

  /**
   * Generates Intro Pages.
   * Covers:
   * - About the report.
   * - Purpose and Benefits.
   * - How the report helps the student.
   */
  private generateIntroductoryPages(): void {
    // About the Report
    this.h1('About the Origin BI Self-Discovery Report');
    this.pHtml(SCHOOL_CONTENT.about_report);
    this.doc.moveDown();

    // Purpose (Bulleted List)
    this.h2('Purpose of the Report');
    this.list(SCHOOL_CONTENT.purpose_items, { indent: 30 });
    this.doc.moveDown();

    // Why It Matters
    this.h2('Why the Origin BI Self Discovery Assessment Matters');
    this.pHtml(SCHOOL_CONTENT.why_matters);
    this.list(SCHOOL_CONTENT.why_matters_items, { indent: 30 });
    this.doc.moveDown();

    // What You Gain
    this.h2('What You Gain');
    this.p('This Report offers:', { gap: 2 });
    this.list(SCHOOL_CONTENT.what_you_gain_items, {
      indent: 30,
      type: 'number',
    });
    this.pHtml(SCHOOL_CONTENT.about_origin_bi);

    // --- Benefits ---
    this.h1('Benefits of Identifying Strategic Business Enhancement Paths');

    this.pHtml(SCHOOL_CONTENT.benefits_career_paths_desc);
    this.pHtml(SCHOOL_CONTENT.benefits_career_paths_para_2);

    this.h2('Why Identifying the Right Career Matters');
    this.pHtml(SCHOOL_CONTENT.why_identifying_career_matters_desc);
    this.pHtml(SCHOOL_CONTENT.why_identifying_career_matters_para_2);

    // --- How This Report Helps You ---
    this.h2('How This Report Helps You');
    this.pHtml(SCHOOL_CONTENT.how_report_helps_intro);
    this.list(SCHOOL_CONTENT.how_report_helps_items, { indent: 30 });
    this.pHtml(SCHOOL_CONTENT.how_report_helps_outro);

    // Important Note (Boxed/Highlighted usually, but simple text for now based on PHP)
    this.h2('An Important Note');
    this.pHtml(SCHOOL_CONTENT.important_note_desc);
  }

  /**
   * Generates Personalized Insights.
   * Logic:
   * - Fetches dynamic content based on the primary Answer Type (DISC).
   * - Renders sections: Who I Am, Key Strengths, Motivations, Communication Tips.
   * - Includes Nature Style Graph and Agile Compatibility Index (ACI).
   */
  private generatePersonalizedInsights(): void {
    // most_answered_answer_type is an array of objects {ANSWER_TYPE, COUNT}
    const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
    const content = SCHOOL_DYNAMIC_CONTENT[primaryType];

    if (!content) {
      logger.error(
        `[School REPORT] No content found for DISC type: ${primaryType}`,
      );
      return;
    }

    // 1. Personalized Leadership Insights (Intro)
    this.h1(`General Characteristics for ${this.data.full_name}`);
    this.pHtml(content.general_characteristics_1);

    // this.h2("Your Executive Behavioral Snapshot");
    this.pHtml(content.general_characteristics_2);

    this.ci_generateCorePersonality();

    // 2. Understanding Yourself - Who I Am
    this.h2('Understanding Yourself - Who I Am');
    this.pHtml(content.understanding_yourself_1);
    this.pHtml(content.understanding_yourself_2);

    // 3. Key Strengths
    this.h1('YOUR STRENGTHS - What You Bring to the Organization');
    this.pHtml(content.strengths_intro);
    this.h2('Your Natural Strengths');
    this.list(content.strengths_list, { indent: 30 });
    this.h2('Nature Style Graph', {
      align: 'center',
      color: this.COLOR_DEEP_BLUE,
    });
    const topTrait = this.getTopTwoTraits(this.data.most_answered_answer_type, {
      score_D: this.data.score_D,
      score_I: this.data.score_I,
      score_S: this.data.score_S,
      score_C: this.data.score_C,
    })[0];
    let chartData: { label: string; value: number; color: number[] }[] = [];

    if (topTrait === 'D') {
      chartData = [
        { label: 'D', value: 85, color: COLORS.D },
        { label: 'I', value: 30, color: COLORS.I },
        { label: 'S', value: 25, color: COLORS.S },
        { label: 'C', value: 40, color: COLORS.C },
      ];
    } else if (topTrait === 'I') {
      chartData = [
        { label: 'D', value: 30, color: COLORS.D },
        { label: 'I', value: 80, color: COLORS.I },
        { label: 'S', value: 50, color: COLORS.S },
        { label: 'C', value: 30, color: COLORS.C },
      ];
    } else if (topTrait === 'S') {
      chartData = [
        { label: 'D', value: 25, color: COLORS.D },
        { label: 'I', value: 35, color: COLORS.I },
        { label: 'S', value: 85, color: COLORS.S },
        { label: 'C', value: 40, color: COLORS.C },
      ];
    } else if (topTrait === 'C') {
      chartData = [
        { label: 'D', value: 20, color: COLORS.D },
        { label: 'I', value: 25, color: COLORS.I },
        { label: 'S', value: 40, color: COLORS.S },
        { label: 'C', value: 90, color: COLORS.C },
      ];
    } else {
      // Fallback
      chartData = [
        { label: 'D', value: this.data.score_D, color: COLORS.D },
        { label: 'I', value: this.data.score_I, color: COLORS.I },
        { label: 'S', value: this.data.score_S, color: COLORS.S },
        { label: 'C', value: this.data.score_C, color: COLORS.C },
      ];
    }
    this.drawSingleBarChart(chartData, { percentageLabelOffset: -25 });

    // 4. Motivations
    this.h1('Motivations and Needs – Your Personalized Insights');
    this.pHtml(
      content.motivations_intro.replace('$full_name', this.data.full_name),
    );
    this.doc.moveDown();

    this.h3(`What Drives ${this.data.full_name}`);
    this.pHtml(content.what_drives_desc);
    this.doc.moveDown();

    // Unique Needs
    this.h3('Your Unique Needs');
    this.pHtml(content.unique_needs_desc);

    // 5. Communication - Should
    this.h1(`Communication Tips for Connecting with ${this.data.full_name}`);
    this.h2(`How Others Can Best Communicate With ${this.data.full_name}`);
    this.pHtml(content.communication_desc);

    // Do's List
    this.p(`When communicating with ${this.data.full_name}, DO's`);
    this.list(content.communication_dos_list, {
      indent: 30,
      type: 'number',
    });
    this.doc.moveDown();

    // Communication - Should Not
    this.h2('What Others Should Avoid');
    this.pHtml(content.communication_avoid_desc);

    // Dont's List
    this.p(`When communicating with ${this.data.full_name}, DON'T`);
    this.list(content.communication_donts_list, {
      indent: 30,
      type: 'number',
    });
    this.doc.moveDown();

    // 6. Impact and Growth Areas
    this.h2('Your Potential Growth Areas');
    this.doc.lineGap(2);
    this.complexOrderedList(content.growth_areas_html, {
      gap: 10,
      color: this.COLOR_BLACK,
    });

    this.generateACI();

    // 7. Executive Behavioral SnapShot
    this.h1('Your Personalized Behavioral Charts');
    this.h3('What makes you Exceptional');
    this.pHtml(content.behavioral_snapshot_intro);

    // 8. Understanding Graphs
    this.h3('Understanding the Graphs');
    this.list(content.understanding_graphs_list, {
      indent: 30,
    });

    // 9. Key Insights
    this.h3('Key Insights');
    this.list(content.key_insights_list, {
      indent: 30,
    });
  }

  private generateACI(): void {
    const dominantType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
    const contentBlock =
      ACI[
        this.getTopTwoTraits(this.data.most_answered_answer_type, {
          score_D: this.data.score_D,
          score_I: this.data.score_I,
          score_S: this.data.score_S,
          score_C: this.data.score_C,
        })[0] +
          this.getTopTwoTraits(this.data.most_answered_answer_type, {
            score_D: this.data.score_D,
            score_I: this.data.score_I,
            score_S: this.data.score_S,
            score_C: this.data.score_C,
          })[1]
      ];
    const agileSum =
      this.data.agile_scores[0].commitment +
      this.data.agile_scores[0].focus +
      this.data.agile_scores[0].openness +
      this.data.agile_scores[0].respect +
      this.data.agile_scores[0].courage;

    // this.doc.lineGap(2);
    this.h1('Agile Compatibility Index (ACI)');
    this.pHtml(DISCLAIMER.aci_description);
    this.pHtml(contentBlock.agile_desc_1);

    this.h2('Pesonalized Insight');
    this.pHtml(contentBlock.personalized_insight);

    this.h2('Agile Value-Wise Breakdown Table');

    const awbtHeaders = [
      'Agile Value',
      'Score (Out of 25)',
      'Behavioural Note',
    ];

    const awbtRows = [
      [
        'Commitment',
        this.data.agile_scores[0].commitment,
        `${contentBlock.agile_wise_breakdown.commitment.behavioural_note}`,
      ],
      [
        'Focus',
        this.data.agile_scores[0].focus,
        `${contentBlock.agile_wise_breakdown.focus.behavioural_note}`,
      ],
      [
        'Openness',
        this.data.agile_scores[0].openness,
        `${contentBlock.agile_wise_breakdown.openness.behavioural_note}`,
      ],
      [
        'Respect',
        this.data.agile_scores[0].respect,
        `${contentBlock.agile_wise_breakdown.respect.behavioural_note}`,
      ],
      [
        'Courage',
        this.data.agile_scores[0].courage,
        `${contentBlock.agile_wise_breakdown.courage.behavioural_note}`,
      ],
    ];

    this.table(awbtHeaders, awbtRows, {
      colWidths: ['fit', 'fit', 'fill'],
      rowColor: 'transparent',
    });

    let agileRef = ACI_SCORE['0'];
    if (agileSum >= 100) {
      agileRef = ACI_SCORE['100'];
    } else if (agileSum >= 75) {
      agileRef = ACI_SCORE['75'];
    } else if (agileSum >= 50) {
      agileRef = ACI_SCORE['50'];
    } else {
      agileRef = ACI_SCORE['0'];
    }

    const aciScoreHeaders = ['Parameter', 'Description'];
    const aciScoreRows = [
      ['Total Score', `${agileSum} / 125`],
      ['Level', agileRef.title],
      ['Compatibility Tag', agileRef.compatibility_tag],
      ['Interpretation', agileRef.interpretation],
    ];

    this.h2('Score Overview');

    this.table(aciScoreHeaders, aciScoreRows, {
      colWidths: ['fit', 'fill'],
      rowColor: 'transparent',
    });

    this.h2('Value-wise Scores & Micro-habits');
    const vwmhHeader = [
      'Agile Value',
      'Behavioural Reflection',
      'Suggested Micro-Habit for Growth',
    ];

    const vwmhRows = [
      [
        'Commitment',
        contentBlock.agile_wise_breakdown.commitment.behavioural_description,
        contentBlock.agile_wise_breakdown.commitment.suggested_micro_habit,
      ],
      [
        'Focus',
        contentBlock.agile_wise_breakdown.focus.behavioural_description,
        contentBlock.agile_wise_breakdown.focus.suggested_micro_habit,
      ],
      [
        'Openness',
        contentBlock.agile_wise_breakdown.openness.behavioural_description,
        contentBlock.agile_wise_breakdown.openness.suggested_micro_habit,
      ],
      [
        'Respect',
        contentBlock.agile_wise_breakdown.respect.behavioural_description,
        contentBlock.agile_wise_breakdown.respect.suggested_micro_habit,
      ],
      [
        'Courage',
        contentBlock.agile_wise_breakdown.courage.behavioural_description,
        contentBlock.agile_wise_breakdown.courage.suggested_micro_habit,
      ],
    ];

    this.table(vwmhHeader, vwmhRows, {
      colWidths: ['fit', 'fill', 'fill'],
      rowColor: 'transparent',
    });

    this.doc.moveDown(2);
    this.h2('Reflection Summary');
    this.pHtml(contentBlock.reflection_summary);
  }

  private generateNatureGraphSection(): void {
    const topTrait = this.getTopTwoTraits(this.data.most_answered_answer_type, {
      score_D: this.data.score_D,
      score_I: this.data.score_I,
      score_S: this.data.score_S,
      score_C: this.data.score_C,
    })[0];
    let chartData: { label: string; value: number; color: number[] }[] = [];

    if (topTrait === 'D') {
      chartData = [
        { label: 'D', value: 85, color: COLORS.D },
        { label: 'I', value: 30, color: COLORS.I },
        { label: 'S', value: 25, color: COLORS.S },
        { label: 'C', value: 40, color: COLORS.C },
      ];
    } else if (topTrait === 'I') {
      chartData = [
        { label: 'D', value: 30, color: COLORS.D },
        { label: 'I', value: 80, color: COLORS.I },
        { label: 'S', value: 50, color: COLORS.S },
        { label: 'C', value: 30, color: COLORS.C },
      ];
    } else if (topTrait === 'S') {
      chartData = [
        { label: 'D', value: 25, color: COLORS.D },
        { label: 'I', value: 35, color: COLORS.I },
        { label: 'S', value: 85, color: COLORS.S },
        { label: 'C', value: 40, color: COLORS.C },
      ];
    } else if (topTrait === 'C') {
      chartData = [
        { label: 'D', value: 20, color: COLORS.D },
        { label: 'I', value: 25, color: COLORS.I },
        { label: 'S', value: 40, color: COLORS.S },
        { label: 'C', value: 90, color: COLORS.C },
      ];
    } else {
      // Fallback
      chartData = [
        { label: 'D', value: this.data.score_D, color: COLORS.D },
        { label: 'I', value: this.data.score_I, color: COLORS.I },
        { label: 'S', value: this.data.score_S, color: COLORS.S },
        { label: 'C', value: this.data.score_C, color: COLORS.C },
      ];
    }
    // --- Logic for Nature and Adapted Style Graph ---
    const pageContentHeight = this.PAGE_HEIGHT - 2 * this.MARGIN_STD;
    const heightPercent = 92; // 92%
    const normalHeightNeeded = pageContentHeight * (heightPercent / 100);
    const currentY = this.doc.y;
    const pageHeight = this.PAGE_HEIGHT;
    const bottomMargin = this.MARGIN_STD;
    const availableSpace = pageHeight - bottomMargin - currentY;

    let shouldAddPage = false;
    let scalingAdjustment = 0;
    let scale = 1;
    let x = 0;

    if (availableSpace >= normalHeightNeeded) {
      // Fits perfectly
      scalingAdjustment = -50;
    } else if (availableSpace >= normalHeightNeeded - 50) {
      scalingAdjustment = -50;
      scale = 0.8;
    } else {
      // Does not fit even with shrink
      shouldAddPage = true;
      scalingAdjustment = 0;
      scale = 1;
      x = 0.5;
    }

    if (shouldAddPage) {
      this.ensureSpace(1, true); // Force new page
    }

    this.h2(`Nature Style Graph`, {
      align: 'center',
      color: this.COLOR_DEEP_BLUE,
      topGap: 0,
    });
    this.Image('public/assets/images/behavioural-charts.png', {
      width: this.PAGE_WIDTH - 120,
      align: 'center',
    });
    this.doc.moveDown(x);
    this.h2(`Nature and Adapted Style`, {
      align: 'center',
      color: this.COLOR_DEEP_BLUE,
    });
    const adaptedData = [
      { label: 'D', value: this.data.score_D, color: COLORS.D },
      { label: 'I', value: this.data.score_I, color: COLORS.I },
      { label: 'S', value: this.data.score_S, color: COLORS.S },
      { label: 'C', value: this.data.score_C, color: COLORS.C },
    ];
    this.drawSideBySideBarCharts(chartData, adaptedData, {
      scaleHeight: scalingAdjustment,
      scale: scale,
    });
    this.PagedImage('public/assets/images/future-industries-nopage.jpg', {
      resizeMode: 'stretch',
      autoAddPage: false,
    });
    this.PagedImage('public/assets/images/career-popularity-nopage.jpg', {
      resizeMode: 'stretch',
      autoAddPage: false,
    });
    this.generateFutureTechPage();
    this.doc.y += 10 * this.MM;
    this.generateFutureOutlookPage({}, { addAsNewPage: false });
  }

  /**
   * Generates Academic & Career Goals Section.
   * Logic:
   * - Identifies the Dominant Trait Combo (e.g., "DI").
   * - Renders the corresponding "Nature Elements" (Fire/Water/Earth/Air).
   * - Provides Suggestions, Key Behaviours, and Trait Mapping tables.
   */
  private generateAcademicCareerGoals(): void {
    const primaryType = this.data.most_answered_answer_type[0].ANSWER_TYPE;
    const dominantTrait = this.data.most_answered_answer_type
      .sort((a, b) => b.COUNT - a.COUNT)
      .slice(0, 2)
      .map((trait) => trait.ANSWER_TYPE)
      .join('');

    const contentBlock = SCHOOL_BLENDED_STYLE_MAPPING[dominantTrait];
    if (!contentBlock) return;

    this.h1('Mapping Your Strengths to Future Academic and Career Goals');
    this.h2(contentBlock.style_name);
    this.pHtml(contentBlock.style_desc);

    this.renderElementCombo(dominantTrait[0], dominantTrait[1]);

    this.h3('Suggestions');
    this.pHtml(contentBlock.nature_suggestions);

    this.h3('Key Behaviours');
    this.list(contentBlock.key_behaviours, { indent: 30, type: 'number' });

    this.h3('Typical Scenarios');
    this.list(contentBlock.typical_scenarios, {
      indent: 30,
      type: 'number',
    });

    this.h2('Trait Mapping', { ensureSpace: 0.2 });

    const headers = [
      'Trait Combination',
      'Role Suggestions',
      'Recommended Focus Areas',
      'Stress Areas',
    ];
    const tableWidth =
      this.PAGE_WIDTH -
      2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM);
    const colWidths = [
      tableWidth * 0.2,
      tableWidth * 0.3,
      tableWidth * 0.25,
      tableWidth * 0.25,
    ];
    this.table(headers, contentBlock.trait_mapping1, {
      fontSize: 8,
      headerFontSize: 8,
      colWidths: colWidths,
    });
    this.generateRespondParameterTable(primaryType);
  }

  /**
   * Generates Course Compatibility Matrix.
   * Logic:
   * - Fetches compatibility data for the student's stream and top traits.
   * - Renders a Bar Chart comparing compatibility percentages for various courses.
   * - Includes the "Nature Style - Word Sketch".
   */
  private async generateCourseCompatability(): Promise<void> {
    this.h1('Course Compatability Matrix');
    const topTwoTraits = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      {
        score_D: this.data.score_D,
        score_I: this.data.score_I,
        score_S: this.data.score_S,
        score_C: this.data.score_C,
      },
    );

    const data = await getCompatibilityMatrixDetails(
      topTwoTraits[0] + topTwoTraits[1],
      this.data.school_stream_id,
    );
    console.log(`[Report service]`, data);

    this.generateCourseCompatabilityTable(
      data,
      topTwoTraits[0],
      topTwoTraits[1],
    );
    this.doc.moveDown();

    this.h2('Nature Style - Word Sketch');
    this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc);
    this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc_1);
    this.generateWordSketch();
  }

  private generateDisclaimerSection(): void {
    this.h1(DISCLAIMER_CONTENT.title);
    this.pHtml(DISCLAIMER_CONTENT.intro);

    this.h3(DISCLAIMER_CONTENT.limitations_title);
    this.list(DISCLAIMER_CONTENT.limitations_bullets, { indent: 30 });

    this.h3(DISCLAIMER_CONTENT.no_warranties_title);
    this.pHtml(DISCLAIMER_CONTENT.no_warranties_intro, { gap: 10 });
    this.pHtml(DISCLAIMER_CONTENT.no_warranties_disclaimer);
    this.list(DISCLAIMER_CONTENT.no_warranties_bullets, { indent: 30 });

    this.h3(DISCLAIMER_CONTENT.indemnity_title);
    this.pHtml(DISCLAIMER_CONTENT.indemnity_intro);
    this.list(DISCLAIMER_CONTENT.indemnity_bullets, { indent: 30 });
    this.pHtml(DISCLAIMER_CONTENT.indemnity_outro);

    this.h3(DISCLAIMER_CONTENT.no_liability_title);
    this.pHtml(DISCLAIMER_CONTENT.no_liability_desc);

    // Final Closing Note
    this.doc.font(this.FONT_SORA_REGULAR).fontSize(10).fillColor('#555555'); // Greyish
    this.pHtml(DISCLAIMER_CONTENT.closing_note);
  }

  // --- Special Generators ---

  public generateWordSketch(): void {
    this._useStdMargins = true;

    // 1. Configuration
    const tableWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    // 5 columns: Label, D, I, S, C
    const labelColWidth = tableWidth * 0.1;
    const dataColWidth = (tableWidth - labelColWidth) / 4;
    const colWidths = [
      labelColWidth,
      dataColWidth,
      dataColWidth,
      dataColWidth,
      dataColWidth,
    ];

    // Standardized font sizes for table content
    const TABLE_FONT_SIZE = 8;
    const HEADER_FONT_SIZE = 9;

    // 2. Data Definitions
    // Static rows (headers/metadata)
    const staticRows = [
      {
        label: 'Needs',
        vals: [
          'Challenges to solve,\nAuthority',
          'Social relationship,\nFriendly environment',
          'Rules of follow,\nData to Analyze',
          'System, Teams,\nStable environment',
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
          '..being taken advantage\nof/lack of control',
          '..being left out,\nloss of social approval',
          '..being criticized, loss\nof accuracy and quality',
          '..sudden changes/\nloss of stability',
        ],
      },
    ];

    // Word Sketch Rows (Levels 6 down to 1)
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

    // 3. Logic: Determine Level (1-6) from Score (0-100)
    const getLevel = (score: number) => {
      if (score <= 15) return 1;
      if (score <= 30) return 2;
      if (score <= 45) return 3;
      if (score <= 60) return 4;
      if (score <= 75) return 5;
      return 6;
    };

    const dLevel = getLevel(this.data.score_D);
    const iLevel = getLevel(this.data.score_I);
    const sLevel = getLevel(this.data.score_S);
    const cLevel = getLevel(this.data.score_C);

    // Colors
    const highlightColors = {
      D: '#FFCCCC',
      I: '#FFF0CC',
      S: '#CCFFE2',
      C: '#CCF4FF',
    };
    const headerColors = [
      '#D3D3D3',
      '#FF3131',
      '#E8B236',
      '#00AD4C',
      '#4AC6EA',
    ];
    // Colors for main headers: Empty is grey, D/I/S/C use their brand colors
    const headerTextColors = ['black', 'black', 'black', 'white', 'white'];

    // --- DRAWING ---

    // Check overall space approximation: Headers (2 rows) + Static (3 rows) + Spacer + Sketch (6 rows)
    // Approx 20 * 2 + 25 * 3 + 5 + 25 * 6 = 40 + 75 + 5 + 150 = ~270 points
    this.ensureSpace(0.55, true);

    let currentY = this.doc.y;
    const startX = this.MARGIN_STD;
    const headerHeight = 20;

    // A. Main Headers (Dominance, Influence, etc.)
    const headers = [
      '',
      'Dominance (D)',
      'Influence (I)',
      'Steadiness (S)',
      'Conscientiousness (C)',
    ];
    this.doc.font(this.FONT_SORA_BOLD).fontSize(HEADER_FONT_SIZE);

    headers.forEach((h, i) => {
      const cx = startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
      const w = colWidths[i];

      // Draw BG
      this.doc
        .rect(cx, currentY, w, headerHeight)
        .fillColor(headerColors[i])
        .fill();

      // Draw Border
      this.doc
        .rect(cx, currentY, w, headerHeight)
        .strokeColor('black')
        .lineWidth(0.5)
        .stroke();

      // Text
      this.doc.fillColor(headerTextColors[i]).text(h, cx + 2, currentY + 6, {
        width: w - 4,
        align: 'center',
      });
    });
    currentY += headerHeight;

    // B. Sub Headers (DISC Focus, etc.)
    const subHeaders = [
      'DISC Focus',
      'Problem/Tasks',
      'People',
      'Pace (Environment)',
      'Procedure',
    ];
    this.doc.font(this.FONT_SORA_BOLD).fontSize(8).fillColor('black');

    subHeaders.forEach((h, i) => {
      const cx = startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
      const w = colWidths[i];

      this.doc
        .rect(cx, currentY, w, headerHeight)
        .fillColor('#D3D3D3')
        .fillAndStroke('#D3D3D3', 'black');

      this.doc.fillColor('black').text(h, cx + 2, currentY + 6, {
        width: w - 4,
        align: 'center',
      });
    });
    currentY += headerHeight;

    // C. Static Rows (Needs, Emotions, Fears)
    this.doc.font(this.FONT_REGULAR).fontSize(TABLE_FONT_SIZE);
    staticRows.forEach((row) => {
      const cells = [row.label, ...row.vals];

      // Calc Height
      let maxH = 20;
      cells.forEach((text, i) => {
        const w = colWidths[i];
        const h = this.doc.heightOfString(text, { width: w - 4 }) + 10;
        if (h > maxH) maxH = h;
      });

      // Ensure Space per row
      if (currentY + maxH > this.PAGE_HEIGHT - this.MARGIN_STD) {
        this.doc.addPage();
        currentY = this.MARGIN_STD;
      }

      // Draw Cells
      cells.forEach((text, i) => {
        const cx = startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
        const w = colWidths[i];

        this.doc.rect(cx, currentY, w, maxH).strokeColor('black').stroke();
        this.doc.text(text, cx + 2, currentY + 5, {
          width: w - 4,
          align: 'center',
        });
      });
      currentY += maxH;
    });

    // Spacer Row
    this.doc
      .rect(startX, currentY, tableWidth, 5)
      .fillColor('#D3D3D3')
      .fillAndStroke('#D3D3D3', 'black');
    currentY += 5;

    // D. Word Sketch Rows
    sketchData.forEach((row) => {
      // Determine highlighting
      const highlights = [
        false,
        dLevel === row.level, // D col
        iLevel === row.level, // I col
        sLevel === row.level, // S col
        cLevel === row.level, // C col
      ];

      const cells = [row.level.toString(), row.d, row.i, row.s, row.c];

      let maxH = 25;
      cells.forEach((text, i) => {
        const w = colWidths[i];
        const h = this.doc.heightOfString(text, { width: w - 4 }) + 10;
        if (h > maxH) maxH = h;
      });

      // Page Break Check
      if (currentY + maxH > this.PAGE_HEIGHT - this.MARGIN_STD) {
        this.doc.addPage();
        currentY = this.MARGIN_STD;
      }

      cells.forEach((text, i) => {
        const cx = startX + (i > 0 ? colWidths[0] + (i - 1) * dataColWidth : 0);
        const w = colWidths[i];

        // Draw Background Highlight
        if (highlights[i]) {
          const colorKey = ['', 'D', 'I', 'S', 'C'][i];
          this.doc
            .rect(cx, currentY, w, maxH)
            .fillColor((highlightColors as any)[colorKey])
            .fill();
        }

        // Draw Border
        this.doc
          .rect(cx, currentY, w, maxH)
          .strokeColor('black')
          .lineWidth(0.5)
          .stroke();

        // Draw Text
        this.doc.fillColor('black').text(text, cx + 2, currentY + 5, {
          width: w - 4,
          align: 'center',
        });
      });

      currentY += maxH;
    });

    this.doc.y = currentY + 20;
    this.doc.x = this.MARGIN_STD;
  }

  private generateRespondParameterTable(
    dominantType: 'D' | 'I' | 'S' | 'C',
  ): void {
    const contentBlock = SCHOOL_DYNAMIC_CONTENT[dominantType];
    const headers = [
      'Trait',
      'Conflict Management',
      'Change Management',
      'Team Dynamics',
      'Communication',
      'Sustainability',
      'Social Responsibility',
    ];
    const totalWidth =
      this.PAGE_WIDTH -
      2 * (this._useStdMargins ? this.MARGIN_STD : 15 * this.MM);
    const colWidths = [
      totalWidth * 0.1,
      totalWidth * 0.15,
      totalWidth * 0.15,
      totalWidth * 0.15,
      totalWidth * 0.15,
      totalWidth * 0.15,
      totalWidth * 0.15,
    ];
    const traitNames = {
      D: 'Dominance',
      I: 'Influence',
      S: 'Steadiness',
      C: 'Conscientiousness',
    };
    const traitName = traitNames[dominantType];
    const rowData = [[traitName, ...contentBlock.respond_parameter_row]];
    this.ensureSpace(100);
    this.table(headers, rowData, {
      fontSize: 8,
      headerFontSize: 8,
      headerColor: '#D3D3D3',
      headerTextColor: '#000000',
      borderColor: '#000000',
      cellPadding: 5,
      colWidths: colWidths,
    });
  }

  private generateFutureTechPage(): void {
    this.doc.addPage();
    this._useStdMargins = true;
    const margin = 15 * this.MM;

    // --- Header Section ---
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(36)
      .fillColor('black')
      .text('Tech Areas That Will', margin, margin);
    this.doc.text('Matter in ', margin, this.doc.y, { continued: true });
    this.doc.fillColor(this.COLOR_DEEP_BLUE).text('2027 - 2035');

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(20)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text('Emerging Technologies', margin, this.doc.y + 10 * this.MM);

    // --- Legend Section ---
    const legendY = this.doc.y + 5;
    const legendX = 142 * this.MM;
    this.doc.save();
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('black')
      .text('2027', legendX, legendY, { lineBreak: false });

    const circleX = legendX + 16 * this.MM;
    const circleY = legendY + 3;

    // Legend Graphic
    this.doc
      .lineWidth(0.5)
      .strokeColor('#B4B4B4')
      .fillColor('white')
      .circle(circleX, circleY, 1.5 * this.MM)
      .fillAndStroke();
    this.doc
      .moveTo(circleX + 1.5 * this.MM, circleY)
      .lineTo(circleX + 11.5 * this.MM, circleY)
      .strokeColor('#BEBEBE')
      .lineWidth(0.3)
      .stroke();
    this.doc
      .polygon(
        [circleX + 13.5 * this.MM, circleY],
        [circleX + 11.5 * this.MM, circleY - 1.25 * this.MM],
        [circleX + 11.5 * this.MM, circleY + 1.25 * this.MM],
      )
      .fillColor('#BEBEBE')
      .fill();
    this.doc
      .circle(circleX + 15 * this.MM, circleY, 1.5 * this.MM)
      .fillColor('#AAAAAF')
      .fill();
    this.doc.fillColor('black').text('2035', circleX + 20 * this.MM, legendY, {
      lineBreak: false,
    });
    this.doc.restore();

    // --- Chart Section ---
    const [t1, t2] = this.getTopTwoTraits(this.data.most_answered_answer_type, {
      score_D: this.data.score_D,
      score_I: this.data.score_I,
      score_S: this.data.score_S,
      score_C: this.data.score_C,
    });
    const skills = MAPPING[t1 + t2];
    const years = [25, 27, 29, 31, 33, 35];
    const boxWidth = 15.5 * this.MM;
    const startBarY = this.doc.y + 20 * this.MM;

    this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

    // Calculate layout width based on longest label
    let maxLabelWidth = 0;
    skills.forEach((s) => {
      const w = this.doc.widthOfString(s.label);
      if (w > maxLabelWidth) maxLabelWidth = w;
    });
    maxLabelWidth += 4 * this.MM;

    const sectionStartX =
      (this.PAGE_WIDTH -
        (maxLabelWidth + 8 * this.MM + years.length * boxWidth)) /
      2;
    const barStartX = sectionStartX + maxLabelWidth + 8 * this.MM;

    // Render Rows
    skills.forEach((row, index) => {
      const barY = startBarY + index * 10 * this.MM;
      const barCenterY = barY + 2.5 * this.MM; // The vertical center of the chart bar

      // --- FIX START: Vertical Alignment Calculation ---
      const labelOptions = {
        width: maxLabelWidth,
        align: 'right' as const,
      };

      // 1. Measure the height of the label (1 line, 2 lines, etc.)
      this.doc.font(this.FONT_SORA_REGULAR).fontSize(12); // Set font before measuring
      const labelHeight = this.doc.heightOfString(row.label, labelOptions);

      // 2. Calculate Y to center text on barCenterY
      // Formula: CenterPoint - (TextHeight / 2) - BaselineAdjustment
      const centeredLabelY = barCenterY - labelHeight / 2 - 2;

      this.doc
        .fillColor('black')
        .text(row.label, sectionStartX, centeredLabelY, labelOptions);
      // --- FIX END ---

      this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);

      // Draw Years Grid
      years.forEach((year, i) => {
        const bx = barStartX + i * boxWidth;
        this.doc
          .rect(bx, barY, boxWidth, 5 * this.MM)
          .fillColor('#E8E8E8')
          .fill();

        // Draw Year Labels (Top Row Only)
        if (index === 0)
          this.doc.fillColor('black').text(year.toString(), bx, barY - 15, {
            width: boxWidth,
            align: 'center',
          });

        // Draw White Separators
        if (i < years.length - 1)
          this.doc
            .moveTo(bx + boxWidth, barY)
            .lineTo(bx + boxWidth, barY + 5 * this.MM)
            .strokeColor('white')
            .stroke();
      });

      // Draw Data Line/Dots
      const startOffset = ((row.start - 25) / 2) * boxWidth + boxWidth / 2;
      const endOffset = ((row.end - 25) / 2) * boxWidth + boxWidth / 2;
      const openPosX = barStartX + startOffset;
      const endPosX = barStartX + endOffset;

      this.doc
        .moveTo(openPosX, barCenterY)
        .lineTo(endPosX - 2 * this.MM, barCenterY)
        .lineWidth(0.4)
        .strokeColor('#1E1E1E')
        .stroke();
      this.doc
        .circle(openPosX, barCenterY, 1.5 * this.MM)
        .lineWidth(0.4)
        .fillColor('#E8E8E8')
        .strokeColor('#1E1E1E')
        .fillAndStroke();
      this.doc
        .polygon(
          [endPosX, barCenterY],
          [endPosX - 2 * this.MM, barCenterY - 1 * this.MM],
          [endPosX - 2 * this.MM, barCenterY + 1 * this.MM],
        )
        .fillColor('#1E1E1E')
        .fill();
      this.doc
        .circle(endPosX + 1.4 * this.MM, barCenterY, 1.5 * this.MM)
        .fillColor('#161482')
        .fill();
    });
  }

  private generateFutureOutlookPage(
    data: FutureOutlookData = {},
    options: FutureOutlookOptions = {},
  ): void {
    const {
      title = 'Future Outlook',
      centerLabel = 'Interdisciplinary, tech-driven expertise',
      leftValue = '39%',
      leftLabel = 'current job\nskills',
      rightValue = '2030',
      rightLabel = 'obsolete',
      sourceText = 'Source : World Economic Forum (WEF) Future of Jobs Report 2025.',
    } = data;

    const circleR = 32 * this.MM;

    // --- PAGE SETUP ---
    if (options.addAsNewPage !== false) {
      this.doc.addPage();
      this._useStdMargins = true;
    } else this.ensureSpace(120 * this.MM);
    if (options.addAsNewPage === false) this.doc.moveDown(1);
    const startX = this._useStdMargins ? this.doc.x : this.MARGIN_STD;

    // --- TITLE ---
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(options.titleFontSize || 20)
      .fillColor(options.titleColor || this.COLOR_DEEP_BLUE)
      .text(title, startX, this.doc.y);

    // --- COORDINATE CALCULATIONS ---
    const centerX = 80 * this.MM;
    const centerY = this.doc.y + 45 * this.MM;
    const offset = circleR * 1.65;
    const rightCircleX = centerX + offset - 11 * this.MM;

    // Calculate Center Dot X early to use as anchor for dotted circles
    const centerDotX = centerX + offset / 2 - 5.5 * this.MM;

    this.doc.save();

    // --- SOLID GRADIENT CIRCLES ---
    // Left Fill
    const lGrad = this.doc.linearGradient(
      centerX - circleR,
      centerY,
      centerX + circleR,
      centerY,
    );
    lGrad
      .stop(0, options.leftCircleGradientStart || '#A6D3E1')
      .stop(1, options.leftCircleGradientEnd || '#FFFFFF');
    this.doc.circle(centerX, centerY, circleR).fill(lGrad);

    // Right Fill
    const rGrad = this.doc.linearGradient(
      rightCircleX - circleR,
      centerY,
      rightCircleX + circleR,
      centerY,
    );
    rGrad
      .stop(0, options.rightCircleGradientStart || '#FFFFFF')
      .stop(1, options.rightCircleGradientEnd || '#150089');
    this.doc.opacity(0.4).circle(rightCircleX, centerY, circleR).fill(rGrad);

    this.doc.opacity(1.0);

    // Solid Strokes
    this.doc
      .lineWidth(0.38)
      .strokeColor('#76B3C3')
      .circle(centerX, centerY, circleR)
      .stroke();
    this.doc
      .strokeColor('#7268BF')
      .circle(rightCircleX, centerY, circleR)
      .stroke();

    // --- DOTTED CIRCLES ---
    this.doc.dash(2, { space: 2 });
    const spacing = 13 * this.MM; // Gap between the two dotted circles

    // Left Side Dotted Circles (Cyan)
    // Inner touches centerDotX, Outer is shifted left
    this.doc.strokeColor('#76B3C3');
    this.doc
      .opacity(0.75)
      .circle(centerDotX - circleR, centerY, circleR)
      .stroke(); // Inner
    this.doc
      .opacity(0.5)
      .circle(centerDotX - circleR - spacing, centerY, circleR)
      .stroke(); // Outer

    // Right Side Dotted Circles (Purple)
    // Inner touches centerDotX, Outer is shifted right
    this.doc.strokeColor('#ACA8DE');
    this.doc
      .opacity(0.75)
      .circle(centerDotX + circleR, centerY, circleR)
      .stroke(); // Inner
    this.doc
      .opacity(0.5)
      .circle(centerDotX + circleR + spacing, centerY, circleR)
      .stroke(); // Outer
    // -----------------------------

    this.doc.undash().opacity(1);

    // --- CENTER GREEN DOT & LINE ---
    this.doc
      .dash(2, { space: 2 })
      .strokeColor('#3CC878')
      .moveTo(centerDotX, centerY - 45 * this.MM)
      .lineTo(centerDotX, centerY)
      .stroke();
    this.doc
      .moveTo(centerDotX, centerY - 45 * this.MM)
      .lineTo(centerDotX + 9 * this.MM, centerY - 45 * this.MM)
      .stroke();
    this.doc
      .undash()
      .fillColor([30, 200, 100])
      .circle(centerDotX, centerY, 2.2 * this.MM)
      .fill();

    // --- TEXT LABELS ---
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(options.centerLabelFontSize || 12)
      .fillColor(options.centerLabelColor || '#2C3627')
      .text(centerLabel, centerDotX + 10 * this.MM, centerY - 50 * this.MM, {
        width: 200,
      });

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(options.valueFontSize || 26)
      .fillColor(options.valueColor || '#19191E');
    this.doc.text(leftValue, centerX - 25 * this.MM, centerY - 11 * this.MM, {
      align: 'center',
      width: 28 * this.MM,
    });
    this.doc.text(
      rightValue,
      centerX + offset - 15 * this.MM,
      centerY - 11 * this.MM,
      { align: 'center', width: 28 * this.MM },
    );

    this.doc.font(this.FONT_SORA_REGULAR).fontSize(options.labelFontSize || 10);
    this.doc.text(
      leftLabel,
      centerX - 35 * this.MM + 40,
      centerY - 2 * this.MM,
      { align: 'left', width: 40 * this.MM },
    );
    this.doc.text(
      rightLabel,
      centerX + offset - 18 * this.MM,
      centerY - 1.5 * this.MM,
      { align: 'center', width: 40 * this.MM },
    );

    // --- FOOTER ---
    const footerY = centerY + circleR + 6 * this.MM;
    this.doc
      .font('Helvetica-Oblique')
      .fontSize(options.sourceFontSize || 7)
      .fillColor('#282828')
      .text(sourceText, this.MARGIN_STD, footerY, {
        align: 'center',
        width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
      });

    this.doc.restore();
    this.doc.y = footerY + 20 * this.MM;
  }

  /**
   * Generates a Course Compatibility Bar Chart.
   * Visuals:
   * - Renders bars indicating compatibility %.
   * - Color coding: High compatibility (>=70%) uses Primary Trait color, Low uses Secondary.
   *
   * @param data Array of course objects
   * @param traitHigh Trait char (D/I/S/C) for scores >= 70%
   * @param traitLow Trait char (D/I/S/C) for scores < 70%
   */
  private generateCourseCompatabilityTable(
    data: any[],
    traitHigh: string,
    traitLow: string,
  ): void {
    // --- 1. Layout Constants (Converted from PHP to PDFKit points) ---
    const chartLeft = 100 * this.MM; // PHP: 100
    const chartTop = this.doc.y; // PHP: $pdf->getY() + 8
    const barHeight = 4 * this.MM; // PHP: 4
    const barSpace = 2 * this.MM; // PHP: 2
    const maxBarWidth = 90 * this.MM; // PHP: 90
    const tickLength = 2 * this.MM; // PHP: 2

    // Calculate total height needed
    const chartHeight = data.length * (barHeight + barSpace);
    const chartBottom = chartTop + chartHeight;
    const chartRight = chartLeft + tickLength + maxBarWidth;

    // Ensure we have space on the page
    if (chartBottom + 50 * this.MM > this.PAGE_HEIGHT) {
      this.doc.addPage();
      // Recalculate top if we added a page
      // (You might need to reset chartTop here based on your margin logic)
    }

    // --- 2. Define Colors (Matching PHP RGB values) ---
    const DISC_COLORS: Record<string, string> = {
      D: '#D82A29', // [216, 42, 41]
      I: '#FEDD10', // [254, 221, 16]
      S: '#4FB965', // [79, 185, 101] (PHP code had this as Green)
      C: '#01AADB', // [1, 170, 219]
    };

    const DISC_TEXT_COLORS: Record<string, string> = {
      D: '#FFFFFF',
      I: '#000000',
      S: '#FFFFFF',
      C: '#FFFFFF',
    };

    const colorHigh = traitHigh.toUpperCase();
    const colorLow = traitLow.toUpperCase();

    // --- 3. Draw Axes ---
    const axisWidth = 0.6; // PHP was 0.6 (likely points in FPDF default)
    this.ensureSpace(0.4, true);
    this.doc.save(); // Save state for line width changes
    this.doc.lineWidth(axisWidth).strokeColor('black');

    // Y-Axis
    this.doc
      .moveTo(chartLeft, chartTop)
      .lineTo(chartLeft, chartBottom)
      .stroke();

    // X-Axis (Adjusted slightly to join perfectly)
    this.doc
      .moveTo(chartLeft - axisWidth / 2, chartBottom)
      .lineTo(chartRight, chartBottom)
      .stroke();

    // --- 4. Draw Grid and Ticks (0 to 100) ---
    this.doc.lineWidth(0.2);
    this.doc.font(this.FONT_SORA_REGULAR).fontSize(8).fillColor('black');

    for (let i = 0; i <= 100; i += 20) {
      const x = chartLeft + tickLength + (i * maxBarWidth) / 100;

      // X-axis tick (downwards)
      this.doc
        .moveTo(x, chartBottom)
        .lineTo(x, chartBottom + 2 * this.MM) // PHP tick length was 2
        .strokeColor('black')
        .stroke();

      // X-axis Label
      // PHP: Cell(10, 4, "$i", 0, 0, 'C');
      // Centered text below tick
      this.doc.text(i.toString(), x - 5 * this.MM, chartBottom + 3 * this.MM, {
        width: 10 * this.MM,
        align: 'center',
      });
    }
    this.doc.restore(); // Restore line width

    // --- 5. Draw Bars ---
    data.forEach((item, index) => {
      const val = parseFloat(item.compatibility_percentage);
      const y = chartTop + index * (barHeight + barSpace);
      const barWidth = (maxBarWidth * val) / 100;
      const tickY = y + barHeight / 2;

      // A. Draw short horizontal black tick (Axis connector)
      this.doc.save();
      this.doc.lineWidth(0.6).strokeColor('black');
      this.doc
        .moveTo(chartLeft, tickY)
        .lineTo(chartLeft + tickLength, tickY)
        .stroke();
      this.doc.restore();

      // B. Determine Colors
      // PHP Logic: >= 70 uses Color 1, else Color 2
      const useTrait = val >= 70 ? colorHigh : colorLow;
      const barColor = DISC_COLORS[useTrait] || '#808080';
      const textColor = DISC_TEXT_COLORS[useTrait] || '#000000';

      // C. Draw Bar Rect
      this.doc
        .rect(chartLeft + tickLength, y, barWidth, barHeight)
        .fillColor(barColor)
        .fill();

      // D. Label (Left of Y Axis)
      // PHP: Cell($chartLeft - 19, $barHeight, $label, 0, 0, 'R');
      // Align Right, ending at (chartLeft - 4mm padding approx)
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor('black')
        .text(item.course_name, 15 * this.MM, y - 1, {
          // y-1 for visual centering
          width: chartLeft - 19 * this.MM,
          align: 'right',
          height: barHeight,
        });

      // E. Value Label (Right of Bar)
      // PHP: SetXY($chartLeft + $tickLength + $barWidth + 2, $y);
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor('black') // Explicitly black as per your previous chart logic, or usage of textColor?
        // PHP code sets TextColor based on DISC, but typically this label is outside the bar.
        // If the label is outside, White text (DISC_TEXT_COLORS) will be invisible.
        // Reverting to BLACK for visibility unless it's inside.
        // Based on PHP code structure, it sets color then prints.
        // If you strictly want PHP behavior: .fillColor(textColor)
        // But I recommend Black for outside labels.
        .fillColor('black')
        .text(
          `${val.toFixed(0)}%`,
          chartLeft + tickLength + barWidth + 2 * this.MM,
          y - 1,
        );
    });

    // --- 6. Footer Label ---
    // PHP: Cell(..., 'Compatibility (%)', ..., 'C');
    const footerY = chartBottom + 8 * this.MM;
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(10)
      .fillColor('black')
      .text('Compatibility (%)', 0, footerY, {
        width: this.PAGE_WIDTH,
        align: 'center',
      });

    // --- 7. Description Text ---
    // PHP: SetXY(15, $pdf->getY() + 12); MultiCell...
    const descY = footerY + 12 * this.MM;
    const desc =
      'The course compatibility chart you’ve received is based on your unique personality Report results, aiming to highlight programs that align well with your strengths and traits. However, this is not a fixed or singular recommendation. Your personal interests, evolving passions, and exposure to different fields also play a crucial role in shaping the right career path for you. We’ve combined your profile with real-time industry data to give you a future-oriented perspective. Please keep in mind that course trends and career opportunities can shift from year to year as the world continues to evolve-new fields emerge, and existing ones transform. Use this as a guide, not a rulebook, to explore and make informed choices about your educational journey.';

    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('black')
      .text(desc, 15 * this.MM, descY, {
        width: this.PAGE_WIDTH - 30 * this.MM, // Approx margin
        align: 'left',
        lineGap: 2,
      });

    // Move doc cursor to end of this section
    this.doc.y =
      descY +
      this.doc.heightOfString(desc, {
        width: this.PAGE_WIDTH - 30 * this.MM,
      });
  }

  /**
   * Renders the "Nature Elements" combo (e.g. Water + Earth) centered on the page.
   * Logic:
   * - Maps traits (D, I, S, C) to Elements (Fire, Water, Earth, Air).
   * - Renders Icons + Labels + Plus sign in a centered row.
   */
  private renderElementCombo(trait1: string, trait2: string): void {
    // 1. Map codes to Labels and Image filenames
    const elementMap: { [key: string]: string } = {
      D: 'Fire',
      I: 'Water',
      S: 'Earth',
      C: 'Air',
    };

    const iconMap: { [key: string]: string } = {
      D: 'Fire.png',
      I: 'Water.png',
      S: 'Earth.png',
      C: 'Air.png',
    };

    // Safety check: if traits aren't valid D/I/S/C, exit or handle gracefully
    if (!elementMap[trait1] || !elementMap[trait2]) {
      console.error(
        `[Report service]`,
        `[School Report] Invalid traits passed to renderElementCombo: ${trait1}, ${trait2}`,
      );
      return;
    }

    const baseIconPath = 'public/assets/images/nature-icons/';

    // 2. Define Dimensions (using your this.MM conversion)
    const imgSize = 20 * this.MM; // Icon width/height
    const gap = 5 * this.MM; // Gap between icon and plus sign
    const plusWidth = 8 * this.MM; // Width reserved for the "+"
    const labelHeight = 6 * this.MM; // Height reserved for the text label above

    // Total width of the group: [Icon] [Gap] [Plus] [Gap] [Icon]
    const totalGroupWidth = imgSize + gap + plusWidth + gap + imgSize;

    // 3. Calculate Centering
    const startX = (this.PAGE_WIDTH - totalGroupWidth) / 2;

    // Move down slightly from previous content
    this.doc.moveDown(1);
    const currentY = this.doc.y;

    // 4. Draw First Element (Trait 1)
    const label1 = elementMap[trait1];
    const iconPath1 = baseIconPath + iconMap[trait1];

    // Label 1
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(12)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(label1, startX, currentY, {
        width: imgSize,
        align: 'center',
      });

    // Icon 1
    if (fs.existsSync(iconPath1)) {
      this.doc.image(iconPath1, startX, currentY + labelHeight, {
        width: imgSize,
        height: imgSize,
      });
    } else {
      this.doc.rect(startX, currentY + labelHeight, imgSize, imgSize).stroke();
    }

    // 5. Draw the Plus Sign ("+")
    const plusX = startX + imgSize + gap;
    const plusY = currentY + labelHeight + imgSize / 2 - 6 / 2; // vertical center adjustment

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(18)
      .fillColor('black')
      .text('+', plusX, plusY, {
        width: plusWidth,
        align: 'center',
      });

    // 6. Draw Second Element (Trait 2)
    const startX2 = plusX + plusWidth + gap;
    const label2 = elementMap[trait2];
    const iconPath2 = baseIconPath + iconMap[trait2];

    // Label 2
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(12)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(label2, startX2, currentY, {
        width: imgSize,
        align: 'center',
      });

    // Icon 2
    if (fs.existsSync(iconPath2)) {
      this.doc.image(iconPath2, startX2, currentY + labelHeight, {
        width: imgSize,
        height: imgSize,
      });
    } else {
      this.doc.rect(startX2, currentY + labelHeight, imgSize, imgSize).stroke();
    }

    // 7. Reset Cursor Position for next elements
    // Set Y below the images
    this.doc.y = currentY + labelHeight + imgSize + 5 * this.MM;

    // !!! IMPORTANT: Reset X to the standard margin !!!
    this.doc.x = this.MARGIN_STD;

    // Reset color to black
    this.doc.fillColor(this.COLOR_BLACK);
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CAREER INTELLIGENCE APPENDIX â€” Properties
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  private ci_sortedTraits: { type: string; val: number }[] = [];
  private ci_topTwo: string = '';
  private ci_careerAlignmentIntensity: number = 0;
  private ci_patterns!: ProfilePatterns;

  private ci_computeTraits(): void {
    const scores = [
      { type: 'D', val: this.data.score_D },
      { type: 'I', val: this.data.score_I },
      { type: 'S', val: this.data.score_S },
      { type: 'C', val: this.data.score_C },
    ];

    const PRIORITY = ['C', 'D', 'I', 'S'];
    scores.sort((a, b) => {
      const diff = b.val - a.val;
      if (diff !== 0) return diff;
      return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type);
    });

    this.ci_sortedTraits = scores;
    this.ci_topTwo = scores[0].type + scores[1].type;
    this.ci_careerAlignmentIntensity = Math.min(
      15,
      Math.round((scores[0].val + scores[1].val) / 10),
    );
    this.ci_detectPatterns();
  }

  private ci_detectPatterns(): void {
    const D = this.data.score_D;
    const I = this.data.score_I;
    const S = this.data.score_S;
    const C = this.data.score_C;

    const agile = this.data.agile_scores?.[0];
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

    const top = this.ci_sortedTraits[0];
    const second = this.ci_sortedTraits[1];
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
    if (nCourage > 70 && nRespect < 50) agilePattern = 'assertive-risk';
    else if (nFocus > 70 && nCommitment > 70) agilePattern = 'execution-engine';
    else if (nCommitment < 50 && nOpenness > 70)
      agilePattern = 'creative-instability';
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

    this.ci_patterns = {
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

  private ci_tv(key: string): string {
    const variants = TEXT_VARIATIONS[key];
    if (!variants) return '';
    return variants[this.ci_patterns.textVariant % variants.length];
  }

  // ════════════════════════════════════════════════════════════════
  // SECTION RENDERERS
  // ════════════════════════════════════════════════════════════════

  private ci_generateCoverPage_SKIP(): void {
    const bgPath = 'public/assets/images/Cover_Background.jpg';
    if (fs.existsSync(bgPath))
      this.doc.image(bgPath, 0, 0, {
        width: this.PAGE_WIDTH,
        height: this.PAGE_HEIGHT,
      });
    else this.doc.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT).fill('#f0f0f0');

    // --- Title Wrapping ---
    const titleWidth = this.PAGE_WIDTH - 100;

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(38)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(this.data.report_title, 35, 30, {
        width: titleWidth,
        align: 'left',
      });

    // --- Vertical Reference Number ---
    const refNoX = this.PAGE_WIDTH - 47;
    const refNoY = 150;

    this.doc.save(); // Save state before rotation

    this.doc.translate(refNoX, refNoY);
    this.doc.rotate(-90, { origin: [0, 0] });

    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor(this.COLOR_BLACK)
      .opacity(0.4)
      .text(this.data.exam_ref_no, 0, 0);

    this.doc.restore(); // Restore state (undo rotation)

    // --- Footer Elements ---
    const footerY = this.PAGE_HEIGHT - 90;
    this.doc.opacity(1);

    // Draw "Self Guidance" Label
    this.doc
      .font(this.FONT_SEMIBOLD)
      .fontSize(20)
      .fillColor(this.COLOR_BLACK)
      .text('Self Guidance', 35, footerY);

    // Draw Date
    const dateString = new Date(this.data.exam_start).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(16)
      .text(dateString, 35, footerY + 25);

    // --- FIX 2: Name Alignment with Smart Wrapping ---

    // 1. Set font first so width calculations are accurate
    this.doc.font(this.FONT_SORA_BOLD).fontSize(22);

    const nameWidthLimit = 300; // Half page limit
    const rawName = this.data.full_name;

    // 2. Calculate the smart string (returns "First Last" or "First\nLast")
    const nameText = this.getSmartSplitName(rawName, nameWidthLimit);

    // 3. Define Position
    const rightMarginLimit = 35;
    // X position: Page Width - Text Box Width - Margin - Gap
    const nameX = this.PAGE_WIDTH - nameWidthLimit - rightMarginLimit - 20;
    const nameBaseY = footerY + 20; // This is where the bottom line should sit

    const nameOptions = {
      width: nameWidthLimit + 20,
      align: 'right' as const,
    };

    // 4. Calculate Height for "Bottom-Up" positioning
    // heightOfString handles the \n correctly
    const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
    const singleLineHeight = this.doc.heightOfString('M', nameOptions);

    // AdjustedY ensures the last line of text is always at nameBaseY
    const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);

    this.doc
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(nameText, nameX, adjustedNameY, nameOptions);
  }

  private ci_generatePageHeader(): void {
    const x = this.MARGIN_STD;

    this.renderTextBase('ORIGIN BI – CAREER INTELLIGENCE SUMMARY', {
      x,
      font: this.FONT_SORA_BOLD,
      fontSize: 16,
      color: CI_COLORS.SECTION_BLUE,
    });

    this.renderTextBase(this.data.full_name, {
      x,
      font: this.FONT_SORA_SEMIBOLD,
      fontSize: 11,
      color: CI_COLORS.MEDIUM_TEXT,
      gap: 2,
    });

    const dateString = new Date(this.data.exam_start).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    this.renderTextBase(dateString, {
      x,
      font: this.FONT_REGULAR,
      fontSize: 9,
      color: CI_COLORS.MEDIUM_TEXT,
      gap: 4,
    });

    this.drawSectionDivider(CI_COLORS.SECTION_BLUE, 1.5);
  }

  // ── S1: Career Alignment Index with Gauge ─────────────────────

  private ci_generateCareerAlignmentIndex(): void {
    this.ensureSpace(0.12, true);

    this.h1('Career Alignment Index');

    // Draw the visual gauge
    this.drawProgressGauge(
      this.ci_careerAlignmentIntensity,
      15,
      `${this.ci_careerAlignmentIntensity} / 15`,
    );

    this.doc.y += 8;

    // Interpretation text
    let interpretation: string;
    if (this.ci_careerAlignmentIntensity >= 12) {
      interpretation =
        'This student demonstrates strong compatibility across structured, analytical, and strategic career pathways. The profile indicates multi-domain adaptability with particular strength in precision-oriented environments.';
    } else if (this.ci_careerAlignmentIntensity >= 8) {
      interpretation =
        'This student shows solid career alignment across multiple professional domains. With focused development, the profile indicates strong potential for growth in both collaborative and independent work environments.';
    } else {
      interpretation =
        "This student's career profile is still developing across key domains. Targeted exposure to structured learning experiences and mentorship will accelerate alignment with high-impact career pathways.";
    }

    this.p(interpretation, { gap: 6 });
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S2: Behavioral Capability Radar ───────────────────────────

  private ci_generateBehavioralRadar(): void {
    this.ensureSpace(0.45, true);

    this.h1('Behavioral Capability Profile');

    this.p(
      'An overview of core behavioral capabilities derived from assessment responses. Higher values indicate stronger natural orientation in that capability area.',
    );
    this.doc.moveDown(2);

    // Build radar data with non-DISC labels, scale to 0-10
    const radarData: { [key: string]: number } = {};
    radarData[BEHAVIOR_LABELS['D']] = Math.round(
      (this.data.score_D / 100) * 10,
    );
    radarData[BEHAVIOR_LABELS['I']] = Math.round(
      (this.data.score_I / 100) * 10,
    );
    radarData[BEHAVIOR_LABELS['S']] = Math.round(
      (this.data.score_S / 100) * 10,
    );
    radarData[BEHAVIOR_LABELS['C']] = Math.round(
      (this.data.score_C / 100) * 10,
    );

    this.drawRadarChart(radarData, {
      radius: 90,
      maxValue: 10,
      levels: 5,
      fontSize: 10,
      font: this.FONT_SORA_SEMIBOLD,
      colorFill: CI_COLORS.RADAR_FILL,
      colorStroke: CI_COLORS.RADAR_STROKE,
      colorPoint: CI_COLORS.RADAR_STROKE,
      colorGrid: CI_COLORS.RADAR_GRID,
      colorText: CI_COLORS.DARK_TEXT,
    });

    this.doc.y += 10;
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S3: Core Identity + Strength Intensity Bars ───────────────

  private ci_generateCoreIdentityAndStrengths(): void {
    this.ensureSpace(0.3, true);

    this.h1('Core Behavioral Identity');

    const identity = IDENTITY_MAP[this.ci_topTwo] || IDENTITY_MAP['DC'];

    this.h3(identity.title);

    this.p(identity.description);

    // ── Strength Intensity Bars ──
    this.h2('Top Strength Clusters');

    const top1 = this.ci_sortedTraits[0];
    const top2 = this.ci_sortedTraits[1];

    // Value-based indigo shades: higher trait score → darker
    const getBarColor = (val: number): string => {
      if (val >= 75) return CI_COLORS.INDIGO;
      if (val >= 55) return CI_COLORS.INDIGO_MID;
      return CI_COLORS.INDIGO_LIGHT;
    };

    // Collect strengths: 3 from top trait, 2 from second
    const strengths: { label: string; desc: string; value: number }[] = [];

    const top1Strengths = STRENGTH_MAP[top1.type] || [];
    const top2Strengths = STRENGTH_MAP[top2.type] || [];

    top1Strengths.forEach((s) => strengths.push({ ...s, value: top1.val }));
    top2Strengths
      .slice(0, 2)
      .forEach((s) => strengths.push({ ...s, value: top2.val }));

    // Draw horizontal bars — color based on the underlying trait score
    const barData = strengths.map((s) => ({
      label: s.label,
      value: s.value,
      color: getBarColor(s.value),
    }));

    this.drawHorizontalBars(barData);
    this.doc.y += 6;
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S4: Development Acceleration Zones ────────────────────────

  private ci_generateDevelopmentZones(): void {
    this.ensureSpace(0.22, true);

    this.h2('Development Acceleration Zones');

    this.p(
      'Growth areas identified from your assessment profile. The bar shows your current capability level alongside the growth runway available.',
    );

    const bottom1 = this.ci_sortedTraits[2];
    const bottom2 = this.ci_sortedTraits[3];

    const devAreas: { label: string; desc: string; currentVal: number }[] = [
      ...(DEVELOPMENT_MAP[bottom1.type] || []).map((d) => ({
        ...d,
        currentVal: bottom1.val,
      })),
      ...(DEVELOPMENT_MAP[bottom2.type] || []).map((d) => ({
        ...d,
        currentVal: bottom2.val,
      })),
    ];

    devAreas.forEach((item, index) => {
      this.drawGrowthMeter(index + 1, item.label, item.desc, item.currentVal);
    });

    this.doc.moveDown(2);

    this.p('These are growth opportunities — not limitations.', {
      font: this.FONT_ITALIC,
      fontSize: 9,
      color: CI_COLORS.MEDIUM_TEXT,
      gap: 6,
      align: 'center',
    });

    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S5: Work Readiness Radar + Indicators ─────────────────────

  private ci_generateWorkReadinessRadar(): void {
    this.ensureSpace(0.45, true);

    this.h2('Work Readiness Indicators');

    const agile = this.data.agile_scores?.[0];
    const commitment = agile?.commitment ?? 0;
    const focus = agile?.focus ?? 0;
    const openness = agile?.openness ?? 0;
    const respect = agile?.respect ?? 0;
    const courage = agile?.courage ?? 0;
    const total = commitment + focus + openness + respect + courage;

    // Draw Radar Chart for ACI values (scale 0-25 → 0-10)
    const aciRadar: { [key: string]: number } = {
      'Completion Reliability': Math.round((commitment / 25) * 10),
      'Task Focus': Math.round((focus / 25) * 10),
      Adaptability: Math.round((openness / 25) * 10),
      'Team Sensitivity': Math.round((respect / 25) * 10),
      'Decision Courage': Math.round((courage / 25) * 10),
    };

    this.doc.moveDown(2);

    this.drawRadarChart(aciRadar, {
      radius: 85,
      maxValue: 10,
      levels: 5,
      fontSize: 8,
      font: this.FONT_SORA_REGULAR,
      colorFill: '#4FC3F7',
      colorStroke: CI_COLORS.SECTION_BLUE,
      colorPoint: CI_COLORS.SECTION_BLUE,
      colorGrid: CI_COLORS.RADAR_GRID,
      colorText: CI_COLORS.DARK_TEXT,
    });

    this.doc.y += 10;

    // Qualitative summary bar
    const getLevel = (val: number): { label: string; color: string } => {
      if (val >= 19) return { label: 'Strong', color: CI_COLORS.STRONG_GREEN };
      if (val >= 13)
        return { label: 'Balanced', color: CI_COLORS.MODERATE_AMBER };
      return { label: 'Developing', color: CI_COLORS.DEVELOPING_RED };
    };

    const indicators = [
      { label: 'Completion Reliability', score: commitment },
      { label: 'Task Focus Stability', score: focus },
      { label: 'Adaptability to Change', score: openness },
      { label: 'Team Sensitivity', score: respect },
      { label: 'Decision Courage', score: courage },
    ];

    // ── Two-column Strength / Growth split ─────────
    const THRESHOLD = 17; // out of 25

    const strengths: { label: string; score: number }[] = [];
    const growth: { label: string; score: number }[] = [];

    indicators.forEach((ind) => {
      if (ind.score >= THRESHOLD) strengths.push(ind);
      else growth.push(ind);
    });

    this.doc.y += 8;
    this.ensureSpace(0.28);
    this.drawAgileSplitPanel(strengths, growth);

    // Corporate Readiness Level
    let readinessLevel: string;
    if (total >= 95) {
      readinessLevel = 'Advanced Track';
    } else if (total >= 65) {
      readinessLevel = 'Developing Track';
    } else {
      readinessLevel = 'Foundational Track';
    }

    this.h3(`Corporate Readiness Level: ${readinessLevel}`);

    let readinessDesc: string;
    if (readinessLevel === 'Advanced Track') {
      readinessDesc =
        'This student is well-suited for responsibility-driven environments that value accuracy, accountability, and strategic thinking.';
    } else if (readinessLevel === 'Developing Track') {
      readinessDesc =
        'This student shows growing readiness for professional environments. Continued practice in structured settings will accelerate their transition to leadership-ready performance.';
    } else {
      readinessDesc =
        'This student is building foundational work habits. Mentorship, structured routines, and incremental responsibility will support their progression.';
    }

    this.p(readinessDesc, { gap: 6 });
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S6: Career Domain Compatibility Table ─────────────────────

  private ci_generateCareerDomainTable(): void {
    this.ensureSpace(0.25, true);

    this.h2('Future Role Direction');

    this.h3('Career domains ranked by behavioral compatibility:');

    const careerData =
      CAREER_DOMAIN_MAP[this.ci_topTwo] || CAREER_DOMAIN_MAP['DC'];

    // Build table data
    const headers = ['Career Domain', 'Compatibility', 'Outlook'];
    const rows = careerData.domains.map((d) => {
      // Generate visual compatibility indicator
      const filledDots = Math.round(d.score / 20); // 0-5 dots
      const dots = '●'.repeat(filledDots) + '○'.repeat(5 - filledDots);
      const outlook =
        d.score >= 85
          ? 'Strong Fit'
          : d.score >= 75
            ? 'Good Fit'
            : 'Developing';
      return [d.name, dots, outlook];
    });

    this.table(headers, rows, {
      width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
      colWidths: ['fill', 100, 90],
      cellPadding: 6,
      headerColor: CI_COLORS.SECTION_BLUE,
      headerTextColor: '#FFFFFF',
      headerFont: this.FONT_SORA_SEMIBOLD,
      headerFontSize: 9,
      headerAlign: ['left', 'center', 'center'],
      font: this.FONT_REGULAR,
      fontSize: 9,
      rowAlign: ['left', 'center', 'center'],
      rowColor: '#FFFFFF',
      alternateRowColor: CI_COLORS.TILE_BLUE,
      borderColor: '#E0E0E0',
      borderWidth: 0.5,
      gap: 6,
    });

    this.doc.y += 6;

    // Automation Risk
    this.renderTextBase('Automation Risk Outlook:', {
      font: this.FONT_SORA_SEMIBOLD,
      fontSize: 10,
      color: CI_COLORS.DARK_TEXT,
      gap: 2,
    });

    this.p(careerData.automationRisk, {
      fontSize: 9,
      color: CI_COLORS.MEDIUM_TEXT,
      gap: 4,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // NEW CONDITIONAL SECTION RENDERERS
  // ════════════════════════════════════════════════════════════════

  // ── S1: Core Personality Visualization ─────────────────────────

  private ci_generateCorePersonality(): void {
    this.h2('Core Personality Profile');

    const p = this.ci_patterns;

    if (p.discType === 'dominant' && p.dominantTrait) {
      const archetype = ARCHETYPE_DATA[p.dominantTrait]?.dominant;
      if (archetype) {
        // this.drawArchetypeCard(
        //     archetype.title,
        //     archetype.superpower,
        //     archetype.risk,
        //     archetype.environment,
        //     CI_COLORS.SECTION_BLUE,
        // );
        this.h3(`You are ${archetype.title}`);
        this.list([
          `<b>Superpower:</b> ${archetype.superpower}`,
          `<b>Risk:</b> ${archetype.risk}`,
          `<b>Environment:</b> ${archetype.environment}`,
        ]);
      }
      this.p(this.ci_tv('disc-dominant'), { gap: 6 });
    } else if (p.discType === 'dual' && p.dualTraits) {
      const key = p.dualTraits[0] + p.dualTraits[1];
      const dual = DUAL_ARCHETYPE[key] || DUAL_ARCHETYPE['DC'];
      this.renderTextBase(dual.title, {
        font: this.FONT_SORA_BOLD,
        fontSize: 14,
        color: CI_COLORS.SECTION_BLUE,
        gap: 4,
      });
      this.p(dual.description, { gap: 4 });

      // Show both secondary archetypes
      const arch1 = ARCHETYPE_DATA[p.dualTraits[0]]?.secondary;
      const arch2 = ARCHETYPE_DATA[p.dualTraits[1]]?.secondary;
      if (arch1) {
        this.drawArchetypeCard(
          arch1.title,
          arch1.superpower,
          arch1.risk,
          arch1.environment,
          CI_COLORS.BAR_BLUE,
        );
      }
      if (arch2) {
        this.drawArchetypeCard(
          arch2.title,
          arch2.superpower,
          arch2.risk,
          arch2.environment,
          CI_COLORS.BAR_TEAL,
        );
      }
      this.p(this.ci_tv('disc-dual'), { gap: 6 });
    } else {
      this.renderTextBase('Versatile Adaptive Profile', {
        font: this.FONT_SORA_BOLD,
        fontSize: 14,
        color: CI_COLORS.SECTION_BLUE,
        gap: 4,
      });
      this.p(this.ci_tv('disc-balanced'), { gap: 6 });
    }

    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S2: Agile Maturity Visualization ──────────────────────────

  private ci_generateAgileMaturity(): void {
    this.h2('Agile Maturity Analysis');

    const agile = this.data.agile_scores?.[0];
    const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
    const courage = norm(agile?.courage ?? 0);
    const respect = norm(agile?.respect ?? 0);
    const focus = norm(agile?.focus ?? 0);
    const commitment = norm(agile?.commitment ?? 0);
    const openness = norm(agile?.openness ?? 0);

    const p = this.ci_patterns;
    const patternTitles: Record<string, string> = {
      'assertive-risk': 'Assertive Risk Pattern',
      'execution-engine': 'Execution Engine Profile',
      'creative-instability': 'Creative Instability Pattern',
      balanced: 'Balanced Agility Profile',
    };

    this.h3(patternTitles[p.agilePattern], {
      color: CI_COLORS.ACCENT_TEAL,
    });

    // Draw balance scale for the key pair
    if (p.agilePattern === 'assertive-risk') {
      this.drawBalanceScale('Courage', courage, 'Respect', respect);
    } else if (p.agilePattern === 'execution-engine') {
      this.drawBalanceScale('Focus', focus, 'Commitment', commitment);
    } else if (p.agilePattern === 'creative-instability') {
      this.drawBalanceScale('Openness', openness, 'Commitment', commitment);
    } else {
      // Balanced: show the most extreme pair
      const pairs = [
        { l: 'Courage', lv: courage, r: 'Respect', rv: respect },
        { l: 'Focus', lv: focus, r: 'Commitment', rv: commitment },
      ];
      const widest = pairs.sort(
        (a, b) => Math.abs(b.lv - b.rv) - Math.abs(a.lv - a.rv),
      )[0];
      this.drawBalanceScale(widest.l, widest.lv, widest.r, widest.rv);
    }

    this.p(this.ci_tv(`agile-${p.agilePattern}`), { align: 'center' });
  }

  // ── S3: Skill Heatmap ─────────────────────────────────────────

  private ci_generateSkillHeatmap(): void {
    this.h2('Professiosnal Skill Heatmap');

    this.p(
      'Derived competency scores combining behavioural and agile assessment data. Darker blocks indicate stronger natural orientation.',
    );

    const p = this.ci_patterns;
    const skills = [
      { label: 'Leadership', value: p.leadership },
      { label: 'Collaboration', value: p.collaboration },
      { label: 'Innovation', value: p.innovation },
      { label: 'Analytical', value: p.analytical },
      { label: 'Resilience', value: p.resilience },
      { label: 'Adaptability', value: p.adaptability },
    ];

    this.drawSkillHeatmapGrid(skills);

    // Add contextual text for extreme scores
    if (p.leadership > 75) {
      this.p(
        '★ ' +
          (TEXT_VARIATIONS['skill-leadership-high']?.[p.textVariant] ?? ''),
        {
          color: CI_COLORS.STRONG_GREEN,
          gap: 3,
        },
      );
    }
    if (p.collaboration < 50) {
      this.p(
        '△ ' +
          (TEXT_VARIATIONS['skill-collaboration-low']?.[p.textVariant] ?? ''),
        {
          color: CI_COLORS.MODERATE_AMBER,
          gap: 3,
        },
      );
    }

    this.doc.y += 4;
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S4: Career Fit Variations ─────────────────────────────────

  private ci_generateCareerFit(): void {
    this.ensureSpace(0.16, true);

    this.h2('Career Fit Analysis');

    const p = this.ci_patterns;
    const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
    const agile = this.data.agile_scores?.[0];
    const nFocus = norm(agile?.focus ?? 0);
    const nCourage = norm(agile?.courage ?? 0);
    const nOpenness = norm(agile?.openness ?? 0);
    const nRespect = norm(agile?.respect ?? 0);

    const D = this.data.score_D;
    const I = this.data.score_I;
    const S = this.data.score_S;
    const C = this.data.score_C;

    const fits = [
      {
        label: 'Engineering & Technology',
        score: Math.round((C + nFocus) / 2),
        condition: C > 65 && nFocus > 65,
      },
      {
        label: 'Management & Leadership',
        score: Math.round((D + nCourage) / 2),
        condition: D > 65 && nCourage > 65,
      },
      {
        label: 'Creative & Design',
        score: Math.round((I + nOpenness) / 2),
        condition: I > 65 && nOpenness > 65,
      },
      {
        label: 'People & HR',
        score: Math.round((S + nRespect) / 2),
        condition: S > 65 && nRespect > 65,
      },
    ];

    const fitColors = [
      CI_COLORS.BAR_BLUE,
      CI_COLORS.BAR_TEAL,
      CI_COLORS.BAR_PURPLE,
      CI_COLORS.ACCENT_GREEN,
    ];

    const barData = fits.map((f, i) => ({
      label: f.label,
      value: f.score,
      color: fitColors[i],
    }));

    this.drawHorizontalBars(barData);

    // Add fit labels
    fits.forEach((f) => {
      if (f.condition) {
        this.p(`✓ ${f.label}: Strong Fit`, {
          color: CI_COLORS.STRONG_GREEN,
          gap: 2,
        });
      }
    });

    this.doc.y += 4;
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S5: Stress Behavior Model ─────────────────────────────────

  private ci_generateStressBehavior(): void {
    this.ensureSpace(0.14, true);

    this.h2('STRESS RESPONSE MODEL', {
      color: CI_COLORS.SECTION_BLUE,
      topGap: 6,
    });

    const p = this.ci_patterns;
    const stressLabels: Record<
      string,
      { stages: [string, string, string]; color: string }
    > = {
      assertive: {
        stages: [
          'Focused & Direct',
          'Assertive & Impatient',
          'Aggressive & Dismissive',
        ],
        color: CI_COLORS.DEVELOPING_RED,
      },
      overthink: {
        stages: [
          'Analytical & Careful',
          'Cautious & Hesitant',
          'Paralysed by Detail',
        ],
        color: CI_COLORS.MODERATE_AMBER,
      },
      withdrawal: {
        stages: [
          'Quiet & Observant',
          'Reserved & Passive',
          'Withdrawn & Disengaged',
        ],
        color: CI_COLORS.BAR_PURPLE,
      },
      balanced: {
        stages: ['Calm & Steady', 'Mildly Reactive', 'Moderately Affected'],
        color: CI_COLORS.BAR_TEAL,
      },
    };

    const stressInfo = stressLabels[p.stressType] || stressLabels['balanced'];
    this.drawStressProgression(stressInfo.stages, stressInfo.color);
    this.p(this.ci_tv(`stress-${p.stressType}`), { gap: 6 });
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S6: Academic Strategy ─────────────────────────────────────

  private ci_generateAcademicStrategy(): void {
    this.ensureSpace(0.12, true);

    this.h2('ACADEMIC STRATEGY PROFILE', {
      color: CI_COLORS.SECTION_BLUE,
      topGap: 6,
    });

    const styleTitles: Record<string, { title: string; techniques: string[] }> =
      {
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

    const style =
      styleTitles[this.ci_patterns.academicStyle] || styleTitles['structured'];

    this.renderTextBase(style.title, {
      font: this.FONT_SORA_BOLD,
      fontSize: 12,
      color: CI_COLORS.ACCENT_TEAL,
      gap: 4,
    });

    this.p(this.ci_tv(`academic-${this.ci_patterns.academicStyle}`), {
      fontSize: 10,
      gap: 6,
    });

    this.renderTextBase('Recommended Techniques:', {
      font: this.FONT_SORA_SEMIBOLD,
      fontSize: 10,
      color: CI_COLORS.DARK_TEXT,
      gap: 4,
    });

    style.techniques.forEach((t, i) => {
      this.p(`${i + 1}. ${t}`, { gap: 2 });
    });

    this.doc.y += 4;
    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ── S7: 360 Impact Rings ──────────────────────────────────────

  private ci_generate360Impact(): void {
    this.ensureSpace(0.3, true);

    this.h2('360° IMPACT ASSESSMENT', {
      color: CI_COLORS.SECTION_BLUE,
      topGap: 6,
    });

    this.p(
      'A holistic view of impact across personality, behavioural agility, and leadership dimensions.',
      { color: CI_COLORS.MEDIUM_TEXT, gap: 6 },
    );

    const D = this.data.score_D;
    const I = this.data.score_I;
    const S = this.data.score_S;
    const C = this.data.score_C;
    const agile = this.data.agile_scores?.[0];
    const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));

    const personalityAvg = Math.round((D + I + S + C) / 4);
    const agilityAvg = Math.round(
      (norm(agile?.commitment ?? 0) +
        norm(agile?.courage ?? 0) +
        norm(agile?.focus ?? 0) +
        norm(agile?.openness ?? 0) +
        norm(agile?.respect ?? 0)) /
        5,
    );
    const leadershipScore = this.ci_patterns.leadership;

    this.drawImpactRings([
      {
        label: 'Personality',
        value: personalityAvg,
        color: CI_COLORS.INDIGO,
      },
      {
        label: 'Agility',
        value: agilityAvg,
        color: CI_COLORS.INDIGO_MID,
      },
      {
        label: 'Leadership',
        value: leadershipScore,
        color: CI_COLORS.GREEN,
      },
    ]);

    // Summary text
    const allBalanced =
      Math.abs(personalityAvg - agilityAvg) < 15 &&
      Math.abs(agilityAvg - leadershipScore) < 15;
    if (allBalanced) {
      this.p(
        'You maintain consistent performance across personality, behaviour, and collaboration.',
        { gap: 6 },
      );
    } else if (leadershipScore > personalityAvg + 10) {
      this.p(
        'You influence direction strongly, but strengthening emotional alignment will improve cohesion.',
        { gap: 6 },
      );
    } else {
      this.p(
        'Your profile shows distinct strengths across different dimensions. Targeted development will create more uniform impact.',
        { gap: 6 },
      );
    }

    this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // ════════════════════════════════════════════════════════════════
  // CUSTOM GRAPHICAL ELEMENT HELPERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Draws a horizontal progress gauge with gradient fill.
   *
   * ┌────────────────────────────▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░┐
   * └────────────────────────────────────────────────────────┘
   *                                              12 / 15
   *
   * @param value Current value
   * @param max Maximum value
   * @param label Label shown above the filled portion
   */
  private drawProgressGauge(value: number, max: number, label: string): void {
    this.ensureSpace(50);
    const x = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const barHeight = 22;
    const y = this.doc.y;
    const fillRatio = Math.min(1, Math.max(0, value / max));
    const fillWidth = width * fillRatio;

    // Background track
    this.doc.roundedRect(x, y, width, barHeight, 4).fill(CI_COLORS.GAUGE_BG);

    // Gradient fill (simulate with two-color linear gradient)
    if (fillWidth > 0) {
      const grad = this.doc.linearGradient(x, y, x + fillWidth, y);
      grad.stop(0, CI_COLORS.GAUGE_START);
      grad.stop(1, CI_COLORS.GAUGE_END);
      this.doc.roundedRect(x, y, fillWidth, barHeight, 4).fill(grad);
    }

    // Tick marks
    const tickCount = max;
    for (let i = 1; i < tickCount; i++) {
      const tickX = x + (width * i) / tickCount;
      this.doc
        .strokeColor('#FFFFFF')
        .opacity(0.3)
        .lineWidth(0.5)
        .moveTo(tickX, y + 2)
        .lineTo(tickX, y + barHeight - 2)
        .stroke();
    }
    this.doc.opacity(1);

    // Label centered in the filled area
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(11)
      .fillColor('#FFFFFF')
      .text(label, x, y + 4, {
        width: Math.max(fillWidth, 80),
        align: 'center',
      });

    // Scale labels below gauge
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7)
      .fillColor(CI_COLORS.MEDIUM_TEXT);

    this.doc.text('0', x, y + barHeight + 3, {
      width: 20,
      align: 'left',
    });
    this.doc.text(max.toString(), x + width - 20, y + barHeight + 3, {
      width: 20,
      align: 'right',
    });

    this.doc.y = y + barHeight + 14;
  }

  /**
   * Draws a set of horizontal bars with labels and percentage fills.
   *
   * Goal-Driven Decision Making     ████████████████████░░░░  85%
   * Collaborative Influence         ████████████████░░░░░░░░  65%
   *
   * @param data Array of { label, value (0-100), color }
   */
  private drawHorizontalBars(
    data: { label: string; value: number; color: string }[],
  ): void {
    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const labelWidth = 200;
    const barX = x + labelWidth + 6;
    const barWidth = totalWidth - labelWidth - 45;
    const barHeight = 14;
    const radius = barHeight / 2; // fully rounded capsule
    const gapBetween = 6;

    data.forEach((item) => {
      this.ensureSpace(barHeight + gapBetween + 14);
      const y = this.doc.y;
      const fillRatio = Math.min(1, Math.max(0, item.value / 100));
      const fillW = Math.max(0, barWidth * fillRatio);

      // Label — right-aligned so it ends flush with the bar start
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(item.label, x, y + 2, {
          width: labelWidth,
          align: 'right',
          lineBreak: false,
        });

      // Background track — fully rounded
      this.doc
        .roundedRect(barX, y, barWidth, barHeight, radius)
        .fill(CI_COLORS.GAUGE_BG);

      // Filled portion — clip to the track shape so corners stay round
      if (fillW > 0) {
        this.doc.save();
        // clip path = the full bar track shape
        this.doc.roundedRect(barX, y, barWidth, barHeight, radius).clip();
        this.doc
          .roundedRect(barX, y, fillW, barHeight, radius)
          .fill(item.color);
        this.doc.restore();
      }

      // Percentage label to the right of the bar
      this.doc
        .font(this.FONT_SEMIBOLD)
        .fontSize(8)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(`${Math.round(item.value)}%`, barX + barWidth + 4, y + 3, {
          width: 35,
          align: 'left',
        });

      this.doc.y = y + barHeight + gapBetween;
    });
  }

  /**
   * Draws a growth meter row for development areas.
   *
   *  ①  Emotional Flexibility                    ████████░░░░░░░░░░░░
   *     May benefit from adapting communication...
   *
   * Shows a numbered badge, title, description, and a dual-tone bar
   * where the solid portion = current level, lighter portion = growth runway.
   */
  private drawGrowthMeter(
    stepNumber: number,
    title: string,
    description: string,
    currentValue: number,
  ): void {
    const rowHeight = 48;
    this.ensureSpace(rowHeight + 8);

    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const y = this.doc.y;
    const badgeRadius = 11;
    const badgeCenterX = x + badgeRadius;
    const badgeCenterY = y + 12;
    const contentX = x + badgeRadius * 2 + 8;
    const barX = contentX;
    const barWidth = totalWidth - (contentX - x) - 10;
    const barHeight = 12;

    // ── Numbered circle badge (filled teal) ──
    this.doc
      .circle(badgeCenterX, badgeCenterY, badgeRadius)
      .fill(CI_COLORS.ACCENT_TEAL);

    // Number inside (white on teal)
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text(stepNumber.toString(), badgeCenterX - 5, badgeCenterY - 5, {
        width: 10,
        align: 'center',
      });

    // ── Title ──
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(10)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(title, contentX, y + 2, {
        width: barWidth,
      });

    // ── Dual-tone growth bar ──
    const barY = y + 18;
    const fillRatio = Math.min(1, Math.max(0, currentValue / 100));
    const filledWidth = barWidth * fillRatio;
    const remainingWidth = barWidth - filledWidth;

    // Full background (growth runway) — light teal
    this.doc
      .roundedRect(barX, barY, barWidth, barHeight, 4)
      .fill(CI_COLORS.TEAL_LIGHT);

    // Current level (gradient teal fill) — clipped to track so corners round
    if (filledWidth > 0) {
      const grad = this.doc.linearGradient(
        barX,
        barY,
        barX + filledWidth,
        barY,
      );
      grad.stop(0, CI_COLORS.GREEN);
      grad.stop(1, CI_COLORS.INDIGO_MID);
      this.doc.save();
      this.doc.roundedRect(barX, barY, barWidth, barHeight, 4).clip();
      this.doc.roundedRect(barX, barY, filledWidth, barHeight, 4).fill(grad);
      this.doc.restore();
    }

    // Current % label on bar
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(7)
      .fillColor('#FFFFFF')
      .text(`${Math.round(currentValue)}%`, barX + 4, barY + 2, {
        width: Math.max(filledWidth - 8, 30),
        align: 'left',
      });

    // "Growth Potential" label on the remaining area
    if (remainingWidth > 60) {
      this.doc
        .font(this.FONT_ITALIC)
        .fontSize(7)
        .fillColor(CI_COLORS.ACCENT_TEAL)
        .text('Growth Potential', barX + filledWidth + 6, barY + 2, {
          width: remainingWidth - 12,
          align: 'left',
        });
    }

    // ── Description ──
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(8)
      .fillColor(CI_COLORS.MEDIUM_TEXT)
      .text(description, contentX, barY + barHeight + 4, {
        width: barWidth,
      });

    this.doc.y = barY + barHeight + 20;
  }

  /**
   * Draws a thin horizontal line to separate sections.
   */
  private drawSectionDivider(color: string, lineWidth: number = 0.5): void {
    const x = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const y = this.doc.y;

    this.doc
      .strokeColor(color)
      .lineWidth(lineWidth)
      .moveTo(x, y)
      .lineTo(x + width, y)
      .stroke();

    this.doc.y = y + 6;
  }

  /**
   * Draws a mini progress bar capsule for work readiness indicators.
   * Shows label on left, capsule bar in the middle, and level badge on right.
   */
  /**
   * Renders a two-column panel split:
   *  LEFT  — "Agile Strengths"        (indigo panel, scores ≥ threshold)
   *  RIGHT — "Growth Opportunities"   (green panel,  scores < threshold)
   * Each row: dimension label (left) + pill score badge (right).
   */
  private drawAgileSplitPanel(
    strengths: { label: string; score: number }[],
    growth: { label: string; score: number }[],
  ): void {
    const x = this.MARGIN_STD;
    const totalW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const gap = 10;
    const panelW = (totalW - gap) / 2;
    const headerH = 24;
    const rowH = 22;
    const rowGap = 4;
    const radius = 5;
    const maxRows = Math.max(strengths.length, growth.length, 1);
    const bodyH = maxRows * (rowH + rowGap) + 4;
    const totalH = headerH + bodyH + 8;

    this.ensureSpace(totalH + 16);
    const startY = this.doc.y;

    const drawPanel = (
      panelX: number,
      title: string,
      items: { label: string; score: number }[],
      headerBg: string,
      pillBg: string,
      emptyText: string,
    ) => {
      // Panel background (very subtle)
      this.doc
        .roundedRect(panelX, startY, panelW, totalH, radius)
        .fill('#F8F8FC');

      // Header strip
      this.doc
        .roundedRect(panelX, startY, panelW, headerH, radius)
        .fill(headerBg);
      // Square-off the bottom corners of the header
      this.doc
        .rect(panelX, startY + headerH - radius, panelW, radius)
        .fill(headerBg);

      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text(title, panelX + 10, startY + 7, {
          width: panelW - 20,
          lineBreak: false,
        });

      if (items.length === 0) {
        this.doc
          .font(this.FONT_ITALIC)
          .fontSize(8)
          .fillColor(CI_COLORS.MEDIUM_TEXT)
          .text(emptyText, panelX + 10, startY + headerH + 10, {
            width: panelW - 20,
          });
        return;
      }

      items.forEach((item, i) => {
        const ry = startY + headerH + 4 + i * (rowH + rowGap);
        const pct = Math.round((item.score / 25) * 100);

        // Alternating row tint
        if (i % 2 === 0) {
          this.doc
            .roundedRect(panelX + 4, ry, panelW - 8, rowH, 3)
            .fill('#EFEFEF');
        }

        // Label
        this.doc
          .font(this.FONT_SORA_SEMIBOLD)
          .fontSize(8)
          .fillColor(CI_COLORS.DARK_TEXT)
          .text(item.label, panelX + 10, ry + 6, {
            width: panelW - 70,
            lineBreak: false,
          });

        // Pill badge  e.g. "84%"
        const pillW = 38;
        const pillH = 14;
        const pillX = panelX + panelW - pillW - 8;
        const pillY = ry + (rowH - pillH) / 2;
        this.doc
          .roundedRect(pillX, pillY, pillW, pillH, pillH / 2)
          .fill(pillBg);
        this.doc
          .font(this.FONT_SORA_BOLD)
          .fontSize(8)
          .fillColor('#FFFFFF')
          .text(`${pct}%`, pillX, pillY + 3, {
            width: pillW,
            align: 'center',
            lineBreak: false,
          });
      });
    };

    // Left — Strengths (indigo)
    drawPanel(
      x,
      '✦  Agile Strengths',
      strengths,
      CI_COLORS.INDIGO,
      CI_COLORS.INDIGO_MID,
      'All areas have growth potential',
    );

    // Right — Growth (green)
    drawPanel(
      x + panelW + gap,
      '↑  Growth Opportunities',
      growth,
      CI_COLORS.GREEN_DARK,
      CI_COLORS.GREEN,
      'All dimensions are strengths!',
    );

    this.doc.y = startY + totalH + 10;
  }

  private drawIndicatorRow(
    label: string,
    level: string,
    levelColor: string,
    score: number = 0,
    maxScore: number = 25,
  ): void {
    this.ensureSpace(24);
    const x = this.MARGIN_STD;
    const y = this.doc.y;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const labelWidth = 155;
    const badgeWidth = 70;
    const barX = x + labelWidth + 4;
    const barWidth = totalWidth - labelWidth - badgeWidth - 12;
    const barHeight = 10;
    const fillRatio = Math.min(1, Math.max(0, score / maxScore));
    const filledWidth = barWidth * fillRatio;

    // Label
    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(label, x, y + 1, { width: labelWidth, continued: false });

    // Background capsule
    this.doc
      .roundedRect(barX, y, barWidth, barHeight, 5)
      .fill(CI_COLORS.LIGHT_GRAY);

    // Filled capsule
    if (filledWidth > 0) {
      this.doc.roundedRect(barX, y, filledWidth, barHeight, 5).fill(levelColor);
    }

    // Level badge (rounded rect with text)
    const badgeX = barX + barWidth + 6;
    const badgeHeight = 14;
    const badgeY = y - 2;

    this.doc
      .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 7)
      .fill(levelColor);

    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7)
      .fillColor('#FFFFFF')
      .text(level, badgeX, badgeY + 3, {
        width: badgeWidth,
        align: 'center',
      });

    this.doc.y = y + 18;
  }

  /**
   * Draws a tile with a colored left accent bar, bold title, and description.
   */
  private drawAccentTile(
    title: string,
    description: string,
    accentColor: string,
  ): void {
    this.ensureSpace(36);

    const x = this.MARGIN_STD;
    const contentX = x + 10;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const innerWidth = width - 14;
    const tileY = this.doc.y;

    // Measure text heights
    this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(10);
    const titleHeight = this.doc.heightOfString(title, {
      width: innerWidth,
    });

    let descHeight = 0;
    if (description) {
      this.doc.font(this.FONT_REGULAR).fontSize(9);
      descHeight = this.doc.heightOfString(description, {
        width: innerWidth,
      });
    }

    const totalHeight = titleHeight + descHeight + 12;

    // Background
    this.doc
      .roundedRect(x, tileY, width, totalHeight, 3)
      .fill(
        accentColor === CI_COLORS.ACCENT_TEAL
          ? CI_COLORS.TILE_TEAL
          : CI_COLORS.TILE_BLUE,
      );

    // Left accent bar
    this.doc.roundedRect(x, tileY, 4, totalHeight, 2).fill(accentColor);

    // Title text
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(10)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(title, contentX, tileY + 6, { width: innerWidth });

    // Description text
    if (description) {
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(CI_COLORS.MEDIUM_TEXT)
        .text(description, contentX, tileY + 6 + titleHeight, {
          width: innerWidth,
        });
    }

    this.doc.y = tileY + totalHeight + 5;
  }

  // ════════════════════════════════════════════════════════════════
  // NEW DRAWING HELPERS FOR CONDITIONAL SECTIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * S1 helper: draws a personality archetype card with colored header,
   * superpower, risk area, and ideal environment.
   */
  private drawArchetypeCard(
    title: string,
    superpower: string,
    risk: string,
    environment: string,
    headerColor: string,
  ): void {
    const x = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const headerH = 28;
    const bodyPad = 10;
    const bodyLineH = 16;
    const bodyH = bodyPad * 2 + bodyLineH * 3;

    this.ensureSpace(headerH + bodyH + 10);
    const y = this.doc.y;

    // Header band
    this.doc.roundedRect(x, y, width, headerH, 4).fill(headerColor);

    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(13)
      .fillColor('#FFFFFF')
      .text(title, x + 12, y + 7, { width: width - 24 });

    // Body card
    const bodyY = y + headerH;
    this.doc
      .roundedRect(x, bodyY, width, bodyH, 4)
      .fillAndStroke(CI_COLORS.TILE_BLUE, '#E0E0E0');

    const rows = [
      { icon: '⚡', label: 'Superpower', value: superpower },
      { icon: '⚠', label: 'Risk Area', value: risk },
      { icon: '🌐', label: 'Environment', value: environment },
    ];

    rows.forEach((row, i) => {
      const ry = bodyY + bodyPad + i * bodyLineH;
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9)
        .fillColor(headerColor)
        .text(`${row.icon} ${row.label}:`, x + 12, ry, {
          width: 110,
          continued: false,
        });
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(row.value, x + 125, ry, {
          width: width - 140,
          continued: false,
        });
    });

    this.doc.y = bodyY + bodyH + 8;
  }

  /**
   * S2 helper: draws a balance scale showing two values as weighted bars on a fulcrum.
   */
  private drawBalanceScale(
    leftLabel: string,
    leftValue: number,
    rightLabel: string,
    rightValue: number,
  ): void {
    const x = this.MARGIN_STD;
    const width = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const totalH = 60;
    this.ensureSpace(totalH + 10);
    const y = this.doc.y;
    const midX = x + width / 2;
    const barWidth = width / 2 - 24;
    const barHeight = 16;
    const barY = y + 12;

    // Fulcrum triangle
    const triY = barY + barHeight + 4;
    this.doc
      .save()
      .moveTo(midX - 8, triY)
      .lineTo(midX + 8, triY)
      .lineTo(midX, triY + 10)
      .closePath()
      .fill(CI_COLORS.MEDIUM_TEXT);
    this.doc.restore();

    // Beam line
    this.doc
      .strokeColor(CI_COLORS.MEDIUM_TEXT)
      .lineWidth(1.5)
      .moveTo(x + 12, barY + barHeight)
      .lineTo(x + width - 12, barY + barHeight)
      .stroke();

    // Left bar
    const leftFill = (leftValue / 100) * barWidth;
    const leftBarX = midX - 12 - barWidth;
    this.doc
      .roundedRect(leftBarX, barY, barWidth, barHeight, 4)
      .fill('#E0E0E0');
    if (leftFill > 0) {
      this.doc
        .roundedRect(
          leftBarX + barWidth - leftFill,
          barY,
          leftFill,
          barHeight,
          4,
        )
        .fill(CI_COLORS.ACCENT_TEAL);
    }
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(8)
      .fillColor('#FFFFFF')
      .text(`${leftValue}%`, leftBarX + barWidth - leftFill + 4, barY + 3, {
        width: leftFill - 8 > 0 ? leftFill - 8 : 30,
      });
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(leftLabel, leftBarX, barY - 12, {
        width: barWidth,
        align: 'center',
      });

    // Right bar
    const rightFill = (rightValue / 100) * barWidth;
    const rightBarX = midX + 12;
    this.doc
      .roundedRect(rightBarX, barY, barWidth, barHeight, 4)
      .fill('#E0E0E0');
    if (rightFill > 0) {
      this.doc
        .roundedRect(rightBarX, barY, rightFill, barHeight, 4)
        .fill(CI_COLORS.SECTION_BLUE);
    }
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(8)
      .fillColor('#FFFFFF')
      .text(`${rightValue}%`, rightBarX + 4, barY + 3, {
        width: rightFill - 8 > 0 ? rightFill - 8 : 30,
      });
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(9)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(rightLabel, rightBarX, barY - 12, {
        width: barWidth,
        align: 'center',
      });

    this.doc.y = triY + 14;
  }

  /**
   * S3 helper: draws a 2×3 heatmap grid with color intensity based on score.
   */
  private drawSkillHeatmapGrid(
    skills: { label: string; value: number }[],
  ): void {
    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const cols = 3;
    const rows = 2;
    const cellW = (totalWidth - (cols - 1) * 6) / cols;
    const cellH = 44;
    const totalH = rows * cellH + (rows - 1) * 6;
    this.ensureSpace(totalH + 10);
    const startY = this.doc.y;

    skills.forEach((skill, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = x + col * (cellW + 6);
      const cy = startY + row * (cellH + 6);

      // Background color based on value
      let bgColor: string;
      let textColor: string;
      if (skill.value >= 75) {
        bgColor = CI_COLORS.INDIGO;
        textColor = '#FFFFFF';
      } else if (skill.value >= 50) {
        bgColor = CI_COLORS.INDIGO_MID;
        textColor = '#FFFFFF';
      } else {
        bgColor = CI_COLORS.INDIGO_PALE;
        textColor = CI_COLORS.DARK_TEXT;
      }

      this.doc.roundedRect(cx, cy, cellW, cellH, 6).fill(bgColor);

      const innerY = cy + (cellH - 14) / 2; // vertically center the text row

      // Label — left side
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor(textColor)
        .text(skill.label, cx + 10, innerY, {
          width: cellW - 20,
          lineBreak: false,
        });

      // Score — right side
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(13)
        .fillColor(textColor)
        .text(`${skill.value}%`, cx + 10, innerY - 1, {
          width: cellW - 26,
          align: 'right',
          lineBreak: false,
        });
    });

    this.doc.y = startY + totalH + 8;
  }

  /**
   * S5 helper: draws a 3-stage stress progression with connected arrows.
   */
  private drawStressProgression(
    stages: [string, string, string],
    color: string,
  ): void {
    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const stageW = (totalWidth - 30) / 3;
    const stageH = 36;
    this.ensureSpace(stageH + 30);
    const y = this.doc.y;

    // Stage labels above
    const stageLabels = ['Normal', 'Moderate', 'Elevated'];

    stages.forEach((stage, i) => {
      const sx = x + i * (stageW + 15);
      const opacity = 0.4 + i * 0.3; // 0.4, 0.7, 1.0

      // Box
      this.doc.save();
      this.doc.opacity(opacity);
      this.doc.roundedRect(sx, y, stageW, stageH, 6).fill(color);
      this.doc.restore();
      this.doc.opacity(1);

      // Stage label above
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(7)
        .fillColor(CI_COLORS.MEDIUM_TEXT)
        .text(stageLabels[i], sx, y - 10, {
          width: stageW,
          align: 'center',
        });

      // Stage text inside
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8)
        .fillColor('#FFFFFF')
        .text(stage, sx + 6, y + stageH / 2 - 5, {
          width: stageW - 12,
          align: 'center',
        });

      // Arrow between stages
      if (i < 2) {
        const arrowX = sx + stageW + 2;
        const arrowY = y + stageH / 2;
        this.doc
          .strokeColor(color)
          .lineWidth(1.5)
          .moveTo(arrowX, arrowY)
          .lineTo(arrowX + 11, arrowY)
          .stroke();
        // Arrowhead
        this.doc
          .save()
          .moveTo(arrowX + 11, arrowY - 3)
          .lineTo(arrowX + 14, arrowY)
          .lineTo(arrowX + 11, arrowY + 3)
          .closePath()
          .fill(color);
        this.doc.restore();
      }
    });

    this.doc.y = y + stageH + 12;
  }

  /**
   * S7 helper: draws concentric impact rings (donut arcs).
   */
  private drawImpactRings(
    rings: { label: string; value: number; color: string }[],
  ): void {
    const totalH = 180;
    this.ensureSpace(totalH + 10);

    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const centerX = x + totalWidth / 2;
    const y = this.doc.y;
    const centerY = y + totalH / 2;
    const maxRadius = 70;
    const ringThickness = 14;
    const gap = 4;

    rings.forEach((ring, i) => {
      const radius = maxRadius - i * (ringThickness + gap);
      const arcAngle = (ring.value / 100) * 360;
      const startAngle = -90; // Top
      const endAngle = startAngle + arcAngle;

      // Background ring (full circle, light)
      this.doc
        .circle(centerX, centerY, radius)
        .lineWidth(ringThickness)
        .strokeColor('#EEEEEE')
        .stroke();

      // Filled arc
      if (arcAngle > 0) {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Draw arc as a series of small line segments
        this.doc.save();
        this.doc.lineWidth(ringThickness).strokeColor(ring.color);

        const segments = Math.max(8, Math.round(arcAngle / 5));
        const angleStep = (endRad - startRad) / segments;

        this.doc.moveTo(
          centerX + radius * Math.cos(startRad),
          centerY + radius * Math.sin(startRad),
        );

        for (let s = 1; s <= segments; s++) {
          const angle = startRad + s * angleStep;
          const px = centerX + radius * Math.cos(angle);
          const py = centerY + radius * Math.sin(angle);
          if (s === 1) {
            this.doc.moveTo(
              centerX + radius * Math.cos(startRad),
              centerY + radius * Math.sin(startRad),
            );
          }
          this.doc.lineTo(px, py);
        }
        this.doc.stroke();
        this.doc.restore();
      }

      // Label to the right of the rings
      const labelX = centerX + maxRadius + 18;
      const labelY = centerY - maxRadius + i * 26 + 10;

      // Color dot
      this.doc.circle(labelX, labelY + 4, 4).fill(ring.color);

      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(`${ring.label}: ${ring.value}%`, labelX + 10, labelY, {
          width: 120,
        });
    });

    this.doc.y = y + totalH + 6;
  }
}
