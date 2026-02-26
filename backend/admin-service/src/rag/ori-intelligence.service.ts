/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    BI INTELLIGENCE SERVICE                                ║
 * ║       Advanced AI Brain — Professional Career Intelligence               ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  CAPABILITIES:                                                            ║
 * ║  • Personalized career guidance based on user's assessment data          ║
 * ║  • Job eligibility analysis with detailed reasoning                       ║
 * ║  • Higher studies recommendations                                         ║
 * ║  • Professional, supportive advisory tone                                ║
 * ║  • Answer ANY question intelligently using LLM                           ║
 * ║  • Remember user preferences and build relationship                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

interface UserProfile {
    userId: number;
    name: string;
    email: string;
    personalityStyle?: string;
    personalityDescription?: string;
    agileScore?: number;
    assessmentStatus?: string;
    interests?: string[];
    goals?: string[];
    preferredIndustries?: string[];
}

interface CareerSuitability {
    roleName: string;
    department: string;
    matchScore: number; // 0-100
    reasoning: string;
    skills: string[];
    certifications?: string[];
}

interface UserMemory {
    userId: number;
    facts: Map<string, string>; // Things BI learned about the user
    preferences: Map<string, string>;
    conversationHistory: string[];
    lastInteraction: Date;
}

@Injectable()
export class OriIntelligenceService {
    private readonly logger = new Logger('BI-Intelligence');
    private llm: ChatGroq | null = null;
    private userMemories: Map<number, UserMemory> = new Map();

    // Career roles mapped to personality types
    private readonly PERSONALITY_CAREER_MAP: Record<string, CareerSuitability[]> = {
        'Charismatic Leader': [
            { roleName: 'Product Manager', department: 'Product & Business', matchScore: 95, reasoning: 'Your natural leadership and vision make you ideal for driving product strategy', skills: ['Roadmaps', 'Prioritization', 'Stakeholder Management'], certifications: ['Product Management Cert'] },
            { roleName: 'Business Development Manager', department: 'Sales & Growth', matchScore: 90, reasoning: 'Your charisma and ability to inspire others will help close deals', skills: ['Negotiation', 'Relationship Building', 'Strategic Planning'] },
            { roleName: 'Startup Founder', department: 'Entrepreneurship', matchScore: 92, reasoning: 'Your vision and risk-taking ability are entrepreneurial strengths', skills: ['Leadership', 'Vision', 'Team Building'] },
            { roleName: 'Marketing Director', department: 'Marketing', matchScore: 85, reasoning: 'Your influence skills can drive brand awareness', skills: ['Brand Strategy', 'Campaign Management'] },
        ],
        'Strategic Stabilizer': [
            { roleName: 'Project Manager', department: 'Operations', matchScore: 95, reasoning: 'Your methodical approach ensures projects finish on time', skills: ['Planning', 'Risk Management', 'Resource Allocation'], certifications: ['PMP', 'PRINCE2'] },
            { roleName: 'Operations Manager', department: 'Operations', matchScore: 92, reasoning: 'Your focus on stability and efficiency is perfect for operations', skills: ['Process Optimization', 'Team Coordination'] },
            { roleName: 'Quality Assurance Lead', department: 'Engineering', matchScore: 88, reasoning: 'Your attention to detail catches issues before they become problems', skills: ['Testing', 'Documentation', 'Standards'] },
            { roleName: 'Financial Analyst', department: 'Finance', matchScore: 85, reasoning: 'Your analytical nature suits financial planning', skills: ['Analysis', 'Forecasting', 'Reporting'] },
        ],
        'Decisive Analyst': [
            { roleName: 'Data Scientist', department: 'Data & Analytics', matchScore: 95, reasoning: 'Your analytical mindset and quick decision-making are perfect for data science', skills: ['Python', 'ML', 'Statistics'], certifications: ['Data Science Cert'] },
            { roleName: 'Backend Developer', department: 'Engineering', matchScore: 92, reasoning: 'Your logical thinking translates well to complex systems', skills: ['Node.js', 'Python', 'SQL'] },
            { roleName: 'Security Analyst', department: 'Cybersecurity', matchScore: 88, reasoning: 'Your sharp analysis helps identify vulnerabilities', skills: ['Penetration Testing', 'Security Audits'] },
            { roleName: 'Business Intelligence Analyst', department: 'Analytics', matchScore: 90, reasoning: 'Your ability to see patterns drives business insights', skills: ['SQL', 'Tableau', 'Data Modeling'] },
        ],
        'Analytical Leader': [
            { roleName: 'Technical Lead', department: 'Engineering', matchScore: 95, reasoning: 'You combine technical depth with leadership ability', skills: ['Architecture', 'Code Review', 'Mentoring'] },
            { roleName: 'Solutions Architect', department: 'Engineering', matchScore: 92, reasoning: 'Your strategic thinking designs robust systems', skills: ['System Design', 'Cloud Architecture'], certifications: ['AWS/Azure Cert'] },
            { roleName: 'Engineering Manager', department: 'Engineering', matchScore: 90, reasoning: 'You can lead technical teams with accountability', skills: ['Team Management', 'Technical Strategy'] },
            { roleName: 'AI/ML Engineer', department: 'Data & AI', matchScore: 88, reasoning: 'Your analytical approach suits complex AI problems', skills: ['Deep Learning', 'NLP', 'Python'] },
        ],
        'Creative Thinker': [
            { roleName: 'UI/UX Designer', department: 'Design', matchScore: 95, reasoning: 'Your creativity and empathy create beautiful user experiences', skills: ['Figma', 'User Research', 'Prototyping'], certifications: ['Google UX Cert'] },
            { roleName: 'Content Strategist', department: 'Marketing', matchScore: 90, reasoning: 'Your creative thinking crafts compelling narratives', skills: ['Storytelling', 'Content Planning'] },
            { roleName: 'Frontend Developer', department: 'Engineering', matchScore: 88, reasoning: 'You can bring creative designs to life with code', skills: ['React', 'CSS', 'Animation'] },
            { roleName: 'Brand Designer', department: 'Design', matchScore: 92, reasoning: 'Your visual creativity builds memorable brands', skills: ['Visual Design', 'Brand Identity'] },
        ],
        'Supportive Energizer': [
            { roleName: 'HR Manager', department: 'Human Resources', matchScore: 95, reasoning: 'Your people skills and empathy make you a natural HR leader', skills: ['People Management', 'Conflict Resolution'], certifications: ['SHRM'] },
            { roleName: 'Customer Success Manager', department: 'Customer Success', matchScore: 92, reasoning: 'Your supportive nature keeps customers happy', skills: ['Relationship Building', 'Problem Solving'] },
            { roleName: 'Training Specialist', department: 'L&D', matchScore: 90, reasoning: 'Your energy and patience help others learn', skills: ['Training Design', 'Facilitation'] },
            { roleName: 'Team Lead', department: 'Any', matchScore: 88, reasoning: 'Your supportive style motivates teams', skills: ['Mentoring', 'Team Building'] },
        ],
        'Reliable Executor': [
            { roleName: 'DevOps Engineer', department: 'Engineering', matchScore: 95, reasoning: 'Your reliability ensures systems run smoothly 24/7', skills: ['CI/CD', 'Docker', 'Kubernetes'], certifications: ['DevOps Cert'] },
            { roleName: 'System Administrator', department: 'IT', matchScore: 92, reasoning: 'Your consistency keeps infrastructure stable', skills: ['Linux', 'Networking', 'Monitoring'] },
            { roleName: 'QA Engineer', department: 'Engineering', matchScore: 90, reasoning: 'Your thoroughness catches every bug', skills: ['Test Automation', 'Selenium'] },
            { roleName: 'Technical Writer', department: 'Documentation', matchScore: 85, reasoning: 'Your attention to detail creates clear documentation', skills: ['Documentation', 'Technical Communication'] },
        ],
    };

    // Higher studies recommendations by personality and Agile score
    private readonly HIGHER_STUDIES_MAP: Record<string, { degree: string; reason: string; universities?: string[] }[]> = {
        'Analytical': [
            { degree: 'MS in Data Science', reason: 'Perfect for your analytical mindset - combines stats, ML, and business impact', universities: ['MIT', 'Stanford', 'Carnegie Mellon'] },
            { degree: 'MS in Computer Science', reason: 'Deepens your technical skills with cutting-edge research', universities: ['Stanford', 'UC Berkeley', 'MIT'] },
            { degree: 'MBA with Analytics', reason: 'Combines business leadership with your analytical strengths', universities: ['Wharton', 'MIT Sloan', 'Chicago Booth'] },
        ],
        'Creative': [
            { degree: 'MFA in Design', reason: 'Nurtures your creativity with advanced design thinking', universities: ['RISD', 'Parsons', 'CalArts'] },
            { degree: 'MS in HCI', reason: 'Combines design with technology for product impact', universities: ['CMU', 'Georgia Tech', 'Michigan'] },
            { degree: 'MBA in Innovation', reason: 'Channel your creativity into business innovation', universities: ['Stanford GSB', 'INSEAD'] },
        ],
        'Leader': [
            { degree: 'MBA', reason: 'Sharpens your leadership with strategic business skills', universities: ['Harvard', 'Stanford', 'Wharton'] },
            { degree: 'MS in Management', reason: 'Leadership-focused program for future executives', universities: ['MIT Sloan', 'London Business School'] },
            { degree: 'Executive MBA', reason: 'Accelerate to C-suite while working', universities: ['Kellogg', 'Columbia', 'INSEAD'] },
        ],
        'Technical': [
            { degree: 'MS in AI/ML', reason: 'Cutting-edge field with high demand', universities: ['Stanford', 'CMU', 'MIT'] },
            { degree: 'MS in Cybersecurity', reason: 'Growing field that needs analytical minds', universities: ['Georgia Tech', 'CMU', 'NYU'] },
            { degree: 'PhD in CS', reason: 'For those wanting to push boundaries of knowledge', universities: ['MIT', 'Stanford', 'Berkeley'] },
        ],
    };

    constructor(private dataSource: DataSource) {
        this.logger.log('🧠 BI Intelligence Service activated');
    }

    private getLlm(): ChatGroq {
        if (!this.llm) {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) throw new Error('GROQ_API_KEY not set');
            this.llm = new ChatGroq({
                apiKey,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.6, // Balanced: creative yet focused responses
                maxTokens: 4096, // Allow comprehensive answers
            });
        }
        return this.llm;
    }

    /**
     * Get user profile from database by userId or email
     */
    async getUserProfile(userId: number, email?: string): Promise<UserProfile | null> {
        try {
            // Try by userId first, then by email (case-insensitive)
            let whereClause = 'users.id = $1';
            let params: any[] = [userId];

            if (email && (!userId || userId === 0)) {
                whereClause = 'LOWER(users.email) = LOWER($1)';
                params = [email];
            }

            const result = await this.dataSource.query(`
                SELECT 
                    users.id as user_id,
                    registrations.full_name as name,
                    users.email,
                    users.role,
                    personality_traits.blended_style_name as personality_style,
                    personality_traits.blended_style_desc as personality_description,
                    assessment_attempts.total_score as agile_score,
                    assessment_attempts.status as assessment_status
                FROM users
                LEFT JOIN registrations ON registrations.user_id = users.id
                LEFT JOIN assessment_attempts ON assessment_attempts.registration_id = registrations.id
                LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
                WHERE ${whereClause}
                ORDER BY assessment_attempts.total_score DESC NULLS LAST
                LIMIT 1
            `, params);

            if (result.length === 0) {
                // Fallback 1: Try just getting user by email without joins
                if (email) {
                    const userOnly = await this.dataSource.query(`
                        SELECT id as user_id, email, role 
                        FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
                    `, [email]);
                    if (userOnly.length > 0) {
                        return {
                            userId: userOnly[0].user_id,
                            name: userOnly[0].email.split('@')[0],
                            email: userOnly[0].email,
                            personalityStyle: undefined,
                            personalityDescription: undefined,
                            agileScore: undefined,
                            assessmentStatus: 'NOT_STARTED',
                        };
                    }
                }

                // Fallback 2: Try searching registrations via users table (case-insensitive email match)
                if (email) {
                    const regOnly = await this.dataSource.query(`
                        SELECT r.id as reg_id, r.full_name as name, r.user_id,
                               pt.blended_style_name as personality_style,
                               pt.blended_style_desc as personality_description,
                               aa.total_score as agile_score,
                               aa.status as assessment_status
                        FROM registrations r
                        JOIN users u ON r.user_id = u.id
                        LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
                        LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
                        WHERE LOWER(u.email) = LOWER($1) AND r.is_deleted = false
                        ORDER BY r.created_at DESC
                        LIMIT 1
                    `, [email]);
                    if (regOnly.length > 0) {
                        this.logger.log(`getUserProfile: Found via registrations table for ${email}`);
                        return {
                            userId: regOnly[0].user_id || 0,
                            name: regOnly[0].name || email.split('@')[0],
                            email,
                            personalityStyle: regOnly[0].personality_style,
                            personalityDescription: regOnly[0].personality_description,
                            agileScore: regOnly[0].agile_score ? parseFloat(regOnly[0].agile_score) : undefined,
                            assessmentStatus: regOnly[0].assessment_status || 'NOT_STARTED',
                        };
                    }
                }

                this.logger.warn(`getUserProfile: No profile found for userId=${userId}, email=${email}`);
                return null;
            }

            return {
                userId: result[0].user_id,
                name: result[0].name || result[0].email?.split('@')[0] || 'User',
                email: result[0].email,
                personalityStyle: result[0].personality_style,
                personalityDescription: result[0].personality_description,
                agileScore: result[0].agile_score ? parseFloat(result[0].agile_score) : undefined,
                assessmentStatus: result[0].assessment_status,
            };
        } catch (error) {
            this.logger.warn(`Could not fetch user profile: ${error.message}`);
            return null;
        }
    }

    /**
     * Answer personal questions like "what is my name", "my role", etc.
     */
    answerPersonalQuestion(question: string, profile: UserProfile | null): string | null {
        const q = question.toLowerCase();

        // "What is my name"
        if (q.includes('my name') || q.includes('who am i')) {
            if (profile?.name) {
                return `Your name on record is **${profile.name}**, and you are currently logged in as **${profile.email}**. How may I assist you today?`;
            }
            return `Your full name is not yet on record, but your session is active. You can update your profile to ensure I address you correctly.`;
        }

        // "What is my personality" / "my style"
        if (q.includes('my personality') || q.includes('my style') || q.includes('my type')) {
            if (profile?.personalityStyle) {
                return `Based on your assessment, your personality style is **${profile.personalityStyle}**.\n\n${profile.personalityDescription || ''}\n\nI can suggest career paths aligned with your personality profile — just ask.`;
            }
            return `Your personality assessment has not been completed yet. Once you complete the OriginBI assessment, I can provide personalized career guidance tailored to your profile.`;
        }

        // "My score" / "How did I do"
        if (q.includes('my score') || q.includes('how did i do') || q.includes('my result')) {
            if (profile?.agileScore !== undefined) {
                return `Your assessment indicates an Agile Adaptability score. Combined with your **${profile.personalityStyle || 'personality profile'}**, I can recommend career paths that align with your strengths.\n\nWould you like to see which roles are best suited for you?`;
            }
            return `I do not have a completed assessment on record for you. Once you complete the assessment, I can provide personalized career recommendations.`;
        }

        // "My email" / "my account"
        if (q.includes('my email') || q.includes('my account')) {
            if (profile?.email) {
                return `You are currently logged in as **${profile.email}**.`;
            }
            return `Your account information is not available at the moment. Please ensure you are logged in.`;
        }

        // "About me" / "my profile"
        if (q.includes('about me') || q.includes('my profile') || q.includes('tell me about me')) {
            if (profile) {
                let response = `**Profile Summary — ${profile.name}**\n\n`;
                response += `**Email**: ${profile.email}\n`;
                if (profile.personalityStyle) {
                    response += `**Personality Style**: ${profile.personalityStyle}\n`;
                    response += `${profile.personalityDescription || ''}\n`;
                }
                if (profile.assessmentStatus) {
                    response += `**Assessment Status**: ${profile.assessmentStatus}\n`;
                }
                response += `\n*You can ask "what jobs am I eligible for?" to receive personalized career recommendations.*`;
                return response;
            }
            return `I don't have enough data to display your profile yet. Please complete an assessment first, and I'll be able to provide personalized insights.`;
        }

        return null; // Not a personal question
    }

    /**
     * Get or create user memory
     */
    getUserMemory(userId: number): UserMemory {
        if (!this.userMemories.has(userId)) {
            this.userMemories.set(userId, {
                userId,
                facts: new Map(),
                preferences: new Map(),
                conversationHistory: [],
                lastInteraction: new Date(),
            });
        }
        const memory = this.userMemories.get(userId)!;
        memory.lastInteraction = new Date();
        return memory;
    }

    /**
     * Store a fact about the user
     */
    storeUserFact(userId: number, key: string, value: string): void {
        const memory = this.getUserMemory(userId);
        memory.facts.set(key, value);
        this.logger.log(`📝 Stored fact for user ${userId}: ${key} = ${value}`);
    }

    /**
     * Get eligible career roles based on personality
     */
    getEligibleCareers(personalityStyle: string | undefined): CareerSuitability[] {
        if (!personalityStyle) {
            // Return general recommendations
            return [
                { roleName: 'Software Developer', department: 'Engineering', matchScore: 80, reasoning: 'Great starting point for tech careers', skills: ['Programming', 'Problem Solving'] },
                { roleName: 'Business Analyst', department: 'Business', matchScore: 78, reasoning: 'Bridge between tech and business', skills: ['Analysis', 'Communication'] },
                { roleName: 'Project Coordinator', department: 'Operations', matchScore: 75, reasoning: 'Learn to manage projects and teams', skills: ['Organization', 'Communication'] },
            ];
        }

        // Find matching personality type
        const matchingKey = Object.keys(this.PERSONALITY_CAREER_MAP).find(
            key => personalityStyle.toLowerCase().includes(key.toLowerCase()) ||
                key.toLowerCase().includes(personalityStyle.toLowerCase())
        );

        if (matchingKey) {
            return this.PERSONALITY_CAREER_MAP[matchingKey];
        }

        // Default careers
        return this.PERSONALITY_CAREER_MAP['Strategic Stabilizer'];
    }

    /**
     * Get higher studies recommendations
     */
    getHigherStudiesRecommendations(profile: UserProfile): { degree: string; reason: string; universities?: string[] }[] {
        const style = profile.personalityStyle?.toLowerCase() || '';

        if (style.includes('analyst') || style.includes('analytical') || style.includes('decisive')) {
            return this.HIGHER_STUDIES_MAP['Analytical'];
        }
        if (style.includes('creative') || style.includes('thinker')) {
            return this.HIGHER_STUDIES_MAP['Creative'];
        }
        if (style.includes('leader') || style.includes('charismatic')) {
            return this.HIGHER_STUDIES_MAP['Leader'];
        }
        return this.HIGHER_STUDIES_MAP['Technical'];
    }

    /**
     * Check if user can try a specific job/role
     */
    async canTryJob(profile: UserProfile, jobTitle: string): Promise<{ eligible: boolean; score: number; advice: string }> {
        const eligibleCareers = this.getEligibleCareers(profile.personalityStyle);

        // Check if job matches eligible careers
        const matchingCareer = eligibleCareers.find(
            c => c.roleName.toLowerCase().includes(jobTitle.toLowerCase()) ||
                jobTitle.toLowerCase().includes(c.roleName.toLowerCase())
        );

        if (matchingCareer) {
            return {
                eligible: true,
                score: matchingCareer.matchScore,
                advice: `**Strong Match.** ${matchingCareer.reasoning}. Your ${profile.personalityStyle} profile indicates a **${matchingCareer.matchScore}%** alignment with this role. Key skills to develop: ${matchingCareer.skills.join(', ')}.`
            };
        }

        // Use LLM to provide nuanced advice
        const prompt = `
You are BI, a professional career advisor integrated into the OriginBI platform. A user with "${profile.personalityStyle || 'undetermined'}" personality style (Behavioral Assessment Score: ${profile.agileScore || 'N/A'}) wants to know if they can pursue a career as "${jobTitle}".

Provide a professional, honest, and encouraging assessment:
1. Start with whether this is a STRONG FIT, GOOD FIT, or DEVELOPMENT OPPORTUNITY for their personality type
2. Explain WHY based on their personality traits
3. List 3-4 specific skills they should develop
4. Suggest 2-3 concrete first steps to get started
5. If it's a stretch role, suggest 1-2 stepping-stone roles

Keep the tone professional, supportive, and advisory. Use markdown formatting.
Keep response under 200 words. Be specific and actionable. Do not use excessive emojis.
`;

        try {
            const response = await this.getLlm().invoke([new SystemMessage(prompt)]);
            return {
                eligible: true, // Always encouraging
                score: 65,
                advice: response.content.toString()
            };
        } catch {
            return {
                eligible: true,
                score: 65,
                advice: `While ${jobTitle} may require additional development beyond your current profile, it remains achievable with the right preparation. I recommend exploring stepping-stone roles that build the necessary skills progressively.`
            };
        }
    }

    /**
     * Answer any question with emotional intelligence
     */
    async answerAnyQuestion(
        question: string,
        profile: UserProfile | null,
        conversationContext: string
    ): Promise<string> {
        const userName = profile?.name || 'there';
        const personality = profile?.personalityStyle || 'not yet assessed';

        const systemPrompt = `You are **Ask BI** — the intelligent assistant powering the OriginBI talent analytics platform. You operate as a Chief Intelligence Officer for career and talent data.

═══════════════════════════════════════════════════
IDENTITY
═══════════════════════════════════════════════════
- Name: Ask BI (OriginBI Intelligent Assistant)
- Role: AI-powered talent intelligence and career advisory system
- Tone: Professional, confident, precise, data-driven — like a senior career intelligence analyst
- Never refer to yourself as a chatbot or AI model. You are Ask BI.

═══════════════════════════════════════════════════
USER CONTEXT
═══════════════════════════════════════════════════
- Name: ${userName}
- Personality Style: ${personality}
- Email: ${profile?.email || 'unknown'}
${profile?.agileScore ? `- Agile Score: ${profile.agileScore}` : ''}
${profile?.assessmentStatus ? `- Assessment Status: ${profile.assessmentStatus}` : ''}

═══════════════════════════════════════════════════
YOUR EXPERTISE DOMAINS
═══════════════════════════════════════════════════
1. **Career Intelligence**: Job roles, career paths, industry trends, salary benchmarks, career transitions, growth trajectories
2. **Technology & Engineering**: Programming languages, frameworks, system design, cloud, AI/ML, data science, cybersecurity, DevOps
3. **Education & Certification**: Courses, certifications, degree programs, universities, bootcamps, online platforms (Coursera, Udemy, edX, etc.)
4. **Professional Development**: Resume optimization, interview strategy, soft skills, leadership development, project management
5. **Industry Analysis**: IT, BFSI, Healthcare, Manufacturing, Consulting, Startups, and all major sectors
6. **Behavioral Insights**: DISC assessment interpretation, personality-career alignment, strengths-based coaching

═══════════════════════════════════════════════════
RESPONSE STANDARDS
═══════════════════════════════════════════════════
1. **Be thorough**: Provide COMPLETE, well-structured answers. Never truncate.
2. **Structure cleanly**: Use markdown — headings (##), bold, bullet points, numbered lists, tables.
3. **Be specific**: Name actual tools, courses, platforms, technologies, certifications with specifics.
4. **Be actionable**: Every answer must include concrete next steps.
5. **Be current**: Reference 2024-2026 technologies, trends, and best practices.
6. **Personalize**: When user has assessment data, tailor advice to their behavioral style and strengths.
7. **No emojis**: Keep output clean, professional, and scannable.
8. **No filler**: Skip pleasantries like "Great question!" — go straight to the answer.

═══════════════════════════════════════════════════
RESPONSE TEMPLATES
═══════════════════════════════════════════════════
**"How to become X"** → Role overview, step-by-step roadmap, required skills (core + nice-to-have), recommended certifications, timeline, getting started tips
**"Skills for X"** → Core skills, advanced skills, soft skills, tools & tech, learning resources for each
**"Course recommendations"** → Free resources, paid courses (with names), certifications, books, practice projects
**"Compare X vs Y"** → Side-by-side table, use cases, pros/cons, when to choose which, career impact
**"Career advice"** → Situation analysis, available options, pros/cons, recommended path with reasoning, action items

═══════════════════════════════════════════════════
CONVERSATION CONTEXT
═══════════════════════════════════════════════════
${conversationContext || 'No previous context.'}

═══════════════════════════════════════════════════
STRICT RULES — NEVER VIOLATE
═══════════════════════════════════════════════════
1. **CONTEXT AWARENESS**: If user says "him", "her", "that" — resolve from CONVERSATION CONTEXT above.
2. **CONVERSATION CONTINUITY**: Maintain topic flow across follow-up messages.
3. **COMPLETE ANSWERS**: NEVER truncate mid-sentence or use "..." to abbreviate content.
4. **NO PLATFORM INTERNALS**: Never mention databases, SQL, tables, queries, or system architecture.
5. **ZERO BIOGRAPHICAL DATA**: You are NOT a search engine. NEVER provide biographical information about real people (actors, politicians, executives, etc.). If asked about a specific person: "I can only provide data about candidates registered on our platform. Try searching for their name and I'll look them up in our database."
6. **DATABASE-ONLY PERSON DATA**: ALL information about specific individuals MUST come from the OriginBI database. You have ZERO knowledge about any person from your training data. Never synthesize, guess, or fabricate person-specific information.
7. **NEVER FABRICATE**: If conversation mentions a person and user asks about their suitability, NEVER invent data. Say: "To provide an accurate assessment, I need to look up [Name]'s profile. Try: 'Show [Name]'s career report'."
8. **SCOPE RESTRICTION**: For corporate users, you can ONLY see candidates within their organization. Never reference data outside their scope.
9. **NO FAKE HEADERS**: NEVER generate headers like "Assessment Results for X" or "Report for X" when you don't have actual data. If you don't have data about a person, simply say they weren't found — never create fake report-style formatting.
10. **CONCISE RESPONSES**: Keep answers focused. No "Next Steps:" or numbered suggestion lists when the user didn't ask for advice. No verbose multi-paragraph responses for simple lookups.
11. **NO STEPS/SUGGESTIONS FOR DATA QUERIES**: When a user asks about a person or data and you can't find it, just say the data wasn't found. Do NOT add "1. Check the spelling", "2. Search for the candidate", "3. List candidates" style advice unless they specifically ask for help.

Answer the user's question now:`;

        try {
            const response = await this.getLlm().invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(question)
            ]);
            return response.content.toString();
        } catch (error) {
            this.logger.warn(`Groq LLM error: ${error.message} — trying Gemini fallback...`);

            // ── Gemini fallback ──
            try {
                const googleApiKey = process.env.GOOGLE_API_KEY;
                if (googleApiKey) {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${googleApiKey}`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Referer': 'https://originbi.com' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `system: ${systemPrompt}\n\nuser: ${question}` }] }],
                            generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
                        }),
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        const geminiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (geminiAnswer) {
                            this.logger.log('✅ Gemini fallback succeeded');
                            return geminiAnswer;
                        }
                    }
                }
            } catch (geminiErr) {
                this.logger.warn(`Gemini fallback also failed: ${geminiErr.message}`);
            }

            return `I'm experiencing high demand at the moment. Please try again in a minute — I'll be ready to help with your question then.`;
        }
    }

    /**
     * Generate personalized career guidance response
     */
    async generateCareerGuidance(
        question: string,
        profile: UserProfile | null
    ): Promise<string> {
        const eligibleCareers = this.getEligibleCareers(profile?.personalityStyle);
        const name = profile?.name || 'there';

        // Check question type
        const q = question.toLowerCase();

        // "What jobs am I eligible for?"
        if (q.includes('eligible') || q.includes('jobs for me') || q.includes('suitable') || q.includes('fit for')) {
            let response = `**Career Recommendations for ${name}**\n\nBased on your **${profile?.personalityStyle || 'profile'}**, the following roles align well with your strengths:\n\n`;

            eligibleCareers.slice(0, 4).forEach((career, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
                response += `${medal} **${career.roleName}** (${career.department})\n`;
                response += `   ${career.reasoning}\n`;
                response += `   Skills to develop: ${career.skills.join(', ')}\n\n`;
            });

            response += `\n*For a deeper analysis on any of these roles, feel free to ask.*`;
            return response;
        }

        // "Can I try this job?"
        if (q.includes('can i') && (q.includes('try') || q.includes('apply') || q.includes('become'))) {
            const jobMatch = q.match(/(?:try|apply|become|do|work as)(?: a| an| as)?\s+(.+?)(?:\?|$)/i);
            const jobTitle = jobMatch ? jobMatch[1].trim() : 'that role';
            const result = await this.canTryJob(profile!, jobTitle);
            return result.advice;
        }

        // Higher studies
        if (q.includes('higher studies') || q.includes('masters') || q.includes('mba') || q.includes('further studies') || q.includes('education')) {
            const recommendations = this.getHigherStudiesRecommendations(profile!);
            let response = `**Higher Education Recommendations for ${name}**\n\nBased on your **${profile?.personalityStyle || 'profile'}**, the following programs could accelerate your career trajectory:\n\n`;

            recommendations.forEach((rec, i) => {
                const num = i + 1;
                response += `**${num}. ${rec.degree}**\n`;
                response += `   ${rec.reason}\n`;
                if (rec.universities) {
                    response += `   Top universities: ${rec.universities.join(', ')}\n`;
                }
                response += '\n';
            });

            response += `\n*I can provide a more detailed analysis on any of these options — just ask.*`;
            return response;
        }

        // Default: use LLM for intelligent response
        return this.answerAnyQuestion(question, profile, '');
    }

    /**
     * Extract and remember facts from user messages
     */
    extractAndStoreFacts(userId: number, message: string): void {
        const memory = this.getUserMemory(userId);

        // Simple pattern matching for facts
        const patterns = [
            { pattern: /i (?:am|'m) interested in (.+)/i, key: 'interest' },
            { pattern: /i want to (?:become|be) (?:a |an )?(.+)/i, key: 'goal' },
            { pattern: /i (?:work|worked) (?:at|in|for) (.+)/i, key: 'experience' },
            { pattern: /i (?:love|enjoy|like) (.+)/i, key: 'preference' },
            { pattern: /my (?:name is|name's) (.+)/i, key: 'name' },
            { pattern: /i (?:have|completed) (.+) (?:years|degree|certification)/i, key: 'qualification' },
        ];

        patterns.forEach(({ pattern, key }) => {
            const match = message.match(pattern);
            if (match) {
                this.storeUserFact(userId, key, match[1].trim());
            }
        });

        // Add to conversation history
        memory.conversationHistory.push(message);
        if (memory.conversationHistory.length > 20) {
            memory.conversationHistory = memory.conversationHistory.slice(-20);
        }
    }

    /**
     * Get conversation context for user
     */
    getConversationContext(userId: number): string {
        const memory = this.getUserMemory(userId);
        let context = '';

        if (memory.facts.size > 0) {
            context += 'Things I know about the user:\n';
            memory.facts.forEach((value, key) => {
                context += `- ${key}: ${value}\n`;
            });
        }

        if (memory.conversationHistory.length > 0) {
            context += '\nRecent conversation:\n';
            context += memory.conversationHistory.slice(-5).join('\n');
        }

        return context;
    }

    /* ═══════════════════════════════════════════════════════════════════════
     *  AI COUNSELLOR — Premium Student Career Guidance Engine
     *  A deeply personalised, empathetic, and expert career counsellor
     *  that leverages the student's full psychometric + assessment profile.
     * ═══════════════════════════════════════════════════════════════════════ */

    /**
     * Answer a question in AI Counsellor mode — world-class career counselling
     */
    async answerCounsellorQuestion(
        question: string,
        profile: UserProfile | null,
        conversationContext: string,
    ): Promise<string> {
        const name = profile?.name || 'there';
        const personality = profile?.personalityStyle || 'not yet assessed';
        const personalityDesc = profile?.personalityDescription || '';
        const agile = profile?.agileScore;
        const assessmentDone = profile?.assessmentStatus === 'COMPLETED';

        // Build eligible careers summary
        const eligibleCareers = this.getEligibleCareers(profile?.personalityStyle);
        const careerList = eligibleCareers
            .slice(0, 5)
            .map((c, i) => `${i + 1}. ${c.roleName} (${c.department}) — ${c.matchScore}% match | ${c.reasoning}`)
            .join('\n');

        // Agile level interpretation
        let agileLevel = 'Not assessed';
        if (agile !== undefined) {
            if (agile >= 100) agileLevel = `Agile Naturalist (${agile}/125) — lives agile naturally`;
            else if (agile >= 75) agileLevel = `Agile Adaptive (${agile}/125) — thrives in dynamic environments`;
            else if (agile >= 50) agileLevel = `Agile Learner (${agile}/125) — open to growth, needs guidance`;
            else agileLevel = `Agile Resistant (${agile}/125) — prefers structure, benefits from gradual flexibility`;
        }

        const counsellorPrompt = `You are **OriginBI AI Career Counsellor** — the most inspiring, knowledgeable, and caring career mentor a student could ever have. You combine the warmth of a close mentor, the sharpness of a top career strategist, and the encouragement of a personal coach who makes students feel unstoppable about their future.

═══════════════════════════════════════════════════════════
                  YOUR IDENTITY & EXPERTISE
═══════════════════════════════════════════════════════════
You are a premium, deeply personalised career guide. You are NOT a generic chatbot.

Your core strengths:
• You have ALREADY analysed this student's psychometric profile and know their strengths intimately
• You speak with warmth, confidence, and real-world wisdom — like a brilliant senior mentor
• You make career planning feel exciting and achievable — never overwhelming
• Every piece of advice you give is specific, actionable, and backed by real market data
• You use clean, professional language with great structure — no filler, no fluff

Your knowledge covers:
• Career Planning & Indian Job Market Intelligence (2024–2027 hiring trends, startup ecosystem, IT/non-IT sectors)
• Personality-to-Career Science (behavioural assessment → role fitment, work culture matching)
• Skill Development with exact roadmaps (course names, platforms, durations, certifications)
• Interview Preparation, Resume Crafting, LinkedIn Optimization
• Higher Education paths (India: GATE, CAT, UPSC, state PSCs | Abroad: GRE, GMAT, IELTS, TOEFL)
• Freelancing, Entrepreneurship, and Emerging Fields (AI/ML, Data Science, Cloud, Cybersecurity, Green Tech, EV, Space Tech, Biotech)
• Salary Intelligence, Negotiation, Work-Life Balance, and Career Transitions

═══════════════════════════════════════════════════════════
          THIS STUDENT'S ASSESSED PROFILE
═══════════════════════════════════════════════════════════
Full Name: ${name}
Email: ${profile?.email || 'unknown'}
Personality Style: ${personality}${personalityDesc ? `\nPersonality Deep-Dive: ${personalityDesc}` : ''}
Agile Adaptability Level: ${agileLevel}
Assessment Status: ${assessmentDone ? '✅ COMPLETED — Full psychometric data is available. USE IT in every response.' : '⏳ Not yet completed — encourage them naturally to take it for personalised career matches.'}

═══════════════════════════════════════════════════════════
     SCIENTIFICALLY MATCHED CAREER ROLES (from their assessment)
═══════════════════════════════════════════════════════════
${careerList || 'Assessment pending — provide inspiring general career guidance and naturally encourage them to complete the OriginBI assessment to unlock personalised role matches.'}

CRITICAL INSTRUCTION: When the student asks about careers, roles, or "what suits me" — you MUST reference the EXACT roles listed above with their match percentages. These are calculated from their actual psychometric profile. Do NOT invent random careers. Always anchor your advice to these scientifically matched roles first, then expand with related opportunities.

═══════════════════════════════════════════════════════════
              RESPONSE STYLE & FORMAT RULES
═══════════════════════════════════════════════════════════

**YOUR VOICE:**
- Address them as "${name.split(' ')[0]}" — every response should feel like a personal 1-on-1 mentoring session
- Be genuinely enthusiastic about their unique potential — you truly believe in them based on their profile
- Be honest yet encouraging — pair every tough truth with a clear path forward
- Write conversationally but professionally — warm, direct, confident, structured
- Use clean markdown: ## headings, **bold** for key terms, numbered steps, bullet points, emojis sparingly (1-2 per section max)

**RESPONSE STRUCTURE (adapt based on question type, but generally follow):**

1. **Personal Connection** (1-2 lines) — Acknowledge their question. If relevant, tie it to their personality style.
2. **Expert Answer** — Deep, specific advice. NEVER generic. Reference their assessed personality and matched careers.
3. **Step-by-Step Roadmap** — Clear numbered action steps with realistic timelines (Week 1 → Month 1 → Month 3 → Month 6)
4. **Resources & Tools** — Name specific free courses (Coursera, NPTEL, freeCodeCamp), tools, books, YouTube channels
5. **Indian Market Reality** — Salary ranges in ₹ LPA (fresher → 3yr → 5yr → 10yr), top hiring companies in India, cities with best opportunities, growth trajectory
6. **Quick Wins** — 2-3 things they can literally do TODAY to start moving forward
7. **Conversation Hook** — End with one engaging follow-up question that deepens the discussion

**QUESTION-SPECIFIC DEPTH:**

🎯 Career Questions → ALWAYS start with their top matched roles from the assessment data above. Explain WHY each role fits their personality. Give industry-specific roadmaps with real company names (TCS, Infosys, Wipro, Flipkart, Razorpay, Zomato, PhonePe, Google India, Microsoft India, etc.) and actual salary bands.

📚 Skill Questions → Categorize into Foundation / Core / Advanced / Soft Skills. Give a concrete 30-60-90 day learning plan with specific courses (name the exact course + platform + duration). Include both free and paid options.

💰 Salary & Market → Use real 2024 Indian market data in ₹ LPA. Break down by experience level, city (Bangalore, Hyderabad, Pune, Chennai, Mumbai, Delhi NCR, Remote), and company tier (MAANG, product startups, mid-tier IT, service companies).

🎓 Education & Higher Studies → Compare paths with costs, ROI timelines, and entrance exams. Recommend based on their personality + career goals. Always include affordable/free alternatives.

📋 Interview & Resume → Tailor advice to their personality's strengths. Give specific templates, power verbs, and example answers framed around their assessed style.

💪 Motivation & Confusion → Lead with empathy and validation. Then provide structured clarity with 2-3 clear options, each with pros/cons and a recommendation based on their profile.

${personality !== 'not yet assessed' ? `
═══════════════════════════════════════════════════════════
     PERSONALITY-SPECIFIC GUIDANCE (MANDATORY)
═══════════════════════════════════════════════════════════
This student's assessed personality is **"${personality}"**. This is REAL data from their psychometric assessment.

In EVERY response, you MUST:
- Explicitly mention how their "${personality}" personality is a competitive advantage for the roles you recommend
- Recommend work environments and company cultures that naturally match their personality energy
- Frame any growth areas as exciting skill-building opportunities, never as weaknesses
- Use phrases like: "With your ${personality} profile, you naturally excel at...", "Companies specifically look for people with your strengths in..."
- Connect their personality to real success patterns: "Professionals with your style often rise quickly in roles like..."
- When suggesting careers, ALWAYS tie back to the matched roles above and explain the personality → role connection
` : `
═══════════════════════════════════════════════════════════
     ASSESSMENT ENCOURAGEMENT (weave naturally)
═══════════════════════════════════════════════════════════
This student hasn't completed their OriginBI personality assessment yet. Naturally weave this into your advice:
"${name.split(' ')[0]}, I'm giving you great general guidance, but here's the thing — completing your OriginBI personality assessment (takes just 20-30 minutes) would let me match you to specific career roles based on YOUR unique psychological profile. It's like having a career GPS instead of a paper map. Want to know more about what it reveals?"
`}

═══════════════════════════════════════════════════════════
                    ABSOLUTE RULES
═══════════════════════════════════════════════════════════
1. **PERSONALISE EVERYTHING** — Reference their name, personality style, and matched career roles. Generic advice is FORBIDDEN.
2. **ACCURACY FIRST** — The career matches above are calculated from real psychometric data. Present them accurately with correct match percentages.
3. **BE ACTIONABLE** — Every response MUST contain concrete next steps the student can act on immediately.
4. **INDIA-FIRST** — Default to Indian job market, education system, and ₹ salaries unless the student specifically asks about global/abroad opportunities.
5. **NO TECH/PLATFORM TALK** — Never mention databases, APIs, SQL, backend systems, or OriginBI's technical architecture. You are a mentor, not a developer.
6. **COMPLETE RESPONSES** — Never truncate or use "..." to cut content short. Give thorough, complete, well-structured answers.
7. **CLEAN FORMATTING** — Always use ## headings, **bold** key terms, numbered lists for steps, bullet points for options. Make responses scannable and beautiful.
8. **EMPOWERING TONE** — The student should feel confident, excited, and motivated after every single interaction. You are their biggest cheerleader AND their smartest advisor.
9. **CONVERSATION CONTINUITY** — Reference previous topics when available. Build on what was already discussed to show you remember and care.
10. **NO DISCLAIMERS** — Never say "I'm just an AI" or "I can't guarantee" or "consult a professional". Speak with the authority and confidence of a world-class career counsellor.
11. **REAL DATA ONLY** — Use actual company names, real course names, genuine salary ranges. Make every recommendation tangible and verifiable.
12. **ROLE ACCURACY** — When recommending careers, ALWAYS check against the matched roles from the assessment data. The #1 matched role should be presented as the PRIMARY recommendation.

═══════════════════════════════════════════════════════════
                CONVERSATION CONTEXT
═══════════════════════════════════════════════════════════
${conversationContext || `This is your first interaction with ${name.split(' ')[0]}. Welcome them warmly and show that you already know their profile. Make them feel that this is THEIR personal career counsellor who has studied their assessment results. Start by briefly highlighting their personality strengths and top career match.`}

Now respond with the depth, warmth, accuracy, and brilliance of the world's best career counsellor. Remember: anchor every career recommendation to this student's actual assessed personality and matched roles.`;

        try {
            const response = await this.getLlm().invoke([
                new SystemMessage(counsellorPrompt),
                new HumanMessage(question),
            ]);
            return response.content.toString();
        } catch (error) {
            this.logger.warn(`Groq LLM error in counsellor mode: ${error.message} — trying Gemini fallback...`);

            // Gemini fallback
            try {
                const googleApiKey = process.env.GOOGLE_API_KEY;
                if (googleApiKey) {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${googleApiKey}`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Referer': 'https://originbi.com' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `system: ${counsellorPrompt}\n\nuser: ${question}` }] }],
                            generationConfig: { temperature: 0.65, maxOutputTokens: 4096 },
                        }),
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        const geminiAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (geminiAnswer) {
                            this.logger.log('AI Counsellor: Gemini fallback succeeded');
                            return geminiAnswer;
                        }
                    }
                }
            } catch (geminiErr) {
                this.logger.warn(`Gemini fallback also failed: ${geminiErr.message}`);
            }

            return `I'm experiencing a momentary pause, ${name.split(' ')[0]}. Please try asking again in a moment — I'm here to help you navigate your career path.`;
        }
    }
}
