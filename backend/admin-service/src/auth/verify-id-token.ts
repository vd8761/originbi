import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ConfigService } from '@nestjs/config';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier(config: ConfigService) {
  const userPoolId = config.get<string>('COGNITO_USER_POOL_ID');
  const clientId = config.get<string>('COGNITO_CLIENT_ID');

  if (!userPoolId || !clientId) {
    throw new Error('Missing env vars: COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID');
  }

  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
  }

  return verifier;
}

export async function verifyCognitoIdToken(token: string, config: ConfigService) {
  try {
    const payload = await getVerifier(config).verify(token);
    return payload as { sub: string; email?: string; [key: string]: any };
  } catch (err) {
    console.error('Cognito token verification failed', err);
    throw new Error('INVALID_COGNITO_TOKEN');
  }
}
