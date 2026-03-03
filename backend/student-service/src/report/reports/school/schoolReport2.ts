import * as fs from "fs";
import { SchoolData, COLORS } from "../../types/types";
import { BaseReport } from "../BaseReport";
import { logger } from "../../helpers/logger";

// ─── STATIC DATA (Non-DISC Career Language) ────────────────────────────────

/** Maps two-letter trait combos to professional identity titles and descriptions */
const IDENTITY_MAP: Record<string, { title: string; description: string }> = {
    DC: {
        title: "Structured Strategic Performer",
        description:
            "This student naturally prefers clarity, defined systems, and logical decision-making environments. They perform best where expectations are clear, processes are structured, and outcomes are measurable. They evaluate, plan, and then execute with discipline.",
    },
    CD: {
        title: "Precision-Driven Strategist",
        description:
            "This student thrives in environments where quality standards are high and decisions are supported by evidence. They bring thoroughness and strategic thinking together, preferring to analyse before acting and holding themselves to exacting standards.",
    },
    DI: {
        title: "Adaptive Collaborative Driver",
        description:
            "This student combines a goal-oriented mindset with strong interpersonal energy. They take charge confidently while engaging others, and perform best in dynamic settings that reward initiative, persuasion, and visible results.",
    },
    ID: {
        title: "Expressive Initiative Leader",
        description:
            "This student leads through enthusiasm and social connection. They naturally rally people around ideas, communicate with energy, and thrive where creativity, collaboration, and rapid action intersect.",
    },
    DS: {
        title: "Resilient Operational Executor",
        description:
            "This student blends a drive for results with steady follow-through. They set clear targets and build practical processes to reach them, bringing determination and patience together in equal measure.",
    },
    SD: {
        title: "Dependable Performance Anchor",
        description:
            "This student brings reliability and quiet resolve to every environment. They follow systems faithfully, execute with discipline, and provide a stabilising force that others depend on during change.",
    },
    IS: {
        title: "Empathic Engagement Specialist",
        description:
            "This student creates trust and collaboration effortlessly. They sense team dynamics, build inclusive environments, and perform best where cooperation, empathy, and steady contribution are valued.",
    },
    SI: {
        title: "Supportive Team Catalyst",
        description:
            "This student combines warmth with cooperative energy, naturally encouraging others while maintaining steady output. They thrive in team-first environments that value harmony and shared achievement.",
    },
    IC: {
        title: "Creative Analytical Innovator",
        description:
            "This student brings a rare blend of imagination and logical rigour. They design thoughtful solutions, balance creativity with evidence, and perform best in environments that value both innovation and accuracy.",
    },
    CI: {
        title: "Methodical Creative Planner",
        description:
            "This student approaches creativity with discipline. They merge analytical depth with expressive communication, thriving where structured innovation and evidence-based storytelling are required.",
    },
    SC: {
        title: "Steady Quality Guardian",
        description:
            "This student values consistency, precision, and calm performance. They maintain high standards through patience and systematic work, excelling in environments that reward reliability and thoroughness.",
    },
    CS: {
        title: "Careful Stability Architect",
        description:
            "This student brings order and meticulous care to every project. They prefer predictable environments with clear processes, and their attention to detail ensures that standards are never compromised.",
    },
};

/** Maps each trait letter to career-relevant strength labels + short descriptions */
const STRENGTH_MAP: Record<string, { label: string; desc: string }[]> = {
    D: [
        {
            label: "Goal-Driven Decision Making",
            desc: "Maintains focus on measurable results and defined objectives.",
        },
        {
            label: "Strategic Execution Authority",
            desc: "Comfortable taking ownership and driving outcomes independently.",
        },
        {
            label: "Rapid Problem Resolution",
            desc: "Cuts through ambiguity and delivers solutions under pressure.",
        },
    ],
    I: [
        {
            label: "Collaborative Influence",
            desc: "Strong ability to rally teams and build consensus around ideas.",
        },
        {
            label: "Adaptive Communication",
            desc: "Adjusts messaging instinctively to engage diverse audiences.",
        },
        {
            label: "Creative Solution Design",
            desc: "Generates fresh approaches and inspires innovative thinking.",
        },
    ],
    S: [
        {
            label: "Consistency & Reliability",
            desc: "Demonstrates dependable performance under structured expectations.",
        },
        {
            label: "Team Cohesion Building",
            desc: "Fosters trust and psychological safety within groups.",
        },
        {
            label: "Sustained Task Commitment",
            desc: "Maintains steady effort over extended timelines without burnout.",
        },
    ],
    C: [
        {
            label: "Analytical Accuracy",
            desc: "Strong ability to evaluate information carefully and make data-driven decisions.",
        },
        {
            label: "Structured Execution Discipline",
            desc: "Performs consistently in environments that require procedure adherence.",
        },
        {
            label: "Strategic Planning Orientation",
            desc: "Comfortable setting goals and aligning resources for long-term outcomes.",
        },
    ],
};

/** Maps each trait letter to positive development opportunity descriptions */
const DEVELOPMENT_MAP: Record<string, { label: string; desc: string }[]> = {
    D: [
        {
            label: "Emotional Flexibility",
            desc: "May benefit from adapting communication tone based on audience sensitivity.",
        },
        {
            label: "Delegation Comfort",
            desc: "Should gradually build confidence in sharing control and trusting team execution.",
        },
    ],
    I: [
        {
            label: "Sustained Focus Depth",
            desc: "Can strengthen performance by completing deep-work cycles without distraction.",
        },
        {
            label: "Detail Verification",
            desc: "May benefit from building routine checks before finalising deliverables.",
        },
    ],
    S: [
        {
            label: "Spontaneous Adaptability",
            desc: "Can strengthen performance in rapidly changing or ambiguous environments.",
        },
        {
            label: "Social Influence Confidence",
            desc: "May need to express ideas more assertively in collaborative discussions.",
        },
    ],
    C: [
        {
            label: "Pace Flexibility",
            desc: "May benefit from releasing work incrementally rather than waiting for perfection.",
        },
        {
            label: "Interpersonal Warmth",
            desc: "Can strengthen impact by adding informal, empathetic elements to communication.",
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
            { name: "Engineering & Robotics", score: 95 },
            { name: "Data & Systems Management", score: 90 },
            { name: "Governance & Compliance", score: 85 },
            { name: "Research & Structured Technology", score: 80 },
            { name: "Risk & Strategic Planning", score: 75 },
        ],
        automationRisk:
            "Low risk in analytical and strategic domains. Higher risk only in repetitive, low-decision roles.",
    },
    CD: {
        domains: [
            { name: "Quality Assurance & Standards", score: 95 },
            { name: "Financial Analysis & Auditing", score: 90 },
            { name: "Research & Development", score: 85 },
            { name: "Policy Design & Regulation", score: 80 },
            { name: "Data Science & Machine Learning", score: 78 },
        ],
        automationRisk:
            "Low risk due to analytical depth. Roles requiring human oversight remain resilient.",
    },
    DI: {
        domains: [
            { name: "Business Development & Sales", score: 92 },
            { name: "Product Management", score: 88 },
            { name: "Startup & Entrepreneurship", score: 85 },
            { name: "Marketing Strategy", score: 82 },
            { name: "Consulting & Advisory", score: 78 },
        ],
        automationRisk:
            "Low risk in leadership and relationship-driven roles. Higher risk only in transactional functions.",
    },
    ID: {
        domains: [
            { name: "Creative Direction & Content", score: 90 },
            { name: "Public Relations & Comms", score: 88 },
            { name: "Brand Management", score: 85 },
            { name: "Event & Experience Design", score: 80 },
            { name: "Media Production", score: 76 },
        ],
        automationRisk:
            "Low risk in creative and people-facing domains. AI augments but does not replace persuasive leadership.",
    },
    DS: {
        domains: [
            { name: "Operations Management", score: 94 },
            { name: "Project & Program Management", score: 90 },
            { name: "Supply Chain & Logistics", score: 86 },
            { name: "Construction & Infrastructure", score: 82 },
            { name: "Defence Strategy", score: 78 },
        ],
        automationRisk:
            "Low risk in operational leadership. Steady execution roles remain critical.",
    },
    SD: {
        domains: [
            { name: "Healthcare Administration", score: 92 },
            { name: "Education & Training", score: 88 },
            { name: "Facilities & Operations", score: 84 },
            { name: "Government & Public Service", score: 80 },
            { name: "Agricultural Management", score: 76 },
        ],
        automationRisk:
            "Low risk in service-oriented leadership. Human judgment remains indispensable.",
    },
    IS: {
        domains: [
            { name: "Human Resources & People Ops", score: 94 },
            { name: "Counselling & Social Work", score: 90 },
            { name: "Customer Success", score: 86 },
            { name: "Community Development", score: 82 },
            { name: "Teaching & Academic Mentoring", score: 78 },
        ],
        automationRisk:
            "Low risk in empathy-driven roles. Human connection is irreplaceable.",
    },
    SI: {
        domains: [
            { name: "Team Coordination", score: 90 },
            { name: "Patient Care & Allied Health", score: 88 },
            { name: "Hospitality & Guest Experience", score: 84 },
            { name: "Retail Management", score: 80 },
            { name: "Nonprofit Program Management", score: 76 },
        ],
        automationRisk:
            "Low risk in people-first service environments. Supportive roles require human presence.",
    },
    IC: {
        domains: [
            { name: "UX/UI Design & Research", score: 92 },
            { name: "Advertising & Creative Strategy", score: 88 },
            { name: "Architecture & Interior Design", score: 84 },
            { name: "Content Creation & Storytelling", score: 80 },
            { name: "Innovation Labs & R&D", score: 76 },
        ],
        automationRisk:
            "Low risk where human creativity meets analytical rigour. AI assists but does not replace design judgment.",
    },
    CI: {
        domains: [
            { name: "Technical Writing", score: 90 },
            { name: "Information Architecture", score: 86 },
            { name: "Product Design & Prototyping", score: 84 },
            { name: "Data Visualisation & Analytics", score: 80 },
            { name: "EdTech & Instructional Design", score: 76 },
        ],
        automationRisk:
            "Low risk in structured creative domains. Methodical innovation requires human oversight.",
    },
    SC: {
        domains: [
            { name: "Compliance & Regulatory Affairs", score: 92 },
            { name: "Laboratory Science", score: 88 },
            { name: "Archival & Library Science", score: 84 },
            { name: "Accounting & Financial Planning", score: 80 },
            { name: "Environmental Safety", score: 76 },
        ],
        automationRisk:
            "Low risk in precision-driven stability roles. Quality-focused work resists full automation.",
    },
    CS: {
        domains: [
            { name: "Software Quality Assurance", score: 92 },
            { name: "Pharmaceutical R&D", score: 88 },
            { name: "Legal Research", score: 84 },
            { name: "Actuarial Science", score: 80 },
            { name: "Clinical Data Management", score: 76 },
        ],
        automationRisk:
            "Low risk in detail-critical domains. Precision roles demand human verification.",
    },
};

// ─── COLORS ────────────────────────────────────────────────────────────────

// ── OriginBi Brand Palette ─────────────────────────────────────────────────
// Primary: Indigo #2c2a7d | Secondary: Green #4cb966
const CI_COLORS = {
    // Brand primaries
    INDIGO: "#2c2a7d", // base indigo — high values
    INDIGO_MID: "#4e4ba6", // medium shade
    INDIGO_LIGHT: "#9896cc", // light shade — low values / tracks
    INDIGO_PALE: "#e8e7f5", // very light — backgrounds / row stripes
    GREEN: "#4cb966", // base green — secondary / accent
    GREEN_DARK: "#2d8a45", // darker green
    GREEN_LIGHT: "#a8e0b3", // light green tint
    // Neutrals
    LIGHT_GRAY: "#F5F5F5",
    DARK_TEXT: "#1A1A1A",
    MEDIUM_TEXT: "#444444",
    // Semantic
    STRONG_GREEN: "#2d8a45",
    MODERATE_AMBER: "#C68A00",
    DEVELOPING_RED: "#D04A4A",
    // Kept for non-bar usage only
    SECTION_BLUE: "#2c2a7d", // alias for INDIGO
    ACCENT_GREEN: "#4cb966", // alias for GREEN
    ACCENT_TEAL: "#4e4ba6", // remapped to indigo-mid
    TEAL_LIGHT: "#e8e7f5", // remapped to indigo-pale
    TEAL_MID: "#9896cc", // remapped to indigo-light
    TILE_BLUE: "#e8e7f5",
    TILE_TEAL: "#e8e7f5",
    GAUGE_START: "#4cb966", // green start
    GAUGE_END: "#2c2a7d", // indigo end
    GAUGE_BG: "#e8e7f5",
    RADAR_FILL: "#9896cc",
    RADAR_STROKE: "#2c2a7d",
    RADAR_GRID: "#BCBEC0",
    BAR_BLUE: "#2c2a7d",
    BAR_GREEN: "#4cb966",
    BAR_TEAL: "#4e4ba6",
    BAR_PURPLE: "#2c2a7d",
    BAR_INDIGO: "#4e4ba6",
};

// Non-DISC axis labels for the behavioral radar
const BEHAVIOR_LABELS: Record<string, string> = {
    D: "Drive",
    I: "Expression",
    S: "Stability",
    C: "Precision",
};

// ─── PATTERN DETECTION TYPES ───────────────────────────────────────────────

interface ProfilePatterns {
    discType: "dominant" | "dual" | "balanced";
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
            title: "Strategic Driver",
            superpower: "Decisive action under pressure",
            risk: "May overlook team sentiment in pursuit of results",
            environment: "Competitive, fast-paced, outcome-driven",
        },
        secondary: {
            title: "Assertive Contributor",
            superpower: "Confident initiative in group settings",
            risk: "Can become impatient with slower processes",
            environment: "Project-based, target-oriented",
        },
    },
    I: {
        dominant: {
            title: "Dynamic Communicator",
            superpower: "Energising teams and building enthusiasm",
            risk: "May prioritise engagement over follow-through",
            environment: "Collaborative, creative, socially active",
        },
        secondary: {
            title: "Expressive Collaborator",
            superpower: "Building rapport and inspiring action",
            risk: "May struggle with sustained solo tasks",
            environment: "Team-based, interactive learning",
        },
    },
    S: {
        dominant: {
            title: "Steady Anchor",
            superpower: "Reliable consistency and calm under pressure",
            risk: "May resist necessary changes or new methods",
            environment: "Structured, predictable, supportive",
        },
        secondary: {
            title: "Supportive Stabiliser",
            superpower: "Creating trust and psychological safety",
            risk: "May avoid confrontation when needed",
            environment: "Team-oriented, routine-based",
        },
    },
    C: {
        dominant: {
            title: "Precision Architect",
            superpower: "Analytical depth and quality control",
            risk: "May delay action while seeking perfect data",
            environment: "Research-oriented, standard-driven, detail-rich",
        },
        secondary: {
            title: "Quality Analyst",
            superpower: "Systematic evaluation and process design",
            risk: "May over-analyse in time-sensitive situations",
            environment: "Data-centric, structured planning",
        },
    },
};

const DUAL_ARCHETYPE: Record<string, { title: string; description: string }> = {
    DC: {
        title: "Strategic Executor",
        description:
            "You combine decisiveness with structured thinking — a rare blend of action and precision.",
    },
    CD: {
        title: "Analytical Commander",
        description:
            "Your leadership style is analytical rather than impulsive.",
    },
    DI: {
        title: "Charismatic Driver",
        description:
            "You prefer taking charge while energising those around you.",
    },
    ID: {
        title: "Influential Initiator",
        description: "You lead through inspiration and bold action.",
    },
    DS: {
        title: "Resilient Operator",
        description: "You drive results with patient determination.",
    },
    SD: {
        title: "Steadfast Director",
        description: "You build systems while maintaining calm authority.",
    },
    IS: {
        title: "Empathetic Motivator",
        description: "You combine warmth with persuasive energy.",
    },
    SI: {
        title: "Harmonious Facilitator",
        description: "You build consensus through genuine care.",
    },
    IC: {
        title: "Creative Analyst",
        description: "You balance imagination with methodical evaluation.",
    },
    CI: {
        title: "Methodical Innovator",
        description: "You bring structure to creative problem-solving.",
    },
    SC: {
        title: "Reliable Perfectionist",
        description: "You combine steady commitment with quality focus.",
    },
    CS: {
        title: "Careful Maintainer",
        description: "You sustain high standards through disciplined patience.",
    },
};

// ─── TEXT VARIATIONS ───────────────────────────────────────────────────────

const TEXT_VARIATIONS: Record<string, string[]> = {
    "disc-dominant": [
        "You naturally take control in complex situations and prefer driving results rather than waiting for direction.",
        "You show a strong preference for leading decisions and influencing outcomes, often stepping forward in high-pressure moments.",
        "Your strong drive gives you an edge in competitive environments. Developing patience will multiply your leadership impact.",
    ],
    "disc-dual": [
        "You combine two strong capabilities that create a distinctive professional identity.",
        "Your profile blends complementary strengths that few others possess naturally.",
        "Your dual strengths position you uniquely — leveraging both will accelerate career growth.",
    ],
    "disc-balanced": [
        "You demonstrate adaptability across different environments without extreme behavioural shifts.",
        "You can comfortably adjust between leadership, collaboration, and analysis.",
        "Your flexibility makes you versatile. Developing deeper expertise in one area will amplify your impact.",
    ],
    "agile-assertive-risk": [
        "You are bold in expressing ideas, but strengthening listening skills will elevate your influence.",
        "You challenge situations confidently. Building empathy will increase long-term trust.",
        "Your confidence is powerful. Balancing it with patience will amplify impact.",
    ],
    "agile-execution-engine": [
        "You show consistency in completing tasks even under pressure.",
        "You don't just start strong — you sustain performance across the finish line.",
        "You convert ideas into measurable outcomes with reliable follow-through.",
    ],
    "agile-creative-instability": [
        "You generate ideas easily but may lose momentum in execution.",
        "Your creativity thrives in flexible environments. Structure will increase success rate.",
        "You adapt quickly, but consistency will turn potential into achievement.",
    ],
    "agile-balanced": [
        "Your agile competencies are balanced, showing well-rounded readiness for professional environments.",
        "You maintain consistent performance across all behavioural agility dimensions.",
        "Your even distribution of agile capabilities supports adaptable career growth.",
    ],
    "stress-assertive": [
        "Under pressure, your communication may become more direct and results-focused.",
        "In high-stakes moments, you may prioritise outcomes over relationship management.",
        "Stress can sharpen your decisiveness but may reduce diplomacy. Awareness is key.",
    ],
    "stress-overthink": [
        "You may delay decisions seeking more data when under pressure.",
        "Perfectionism can increase under uncertainty, slowing your response time.",
        "Stress may push you toward over-analysis. Setting decision deadlines helps.",
    ],
    "stress-withdrawal": [
        "Under pressure, you may become quieter and avoid confrontation.",
        "Stress may lead you to internalise concerns rather than voicing them.",
        "In difficult moments, building confidence to speak up will strengthen your resilience.",
    ],
    "stress-balanced": [
        "You manage pressure with a reasonably steady approach, without strong behavioural shifts.",
        "Under moderate stress, you maintain your typical work patterns and communication style.",
        "Your stress responses are relatively balanced, allowing consistent performance in most environments.",
    ],
    "academic-structured": [
        "You perform best with planned schedules and defined milestones.",
        "Structured revision timetables and detailed notes align with your natural approach.",
        "Clear deadlines and systematic preparation maximise your academic output.",
    ],
    "academic-collaborative": [
        "Interactive environments and discussion-based learning increase retention.",
        "Group projects, study circles, and presentation-based learning suit your style.",
        "You learn best when you can engage with peers and exchange perspectives.",
    ],
    "academic-self-paced": [
        "You prefer steady, self-paced study with consistent daily routines.",
        "Regular practice with familiar materials builds your confidence and mastery.",
        "You excel when given time to absorb content at your own speed.",
    ],
    "academic-competitive": [
        "You thrive in competitive academic settings with visible rankings and challenges.",
        "Mock tests, timed exercises, and performance benchmarks fuel your motivation.",
        "Goal-setting and progress tracking align naturally with your approach to learning.",
    ],
};

// ─── REPORT CLASS ──────────────────────────────────────────────────────────

/**
 * CareerIntelligenceReport Class
 * Generates the "Origin BI – Career Intelligence Summary" PDF page
 * with rich graphical visualizations.
 */
export class CareerIntelligenceReport extends BaseReport {
    private data: SchoolData;

    // Computed values
    private sortedTraits: { type: string; val: number }[] = [];
    private topTwo: string = "";
    private careerAlignmentIntensity: number = 0;
    private patterns!: ProfilePatterns;

    constructor(data: SchoolData, options?: PDFKit.PDFDocumentOptions) {
        super(options);
        this.data = data;
        this.computeTraits();
    }

    // ── Computation ────────────────────────────────────────────────

    private computeTraits(): void {
        const scores = [
            { type: "D", val: this.data.score_D },
            { type: "I", val: this.data.score_I },
            { type: "S", val: this.data.score_S },
            { type: "C", val: this.data.score_C },
        ];

        const PRIORITY = ["C", "D", "I", "S"];
        scores.sort((a, b) => {
            const diff = b.val - a.val;
            if (diff !== 0) return diff;
            return PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type);
        });

        this.sortedTraits = scores;
        this.topTwo = scores[0].type + scores[1].type;
        this.careerAlignmentIntensity = Math.min(
            15,
            Math.round((scores[0].val + scores[1].val) / 10),
        );
        this.detectPatterns();
    }

    private detectPatterns(): void {
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

        const top = this.sortedTraits[0];
        const second = this.sortedTraits[1];
        const gap = top.val - second.val;
        const vals = [D, I, S, C];
        const mean = vals.reduce((a, b) => a + b, 0) / 4;
        const stddev = Math.sqrt(
            vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 4,
        );

        let discType: "dominant" | "dual" | "balanced";
        if (top.val > 75 && gap > 10) discType = "dominant";
        else if (gap < 5 && top.val > 65 && second.val > 65) discType = "dual";
        else if (stddev < 8) discType = "balanced";
        else if (gap >= 5) discType = "dominant";
        else discType = "balanced";

        let agilePattern: string;
        if (nCourage > 70 && nRespect < 50) agilePattern = "assertive-risk";
        else if (nFocus > 70 && nCommitment > 70)
            agilePattern = "execution-engine";
        else if (nCommitment < 50 && nOpenness > 70)
            agilePattern = "creative-instability";
        else agilePattern = "balanced";

        const leadership = Math.round((D + nCourage) / 2);
        const collaboration = Math.round((S + nRespect) / 2);
        const innovation = Math.round((I + nOpenness) / 2);
        const analytical = Math.round((C + nFocus) / 2);
        const resilience = Math.round((D + nCommitment) / 2);
        const adaptability = Math.round((I + nOpenness) / 2);

        let stressType: string;
        if (D > 70 && S < 50) stressType = "assertive";
        else if (C > 70) stressType = "overthink";
        else if (S > 70 && D < 40) stressType = "withdrawal";
        else stressType = "balanced";

        let academicStyle: string;
        if (C > 65 && nFocus > 65) academicStyle = "structured";
        else if (I > 65 && nOpenness > 65) academicStyle = "collaborative";
        else if (S > 65 && nCommitment > 65) academicStyle = "self-paced";
        else if (D > 65 && nCourage > 65) academicStyle = "competitive";
        else academicStyle = "structured";

        const textVariant = (D + I + S + C) % 3;

        this.patterns = {
            discType,
            dominantTrait: discType === "dominant" ? top.type : undefined,
            dualTraits:
                discType === "dual" ? [top.type, second.type] : undefined,
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

    private tv(key: string): string {
        const variants = TEXT_VARIATIONS[key];
        if (!variants) return "";
        return variants[this.patterns.textVariant % variants.length];
    }

    // ── Main Generation ────────────────────────────────────────────

    public async generate(outputPath: string): Promise<void> {
        logger.info("[Career Intelligence] Starting PDF Generation...");
        const stream = fs.createWriteStream(outputPath);
        this.doc.pipe(stream);

        const streamFinished = new Promise<void>((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        this.generateCoverPage();

        // Setup background & margins
        this._currentBackground = "public/assets/images/Watermark_Background.jpg";
        this._useStdMargins = true;
        this.doc.addPage();

        // ── S1: Career Alignment Index + Gauge ──────────
        this.generateCareerAlignmentIndex();

        // ── S2: Behavioral Capability Radar ─────────────
        this.generateBehavioralRadar();

        // ── S3: Core Identity + Strengths Bars ──────────
        this.generateCoreIdentityAndStrengths();

        // ── S4: Development Acceleration Zones ──────────
        this.generateDevelopmentZones();

        // ── S5: Work Readiness Radar ────────────────────
        this.generateWorkReadinessRadar();

        // ── S6: Career Domain Compatibility Table ───────
        this.generateCareerDomainTable();

        // ════ NEW CONDITIONAL SECTIONS ═══════════════════
        this.generateCorePersonality();
        this.generateAgileMaturity();
        this.generateSkillHeatmap();
        this.generateCareerFit();
        this.generateStressBehavior();
        this.generateAcademicStrategy();
        this.generate360Impact();

        this.addFooters(this.data.exam_ref_no);
        this.doc.end();

        await streamFinished;
        logger.info(`[Career Intelligence] PDF generated at: ${outputPath}`);
    }

    // ════════════════════════════════════════════════════════════════
    // SECTION RENDERERS
    // ════════════════════════════════════════════════════════════════

    private generateCoverPage(): void {
        const bgPath = "public/assets/images/Cover_Background.jpg";
        if (fs.existsSync(bgPath))
            this.doc.image(bgPath, 0, 0, {
                width: this.PAGE_WIDTH,
                height: this.PAGE_HEIGHT,
            });
        else
            this.doc
                .rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT)
                .fill("#f0f0f0");

        // --- Title Wrapping ---
        const titleWidth = this.PAGE_WIDTH - 100;

        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(38)
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(this.data.report_title, 35, 30, {
                width: titleWidth,
                align: "left",
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
            .text("Self Guidance", 35, footerY);

        // Draw Date
        const dateString = new Date(this.data.exam_start).toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "long", year: "numeric" },
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
            align: "right" as const,
        };

        // 4. Calculate Height for "Bottom-Up" positioning
        // heightOfString handles the \n correctly
        const totalNameHeight = this.doc.heightOfString(nameText, nameOptions);
        const singleLineHeight = this.doc.heightOfString("M", nameOptions);

        // AdjustedY ensures the last line of text is always at nameBaseY
        const adjustedNameY = nameBaseY - (totalNameHeight - singleLineHeight);

        this.doc
            .fillColor(this.COLOR_DEEP_BLUE)
            .text(nameText, nameX, adjustedNameY, nameOptions);
    }

    private generatePageHeader(): void {
        const x = this.MARGIN_STD;

        this.renderTextBase("ORIGIN BI – CAREER INTELLIGENCE SUMMARY", {
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
            "en-GB",
            { day: "numeric", month: "long", year: "numeric" },
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

    private generateCareerAlignmentIndex(): void {
        this.ensureSpace(0.12, true);

        this.h1("Career Alignment Index");

        // Draw the visual gauge
        this.drawProgressGauge(
            this.careerAlignmentIntensity,
            15,
            `${this.careerAlignmentIntensity} / 15`,
        );

        this.doc.y += 8;

        // Interpretation text
        let interpretation: string;
        if (this.careerAlignmentIntensity >= 12) {
            interpretation =
                "This student demonstrates strong compatibility across structured, analytical, and strategic career pathways. The profile indicates multi-domain adaptability with particular strength in precision-oriented environments.";
        } else if (this.careerAlignmentIntensity >= 8) {
            interpretation =
                "This student shows solid career alignment across multiple professional domains. With focused development, the profile indicates strong potential for growth in both collaborative and independent work environments.";
        } else {
            interpretation =
                "This student's career profile is still developing across key domains. Targeted exposure to structured learning experiences and mentorship will accelerate alignment with high-impact career pathways.";
        }

        this.p(interpretation, { gap: 6 });
        this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
    }

    // ── S2: Behavioral Capability Radar ───────────────────────────

    private generateBehavioralRadar(): void {
        this.ensureSpace(0.45, true);

        this.h1("Behavioral Capability Profile");

        this.p(
            "An overview of core behavioral capabilities derived from assessment responses. Higher values indicate stronger natural orientation in that capability area.",
        );
        this.doc.moveDown(2);

        // Build radar data with non-DISC labels, scale to 0-10
        const radarData: { [key: string]: number } = {};
        radarData[BEHAVIOR_LABELS["D"]] = Math.round(
            (this.data.score_D / 100) * 10,
        );
        radarData[BEHAVIOR_LABELS["I"]] = Math.round(
            (this.data.score_I / 100) * 10,
        );
        radarData[BEHAVIOR_LABELS["S"]] = Math.round(
            (this.data.score_S / 100) * 10,
        );
        radarData[BEHAVIOR_LABELS["C"]] = Math.round(
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

    private generateCoreIdentityAndStrengths(): void {
        this.ensureSpace(0.3, true);

        this.h1("Core Behavioral Identity");

        const identity = IDENTITY_MAP[this.topTwo] || IDENTITY_MAP["DC"];

        this.h3(identity.title);

        this.p(identity.description);

        // ── Strength Intensity Bars ──
        this.h2("Top Strength Clusters");

        const top1 = this.sortedTraits[0];
        const top2 = this.sortedTraits[1];

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

    private generateDevelopmentZones(): void {
        this.ensureSpace(0.22, true);

        this.h2("Development Acceleration Zones");

        this.p(
            "Growth areas identified from your assessment profile. The bar shows your current capability level alongside the growth runway available.",
        );

        const bottom1 = this.sortedTraits[2];
        const bottom2 = this.sortedTraits[3];

        const devAreas: { label: string; desc: string; currentVal: number }[] =
            [
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
            this.drawGrowthMeter(
                index + 1,
                item.label,
                item.desc,
                item.currentVal,
            );
        });

        this.doc.moveDown(2);

        this.p("These are growth opportunities — not limitations.", {
            font: this.FONT_ITALIC,
            fontSize: 9,
            color: CI_COLORS.MEDIUM_TEXT,
            gap: 6,
            align: "center",
        });

        this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
    }

    // ── S5: Work Readiness Radar + Indicators ─────────────────────

    private generateWorkReadinessRadar(): void {
        this.ensureSpace(0.45, true);

        this.h2("Work Readiness Indicators");

        const agile = this.data.agile_scores?.[0];
        const commitment = agile?.commitment ?? 0;
        const focus = agile?.focus ?? 0;
        const openness = agile?.openness ?? 0;
        const respect = agile?.respect ?? 0;
        const courage = agile?.courage ?? 0;
        const total = commitment + focus + openness + respect + courage;

        // Draw Radar Chart for ACI values (scale 0-25 → 0-10)
        const aciRadar: { [key: string]: number } = {
            "Completion Reliability": Math.round((commitment / 25) * 10),
            "Task Focus": Math.round((focus / 25) * 10),
            Adaptability: Math.round((openness / 25) * 10),
            "Team Sensitivity": Math.round((respect / 25) * 10),
            "Decision Courage": Math.round((courage / 25) * 10),
        };

        this.doc.moveDown(2);

        this.drawRadarChart(aciRadar, {
            radius: 85,
            maxValue: 10,
            levels: 5,
            fontSize: 8,
            font: this.FONT_SORA_REGULAR,
            colorFill: "#4FC3F7",
            colorStroke: CI_COLORS.SECTION_BLUE,
            colorPoint: CI_COLORS.SECTION_BLUE,
            colorGrid: CI_COLORS.RADAR_GRID,
            colorText: CI_COLORS.DARK_TEXT,
        });

        this.doc.y += 10;

        // Qualitative summary bar
        const getLevel = (val: number): { label: string; color: string } => {
            if (val >= 19)
                return { label: "Strong", color: CI_COLORS.STRONG_GREEN };
            if (val >= 13)
                return { label: "Balanced", color: CI_COLORS.MODERATE_AMBER };
            return { label: "Developing", color: CI_COLORS.DEVELOPING_RED };
        };

        const indicators = [
            { label: "Completion Reliability", score: commitment },
            { label: "Task Focus Stability", score: focus },
            { label: "Adaptability to Change", score: openness },
            { label: "Team Sensitivity", score: respect },
            { label: "Decision Courage", score: courage },
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
            readinessLevel = "Advanced Track";
        } else if (total >= 65) {
            readinessLevel = "Developing Track";
        } else {
            readinessLevel = "Foundational Track";
        }

        this.h3(`Corporate Readiness Level: ${readinessLevel}`);

        let readinessDesc: string;
        if (readinessLevel === "Advanced Track") {
            readinessDesc =
                "This student is well-suited for responsibility-driven environments that value accuracy, accountability, and strategic thinking.";
        } else if (readinessLevel === "Developing Track") {
            readinessDesc =
                "This student shows growing readiness for professional environments. Continued practice in structured settings will accelerate their transition to leadership-ready performance.";
        } else {
            readinessDesc =
                "This student is building foundational work habits. Mentorship, structured routines, and incremental responsibility will support their progression.";
        }

        this.p(readinessDesc, { gap: 6 });
        this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
    }

    // ── S6: Career Domain Compatibility Table ─────────────────────

    private generateCareerDomainTable(): void {
        this.ensureSpace(0.25, true);

        this.h2("Future Role Direction");

        this.h3("Career domains ranked by behavioral compatibility:");

        const careerData =
            CAREER_DOMAIN_MAP[this.topTwo] || CAREER_DOMAIN_MAP["DC"];

        // Build table data
        const headers = ["Career Domain", "Compatibility", "Outlook"];
        const rows = careerData.domains.map((d) => {
            // Generate visual compatibility indicator
            const filledDots = Math.round(d.score / 20); // 0-5 dots
            const dots = "●".repeat(filledDots) + "○".repeat(5 - filledDots);
            const outlook =
                d.score >= 85
                    ? "Strong Fit"
                    : d.score >= 75
                      ? "Good Fit"
                      : "Developing";
            return [d.name, dots, outlook];
        });

        this.table(headers, rows, {
            width: this.PAGE_WIDTH - 2 * this.MARGIN_STD,
            colWidths: ["fill", 100, 90],
            cellPadding: 6,
            headerColor: CI_COLORS.SECTION_BLUE,
            headerTextColor: "#FFFFFF",
            headerFont: this.FONT_SORA_SEMIBOLD,
            headerFontSize: 9,
            headerAlign: ["left", "center", "center"],
            font: this.FONT_REGULAR,
            fontSize: 9,
            rowAlign: ["left", "center", "center"],
            rowColor: "#FFFFFF",
            alternateRowColor: CI_COLORS.TILE_BLUE,
            borderColor: "#E0E0E0",
            borderWidth: 0.5,
            gap: 6,
        });

        this.doc.y += 6;

        // Automation Risk
        this.renderTextBase("Automation Risk Outlook:", {
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

    private generateCorePersonality(): void {
        this.h2("Core Personality Profile");

        const p = this.patterns;

        if (p.discType === "dominant" && p.dominantTrait) {
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
            this.p(this.tv("disc-dominant"), { gap: 6 });
        } else if (p.discType === "dual" && p.dualTraits) {
            const key = p.dualTraits[0] + p.dualTraits[1];
            const dual = DUAL_ARCHETYPE[key] || DUAL_ARCHETYPE["DC"];
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
            this.p(this.tv("disc-dual"), { gap: 6 });
        } else {
            this.renderTextBase("Versatile Adaptive Profile", {
                font: this.FONT_SORA_BOLD,
                fontSize: 14,
                color: CI_COLORS.SECTION_BLUE,
                gap: 4,
            });
            this.p(this.tv("disc-balanced"), { gap: 6 });
        }

        this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
    }

    // ── S2: Agile Maturity Visualization ──────────────────────────

    private generateAgileMaturity(): void {
        this.h2("Agile Maturity Analysis");

        const agile = this.data.agile_scores?.[0];
        const norm = (v: number) => Math.min(100, Math.round((v / 25) * 100));
        const courage = norm(agile?.courage ?? 0);
        const respect = norm(agile?.respect ?? 0);
        const focus = norm(agile?.focus ?? 0);
        const commitment = norm(agile?.commitment ?? 0);
        const openness = norm(agile?.openness ?? 0);

        const p = this.patterns;
        const patternTitles: Record<string, string> = {
            "assertive-risk": "Assertive Risk Pattern",
            "execution-engine": "Execution Engine Profile",
            "creative-instability": "Creative Instability Pattern",
            balanced: "Balanced Agility Profile",
        };

        this.h3(patternTitles[p.agilePattern], {
            color: CI_COLORS.ACCENT_TEAL,
        });

        // Draw balance scale for the key pair
        if (p.agilePattern === "assertive-risk") {
            this.drawBalanceScale("Courage", courage, "Respect", respect);
        } else if (p.agilePattern === "execution-engine") {
            this.drawBalanceScale("Focus", focus, "Commitment", commitment);
        } else if (p.agilePattern === "creative-instability") {
            this.drawBalanceScale(
                "Openness",
                openness,
                "Commitment",
                commitment,
            );
        } else {
            // Balanced: show the most extreme pair
            const pairs = [
                { l: "Courage", lv: courage, r: "Respect", rv: respect },
                { l: "Focus", lv: focus, r: "Commitment", rv: commitment },
            ];
            const widest = pairs.sort(
                (a, b) => Math.abs(b.lv - b.rv) - Math.abs(a.lv - a.rv),
            )[0];
            this.drawBalanceScale(widest.l, widest.lv, widest.r, widest.rv);
        }

        this.p(this.tv(`agile-${p.agilePattern}`), { align: "center" });
    }

    // ── S3: Skill Heatmap ─────────────────────────────────────────

    private generateSkillHeatmap(): void {
        this.h2("Professiosnal Skill Heatmap");

        this.p(
            "Derived competency scores combining behavioural and agile assessment data. Darker blocks indicate stronger natural orientation.",
        );

        const p = this.patterns;
        const skills = [
            { label: "Leadership", value: p.leadership },
            { label: "Collaboration", value: p.collaboration },
            { label: "Innovation", value: p.innovation },
            { label: "Analytical", value: p.analytical },
            { label: "Resilience", value: p.resilience },
            { label: "Adaptability", value: p.adaptability },
        ];

        this.drawSkillHeatmapGrid(skills);

        // Add contextual text for extreme scores
        if (p.leadership > 75) {
            this.p(
                "★ " +
                    (TEXT_VARIATIONS["skill-leadership-high"]?.[
                        p.textVariant
                    ] ?? ""),
                {
                    color: CI_COLORS.STRONG_GREEN,
                    gap: 3,
                },
            );
        }
        if (p.collaboration < 50) {
            this.p(
                "△ " +
                    (TEXT_VARIATIONS["skill-collaboration-low"]?.[
                        p.textVariant
                    ] ?? ""),
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

    private generateCareerFit(): void {
        this.ensureSpace(0.16, true);

        this.h2("CAREER FIT ANALYSIS", {
            color: CI_COLORS.SECTION_BLUE,
            topGap: 6,
        });

        const p = this.patterns;
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
                label: "Engineering & Technology",
                score: Math.round((C + nFocus) / 2),
                condition: C > 65 && nFocus > 65,
            },
            {
                label: "Management & Leadership",
                score: Math.round((D + nCourage) / 2),
                condition: D > 65 && nCourage > 65,
            },
            {
                label: "Creative & Design",
                score: Math.round((I + nOpenness) / 2),
                condition: I > 65 && nOpenness > 65,
            },
            {
                label: "People & HR",
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

    private generateStressBehavior(): void {
        this.ensureSpace(0.14, true);

        this.h2("STRESS RESPONSE MODEL", {
            color: CI_COLORS.SECTION_BLUE,
            topGap: 6,
        });

        const p = this.patterns;
        const stressLabels: Record<
            string,
            { stages: [string, string, string]; color: string }
        > = {
            assertive: {
                stages: [
                    "Focused & Direct",
                    "Assertive & Impatient",
                    "Aggressive & Dismissive",
                ],
                color: CI_COLORS.DEVELOPING_RED,
            },
            overthink: {
                stages: [
                    "Analytical & Careful",
                    "Cautious & Hesitant",
                    "Paralysed by Detail",
                ],
                color: CI_COLORS.MODERATE_AMBER,
            },
            withdrawal: {
                stages: [
                    "Quiet & Observant",
                    "Reserved & Passive",
                    "Withdrawn & Disengaged",
                ],
                color: CI_COLORS.BAR_PURPLE,
            },
            balanced: {
                stages: [
                    "Calm & Steady",
                    "Mildly Reactive",
                    "Moderately Affected",
                ],
                color: CI_COLORS.BAR_TEAL,
            },
        };

        const stressInfo =
            stressLabels[p.stressType] || stressLabels["balanced"];
        this.drawStressProgression(stressInfo.stages, stressInfo.color);
        this.p(this.tv(`stress-${p.stressType}`), { gap: 6 });
        this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
    }

    // ── S6: Academic Strategy ─────────────────────────────────────

    private generateAcademicStrategy(): void {
        this.ensureSpace(0.12, true);

        this.h2("ACADEMIC STRATEGY PROFILE", {
            color: CI_COLORS.SECTION_BLUE,
            topGap: 6,
        });

        const styleTitles: Record<
            string,
            { title: string; techniques: string[] }
        > = {
            structured: {
                title: "Structured Learning Approach",
                techniques: [
                    "Detailed revision timetables with milestone tracking",
                    "Systematic note-taking and concept mapping",
                    "Regular self-assessment against defined benchmarks",
                ],
            },
            collaborative: {
                title: "Collaborative Learning Approach",
                techniques: [
                    "Group discussions and peer-teaching sessions",
                    "Presentation-based learning and debate",
                    "Interactive workshops and case study analysis",
                ],
            },
            "self-paced": {
                title: "Self-Paced Learning Approach",
                techniques: [
                    "Consistent daily study routines with fixed duration",
                    "Repetitive practice with familiar question formats",
                    "Incremental complexity progression over time",
                ],
            },
            competitive: {
                title: "Competitive Learning Approach",
                techniques: [
                    "Mock tests and timed exam simulations",
                    "Leaderboard-based study challenges",
                    "Goal-setting with visible progress metrics",
                ],
            },
        };

        const style =
            styleTitles[this.patterns.academicStyle] ||
            styleTitles["structured"];

        this.renderTextBase(style.title, {
            font: this.FONT_SORA_BOLD,
            fontSize: 12,
            color: CI_COLORS.ACCENT_TEAL,
            gap: 4,
        });

        this.p(this.tv(`academic-${this.patterns.academicStyle}`), {
            fontSize: 10,
            gap: 6,
        });

        this.renderTextBase("Recommended Techniques:", {
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

    private generate360Impact(): void {
        this.ensureSpace(0.3, true);

        this.h2("360° IMPACT ASSESSMENT", {
            color: CI_COLORS.SECTION_BLUE,
            topGap: 6,
        });

        this.p(
            "A holistic view of impact across personality, behavioural agility, and leadership dimensions.",
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
        const leadershipScore = this.patterns.leadership;

        this.drawImpactRings([
            {
                label: "Personality",
                value: personalityAvg,
                color: CI_COLORS.INDIGO,
            },
            {
                label: "Agility",
                value: agilityAvg,
                color: CI_COLORS.INDIGO_MID,
            },
            {
                label: "Leadership",
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
                "You maintain consistent performance across personality, behaviour, and collaboration.",
                { gap: 6 },
            );
        } else if (leadershipScore > personalityAvg + 10) {
            this.p(
                "You influence direction strongly, but strengthening emotional alignment will improve cohesion.",
                { gap: 6 },
            );
        } else {
            this.p(
                "Your profile shows distinct strengths across different dimensions. Targeted development will create more uniform impact.",
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
        this.doc
            .roundedRect(x, y, width, barHeight, 4)
            .fill(CI_COLORS.GAUGE_BG);

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
                .strokeColor("#FFFFFF")
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
            .fillColor("#FFFFFF")
            .text(label, x, y + 4, {
                width: Math.max(fillWidth, 80),
                align: "center",
            });

        // Scale labels below gauge
        this.doc
            .font(this.FONT_REGULAR)
            .fontSize(7)
            .fillColor(CI_COLORS.MEDIUM_TEXT);

        this.doc.text("0", x, y + barHeight + 3, {
            width: 20,
            align: "left",
        });
        this.doc.text(max.toString(), x + width - 20, y + barHeight + 3, {
            width: 20,
            align: "right",
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
                    align: "right",
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
                this.doc
                    .roundedRect(barX, y, barWidth, barHeight, radius)
                    .clip();
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
                .text(
                    `${Math.round(item.value)}%`,
                    barX + barWidth + 4,
                    y + 3,
                    { width: 35, align: "left" },
                );

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
            .fillColor("#FFFFFF")
            .text(stepNumber.toString(), badgeCenterX - 5, badgeCenterY - 5, {
                width: 10,
                align: "center",
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
            this.doc
                .roundedRect(barX, barY, filledWidth, barHeight, 4)
                .fill(grad);
            this.doc.restore();
        }

        // Current % label on bar
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(7)
            .fillColor("#FFFFFF")
            .text(`${Math.round(currentValue)}%`, barX + 4, barY + 2, {
                width: Math.max(filledWidth - 8, 30),
                align: "left",
            });

        // "Growth Potential" label on the remaining area
        if (remainingWidth > 60) {
            this.doc
                .font(this.FONT_ITALIC)
                .fontSize(7)
                .fillColor(CI_COLORS.ACCENT_TEAL)
                .text("Growth Potential", barX + filledWidth + 6, barY + 2, {
                    width: remainingWidth - 12,
                    align: "left",
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
                .fill("#F8F8FC");

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
                .fillColor("#FFFFFF")
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
                        .fill("#EFEFEF");
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
                    .fillColor("#FFFFFF")
                    .text(`${pct}%`, pillX, pillY + 3, {
                        width: pillW,
                        align: "center",
                        lineBreak: false,
                    });
            });
        };

        // Left — Strengths (indigo)
        drawPanel(
            x,
            "✦  Agile Strengths",
            strengths,
            CI_COLORS.INDIGO,
            CI_COLORS.INDIGO_MID,
            "All areas have growth potential",
        );

        // Right — Growth (green)
        drawPanel(
            x + panelW + gap,
            "↑  Growth Opportunities",
            growth,
            CI_COLORS.GREEN_DARK,
            CI_COLORS.GREEN,
            "All dimensions are strengths!",
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
            this.doc
                .roundedRect(barX, y, filledWidth, barHeight, 5)
                .fill(levelColor);
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
            .fillColor("#FFFFFF")
            .text(level, badgeX, badgeY + 3, {
                width: badgeWidth,
                align: "center",
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
            .fillColor("#FFFFFF")
            .text(title, x + 12, y + 7, { width: width - 24 });

        // Body card
        const bodyY = y + headerH;
        this.doc
            .roundedRect(x, bodyY, width, bodyH, 4)
            .fillAndStroke(CI_COLORS.TILE_BLUE, "#E0E0E0");

        const rows = [
            { icon: "⚡", label: "Superpower", value: superpower },
            { icon: "⚠", label: "Risk Area", value: risk },
            { icon: "🌐", label: "Environment", value: environment },
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
            .fill("#E0E0E0");
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
            .fillColor("#FFFFFF")
            .text(
                `${leftValue}%`,
                leftBarX + barWidth - leftFill + 4,
                barY + 3,
                {
                    width: leftFill - 8 > 0 ? leftFill - 8 : 30,
                },
            );
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(9)
            .fillColor(CI_COLORS.DARK_TEXT)
            .text(leftLabel, leftBarX, barY - 12, {
                width: barWidth,
                align: "center",
            });

        // Right bar
        const rightFill = (rightValue / 100) * barWidth;
        const rightBarX = midX + 12;
        this.doc
            .roundedRect(rightBarX, barY, barWidth, barHeight, 4)
            .fill("#E0E0E0");
        if (rightFill > 0) {
            this.doc
                .roundedRect(rightBarX, barY, rightFill, barHeight, 4)
                .fill(CI_COLORS.SECTION_BLUE);
        }
        this.doc
            .font(this.FONT_SORA_BOLD)
            .fontSize(8)
            .fillColor("#FFFFFF")
            .text(`${rightValue}%`, rightBarX + 4, barY + 3, {
                width: rightFill - 8 > 0 ? rightFill - 8 : 30,
            });
        this.doc
            .font(this.FONT_SORA_SEMIBOLD)
            .fontSize(9)
            .fillColor(CI_COLORS.DARK_TEXT)
            .text(rightLabel, rightBarX, barY - 12, {
                width: barWidth,
                align: "center",
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
                textColor = "#FFFFFF";
            } else if (skill.value >= 50) {
                bgColor = CI_COLORS.INDIGO_MID;
                textColor = "#FFFFFF";
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
                    align: "right",
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
        const stageLabels = ["Normal", "Moderate", "Elevated"];

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
                    align: "center",
                });

            // Stage text inside
            this.doc
                .font(this.FONT_SORA_SEMIBOLD)
                .fontSize(8)
                .fillColor("#FFFFFF")
                .text(stage, sx + 6, y + stageH / 2 - 5, {
                    width: stageW - 12,
                    align: "center",
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
                .strokeColor("#EEEEEE")
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
