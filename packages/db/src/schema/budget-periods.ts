import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
    date,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { BudgetPeriodType } from '@hybrid-hris/domain';

export const budgetPeriodTypeEnum = pgEnum('budget_period_type', [
    BudgetPeriodType.MONTHLY,
    BudgetPeriodType.QUARTERLY,
    BudgetPeriodType.ANNUAL,
]);

export const budgetPeriods = pgTable(
    'budget_periods',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        periodStart: date('period_start').notNull(),
        periodEnd: date('period_end').notNull(),
        periodType: budgetPeriodTypeEnum('period_type').notNull(),
        isActive: boolean('is_active').default(true).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('budget_periods_code_uq').on(t.code),
    }),
);
