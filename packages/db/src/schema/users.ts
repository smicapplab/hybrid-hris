import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
    index,
    integer,
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

        attendancePinHash: varchar('attendance_pin_hash', { length: 255 }),

        attendancePinSetAt: timestamp('attendance_pin_set_at', { withTimezone: true }),

        attendancePinAttempts: integer('attendance_pin_attempts')
            .default(0)
            .notNull(),

        attendancePinLockedUntil: timestamp('attendance_pin_locked_until', { withTimezone: true }),

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
        deletedAtIdx: index('users_deleted_at_idx').on(t.deletedAt),
        pinLockedUntilIdx: index('users_attendance_pin_locked_until_idx').on(t.attendancePinLockedUntil),
    }),
);