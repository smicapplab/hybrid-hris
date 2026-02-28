import {
    pgTable,
    uuid,
    varchar,
    boolean,
    integer,
    timestamp,
    index,
    uniqueIndex,
    date,
    pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { employees } from './employees'
import { shiftTemplates } from './shift-templates'
import { users } from './users'
import { PENDING_SHIFT_STATUSES } from '@hybrid-hris/domain'

/**
 * Queue of future schedule changes awaiting application.
 * When effectiveDate arrives (or an admin applies it manually),
 * the service copies the snapshot fields into employee_shift_assignments
 * and sets status = 'APPLIED'.
 *
 * Snapshot fields are copied from shift_templates at request time so that
 * subsequent template edits don't alter the queued change.
 */
export const pendingShiftStatusEnum = pgEnum('pending_shift_status', PENDING_SHIFT_STATUSES)

export const pendingEmployeeShiftAssignments = pgTable(
    'pending_employee_shift_assignments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        shiftTemplateId: uuid('shift_template_id')
            .notNull()
            .references(() => shiftTemplates.id, { onDelete: 'restrict' }),

        // Timing snapshot (from shift_templates at request time)
        startTime: varchar('start_time', { length: 5 }).notNull(),
        endTime: varchar('end_time', { length: 5 }).notNull(),
        breakMinutes: integer('break_minutes').notNull(),
        isFlexible: boolean('is_flexible').notNull(),

        // Work-day snapshot
        isMon: boolean('is_mon').notNull(),
        isTue: boolean('is_tue').notNull(),
        isWed: boolean('is_wed').notNull(),
        isThu: boolean('is_thu').notNull(),
        isFri: boolean('is_fri').notNull(),
        isSat: boolean('is_sat').notNull(),
        isSun: boolean('is_sun').notNull(),

        // The date this change should take effect
        effectiveDate: date('effective_date').notNull(),

        status: pendingShiftStatusEnum('status').notNull().default('PENDING'),

        requestedBy: uuid('requested_by')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),

        // Populated when status transitions to APPLIED
        appliedAt: timestamp('applied_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('pending_shift_assignments_employee_idx').on(t.employeeId),
        effectiveDateIdx: index('pending_shift_assignments_effective_date_idx').on(t.effectiveDate),
        statusIdx: index('pending_shift_assignments_status_idx').on(t.status),
        // Composite for the common "pending for this employee" query
        employeeStatusIdx: index('pending_shift_assignments_employee_status_idx').on(
            t.employeeId,
            t.status,
        ),

        // At most one PENDING shift change per employee — prevents multiple queued changes
        // from being applied independently and producing unpredictable final state.
        pendingPerEmployee: uniqueIndex('pending_shift_assignments_pending_per_employee_uq')
            .on(t.employeeId)
            .where(sql`status = 'PENDING'`),
    }),
)

export type PendingEmployeeShiftAssignment =
    typeof pendingEmployeeShiftAssignments.$inferSelect

export type NewPendingEmployeeShiftAssignment =
    typeof pendingEmployeeShiftAssignments.$inferInsert
