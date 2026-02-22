import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles =
            this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: { roles?: string[] } }>();

        const user = request.user;

        if (!user || !Array.isArray(user.roles)) {
            throw new ForbiddenException('No roles found in token');
        }

        const roles = user.roles;

        const hasRole = requiredRoles.some((role) =>
            roles.includes(role),
        );

        if (!hasRole) {
            throw new ForbiddenException('Insufficient role');
        }

        return true;
    }
}