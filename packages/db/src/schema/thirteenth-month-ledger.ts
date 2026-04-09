import { pgTable, uuid, decimal, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { payslips } from './payslips';

export const thirteenthMonthLedger = pgTable(
    'thirteenth_month_ledger',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        employeeId: uuid('employee_id').notNull().references(() => employees.id),
        payslipId: uuid('payslip_id').notNull().references(() => payslips.id),
        
        // Month and Year of the accrual
        year: varchar('year', { length: 4 }).notNull(),
        month: varchar('month', { length: 2 }).notNull(),
        
        // 1/12 of the basic salary for that period
        accrualAmount: decimal('accrual_amount', { precision: 12, scale: 2 }).notNull(),
        
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        employeeIdx: index('thirteenth_month_ledger_employee_idx').on(t.employeeId),
        payslipIdx: index('thirteenth_month_ledger_payslip_idx').on(t.payslipId),
        yearMonthIdx: index('thirteenth_month_ledger_year_month_idx').on(t.year, t.month),
    })
);

export type ThirteenthMonthLedger = typeof thirteenthMonthLedger.$inferSelect;
export type NewThirteenthMonthLedger = typeof thirteenthMonthLedger.$inferInsert;
