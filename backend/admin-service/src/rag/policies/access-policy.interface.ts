import { UserContext } from '../../common/interfaces/user-context.interface';

/**
 * Access Policy Interface
 * Defines the contract for role-based data access policies.
 * 
 * Each role (ADMIN, CORPORATE, STUDENT) will have its own implementation
 * that determines what data the user can access and what actions they can perform.
 */
export interface IAccessPolicy {
    /**
     * Get the SQL WHERE clause filter for this policy
     * @param tableAlias - The alias used for the main table in the query (default: 'r')
     * @returns SQL WHERE clause string
     */
    getFilter(tableAlias?: string): string;

    /**
     * Get list of intents allowed for this policy
     * @returns Array of allowed intent names, or ['*'] for all intents
     */
    getAllowedIntents(): string[];

    /**
     * Check if a specific database record is accessible under this policy
     * @param record - The database record to check
     * @returns true if accessible, false otherwise
     */
    canAccessRecord(record: any): boolean;

    /**
     * Get a user-friendly message when access is denied
     * @param intent - The intent that was denied
     * @returns Friendly redirect or denial message
     */
    getAccessDeniedMessage(intent: string): string;

    /**
     * Get the role associated with this policy
     * @returns Role name
     */
    getRole(): string;

    /**
     * Get the user context associated with this policy
     * @returns User context or undefined for admin
     */
    getUserContext(): UserContext | undefined;
}
