import {
    pgTable,
    uuid,
    integer,
    timestamp,
    index,
    uniqueIndex,
    check,
    pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { employees } from './employees'
import { users } from './users'
import { attendanceLogs } from './attendance-logs'
import { ATTENDANCE_ADJUSTMENT_STATUSES } from '@hybrid-hris/domain'

/**
 * Attendance corrections requiring approval.
 * On approval, the linked attendance_logs row is mutated to reflect the corrected times.
 * previousActual* fields snapshot the original values before mutation for audit purposes.
 *
 * workDate is intentionally absent — derive it by joining to attendance_logs when needed.
 */

export const attendanceAdjustmentStatusEnum = pgEnum('attendance_adjustment_status', ATTENDANCE_ADJUSTMENT_STATUSES)

export const attendanceAdjustments = pgTable(
    'attendance_adjustments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

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

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('attendance_adjustments_employee_idx').on(t.employeeId),
        statusIdx: index('attendance_adjustments_status_idx').on(t.status),
        attendanceLogIdx: index('attendance_adjustments_log_idx').on(t.attendanceLogId),

        // At most one PENDING adjustment per log — prevents duplicate open correction requests.
        pendingPerLog: uniqueIndex('attendance_adjustments_pending_per_log_uq')
            .on(t.attendanceLogId)
            .where(sql`status = 'PENDING'`),

        // When a correction is approved, both approver and timestamp must be recorded.
        approvalConsistencyCheck: check(
            'attendance_adjustments_approval_consistency_check',
            sql`status <> 'APPROVED' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)`,
        ),
    }),
)

export type AttendanceAdjustment =
    typeof attendanceAdjustments.$inferSelect

export type NewAttendanceAdjustment =
    typeof attendanceAdjustments.$inferInsert
