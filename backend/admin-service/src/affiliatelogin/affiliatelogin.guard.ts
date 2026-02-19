import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AffiliateLoginService } from './affiliatelogin.service';
import { verifyCognitoIdToken } from '../auth/verify-id-token';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AffiliateLoginGuard implements CanActivate {
    constructor(
        private readonly affiliateLoginService: AffiliateLoginService,
        private readonly config: ConfigService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req: Request & { user?: Record<string, any> } = context
            .switchToHttp()
            .getRequest();

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const token = authHeader.split(' ')[1];

        // 1) Verify Cognito token
        let payload: { sub: string; email?: string;[key: string]: any };
        try {
            payload = await verifyCognitoIdToken(token, this.config);
        } catch {
            throw new UnauthorizedException('Invalid or expired Cognito token');
        }

        // 2) Load user + affiliate from DB
        console.log(
            `[AffiliateLoginGuard] Resolving user: sub=${payload.sub}, email=${payload.email}`,
        );
        const result = await this.affiliateLoginService.resolveUser(
            payload.sub,
            payload.email,
        );
        if (!result) {
            console.error(
                `[AffiliateLoginGuard] Affiliate not found for sub=${payload.sub} / email=${payload.email}`,
            );
            throw new UnauthorizedException('Affiliate account not found');
        }

        const { user, affiliate } = result;
        console.log(
            `[AffiliateLoginGuard] Affiliate found: userId=${user.id}, affiliateId=${affiliate.id}, role=${user.role}`,
        );

        // 3) Check status
        if (!user.isActive || user.isBlocked) {
            throw new ForbiddenException('User is blocked or inactive');
        }
        if (!affiliate.isActive) {
            throw new ForbiddenException('Affiliate account is inactive');
        }

        // 4) Attach both user and affiliate to request
        req.user = {
            ...user,
            affiliateId: affiliate.id,
            affiliateAccount: affiliate,
        };
        return true;
    }
}
