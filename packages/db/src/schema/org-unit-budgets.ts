import {
    pgTable,
    uuid,
    timestamp,
    uniqueIndex,
    numeric,
} from 'drizzle-orm/pg-core';
import { orgUnits } from './org-units';
import { budgetPeriods } from './budget-periods';
import { expenseCategories } from './expense-categories';

export const orgUnitBudgets = pgTable(
    'org_unit_budgets',
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
        amountAllocated: numeric('amount_allocated', { precision: 12, scale: 2 })
            .notNull()
            .default('0.00'),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        orgUnitPeriodCategoryUq: uniqueIndex('org_unit_budgets_uq').on(
            t.orgUnitId,
            t.budgetPeriodId,
            t.expenseCategoryId,
        ),
    }),
);
