import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const userProfile = {
      provider: 'GOOGLE' as const,
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    };

    try {
      const user = await this.authService.validateOAuthUser(userProfile);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
