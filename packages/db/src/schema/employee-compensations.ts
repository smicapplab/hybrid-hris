import {
    pgTable,
    uuid,
    decimal,
    date,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { payrollComponents } from './payroll-components';
import { sql } from 'drizzle-orm';

export const employeeCompensations = pgTable(
    'employee_compensations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        
        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'cascade' }),
            
        payrollComponentId: uuid('payroll_component_id')
            .notNull()
            .references(() => payrollComponents.id, { onDelete: 'restrict' }),

        amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
        
        effectiveFrom: date('effective_from').notNull(),
        effectiveTo: date('effective_to'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        // An employee can only have one active record for a given component at a time.
        // Use a partial index to enforce uniqueness only on currently active records.
        activeComponentUq: uniqueIndex('employee_compensations_active_comp_uq')
            .on(t.employeeId, t.payrollComponentId)
            .where(sql`effective_to IS NULL`),
    }),
);

export type EmployeeCompensation = typeof employeeCompensations.$inferSelect;
export type NewEmployeeCompensation = typeof employeeCompensations.$inferInsert;
