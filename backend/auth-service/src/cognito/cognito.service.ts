import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoConfig } from './cognito.config';

@Injectable()
export class CognitoService {
  private client = new CognitoIdentityProviderClient({
    region: cognitoConfig.region,
  });

  async createUserWithPermanentPassword(email: string, password: string) {
    // 1) create user without sending email
    await this.client.send(
      new AdminCreateUserCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: email,
        TemporaryPassword: password,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
        ],
      }),
    );

    // 2) set permanent password
    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );

    // 3) get user's sub
    const user = await this.client.send(
      new AdminGetUserCommand({
        UserPoolId: cognitoConfig.userPoolId,
        Username: email,
      }),
    );

    const subAttr = user.UserAttributes?.find((a) => a.Name === 'sub');
    const sub = subAttr?.Value ?? null;

    return { sub };
  }
}
