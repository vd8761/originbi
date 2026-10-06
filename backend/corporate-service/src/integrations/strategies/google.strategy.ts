import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly integrationsService: IntegrationsService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.API_URL || 'http://localhost:3002'}/corporate/integrations/oauth/google/callback`,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/contacts.readonly',
      ],
      passReqToCallback: true,
    });
  }

  validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): any {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };

    // We can pass the request query state to the callback to identify the tenant
    request.oauthState = request.query.state;

    done(null, user);
  }
}
