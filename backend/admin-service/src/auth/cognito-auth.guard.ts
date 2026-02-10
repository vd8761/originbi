import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { verifyCognitoIdToken } from './verify-id-token';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserEnrichmentService } from './user-enrichment.service';

/**
 * CognitoAdminGuard
 *
 * Strict guard for Admin-only endpoints.
 * Verifies Cognito token AND requires ADMIN role.
 * Enriches request.user with full UserContext from DB.
 */
@Injectable()
export class CognitoAdminGuard implements CanActivate {
  private readonly logger = new Logger(CognitoAdminGuard.name);

  constructor(
    private readonly config: ConfigService,
    private readonly userEnrichment: UserEnrichmentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, any> }>();
    const auth = request.headers.authorization;

    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    const token = auth.replace('Bearer ', '').trim();

    try {
      const payload = await verifyCognitoIdToken(token, this.config);

      if (payload['custom:role'] !== 'ADMIN') {
        throw new UnauthorizedException('NOT_ADMIN');
      }

      // Enrich with DB data for full UserContext
      const userContext = await this.userEnrichment.enrichFromCognito(payload);
      request.user = userContext;

      this.logger.debug(`Admin auth: user=${userContext.id}, email=${userContext.email}`);
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('Token verify failed:', err);
      throw new UnauthorizedException('INVALID_COGNITO_TOKEN');
    }
  }
}
