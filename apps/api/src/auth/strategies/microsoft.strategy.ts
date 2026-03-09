import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.MICROSOFT_CLIENT_ID || 'dummy',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'dummy',
      callbackURL: `${process.env.API_BASE_URL || 'http://localhost:4000'}/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Record<string, any>,
    done: (err: Error | null, user?: any) => void,
  ): Promise<void> {
    const { name, emails, id } = profile;
    const userProfile = {
      provider: 'MICROSOFT' as const,
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    };

    try {
      const user = await this.authService.validateOAuthUser(userProfile);
      done(null, user);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
