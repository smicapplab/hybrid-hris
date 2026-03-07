import {
    pgTable,
    uuid,
    timestamp,
    numeric,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { orgUnits } from './org-units';
import { budgetPeriods } from './budget-periods';
import { expenseCategories } from './expense-categories';
import { expenseClaims } from './expense-claims';
import { orgUnitBudgets } from './org-unit-budgets';
import { BudgetLedgerEntryType } from '@hybrid-hris/domain';

export const budgetLedgerEntryTypeEnum = pgEnum('budget_ledger_entry_type', [
    BudgetLedgerEntryType.ALLOCATION,
    BudgetLedgerEntryType.CONSUMPTION,
    BudgetLedgerEntryType.ADJUSTMENT,
    BudgetLedgerEntryType.REVERSAL,
    BudgetLedgerEntryType.RESERVATION,
    BudgetLedgerEntryType.RELEASE,
]);

export const budgetLedger = pgTable(
    'budget_ledger',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        orgUnitId: uuid('org_unit_id')
            .notNull()
            .references(() => orgUnits.id),
        budgetPeriodId: uuid('budget_period_id')
            .notNull()
            .references(() => budgetPeriods.id),
        expenseCategoryId: uuid('expense_category_id')
            .notNull()
            .references(() => expenseCategories.id),
        
        entryType: budgetLedgerEntryTypeEnum('entry_type').notNull(),
        amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
        
        referenceExpenseClaimId: uuid('reference_expense_claim_id')
            .references(() => expenseClaims.id),
        referenceBudgetId: uuid('reference_budget_id')
            .references(() => orgUnitBudgets.id),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        orgUnitIdx: index('budget_ledger_org_unit_idx').on(t.orgUnitId),
        periodIdx: index('budget_ledger_period_idx').on(t.budgetPeriodId),
        categoryIdx: index('budget_ledger_category_idx').on(t.expenseCategoryId),
    }),
);
