import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';

export const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .references(() => employees.id, { onDelete: 'set null' }),

        email: varchar('email', { length: 320 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }),

        isActive: boolean('is_active').default(true).notNull(),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        emailLowerUq: uniqueIndex('users_email_lower_uq').on(
            sql`lower(email)`
        ),
        employeeUq: uniqueIndex('users_employee_id_uq').on(t.employeeId),
        activeIdx: index('users_is_active_idx').on(t.isActive),
    }),
);