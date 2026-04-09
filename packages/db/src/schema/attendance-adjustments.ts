import {
    pgTable,
    uuid,
    integer,
    timestamp,
    index,
    uniqueIndex,
    check,
    pgEnum,
    date,
    text,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { employees } from './employees'
import { users } from './users'
import { attendanceLogs } from './attendance-logs'
import { ATTENDANCE_ADJUSTMENT_STATUSES } from '@hybrid-hris/domain'

/**
 * Attendance corrections requiring approval.
 * 
 * This table handles two types of requests:
 * 1. Correction: attendanceLogId is NOT NULL (fixing an existing punch).
 * 2. Missing Entry: attendanceLogId is NULL (filling a day with no punches).
 * 
 * On approval, the service either mutates the linked log or creates a new one.
 */

export const attendanceAdjustmentStatusEnum = pgEnum('attendance_adjustment_status', ATTENDANCE_ADJUSTMENT_STATUSES)

export const attendanceAdjustments = pgTable(
    'attendance_adjustments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        // NULL if the employee forgot to punch entirely for this date
        attendanceLogId: uuid('attendance_log_id')
            .references(() => attendanceLogs.id, { onDelete: 'restrict' }),

        // The logical work date being corrected
        workDate: date('work_date').notNull(),

        requestedActualInAt: timestamp('requested_actual_in_at', { withTimezone: true }),
        requestedActualOutAt: timestamp('requested_actual_out_at', { withTimezone: true }),

        // Snapshot of values before the request (null for missing entries)
        previousActualInAt: timestamp('previous_actual_in_at', { withTimezone: true }),
        previousActualOutAt: timestamp('previous_actual_out_at', { withTimezone: true }),

        reasonCode: integer('reason_code'),
        remarks: text('remarks').notNull(),
        approverRemarks: text('approver_remarks'),

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
        workDateIdx: index('attendance_adjustments_work_date_idx').on(t.workDate),
        requestedByIdx: index('attendance_adjustments_requested_by_idx').on(t.requestedBy),
        approvedByIdx: index('attendance_adjustments_approved_by_idx').on(t.approvedBy),

        // Prevent duplicate pending requests for the same employee and work date
        pendingPerDateUq: uniqueIndex('attendance_adjustments_pending_date_uq')
            .on(t.employeeId, t.workDate)
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
