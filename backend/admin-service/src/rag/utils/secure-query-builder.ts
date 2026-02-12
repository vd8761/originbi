import { IAccessPolicy } from '../policies/access-policy.interface';
import { Logger } from '@nestjs/common';

/**
 * Query options for building secure database queries
 */
export interface QueryOptions {
    intent: string;
    searchTerm?: string;
    includePersonality?: boolean;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}

/**
 * Secure Query Builder
 * Builds type-safe, secure SQL queries with automatic role-based filtering.
 * All queries are automatically scoped based on the user's access policy.
 * 
 * @example
 * const policy = this.policyFactory.createPolicy(user);
 * const builder = new SecureQueryBuilder(policy);
 * const sql = builder.buildCandidateQuery({ intent: 'list_candidates' });
 */
export class SecureQueryBuilder {
    private readonly logger = new Logger(SecureQueryBuilder.name);
    private policy: IAccessPolicy;
    private tableAlias: string;

    constructor(policy: IAccessPolicy, tableAlias: string = 'r') {
        this.policy = policy;
        this.tableAlias = tableAlias;
    }

    /**
     * Build a query to list candidates with optional personality data
     */
    buildCandidateQuery(options: QueryOptions): string {
        const { limit = 15, includePersonality = false } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);

        const personalityFields = includePersonality
            ? `, pt.blended_style_name, pt.blended_style_desc`
            : '';

        const personalityJoin = includePersonality
            ? `LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id`
            : '';

        const sql = `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                ${this.tableAlias}.status,
                ${this.tableAlias}.mobile_number,
                aa.total_score,
                aa.status as assessment_status
                ${personalityFields}
            FROM registrations ${this.tableAlias}
            LEFT JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            ${personalityJoin}
            WHERE ${baseFilter}
            ORDER BY ${this.tableAlias}.created_at DESC
            LIMIT ${limit}
        `.trim();

        this.logger.debug(`Built candidate query for role: ${this.policy.getRole()}`);
        return sql;
    }

    /**
     * Build a search query for looking up specific candidates by name
     */
    buildSearchQuery(searchTerm: string, options: QueryOptions): string {
        const { limit = 10, includePersonality = true } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);
        const sanitizedTerm = this.sanitizeSearchTerm(searchTerm);

        if (!sanitizedTerm) {
            throw new Error('Search term is required for person lookup');
        }

        const sql = `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                ${this.tableAlias}.mobile_number,
                aa.total_score,
                aa.status as assessment_status,
                pt.blended_style_name
            FROM registrations ${this.tableAlias}
            LEFT JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND ${this.tableAlias}.full_name ILIKE '%${sanitizedTerm}%'
            ORDER BY ${this.tableAlias}.created_at DESC
            LIMIT ${limit}
        `.trim();

        this.logger.debug(`Built search query for term: "${sanitizedTerm}"`);
        return sql;
    }

    /**
     * Build a query for test results (completed assessments)
     */
    buildTestResultsQuery(options: QueryOptions): string {
        const { limit = 15 } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);

        const sql = `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                aa.total_score,
                aa.status,
                aa.completed_at,
                pt.blended_style_name,
                pt.blended_style_desc
            FROM registrations ${this.tableAlias}
            INNER JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND aa.status = 'COMPLETED'
            ORDER BY aa.total_score DESC
            LIMIT ${limit}
        `.trim();

        this.logger.debug(`Built test results query for role: ${this.policy.getRole()}`);
        return sql;
    }

    /**
     * Build a query for best performers
     */
    buildBestPerformerQuery(options: QueryOptions): string {
        const { limit = 5 } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);

        const sql = `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                aa.total_score,
                aa.completed_at,
                pt.blended_style_name
            FROM registrations ${this.tableAlias}
            INNER JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND aa.status = 'COMPLETED'
            ORDER BY aa.total_score DESC
            LIMIT ${limit}
        `.trim();

        this.logger.debug(`Built best performer query`);
        return sql;
    }

    /**
     * Build a query for counting records
     */
    buildCountQuery(countType: string = 'candidates'): string {
        const baseFilter = this.policy.getFilter(this.tableAlias);

        let sql: string;

        switch (countType) {
            case 'completed':
                sql = `
                    SELECT COUNT(DISTINCT ${this.tableAlias}.id) as count
                    FROM registrations ${this.tableAlias}
                    INNER JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
                    WHERE ${baseFilter}
                      AND aa.status = 'COMPLETED'
                `.trim();
                break;

            case 'pending':
                sql = `
                    SELECT COUNT(*) as count
                    FROM registrations ${this.tableAlias}
                    WHERE ${baseFilter}
                      AND ${this.tableAlias}.status = 'INCOMPLETE'
                `.trim();
                break;

            default:
                sql = `
                    SELECT COUNT(*) as count
                    FROM registrations ${this.tableAlias}
                    WHERE ${baseFilter}
                `.trim();
        }

        this.logger.debug(`Built count query for type: ${countType}`);
        return sql;
    }

    /**
     * Build a query to get a specific candidate by ID (with policy enforcement)
     */
    buildGetByIdQuery(registrationId: number): string {
        const baseFilter = this.policy.getFilter(this.tableAlias);

        const sql = `
            SELECT 
                ${this.tableAlias}.*,
                aa.total_score,
                aa.status as assessment_status,
                aa.completed_at,
                pt.blended_style_name,
                pt.blended_style_desc
            FROM registrations ${this.tableAlias}
            LEFT JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND ${this.tableAlias}.id = ${registrationId}
            LIMIT 1
        `.trim();

        this.logger.debug(`Built get-by-id query for registration: ${registrationId}`);
        return sql;
    }

    /**
     * Sanitize user input to prevent SQL injection
     * Removes special characters that could be used for injection
     */
    private sanitizeSearchTerm(term: string): string {
        if (!term || typeof term !== 'string') {
            return '';
        }
        // Remove SQL injection characters while preserving spaces and basic punctuation
        return term
            .replace(/[';"\-\-\/\*\\]/g, '')  // Remove SQL dangerous chars
            .replace(/[<>{}[\]]/g, '')         // Remove HTML/bracket chars
            .trim()
            .substring(0, 100);                // Limit length
    }

    /**
     * Get the current policy's role
     */
    getRole(): string {
        return this.policy.getRole();
    }

    /**
     * Get the current filter being applied
     */
    getCurrentFilter(): string {
        return this.policy.getFilter(this.tableAlias);
    }
}
