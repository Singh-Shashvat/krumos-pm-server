import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EnvConfig } from '../../../core/config/env.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(envConfig: EnvConfig) {
    const oauthConfig = envConfig.googleOAuthConfig;
    super({
      clientID: oauthConfig.clientID || '',
      clientSecret: oauthConfig.secret || '',
      callbackURL: oauthConfig.callbackUrl || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    
    const user = {
      email: emails?.[0]?.value || '',
      name: name ? `${name.givenName || ''} ${name.familyName || ''}`.trim() : '',
      picture: photos?.[0]?.value || '',
    };
    
    done(null, user);
  }
}
