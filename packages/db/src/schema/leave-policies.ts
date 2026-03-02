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

        /**
         * At most one policy may be the default at a time.
         * The partial unique index below enforces this at the DB level.
         * New employees are automatically assigned to the default policy on creation.
         */
        isDefault: boolean('is_default').default(false).notNull(),

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

        // Ensures only one row can ever have is_default = true
        defaultUq: uniqueIndex('leave_policies_default_uq')
            .on(t.isDefault)
            .where(sql`${t.isDefault} = true`),

        effectiveDateOrderCheck: check(
            'leave_policies_effective_date_order_check',
            sql`(effective_to IS NULL) OR (effective_to >= effective_from)`
        ),
    }),
);