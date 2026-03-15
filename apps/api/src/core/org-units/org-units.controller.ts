import {
    Controller,
    Get,
    Param,
    UseGuards,
    Post,
    Patch,
    Delete,
    Body,
    Query,
} from '@nestjs/common';
import { OrgUnitsService } from './org-units.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('org-units')
@UseGuards(JwtAuthGuard)
export class OrgUnitsController {
    constructor(private readonly service: OrgUnitsService) { }

    @Get()
    getFlat(
        @Query('showDeleted') showDeleted?: string,
        @Query('leavesOnly') leavesOnly?: string,
        @Query('search') search?: string,
    ) {
        const includeDeleted = showDeleted === 'true';
        const onlyLeaves = leavesOnly === 'true';
        return this.service.getFlat(includeDeleted, onlyLeaves, search);
    }

    @Get('tree')
    getTree(@Query('showDeleted') showDeleted?: string) {
        const includeDeleted = showDeleted === 'true';
        return this.service.getTree(includeDeleted);
    }

    @Get('search')
    searchLeafOrgUnits(
        @Query('query') query?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return this.service.searchLeafOrgUnits(query, parsedLimit);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.service.getById(id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    create(
        @Body() body: { name: string; code: string; parentId?: string | null },
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.createOrgUnit(body, actorId);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body()
        body: {
            name?: string;
            code?: string;
            parentId?: string | null;
            isActive?: boolean;
        },
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.updateOrgUnit(id, body, actorId);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    remove(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.softDeleteOrgUnit(id, actorId);
    }

    @Patch(':id/restore')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    restore(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.restoreOrgUnit(id, actorId);
    }

    @Get(':id/positions')
    getPositions(@Param('id') id: string) {
        return this.service.getPositionsForOrg(id);
    }

    @Post(':id/positions')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    addPosition(
        @Param('id') id: string,
        @Body() body: { positionId: string },
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.addPositionToOrg(id, body.positionId, actorId);
    }

    @Delete(':id/positions/:positionId')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    removePosition(
        @Param('id') id: string,
        @Param('positionId') positionId: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.removePositionFromOrg(id, positionId, actorId);
    }

    @Patch(':id/positions/:positionId/limit')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    updateLimit(
        @Param('id') id: string,
        @Param('positionId') positionId: string,
        @Body() body: { limit: number },
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.updatePositionLimit(id, positionId, body.limit, actorId);
    }

    /* ── Leaders ─────────────────────────────────────────────────────────────── */

    @Get(':id/leaders')
    getLeaders(@Param('id') id: string) {
        return this.service.getLeaders(id);
    }

    @Post(':id/leaders')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    addLeader(
        @Param('id') id: string,
        @Body() body: {
            employeeId: string;
            role: 'HEAD' | 'CO_HEAD' | 'ACTING_HEAD';
            isPrimary?: boolean;
            effectiveFrom?: string;
        },
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.addLeader(id, body, actorId);
    }

    @Delete(':id/leaders/:leaderId')
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    removeLeader(
        @Param('id') id: string,
        @Param('leaderId') leaderId: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.removeLeader(id, leaderId, actorId);
    }

    /* ── Members ─────────────────────────────────────────────────────────────── */

    @Get(':id/members')
    getMembers(@Param('id') id: string) {
        return this.service.getMembers(id);
    }

    @Get(':id/plantilla')
    getPlantilla(@Param('id') id: string) {
        return this.service.getPlantillaInventory(id);
    }
}
