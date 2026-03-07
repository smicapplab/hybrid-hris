import {
    pgTable,
    uuid,
    timestamp,
    numeric,
    date,
    varchar,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { orgUnits } from './org-units';
import { expenseCategories } from './expense-categories';
import { budgetPeriods } from './budget-periods';
import { ExpenseClaimStatus } from '@hybrid-hris/domain';

export const expenseClaimStatusEnum = pgEnum('expense_claim_status', [
    ExpenseClaimStatus.DRAFT,
    ExpenseClaimStatus.SUBMITTED,
    ExpenseClaimStatus.APPROVED,
    ExpenseClaimStatus.REJECTED,
    ExpenseClaimStatus.CANCELLED,
    ExpenseClaimStatus.REIMBURSED,
]);

export const expenseClaims = pgTable(
    'expense_claims',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id),
        orgUnitId: uuid('org_unit_id')
            .notNull()
            .references(() => orgUnits.id),
        expenseCategoryId: uuid('expense_category_id')
            .notNull()
            .references(() => expenseCategories.id),
        budgetPeriodId: uuid('budget_period_id')
            .notNull()
            .references(() => budgetPeriods.id),
        
        amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
        expenseDate: date('expense_date').notNull(),
        description: varchar('description', { length: 500 }).notNull(),
        
        status: expenseClaimStatusEnum('status').default(ExpenseClaimStatus.DRAFT).notNull(),
        
        submittedAt: timestamp('submitted_at', { withTimezone: true }),
        approvedAt: timestamp('approved_at', { withTimezone: true }),
        reimbursedAt: timestamp('reimbursed_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('expense_claims_employee_idx').on(t.employeeId),
        orgUnitIdx: index('expense_claims_org_unit_idx').on(t.orgUnitId),
        statusIdx: index('expense_claims_status_idx').on(t.status),
    }),
);
