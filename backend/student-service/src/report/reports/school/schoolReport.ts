/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import * as fs from 'fs';
import { SchoolData, AgileScore, COLORS } from '../../types/types';
import {
  BaseReport,
  FutureOutlookData,
  FutureOutlookOptions,
  StyledRow,
  TextAlignment,
} from '../BaseReport';
import {
  SSLC_TOC_CONTENT,
  HSC_TOC_CONTENT,
  SCHOOL_CONTENT,
  SCHOOL_DYNAMIC_CONTENT,
  SCHOOL_BLENDED_STYLE_MAPPING,
  WORD_SKETCH_DATA,
  DISCLAIMER_CONTENT,
  MAPPING,
  DISC_AGILE_CAREER_PACE,
  DiscAgileEntry,
  CAREER_ODYSSEY_ROADMAP,
  OdysseyNode,
  CI_COLORS,
  BEHAVIOR_LABELS,
  IDENTITY_MAP,
  STRENGTH_MAP,
  DEVELOPMENT_MAP,
  CAREER_DOMAIN_MAP,
  ProfilePatterns,
  ARCHETYPE_DATA,
  DUAL_ARCHETYPE,
  TEXT_VARIATIONS,
  STREAM_SELECTION_CONTENT,
  STREAM_ODYSSEY_ROADMAP,
} from './schoolConstants';
import {
  getCompatibilityMatrixDetails,
  CourseCompatibility,
} from '../../helpers/sqlHelper';
import {
  getTopCollegesForStudent,
  UniversityData,
} from '../../helpers/SchoolHelper';
import { ACI, ACI_SCORE, DISCLAIMER } from '../BaseConstants';
import { logger } from '../../helpers/logger';

export class SchoolReport extends BaseReport {
  private data: SchoolData;

  constructor(data: SchoolData, options?: PDFKit.PDFDocumentOptions) {
    super(options);
    this.data = data;
  }

  private ci_sortedTraits: { type: string; val: number }[] = [];
  private ci_topTwo: string = '';
  private ci_careerAlignmentIntensity: number = 0;
  private ci_patterns!: ProfilePatterns;

  // --- GENERATE REPORT ---
  /**
   * Orchestrates the complete creation of the School Report PDF.
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
    // this.ci_generateCoreIdentityAndStrengths();

    // 5. Nature Style Graph (Charts)
    this.generateNatureGraphSection();
    logger.info('[School REPORT] Nature Graph Section Generated.');

    // --- CI BEHAVIOR: Radar, Impact, Stress ---

    this.ci_generateBehavioralRadar();
    this.ci_generate360Impact();
    this.ci_generateStressBehavior();

    // --- CI PROFESSIONAL READINESS: Agile, Readiness, Skills ---

    this.ci_generateAgileMaturity();
    // this.ci_generateWorkReadinessRadar();
    this.ci_generateSkillHeatmap();

    // --- CI ACADEMICS: Setup for existing goals ---

    // this.ci_generateAcademicStrategy();

    // 6. Leadership Strengths - Business Vision

    this.generateAcademicCareerGoals();
    logger.info('[School REPORT] Academic Career Goals Generated.');

    // --- Branch: level-specific sections ---
    if (this.data.school_level_id === 1) {
      // SSLC (Class 10)
      this.generateSSLCSections();
    } else {
      // HSC (Class 11 / 12)
      await this.generateHSCSections();
    }
    this.generateWordSketchSection();

    // Disclaimer & Closing
    this.generateDisclaimerSection();
    logger.info('[School REPORT] Disclaimer Generated.');

    this.addFooters(this.data.exam_ref_no);
    this.doc.end();

    await streamFinished;
    logger.info(`[School REPORT] PDF generated successfully at: ${outputPath}`);
  }

  // --- GENERATE COVER PAGE ---
  /**
   * Generates the cover page of the report including title, reference number, and user name.
   */
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

  // --- GENERATE TABLE OF CONTENTS ---
  /**
   * Generates the dynamic table of contents mapping section titles to page numbers.
   */
  private generateTableOfContents(): void {
    const headerX = 15 * this.MM;
    const circleCenterX = 25 * this.MM;

    // Define the bottom limit (Page Height - Footer Margin)
    const bottomLimit = this.PAGE_HEIGHT - 30 * this.MM;

    // 1. Print Header on the first page
    this.h1('Table of Contents', { x: headerX, y: headerX });

    // Set the starting Y position for the first item
    let currentY = 45 * this.MM;

    const tocContent = this.data.school_level_id === 1 ? SSLC_TOC_CONTENT : HSC_TOC_CONTENT;

    // TOC items gap by TOC items count
    let tocItemsGap = 10;
    if (tocContent.length > 10 && tocContent.length < 13) {
      tocItemsGap = 8;
    } else if (tocContent.length >= 13) {
      tocItemsGap = 10;
    }

    tocContent.forEach((item, index) => {
      // 2. Check for overflow
      if (currentY > bottomLimit) {
        this.doc.addPage();

        // 3. Re-print the Header on the new page
        this.h1('Table of Contents', {
          x: headerX,
          y: headerX,
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

  // --- GENERATE INTRODUCTORY PAGES ---
  /**
   * Generates introductory content detailing the purpose, benefits, and usage of the report.
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

  // --- COMPUTE TRAITS ---
  /**
   * Computes and sorts DISC traits, determines top traits and career alignment intensity.
   */
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

  // --- GENERATE PERSONALIZED INSIGHTS ---
  /**
   * Renders personalized user insights such as general characteristics, strengths, and communication tips.
   */
  private generatePersonalizedInsights(): void {
    // most_answered_answer_type is an array of objects {ANSWER_TYPE, COUNT}
    const primaryType = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    )[0] as 'D' | 'I' | 'S' | 'C';
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
    this.h2('Nature Style Graph', { align: 'center' });
    const topTrait = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    )[0];
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
    this.h2(`Communication Tips for Connecting with ${this.data.full_name}`);
    this.h3(`How Others Can Best Communicate With ${this.data.full_name}`);
    this.pHtml(content.communication_desc);

    // Do's List
    this.p(`When communicating with ${this.data.full_name}, DO's`);
    this.list(content.communication_dos_list, {
      indent: 30,
      type: 'number',
    });
    this.doc.moveDown();

    // Communication - Should Not
    this.h3('What Others Should Avoid');
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

  // --- GENERATE NATURE GRAPH SECTION ---
  /**
   * Draws the Nature Style Graph and compares nature versus adapted behaviors visually.
   */
  private generateNatureGraphSection(): void {
    const topTrait = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    )[0];
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

  // --- GENERATE BEHAVIORAL RADAR ---
  /**
   * Generates a radar chart profiling core behavioral capabilities.
   */
  private ci_generateBehavioralRadar(): void {
    this.ensureSpace(0.45, true);

    this.h1('Behavioral Capability Profile');

    this.p(
      'An overview of core behavioral capabilities derived from your assessment responses. Higher values indicate stronger natural orientation in that capability area.',
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
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- GENERATE 360 IMPACT ---
  /**
   * Creates the 360 Impact Rings highlighting personality, agility, and leadership dimensions.
   */
  private ci_generate360Impact(): void {
    this.ensureSpace(0.3, true);

    this.h2('360° Impact Assessment');

    this.p(
      'A holistic view of impact across personality, behavioural agility, and leadership dimensions.',
      { gap: 6 },
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

    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- GENERATE STRESS BEHAVIOR ---
  /**
   * Illustrates the stress response model and progression for the profile pattern.
   */
  private ci_generateStressBehavior(): void {
    this.ensureSpace(0.14, true);

    this.h2('Stress Response Model', { topGap: 6 });

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
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- GENERATE AGILE MATURITY ---
  /**
   * Generates a visualization for Agile Maturity including pattern titles and balance scales.
   */
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
      'cautious-respect': 'Cautious Respect Pattern',
      'execution-engine': 'Execution Engine Profile',
      'steady-execution': 'Steady Execution Pattern',
      'creative-instability': 'Creative Instability Pattern',
      balanced: 'Balanced Agility Profile',
    };

    this.h3(patternTitles[p.agilePattern]);

    // Draw balance scale for the key pair
    if (p.agilePattern === 'assertive-risk' || p.agilePattern === 'cautious-respect') {
      this.drawBalanceScale('Courage', courage, 'Respect', respect);
    } else if (p.agilePattern === 'execution-engine') {
      this.drawBalanceScale('Focus', focus, 'Commitment', commitment);
    } else if (p.agilePattern === 'creative-instability' || p.agilePattern === 'steady-execution') {
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

  // --- GENERATE SKILL HEATMAP ---
  /**
   * Assesses and visualizes professional skill competencies in a colored heatmap format.
   */
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
    // if (p.leadership > 75) {
    //   this.p(
    //     '★ ' +
    //     (TEXT_VARIATIONS['skill-leadership-high']?.[p.textVariant] ?? ''),
    //     {
    //       color: CI_COLORS.STRONG_GREEN,
    //       gap: 3,
    //     },
    //   );
    // }
    // if (p.collaboration < 50) {
    //   this.p(
    //     '△ ' +
    //     (TEXT_VARIATIONS['skill-collaboration-low']?.[p.textVariant] ?? ''),
    //     {
    //       color: CI_COLORS.MODERATE_AMBER,
    //       gap: 3,
    //     },
    //   );
    // }

    this.doc.y += 4;
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- GENERATE ACADEMIC CAREER GOALS ---
  /**
   * Generates the Academic and Career Goals section mapping traits to elements, behaviors, and roles.
   */
  private generateAcademicCareerGoals(): void {
    const [primaryType, secondaryType] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const dominantTrait = primaryType + secondaryType;

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

    this.h2('Trait Mapping');

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
    this.generateRespondParameterTable(primaryType as 'D' | 'I' | 'S' | 'C');
  }

  // --- GENERATE SSLC SECTIONS ---
  /**
   * Orchestrates and renders SSLC specific sections such as Career Alignment, Flight Path, and Stream Odyssey.
   */
  private generateSSLCSections(): void {
    // 1. Career Alignment Index
    this.ci_generateCareerAlignmentIndex();

    // 2. Career Fit
    this.ci_generateCareerFit();

    // 3. Career Domain Table
    this.ci_generateCareerDomainTable();

    // 4. Career Flight Path
    try {
      this.generateCareerFlightPath();
      logger.info('[School REPORT][SSLC] Career Flight Path Generated.');
    } catch (err) {
      logger.warn('[School REPORT][SSLC] Career Flight Path skipped.', err);
    }

    // 5. Development Zones
    this.ci_generateDevelopmentZones();

    // 6. Future Pathways & Stream Odyssey (with inline top-6 course compatibility per stream)
    try {
      this.generateStreamSelectionIntro();

      // Pre-compute traits for compatibility bar colouring
      const topTwoTraits = this.getTopTwoTraits(
        this.data.most_answered_answer_type,
        this.data,
      );
      const traitCode = topTwoTraits[0] + topTwoTraits[1];

      const streamIdMap: Record<string, number> = {
        PCMB: 1, PCB: 2, PCM: 3, PCBZ: 4, Commerce: 5, Humanities: 6,
      };

      for (const streamKey of ['PCMB', 'PCB', 'PCM', 'PCBZ', 'Commerce', 'Humanities']) {
        // Stream content page + odyssey roadmap
        this.generateStreamSelectionContent(streamKey);
        this.generateStreamOdysseyRoadmap(streamKey);

        // Inline course compatibility — top 6 per department for this stream (SSLC threshold: 84)
        try {
          const SSLC_THRESHOLD = 86;
          const streamId = streamIdMap[streamKey];
          const allCourses = await getCompatibilityMatrixDetails(traitCode, streamId);

          // Group by department_name (preserving DB order), then keep top 6 per department
          const deptMap = new Map<string, typeof allCourses>();
          for (const course of allCourses) {
            const dept = course.department_name || 'General';
            if (!deptMap.has(dept)) deptMap.set(dept, []);
            deptMap.get(dept)!.push(course);
          }

          if (deptMap.size > 0) {
            this.h2('Compatible Courses for This Stream');
            this.pHtml('<b> How to read: </b>Bar colour shows trait alignment. Higher % means a stronger match - primary colour bars score ≥70%.');
            // Compact legend — shown once above all departments
            const DISC_COLORS: Record<string, string> = {
              D: '#D82A29', I: '#FEDD10', S: '#4FB965', C: '#01AADB',
            };
            const highTrait = topTwoTraits[0].toUpperCase();
            const lowTrait = topTwoTraits[1].toUpperCase();
            const highColor = DISC_COLORS[highTrait] || '#808080';
            const lowColor = DISC_COLORS[lowTrait] || '#808080';
            const lm = this._useStdMargins ? this.MARGIN_STD : 15 * this.MM;
            const circleR = 4;
            const legendY = this.doc.y + 1;

            // Swatch 1
            let cx = lm;
            this.doc.circle(cx + circleR, legendY + circleR, circleR).fillColor(highColor).fill();
            cx += circleR * 2 + 3;
            this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(7).fillColor('#333333')
              .text(`Primary trait — higher match (≥${SSLC_THRESHOLD}%)`, cx, legendY + 1, { continued: false });
            const w1 = this.doc.widthOfString(`Primary trait — higher match (≥${SSLC_THRESHOLD}%)`);
            cx += w1 + 14;

            // Swatch 2
            this.doc.circle(cx + circleR, legendY + circleR, circleR).fillColor(lowColor).fill();
            cx += circleR * 2 + 3;
            this.doc.font(this.FONT_SORA_REGULAR).fontSize(7).fillColor('#333333')
              .text(`Secondary trait — moderate match (<${SSLC_THRESHOLD}%)`, cx, legendY + 1, { continued: false });

            this.doc.y = legendY + circleR * 2 + 5;

            // Render each department separately with its own h3 heading
            const gridMargin = lm;
            for (const [deptName, deptCourses] of deptMap.entries()) {
              const top6 = deptCourses.slice(0, 6);
              this.h3(deptName);
              this.generateCourseCompatibilityTable(
                top6,
                topTwoTraits[0],
                topTwoTraits[1],
                true,
                gridMargin,
                this.doc.y,
                this.PAGE_WIDTH - 2 * gridMargin,
                SSLC_THRESHOLD,
              );
            }
          }
        } catch (err) {
          logger.warn(`[School REPORT][SSLC] Course Compatibility for ${streamKey} skipped.`, err);
        }
      }

      logger.info('[School REPORT][SSLC] Stream Selection & Odyssey Generated.');
    } catch (err) {
      logger.warn('[School REPORT][SSLC] Stream Odyssey skipped.', err);
    }
  }

  // --- GENERATE HSC SECTIONS ---
  /**
   * Orchestrates and renders HSC specific sections such as Course Compatibility and Reach Institutions.
   */
  private async generateHSCSections(): Promise<void> {
    // 1. Career Alignment Index
    this.ci_generateCareerAlignmentIndex();

    // 2. Career Fit
    this.ci_generateCareerFit();

    // 3. Career Domain Table
    this.ci_generateCareerDomainTable();

    const streamMap: Record<string, string> = {
      '1': 'PCMB',
      '2': 'PCB',
      '3': 'PCM',
      '4': 'PCBZ',
      '5': 'Commerce',
      '6': 'Humanities',
    };
    const streamKey = streamMap[String(this.data.school_stream_id)];

    // 5 Future Pathways
    try {
      if (streamKey) {
        this.generateStreamSelectionContent(streamKey);
        logger.info('[School REPORT][HSC] Future Pathways Generated.');
      }
    } catch (err) {
      logger.warn('[School REPORT][HSC] Future Pathways skipped.', err);
    }

    // 6. Career Odyssey Roadmap
    try {
      this.generateStreamOdysseyRoadmap(streamKey);
      logger.info('[School REPORT][HSC] Career Odyssey Roadmap Generated.');
    } catch (err) {
      logger.warn('[School REPORT][HSC] Career Odyssey Roadmap skipped.', err);
    }

    // 4. Course Compatibility Matrix
    try {
      await this.generateCourseCompatibility();
      logger.info('[School REPORT][HSC] Course Compatibility Generated.');
    } catch {
      logger.warn('[School REPORT][HSC] Course Compatibility skipped (DB unavailable).');
    }

    // 7. Your Reach Institutions
    try {
      await this.generateReachInstitutions();
      logger.info('[School REPORT][HSC] Reach Institutions Generated.');
    } catch (err) {
      logger.warn('[School REPORT][HSC] Reach Institutions skipped (DB unavailable).', err);
    }

    // 8. Career Flight Path
    try {
      this.generateCareerFlightPath();
      logger.info('[School REPORT][HSC] Career Flight Path Generated.');
    } catch (err) {
      logger.warn('[School REPORT][HSC] Career Flight Path skipped.', err);
    }

    // 9. Development Zones (Moved to the end for HSC)
    this.ci_generateDevelopmentZones();
  }

  // --- GENERATE WORD SKETCH SECTION ---
  /**
   * Generates the Nature Style - Word Sketch section with dynamic descriptions.
   */
  private generateWordSketchSection(): void {
    this.h2('Nature Style - Word Sketch');
    this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc);
    this.pHtml(SCHOOL_CONTENT.natural_style_work_sketch_desc_1);
    this.generateWordSketch();
  }

  // --- GENERATE DISCLAIMER SECTION ---
  /**
   * Generates the closing disclaimer, limitations, and indemnity sections for the report.
   */
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

  // --- GENERATE STREAM SELECTION INTRO ---
  /**
   * Renders the introductory explanations and motivation for choosing an academic stream.
   */
  private generateStreamSelectionIntro(): void {
    this.doc.addPage();
    this._useStdMargins = true;

    this.h1('Future Pathways: Stream Selection');

    this.h2('Choosing Your Stream: The Blueprint to Your Future');
    this.pHtml(
      'Transitioning to higher secondary education marks a crucial crossroads in your academic journey. The stream you select now is a foundational step that will help shape your college education, your career trajectory, and your future lifestyle.',
    );

    this.h2('It is Not Just About Subjects—It is About Your Identity');
    this.pHtml(
      'When choosing a stream for the 11th and 12th grades, it is helpful to look beyond the immediate syllabus and ask yourself: What kind of impact do I want to make? <br/>• Do you want to build the technology of tomorrow?<br/>• Are you driven to heal people and advance medical science?<br/>• Do you enjoy the dynamics of business, finance, and leadership?<br/>• Or are you passionate about understanding human behavior, law, and creative expression?',
    );
    this.pHtml(
      'Your natural interests and strengths are the best compass you have. When you align your studies with what you genuinely enjoy, building a highly successful career becomes a pursuit of purpose rather than just work.',
    );

    this.h2('Understanding Your Stream Options');
    this.pHtml(
      'To help you navigate this decision, the following section breaks down the complex landscape of college degrees into clear, easy-to-understand career pathways.',
    );
    this.pHtml(
      'On the upcoming pages, you will find a dedicated breakdown for each major academic stream. Every page will show you the core focus of that stream and the broad professional fields it unlocks for your future. You do not need to select an exact college degree today; the goal of this section is to help you confidently choose the broad direction you want to walk in.',
    );
    this.pHtml(
      'Keep an open mind and use the following breakdowns to explore what your future could look like based on the stream you select.',
    );
  }

  // --- GENERATE STREAM SELECTION CONTENT ---
  /**
   * Displays the core fields, vibes, and mapped degrees tailored to a specific stream selection.
   */
  private generateStreamSelectionContent(streamKey: string): void {
    const streamData = STREAM_SELECTION_CONTENT[streamKey];
    if (!streamData) {
      logger.warn(`[School REPORT] No stream data found for key: ${streamKey}`);
      return;
    }

    this.doc.addPage();
    this._useStdMargins = true;
    const margin = this.MARGIN_STD;

    // --- Top Banner ---
    // Title
    this.doc
      .font(this.FONT_SORA_BOLD)
      .fontSize(22)
      .fillColor(this.COLOR_DEEP_BLUE)
      .text(`${streamData.shortName}\n(${streamData.title})`, margin, margin, {
        width: this.PAGE_WIDTH - 2 * margin - 80, // Leave space for icon
      });

    // Icon Rendering
    const iconBaseY = margin;
    const iconBaseX = this.PAGE_WIDTH - margin - 60;
    const iconName =
      streamKey === 'Humanities'
        ? 'humanity.png'
        : `${streamKey.toLowerCase()}.png`;
    const iconPath = `public/assets/images/school/${iconName}`;

    if (fs.existsSync(iconPath)) {
      this.doc.image(iconPath, iconBaseX, iconBaseY, { width: 60, height: 60 });
      this.doc.moveDown(0.5);
    } else {
      // Fallback Placeholder
      this.doc
        .rect(iconBaseX, iconBaseY, 60, 60)
        .lineWidth(1)
        .strokeColor('#D3D3D3')
        .stroke();
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(8)
        .fillColor('#A0A0A0')
        .text('Icon Place-', iconBaseX, iconBaseY + 20, {
          width: 60,
          align: 'center',
        });
      this.doc.text('holder', iconBaseX, iconBaseY + 30, {
        width: 60,
        align: 'center',
      });
      this.doc.moveDown(2.5);
    }

    // --- // --- Vibe Box ---
    // const vibeBoxY = this.doc.y;

    // // We measure the text to adapt the box height
    // this.doc.font(this.FONT_SORA_REGULAR).fontSize(10);
    // const vibeTextHeight = this.doc.heightOfString(streamData.vibe, { width: this.PAGE_WIDTH - 2 * margin - 20 }) + 20;

    // this.doc
    //   .rect(margin, vibeBoxY, this.PAGE_WIDTH - 2 * margin, vibeTextHeight)
    //   .fillColor('#F4F7FB')
    //   .fill();

    // this.doc
    //   .fillColor(this.COLOR_BLACK)
    //   .text(streamData.vibe, margin + 10, vibeBoxY + 10, {
    //     width: this.PAGE_WIDTH - 2 * margin - 20,
    //     align: 'left',
    //   });
    this.p(streamData.vibe);

    // --- The 2x2 Card Grid ---
    this.doc.moveDown(0.5);
    const gridY = this.doc.y;
    const cardWidth = (this.PAGE_WIDTH - 2 * margin - 15) / 2; // 15 gap between cols

    // Pre-calculate needed heights for each card to normalize row heights
    const cardHeights = streamData.fields.map((field) => {
      let h = 15; // top padding

      this.doc.font(this.FONT_SORA_BOLD).fontSize(11);
      h += this.doc.heightOfString(field.name, { width: cardWidth - 50 });
      h += 5; // spacing below title

      this.doc.font(this.FONT_SORA_REGULAR).fontSize(9);
      h += this.doc.heightOfString(field.vibe, { width: cardWidth - 30 });
      h += 10; // spacing below vibe

      const degreesList = field.mappedDegrees
        .split(',')
        .map((d) => d.trim().replace(/\.$/, ''));
      degreesList.forEach((degree) => {
        // Bullet point text height, minimum roughly the icon height (6)
        h += Math.max(
          12,
          this.doc.heightOfString(degree, { width: cardWidth - 42 }),
        );
        h += 3; // spacing between bullets
      });

      h += 15; // bottom padding
      return h;
    });

    const rowHeights = [
      Math.max(cardHeights[0] || 0, cardHeights[1] || 0),
      Math.max(cardHeights[2] || 0, cardHeights[3] || 0),
    ];

    streamData.fields.forEach((field, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      const cardX = margin + col * (cardWidth + 15);
      const cardY = gridY + (row === 0 ? 0 : rowHeights[0] + 15);
      const cardHeight = rowHeights[row];

      // Card Background with simulated shadow border
      this.doc
        .roundedRect(cardX, cardY, cardWidth, cardHeight, 8)
        .lineWidth(0.5)
        .strokeColor('#E0E0E0')
        .fillColor('#FFFFFF')
        .fillAndStroke();

      this.doc
        .roundedRect(cardX + 1, cardY + 1, cardWidth, cardHeight, 8)
        .lineWidth(0.5)
        .strokeColor('#D0D0D0') // slightly darker for pseudo-shadow
        .stroke();

      // Card Inner Content Padding
      const innerX = cardX + 15;
      let currentCardY = cardY + 15;

      // Small Icon (Top Left)
      const fieldIconPath = field.icon
        ? `public/assets/images/school/${field.icon}`
        : null;
      if (fieldIconPath && fs.existsSync(fieldIconPath)) {
        this.doc.image(fieldIconPath, innerX, currentCardY, {
          width: 14,
          height: 14,
        });
      } else {
        // Fallback Icon Placeholder
        this.doc
          .circle(innerX + 7, currentCardY + 7, 7)
          .lineWidth(1)
          .strokeColor('#A0A0A0')
          .stroke();
      }

      // Field Name (Bold)
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(11)
        .fillColor(this.COLOR_DEEP_BLUE)
        .text(field.name, innerX + 22, currentCardY, {
          width: cardWidth - 40,
        });

      currentCardY = this.doc.y + 5;

      // Field Vibe (Regular/Italic)
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor('#4A4A4A')
        .text(field.vibe, innerX, currentCardY, {
          width: cardWidth - 30,
        });

      currentCardY = this.doc.y + 10;

      // Bulleted list of mapped degrees
      const degreesList = field.mappedDegrees
        .split(',')
        .map((d) => d.trim().replace(/\.$/, '')); // clean up list

      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor(this.COLOR_BLACK);

      degreesList.forEach((degree) => {
        // Draw Checkmark
        this.doc
          .circle(innerX + 4, currentCardY + 4, 4)
          .fillColor(this.COLOR_BRIGHT_GREEN)
          .fill();
        this.doc
          .moveTo(innerX + 2.5, currentCardY + 4)
          .lineTo(innerX + 4, currentCardY + 5.5)
          .lineTo(innerX + 6, currentCardY + 2.5)
          .lineWidth(1)
          .strokeColor('#FFFFFF')
          .stroke();

        this.doc
          .fillColor(this.COLOR_BLACK)
          .text(degree, innerX + 12, currentCardY, {
            width: cardWidth - 42,
          });

        currentCardY = this.doc.y + 3;
      });
    });

    // Bottom tracker spacing handling
    this.doc.y = gridY + rowHeights[0] + 15 + rowHeights[1] + 15 + 10;
  }

  // --- GENERATE STREAM ODYSSEY ROADMAP ---
  /**
   * Draws a dynamic winding roadmap graph with nodes illustrating the student's academic odyssey.
   */
  private generateStreamOdysseyRoadmap(streamKey: string): void {
    const streamOdyssey = STREAM_ODYSSEY_ROADMAP[streamKey];
    if (!streamOdyssey) {
      logger.warn(
        `[School REPORT] No stream odyssey data found for: ${streamKey}`,
      );
      return;
    }

    // this.doc.addPage();
    // this._useStdMargins = true;

    // --- Graph Properties ---
    const startX = this.MARGIN_STD + 60; // Increased to prevent first node's text from slipping past margin
    const endX = this.PAGE_WIDTH - this.MARGIN_STD - 80; // Increased to prevent last node's text from slipping past

    let amplitude = 30; // wave height
    const headerNeededSpace = 25;
    const DASHED_LINE_LENGTH = 18; // Fixed ~3 dashes (dash=3px, space=3px)

    // --- First pass: measure text extents to derive dynamic paddings ---
    // When subtitle text wraps, the graph shifts down slightly instead of shortening the dashed lines.
    let neededTopPadding = 0;
    let neededBottomPadding = 0;

    streamOdyssey.nodes.forEach(
      (node: { label: string; title: string; subtitle: string }, i: number) => {
        this.doc.font(this.FONT_SORA_BOLD).fontSize(9);
        const lH = this.doc.heightOfString(node.label, {
          width: 90,
          align: 'center',
        });
        this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8);
        const tH = this.doc.heightOfString(node.title, {
          width: 110,
          align: 'center',
        });
        this.doc.font(this.FONT_SORA_REGULAR).fontSize(7);
        const sH = this.doc.heightOfString(node.subtitle, {
          width: 110,
          align: 'center',
        });

        // Total extent from node center: circle radius + dashed line + gap + all text heights + spacing
        const totalExtent = 8 + DASHED_LINE_LENGTH + 2 + lH + 2 + tH + 2 + sH;
        const textAbove = i % 2 !== 0;
        const progress = i / (streamOdyssey.nodes.length - 1);
        const nodeYOff = Math.cos(progress * Math.PI * 2.5) * amplitude;

        if (textAbove) {
          // How much padding above the wave peak this node's text needs
          const needed = totalExtent - (nodeYOff + amplitude);
          neededTopPadding = Math.max(neededTopPadding, needed + 5);
        } else {
          // How much padding below the wave trough this node's text needs
          const needed = totalExtent - (amplitude - nodeYOff);
          neededBottomPadding = Math.max(neededBottomPadding, needed + 5);
        }
      },
    );

    // Use compact defaults as minimum, grow only when wrapped text demands more space
    let graphTopPadding = Math.max(35, neededTopPadding);
    let graphBottomPadding = Math.max(65, neededBottomPadding);

    const availableHeight = this.PAGE_HEIGHT - this.MARGIN_STD - this.doc.y;
    const fortyPercentSpace = 0.4 * this.PAGE_HEIGHT;

    // User requested rule: if at least 40% space is available, render as usual.
    // If not, reduce the scaling by 10%.
    if (availableHeight >= fortyPercentSpace) {
      // Render as usual — paddings already accommodate dynamic text heights
    } else {
      // Reduce scaling by 10%
      amplitude *= 0.9;
      graphTopPadding *= 0.9;
      graphBottomPadding *= 0.9;
    }

    // Since the path uses Math.cos over >1 periods, the exact bounds are always ±amplitude.
    const maxGraphY = amplitude;
    const minGraphY = -amplitude;

    const totalGraphHeight =
      maxGraphY - minGraphY + graphTopPadding + graphBottomPadding;
    const totalNeededSpace = headerNeededSpace + totalGraphHeight;

    // Ensure we have enough space for the WHOLE section, or move to next page to prevent
    // mid-drawing auto-pagination which breaks elements onto the next page.
    if (this.doc.y + totalNeededSpace > this.PAGE_HEIGHT - this.MARGIN_STD) {
      this.doc.addPage();
      // Reset scaling to normal for the new page
      amplitude = 30;
      graphTopPadding = Math.max(55, neededTopPadding);
      graphBottomPadding = Math.max(65, neededBottomPadding);
    }

    // NOW draw the header
    this.h3(`${streamOdyssey.tagline}`, { topGap: 0, ensureSpace: 0 });

    // The vertical center of the wave
    const startY = this.doc.y + graphTopPadding - minGraphY;

    // Draw the continuous winding wave path
    this.doc.save();
    this.doc
      .lineWidth(4)
      .strokeColor('#E8EAF6') // Light periwinkle/grey for path
      .lineJoin('round')
      .lineCap('round');

    this.doc.moveTo(startX, startY);

    // Draw smooth curve using bezier logic or small line segments
    const segments = 100;
    for (let j = 0; j <= segments; j++) {
      const p = j / segments;
      const x = startX + p * (endX - startX);
      const ang = p * Math.PI * 2.5;
      // Start from bottom means we want the first yOffset to be positive (down)
      // Math.cos(ang) starts at 1. If we multiply by amplitude, the wave starts at bottom.
      const y = startY + Math.cos(ang) * amplitude;

      if (j === 0) {
        this.doc.moveTo(x, y);
      } else {
        this.doc.lineTo(x, y);
      }
    }
    this.doc.stroke();
    this.doc.restore();

    // Draw Nodes and Text
    streamOdyssey.nodes.forEach((node, i) => {
      const progress = i / (streamOdyssey.nodes.length - 1);
      const nodeX = startX + progress * (endX - startX);
      const angle = progress * Math.PI * 2.5;
      const nodeYOffset = Math.cos(angle) * amplitude;
      const nodeY = startY + nodeYOffset;

      // Strictly alternate text placement for clarity
      const textAbove = i % 2 !== 0;

      // Calculate heights of the text blocks dynamically
      this.doc.font(this.FONT_SORA_BOLD).fontSize(9);
      const labelHeight = this.doc.heightOfString(node.label, {
        width: 90,
        align: 'center',
      });
      this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8);
      const titleHeight = this.doc.heightOfString(node.title, {
        width: 110,
        align: 'center',
      });
      this.doc.font(this.FONT_SORA_REGULAR).fontSize(7);
      const subtitleHeight = this.doc.heightOfString(node.subtitle, {
        width: 110,
        align: 'center',
      });

      let labelY: number,
        titleY: number,
        subtitleY: number,
        dashLineEndY: number;

      if (textAbove) {
        // Fixed dashed line upward from node circle edge
        dashLineEndY = nodeY - 8 - DASHED_LINE_LENGTH;
        // Text stacks above: subtitle closest to node, then title, then label on top
        subtitleY = dashLineEndY - 2 - subtitleHeight;
        titleY = subtitleY - 2 - titleHeight;
        labelY = titleY - 2 - labelHeight;
      } else {
        // Fixed dashed line downward from node circle edge
        dashLineEndY = nodeY + 8 + DASHED_LINE_LENGTH;
        // Text stacks below: label closest to node, then title, then subtitle
        labelY = dashLineEndY + 2;
        titleY = labelY + labelHeight + 2;
        subtitleY = titleY + titleHeight + 2;
      }

      this.doc
        .save()
        .lineWidth(1)
        .strokeColor('#A0AABF')
        .dash(3, { space: 3 })
        .moveTo(nodeX, nodeY + (textAbove ? -8 : 8))
        .lineTo(nodeX, dashLineEndY)
        .stroke()
        .restore();

      // Draw the circular node point
      this.doc
        .circle(nodeX, nodeY, 8)
        .fill(CI_COLORS.GREEN)
        .lineWidth(3)
        .strokeColor('#FFFFFF')
        .stroke();

      // Render Text Label (Year/Phase)
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(9)
        .fillColor(CI_COLORS.INDIGO)
        .text(node.label, nodeX - 45, labelY, {
          width: 90,
          align: 'center',
        });

      // Render Title
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8)
        .fillColor('#333333')
        .text(node.title, nodeX - 55, titleY, {
          width: 110,
          align: 'center',
        });

      // Render Subtitle
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(7)
        .fillColor('#666666')
        .text(node.subtitle, nodeX - 55, subtitleY, {
          width: 110,
          align: 'center',
        });
    });

    this.doc.y = startY + maxGraphY + graphBottomPadding + 20;
  }

  // --- GENERATE ACI ---
  /**
   * Calculates and draws the Agile Compatibility Index (ACI) scoring matrix.
   */
  private generateACI(): void {
    const contentBlock =
      ACI[
      this.getTopTwoTraits(
        this.data.most_answered_answer_type,
        this.data,
      ).join('')
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

    this.h2('Personalized Insight');
    this.pHtml(contentBlock.personalized_insight);
    this.ensureSpace(0.25, true);
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

  // --- GENERATE COURSE COMPATIBILITY ---
  /**
   * Fetches compatibility data for the stream and traits, then renders a comparison chart.
   */
  private async generateCourseCompatibility(): Promise<void> {
    // --- LAYOUT CUSTOMIZATION VARIABLES ---
    // Adjust these values to fine-tune the spacing in the matrix
    const GAP_BELOW_DEPT_TITLE_MM = 1; // Gap between the Department Name and its first row of courses
    const GAP_BETWEEN_DEPTS_MM = 2;   // Gap between the end of one department and the start of the next
    // --------------------------------------

    this.ensureSpace(0.5, true);
    this.h1('Course Compatibility Matrix');
    const topTwoTraits = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );

    // --- Color Legend ---
    // Explain what the two bar colors mean so students don't misread green as "better"
    {
      const DISC_COLORS: Record<string, string> = {
        D: '#D82A29',
        I: '#FEDD10',
        S: '#4FB965',
        C: '#01AADB',
      };
      const DISC_LABEL: Record<string, string> = {
        D: 'Dominant',
        I: 'Influential',
        S: 'Steady',
        C: 'Conscientious',
      };
      const highTrait = topTwoTraits[0].toUpperCase();
      const lowTrait = topTwoTraits[1].toUpperCase();
      const highColor = DISC_COLORS[highTrait] || '#808080';
      const lowColor = DISC_COLORS[lowTrait] || '#808080';
      const highLabel = DISC_LABEL[highTrait] || highTrait;
      const lowLabel = DISC_LABEL[lowTrait] || lowTrait;

      const legendMargin = this._useStdMargins ? this.MARGIN_STD : 15 * this.MM;
      const swatchSize = 8;
      const swatchGap = 4;    // gap between swatch and its label
      const itemGap = 16;   // gap between the two legend items
      const legendY = this.doc.y + 2;

      // "How to read:" prefix
      // this.doc
      //   .font(this.FONT_SORA_SEMIBOLD)
      //   .fontSize(7.5)
      //   .fillColor('#555555')
      //   .text('How to read: ', legendMargin, legendY, { continued: true })
      //   .font(this.FONT_SORA_REGULAR)
      //   .fillColor('#333333')
      //   .text('Bar colour shows trait alignment. Higher % means a stronger match — primary colour bars score ≥70%.', {
      //     continued: false,
      //     width: this.PAGE_WIDTH - 2 * legendMargin - 4,
      //   });

      this.pHtml('<b> How to read: </b>Bar colour shows trait alignment. Higher % means a stronger match - primary colour bars score ≥70%.');

      const labelY = this.doc.y + 4;

      // Item 1: high-trait circle swatch
      const circleR = swatchSize / 2; // radius
      let curX = legendMargin;
      this.doc
        .circle(curX + circleR, labelY + circleR, circleR)
        .fillColor(highColor)
        .fill();
      curX += swatchSize + swatchGap;
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(9)
        .fillColor('#333333')
        // .text(`${highLabel} trait — higher match (≥70%)`, curX, labelY + 1, { continued: false });
        .text(`Primary trait — higher match (≥70%)`, curX, labelY + 1, { continued: false });

      // Measure the first label width to place the second item next to it
      const firstLabelWidth = this.doc.widthOfString(`${highLabel} trait — higher match (≥70%)`);
      curX += firstLabelWidth + itemGap;

      // Item 2: low-trait circle swatch
      this.doc
        .circle(curX + circleR, labelY + circleR, circleR)
        .fillColor(lowColor)
        .fill();
      curX += swatchSize + swatchGap;
      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor('#333333')
        // .text(`${lowLabel} trait — moderate match (<70%)`, curX, labelY + 1, { continued: false });
        .text(`Secondary trait — moderate match (<70%)`, curX, labelY + 1, { continued: false });

      this.doc.y = labelY + swatchSize + 6;
    }
    // --- End Color Legend ---

    const data = await getCompatibilityMatrixDetails(
      topTwoTraits[0] + topTwoTraits[1],
      this.data.school_stream_id,
    );

    // Group courses by department_name
    const departmentMap = new Map<string, typeof data>();
    for (const item of data) {
      const dept = item.department_name || 'General';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, []);
      }
      departmentMap.get(dept)!.push(item);
    }

    const deptEntries = Array.from(departmentMap.entries());

    if (deptEntries.length > 0) {
      this.ensureSpace(0.5, true);

      const gridMargin = this._useStdMargins ? this.MARGIN_STD : 15 * this.MM;
      let currentY = this.doc.y;

      for (let i = 0; i < deptEntries.length; i++) {
        const [deptName, courses] = deptEntries[i];

        // Ensure space for header + at least one row of courses
        this.ensureSpace(15 * this.MM, false);
        currentY = this.doc.y;

        // Draw Department Header
        // this.doc
        //   .font(this.FONT_SORA_BOLD)
        //   .fontSize(11)
        //   .fillColor(this.COLOR_DEEP_BLUE)
        //   .text(deptName, gridMargin, currentY, { width: this.PAGE_WIDTH - 2 * gridMargin });
        this.h3(deptName);

        currentY = this.doc.y + GAP_BELOW_DEPT_TITLE_MM * this.MM;

        // Render the inner chart (it will handle its own 3-column layout and page breaks)
        this.generateCourseCompatibilityTable(
          courses, // pass all courses
          topTwoTraits[0],
          topTwoTraits[1],
          true,
          gridMargin,
          currentY,
          this.PAGE_WIDTH - 2 * gridMargin // full width available for the 3 columns
        );

        // Add spacing before the next department
        this.doc.y += GAP_BETWEEN_DEPTS_MM * this.MM;

        // Update currentY for the next header loop
        currentY = this.doc.y;
      }

      // Move cursor below the entire grid
      this.doc.x = gridMargin;
    }

    // Render description text once after all department charts
    this.ensureSpace(0.13, true);
    const desc =
      'The course compatibility chart you\u2019ve received is based on your unique personality Report results, aiming to highlight programs that align well with your strengths and traits. However, this is not a fixed or singular recommendation. Your personal interests, evolving passions, and exposure to different fields also play a crucial role in shaping the right career path for you. We\u2019ve combined your profile with real-time industry data to give you a future-oriented perspective. Please keep in mind that course trends and career opportunities can shift from year to year as the world continues to evolve-new fields emerge, and existing ones transform. Use this as a guide, not a rulebook, to explore and make informed choices about your educational journey.';

    this.doc
      .font(this.FONT_SORA_REGULAR)
      .fontSize(9)
      .fillColor('black')
      .text(desc, 15 * this.MM, this.doc.y, {
        width: this.PAGE_WIDTH - 30 * this.MM,
        align: 'left',
        lineGap: 2,
      });

    // this.doc.y =
    //   this.doc.y +
    //   this.doc.heightOfString(desc, {
    //     width: this.PAGE_WIDTH - 30 * this.MM,
    //   });
  }

  // --- Special Generators ---

  // --- GENERATE WORD SKETCH ---
  /**
   * Draws a Word Sketch table categorizing behavior attributes from Level 1 to 6.
   */
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

  // --- GENERATE RESPOND PARAMETER TABLE ---
  /**
   * Creates a response parameter table matching a dominant trait against management scenarios.
   */
  private generateRespondParameterTable(
    dominantType: 'D' | 'I' | 'S' | 'C',
  ): void {
    const contentBlock = SCHOOL_DYNAMIC_CONTENT[dominantType];

    const traitNames = {
      D: 'Dominance',
      I: 'Influence',
      S: 'Steadiness',
      C: 'Conscientiousness',
    };
    const traitName = traitNames[dominantType];

    // --- Table 1 ---
    const headers1 = [
      'Trait',
      'Conflict Management',
      'Change Management',
      'Team Dynamics',
    ];
    // contentBlock.respond_parameter_row indexes:
    // 0: Conflict Management
    // 1: Change Management
    // 2: Team Dynamics
    // 3: Communication
    // 4: Sustainability
    // 5: Social Responsibility
    const rowData1 = [[
      traitName,
      contentBlock.respond_parameter_row[0] || '',
      contentBlock.respond_parameter_row[1] || '',
      contentBlock.respond_parameter_row[2] || ''
    ]];

    this.ensureSpace(60);
    this.table(headers1, rowData1, {
      fontSize: 8,
      headerFontSize: 8,
      headerColor: '#D3D3D3',
      headerTextColor: '#000000',
      borderColor: '#000000',
      cellPadding: 5,
      colWidths: ['fit', 'fill', 'fill', 'fill'],
    });

    this.doc.moveDown();

    // --- Table 2 ---
    const headers2 = [
      'Trait',
      'Communication',
      'Sustainability',
      'Social Responsibility',
    ];
    const rowData2 = [[
      traitName,
      contentBlock.respond_parameter_row[3] || '',
      contentBlock.respond_parameter_row[4] || '',
      contentBlock.respond_parameter_row[5] || ''
    ]];

    this.ensureSpace(60);
    this.table(headers2, rowData2, {
      fontSize: 8,
      headerFontSize: 8,
      headerColor: '#D3D3D3',
      headerTextColor: '#000000',
      borderColor: '#000000',
      cellPadding: 5,
      colWidths: ['fit', 'fill', 'fill', 'fill'],
    });
  }

  // --- GENERATE FUTURE TECH PAGE ---
  /**
   * Instantiates a page detailing emerging tech areas relevant to the user for the 2027-2035 timeline.
   */
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
    const [t1, t2] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
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

  // --- GENERATE FUTURE OUTLOOK PAGE ---
  /**
   * Produces the Future Outlook page, providing broader industry forecasts.
   */
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
      .text(title, this.MARGIN_STD, this.doc.y);

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
    this.doc.moveDown(0.2);
    this.p(
      "Students should embrace curiosity and futuristic learning to prepare for roles that don't yet exist",
      { align: 'center', font: this.FONT_ITALIC, fontSize: 9 },
    );
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
  private generateCourseCompatibilityTable(
    data: any[],
    traitHigh: string,
    traitLow: string,
    skipDescription: boolean = false,
    leftX?: number,
    topY?: number,
    quadrantWidth?: number,
    colorThreshold: number = 70
  ): void {
    // --- 1. Layout Constants ---
    const isQuadrant = leftX !== undefined && topY !== undefined && quadrantWidth !== undefined;

    // Fallbacks for standard layout (if ever called without quad params)
    const margin = this._useStdMargins ? this.MARGIN_STD : 15 * this.MM;
    const chartLeft = leftX !== undefined ? leftX : 100 * this.MM;
    let chartTop = topY !== undefined ? topY : this.doc.y;

    const availableWidth = quadrantWidth || (this.PAGE_WIDTH - 2 * margin);
    const chartRight = leftX !== undefined ? leftX + availableWidth : this.PAGE_WIDTH - margin;

    // For Quadrant (now 3-column) mode:
    let textHeight = 4 * this.MM;
    let barHeight = 4 * this.MM;
    let barSpace = 2 * this.MM;
    let maxBarWidth = 90 * this.MM;

    // We'll calculate column parameters if in 3-col mode
    let cols = 1;
    let colGap = 0;

    if (isQuadrant) {
      cols = 3;
      colGap = 5 * this.MM;

      textHeight = 4.5 * this.MM;
      barHeight = 2.5 * this.MM;
      barSpace = 2.5 * this.MM;

      // Each column width
      const colWidth = (availableWidth - colGap * (cols - 1)) / cols;
      maxBarWidth = colWidth - 8 * this.MM; // leave room for percentage text
    }

    // Group height = text + bar + space for quadrant, or bar + space for standard
    const groupHeight = isQuadrant ? textHeight + barHeight + barSpace : barHeight + barSpace;

    // Calculate total height needed based on rows
    const numRows = isQuadrant ? Math.ceil(data.length / cols) : data.length;
    let chartHeight = numRows * groupHeight;
    const chartBottom = chartTop + chartHeight;

    // Ensure we have space on the page for the first row
    if (chartTop + groupHeight > this.PAGE_HEIGHT - 15 * this.MM) {
      this.doc.addPage();
      chartTop = this.MARGIN_STD;
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

    // --- 3. Draw Axes (Only for standard mode) ---
    if (!isQuadrant) {
      const axisWidth = 0.6;
      this.ensureSpace(0.4, true);
      this.doc.save();
      this.doc.lineWidth(axisWidth).strokeColor('black');

      // Y-Axis
      this.doc
        .moveTo(chartLeft, chartTop)
        .lineTo(chartLeft, chartBottom)
        .stroke();

      // X-Axis
      this.doc
        .moveTo(chartLeft - axisWidth / 2, chartBottom)
        .lineTo(chartRight, chartBottom)
        .stroke();

      // --- 4. Draw Grid and Ticks (50 to 100) ---
      this.doc.lineWidth(0.2);
      this.doc.font(this.FONT_SORA_REGULAR).fontSize(8).fillColor('black');

      for (let i = 50; i <= 100; i += 10) {
        const x = chartLeft + 2 * this.MM + ((i - 50) * maxBarWidth) / 50;

        // X-axis tick
        this.doc
          .moveTo(x, chartBottom)
          .lineTo(x, chartBottom + 2 * this.MM)
          .strokeColor('black')
          .stroke();

        this.doc.text(i.toString(), x - 5 * this.MM, chartBottom + 3 * this.MM, {
          width: 10 * this.MM,
          align: 'center',
        });
      }
      this.doc.restore();
    }

    // --- 5. Draw Bars ---
    let currentRowTop = chartTop;
    let maxRowHeight = 0;

    if (isQuadrant) {
      let currentRowY = chartTop;
      const colWidth = (availableWidth - colGap * (cols - 1)) / cols;

      for (let r = 0; r < data.length; r += cols) {
        const rowItems = data.slice(r, r + cols);

        // 1. Calculate the max text height for this row
        let maxTextHeightInRow = textHeight;
        this.doc.font(this.FONT_SORA_REGULAR).fontSize(7); // Must match drawing font/size

        rowItems.forEach((item) => {
          const height = this.doc.heightOfString(item.course_name, { width: colWidth });
          if (height > maxTextHeightInRow) maxTextHeightInRow = height;
        });

        // Expected total height for this row = maxTextHeight + barHeight + padding
        const expectedRowHeight = maxTextHeightInRow + barHeight + barSpace + 3 * this.MM;

        // 2. Check for page break for the whole row
        if (currentRowY + expectedRowHeight > this.PAGE_HEIGHT - 20 * this.MM) {
          this.doc.addPage();
          currentRowY = this.MARGIN_STD;
        }

        // 3. Draw items in this row
        rowItems.forEach((item, cIndex) => {
          const val = parseFloat(item.compatibility_percentage);
          const clampedVal = Math.max(50, Math.min(100, val));
          const barWidth = (maxBarWidth * (clampedVal - 50)) / 50;

          const useTrait = val >= colorThreshold ? colorHigh : colorLow;
          const barColor = Math.round(val) < colorThreshold ? (DISC_COLORS[colorLow] || '#808080') : (DISC_COLORS[colorHigh] || '#808080');

          const xOffset = chartLeft + cIndex * (colWidth + colGap);
          const yOffset = currentRowY;

          // D. Label (Above Bar)
          this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(7)
            .fillColor('#333333')
            .text(item.course_name, xOffset, yOffset, {
              width: colWidth,
              align: 'left',
            });

          // C. Draw Bar Rect (Below max text height of row)
          const barY = yOffset + maxTextHeightInRow + 1 * this.MM;

          if (barWidth > 0) {
            const radius = Math.min(barHeight / 2, barWidth / 2);
            this.doc
              .roundedRect(xOffset, barY, barWidth, barHeight, radius)
              .fillColor(barColor)
              .fill();
          }

          // E. Value Label (Right of Bar)
          this.doc
            .font(this.FONT_SORA_REGULAR)
            .fontSize(6)
            .fillColor('black')
            .text(`${val.toFixed(0)}%`, xOffset + barWidth + 2 * this.MM, barY - 0.5);
        });

        // 4. Update currentRowY for the next row
        currentRowY += expectedRowHeight;
      }
      maxRowHeight = currentRowY;

    } else {
      data.forEach((item, index) => {
        const val = parseFloat(item.compatibility_percentage);
        const clampedVal = Math.max(50, Math.min(100, val));
        const barWidth = (maxBarWidth * (clampedVal - 50)) / 50;

        const useTrait = val >= colorThreshold ? colorHigh : colorLow;
        const barColor = Math.round(val) < colorThreshold ? (DISC_COLORS[colorLow] || '#808080') : (DISC_COLORS[colorHigh] || '#808080');

        const y = chartTop + index * (barHeight + barSpace);
        const tickY = y + barHeight / 2;

        // A. Draw short horizontal black tick
        this.doc.save();
        this.doc.lineWidth(0.6).strokeColor('black');
        this.doc
          .moveTo(chartLeft, tickY)
          .lineTo(chartLeft + 2 * this.MM, tickY)
          .stroke();
        this.doc.restore();

        // C. Draw Bar Rect
        if (barWidth > 0) {
          const radius = Math.min(barHeight / 2, barWidth / 2);
          this.doc
            .roundedRect(chartLeft + 2 * this.MM, y, barWidth, barHeight, radius)
            .fillColor(barColor)
            .fill();
        }

        // D. Label (Left of Y Axis)
        this.doc
          .font(this.FONT_SORA_REGULAR)
          .fontSize(9)
          .fillColor('black')
          .text(item.course_name, 15 * this.MM, y - 1, {
            width: chartLeft - 19 * this.MM,
            align: 'right',
            height: barHeight,
          });

        // E. Value Label (Right of Bar)
        this.doc
          .font(this.FONT_SORA_REGULAR)
          .fontSize(9)
          .fillColor('black')
          .text(
            `${val.toFixed(0)}%`,
            chartLeft + 2 * this.MM + barWidth + 2 * this.MM,
            y - 1,
          );

        maxRowHeight = y + barHeight + barSpace;
      });
    }

    // Set the overall doc cursor past the drawn chart block
    if (isQuadrant) {
      this.doc.y = maxRowHeight + 5 * this.MM;
    } else {
      this.doc.y = maxRowHeight + 10 * this.MM;
    }

    // --- 7. Description Text (only if not skipped) ---
    if (!skipDescription) {
      const descY = this.doc.y + 6 * this.MM;
      const desc =
        'The course compatibility chart you\u2019ve received is based on your unique personality Report results, aiming to highlight programs that align well with your strengths and traits. However, this is not a fixed or singular recommendation. Your personal interests, evolving passions, and exposure to different fields also play a crucial role in shaping the right career path for you. We\u2019ve combined your profile with real-time industry data to give you a future-oriented perspective. Please keep in mind that course trends and career opportunities can shift from year to year as the world continues to evolve-new fields emerge, and existing ones transform. Use this as a guide, not a rulebook, to explore and make informed choices about your educational journey.';

      this.doc
        .font(this.FONT_SORA_REGULAR)
        .fontSize(9)
        .fillColor('black')
        .text(desc, 15 * this.MM, descY, {
          width: this.PAGE_WIDTH - 30 * this.MM,
          align: 'left',
          lineGap: 2,
        });

      this.doc.y =
        descY +
        this.doc.heightOfString(desc, {
          width: this.PAGE_WIDTH - 30 * this.MM,
        });
    }
  }

  /**
   * Renders the "Nature Elements" combo (e.g. Water + Earth) centered on the page.
   * Logic:
   * - Maps traits (D, I, S, C) to Elements (Fire, Water, Earth, Air).
   * - Renders Icons + Labels + Plus sign in a centered row.
   */
  private renderElementCombo(trait1: string, trait2: string): void {
    this.ensureSpace(0.13, true);
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
    // this.doc.moveDown(1);
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
    // Difference based thresholds to determine patterns more accurately than absolute cutoffs
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

  // --- S1: Career Alignment Index with Gauge ---

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
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S3: Core Identity + Strength Intensity Bars ---

  private ci_generateCoreIdentityAndStrengths(): void {
    this.ensureSpace(0.3, true);

    this.h1('Core Behavioral Identity');

    const identity = IDENTITY_MAP[this.ci_topTwo] || IDENTITY_MAP['DC'];

    this.h3(identity.title);

    this.p(identity.description);

    // --- Strength Intensity Bars ---
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

    // Draw horizontal bars - color based on the underlying trait score
    const barData = strengths.map((s) => ({
      label: s.label,
      value: s.value,
      color: getBarColor(s.value),
    }));

    this.drawHorizontalBars(barData);
    this.doc.y += 6;
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S4: Development Acceleration Zones ---

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

    this.p('These are growth opportunities - not limitations.', {
      font: this.FONT_ITALIC,
      fontSize: 9,
      color: CI_COLORS.MEDIUM_TEXT,
      gap: 6,
      align: 'center',
    });

    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S5: Work Readiness Radar + Indicators ---

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

    // --- Two-column Strength / Growth split ---
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
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S6: Career Domain Compatibility Table ---

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

  // --- NEW CONDITIONAL SECTION RENDERERS ---

  // --- S1: Core Personality Visualization ---

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

    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S4: Career Fit Variations ---

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
      { label: 'Engineering & Technology', score: Math.round((C + nFocus) / 2), condition: C > 65 && nFocus > 65, color: '' },
      { label: 'Management & Leadership', score: Math.round((D + nCourage) / 2), condition: D > 65 && nCourage > 65, color: '' },
      { label: 'Creative & Design', score: Math.round((I + nOpenness) / 2), condition: I > 65 && nOpenness > 65, color: '' },
      { label: 'People & HR', score: Math.round((S + nRespect) / 2), condition: S > 65 && nRespect > 65, color: '' },
    ];

    // --- Sort high → low ---
    fits.sort((a, b) => b.score - a.score);

    // --- Assign blue gradient: darkest for highest score, lightest for lowest ---
    const blueGradient = ['#150089', '#3A3CB5', '#6B80D4', '#9BB8ED'];
    fits.forEach((f, i) => { f.color = blueGradient[i]; });

    // --- Layout constants ---
    const labelFontSize = 9;
    const barHeight = 14;
    const barRadius = barHeight / 2;
    const rowGap = 8;
    const pctColW = 34; // fixed width for the "XX%" label on the right
    const x = this.MARGIN_STD;
    const totalW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;

    // Measure the widest label once so all bars share the same start edge.
    this.doc.font(this.FONT_REGULAR).fontSize(labelFontSize);
    const labelColW =
      Math.max(...fits.map((f) => this.doc.widthOfString(f.label))) + 10; // +10pt breathing room between label and bar

    const barX = x + labelColW;
    const barW = totalW - labelColW - pctColW - 4;

    this.ensureSpace(fits.length * (barHeight + rowGap) + 8);

    fits.forEach((f) => {
      const y = this.doc.y;
      const fillW = Math.max(0, barW * Math.min(1, f.score / 100));

      // Label - right-flush to the bar's left edge, single line
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(labelFontSize)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(f.label, x, y + 2, {
          width: labelColW - 10,
          align: 'right',
          lineBreak: false,
        });

      // Track (background capsule)
      this.doc
        .roundedRect(barX, y, barW, barHeight, barRadius)
        .fill(CI_COLORS.GAUGE_BG);

      // Filled portion - clipped so left edge stays rounded
      if (fillW > 0) {
        this.doc.save();
        this.doc.roundedRect(barX, y, barW, barHeight, barRadius).clip();
        this.doc
          .roundedRect(barX, y, fillW, barHeight, barRadius)
          .fill(f.color);
        this.doc.restore();
      }

      // Percentage label right of bar
      this.doc
        .font(this.FONT_SEMIBOLD)
        .fontSize(8)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(`${Math.round(f.score)}%`, barX + barW + 4, y + 3, {
          width: pctColW,
          align: 'left',
          lineBreak: false,
        });

      this.doc.y = y + barHeight + rowGap;
    });

    // Strong-fit callouts
    fits.forEach((f) => {
      if (f.condition) {
        this.p(`✓ ${f.label}: Strong Fit`, {
          color: CI_COLORS.STRONG_GREEN,
          gap: 2,
        });
      }
    });

    this.doc.y += 4;
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- S6: Academic Strategy ---

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
    // this.drawSectionDivider(CI_COLORS.LIGHT_GRAY);
  }

  // --- CUSTOM GRAPHICAL ELEMENT HELPERS ---

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

      // Label - right-aligned so it ends flush with the bar start
      this.doc
        .font(this.FONT_REGULAR)
        .fontSize(9)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(item.label, x, y + 2, {
          width: labelWidth,
          align: 'right',
          lineBreak: false,
        });

      // Background track - fully rounded
      this.doc
        .roundedRect(barX, y, barWidth, barHeight, radius)
        .fill(CI_COLORS.GAUGE_BG);

      // Filled portion - clip to the track shape so corners stay round
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

    // --- Numbered circle badge (filled teal) ---
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

    // --- Title ---
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(10)
      .fillColor(CI_COLORS.DARK_TEXT)
      .text(title, contentX, y + 2, {
        width: barWidth,
      });

    // --- Dual-tone growth bar ---
    const barY = y + 18;
    const fillRatio = Math.min(1, Math.max(0, currentValue / 100));
    const filledWidth = barWidth * fillRatio;
    const remainingWidth = barWidth - filledWidth;

    // Full background (growth runway) - light teal
    this.doc
      .roundedRect(barX, barY, barWidth, barHeight, 4)
      .fill(CI_COLORS.TEAL_LIGHT);

    // Current level (gradient teal fill) - clipped to track so corners round
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

    // --- Description ---
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
   *  LEFT  - "Agile Strengths"        (indigo panel, scores ≥ threshold)
   *  RIGHT - "Growth Opportunities"   (green panel,  scores < threshold)
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

    // Left - Strengths (indigo)
    drawPanel(
      x,
      '✦  Agile Strengths',
      strengths,
      CI_COLORS.INDIGO,
      CI_COLORS.INDIGO_MID,
      'All areas have growth potential',
    );

    // Right - Growth (green)
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

  // --- NEW DRAWING HELPERS FOR CONDITIONAL SECTIONS ---

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

      // Label - left side
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(10)
        .fillColor(textColor)
        .text(skill.label, cx + 10, innerY, {
          width: cellW - 20,
          lineBreak: false,
        });

      // Score - right side
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
   * Draws concentric impact rings (donut arcs) with:
   *  - Rounded end caps (circles at start + end of each filled arc)
   *  - Percentage label drawn inside the arc at its tip
   *  - Legend as a single horizontal row centered below the rings
   */
  private drawImpactRings(
    rings: { label: string; value: number; color: string }[],
  ): void {
    const ringDiameter = 160;
    const legendH = 24;
    const totalH = ringDiameter + legendH + 16;
    this.ensureSpace(totalH + 10);

    const x = this.MARGIN_STD;
    const totalWidth = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const centerX = x + totalWidth / 2;
    const y = this.doc.y;
    const centerY = y + ringDiameter / 2;
    const maxRadius = 68;
    const ringThickness = 13;
    const gap = 5;
    // Half-thickness used as the cap-circle radius
    const capR = ringThickness / 2;

    rings.forEach((ring, i) => {
      const radius = maxRadius - i * (ringThickness + gap);
      const pct = Math.min(100, Math.max(0, ring.value));
      const arcAngle = (pct / 100) * 360;
      const startAngle = -90; // 12 o'clock
      const endAngle = startAngle + arcAngle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // --- Background track (full circle) ---
      this.doc
        .circle(centerX, centerY, radius)
        .lineWidth(ringThickness)
        .strokeColor('#EEEEEE')
        .stroke();

      if (pct <= 0) return;

      // --- Filled arc (polyline approximation) ---
      this.doc.save();
      this.doc.lineWidth(ringThickness).strokeColor(ring.color);
      const segments = Math.max(12, Math.round(arcAngle / 3));
      const angleStep = (endRad - startRad) / segments;

      this.doc.moveTo(
        centerX + radius * Math.cos(startRad),
        centerY + radius * Math.sin(startRad),
      );
      for (let s = 1; s <= segments; s++) {
        const a = startRad + s * angleStep;
        this.doc.lineTo(
          centerX + radius * Math.cos(a),
          centerY + radius * Math.sin(a),
        );
      }
      this.doc.stroke();
      this.doc.restore();

      // --- Rounded cap: start (12 o'clock) ---
      const startCapX = centerX + radius * Math.cos(startRad);
      const startCapY = centerY + radius * Math.sin(startRad);
      this.doc.circle(startCapX, startCapY, capR).fill(ring.color);

      // --- Rounded cap: end (tip of arc) ---
      const endCapX = centerX + radius * Math.cos(endRad);
      const endCapY = centerY + radius * Math.sin(endRad);
      this.doc.circle(endCapX, endCapY, capR).fill(ring.color);

      // --- Curved text at the arc END, quadrant-aware ---
      // • Lower half (sin(endRad) ≥ 0): chars go clockwise, last char near end cap.
      // • Upper half (sin(endRad) < 0): chars reversed + counter-clockwise from end,
      //   rotation flipped by π so text is never upside-down.
      const labelText = `${Math.round(pct)}%`;
      const labelFontSize = 6.5;
      this.doc.font(this.FONT_SORA_BOLD).fontSize(labelFontSize);

      const charWidths = labelText
        .split('')
        .map((ch) => this.doc.widthOfString(ch));
      const totalLabelArc = charWidths.reduce((a, b) => a + b, 0);

      // Flip text in Q3 + Q4 (lower half of circle, sin > 0).
      // Q1/Q2 (upper half, sin ≤ 0) → standard clockwise rotation, readable.
      // Q3/Q4 (lower half, sin > 0) → flip: CCW + −π/2 rotation so text stays right-side-up.
      const isFlipped = Math.sin(endRad) > 0;

      // Chars always in normal order - CCW placement in the flipped zone naturally
      // reads left-to-right without reversing (% stays at arc tip).
      const drawChars = labelText.split('');
      const drawWidths = charWidths;

      // Anchor text right at the arc tip (endRad).
      //   Normal  (CW)  → start = endRad - totalSpan, so last char "%" lands at endRad
      //   Flipped (CCW) → start = endRad, so first char "5" is at the tip,
      //                    "%" ends up displaced CCW (leftward in page coords) = reads "55%"
      const arcLabelSpanRad = totalLabelArc / radius;
      let charAnglePos = isFlipped
        ? endRad // CCW from the arc tip
        : endRad - arcLabelSpanRad; // CW run ending at the arc tip
      const angleDir = isFlipped ? -1 : 1;

      drawChars.forEach((ch, ci) => {
        const cw = drawWidths[ci];
        // Centre angle for this character
        const charMidAngle = charAnglePos + angleDir * (cw / (2 * radius));
        const px = centerX + radius * Math.cos(charMidAngle);
        const py = centerY + radius * Math.sin(charMidAngle);

        // Tangent rotation:
        //   Normal  → clockwise  (+π/2)
        //   Flipped → counter-clockwise (−π/2) so text doesn't appear upside-down
        const rot = isFlipped
          ? charMidAngle - Math.PI / 2
          : charMidAngle + Math.PI / 2;

        this.doc.save();
        (this.doc as any).transform(
          Math.cos(rot),
          Math.sin(rot),
          -Math.sin(rot),
          Math.cos(rot),
          px,
          py,
        );
        this.doc
          .font(this.FONT_SORA_BOLD)
          .fontSize(labelFontSize)
          .fillColor('#FFFFFF')
          .text(ch, -cw / 2, -labelFontSize / 2, { lineBreak: false });
        this.doc.restore();

        charAnglePos += angleDir * (cw / radius);
      });
    });

    // --- Horizontal legend row below the rings ---
    const legendY = y + ringDiameter + 10;
    const dotR = 4;
    const itemGap = 32; // gap between items
    const dotTextGap = 6; // gap between dot and text

    // Measure total legend width to center it
    this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(8);
    const itemWidths = rings.map((ring) => {
      const txt = `${ring.label}: ${ring.value}%`;
      return dotR * 2 + dotTextGap + this.doc.widthOfString(txt);
    });
    const totalLegendW =
      itemWidths.reduce((a, b) => a + b, 0) + itemGap * (rings.length - 1);
    let legendX = centerX - totalLegendW / 2;

    rings.forEach((ring, i) => {
      const itemW = itemWidths[i];
      const dotCX = legendX + dotR;
      const dotCY = legendY + dotR;

      // Dot
      this.doc.circle(dotCX, dotCY, dotR).fill(ring.color);

      // Label
      this.doc
        .font(this.FONT_SORA_SEMIBOLD)
        .fontSize(8)
        .fillColor(CI_COLORS.DARK_TEXT)
        .text(
          `${ring.label}: ${ring.value}%`,
          legendX + dotR * 2 + dotTextGap,
          legendY,
          { lineBreak: false },
        );

      legendX += itemW + itemGap;
    });

    this.doc.y = legendY + dotR * 2 + 8;
  }

  // --- YOUR REACH INSTITUTIONS ---

  private async generateReachInstitutions(): Promise<void> {
    this.ensureSpace(0.5, true);

    this.h1('Your Reach Institutions');
    this.h2('College Compatibility Matrix');

    const topTwoTraits = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );
    const traitCode = topTwoTraits[0] + topTwoTraits[1];
    const primaryTrait = topTwoTraits[0];

    const traitParamMap: Record<
      string,
      { primary: string; secondary: string }
    > = {
      D: { primary: 'Graduation Outcomes (GO)', secondary: 'Perception (PR)' },
      I: {
        primary: 'Outreach & Inclusivity (OI)',
        secondary: 'Perception (PR)',
      },
      S: {
        primary: 'Teaching, Learning & Resources (TLR)',
        secondary: 'Outreach & Inclusivity (OI)',
      },
      C: {
        primary: 'Research & Professional Practice (RPC)',
        secondary: 'Teaching, Learning & Resources (TLR)',
      },
    };

    const params = traitParamMap[primaryTrait] ?? {
      primary: 'Overall Score',
      secondary: 'Rank',
    };

    const streamNames: Record<number, string> = {
      1: 'PCMB',
      2: 'PCB',
      3: 'PCM',
      4: 'PCBZ',
      5: 'Commerce / Management',
      6: 'Arts / Humanities',
    };

    const streamLabel = this.data.school_stream_id
      ? streamNames[this.data.school_stream_id] || 'Selected Stream'
      : 'All Streams (Science, Commerce and Arts)';

    this.pHtml(
      `Based on your Personality trait, the institutions below have been selected and ranked using <b>${params.primary} </b> as the primary parameter and <b>${params.secondary} </b> as the secondary parameter. ` +
      `Results are filtered for <b>${streamLabel} </b> and ordered by NIRF national rank after selection.`,
    );

    const colleges: UniversityData[] = await getTopCollegesForStudent(
      traitCode,
      this.data.school_stream_id,
    );

    if (colleges.length === 0) {
      this.p(
        'No institution data is currently available for your stream. Please check back later.',
      );
      return;
    }

    this.renderReachInstitutionsTable(colleges, primaryTrait);
  }

  private renderReachInstitutionsTable(
    colleges: UniversityData[],
    _primaryTrait: string,
  ): void {
    const headers = [
      'S.No',
      'Institution Name',
      'City',
      'State',
      'NIRF Score',
      'NIRF Rank',
    ];
    const tableOptions = {
      colWidths: ['fit', 'fill', 'fit', 'fit', 'fit', 'fit'] as (
        | 'fit'
        | 'fill'
        | number
      )[],
      fontSize: 8,
      headerFontSize: 8,
      headerColor: '#150089',
      headerTextColor: '#FFFFFF',
      borderColor: '#CCCCCC',
      borderWidth: 0.5,
      cellPadding: 5,
      mergeSupportedColumn: true,
      rowAlign: [
        'center',
        'left',
        'left',
        'left',
        'center',
        'center',
      ] as TextAlignment[],
    };

    const isSpecificStream =
      this.data.school_stream_id !== undefined &&
      this.data.school_stream_id !== null;
    let rows: ((string | number | null | undefined)[] | StyledRow)[];

    if (isSpecificStream) {
      // Group by the dynamically fetched department_name from the database
      // SQL already handles per-department limits and common backfill
      const grouped = new Map<string, UniversityData[]>();
      const groupOrder: string[] = [];

      for (const c of colleges) {
        const g = c.department_name || (c.school_group ?? 'OTHER').toUpperCase();
        if (!grouped.has(g)) {
          grouped.set(g, []);
          groupOrder.push(g);
        }
        grouped.get(g).push(c);
      }

      rows = [];
      for (const groupKey of groupOrder) {
        const group = grouped.get(groupKey);
        if (!group || group.length === 0) continue;

        // The subheader label will be the department name
        const label = groupKey;
        const subheader: StyledRow = {
          type: 'subheader',
          data: [label, label, label, label, label, label],
          fill: '#2c2a7d',
          color: '#FFFFFF',
          font: this.FONT_SORA_SEMIBOLD,
          fontSize: 8,
          align: 'left',
          isMergeable: true,
        };
        rows.push(subheader);
        group.forEach((c, idx) => {
          rows.push([
            String(idx + 1),
            c.name,
            c.city,
            c.state,
            c.score ? String(c.score) : 'N/A',
            c.rank ? String(c.rank) : 'N/A',
          ]);
        });
      }
    } else if (
      this.data.school_stream_id === undefined ||
      this.data.school_stream_id === null
    ) {
      const streamGroupOrder = [1, 2, 3, 4, 5, 6];
      const streamGroupLabels: Record<number, string> = {
        1: 'PCMB Institutions',
        2: 'PCB Institutions',
        3: 'PCM Institutions',
        4: 'PCBZ Institutions',
        5: 'Commerce Institutions',
        6: 'Humanities Institutions',
      };
      const groupedByStream = new Map<number, UniversityData[]>();
      for (const c of colleges) {
        const sid = c.school_stream_id;
        if (sid) {
          if (!groupedByStream.has(sid)) groupedByStream.set(sid, []);
          groupedByStream.get(sid).push(c);
        }
      }
      const populatedGroups = streamGroupOrder.filter((sid) => {
        const g = groupedByStream.get(sid);
        return g && g.length > 0;
      });
      const numGroups = populatedGroups.length;
      let limitPerGroup = 3;
      if (numGroups === 1) limitPerGroup = 10;
      else if (numGroups === 2) limitPerGroup = 5;
      else if (numGroups === 3 || numGroups === 4) limitPerGroup = 4;

      rows = [];
      for (const sid of streamGroupOrder) {
        let group = groupedByStream.get(sid);
        if (!group || group.length === 0) continue;

        group = group.slice(0, limitPerGroup);

        const label = streamGroupLabels[sid] ?? `Stream ${sid} Institutions`;
        const subheader: StyledRow = {
          type: 'subheader',
          data: [label, label, label, label, label, label],
          fill: '#2c2a7d',
          color: '#FFFFFF',
          font: this.FONT_SORA_SEMIBOLD,
          fontSize: 8,
          align: 'left',
          isMergeable: true,
        };
        rows.push(subheader);
        group.forEach((c, idx) => {
          rows.push([
            String(idx + 1),
            c.name,
            c.city,
            c.state,
            c.score ? String(c.score) : 'N/A',
            c.rank ? String(c.rank) : 'N/A',
          ]);
        });
      }
    }

    this.table(headers, rows, tableOptions);
    this.doc.moveDown(0.5);
    this.pHtml(
      '"Note: This list is based on objective, publicly available NIRF 2025 data. Rankings are subject to change. This does not constitute a guaranteed admission or a direct endorsement of any specific institution."',
      { fontSize: 8, font: this.FONT_ITALIC, align: 'center' },
    );
  }

  /**
   * Converts "ENGINEERING" → "Engineering"
   */
  private riTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // --- CAREER FLIGHT PATH VISUALISATION ---

  private generateCareerFlightPath(): void {
    this.ensureSpace(0.35, true);

    const [primaryTrait] = this.getTopTwoTraits(
      this.data.most_answered_answer_type,
      this.data,
    );

    const agile: AgileScore = this.data.agile_scores?.[0] ?? {
      focus: 0,
      courage: 0,
      respect: 0,
      openness: 0,
      commitment: 0,
    };

    const agileKeyMap: Record<string, keyof AgileScore> = {
      Commitment: 'commitment',
      Courage: 'courage',
      Focus: 'focus',
      Openness: 'openness',
      Respect: 'respect',
    };

    let topAgileValue = 'Commitment';
    let topAgileScore = -1;
    for (const [label, key] of Object.entries(agileKeyMap)) {
      const score = agile[key] ?? 0;
      if (score > topAgileScore) {
        topAgileScore = score;
        topAgileValue = label;
      }
    }

    const group = DISC_AGILE_CAREER_PACE[primaryTrait];
    const entry: DiscAgileEntry =
      group?.entries.find((e) => e.agileValue === topAgileValue) ??
      group?.entries[0];

    if (!entry) {
      logger.warn(
        '[School REPORT] No DISC-Agile entry found; skipping flight path.',
      );
      return;
    }

    this.h1('Career Flight Path');
    // this.h2(`${group.traitName} Personality × ${entry.agileValue} Agile Value`);

    this.pHtml(
      `Based on your personality trait and top Agile scrum value your career trajectory has been mapped below. ` +
      `The gauge shows how your combination accelerates your journey compared to the industry average.`,
    );

    const parsePace = (s: string): [number, number] => {
      const nums = s.match(/\d+/g)?.map(Number) ?? [0];
      return nums.length >= 2 ? [nums[0], nums[1]] : [nums[0], nums[0]];
    };
    const parseAvg = (s: string): number =>
      parseInt(s.match(/\d+/)?.[0] ?? '12', 10);

    const [paceStart, paceEnd] = parsePace(entry.predictedPace);
    const industryYear = parseAvg(entry.industryAvg);

    this.drawFlightPathGauge(paceStart, paceEnd, industryYear, entry);

    this.doc.y += 6;
    this.pHtml(
      `<b>Your Edge: </b>${entry.motivation}\n<b>Speed Bump - ${entry.challengeTitle}: </b>${entry.challengeDesc}`,
    );
  }

  private drawFlightPathGauge(
    _paceStart: number,
    paceEnd: number,
    industryYear: number,
    entry: DiscAgileEntry,
  ): void {
    const barX = this.MARGIN_STD;
    const barY = this.doc.y + 38;
    const barW = this.PAGE_WIDTH - 2 * this.MARGIN_STD;
    const barH = 18;
    const barRadius = barH / 2;
    const MAX_YEAR = Math.max(15, industryYear + 2);
    const toX = (yr: number) => barX + (yr / MAX_YEAR) * barW;

    const tickNums = [0, 5, 10, 15].filter((t) => t <= MAX_YEAR);
    if (!tickNums.includes(MAX_YEAR)) tickNums.push(MAX_YEAR);
    this.doc.save();
    this.doc.font(this.FONT_REGULAR).fontSize(7).fillColor('#555555');
    for (const yr of tickNums) {
      const tx = toX(yr);
      this.doc
        .moveTo(tx, barY + barH + 2)
        .lineTo(tx, barY + barH + 6)
        .strokeColor('#999999')
        .lineWidth(0.5)
        .stroke();
      this.doc.text(`${yr}y`, tx - 8, barY + barH + 8, {
        width: 16,
        align: 'center',
      });
    }
    this.doc.restore();

    const x1 = toX(0);
    const x2 = toX(paceEnd);
    const x3 = toX(industryYear);
    const x4 = toX(MAX_YEAR);

    const fillSlice = (fromX: number, toXVal: number, fill: string) => {
      if (toXVal <= fromX) return;
      this.doc.save();
      this.doc.roundedRect(barX, barY, barW, barH, barRadius).clip();
      this.doc.rect(fromX, barY, toXVal - fromX, barH).fill(fill);
      this.doc.restore();
    };

    fillSlice(x1, x2, '#4DB6AC');

    if (x3 > x2) {
      this.doc.save();
      this.doc.roundedRect(barX, barY, barW, barH, barRadius).clip();
      const grad = this.doc.linearGradient(x2, barY, x3, barY);
      grad.stop(0, '#4DB6AC');
      grad.stop(1, '#E8633A');
      this.doc.rect(x2, barY, x3 - x2, barH).fill(grad);
      this.doc.restore();
    }

    fillSlice(x3, x4, '#E8633A');

    const markerX = x2;
    const markerCY = barY - 2;
    const rocketPath = 'public/assets/images/rocket.png';
    if (fs.existsSync(rocketPath)) {
      this.doc.image(rocketPath, markerX - 12, markerCY - 22, {
        width: 24,
        height: 24,
      });
    } else {
      this.doc
        .circle(markerX, barY + barH / 2, 7)
        .fillAndStroke('#FFFFFF', '#4DB6AC');
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(5)
        .fillColor('#004D40')
        .text('YOU', markerX - 8, barY + barH / 2 - 3, {
          width: 16,
          align: 'center',
        });
    }

    const calloutBW = 130;
    const calloutBH = 30;
    const calloutBX = Math.min(
      Math.max(markerX - calloutBW / 2, barX),
      barX + barW - calloutBW,
    );
    const calloutBY = barY + barH + 24;
    const calloutBRadius = 5;
    this.doc
      .roundedRect(calloutBX, calloutBY, calloutBW, calloutBH, calloutBRadius)
      .fill('#2B6CB0');
    const tipX = markerX;
    this.doc
      .moveTo(tipX - 5, calloutBY)
      .lineTo(tipX + 5, calloutBY)
      .lineTo(tipX, calloutBY - 6)
      .fill('#2B6CB0');
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7)
      .fillColor('#FFFFFF')
      .text(
        `Your Predicted Pace: ${entry.predictedPace}`,
        calloutBX + 6,
        calloutBY + 5,
        { width: calloutBW - 12, align: 'center' },
      );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7)
      .fillColor('#DBEAFE')
      .text('Years to Senior Management', calloutBX + 6, calloutBY + 16, {
        width: calloutBW - 12,
        align: 'center',
      });

    const industryX = toX(industryYear);
    const calloutTW = 130;
    const calloutTH = 30;
    const calloutTX = Math.min(
      Math.max(industryX - calloutTW / 2, barX),
      barX + barW - calloutTW,
    );
    const calloutTY = barY - calloutTH - 10;
    this.doc
      .roundedRect(calloutTX, calloutTY, calloutTW, calloutTH, calloutBRadius)
      .fill('#E8633A');
    const tipTX = industryX;
    this.doc
      .moveTo(tipTX - 5, calloutTY + calloutTH)
      .lineTo(tipTX + 5, calloutTY + calloutTH)
      .lineTo(tipTX, calloutTY + calloutTH + 6)
      .fill('#E8633A');
    this.doc
      .font(this.FONT_SORA_SEMIBOLD)
      .fontSize(7)
      .fillColor('#FFFFFF')
      .text(
        `Average Industry Pace: ${entry.industryAvg}`,
        calloutTX + 6,
        calloutTY + 5,
        { width: calloutTW - 12, align: 'center' },
      );
    this.doc
      .font(this.FONT_REGULAR)
      .fontSize(7)
      .fillColor('#FCE4D6')
      .text('Years to Senior Management', calloutTX + 6, calloutTY + 16, {
        width: calloutTW - 12,
        align: 'center',
      });

    this.doc.y = calloutBY + calloutBH + 6;
  }

  // --- CAREER ODYSSEY ROADMAP ---

  private generateCareerOdysseyRoadmap(): void {
    this.ensureSpace(0.4, true);
    const streamKey = String(this.data.school_stream_id ?? '0');
    const streamData =
      CAREER_ODYSSEY_ROADMAP[streamKey] ?? CAREER_ODYSSEY_ROADMAP['0'];

    this.h1(streamData.streamTitle);
    this.h3(streamData.tagline);
    this.doc.moveDown(2);

    this.drawOdysseyRoadmap(streamData.nodes);
  }

  private drawOdysseyRoadmap(nodes: OdysseyNode[]): void {
    if (!nodes || nodes.length === 0) return;

    const margin = this.MARGIN_STD;
    const inset = 55;
    const usableW = this.PAGE_WIDTH - 2 * margin - 2 * inset;
    const startX = margin + inset;
    const endX = startX + usableW;

    const midY = this.doc.y + 100;
    const waveAmp = 20;
    const circleR = 14;
    const stubH = 24;
    const jDotR = 3;
    const textW = 96;

    const n = nodes.length;
    const segW = usableW / (n - 1);

    const lerpColor = (t: number): string => {
      const sr = 0x06,
        sg = 0xb6,
        sb = 0xd4;
      const er = 0x7c,
        eg = 0x3a,
        eb = 0xed;
      const r = Math.round(sr + (er - sr) * t);
      const g = Math.round(sg + (eg - sg) * t);
      const b = Math.round(sb + (eb - sb) * t);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const pts: { x: number; y: number; isAbove: boolean | null }[] = [];
    for (let i = 0; i < n; i++) {
      let yPos: number;
      let isAbove: boolean | null;
      if (i === 0) {
        yPos = midY + waveAmp;
        isAbove = null;
      } else {
        isAbove = i % 2 === 1;
        yPos = isAbove ? midY - waveAmp : midY + waveAmp;
      }
      pts.push({ x: startX + i * segW, y: yPos, isAbove });
    }

    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const t = (i + 0.5) / (n - 1);
      const color = lerpColor(t);
      const cpOff = segW * 0.45;
      this.doc.save();
      this.doc
        .moveTo(p0.x, p0.y)
        .bezierCurveTo(p0.x + cpOff, p0.y, p1.x - cpOff, p1.y, p1.x, p1.y)
        .strokeColor(color)
        .lineWidth(3)
        .stroke();
      this.doc.restore();
    }

    for (let i = 0; i < n; i++) {
      const pt = pts[i];
      const t = i / Math.max(n - 1, 1);
      const color = lerpColor(t);
      const { isAbove } = pt;
      const goesUp = isAbove === null ? false : isAbove;
      const circleCY = goesUp ? pt.y - stubH - circleR : pt.y + stubH + circleR;

      this.doc.save();
      this.doc.circle(pt.x, pt.y, jDotR).fillAndStroke('#FFFFFF', color);
      this.doc.restore();

      const stubEndY = goesUp ? circleCY + circleR : circleCY - circleR;
      this.doc.save();
      this.doc
        .moveTo(pt.x, pt.y)
        .lineTo(pt.x, stubEndY)
        .strokeColor(color)
        .lineWidth(1.5)
        .stroke();
      this.doc.restore();

      this.doc.save();
      this.doc
        .circle(pt.x, circleCY, circleR)
        .fillColor('#FFFFFF')
        .strokeColor(color)
        .lineWidth(2)
        .fillAndStroke();
      this.doc.restore();

      const labelFontSize = 6;
      const rawLabel = nodes[i].label;
      const yearMatch = rawLabel.match(/^(Year)\s+(.+)$/);
      const labelLines = yearMatch ? [yearMatch[1], yearMatch[2]] : [rawLabel];
      const lineH = labelFontSize + 1;
      const totalLabelH = labelLines.length * lineH;
      const labelStartY = circleCY - totalLabelH / 2;

      this.doc.save();
      this.doc
        .font(this.FONT_SORA_BOLD)
        .fontSize(labelFontSize)
        .fillColor(color);
      labelLines.forEach((line, li) => {
        this.doc.text(line, pt.x - circleR + 2, labelStartY + li * lineH, {
          width: (circleR - 2) * 2,
          align: 'center',
          lineBreak: false,
        });
      });
      this.doc.restore();

      const textX = Math.max(
        margin,
        Math.min(this.PAGE_WIDTH - margin - textW, pt.x - textW / 2),
      );
      const titleFS = 7;
      const subFS = 6;
      const titleText = nodes[i].title || '';
      const subText = nodes[i].subtitle || '';
      const textGap = 2;

      if (goesUp) {
        this.doc.font(this.FONT_REGULAR).fontSize(subFS);
        const subH = this.doc.heightOfString(subText, {
          width: textW,
          align: 'center',
        });
        this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(titleFS);
        const titleH = this.doc.heightOfString(titleText, {
          width: textW,
          align: 'center',
        });
        const subTop = circleCY - circleR - 4 - subH;
        const titleTop = subTop - textGap - titleH;
        this.doc.save();
        this.doc.fillColor('#1A1A2E');
        this.doc.text(titleText, textX, titleTop, {
          width: textW,
          align: 'center',
        });
        this.doc
          .font(this.FONT_REGULAR)
          .fontSize(subFS)
          .fillColor('#666666')
          .text(subText, textX, subTop, { width: textW, align: 'center' });
        this.doc.restore();
      } else {
        this.doc.font(this.FONT_SORA_SEMIBOLD).fontSize(titleFS);
        const titleH = this.doc.heightOfString(titleText, {
          width: textW,
          align: 'center',
        });
        const titleTop = circleCY + circleR + 4;
        const subTop = titleTop + titleH + textGap;
        this.doc.save();
        this.doc.fillColor('#1A1A2E');
        this.doc.text(titleText, textX, titleTop, {
          width: textW,
          align: 'center',
        });
        this.doc
          .font(this.FONT_REGULAR)
          .fontSize(subFS)
          .fillColor('#666666')
          .text(subText, textX, subTop, { width: textW, align: 'center' });
        this.doc.restore();
      }
    }

    // suppress unused variable warning for endX
    void endX;
    const bottomMost = midY + waveAmp + stubH + circleR * 2 + 20 + 22;
    this.doc.y = bottomMost + this.DEFAULT_GAP * 2;
  }
}
