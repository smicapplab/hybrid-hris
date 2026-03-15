import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { BudgetsService } from './budgets.service';
import { AllocateBudgetDto } from './dto/allocate-budget.dto';
import { OrgUnitBudget } from '@hybrid-hris/db/types';
import { Request } from 'express';

type AuthRequest = Request & {
    user: { id: string; };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly service: BudgetsService) { }

    @Roles(SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Post('allocate')
    async allocate(
        @Req() req: AuthRequest,
        @Body() dto: AllocateBudgetDto
    ): Promise<OrgUnitBudget> {
        return this.service.allocateBudget(req.user.id, dto);
    }

    @Get()
    async getBudgets(@Query() filters: { orgUnitId?: string; budgetPeriodId?: string }): Promise<OrgUnitBudget[]> {
        return this.service.getBudgets(filters);
    }

    @Get('remaining')
    async getRemaining(
        @Query('orgUnitId') orgUnitId: string,
        @Query('budgetPeriodId') budgetPeriodId: string,
        @Query('expenseCategoryId') categoryId: string,
    ): Promise<{ balance: number }> {
        const balance = await this.service.getRemainingBudget(orgUnitId, budgetPeriodId, categoryId);
        return { balance };
    }
}
