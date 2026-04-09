import {
    pgTable,
    uuid,
    varchar,
    decimal,
    timestamp,
    text,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { payrollBatches } from './payroll-batches';
import { payrollComponents } from './payroll-components';

export const payslipItemTypeEnum = pgEnum('payslip_item_type', [
    'EARNING',
    'DEDUCTION',
    'EMPLOYER_COST',
]);

export const payslips = pgTable(
    'payslips',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        batchId: uuid('batch_id').references(() => payrollBatches.id, { onDelete: 'cascade' }).notNull(),
        employeeId: uuid('employee_id').references(() => employees.id).notNull(),

        grossPay: decimal('gross_pay', { precision: 15, scale: 2 }).default('0.00').notNull(),
        netPay: decimal('net_pay', { precision: 15, scale: 2 }).default('0.00').notNull(),
        totalDeductions: decimal('total_deductions', { precision: 15, scale: 2 }).default('0.00').notNull(),

        remarks: text('remarks'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        batchIdx: index('payslips_batch_idx').on(t.batchId),
        employeeIdx: index('payslips_employee_idx').on(t.employeeId),
    }),
);

export const payslipItems = pgTable(
    'payslip_items',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        payslipId: uuid('payslip_id').references(() => payslips.id, { onDelete: 'cascade' }).notNull(),
        
        // Link to original component if applicable (e.g. Rice Subsidy)
        componentId: uuid('component_id').references(() => payrollComponents.id),
        
        // Literal snapshot of the component at time of pay
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 250 }).notNull(),
        
        type: payslipItemTypeEnum('type').notNull(),
        amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
        
        description: text('description'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        payslipIdx: index('payslip_items_payslip_idx').on(t.payslipId),
        componentIdx: index('payslip_items_component_idx').on(t.componentId),
    })
);

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;

export type PayslipItem = typeof payslipItems.$inferSelect;
export type NewPayslipItem = typeof payslipItems.$inferInsert;
