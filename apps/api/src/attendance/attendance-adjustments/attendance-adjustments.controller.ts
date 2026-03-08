import { Controller, Post, Body, Get, UseGuards, Req, Param, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { AttendanceAdjustmentsService } from './attendance-adjustments.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { CreateAdjustmentDto, ActOnAdjustmentDto } from './dto/create-adjustment.dto';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        employeeId: string | null;
        roles: string[];
    }
}

@UseGuards(JwtAuthGuard)
@Controller('attendance-adjustments')
export class AttendanceAdjustmentsController {
    constructor(private readonly service: AttendanceAdjustmentsService) { }

    @Post()
    async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAdjustmentDto) {
        return this.service.createRequest(req.user.id, req.user.employeeId!, dto);
    }

    @Patch(':id')
    async update(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() dto: Partial<CreateAdjustmentDto>
    ) {
        return this.service.updateRequest(req.user.id, id, dto);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Get('pending')
    async getPending(@Req() req: AuthenticatedRequest) {
        return this.service.getPendingForApproval(req.user.id);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Patch(':id/approve')
    async approve(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() dto: ActOnAdjustmentDto
    ) {
        return this.service.approve(req.user.id, id, dto.remarks);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.SUPERVISOR, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Patch(':id/reject')
    async reject(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() dto: ActOnAdjustmentDto
    ) {
        return this.service.reject(req.user.id, id, dto.remarks);
    }
}
