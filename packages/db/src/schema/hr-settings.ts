import {
    pgTable,
    varchar,
    integer,
    timestamp,
    boolean,
} from 'drizzle-orm/pg-core'

export const hrSettings = pgTable(
    'hr_settings',
    {
        singleton: boolean('singleton')
            .notNull()
            .default(true)
            .primaryKey(),

        // Employee number prefix (e.g., EMP-, PH-, ACME-)
        employeeNoPrefix: varchar('employee_no_prefix', { length: 10 })
            .notNull()
            .default('EMP-'),

        // Next numeric value to issue
        employeeNoNext: integer('employee_no_next')
            .notNull()
            .default(1),

        // Padding length (e.g., 6 → 000001)
        employeeNoPadding: integer('employee_no_padding')
            .notNull()
            .default(6),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    () => ({}),
)