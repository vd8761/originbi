import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminLoginService } from './adminlogin.service';

// Path: admin-service/src/adminlogin → up to backend → auth-service/src/cognito
import { verifyCognitoIdToken } from '../../../auth-service/src/cognito/verify-id-token';

@Injectable()
export class AdminLoginGuard implements CanActivate {
  constructor(private readonly adminLoginService: AdminLoginService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request & { user?: any } = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify Cognito token via auth-service helper
    let payload: { sub: string; email?: string };
    try {
      payload = await verifyCognitoIdToken(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired Cognito token');
    }

    // 2. Load user from users table
    const user = await this.adminLoginService.findByCognitoSub(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found in system');
    }

    // 3. Check status + role
    if (!user.isActive || user.isBlocked) {
      throw new ForbiddenException('User is blocked or inactive');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can access this portal');
    }

    // 4. Attach user to request
    (req as any).user = user;
    return true;
  }
}
