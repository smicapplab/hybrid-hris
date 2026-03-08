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
    isSupervisor?: boolean;
    isOrgLead?: boolean;
    roles: string[];
    firstName?: string | null;
    lastName?: string | null;
  }) {
    const user = await this.usersService.getUserFullProfile(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    const { isOrgLead, isSupervisor, isRootLeader } = user;
    
    // Dynamically inject roles based on structural status
    const dynamicRoles = [...payload.roles];
    if (isRootLeader && !dynamicRoles.includes('ADMIN')) {
        dynamicRoles.push('ADMIN');
    }
    if (isOrgLead && !dynamicRoles.includes('MANAGER')) {
        dynamicRoles.push('MANAGER');
    }
    if (isSupervisor && !dynamicRoles.includes('SUPERVISOR')) {
        dynamicRoles.push('SUPERVISOR');
    }

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId ?? null,
      orgUnitId: user.orgUnitId ?? null,
      isSupervisor,
      isOrgLead,
      isRootLeader,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      roles: dynamicRoles,
    };
  }
}
