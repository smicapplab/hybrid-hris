import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    decimal,
    timestamp,
    uniqueIndex,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const payrollComponentTypeEnum = pgEnum('payroll_component_type', ['EARNING', 'DEDUCTION', 'EMPLOYER_COST']);

export const payrollComponents = pgTable(
    'payroll_components',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 150 }).notNull(),
        description: text('description'),
        
        type: payrollComponentTypeEnum('type').notNull(),
        
        isTaxable: boolean('is_taxable').default(true).notNull(),
        
        // Specific to PH payroll: Rice subsidy, Clothing allowance, etc.
        isDeMinimis: boolean('is_de_minimis').default(false).notNull(),
        
        // SSS, PhilHealth, Pag-IBIG
        isStatutory: boolean('is_statutory').default(false).notNull(),
        
        // If true, appears on every payroll run unless manually overridden
        isRecurring: boolean('is_recurring').default(true).notNull(),
        
        // The limit up to which this component is tax-exempt
        taxExemptLimit: decimal('tax_exempt_limit', { precision: 12, scale: 2 }).default('0').notNull(),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('payroll_components_code_uq').on(t.code).where(sql`deleted_at IS NULL`),
    }),
);

export type PayrollComponent = typeof payrollComponents.$inferSelect;
export type NewPayrollComponent = typeof payrollComponents.$inferInsert;
