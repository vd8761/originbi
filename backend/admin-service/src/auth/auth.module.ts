import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserEnrichmentService } from './user-enrichment.service';
import { CognitoUniversalGuard } from './cognito-universal.guard';
import { CognitoAdminGuard } from './cognito-auth.guard';

/**
 * AuthModule
 *
 * Provides authentication and user context enrichment services.
 * Import this module in any module that needs to:
 *   - Verify Cognito tokens
 *   - Enrich raw auth data into full UserContext (with DB IDs)
 *   - Use the CognitoUniversalGuard or CognitoAdminGuard
 */
@Module({
    imports: [ConfigModule],
    providers: [UserEnrichmentService, CognitoUniversalGuard, CognitoAdminGuard],
    exports: [UserEnrichmentService, CognitoUniversalGuard, CognitoAdminGuard],
})
export class AuthModule {}
