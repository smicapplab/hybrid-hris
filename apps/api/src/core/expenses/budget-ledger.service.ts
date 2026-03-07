import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { budgetLedger } from '@hybrid-hris/db/schema';
import { BudgetLedgerEntryType } from '@hybrid-hris/domain';
import { and, eq, sql, sum } from 'drizzle-orm';
import { Tx } from 'src/database/database.types';

@Injectable()
export class BudgetLedgerService {
    constructor(private readonly db: DatabaseService) { }

    async createEntry(
        tx: Tx,
        data: {
            orgUnitId: string;
            budgetPeriodId: string;
            expenseCategoryId: string;
            entryType: BudgetLedgerEntryType;
            amount: string;
            referenceExpenseClaimId?: string;
            referenceBudgetId?: string;
        },
    ) {
        return tx.insert(budgetLedger).values({
            orgUnitId: data.orgUnitId,
            budgetPeriodId: data.budgetPeriodId,
            expenseCategoryId: data.expenseCategoryId,
            entryType: data.entryType,
            amount: data.amount,
            referenceExpenseClaimId: data.referenceExpenseClaimId ?? null,
            referenceBudgetId: data.referenceBudgetId ?? null,
        }).returning();
    }

    async getRemainingBudget(
        orgUnitId: string,
        budgetPeriodId: string,
        expenseCategoryId: string,
    ): Promise<number> {
        const [result] = await this.db.db
            .select({
                balance: sum(budgetLedger.amount),
            })
            .from(budgetLedger)
            .where(
                and(
                    eq(budgetLedger.orgUnitId, orgUnitId),
                    eq(budgetLedger.budgetPeriodId, budgetPeriodId),
                    eq(budgetLedger.expenseCategoryId, expenseCategoryId),
                ),
            );

        return parseFloat(result?.balance ?? '0');
    }
}
