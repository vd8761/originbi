import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * Admin Access Policy
 * Provides unrestricted access to all data in the system.
 * Admin users can view all companies, all candidates, and all reports.
 */
export class AdminAccessPolicy implements IAccessPolicy {
    private user: UserContext;

    constructor(user: UserContext) {
        this.user = user;
    }

    /**
     * Admin filter - only excludes deleted records
     */
    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false`;
    }

    /**
     * Admin can access all intents
     */
    getAllowedIntents(): string[] {
        return ['*']; // Wildcard - all intents allowed
    }

    /**
     * Admin can access any record
     */
    canAccessRecord(_record: any): boolean {
        return true;
    }

    /**
     * Admin never gets access denied (but just in case)
     */
    getAccessDeniedMessage(_intent: string): string {
        return 'This action is currently unavailable.';
    }

    getRole(): string {
        return 'ADMIN';
    }

    getUserContext(): UserContext {
        return this.user;
    }
}
