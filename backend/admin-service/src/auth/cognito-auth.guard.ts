import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyCognitoIdToken } from './verify-id-token';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CognitoAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const auth = request.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    const token = auth.replace('Bearer ', '').trim();

    try {
      const payload = await verifyCognitoIdToken(token, this.config);

      if (payload['custom:role'] !== 'ADMIN') {
        throw new UnauthorizedException('NOT_ADMIN');
      }

      request.user = payload;
      return true;
    } catch (err) {
      console.error('Token verify failed:', err);
      throw new UnauthorizedException('INVALID_COGNITO_TOKEN');
    }
  }
}
