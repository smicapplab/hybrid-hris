import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    UnprocessableEntityException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request } from 'express'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { SystemRole } from '@hybrid-hris/domain'
import { LeaveRequestsService } from './leave-requests.service'
import { ActOnLeaveRequestDto, CreateLeaveRequestDto, LeaveRequestFilterDto } from './dto/create-leave-request.dto'

type AuthRequest = Request & {
    user: { id: string; email: string; employeeId: string | null; roles: string[] }
}

@UseGuards(AuthGuard('jwt'))
@Controller('leave-requests')
export class LeaveRequestsController {
    constructor(private readonly service: LeaveRequestsService) { }

    // ── Employee (self-service) ──────────────────────────────

    /** My leave requests — last 12 months */
    @Get('my')
    async getMyRequests(@Req() req: AuthRequest) {
        this.requireEmployee(req)
        return this.service.getMyRequests(req.user.employeeId!)
    }

    /** My leave balance per leave type */
    @Get('my/balance')
    async getMyBalance(@Req() req: AuthRequest) {
        this.requireEmployee(req)
        return this.service.getMyBalance(req.user.employeeId!)
    }

    /** My upcoming leaves (for dashboard widget) */
    @Get('my/upcoming')
    async getMyUpcoming(@Req() req: AuthRequest) {
        this.requireEmployee(req)
        return this.service.getMyUpcoming(req.user.employeeId!)
    }

    /** Submit a new leave request */
    @Post('my')
    async create(@Req() req: AuthRequest, @Body() body: CreateLeaveRequestDto) {
        this.requireEmployee(req)
        return this.service.create(req.user.id, req.user.employeeId!, body)
    }

    /** Cancel own leave request */
    @Patch('my/:id/cancel')
    async cancel(@Req() req: AuthRequest, @Param('id') id: string) {
        this.requireEmployee(req)
        return this.service.cancel(req.user.employeeId!, id)
    }

    // ── Approver ────────────────────────────────────────────

    /** Pending requests awaiting my approval */
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER)
    @Get('pending-approval')
    async getPendingForApproval(@Req() req: AuthRequest, @Query() query: LeaveRequestFilterDto) {
        return this.service.getPendingForApproval(req.user.id, query)
    }

    /** All requests (past and pending) for my team */
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER)
    @Get('team-history')
    async getTeamHistory(@Req() req: AuthRequest, @Query() query: LeaveRequestFilterDto) {
        return this.service.getTeamHistory(req.user.id, query)
    }

    /** Upcoming approved team leaves (approver dashboard) */
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER)
    @Get('upcoming-team')
    async getUpcomingTeamLeaves(@Req() req: AuthRequest) {
        return this.service.getUpcomingTeamLeaves(req.user.id)
    }

    /** Approve a leave request */
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER)
    @Patch(':id/approve')
    async approve(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: ActOnLeaveRequestDto,
    ) {
        return this.service.approve(req.user.id, id, body)
    }

    /** Reject a leave request */
    @UseGuards(RolesGuard)
    @Roles(SystemRole.HR_ADMIN, SystemRole.ADMIN, SystemRole.MANAGER)
    @Patch(':id/reject')
    async reject(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: ActOnLeaveRequestDto,
    ) {
        return this.service.reject(req.user.id, id, body)
    }

    // ── private helpers ─────────────────────────────────────

    private requireEmployee(req: AuthRequest): void {
        if (!req.user.employeeId) {
            throw new UnprocessableEntityException(
                'No employee record linked to this account',
            )
        }
    }
}
