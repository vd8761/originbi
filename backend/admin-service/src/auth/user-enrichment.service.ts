import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserContext } from '../common/interfaces/user-context.interface';

/**
 * UserEnrichmentService
 *
 * Bridges the gap between AWS Cognito token payload and the application's UserContext.
 *
 * Cognito tokens contain: { sub, email, custom:role }
 * Application needs:      { id, email, role, corporateId, name, registrationId }
 *
 * This service performs DB lookups to resolve numeric IDs from Cognito identifiers:
 *   1. cognito_sub → users.id, users.role
 *   2. If CORPORATE: users.id → corporate_accounts.id (corporateAccountId)
 *   3. If STUDENT: users.id → registrations.id (registrationId)
 */
@Injectable()
export class UserEnrichmentService {
    private readonly logger = new Logger(UserEnrichmentService.name);

    // In-memory cache: cognito_sub → UserContext (TTL-based)
    private cache = new Map<string, { context: UserContext; expiresAt: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(private readonly dataSource: DataSource) {
        this.logger.log('UserEnrichmentService initialized');
    }

    /**
     * Enrich a Cognito ID token payload into a full UserContext.
     *
     * @param cognitoPayload - Decoded Cognito ID token (sub, email, custom:role, etc.)
     * @returns Enriched UserContext with numeric DB IDs
     */
    async enrichFromCognito(cognitoPayload: {
        sub: string;
        email?: string;
        [key: string]: any;
    }): Promise<UserContext> {
        const cognitoSub = cognitoPayload.sub;
        const email = cognitoPayload.email || '';
        const cognitoRole = cognitoPayload['custom:role'] || 'STUDENT';

        // Check cache first
        const cached = this.cache.get(cognitoSub);
        if (cached && cached.expiresAt > Date.now()) {
            this.logger.debug(`Cache hit for user ${cognitoSub}`);
            return cached.context;
        }

        this.logger.debug(`Enriching user context for cognito_sub=${cognitoSub}, role=${cognitoRole}`);

        // Step 1: Look up the user in the DB by cognito_sub
        const userRow = await this.findUserByCognitoSub(cognitoSub, email);

        if (!userRow) {
            this.logger.warn(`No DB user found for cognito_sub=${cognitoSub}, email=${email}`);
            // Return a minimal context — the user exists in Cognito but not in our DB yet
            return {
                id: 0,
                email,
                role: this.normalizeRole(cognitoRole),
                cognitoSub,
                name: cognitoPayload.name || cognitoPayload['custom:name'] || email.split('@')[0],
            };
        }

        // Step 2: Build base UserContext from the users table row
        const userContext: UserContext = {
            id: Number(userRow.id),
            email: userRow.email || email,
            role: this.normalizeRole(userRow.role || cognitoRole),
            cognitoSub,
            name: cognitoPayload.name || cognitoPayload['custom:name'] || email.split('@')[0],
        };

        // Step 3: If CORPORATE, resolve the corporate_accounts.id
        if (userContext.role === 'CORPORATE') {
            const corporateAccountId = await this.findCorporateAccountId(userContext.id);
            if (corporateAccountId) {
                userContext.corporateId = corporateAccountId;
                this.logger.debug(`Resolved corporateAccountId=${corporateAccountId} for user ${userContext.id}`);
            } else {
                this.logger.warn(
                    `CORPORATE user ${userContext.id} has no corporate_accounts record. ` +
                    `They won't be able to access company-scoped data.`
                );
            }
        }

        // Step 4: If STUDENT, resolve the registration ID (most recent)
        if (userContext.role === 'STUDENT') {
            const regInfo = await this.findStudentRegistration(userContext.id);
            if (regInfo) {
                userContext.registrationId = regInfo.registrationId;
                // Use registration name if user row didn't have one
                if (!userContext.name || userContext.name === email.split('@')[0]) {
                    userContext.name = regInfo.fullName || userContext.name;
                }
                this.logger.debug(`Resolved registrationId=${regInfo.registrationId} for student ${userContext.id}`);
            }
        }

        // Cache the enriched context
        this.cache.set(cognitoSub, {
            context: userContext,
            expiresAt: Date.now() + this.CACHE_TTL,
        });

        this.logger.log(
            `Enriched user: id=${userContext.id}, role=${userContext.role}, ` +
            `corporateId=${userContext.corporateId || 'N/A'}, name=${userContext.name}`
        );

        return userContext;
    }

    /**
     * Enrich a user context from the X-User-Context header (legacy support).
     * Validates and enriches any user object from untrusted sources.
     *
     * @param rawUser - Raw user object from header/body
     * @returns Validated and enriched UserContext
     */
    async enrichFromHeader(rawUser: any): Promise<UserContext> {
        if (!rawUser || typeof rawUser !== 'object') {
            return this.getAnonymousContext();
        }

        const role = this.normalizeRole(rawUser.role);
        const userId = Number(rawUser.id) || 0;

        // If we have a userId, validate it against the DB
        if (userId > 0) {
            const userRow = await this.findUserById(userId);
            if (!userRow) {
                this.logger.warn(`Header user id=${userId} not found in DB`);
                return this.getAnonymousContext();
            }

            const userContext: UserContext = {
                id: Number(userRow.id),
                email: userRow.email || rawUser.email || '',
                role: this.normalizeRole(userRow.role),
                name: rawUser.name || rawUser.email?.split('@')[0] || 'User',
            };

            // Enrich corporate ID from DB (don't trust the header value)
            if (userContext.role === 'CORPORATE') {
                const corporateAccountId = await this.findCorporateAccountId(userContext.id);
                if (corporateAccountId) {
                    userContext.corporateId = corporateAccountId;
                }
            }

            if (userContext.role === 'STUDENT') {
                const regInfo = await this.findStudentRegistration(userContext.id);
                if (regInfo) {
                    userContext.registrationId = regInfo.registrationId;
                }
            }

            return userContext;
        }

        // No valid userId — return restricted context
        return {
            id: 0,
            email: rawUser.email || '',
            role,
            name: rawUser.name || 'Anonymous',
            corporateId: undefined,
        };
    }

    /**
     * Returns a default anonymous context with most-restricted access.
     */
    getAnonymousContext(): UserContext {
        return {
            id: 0,
            email: 'anonymous@student.com',
            role: 'STUDENT',
            name: 'Anonymous',
        };
    }

    /**
     * Clear the enrichment cache (useful for testing or forced refresh).
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.debug('User enrichment cache cleared');
    }

    /**
     * Remove a specific user from the cache.
     */
    evictFromCache(cognitoSub: string): void {
        this.cache.delete(cognitoSub);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRIVATE: Database Lookup Methods
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Find a user by their cognito_sub. Falls back to email lookup.
     */
    private async findUserByCognitoSub(
        cognitoSub: string,
        email: string,
    ): Promise<any> {
        try {
            // Primary lookup: by cognito_sub
            const rows = await this.dataSource.query(
                `SELECT id, email, role, corporate_id, cognito_sub
                 FROM users
                 WHERE cognito_sub = $1 AND is_active = true
                 LIMIT 1`,
                [cognitoSub],
            );

            if (rows.length > 0) {
                return rows[0];
            }

            // Fallback: lookup by email (handles cases where cognito_sub wasn't saved yet)
            if (email) {
                const emailRows = await this.dataSource.query(
                    `SELECT id, email, role, corporate_id, cognito_sub
                     FROM users
                     WHERE email = $1 AND is_active = true
                     LIMIT 1`,
                    [email],
                );

                if (emailRows.length > 0) {
                    // Update the cognito_sub for next time
                    await this.dataSource.query(
                        `UPDATE users SET cognito_sub = $1 WHERE id = $2`,
                        [cognitoSub, emailRows[0].id],
                    );
                    this.logger.log(`Linked cognito_sub=${cognitoSub} to user id=${emailRows[0].id}`);
                    return emailRows[0];
                }
            }

            return null;
        } catch (error) {
            this.logger.error(`DB lookup failed for cognito_sub=${cognitoSub}: ${error.message}`);
            return null;
        }
    }

    /**
     * Find a user by their numeric DB id.
     */
    private async findUserById(userId: number): Promise<any> {
        try {
            const rows = await this.dataSource.query(
                `SELECT id, email, role, corporate_id
                 FROM users
                 WHERE id = $1 AND is_active = true
                 LIMIT 1`,
                [userId],
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            this.logger.error(`DB lookup failed for userId=${userId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Find the corporate_accounts.id for a corporate user.
     * Lookup: corporate_accounts WHERE user_id = :userId
     */
    private async findCorporateAccountId(userId: number): Promise<number | null> {
        try {
            const rows = await this.dataSource.query(
                `SELECT id FROM corporate_accounts
                 WHERE user_id = $1 AND is_active = true
                 LIMIT 1`,
                [userId],
            );
            return rows.length > 0 ? Number(rows[0].id) : null;
        } catch (error) {
            this.logger.error(`Corporate account lookup failed for userId=${userId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Find the most recent registration for a student.
     * Lookup: registrations WHERE user_id = :userId ORDER BY created_at DESC
     */
    private async findStudentRegistration(
        userId: number,
    ): Promise<{ registrationId: number; fullName: string } | null> {
        try {
            const rows = await this.dataSource.query(
                `SELECT id, full_name FROM registrations
                 WHERE user_id = $1 AND is_deleted = false
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [userId],
            );
            if (rows.length > 0) {
                return {
                    registrationId: Number(rows[0].id),
                    fullName: rows[0].full_name,
                };
            }
            return null;
        } catch (error) {
            this.logger.error(`Registration lookup failed for userId=${userId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Normalize role string to valid UserContext role.
     */
    private normalizeRole(role: string): 'ADMIN' | 'CORPORATE' | 'STUDENT' {
        const upper = (role || '').toUpperCase().trim();
        if (upper === 'ADMIN' || upper === 'SUPER_ADMIN') return 'ADMIN';
        if (upper === 'CORPORATE') return 'CORPORATE';
        return 'STUDENT'; // Default to most restricted
    }
}
