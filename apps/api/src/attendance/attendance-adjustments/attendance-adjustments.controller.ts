import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { AttendanceAdjustmentsService } from './attendance-adjustments.service'
import { CreateAttendanceAdjustmentDto } from './dto/create-attendance-adjustment.dto'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'

@UseGuards(AuthGuard('jwt'))
@Controller('attendance-adjustments')
export class AttendanceAdjustmentsController {
    constructor(
        private readonly attendanceAdjustmentsService: AttendanceAdjustmentsService,
    ) { }

    /* ============================================================
       READ
       ============================================================ */

    /** Return all adjustments for an employee (newest first). */
    @Get()
    async findAllByEmployee(@Query('employeeId') employeeId: string) {
        return this.attendanceAdjustmentsService.findAllByEmployee(employeeId)
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.attendanceAdjustmentsService.findById(id)
    }

    /* ============================================================
       SUBMIT A CORRECTION REQUEST
       ============================================================ */

    /**
     * Any authenticated user can submit a correction request on behalf of an employee.
     * The requestedBy is derived from the JWT so it cannot be spoofed.
     */
    @Post()
    async request(
        @Req() req: Request & { user: { sub: string } },
        @Body() body: CreateAttendanceAdjustmentDto,
    ) {
        const requestedBy = req.user.sub
        return this.attendanceAdjustmentsService.request(body, requestedBy)
    }

    /* ============================================================
       REVIEW ACTIONS (HR_ADMIN / ADMIN only)
       ============================================================ */

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post(':id/approve')
    async approve(
        @Param('id') id: string,
        @Req() req: Request & { user: { sub: string } },
    ) {
        const approverId = req.user.sub
        return this.attendanceAdjustmentsService.approve(id, approverId)
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN)
    @Post(':id/reject')
    async reject(
        @Param('id') id: string,
        @Req() req: Request & { user: { sub: string } },
    ) {
        const approverId = req.user.sub
        return this.attendanceAdjustmentsService.reject(id, approverId)
    }

    /* ============================================================
       CANCEL (any authenticated user — business rule: own requests only)
       ============================================================ */

    @Post(':id/cancel')
    async cancel(@Param('id') id: string) {
        return this.attendanceAdjustmentsService.cancel(id)
    }
}
