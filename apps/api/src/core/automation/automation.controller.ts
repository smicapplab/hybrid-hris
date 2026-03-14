import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';

@Controller('automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRole.ADMIN)
export class AutomationController {
    constructor(private readonly automationService: AutomationService) { }

    /**
     * Trigger holiday pay processing for a specific date.
     * Used by EventBridge (Lambda) or manual admin action.
     */
    @Post('process-holiday-pay')
    async processHolidayPay(@Body('date') date?: string) {
        // If no date provided, default to yesterday
        const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return this.automationService.processHolidayPay(targetDate);
    }

    /**
     * Trigger monthly leave accruals.
     */
    @Post('process-accruals')
    async processAccruals() {
        return this.automationService.processAccruals();
    }
}
