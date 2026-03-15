import {
    pgTable,
    uuid,
    varchar,
    boolean,
    integer,
    timestamp,
    uniqueIndex,
    index,
    date,
} from 'drizzle-orm/pg-core'

import { employees } from './employees'
import { shiftTemplates } from './shift-templates'

/**
 * One row per employee — the employee's current active shift assignment.
 * Updated in-place when the schedule changes immediately.
 * Future/pending schedule changes are queued in pending_employee_shift_assignments.
 *
 * Snapshot fields are copied from shift_templates at assignment time so that
 * historical attendance records are unaffected when the template is later edited.
 */
export const employeeShiftAssignments = pgTable(
    'employee_shift_assignments',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        shiftTemplateId: uuid('shift_template_id')
            .notNull()
            .references(() => shiftTemplates.id, { onDelete: 'restrict' }),

        // Timing snapshot
        startTime: varchar('start_time', { length: 5 }).notNull(),
        endTime: varchar('end_time', { length: 5 }).notNull(),
        breakMinutes: integer('break_minutes').notNull(),
        isFlexible: boolean('is_flexible').notNull(),

        // Work-day snapshot — which days of the week this employee works
        isMon: boolean('is_mon').notNull(),
        isTue: boolean('is_tue').notNull(),
        isWed: boolean('is_wed').notNull(),
        isThu: boolean('is_thu').notNull(),
        isFri: boolean('is_fri').notNull(),
        isSat: boolean('is_sat').notNull(),
        isSun: boolean('is_sun').notNull(),

        // The date from which this assignment is in effect (audit trail)
        effectiveFrom: date('effective_from').notNull(),
        effectiveUntil: date('effective_until'), // NULL indicates current active shift

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        // 1:1 — exactly one active assignment per employee at any time
        employeeUq: uniqueIndex('employee_shift_assignments_employee_uq').on(t.employeeId),
        shiftTemplateIdx: index('employee_shift_assignments_shift_template_idx').on(t.shiftTemplateId),
    }),
)

export type EmployeeShiftAssignment = typeof employeeShiftAssignments.$inferSelect
export type NewEmployeeShiftAssignment = typeof employeeShiftAssignments.$inferInsert
