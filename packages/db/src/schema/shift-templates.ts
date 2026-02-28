

import {
    pgTable,
    uuid,
    varchar,
    boolean,
    integer,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Global reusable shift definitions.
 * Time fields stored as HH:mm (24-hour format).
 */
export const shiftTemplates = pgTable(
    'shift_templates',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 150 }).notNull(),

        // Stored as HH:mm (e.g., 09:00, 18:30)
        startTime: varchar('start_time', { length: 5 }).notNull(),
        endTime: varchar('end_time', { length: 5 }).notNull(),

        breakMinutes: integer('break_minutes').notNull(),

        isFlexible: boolean('is_flexible').default(false).notNull(),
        isActive: boolean('is_active').default(true).notNull(),

        // Work-day schedule — which days of the week this shift runs.
        // Defaults to a standard Mon–Fri workweek.
        isMon: boolean('is_mon').default(true).notNull(),
        isTue: boolean('is_tue').default(true).notNull(),
        isWed: boolean('is_wed').default(true).notNull(),
        isThu: boolean('is_thu').default(true).notNull(),
        isFri: boolean('is_fri').default(true).notNull(),
        isSat: boolean('is_sat').default(false).notNull(),
        isSun: boolean('is_sun').default(false).notNull(),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        // Partial: excludes soft-deleted rows so a deleted code can be reused
        codeUq: uniqueIndex('shift_templates_code_uq').on(t.code).where(sql`deleted_at IS NULL`),

        isActiveIdx: index('shift_templates_is_active_idx').on(t.isActive),
        deletedAtIdx: index('shift_templates_deleted_at_idx').on(t.deletedAt),
    }),
)

export type ShiftTemplate = typeof shiftTemplates.$inferSelect
export type NewShiftTemplate = typeof shiftTemplates.$inferInsert