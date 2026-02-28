import { Controller, Get, Param, Post, Put, Query, Body, UseGuards } from '@nestjs/common'
import { ShiftAssignmentsService } from './shift-assignments.service'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { UpdateShiftAssignmentDto } from './dto/update-shift-assignment.dto'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-assignments')
export class ShiftAssignmentsController {
    constructor(private readonly shiftAssignmentsService: ShiftAssignmentsService) { }

    /** Return the employee's current shift assignment (1:1). */
    @Get()
    async findByEmployee(@Query('employeeId') employeeId: string) {
        return this.shiftAssignmentsService.findByEmployee(employeeId)
    }

    /** Return the assignment only if it is active for the given work date and day-of-week. */
    @Get('active')
    async findActiveForDate(
        @Query('employeeId') employeeId: string,
        @Query('workDate') workDate: string,
    ) {
        return this.shiftAssignmentsService.findActiveForDate(employeeId, workDate)
    }

    /**
     * Assign (or reassign) a shift to an employee.
     * Idempotent: calling this again with a new template replaces the current assignment.
     */
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post()
    async assign(@Body() body: CreateShiftAssignmentDto) {
        return this.shiftAssignmentsService.assign(body)
    }

    /** Partially patch the current assignment without swapping the template. */
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Put(':employeeId')
    async update(
        @Param('employeeId') employeeId: string,
        @Body() body: UpdateShiftAssignmentDto,
    ) {
        return this.shiftAssignmentsService.update(employeeId, body)
    }
}
