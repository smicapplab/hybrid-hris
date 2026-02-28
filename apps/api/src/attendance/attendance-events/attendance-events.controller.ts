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
        @Req() req: Request & { user: { employeeId: string } },
        @Body() body: AuthenticatedAttendanceDto,
    ) {
        const employeeId = req.user.employeeId
        return this.attendanceEventsService.timeInAuthenticated(
            employeeId,
            body.source,
        )
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('time-out')
    async timeOutAuthenticated(
        @Req() req: Request & { user: { employeeId: string } },
        @Body() body: AuthenticatedAttendanceDto,
    ) {
        const employeeId = req.user.employeeId
        return this.attendanceEventsService.timeOutAuthenticated(
            employeeId,
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
