import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common'
import { PendingShiftAssignmentsService } from './pending-shift-assignments.service'
import { CreateShiftAssignmentDto } from '../shift-assignments/dto/create-shift-assignment.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pending-shift-assignments')
export class PendingShiftAssignmentsController {
    constructor(private readonly service: PendingShiftAssignmentsService) { }

    @Get()
    async findByEmployee(
        @Query('employeeId') employeeId: string,
        @Query('status') status?: 'PENDING' | 'APPLIED' | 'CANCELLED'
    ) {
        return this.service.findByEmployee(employeeId, status)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async create(
        @Body() body: CreateShiftAssignmentDto,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.create(body, actorId)
    }

    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Delete(':id')
    async cancel(
        @Param('id') id: string,
        @CurrentUser('id') actorId: string,
    ) {
        return this.service.cancel(id, actorId)
    }
}
