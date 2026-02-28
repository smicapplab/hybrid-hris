

import {
    pgTable,
    uuid,
    date,
    varchar,
    boolean,
    integer,
    timestamp,
    index,
    uniqueIndex,
    check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { employees } from './employees'
import { shiftTemplates } from './shift-templates'

/**
 * Effective-dated employee shift assignments.
 * Snapshots shift timing fields at assignment time
 * to protect historical attendance integrity.
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

        // Snapshot fields (copied from shift_templates at assignment time)
        startTime: varchar('start_time', { length: 5 }).notNull(),
        endTime: varchar('end_time', { length: 5 }).notNull(),
        breakMinutes: integer('break_minutes').notNull(),
        isFlexible: boolean('is_flexible').notNull(),

        effectiveFrom: date('effective_from').notNull(),
        effectiveTo: date('effective_to'),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('employee_shift_assignments_employee_idx').on(
            t.employeeId,
        ),
        shiftTemplateIdx: index(
            'employee_shift_assignments_shift_template_idx',
        ).on(t.shiftTemplateId),
        deletedAtIdx: index('employee_shift_assignments_deleted_at_idx').on(
            t.deletedAt,
        ),

        // Partial: excludes soft-deleted rows so a deleted assignment doesn't block re-assignment from the same date
        employeeEffectiveFromUq: uniqueIndex(
            'employee_shift_assignments_employee_effective_from_uq',
        ).on(t.employeeId, t.effectiveFrom).where(sql`deleted_at IS NULL`),

        effectiveDateOrderCheck: check(
            'employee_shift_assignments_effective_date_order_check',
            sql`(effective_to IS NULL) OR (effective_to >= effective_from)`,
        ),

        noOverlapPerEmployee: sql`
      CONSTRAINT employee_shift_assignments_no_overlap
      EXCLUDE USING gist (
        employee_id WITH =,
        daterange(
          effective_from,
          COALESCE(effective_to, 'infinity'::date)
        ) WITH &&
      )
    `,
    }),
)

export type EmployeeShiftAssignment =
    typeof employeeShiftAssignments.$inferSelect

export type NewEmployeeShiftAssignment =
    typeof employeeShiftAssignments.$inferInsert