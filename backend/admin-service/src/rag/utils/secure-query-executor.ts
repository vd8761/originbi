import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserContext } from '../../common/interfaces/user-context.interface';
import { AccessPolicyFactory, IAccessPolicy } from '../policies';
import { SecureQueryBuilder, QueryOptions } from './secure-query-builder';
import { AuditLoggerService } from '../audit/audit-logger.service';

/**
 * Query interpretation result from LLM
 */
export interface QueryInterpretation {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
}

/**
 * Secure Query Executor
 * Executes database queries with automatic role-based access control.
 * All queries are filtered based on the user's role and permissions.
 * 
 * This class should be used instead of direct database queries in the RAG service.
 */
@Injectable()
export class SecureQueryExecutor {
    private readonly logger = new Logger(SecureQueryExecutor.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly policyFactory: AccessPolicyFactory,
        private readonly auditLogger: AuditLoggerService,
    ) { }

    /**
     * Execute a query with role-based access control
     */
    async executeSecureQuery(
        interpretation: QueryInterpretation,
        user: UserContext
    ): Promise<{ data: any[]; redirected: boolean; redirectMessage?: string }> {
        const startTime = Date.now();

        // Step 1: Create access policy for this user
        const policy = this.policyFactory.createPolicy(user);
        this.logger.debug(`Policy created for role: ${policy.getRole()}`);

        // Step 2: Check if intent is allowed
        const allowedIntents = policy.getAllowedIntents();
        const isAllowed = allowedIntents.includes('*') || allowedIntents.includes(interpretation.intent);

        if (!isAllowed) {
            // Log the denied access
            await this.auditLogger.logAccessDenied(
                user.id,
                user.role,
                interpretation.intent,
                'Intent not in allowed list',
                interpretation.searchTerm || undefined
            );

            // Return friendly redirect message
            const redirectMessage = policy.getAccessDeniedMessage(interpretation.intent);
            return { data: [], redirected: true, redirectMessage };
        }

        // Step 3: Build secure query with policy filter
        const queryBuilder = new SecureQueryBuilder(policy, 'r');
        const sql = this.buildQueryForIntent(queryBuilder, interpretation, policy);

        // Step 4: Execute query
        try {
            this.logger.log(`🔒 Secure SQL: ${sql.substring(0, 100)}...`);
            const data = await this.dataSource.query(sql);

            // Step 5: Log the successful access
            await this.auditLogger.logQuery({
                timestamp: new Date(),
                userId: user.id,
                userRole: user.role,
                userEmail: user.email,
                corporateId: user.corporateId,
                action: 'RAG_QUERY',
                intent: interpretation.intent,
                query: interpretation.searchTerm || 'N/A',
                tablesAccessed: this.getTablesForIntent(interpretation.intent),
                recordsReturned: data.length,
                accessGranted: true,
                responseTime: Date.now() - startTime,
            });

            return { data, redirected: false };
        } catch (error) {
            this.logger.error(`Secure query failed: ${error.message}`);

            await this.auditLogger.logSecurityViolation(
                user.id,
                user.role,
                'QUERY_ERROR',
                error.message
            );

            return { data: [], redirected: false };
        }
    }

    /**
     * Build the appropriate query based on intent
     */
    private buildQueryForIntent(
        builder: SecureQueryBuilder,
        interpretation: QueryInterpretation,
        policy: IAccessPolicy
    ): string {
        const options: QueryOptions = {
            intent: interpretation.intent,
            searchTerm: interpretation.searchTerm || undefined,
            includePersonality: interpretation.includePersonality,
        };

        switch (interpretation.intent) {
            case 'list_users':
                // Special case: list_users should only be available to ADMIN
                // But the policy already handles this - for admin, return all users
                if (policy.getRole() === 'ADMIN') {
                    return `SELECT email, role, is_active, login_count 
                            FROM users 
                            WHERE is_active = true 
                            ORDER BY login_count DESC 
                            LIMIT 15`;
                }
                // For non-admin, this intent shouldn't reach here (policy blocks it)
                return builder.buildCandidateQuery(options);

            case 'list_candidates':
                return builder.buildCandidateQuery(options);

            case 'test_results':
            case 'best_performer':
                return builder.buildTestResultsQuery(options);

            case 'person_lookup':
                if (interpretation.searchTerm) {
                    return builder.buildSearchQuery(interpretation.searchTerm, options);
                }
                return builder.buildCandidateQuery(options);

            case 'career_roles':
                // Career roles are public knowledge - no filtering needed
                return `SELECT career_role_name, short_description 
                        FROM career_roles 
                        WHERE is_deleted = false AND is_active = true 
                        LIMIT 15`;

            case 'count':
                return builder.buildCountQuery(interpretation.table);

            default:
                // Default to candidate list with filtering
                return builder.buildCandidateQuery({ ...options, limit: 10 });
        }
    }

    /**
     * Get the tables accessed for a given intent (for audit logging)
     */
    private getTablesForIntent(intent: string): string[] {
        const tableMap: Record<string, string[]> = {
            'list_users': ['users'],
            'list_candidates': ['registrations', 'assessment_attempts'],
            'test_results': ['registrations', 'assessment_attempts', 'personality_traits'],
            'best_performer': ['registrations', 'assessment_attempts', 'personality_traits'],
            'person_lookup': ['registrations', 'assessment_attempts', 'personality_traits'],
            'career_roles': ['career_roles'],
            'count': ['registrations'],
        };
        return tableMap[intent] || ['registrations'];
    }

    /**
     * Check if a user can access a specific registration
     * Useful for report generation and individual record access
     */
    async canAccessRegistration(user: UserContext, registrationId: number): Promise<boolean> {
        const policy = this.policyFactory.createPolicy(user);
        const filter = policy.getFilter('r');

        const sql = `
            SELECT COUNT(*) as count 
            FROM registrations r 
            WHERE r.id = ${registrationId} AND ${filter}
        `;

        try {
            const result = await this.dataSource.query(sql);
            return result[0]?.count > 0;
        } catch (error) {
            this.logger.error(`Access check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get a specific candidate by ID with policy enforcement
     */
    async getSecureCandidate(user: UserContext, registrationId: number): Promise<any | null> {
        const policy = this.policyFactory.createPolicy(user);
        const queryBuilder = new SecureQueryBuilder(policy, 'r');
        const sql = queryBuilder.buildGetByIdQuery(registrationId);

        try {
            const result = await this.dataSource.query(sql);
            return result[0] || null;
        } catch (error) {
            this.logger.error(`Get candidate failed: ${error.message}`);
            return null;
        }
    }
}
