import {
    pgTable,
    uuid,
    varchar,
    boolean,
    date,
    timestamp,
    uniqueIndex,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const leavePolicies = pgTable(
    'leave_policies',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 150 }).notNull(),
        description: varchar('description', { length: 500 }),

        isActive: boolean('is_active').default(true).notNull(),

        effectiveFrom: date('effective_from').notNull(),
        effectiveTo: date('effective_to'),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('leave_policies_code_uq').on(t.code),

        effectiveDateOrderCheck: check(
            'leave_policies_effective_date_order_check',
            sql`(effective_to IS NULL) OR (effective_to >= effective_from)`
        ),
    }),
);