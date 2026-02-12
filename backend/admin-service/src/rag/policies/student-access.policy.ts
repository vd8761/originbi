import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * Student Access Policy
 * Restricts data access to only the student's own profile and results.
 * Students cannot see other users' data - only their personal information.
 */
export class StudentAccessPolicy implements IAccessPolicy {
    private user: UserContext;
    private userId: number;
    private userName: string;

    constructor(user: UserContext) {
        if (user.id === undefined || user.id === null) {
            throw new Error('User ID is required for STUDENT role. Check user authentication.');
        }
        this.user = user;
        this.userId = user.id;
        this.userName = user.name || 'there';
    }

    /**
     * Student filter - restricts to their own user_id only
     */
    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false AND ${tableAlias}.user_id = ${this.userId}`;
    }

    /**
     * Student allowed intents (personal data only)
     */
    getAllowedIntents(): string[] {
        return [
            'greeting',
            'help',
            'test_results',          // Their own results
            'career_report',         // Their own career report
            'career_guidance',       // Personalized guidance
            'job_eligibility',       // Check their eligibility
            'skill_development',     // Recommended skills
            'higher_studies',        // Education recommendations
            'personality_insights',  // Their DISC profile
        ];
    }

    /**
     * Check if record belongs to this student
     */
    canAccessRecord(record: any): boolean {
        const recordUserId = record.user_id || record.userId;
        return recordUserId === this.userId;
    }

    /**
     * Friendly redirect messages for students
     */
    getAccessDeniedMessage(intent: string): string {
        const messages: Record<string, string> = {
            'list_candidates': `Hey ${this.userName}! I can share your personal assessment results. Would you like to see your profile and career recommendations?`,
            'list_users': `I'm here to help you with your career journey, ${this.userName}! Let me show you your assessment results and personalized guidance.`,
            'person_lookup': `I can only access your personal data, ${this.userName}. Would you like to see your assessment results instead?`,
            'best_performer': `I can show you how you're performing, ${this.userName}! Want to see your scores and discover careers that match your personality?`,
            'overall_report': `Overall reports are for organizational use. But I can generate a detailed career report just for you! Shall I do that?`,
            'count': `I can tell you about your assessment progress! Would you like to see your completed tests and results?`,
            'default': `I'm your personal career assistant, ${this.userName}! I can help with your career guidance, job eligibility, and skill recommendations.`,
        };

        return messages[intent] || messages['default'];
    }

    getRole(): string {
        return 'STUDENT';
    }

    getUserContext(): UserContext {
        return this.user;
    }

    /**
     * Get the user ID for this policy
     */
    getUserId(): number {
        return this.userId;
    }

    /**
     * Get personalized quick prompts for students
     */
    getQuickPrompts(): string[] {
        return [
            "What careers suit my personality?",
            "Show me my assessment results",
            "Am I eligible for a project manager role?",
            "What skills should I develop?",
            "Generate my career report",
            "What are my strengths and weaknesses?",
        ];
    }
}
