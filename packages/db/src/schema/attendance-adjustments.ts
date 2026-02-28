import {
    pgTable,
    uuid,
    date,
    integer,
    timestamp,
    index,
    pgEnum,
} from 'drizzle-orm/pg-core'

import { employees } from './employees'
import { users } from './users'
import { attendanceLogs } from './attendance-logs'
import { ATTENDANCE_ADJUSTMENT_STATUSES } from '@hybrid-hris/domain'

/**
 * Attendance corrections requiring approval.
 * On approval, the linked attendance_logs row is mutated to reflect the corrected times.
 * previousActual* fields snapshot the original values before mutation for audit purposes.
 */

export const attendanceAdjustmentStatusEnum = pgEnum('attendance_adjustment_status', ATTENDANCE_ADJUSTMENT_STATUSES)

export const attendanceAdjustments = pgTable(
    'attendance_adjustments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        workDate: date('work_date').notNull(),

        // Direct FK to the log being corrected. On approval the service mutates this row.
        attendanceLogId: uuid('attendance_log_id')
            .notNull()
            .references(() => attendanceLogs.id, { onDelete: 'restrict' }),

        requestedActualInAt: timestamp('requested_actual_in_at', { withTimezone: true }),
        requestedActualOutAt: timestamp('requested_actual_out_at', { withTimezone: true }),

        previousActualInAt: timestamp('previous_actual_in_at', { withTimezone: true }),
        previousActualOutAt: timestamp('previous_actual_out_at', { withTimezone: true }),

        reason: integer('reason_code'),

        status: attendanceAdjustmentStatusEnum('status')
            .notNull()
            .default('PENDING'),

        requestedBy: uuid('requested_by')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),

        approvedBy: uuid('approved_by')
            .references(() => users.id, { onDelete: 'restrict' }),

        approvedAt: timestamp('approved_at', { withTimezone: true }),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('attendance_adjustments_employee_idx').on(
            t.employeeId,
        ),
        workDateIdx: index('attendance_adjustments_work_date_idx').on(
            t.workDate,
        ),
        statusIdx: index('attendance_adjustments_status_idx').on(t.status),
        deletedAtIdx: index('attendance_adjustments_deleted_at_idx').on(
            t.deletedAt,
        ),
        employeeWorkDateIdx: index(
            'attendance_adjustments_employee_work_date_idx',
        ).on(t.employeeId, t.workDate),
        attendanceLogIdx: index('attendance_adjustments_log_idx').on(t.attendanceLogId),
    }),
)

export type AttendanceAdjustment =
    typeof attendanceAdjustments.$inferSelect

export type NewAttendanceAdjustment =
    typeof attendanceAdjustments.$inferInsert