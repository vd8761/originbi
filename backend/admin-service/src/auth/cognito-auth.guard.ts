import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { verifyCognitoIdToken } from './verify-id-token';

@Injectable()
export class CognitoAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const auth = request.headers['authorization'];
    if (!auth) throw new UnauthorizedException('MISSING_TOKEN');

    const token = auth.replace('Bearer ', '');

    try {
      const payload = await verifyCognitoIdToken(token);

      // You can enforce ADMIN role like this:
      if (payload['custom:role'] !== 'ADMIN') {
        throw new UnauthorizedException('NOT_ADMIN');
      }

      request.user = payload; // attach user
      return true;
    } catch (err) {
      console.error('Token verify failed:', err);
      throw new UnauthorizedException('INVALID_COGNITO_TOKEN');
    }
  }
}
