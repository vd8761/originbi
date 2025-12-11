// backend/admin-service/src/auth/verify-id-token.ts
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!, // same as auth-service .env
  clientId: process.env.COGNITO_CLIENT_ID!,
  tokenUse: 'id',
});

export async function verifyCognitoIdToken(token: string) {
  try {
    const payload = await verifier.verify(token);
    return payload as {
      sub: string;
      email?: string;
      [key: string]: any;
    };
  } catch (err) {
    console.error('Cognito token verification failed (admin-service)', err);
    throw new Error('INVALID_COGNITO_TOKEN');
  }
}
