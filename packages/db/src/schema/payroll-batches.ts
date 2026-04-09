import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    pgEnum,
    date,
    decimal,
    index,
} from 'drizzle-orm/pg-core';

export const payrollBatchStatusEnum = pgEnum('payroll_batch_status', [
    'DRAFT',
    'PROCESSING',
    'COMPLETED',
    'VOID',
]);

export const payrollBatches = pgTable(
    'payroll_batches',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 250 }).notNull(),
        
        startDate: date('start_date').notNull(),
        endDate: date('end_date').notNull(),
        
        status: payrollBatchStatusEnum('status').default('DRAFT').notNull(),
        
        totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).default('0.00').notNull(),
        
        processedAt: timestamp('processed_at', { withTimezone: true }),
        
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        statusIdx: index('payroll_batches_status_idx').on(t.status),
    }),
);

export type PayrollBatch = typeof payrollBatches.$inferSelect;
export type NewPayrollBatch = typeof payrollBatches.$inferInsert;
