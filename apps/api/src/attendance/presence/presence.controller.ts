import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/identity/users/users.types';
import { PresenceService } from './presence.service';

@Controller('attendance/presence')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN, SystemRole.MANAGER, SystemRole.SUPERVISOR)
export class PresenceController {
    constructor(private readonly presenceService: PresenceService) { }

    @Get()
    async getTeamPresence(@CurrentUser() user: User) {
        return this.presenceService.getTeamPresence(user);
    }
}
