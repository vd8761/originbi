// backend/auth-service/src/cognito/verify-id-token.ts
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { cognitoConfig } from './cognito.config';

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: cognitoConfig.userPoolId,
  tokenUse: 'id',             // we expect ID token
  clientId: cognitoConfig.clientId,
});

export async function verifyCognitoIdToken(token: string) {
  try {
    const payload = await idTokenVerifier.verify(token);
    // payload has: sub, email, name, etc.
    return payload as {
      sub: string;
      email?: string;
      [key: string]: any;
    };
  } catch (err) {
    console.error('Cognito token verification failed', err);
    throw new Error('INVALID_COGNITO_TOKEN');
  }
}
