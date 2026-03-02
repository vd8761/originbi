import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * Affiliate Access Policy
 * Restricts data access to only the affiliate's own referral data, commissions, and payments.
 * Affiliates cannot see other users' assessment data — only their referral business data.
 */
export class AffiliateAccessPolicy implements IAccessPolicy {
    private user: UserContext;
    private affiliateId: number;
    private userName: string;

    constructor(user: UserContext) {
        if (!user.affiliateId) {
            throw new Error('Affiliate ID is required for AFFILIATE role. Check user authentication.');
        }
        this.user = user;
        this.affiliateId = user.affiliateId;
        this.userName = user.name || 'Partner';
    }

    /**
     * Affiliate filter — restricts to their own affiliate_account_id
     */
    getFilter(tableAlias: string = 'a'): string {
        return `${tableAlias}.affiliate_account_id = ${this.affiliateId}`;
    }

    /**
     * Affiliate allowed intents (referral & commission data only)
     */
    getAllowedIntents(): string[] {
        return [
            'greeting',
            'help',
            'affiliate_dashboard',       // Overview: referral count, commissions summary
            'affiliate_referrals',       // List referral transactions
            'affiliate_earnings',        // Commission/earnings details
            'affiliate_payments',        // Settlement/payment history
            'general_knowledge',         // General questions (routed to LLM)
            'data_query',                // Dynamic SQL queries (scoped to their referrals)
        ];
    }

    /**
     * Check if record belongs to this affiliate
     */
    canAccessRecord(record: any): boolean {
        const recordAffiliateId = record.affiliate_account_id || record.affiliateAccountId;
        return recordAffiliateId === this.affiliateId;
    }

    /**
     * Friendly redirect messages for affiliates
     */
    getAccessDeniedMessage(intent: string): string {
        const messages: Record<string, string> = {
            'list_users': `Hey ${this.userName}! I can help you track your referrals and earnings. Try asking "show my referrals" or "my earnings summary".`,
            'list_candidates': `I can show you the candidates you've referred, ${this.userName}! Try "show my referrals" to see them.`,
            'test_results': `Assessment results are not part of the affiliate panel. I can show you referral performance and earnings instead!`,
            'person_lookup': `I can only access your referral data, ${this.userName}. Would you like to see your referral transactions?`,
            'best_performer': `I can show you your top-earning referrals! Try "my top referrals" or "my earnings breakdown".`,
            'overall_report': `Reports are available for organizational use. I can show your referral and commission reports instead!`,
            'career_report': `Career reports aren't available in the affiliate panel. I can help with your referral dashboard and payment status!`,
            'default': `I'm your referral assistant, ${this.userName}! I can help with:\n• 📊 Referral dashboard\n• 💰 Earnings & commissions\n• 💳 Payment status & history\n\nTry asking "show my dashboard" or "my payment status"!`,
        };

        return messages[intent] || messages['default'];
    }

    getRole(): string {
        return 'AFFILIATE';
    }

    getUserContext(): UserContext {
        return this.user;
    }

    /**
     * Get the affiliate account ID for this policy
     */
    getAffiliateId(): number {
        return this.affiliateId;
    }

    /**
     * Get personalized quick prompts for affiliates
     */
    getQuickPrompts(): string[] {
        return [
            "Show my referral dashboard",
            "How many referrals do I have?",
            "My earnings summary",
            "Show my payment history",
            "What is my pending commission?",
            "List my recent referrals",
        ];
    }
}
