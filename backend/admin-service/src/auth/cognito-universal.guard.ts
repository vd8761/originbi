import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyCognitoIdToken } from './verify-id-token';
import { UserEnrichmentService } from './user-enrichment.service';

/**
 * CognitoUniversalGuard
 *
 * Production-grade universal authentication guard that:
 *   1. Verifies the Cognito ID token (if present)
 *   2. Accepts ALL roles (ADMIN, CORPORATE, STUDENT)
 *   3. Enriches the token payload with DB lookups (userId, corporateAccountId, etc.)
 *   4. Sets request.user = fully enriched UserContext
 *
 * Auth resolution order (first match wins):
 *   Path 1: Authorization: Bearer <cognito-id-token>  → best security
 *   Path 2: X-User-Context header (JSON)              → validated via DB
 *   Path 3: request.body.user (frontend fallback)     → validated via DB
 *   Path 4: Existing request.user from middleware      → enriched
 *   Path 5: Anonymous STUDENT (most restricted)        → fallback
 *
 * Unlike CognitoAdminGuard, this guard never rejects based on role —
 * role-based restrictions are handled downstream by AccessPolicy.
 */
@Injectable()
export class CognitoUniversalGuard implements CanActivate {
    private readonly logger = new Logger(CognitoUniversalGuard.name);

    constructor(
        private readonly config: ConfigService,
        private readonly userEnrichment: UserEnrichmentService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: any }>();

        // ─── Path 1: Bearer token from Authorization header (best) ───
        const auth = request.headers.authorization;
        if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
            const token = auth.replace('Bearer ', '').trim();
            if (token.length > 20) {
                try {
                    const payload = await verifyCognitoIdToken(token, this.config);
                    const userContext = await this.userEnrichment.enrichFromCognito(payload);
                    request.user = userContext;
                    this.logger.debug(
                        `Auth[Bearer]: user=${userContext.id}, role=${userContext.role}, corp=${userContext.corporateId || 'N/A'}`
                    );
                    return true;
                } catch (err) {
                    this.logger.warn(`Cognito token failed: ${err.message} — falling through`);
                }
            }
        }

        // ─── Path 2: X-User-Context header (legacy / corporate / student frontend) ───
        const userContextHeader = request.headers['x-user-context'];
        if (userContextHeader && typeof userContextHeader === 'string') {
            try {
                const rawUser = JSON.parse(userContextHeader);
                if (rawUser && rawUser.id && rawUser.id > 0) {
                    const userContext = await this.userEnrichment.enrichFromHeader(rawUser);
                    request.user = userContext;
                    this.logger.debug(
                        `Auth[Header]: user=${userContext.id}, role=${userContext.role}, corp=${userContext.corporateId || 'N/A'}`
                    );
                    return true;
                }
            } catch (e) {
                this.logger.warn('Failed to parse X-User-Context header');
            }
        }

        // ─── Path 3: User object in request body (frontend sends { question, user }) ───
        const bodyUser = (request.body as any)?.user;
        if (bodyUser && typeof bodyUser === 'object' && bodyUser.id && bodyUser.id > 0) {
            try {
                const userContext = await this.userEnrichment.enrichFromHeader(bodyUser);
                request.user = userContext;
                this.logger.debug(
                    `Auth[Body]: user=${userContext.id}, role=${userContext.role}, corp=${userContext.corporateId || 'N/A'}`
                );
                return true;
            } catch (e) {
                this.logger.warn('Failed to enrich body user context');
            }
        }

        // ─── Path 4: User already set by upstream middleware/guard ───
        if (request.user && request.user.role && request.user.id > 0) {
            const enriched = await this.userEnrichment.enrichFromHeader(request.user);
            request.user = enriched;
            this.logger.debug(
                `Auth[Middleware]: user=${enriched.id}, role=${enriched.role}, corp=${enriched.corporateId || 'N/A'}`
            );
            return true;
        }

        // ─── Path 5: No authentication — anonymous with most restricted access ───
        request.user = this.userEnrichment.getAnonymousContext();
        this.logger.debug('Auth[Anonymous]: No credentials found → anonymous STUDENT context');
        return true;
    }
}
