import { Controller, Post, Body, Get, UseGuards, Req, Param, Patch, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole, OvertimeStatus } from '@hybrid-hris/domain';
import { OvertimeRequestsService } from './overtime-requests.service';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { ProcessOvertimeRequestDto } from './dto/process-overtime-request.dto';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        employeeId: string | null;
        roles: string[];
    }
}

@UseGuards(JwtAuthGuard)
@Controller('attendance/overtime-requests')
export class OvertimeRequestsController {
    constructor(private readonly service: OvertimeRequestsService) { }

    @Post()
    async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateOvertimeRequestDto) {
        if (!req.user.employeeId) {
            throw new Error('User must have an associated employee record to request overtime');
        }
        return this.service.createRequest(req.user.employeeId, dto, req.user.id);
    }

    @Get('me')
    async getMyRequests(@Req() req: AuthenticatedRequest) {
        if (!req.user.employeeId) {
            return [];
        }
        return this.service.findEmployeeRequests(req.user.employeeId);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Get('pending')
    async findPending(@Req() req: AuthenticatedRequest) {
        return this.service.findAll({ status: 'PENDING', userId: req.user.id });
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Get()
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query('status') status?: OvertimeStatus,
        @Query('employeeId') employeeId?: string
    ) {
        return this.service.findAll({ status, employeeId, userId: req.user.id });
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Patch(':id/process')
    async process(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() dto: ProcessOvertimeRequestDto
    ) {
        if (!req.user.employeeId) {
            throw new Error('User must have an associated employee record to process overtime');
        }
        return this.service.processRequest(id, dto.status, req.user.employeeId, dto.rejectionReason, req.user.id);
    }
}
