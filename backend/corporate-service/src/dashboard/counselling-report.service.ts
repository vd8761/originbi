import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

    async generateReport(sessionId: number, corporateAccountId: number): Promise<CounsellingReportData> {
        this.logger.log(`📊 Generating counselling report for session: ${sessionId}`);

        // 1. Fetch Session with related data and validate corporate access
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId, corporateAccountId },
            relations: ['counsellingType'],
        });

        if (!session) {
            throw new NotFoundException(`Session with ID ${sessionId} not found or access denied`);
        }

        if (session.status !== 'COMPLETED') {
            throw new BadRequestException(`Session ${sessionId} is not completed yet. Current status: ${session.status}`);
        }

        // 2. Check if report already exists
        if (session.reportData && Object.keys(session.reportData).length > 0) {
            this.logger.log(`📋 Report already exists for session ${sessionId}, returning cached report`);
            return session.reportData as CounsellingReportData;
        }

        // 3. Fetch Personality Trait details
        let personalityTrait: PersonalityTrait | null = null;
        if (session.personalityTraitId) {
            personalityTrait = await this.traitRepo.findOne({
                where: { id: session.personalityTraitId }
            });
        }

        // 4. Get Course Dataset from counselling type
        const courseDataset = await this.getCourseDataset(session.counsellingType);

        // 5. Get student name
        const studentDetails = session.studentDetails || {};
        const firstName = studentDetails.personal_details?.first_name || studentDetails.first_name || '';
        const lastName = studentDetails.personal_details?.last_name || studentDetails.last_name || '';
        const studentName = `${firstName} ${lastName}`.trim() || 'Student';

        // 6. Generate Report using AI
        const reportData = await this.generateAIReport(
            session,
            personalityTrait,
            courseDataset,
            studentName
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

    async getReport(sessionId: number, corporateAccountId: number): Promise<CounsellingReportData | null> {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId, corporateAccountId }
        });

        if (!session) {
            throw new NotFoundException(`Session with ID ${sessionId} not found or access denied`);
        }

        if (!session.reportData || Object.keys(session.reportData).length === 0) {
            return null;
        }

        return session.reportData as CounsellingReportData;
    }

    // ========================================================================
    // Fetch Course Dataset
    // ========================================================================

    private async getCourseDataset(counsellingType?: CounsellingType): Promise<CourseDataset> {
        // First try to get from counselling type's course_details
        if (counsellingType?.courseDetails) {
            const cd = counsellingType.courseDetails;
            if (cd.basic_courses || cd.advance_courses || cd.international_courses) {
                return {
                    basic_courses: cd.basic_courses || [],
                    advance_courses: cd.advance_courses || [],
                    international_courses: cd.international_courses || [],
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

                if (level.includes('international') || level.includes('global') || level.includes('nebosh') || level.includes('certified')) {
                    internationalCourses.push(name);
                } else if (level.includes('advance') || level.includes('diploma') || level.includes('professional')) {
                    advanceCourses.push(name);
                } else {
                    basicCourses.push(name);
                }
            }

            if (basicCourses.length > 0 || advanceCourses.length > 0) {
                return { basic_courses: basicCourses, advance_courses: advanceCourses, international_courses: internationalCourses };
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
                'Mechanical Maintenance Fundamentals'
            ],
            advance_courses: [
                'NDT & Quality Management Training',
                'Advance Diploma in Fire & Industrial Safety',
                'Quality Inspector Training',
                'Diploma in Welding (ARC / TIG / MIG – 3G)',
                'PLC & SCADA Programming',
                'CNC Machine Programming'
            ],
            international_courses: [
                'Certified Health, Safety & Environmental Officer',
                'Mechanical Electrical Plumbing Engineer (MEP)',
                'NEBOSH International General Certificate',
                'AWS Certified Welding Inspector'
            ]
        };
    }

    // ========================================================================
    // AI-Powered Report Generation
    // ========================================================================

    private async generateAIReport(
        session: CounsellingSession,
        trait: PersonalityTrait | null,
        courseDataset: CourseDataset,
        studentName: string
    ): Promise<CounsellingReportData> {
        const traitCode = trait?.code || session.results?.dominant_trait || 'SC';
        const traitName = trait?.blendedStyleName || 'Balanced Professional';
        const traitDescription = trait?.blendedStyleDesc || 'A balanced approach to work with adaptable characteristics.';
        const discScores = session.results?.disc_scores || { D: 5, I: 5, S: 5, C: 5 };

        // Build the system prompt
        const systemPrompt = this.buildSystemPrompt();

        // Build the user prompt with trait code and course dataset
        const userPrompt = this.buildUserPrompt(traitCode, courseDataset);

        try {
            this.logger.log(`🤖 Calling Groq API (llama-3.3-70b-versatile) for report generation...`);

            const completion = await this.groqClient.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
            });

            const aiResponse = completion.choices[0]?.message?.content || '';
            this.logger.log(`✅ Received AI response (${aiResponse.length} chars)`);

            // Parse AI response into structured data
            const parsedReport = this.parseAIResponse(aiResponse, discScores, traitCode, traitName, traitDescription, studentName);
            return parsedReport;

        } catch (error) {
            this.logger.error(`❌ AI generation failed: ${error.message}`);
            // Fallback to template-based generation
            return this.generateFallbackReport(discScores, traitCode, traitName, traitDescription, courseDataset, studentName);
        }
    }

    // ========================================================================
    // System Prompt Builder - Updated to Match PHP Format
    // ========================================================================

    private buildSystemPrompt(): string {
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
            "career_progression": "Role 1 → Role 2 → Role 3"
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
        {"stage": "Year 0–1", "bullets": ["action1", "action2"]},
        {"stage": "Year 1–3", "bullets": ["action1", "action2"]},
        {"stage": "Year 3–5", "bullets": ["action1", "action2"]},
        {"stage": "5+ Years", "bullets": ["action1", "action2"]}
    ],
    "final_guidance": "2 sentences of final guidance. No DISC terms. No trait labels."
}

SCORING RULES (INTERNAL)
- Perfect Match: 85–95
- Good Match: 70–84
- Do not show anything below 70
- Match logic must align with work stability, safety orientation, structure, and long-term growth
- Use exact course names as in the dataset`;
    }

    // ========================================================================
    // User Prompt Builder
    // ========================================================================

    private buildUserPrompt(traitCode: string, courseDataset: CourseDataset): string {
        return `INPUTS
Trait Code: ${traitCode}

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
        studentName: string
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
                        'Long-term employability'
                    ],
                    levels: {
                        perfect: { min: 85, max: 95, label: 'Perfect Match' },
                        good: { min: 70, max: 84, label: 'Good Match' },
                        below: { max: 70, label: 'Below Threshold' }
                    }
                },
                perfect_courses: parsed.perfect_courses || [],
                good_courses: parsed.good_courses || [],
                entry_level_courses: parsed.entry_level_courses || [],
                international_courses: parsed.international_courses || [],
                career_guidance: parsed.career_guidance || {
                    intro: 'The candidate will perform best in careers that:',
                    bullets: [],
                    conclusion: ''
                },
                career_roadmap: parsed.career_roadmap || [],
                final_guidance: parsed.final_guidance || ''
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
        studentName: string
    ): CounsellingReportData {
        this.logger.log(`📝 Using fallback template-based report generation`);

        const firstTrait = traitCode[0] || 'S';

        const traitProfiles: Record<string, {
            behavioral: string;
            strengths: string[];
            abilities: string[];
            growth: string[];
        }> = {
            'D': {
                behavioral: 'Shows a direct, results-oriented work style with strong leadership potential. They prefer challenging environments where they can take charge and drive outcomes.',
                strengths: ['Strong decision-making ability', 'Goal-oriented mindset', 'Competitive drive', 'Ability to take charge', 'Quick problem-solving'],
                abilities: ['Leading teams and projects', 'Making quick decisions', 'Handling pressure situations', 'Driving results', 'Strategic thinking'],
                growth: ['Patience with slower processes', 'Active listening skills', 'Collaborative approach', 'Detailed documentation', 'Empathy in leadership']
            },
            'I': {
                behavioral: 'Displays an enthusiastic, people-oriented approach with excellent communication skills. They thrive in collaborative environments and enjoy motivating others.',
                strengths: ['Excellent communication', 'Positive attitude', 'Team motivation', 'Networking ability', 'Creative thinking'],
                abilities: ['Public speaking and presentations', 'Building relationships', 'Motivating others', 'Creative problem-solving', 'Collaborative work'],
                growth: ['Focus on details', 'Following through on tasks', 'Time management', 'Structured planning', 'Working independently']
            },
            'S': {
                behavioral: 'Shows a stable, disciplined, and responsibility-oriented work style. They prefer clear instructions, structured learning, and practical execution over uncertainty or frequent change. Such individuals grow best in technical, safety-focused, and process-driven environments.',
                strengths: ['High discipline and consistency', 'Strong sense of responsibility', 'Ability to follow safety rules and procedures', 'Reliable in routine and long-term tasks', 'Comfortable working within structured systems'],
                abilities: ['Technical execution and maintenance work', 'Inspection and quality-oriented tasks', 'Equipment handling and compliance checks', 'Team coordination under defined rules', 'Steady learning through hands-on practice'],
                growth: ['Faster decision-making in new situations', 'Confidence while handling leadership roles', 'Communication with senior authority', 'Adapting to sudden operational changes', 'Thinking beyond assigned tasks']
            },
            'C': {
                behavioral: 'Demonstrates analytical thinking with attention to quality and accuracy in all work. They excel in environments requiring precision and systematic approaches.',
                strengths: ['High attention to detail', 'Analytical mindset', 'Quality-focused approach', 'Systematic thinking', 'Thorough documentation'],
                abilities: ['Data analysis and reporting', 'Quality control', 'Process improvement', 'Technical documentation', 'Compliance monitoring'],
                growth: ['Making decisions with incomplete info', 'Flexibility with processes', 'Delegating tasks', 'Speed over perfection balance', 'Interpersonal communication']
            }
        };

        const primaryProfile = traitProfiles[firstTrait] || traitProfiles['S'];

        // Select courses from dataset
        const advancedCourses = courseDataset.advance_courses.slice(0, 2);
        const basicCourses = courseDataset.basic_courses.slice(0, 2);
        const internationalCourses = courseDataset.international_courses.slice(0, 2);

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
                    'Long-term employability'
                ],
                levels: {
                    perfect: { min: 85, max: 95, label: 'Perfect Match' },
                    good: { min: 70, max: 84, label: 'Good Match' },
                    below: { max: 70, label: 'Below Threshold' }
                }
            },
            perfect_courses: advancedCourses.length > 0 ? [
                {
                    name: advancedCourses[0],
                    fitment: 93,
                    why_recommended: ['Inspection-driven role', 'Focus on quality standards', 'Documentation and accuracy-oriented work'],
                    career_progression: 'Technician → Inspector → Supervisor'
                }
            ] : [],
            good_courses: advancedCourses.length > 1 ? [
                {
                    name: advancedCourses[1],
                    fitment: 82,
                    why_recommended: ['Hands-on shop-floor work', 'Skill-based progression']
                }
            ] : [],
            entry_level_courses: basicCourses.map((name, i) => ({
                name,
                fitment: 92 - (i * 2)
            })),
            international_courses: internationalCourses.map((name, i) => ({
                name,
                fitment: 94 - (i * 6),
                why_recommended: ['Global demand', 'Compliance-driven roles']
            })),
            career_guidance: {
                intro: 'The candidate will perform best in careers that:',
                bullets: [
                    'Offer structured growth',
                    'Value safety and responsibility',
                    'Reward consistency and accuracy'
                ],
                conclusion: 'Such roles naturally lead to supervisory and management positions over time.'
            },
            career_roadmap: [
                { stage: 'Year 0–1', bullets: ['Complete selected technical training', 'Begin work as Technician / Inspector'] },
                { stage: 'Year 1–3', bullets: ['Move into senior technical roles', 'Gain responsibility and stability'] },
                { stage: 'Year 3–5', bullets: ['Transition into supervision or safety roles', 'Lead small teams'] },
                { stage: '5+ Years', bullets: ['Leadership positions', 'Overseas opportunities'] }
            ],
            final_guidance: 'Your strength lies in doing work correctly, safely, and consistently. Choosing structured technical and safety-focused careers will ensure steady income, professional respect, and long-term growth.'
        };
    }
}
