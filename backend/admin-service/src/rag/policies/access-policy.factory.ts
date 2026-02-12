import { Injectable, Logger } from '@nestjs/common';
import { UserContext } from '../../common/interfaces/user-context.interface';
import { IAccessPolicy } from './access-policy.interface';
import { AdminAccessPolicy } from './admin-access.policy';
import { CorporateAccessPolicy } from './corporate-access.policy';
import { StudentAccessPolicy } from './student-access.policy';

/**
 * Access Policy Factory
 * Creates the appropriate access policy based on the user's role.
 * This implements the Factory Pattern for role-based access control.
 * 
 * @example
 * const policy = this.policyFactory.createPolicy(user);
 * const filter = policy.getFilter('r');
 * // Returns appropriate WHERE clause based on role
 */
@Injectable()
export class AccessPolicyFactory {
    private readonly logger = new Logger(AccessPolicyFactory.name);

    /**
     * Create an access policy for the given user
     * @param user - The authenticated user context
     * @returns The appropriate IAccessPolicy implementation
     * @throws Error if role is unknown
     */
    createPolicy(user: UserContext): IAccessPolicy {
        this.logger.debug(`Creating access policy for role: ${user.role}`);

        switch (user.role) {
            case 'ADMIN':
                this.logger.debug('Created AdminAccessPolicy');
                return new AdminAccessPolicy(user);

            case 'CORPORATE':
                if (!user.corporateId) {
                    this.logger.error('CORPORATE user missing corporateId');
                    throw new Error('Corporate ID is required for CORPORATE role');
                }
                this.logger.debug(`Created CorporateAccessPolicy for corporate: ${user.corporateId}`);
                return new CorporateAccessPolicy(user);

            case 'STUDENT':
                this.logger.debug(`Created StudentAccessPolicy for user: ${user.id}`);
                return new StudentAccessPolicy(user);

            default:
                this.logger.error(`Unknown role: ${user.role}`);
                throw new Error(`Unknown role: ${user.role}. Valid roles are: ADMIN, CORPORATE, STUDENT`);
        }
    }

    /**
     * Check if an intent is allowed for a given user
     * @param user - The authenticated user context
     * @param intent - The query intent to check
     * @returns true if allowed, false otherwise
     */
    isIntentAllowed(user: UserContext, intent: string): boolean {
        const policy = this.createPolicy(user);
        const allowedIntents = policy.getAllowedIntents();

        // Wildcard allows everything
        if (allowedIntents.includes('*')) {
            return true;
        }

        return allowedIntents.includes(intent);
    }

    /**
     * Get the data filter for a user
     * @param user - The authenticated user context
     * @param tableAlias - Table alias to use in the filter
     * @returns SQL WHERE clause
     */
    getDataFilter(user: UserContext, tableAlias: string = 'r'): string {
        const policy = this.createPolicy(user);
        return policy.getFilter(tableAlias);
    }
}
