import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../identity/users/users.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    employeeId?: string | null;
    roles: string[];
    firstName?: string | null;
    lastName?: string | null;
  }) {
    const user = await this.usersService.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      // Re-fetch employeeId from the DB rather than trusting the token — ensures
      // the value is current if the employee link changed since the token was issued.
      employeeId: user.employeeId ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      roles: payload.roles,
    };
  }
}
