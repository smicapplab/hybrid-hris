import {
    pgTable,
    uuid,
    timestamp,
    pgEnum,
    boolean,
    index,
    uniqueIndex,
    date,
    decimal,
    varchar,
} from 'drizzle-orm/pg-core'

import { employees } from './employees'
import { ATTENDANCE_SOURCES } from '@hybrid-hris/domain'

/**
 * One row per employee per work date.
 * Created at time-in, completed at time-out.
 * Corrections go through attendance_adjustments (which mutates this row on approval).
 * Rows are never deleted — isLocked will be set after month-end close for payroll.
 */

export const attendanceSourceEnum = pgEnum('attendance_source', ATTENDANCE_SOURCES)

export const attendanceLogs = pgTable(
    'attendance_logs',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        workDate: date('work_date').notNull(),

        // Populated at time-in from the employee's active shift assignment snapshot.
        // Nullable: null when the employee has no active shift (unscheduled/overtime punch).
        scheduledInAt: timestamp('scheduled_in_at', { withTimezone: true }),
        scheduledOutAt: timestamp('scheduled_out_at', { withTimezone: true }),

        actualInAt: timestamp('actual_in_at', { withTimezone: true }),
        actualOutAt: timestamp('actual_out_at', { withTimezone: true }),

        // Computed values
        totalHours: decimal('total_hours', { precision: 4, scale: 2 }).default('0').notNull(),
        nightDiffHours: decimal('night_diff_hours', { precision: 4, scale: 2 }).default('0').notNull(),
        holidayHours: decimal('holiday_hours', { precision: 4, scale: 2 }).default('0').notNull(),
        overtimeHours: decimal('overtime_hours', { precision: 4, scale: 2 }).default('0').notNull(),
        
        // e.g., 'PRESENT', 'LATE', 'UNDERTIME', 'ABSENT', 'ON_LEAVE'
        status: varchar('status', { length: 50 }).default('PRESENT').notNull(),

        // Source recorded separately for in and out — employee may punch in via kiosk, out via web.
        sourceIn: attendanceSourceEnum('source_in'),
        sourceOut: attendanceSourceEnum('source_out'),

        // Set to true after month-end payroll close — prevents further mutations.
        isLocked: boolean('is_locked').notNull().default(false),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('attendance_logs_employee_idx').on(t.employeeId),
        workDateIdx: index('attendance_logs_work_date_idx').on(t.workDate),
        // Supports payroll month-end queries that scan for unlocked logs in a date range
        isLockedIdx: index('attendance_logs_is_locked_idx').on(t.isLocked),
        // One row per employee per work date — no soft delete so no partial condition needed
        employeeWorkDateUq: uniqueIndex('attendance_logs_employee_work_date_uq')
            .on(t.employeeId, t.workDate),
    }),
)

export type AttendanceLog = typeof attendanceLogs.$inferSelect
export type NewAttendanceLog = typeof attendanceLogs.$inferInsert
