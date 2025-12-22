import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminLoginService } from './adminlogin.service';
import { verifyCognitoIdToken } from '../auth/verify-id-token';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminLoginGuard implements CanActivate {
  constructor(
    private readonly adminLoginService: AdminLoginService,
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

    // 2) Load user from DB (syncing sub if needed)
    console.log(`[AdminLoginGuard] Resolving user: sub=${payload.sub}, email=${payload.email}`);
    const user = await this.adminLoginService.resolveUser(
      payload.sub,
      payload.email,
    );
    if (!user) {
      console.error(`[AdminLoginGuard] User not found for sub=${payload.sub} / email=${payload.email}`);
      throw new UnauthorizedException('User not found in system');
    }
    console.log(`[AdminLoginGuard] User found: id=${user.id}, role=${user.role}`);

    // 3) Check status + role
    if (!user.isActive || user.isBlocked) {
      throw new ForbiddenException('User is blocked or inactive');
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can access this portal');
    }

    // 4) Attach user
    req.user = user;
    return true;
  }
}
