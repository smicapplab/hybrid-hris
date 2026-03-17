import {
    pgTable,
    varchar,
    integer,
    timestamp,
    boolean,
    numeric,
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

        // Optional company email domain (e.g., "acme.com").
        // When set, login email is composed as {username}@{emailDomain}.
        emailDomain: varchar('email_domain', { length: 253 }),

        // Default IANA timezone for the organisation (e.g., "Asia/Manila").
        // Used as fallback when employee.timezone is not set.
        timezone: varchar('timezone', { length: 50 }).notNull().default('Asia/Manila'),

        // Authentication Settings
        passwordLoginEnabled: boolean('password_login_enabled').default(true).notNull(),
        googleLoginEnabled: boolean('google_login_enabled').default(false).notNull(),
        microsoftLoginEnabled: boolean('microsoft_login_enabled').default(false).notNull(),
        allowedWorkspaceDomains: varchar('allowed_workspace_domains', { length: 255 }).array(),

        // Work Hours & Compliance Settings
        overtimeThresholdMinutes: integer('overtime_threshold_minutes').notNull().default(30),
        lateGracePeriodMinutes: integer('late_grace_period_minutes').notNull().default(15),
        undertimeGracePeriodMinutes: integer('undertime_grace_period_minutes').notNull().default(15),
        
        // Multipliers (e.g., 1.0 = exact deduction, 1.5 = time-and-a-half deduction)
        latePenaltyMultiplier: numeric('late_penalty_multiplier', { precision: 5, scale: 2 }).notNull().default('1.00'),
        undertimePenaltyMultiplier: numeric('undertime_penalty_multiplier', { precision: 5, scale: 2 }).notNull().default('1.00'),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    () => ({}),
)