import {
    pgTable,
    uuid,
    varchar,
    decimal,
    date,
    timestamp,
    pgEnum,
    index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// We specify which government agency / tax type this bracket belongs to
export const statutoryTypeEnum = pgEnum('statutory_type', ['SSS', 'PHIC', 'HDMF', 'WTAX']);

export const statutoryBrackets = pgTable(
    'statutory_brackets',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        
        type: statutoryTypeEnum('type').notNull(),
        
        // E.g. "2024 SSS Contribution Schedule", "Train Law WTAX Semi-Monthly"
        name: varchar('name', { length: 250 }).notNull(),

        // Slowly Changing Dimension Type 2 fields
        effectiveFrom: date('effective_from').notNull(),
        effectiveTo: date('effective_to'),

        // Salary Range
        minCompensation: decimal('min_compensation', { precision: 12, scale: 2 }).notNull().default('0.00'),
        // If null, it means "and above"
        maxCompensation: decimal('max_compensation', { precision: 12, scale: 2 }),

        // For SSS / PHIC / HDMF
        // These can be exact amounts (like SSS) or percentages (like PhilHealth 2.5%)
        employeeShareAmount: decimal('employee_share_amount', { precision: 12, scale: 2 }).default('0.00'),
        employeeShareRate: decimal('employee_share_rate', { precision: 5, scale: 4 }).default('0.0000'), // e.g. 0.0250 for 2.5%

        employerShareAmount: decimal('employer_share_amount', { precision: 12, scale: 2 }).default('0.00'),
        employerShareRate: decimal('employer_share_rate', { precision: 5, scale: 4 }).default('0.0000'), // e.g. 0.0250 for 2.5%

        // For WTAX
        baseTaxAmount: decimal('base_tax_amount', { precision: 12, scale: 2 }).default('0.00'),
        excessTaxRate: decimal('excess_tax_rate', { precision: 5, scale: 4 }).default('0.0000'), // e.g. 0.1500 for 15%

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        // Index on Type and effective dates for fast querying during payroll generation
        typeDateIdx: index('statutory_brackets_type_date_idx').on(t.type, t.effectiveFrom, t.effectiveTo),
    })
);

export type StatutoryBracket = typeof statutoryBrackets.$inferSelect;
export type NewStatutoryBracket = typeof statutoryBrackets.$inferInsert;
