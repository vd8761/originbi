'use client';

import { Amplify } from 'aws-amplify';

let isConfigured = false;

export function configureAmplify() {
  // Avoid configuring multiple times
  if (isConfigured) return;

  const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID;
  const identityPoolId = process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID;
  const oauthDomain = process.env.NEXT_PUBLIC_AWS_OAUTH_DOMAIN;
  const redirectSignIn = process.env.NEXT_PUBLIC_AUTH_REDIRECT_SIGNIN;
  const redirectSignOut = process.env.NEXT_PUBLIC_AUTH_REDIRECT_SIGNOUT;

  // Optional: basic runtime check to help you debug misconfigured envs
  if (!region || !userPoolId || !userPoolClientId) {
    console.warn(
      '[Amplify] Missing Cognito environment variables. ' +
        'Make sure NEXT_PUBLIC_COGNITO_REGION, NEXT_PUBLIC_COGNITO_USER_POOL_ID, ' +
        'NEXT_PUBLIC_COGNITO_APP_CLIENT_ID are set in .env.local'
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        region,
        userPoolId,
        userPoolClientId,
        identityPoolId,
        // `loginWith` MUST exist and be an object, so we define it directly
        loginWith: {
          // Allow username/email based logins (depending on how you set User Pool)
          username: true,
          email: true,
          // If you are not using Hosted UI, you can leave `oauth` blank or remove it
          ...(oauthDomain &&
            redirectSignIn &&
            redirectSignOut && {
              oauth: {
                domain: oauthDomain,
                scopes: ['email', 'openid', 'profile'],
                redirectSignIn: [redirectSignIn],
                redirectSignOut: [redirectSignOut],
                responseType: 'code',
              },
            }),
        },
      },
    },
  });

  isConfigured = true;
}
