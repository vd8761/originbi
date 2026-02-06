import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CounsellingSession,
  CounsellingType,
  PersonalityTrait,
} from '@originbi/shared-entities';
import Groq from 'groq-sdk';

// ============================================================================
// INTERFACES FOR COUNSELLING REPORT DATA STRUCTURE
// ============================================================================

export interface CounsellingReportData {
  generated_at: string;
  student_name: string;
  disc_profile: {
    scores: { D: number; I: number; S: number; C: number };
    dominant_trait: string;
    trait_name: string;
    trait_description: string;
  };
  behavioral_assessment: string;
  key_strengths: string[];
  natural_abilities: string[];
  growth_areas: string[];
  course_fitment: {
    methodology: string[];
    levels: {
      perfect: { min: number; max: number; label: string };
      good: { min: number; max: number; label: string };
      below: { max: number; label: string };
    };
  };
  perfect_courses: CourseRecommendation[];
  good_courses: CourseRecommendation[];
  entry_level_courses: { name: string; fitment: number }[];
  international_courses: CourseRecommendation[];
  career_guidance: {
    intro: string;
    bullets: string[];
    conclusion: string;
  };
  career_roadmap: {
    stage: string;
    bullets: string[];
  }[];
  qualification_note?: string;
  final_guidance: string;
}

export interface CourseRecommendation {
  name: string;
  fitment: number;
  why_recommended: string[];
  career_progression?: string;
}

export interface CourseDataset {
  basic_courses: string[];
  advance_courses: string[];
  international_courses: string[];
}

// ============================================================================
// COUNSELLING REPORT SERVICE
// ============================================================================

@Injectable()
export class CounsellingReportService {
  private readonly logger = new Logger(CounsellingReportService.name);
  private groqClient: Groq;

  constructor(
    @InjectRepository(CounsellingSession)
    private readonly sessionRepo: Repository<CounsellingSession>,
    @InjectRepository(CounsellingType)
    private readonly typeRepo: Repository<CounsellingType>,
    @InjectRepository(PersonalityTrait)
    private readonly traitRepo: Repository<PersonalityTrait>,
    private readonly dataSource: DataSource,
  ) {
    // Initialize Groq client with provided API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    this.groqClient = new Groq({ apiKey });
    this.logger.log('✅ Groq client initialized for counselling reports');
  }

  // ========================================================================
  // MAIN METHOD: Generate Counselling Report
  // ========================================================================

  async generateReport(
    sessionId: number,
    corporateAccountId: number,
    forceRegenerate: boolean = false,
  ): Promise<CounsellingReportData> {
    this.logger.log(
      `📊 Generating counselling report for session: ${sessionId}${forceRegenerate ? ' (FORCE REGENERATE)' : ''}`,
    );

    // 1. Fetch Session with related data and validate corporate access
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, corporateAccountId },
      relations: ['counsellingType'],
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${sessionId} not found or access denied`,
      );
    }

    if (session.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Session ${sessionId} is not completed yet. Current status: ${session.status}`,
      );
    }

    // 2. Check if report already exists (skip if force regenerate)
    if (
      !forceRegenerate &&
      session.reportData &&
      Object.keys(session.reportData).length > 0
    ) {
      this.logger.log(
        `📋 Report already exists for session ${sessionId}, returning cached report`,
      );
      // Normalize cached report to ensure proper structure
      return this.normalizeReportData(
        session.reportData as CounsellingReportData,
      );
    }

    // 3. Fetch Personality Trait details
    let personalityTrait: PersonalityTrait | null = null;
    if (session.personalityTraitId) {
      personalityTrait = await this.traitRepo.findOne({
        where: { id: session.personalityTraitId },
      });
    }

    // 4. Get Course Dataset from counselling type
    const courseDataset = await this.getCourseDataset(session.counsellingType);

    // 5. Get student name and qualification details
    const studentDetails = session.studentDetails || {};
    const firstName =
      studentDetails.personal_details?.first_name ||
      studentDetails.first_name ||
      '';
    const lastName =
      studentDetails.personal_details?.last_name ||
      studentDetails.last_name ||
      '';
    const studentName = `${firstName} ${lastName}`.trim() || 'Student';
    const qualificationDetails = studentDetails.qualification_details || null;

    // 6. Generate Report using AI
    const reportData = await this.generateAIReport(
      session,
      personalityTrait,
      courseDataset,
      studentName,
      qualificationDetails,
    );

    // 7. Save report to session
    session.reportData = reportData;
    await this.sessionRepo.save(session);

    this.logger.log(`✅ Report generated and saved for session ${sessionId}`);
    return reportData;
  }

  // ========================================================================
  // Get Report by Session ID
  // ========================================================================

  async getReport(
    sessionId: number,
    corporateAccountId: number,
  ): Promise<CounsellingReportData | null> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, corporateAccountId },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${sessionId} not found or access denied`,
      );
    }

    if (!session.reportData || Object.keys(session.reportData).length === 0) {
      return null;
    }

    // Normalize cached report to ensure proper structure
    return this.normalizeReportData(
      session.reportData as CounsellingReportData,
    );
  }

  // ========================================================================
  // Normalize Report Data (fix malformed course objects)
  // ========================================================================

  private normalizeReportData(
    report: CounsellingReportData,
  ): CounsellingReportData {
    // Helper function to normalize course objects
    const normalizeCourses = (courses: any[], withDetails = true): any[] => {
      if (!courses || !Array.isArray(courses)) return [];
      return courses
        .map((c) => {
          if (typeof c === 'string') {
            return withDetails
              ? { name: c, fitment: 80, why_recommended: [] }
              : { name: c, fitment: 80 };
          }
          if (typeof c === 'object' && c !== null) {
            const name =
              typeof c.name === 'string'
                ? c.name
                : typeof c.course_name === 'string'
                  ? c.course_name
                  : '';
            const fitment = typeof c.fitment === 'number' ? c.fitment : 80;

            if (withDetails) {
              const whyRec = Array.isArray(c.why_recommended)
                ? c.why_recommended.filter((r: any) => typeof r === 'string')
                : [];
              const careerProg =
                typeof c.career_progression === 'string'
                  ? c.career_progression
                  : undefined;
              return {
                name,
                fitment,
                why_recommended: whyRec,
                career_progression: careerProg,
              };
            }
            return { name, fitment };
          }
          return null;
        })
        .filter((c) => c !== null && c.name);
    };

    return {
      ...report,
      perfect_courses: normalizeCourses(report.perfect_courses, true),
      good_courses: normalizeCourses(report.good_courses, true),
      entry_level_courses: normalizeCourses(report.entry_level_courses, false),
      international_courses: normalizeCourses(
        report.international_courses,
        true,
      ),
    };
  }

  // ========================================================================
  // Fetch Course Dataset
  // ========================================================================

  private async getCourseDataset(
    counsellingType?: CounsellingType,
  ): Promise<CourseDataset> {
    // Helper function to extract course names from array (handles both string[] and object[])
    const extractCourseNames = (courses: unknown[]): string[] => {
      if (!courses || !Array.isArray(courses)) return [];
      return courses
        .map((c: unknown): string => {
          if (typeof c === 'string') return c;
          if (typeof c === 'object' && c !== null) {
            const obj = c as Record<string, unknown>;
            // Safely extract name, ensuring it's a string
            const name = obj.name;
            const courseName = obj.course_name;
            if (typeof name === 'string' && name.length > 0) return name;
            if (typeof courseName === 'string' && courseName.length > 0)
              return courseName;
          }
          return '';
        })
        .filter((name: string) => name.length > 0);
    };

    // First try to get from counselling type's course_details
    if (counsellingType?.courseDetails) {
      const cd = counsellingType.courseDetails as Record<string, unknown>;
      if (cd.basic_courses || cd.advance_courses || cd.international_courses) {
        return {
          basic_courses: extractCourseNames(
            (cd.basic_courses as unknown[]) || [],
          ),
          advance_courses: extractCourseNames(
            (cd.advance_courses as unknown[]) || [],
          ),
          international_courses: extractCourseNames(
            (cd.international_courses as unknown[]) || [],
          ),
        };
      }
    }

    // Fallback to fetching from trait_based_course_details table
    try {
      const coursesResult = await this.dataSource.query(`
                SELECT 
                    course_name,
                    course_level,
                    notes
                FROM trait_based_course_details 
                WHERE is_deleted = false AND is_active = true
                ORDER BY course_name
                LIMIT 50
            `);

      const basicCourses: string[] = [];
      const advanceCourses: string[] = [];
      const internationalCourses: string[] = [];

      for (const course of coursesResult) {
        const name = course.course_name;
        const level = (course.course_level || course.notes || '').toLowerCase();

        if (
          level.includes('international') ||
          level.includes('global') ||
          level.includes('nebosh') ||
          level.includes('certified')
        ) {
          internationalCourses.push(name);
        } else if (
          level.includes('advance') ||
          level.includes('diploma') ||
          level.includes('professional')
        ) {
          advanceCourses.push(name);
        } else {
          basicCourses.push(name);
        }
      }

      if (basicCourses.length > 0 || advanceCourses.length > 0) {
        return {
          basic_courses: basicCourses,
          advance_courses: advanceCourses,
          international_courses: internationalCourses,
        };
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to fetch courses from DB: ${error.message}`);
    }

    // Default fallback courses
    return this.getDefaultCourseDataset();
  }

  private getDefaultCourseDataset(): CourseDataset {
    return {
      basic_courses: [
        'NDT Training – Level II',
        'Fire Safety Training',
        'Basic Welding Certificate',
        'Industrial Electrical Basics',
        'Mechanical Maintenance Fundamentals',
      ],
      advance_courses: [
        'NDT & Quality Management Training',
        'Advance Diploma in Fire & Industrial Safety',
        'Quality Inspector Training',
        'Diploma in Welding (ARC / TIG / MIG – 3G)',
        'PLC & SCADA Programming',
        'CNC Machine Programming',
      ],
      international_courses: [
        'Certified Health, Safety & Environmental Officer',
        'Mechanical Electrical Plumbing Engineer (MEP)',
        'NEBOSH International General Certificate',
        'AWS Certified Welding Inspector',
      ],
    };
  }

  // ========================================================================
  // AI-Powered Report Generation
  // ========================================================================

  private async generateAIReport(
    session: CounsellingSession,
    trait: PersonalityTrait | null,
    courseDataset: CourseDataset,
    studentName: string,
    qualificationDetails?: any,
  ): Promise<CounsellingReportData> {
    const traitCode = trait?.code || session.results?.dominant_trait || 'SC';
    const traitName = trait?.blendedStyleName || 'Balanced Professional';
    const traitDescription =
      trait?.blendedStyleDesc ||
      'A balanced approach to work with adaptable characteristics.';
    const discScores = session.results?.disc_scores || {
      D: 5,
      I: 5,
      S: 5,
      C: 5,
    };

    // Build the system prompt with career progression data
    const systemPrompt = this.buildSystemPrompt(qualificationDetails);

    // Build the user prompt with trait code and course dataset
    const userPrompt = this.buildUserPrompt(
      traitCode,
      courseDataset,
      qualificationDetails,
    );

    try {
      this.logger.log(
        `🤖 Calling Groq API (llama-3.3-70b-versatile) for report generation...`,
      );

      const completion = await this.groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      this.logger.log(`✅ Received AI response (${aiResponse.length} chars)`);

      // Parse AI response into structured data
      const parsedReport = this.parseAIResponse(
        aiResponse,
        discScores,
        traitCode,
        traitName,
        traitDescription,
        studentName,
        qualificationDetails,
      );
      return parsedReport;
    } catch (error) {
      this.logger.error(`❌ AI generation failed: ${error.message}`);
      // Fallback to template-based generation
      return this.generateFallbackReport(
        discScores,
        traitCode,
        traitName,
        traitDescription,
        courseDataset,
        studentName,
        qualificationDetails,
      );
    }
  }

  // ========================================================================
  // System Prompt Builder - Updated with Career Progression Data
  // ========================================================================

  private buildSystemPrompt(qualificationDetails?: any): string {
    // Determine if qualification note is needed
    const qualCategory = (qualificationDetails?.category || '').toLowerCase();
    const degree = (qualificationDetails?.degree || '').toLowerCase();

    // Check for ITI, 12th, dropout, or below degree qualification levels
    const needsHigherStudyNote =
      qualCategory.includes('dropout') ||
      qualCategory.includes('8th') ||
      qualCategory.includes('10th') ||
      qualCategory.includes('12th') ||
      qualCategory.includes('12') ||
      qualCategory.includes('iti') ||
      degree.includes('iti') ||
      degree.includes('8th') ||
      degree.includes('10th') ||
      degree.includes('12th') ||
      degree.includes('12') ||
      (qualCategory === 'fresher' &&
        (!degree || degree === '' || degree.includes('12'))) ||
      qualCategory.includes('school') ||
      qualCategory.includes('sslc') ||
      qualCategory.includes('hsc') ||
      qualCategory.includes('hslc') ||
      qualCategory.includes('plus two') ||
      qualCategory.includes('+2') ||
      degree.includes('hsc') ||
      degree.includes('sslc') ||
      degree.includes('plus two') ||
      degree.includes('+2');

    const qualificationNoteInstruction = needsHigherStudyNote
      ? `
MANDATORY QUALIFICATION NOTE REQUIREMENT:
The candidate's current qualification is ITI level or below, or they are a dropout/fresher without a degree. You MUST include the "qualification_note" field in your JSON response with an encouraging 2-3 sentence message about:
- The importance of pursuing higher education (Diploma, Degree, or specialized certifications)
- How it will upgrade their skills and career prospects
- How it will improve their overall life and earning potential
This field is REQUIRED - do not skip it. Make the message supportive, motivating, and hopeful.
`
      : '';

    return `You are an expert career counsellor and vocational guidance analyst. Create a professional counselling report using ONLY the provided Trait Code and Course Dataset. Do NOT mention or reveal the trait code, DISC, or any personality label/titles in the output. Do NOT invent new courses or certifications. Use clean headings and bullet points. Keep tone neutral, supportive, and parent-friendly.

GLOBAL CONSTRAINTS (VERY IMPORTANT)
- Use ONLY course names from the dataset
- Do NOT mention DISC, personality systems, or trait labels
- Do NOT exceed:
  • 2 Basic courses (from basic_courses list)
  • 2 Advanced courses for Perfect Match (from advance_courses list)
  • 2 Advanced courses for Good Match (from advance_courses list)
  • 2 International courses (from international_courses list)
- If fewer suitable courses exist, show fewer (do not fill artificially)
- Do NOT repeat the same course in multiple sections
- Assign realistic match percentages based on Trait Code fit
${qualificationNoteInstruction}
CAREER PROGRESSION DATA (USE THIS FOR career_roadmap):
Use the following career progression data based on the selected course. Match the stages to:
- 0 to 6 Months: Entry role
- 1 to 2 Years: Skilled role
- 3 to 5 Years: Senior/Certified role
- 5 to 8 Years: Supervisor/Manager role
- Entrepreneur: Own business opportunity

BASIC COURSES (8th-10th Pass/Fail/ITI Dropouts):
| Course | 0-6 Months | 1-2 Years | 3-5 Years | 5-8 Years | Entrepreneur |
|--------|------------|-----------|-----------|-----------|--------------|
| Refrigeration & Air conditioner (A/C) | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Basic Electrical & HVAC Training | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Washing Machine Training | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Electrician | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Plumber | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Industrial Electrician | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Home Appliance Training | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Fitter | Assistant Fitter | Skilled Fitter | Certified Fitter | Fitter Supervisor | Start Own Welding Unit |
| Welding (ARC/TIG/MIG) | Assistant Welder | Skilled Welder | Certified Welder | Welding Supervisor | Start Own Welding Unit |
| MEP Engineer | Assistant Technician | Multi Technician | Senior MEP Technician | MEP Supervisor | Facility Management Company |

DIPLOMA/ENGINEERING BASIC COURSES:
| Course | 0-6 Months | 1-2 Years | 3-5 Years | 5-8 Years | Entrepreneur |
|--------|------------|-----------|-----------|-----------|--------------|
| Diploma In HVAC | Technician | Senior Technician | Supervisor | Manager | Own Company |
| NDT & Quality Management Training | Quality Inspector | Quality In Charge | Asst Manager Quality | QA Manager | GM |
| Advance Diploma In Fire & Industrial Safety | Fire Safety Technician | Safety Officer/Supervisor | Safety Engineer | Safety Manager | EHS Manager |
| Welding Supervisor Training | Welding Forman | Welding Supervisor | Welding In Charge | Manager | Own Company |
| Automobile Quality Inspector Training | Quality Inspector | Quality In Charge | Asst Manager Quality | QA Manager | GM |

DIPLOMA/ENGINEERING ADVANCE COURSES:
| Course | 0-6 Months | 1-2 Years | 3-5 Years | 5-8 Years | Entrepreneur |
|--------|------------|-----------|-----------|-----------|--------------|
| Certified HVAC Engineer (CHE) | Ass Project Engineer | Project Engineer | Project In Charge | Project Manager | Own HVAC Company |
| Certified Health, Safety & Environmental Officer (CHSEO) | Safety Supervisor | Safety Officer | Safety Engineer | Safety Manager | EHS Manager |
| Certified Oil & Gas Piping Engineer (CPE) | Ass Site Engineer | Project Engineer | Project In Charge | Project Manager | Own Company |
| Mechanical Electrical Plumbing Engineer (MEP) | Ass Project Engineer | Project Engineer | Project In Charge | Project Manager | Own MEP Company |

DEGREE COURSES:
| Course | 0-6 Months | 1-2 Years | 3-5 Years | 5-8 Years | Entrepreneur |
|--------|------------|-----------|-----------|-----------|--------------|
| Refrigeration & Air conditioner (A/C) | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Basic Electrical & HVAC Training | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Home Appliance Training | Assistant Technician | Technician | Senior Technician | Supervisor | Own Service Unit |
| Welding (ARC/TIG/MIG) | Assistant Welder | Skilled Welder | Certified Welder | Welding Supervisor | Start Own Welding Unit |
| Advance Diploma In Fire & Industrial Safety | Fire Safety Technician | Safety Officer/Supervisor | Safety Engineer | Safety Manager | EHS Manager |

OUTPUT FORMAT: Return a valid JSON object with this exact structure:
{
    "behavioral_assessment": "2-3 sentences describing work style, learning preference, and best-fit environment",
    "key_strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
    "natural_abilities": ["ability1", "ability2", "ability3", "ability4", "ability5"],
    "growth_areas": ["area1", "area2", "area3", "area4", "area5"],
    "course_fitment_methodology": ["criterion1", "criterion2", "criterion3", "criterion4"],
    "perfect_courses": [
        {
            "name": "Course Name from advance_courses ONLY",
            "fitment": 85-95,
            "why_recommended": ["reason1", "reason2", "reason3"],
            "career_progression": "Use the career progression from the tables above: Role at 0-6M → Role at 1-2Y → Role at 3-5Y → Role at 5-8Y"
        }
    ],
    "good_courses": [
        {
            "name": "Course Name from advance_courses ONLY (different from perfect)",
            "fitment": 70-84,
            "why_recommended": ["reason1", "reason2"]
        }
    ],
    "entry_level_courses": [
        {"name": "Course Name from basic_courses ONLY", "fitment": 70-95}
    ],
    "international_courses": [
        {
            "name": "Course Name from international_courses ONLY",
            "fitment": 70-95,
            "why_recommended": ["reason1", "reason2"]
        }
    ],
    "career_guidance": {
        "intro": "The candidate will perform best in careers that:",
        "bullets": ["point1", "point2", "point3"],
        "conclusion": "One sentence about growth into supervisory/management roles"
    },
    "career_roadmap": [
        {"stage": "0-6 Months", "bullets": ["Start as [entry role from table]", "Complete technical training", "Learn fundamentals"]},
        {"stage": "1-2 Years", "bullets": ["Progress to [skilled role from table]", "Gain hands-on experience"]},
        {"stage": "3-5 Years", "bullets": ["Advance to [senior role from table]", "Take on more responsibilities"]},
        {"stage": "5-8 Years", "bullets": ["Move to [supervisor/manager role from table]", "Lead teams"]},
        {"stage": "Entrepreneur", "bullets": ["[Entrepreneur opportunity from table]", "Start own business"]}
    ],
    "qualification_note": "Only include if candidate has ITI or below qualification - encouraging message about pursuing higher education",
    "final_guidance": "2 sentences of final guidance. No DISC terms. No trait labels."
}

SCORING RULES (INTERNAL)
- Perfect Match: 85–95
- Good Match: 70–84
- Do not show anything below 70
- Match logic must align with work stability, safety orientation, structure, and long-term growth
- Use exact course names as in the dataset
- For career_roadmap, use EXACT role titles from the career progression tables above based on the recommended course`;
  }

  // ========================================================================
  // User Prompt Builder
  // ========================================================================

  private buildUserPrompt(
    traitCode: string,
    courseDataset: CourseDataset,
    qualificationDetails?: any,
  ): string {
    const qualInfo = qualificationDetails
      ? `
Student Qualification Details:
- Category: ${qualificationDetails.category || 'Not specified'}
- Degree: ${qualificationDetails.degree || 'Not specified'}
- College: ${qualificationDetails.college_name || 'Not specified'}
- Passout Year: ${qualificationDetails.passout_year || 'Not specified'}
`
      : '';

    return `INPUTS
Trait Code: ${traitCode}
${qualInfo}
Course Dataset (JSON):
${JSON.stringify(courseDataset, null, 2)}

TASK
Generate the report in EXACTLY this structure and style. Follow all limits strictly.

IMPORTANT COURSE SELECTION RULES:
- Perfect Match Courses: Select UP TO 2 from "advance_courses" list ONLY
- Good Match Courses: Select UP TO 2 from "advance_courses" list ONLY (different from perfect)
- Entry-Level Courses: Select UP TO 2 from "basic_courses" list ONLY
- International Courses: Select UP TO 2 from "international_courses" list ONLY
- Use exact course names as provided in the dataset
- Assign realistic fitment percentages based on the trait code
- Do NOT mention DISC, personality traits, or the trait code in the output text
- For career_roadmap, use the EXACT role titles from the career progression tables provided in the system prompt
- The career_progression field in perfect_courses should show the progression path using actual role titles

IMPORTANT FOR CAREER ROADMAP:
- Use the career progression data provided to generate accurate role titles for each time period
- Match the course name to find the correct progression path
- Include an "Entrepreneur" stage showing the business opportunity

Now generate the JSON report following the exact format specified in the system prompt.`;
  }

  // ========================================================================
  // Parse AI Response
  // ========================================================================

  private parseAIResponse(
    aiResponse: string,
    discScores: { D: number; I: number; S: number; C: number },
    traitCode: string,
    traitName: string,
    traitDescription: string,
    studentName: string,
    qualificationDetails?: any,
  ): CounsellingReportData {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = aiResponse;
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const startIdx = aiResponse.indexOf('{');
        const endIdx = aiResponse.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonStr = aiResponse.substring(startIdx, endIdx + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      // Helper function to normalize course objects to correct structure
      const normalizeCourses = (courses: any[], withDetails = true): any[] => {
        if (!courses || !Array.isArray(courses)) return [];
        return courses
          .map((c) => {
            if (typeof c === 'string') {
              return withDetails
                ? { name: c, fitment: 80, why_recommended: [] }
                : { name: c, fitment: 80 };
            }
            if (typeof c === 'object' && c !== null) {
              // Ensure name is a string, not an object
              const name =
                typeof c.name === 'string'
                  ? c.name
                  : typeof c.course_name === 'string'
                    ? c.course_name
                    : '';
              const fitment = typeof c.fitment === 'number' ? c.fitment : 80;

              if (withDetails) {
                // Ensure why_recommended is an array of strings
                const whyRec = Array.isArray(c.why_recommended)
                  ? c.why_recommended.filter((r: any) => typeof r === 'string')
                  : [];
                const careerProg =
                  typeof c.career_progression === 'string'
                    ? c.career_progression
                    : undefined;
                return {
                  name,
                  fitment,
                  why_recommended: whyRec,
                  career_progression: careerProg,
                };
              }
              return { name, fitment };
            }
            return null;
          })
          .filter((c) => c !== null && c.name);
      };

      // Check if qualification note needs to be generated as fallback
      let qualificationNote = parsed.qualification_note;
      if (!qualificationNote && qualificationDetails) {
        const qualCategory = (
          qualificationDetails.category || ''
        ).toLowerCase();
        const degree = (qualificationDetails.degree || '').toLowerCase();
        const needsNote =
          qualCategory.includes('dropout') ||
          qualCategory.includes('8th') ||
          qualCategory.includes('10th') ||
          qualCategory.includes('12th') ||
          qualCategory.includes('12') ||
          qualCategory.includes('iti') ||
          degree.includes('iti') ||
          degree.includes('8th') ||
          degree.includes('10th') ||
          degree.includes('12th') ||
          degree.includes('12') ||
          (qualCategory === 'fresher' &&
            (!degree || degree === '' || degree.includes('12'))) ||
          qualCategory.includes('school') ||
          qualCategory.includes('sslc') ||
          qualCategory.includes('hsc') ||
          qualCategory.includes('hslc') ||
          qualCategory.includes('plus two') ||
          qualCategory.includes('+2') ||
          degree.includes('hsc') ||
          degree.includes('sslc') ||
          degree.includes('plus two') ||
          degree.includes('+2');

        if (needsNote) {
          qualificationNote =
            'We strongly encourage you to consider pursuing higher education such as a Diploma or Degree program alongside your vocational training. Higher education will significantly enhance your career prospects, open doors to better opportunities, and provide a stronger foundation for long-term professional growth and earning potential.';
        }
      }

      return {
        generated_at: new Date().toISOString(),
        student_name: studentName,
        disc_profile: {
          scores: discScores,
          dominant_trait: traitCode,
          trait_name: traitName,
          trait_description: traitDescription,
        },
        behavioral_assessment: parsed.behavioral_assessment || '',
        key_strengths: parsed.key_strengths || [],
        natural_abilities: parsed.natural_abilities || [],
        growth_areas: parsed.growth_areas || [],
        course_fitment: {
          methodology: parsed.course_fitment_methodology || [
            'Work stability',
            'Safety and compliance orientation',
            'Structured career growth',
            'Long-term employability',
          ],
          levels: {
            perfect: { min: 85, max: 95, label: 'Perfect Match' },
            good: { min: 70, max: 84, label: 'Good Match' },
            below: { max: 70, label: 'Below Threshold' },
          },
        },
        perfect_courses: normalizeCourses(parsed.perfect_courses, true),
        good_courses: normalizeCourses(parsed.good_courses, true),
        entry_level_courses: normalizeCourses(
          parsed.entry_level_courses,
          false,
        ),
        international_courses: normalizeCourses(
          parsed.international_courses,
          true,
        ),
        career_guidance: parsed.career_guidance || {
          intro: 'The candidate will perform best in careers that:',
          bullets: [],
          conclusion: '',
        },
        career_roadmap: parsed.career_roadmap || [],
        qualification_note: qualificationNote,
        final_guidance: parsed.final_guidance || '',
      };
    } catch (error) {
      this.logger.error(`❌ Failed to parse AI response: ${error.message}`);
      throw error;
    }
  }

  // ========================================================================
  // Fallback Report Generation (Template-based)
  // ========================================================================

  private generateFallbackReport(
    discScores: { D: number; I: number; S: number; C: number },
    traitCode: string,
    traitName: string,
    traitDescription: string,
    courseDataset: CourseDataset,
    studentName: string,
    qualificationDetails?: any,
  ): CounsellingReportData {
    this.logger.log(`📝 Using fallback template-based report generation`);

    const firstTrait = traitCode[0] || 'S';

    // Check if qualification note is needed
    let qualificationNote: string | undefined = undefined;
    if (qualificationDetails) {
      const qualCategory = (qualificationDetails.category || '').toLowerCase();
      const degree = (qualificationDetails.degree || '').toLowerCase();
      const needsNote =
        qualCategory.includes('dropout') ||
        qualCategory.includes('8th') ||
        qualCategory.includes('10th') ||
        qualCategory.includes('12th') ||
        qualCategory.includes('12') ||
        qualCategory.includes('iti') ||
        degree.includes('iti') ||
        degree.includes('8th') ||
        degree.includes('10th') ||
        degree.includes('12th') ||
        degree.includes('12') ||
        (qualCategory === 'fresher' &&
          (!degree || degree === '' || degree.includes('12'))) ||
        qualCategory.includes('school') ||
        qualCategory.includes('sslc') ||
        qualCategory.includes('hsc') ||
        qualCategory.includes('hslc') ||
        qualCategory.includes('plus two') ||
        qualCategory.includes('+2') ||
        degree.includes('hsc') ||
        degree.includes('sslc') ||
        degree.includes('plus two') ||
        degree.includes('+2');

      if (needsNote) {
        qualificationNote =
          'We strongly encourage you to consider pursuing higher education such as a Diploma or Degree program alongside your vocational training. Higher education will significantly enhance your career prospects, open doors to better opportunities, and provide a stronger foundation for long-term professional growth and earning potential.';
      }
    }

    const traitProfiles: Record<
      string,
      {
        behavioral: string;
        strengths: string[];
        abilities: string[];
        growth: string[];
      }
    > = {
      D: {
        behavioral:
          'Shows a direct, results-oriented work style with strong leadership potential. They prefer challenging environments where they can take charge and drive outcomes.',
        strengths: [
          'Strong decision-making ability',
          'Goal-oriented mindset',
          'Competitive drive',
          'Ability to take charge',
          'Quick problem-solving',
        ],
        abilities: [
          'Leading teams and projects',
          'Making quick decisions',
          'Handling pressure situations',
          'Driving results',
          'Strategic thinking',
        ],
        growth: [
          'Patience with slower processes',
          'Active listening skills',
          'Collaborative approach',
          'Detailed documentation',
          'Empathy in leadership',
        ],
      },
      I: {
        behavioral:
          'Displays an enthusiastic, people-oriented approach with excellent communication skills. They thrive in collaborative environments and enjoy motivating others.',
        strengths: [
          'Excellent communication',
          'Positive attitude',
          'Team motivation',
          'Networking ability',
          'Creative thinking',
        ],
        abilities: [
          'Public speaking and presentations',
          'Building relationships',
          'Motivating others',
          'Creative problem-solving',
          'Collaborative work',
        ],
        growth: [
          'Focus on details',
          'Following through on tasks',
          'Time management',
          'Structured planning',
          'Working independently',
        ],
      },
      S: {
        behavioral:
          'Shows a stable, disciplined, and responsibility-oriented work style. They prefer clear instructions, structured learning, and practical execution over uncertainty or frequent change. Such individuals grow best in technical, safety-focused, and process-driven environments.',
        strengths: [
          'High discipline and consistency',
          'Strong sense of responsibility',
          'Ability to follow safety rules and procedures',
          'Reliable in routine and long-term tasks',
          'Comfortable working within structured systems',
        ],
        abilities: [
          'Technical execution and maintenance work',
          'Inspection and quality-oriented tasks',
          'Equipment handling and compliance checks',
          'Team coordination under defined rules',
          'Steady learning through hands-on practice',
        ],
        growth: [
          'Faster decision-making in new situations',
          'Confidence while handling leadership roles',
          'Communication with senior authority',
          'Adapting to sudden operational changes',
          'Thinking beyond assigned tasks',
        ],
      },
      C: {
        behavioral:
          'Demonstrates analytical thinking with attention to quality and accuracy in all work. They excel in environments requiring precision and systematic approaches.',
        strengths: [
          'High attention to detail',
          'Analytical mindset',
          'Quality-focused approach',
          'Systematic thinking',
          'Thorough documentation',
        ],
        abilities: [
          'Data analysis and reporting',
          'Quality control',
          'Process improvement',
          'Technical documentation',
          'Compliance monitoring',
        ],
        growth: [
          'Making decisions with incomplete info',
          'Flexibility with processes',
          'Delegating tasks',
          'Speed over perfection balance',
          'Interpersonal communication',
        ],
      },
    };

    const primaryProfile = traitProfiles[firstTrait] || traitProfiles['S'];

    // Select courses from dataset
    const advancedCourses = courseDataset.advance_courses.slice(0, 2);
    const basicCourses = courseDataset.basic_courses.slice(0, 2);
    const internationalCourses = courseDataset.international_courses.slice(
      0,
      2,
    );

    return {
      generated_at: new Date().toISOString(),
      student_name: studentName,
      disc_profile: {
        scores: discScores,
        dominant_trait: traitCode,
        trait_name: traitName,
        trait_description: traitDescription,
      },
      behavioral_assessment: primaryProfile.behavioral,
      key_strengths: primaryProfile.strengths,
      natural_abilities: primaryProfile.abilities,
      growth_areas: primaryProfile.growth,
      course_fitment: {
        methodology: [
          'Work stability',
          'Safety and compliance orientation',
          'Structured career growth',
          'Long-term employability',
        ],
        levels: {
          perfect: { min: 85, max: 95, label: 'Perfect Match' },
          good: { min: 70, max: 84, label: 'Good Match' },
          below: { max: 70, label: 'Below Threshold' },
        },
      },
      perfect_courses:
        advancedCourses.length > 0
          ? [
              {
                name: advancedCourses[0],
                fitment: 93,
                why_recommended: [
                  'Inspection-driven role',
                  'Focus on quality standards',
                  'Documentation and accuracy-oriented work',
                ],
                career_progression: 'Technician → Inspector → Supervisor',
              },
            ]
          : [],
      good_courses:
        advancedCourses.length > 1
          ? [
              {
                name: advancedCourses[1],
                fitment: 82,
                why_recommended: [
                  'Hands-on shop-floor work',
                  'Skill-based progression',
                ],
              },
            ]
          : [],
      entry_level_courses: basicCourses.map((name, i) => ({
        name,
        fitment: 92 - i * 2,
      })),
      international_courses: internationalCourses.map((name, i) => ({
        name,
        fitment: 94 - i * 6,
        why_recommended: ['Global demand', 'Compliance-driven roles'],
      })),
      career_guidance: {
        intro: 'The candidate will perform best in careers that:',
        bullets: [
          'Offer structured growth',
          'Value safety and responsibility',
          'Reward consistency and accuracy',
        ],
        conclusion:
          'Such roles naturally lead to supervisory and management positions over time.',
      },
      career_roadmap: [
        {
          stage: '0-6 Months',
          bullets: [
            'Complete selected technical training',
            'Begin work as Assistant Technician / Trainee',
          ],
        },
        {
          stage: '1-2 Years',
          bullets: [
            'Progress to Technician / Skilled Worker role',
            'Gain hands-on experience and stability',
          ],
        },
        {
          stage: '3-5 Years',
          bullets: [
            'Advance to Senior Technician / Certified Professional',
            'Take on more responsibilities',
          ],
        },
        {
          stage: '5-8 Years',
          bullets: [
            'Move to Supervisor / Manager position',
            'Lead teams and projects',
          ],
        },
        {
          stage: 'Entrepreneur',
          bullets: [
            'Start own service unit or company',
            'Build independent business',
          ],
        },
      ],
      qualification_note: qualificationNote,
      final_guidance:
        'Your strength lies in doing work correctly, safely, and consistently. Choosing structured technical and safety-focused careers will ensure steady income, professional respect, and long-term growth.',
    };
  }
}
