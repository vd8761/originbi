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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request & { user?: any } = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // 1) Verify Cognito token
    let payload: { sub: string; email?: string; [key: string]: any };
    try {
      payload = await verifyCognitoIdToken(token, this.config);
    } catch {
      throw new UnauthorizedException('Invalid or expired Cognito token');
    }

    // 2) Load user from DB
    const user = await this.adminLoginService.findByCognitoSub(payload.sub);
    if (!user) throw new UnauthorizedException('User not found in system');

    // 3) Check status + role
    if (!user.isActive || user.isBlocked) {
      throw new ForbiddenException('User is blocked or inactive');
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can access this portal');
    }

    // 4) Attach user
    (req as any).user = user;
    return true;
  }
}
