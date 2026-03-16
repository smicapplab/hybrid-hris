import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ThirteenthMonthService } from './thirteenth-month.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('payroll/thirteenth-month')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'HR_ADMIN')
export class ThirteenthMonthController {
    constructor(private readonly thirteenthMonthService: ThirteenthMonthService) {}

    @Get('summary')
    async getSummary(@Query('year') year: string) {
        const currentYear = year || new Date().getFullYear().toString();
        return this.thirteenthMonthService.getAnnualSummary(currentYear);
    }

    @Get('details/:employeeId')
    async getDetails(@Param('employeeId') employeeId: string, @Query('year') year: string) {
        const currentYear = year || new Date().getFullYear().toString();
        return this.thirteenthMonthService.getEmployeeDetails(employeeId, currentYear);
    }
}
