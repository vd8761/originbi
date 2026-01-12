import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminListGroupsForUserCommand,
  ForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';


@Injectable()
export class CognitoService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('COGNITO_REGION');
    this.userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID') as string;
    this.clientId = this.config.get<string>('COGNITO_CLIENT_ID') as string;


    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.config.get<string>('AWS_SESSION_TOKEN');

    if (!this.userPoolId) throw new Error('COGNITO_USER_POOL_ID is not set');
    if (!region) throw new Error('COGNITO_REGION is not set');

    // ✅ REQUIRED for local
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in auth-service env file.',
      );
    }

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    });
  }

  async createUserWithPermanentPassword(
    email: string,
    password: string,
    groupName = 'STUDENT',
  ) {
    try {
      let username = email;
      let userSub: string | null = null;

      try {
        const createRes = await this.executeWithRetry(() => this.cognitoClient.send(
          new AdminCreateUserCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            UserAttributes: [
              { Name: 'email', Value: email },
              { Name: 'email_verified', Value: 'true' },
            ],
            MessageAction: 'SUPPRESS',
          }),
        ));

        username = createRes.User?.Username || email;
        userSub =
          createRes.User?.Attributes?.find((a) => a.Name === 'sub')?.Value ||
          null;
      } catch (err: any) {
        if (err?.name === 'UsernameExistsException') {
          username = email;
        } else {
          throw err;
        }
      }

      await this.executeWithRetry(() => this.cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.userPoolId,
          Username: username,
          Password: password,
          Permanent: true,
        }),
      ));

      if (groupName) {
        await this.executeWithRetry(() => this.cognitoClient.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: this.userPoolId,
            Username: username,
            GroupName: groupName,
          }),
        ));
      }

      if (!userSub) {
        try {
          const getUserRes = await this.executeWithRetry(() => this.cognitoClient.send(
            new AdminGetUserCommand({
              UserPoolId: this.userPoolId,
              Username: username,
            }),
          ));

          userSub =
            getUserRes.UserAttributes?.find((a) => a.Name === 'sub')?.Value ||
            null;
        } catch { }
      }

      return { sub: userSub ?? username, email, group: groupName };
    } catch (error: any) {
      console.error('[CognitoService] AWS error details:', {
        name: error?.name,
        message: error?.message,
      });

      if (error?.name === 'TooManyRequestsException' || error?.name === 'ThrottlingException') {
        throw new HttpException(
          'Too Many Requests - AWS Rate Limit Exceeded. Please wait a moment and try again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        `Cognito error: ${error?.name || 'Unknown'} - ${error?.message || 'No message'}`,
      );
    }
  }

  /**
   * Execute an AWS command with exponential backoff retry logic.
   * Handles ToolManyRequestsException and ThrottlingException.
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        const isThrottling =
          error?.name === 'TooManyRequestsException' ||
          error?.name === 'ThrottlingException';

        if (isThrottling && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s, 8s, 16s
          console.warn(
            `[CognitoService] Throttling detected. Retrying in ${delay}ms (Attempt ${attempt + 1}/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }

  /**
   * Authenticate user (Login)
   */
  /**
   * Authenticate user (Login)
   * Optional: Validate if user belongs to specific group
   */
  async login(email: string, password: string, requiredGroup?: string) {
    try {
      // 1. Authenticate using AdminInitiateAuth (bypasses ALLOW_USER_PASSWORD_AUTH client setting)
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.cognitoClient.send(command);

      // 2. If group check is required, verify groups
      if (requiredGroup) {
        const groupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: this.userPoolId,
          Username: email,
        });
        const groupsRes = await this.cognitoClient.send(groupsCommand);
        const groups = groupsRes.Groups?.map((g) => g.GroupName) || [];

        if (!groups.includes(requiredGroup)) {
          throw new InternalServerErrorException(
            `Access denied. User is not part of group '${requiredGroup}'.`,
          );
        }
      }

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn,
        tokenType: response.AuthenticationResult?.TokenType,
      };
    } catch (error: any) {
      console.error('[CognitoService] Login error details:', {
        name: error?.name,
        message: error?.message,
      });

      throw new InternalServerErrorException(
        `Login failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }
  /**
   * Initiate Forgot Password Flow
   */
  async forgotPassword(email: string) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error: any) {
      console.error('[CognitoService] ForgotPassword error:', error);
      throw new InternalServerErrorException(
        `Forgot Password failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
