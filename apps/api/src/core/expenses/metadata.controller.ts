import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DatabaseService } from 'src/database/database.service';
import { expenseCategories, budgetPeriods } from '@hybrid-hris/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ExpenseCategory, BudgetPeriod } from '@hybrid-hris/db/types';

@UseGuards(JwtAuthGuard)
@Controller('expenses-metadata')
export class ExpensesMetadataController {
    constructor(private readonly db: DatabaseService) { }

    @Get('categories')
    async getCategories(): Promise<ExpenseCategory[]> {
        return this.db.db
            .select()
            .from(expenseCategories)
            .where(eq(expenseCategories.isActive, true))
            .orderBy(asc(expenseCategories.name));
    }

    @Get('periods')
    async getPeriods(): Promise<BudgetPeriod[]> {
        return this.db.db
            .select()
            .from(budgetPeriods)
            .where(eq(budgetPeriods.isActive, true))
            .orderBy(asc(budgetPeriods.periodStart));
    }
}
