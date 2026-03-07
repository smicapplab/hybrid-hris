import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { LeaveAccrualsService } from './leave-accruals.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('leave-accruals')
export class LeaveAccrualsController {
    constructor(private readonly service: LeaveAccrualsService) { }

    @Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Post('process-monthly')
    async processMonthly(@Body() body: { year: number; month: number }) {
        return this.service.processMonthlyAccruals(body.year, body.month);
    }
}
