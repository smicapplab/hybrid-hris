import {
    Controller,
    Get,
    Param,
    Post,
    Query,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { AttendanceEventsService } from './attendance-events.service'
import { AuthenticatedAttendanceDto } from './dto/authenticated-attendance.dto'
import { PunchAttendanceDto } from './dto/punch-attendance.dto'

@Controller('attendance')
export class AttendanceEventsController {
    constructor(private readonly attendanceEventsService: AttendanceEventsService) { }

    /* ============================================================
       READ
       ============================================================ */

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async findAllByEmployee(@Query('employeeId') employeeId: string) {
        return this.attendanceEventsService.findAllByEmployee(employeeId)
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('status')
    async getTodayStatus(@Req() req: Request & { user: { employeeId: string } }) {
        return this.attendanceEventsService.getTodayStatus(req.user.employeeId)
    }

    @Get('employee-prefix')
    async getEmployeePrefix() {
        const prefix = await this.attendanceEventsService.getEmployeePrefix()
        return { prefix }
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.attendanceEventsService.findById(id)
    }

    /* ============================================================
       FLOW 1: AUTHENTICATED USER (LOGIN FIRST)
       ============================================================ */

    @UseGuards(AuthGuard('jwt'))
    @Post('time-in')
    async timeInAuthenticated(
        @Req() req: Request & { user: { id: string, employeeId: string } },
        @Body() body: AuthenticatedAttendanceDto,
    ) {
        return this.attendanceEventsService.timeInAuthenticated(
            req.user.id,
            req.user.employeeId,
            body.source,
        )
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('time-out')
    async timeOutAuthenticated(
        @Req() req: Request & { user: { id: string, employeeId: string } },
        @Body() body: AuthenticatedAttendanceDto,
    ) {
        return this.attendanceEventsService.timeOutAuthenticated(
            req.user.id,
            req.user.employeeId,
            body.source,
        )
    }

    /* ============================================================
       FLOW 2: KIOSK (EMPLOYEE NUMBER + PIN)
       ============================================================ */

    @Post('punch-in')
    async punchIn(@Body() body: PunchAttendanceDto) {
        return this.attendanceEventsService.punchIn(
            body.employeeNumber,
            body.pin,
            body.source,
        )
    }

    @Post('punch-out')
    async punchOut(@Body() body: PunchAttendanceDto) {
        return this.attendanceEventsService.punchOut(
            body.employeeNumber,
            body.pin,
            body.source,
        )
    }
}
