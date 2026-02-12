import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * Corporate Access Policy
 * Restricts data access to only employees belonging to the user's corporate account.
 * Corporate users can only see candidates registered under their company.
 */
export class CorporateAccessPolicy implements IAccessPolicy {
    private user: UserContext;
    private corporateId: number;

    constructor(user: UserContext) {
        if (!user.corporateId) {
            throw new Error('Corporate ID is required for CORPORATE role. Check user authentication.');
        }
        this.user = user;
        this.corporateId = user.corporateId;
    }

    /**
     * Corporate filter - restricts to their corporate_account_id
     */
    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false AND ${tableAlias}.corporate_account_id = ${this.corporateId}`;
    }

    /**
     * Corporate allowed intents (no system-wide user listing)
     */
    getAllowedIntents(): string[] {
        return [
            'greeting',
            'help',
            'list_candidates',       // Their candidates only
            'test_results',          // Their candidates' results
            'person_lookup',         // Search within their company
            'career_report',         // Generate for their candidates
            'best_performer',        // Best in their company
            'career_guidance',       // General guidance
            'overall_report',        // Their company report
            'count',                 // Count their candidates
        ];
    }

    /**
     * Check if record belongs to this corporate account
     */
    canAccessRecord(record: any): boolean {
        const recordCorporateId = record.corporate_account_id || record.corporateAccountId;
        return recordCorporateId === this.corporateId;
    }

    /**
     * Friendly messages for corporate users when denied
     */
    getAccessDeniedMessage(intent: string): string {
        const companyName = this.user.name || 'your organization';

        const messages: Record<string, string> = {
            'list_users': `I can only show you candidates from ${companyName}. Try asking 'list my candidates' instead.`,
            'person_lookup_failed': `I couldn't find that person in ${companyName}. They may be registered under a different company.`,
            'default': `You can only access data from ${companyName}. Let me show you what's available for your organization.`,
        };

        return messages[intent] || messages['default'];
    }

    getRole(): string {
        return 'CORPORATE';
    }

    getUserContext(): UserContext {
        return this.user;
    }

    /**
     * Get the corporate ID for this policy
     */
    getCorporateId(): number {
        return this.corporateId;
    }
}
