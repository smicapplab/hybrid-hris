import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { orgUnitBudgets } from '@hybrid-hris/db/schema';
import { OrgUnitBudget } from '@hybrid-hris/db/types';
import { BudgetLedgerEntryType } from '@hybrid-hris/domain';
import { and, eq } from 'drizzle-orm';
import { BudgetLedgerService } from './budget-ledger.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BudgetsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly ledgerService: BudgetLedgerService,
        private readonly auditService: AuditService,
    ) { }

    async allocateBudget(
        actorId: string,
        data: {
            orgUnitId: string;
            budgetPeriodId: string;
            expenseCategoryId: string;
            amount: string;
        },
    ): Promise<OrgUnitBudget> {
        return this.db.withTransaction(async (tx) => {
            // 1. Upsert the budget allocation record
            const [existing] = await tx
                .select()
                .from(orgUnitBudgets)
                .where(
                    and(
                        eq(orgUnitBudgets.orgUnitId, data.orgUnitId),
                        eq(orgUnitBudgets.budgetPeriodId, data.budgetPeriodId),
                        eq(orgUnitBudgets.expenseCategoryId, data.expenseCategoryId),
                    )
                )
                .limit(1);

            let budgetId: string;
            let ledgerAmount: string;
            let action: 'budget.allocate' | 'budget.update' = 'budget.allocate';

            if (existing) {
                const diff = parseFloat(data.amount) - parseFloat(existing.amountAllocated);
                if (diff === 0) return existing;

                const [updated] = await tx
                    .update(orgUnitBudgets)
                    .set({
                        amountAllocated: data.amount,
                        updatedAt: new Date(),
                    })
                    .where(eq(orgUnitBudgets.id, existing.id))
                    .returning();

                budgetId = updated.id;
                ledgerAmount = diff.toString();
                action = 'budget.update';

                await this.ledgerService.createEntry(tx, {
                    orgUnitId: data.orgUnitId,
                    budgetPeriodId: data.budgetPeriodId,
                    expenseCategoryId: data.expenseCategoryId,
                    entryType: BudgetLedgerEntryType.ADJUSTMENT,
                    amount: ledgerAmount,
                    referenceBudgetId: budgetId,
                });

                await this.auditService.log({
                    userId: actorId,
                    action,
                    entityType: 'org_unit_budget',
                    entityId: budgetId,
                    oldValue: existing,
                    newValue: updated,
                });

                return updated;
            } else {
                const [inserted] = await tx
                    .insert(orgUnitBudgets)
                    .values({
                        orgUnitId: data.orgUnitId,
                        budgetPeriodId: data.budgetPeriodId,
                        expenseCategoryId: data.expenseCategoryId,
                        amountAllocated: data.amount,
                    })
                    .returning();

                budgetId = inserted.id;
                ledgerAmount = data.amount;

                await this.ledgerService.createEntry(tx, {
                    orgUnitId: data.orgUnitId,
                    budgetPeriodId: data.budgetPeriodId,
                    expenseCategoryId: data.expenseCategoryId,
                    entryType: BudgetLedgerEntryType.ALLOCATION,
                    amount: ledgerAmount,
                    referenceBudgetId: budgetId,
                });

                await this.auditService.log({
                    userId: actorId,
                    action,
                    entityType: 'org_unit_budget',
                    entityId: budgetId,
                    newValue: inserted,
                });

                return inserted;
            }
        });
    }

    async getBudgets(filters: { orgUnitId?: string; budgetPeriodId?: string }): Promise<OrgUnitBudget[]> {
        const conditions = [];
        if (filters.orgUnitId) conditions.push(eq(orgUnitBudgets.orgUnitId, filters.orgUnitId));
        if (filters.budgetPeriodId) conditions.push(eq(orgUnitBudgets.budgetPeriodId, filters.budgetPeriodId));

        return this.db.db
            .select()
            .from(orgUnitBudgets)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    async getRemainingBudget(orgUnitId: string, budgetPeriodId: string, categoryId: string): Promise<number> {
        return this.ledgerService.getRemainingBudget(orgUnitId, budgetPeriodId, categoryId);
    }
}
