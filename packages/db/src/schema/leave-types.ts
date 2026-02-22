import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const leaveTypes = pgTable(
  'leave_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    description: varchar('description', { length: 500 }),

    // Monthly accrual rate (e.g., 1.25 days per month)
    accrualRatePerMonth: numeric('accrual_rate_per_month', {
      precision: 10,
      scale: 4,
    }),

    // Maximum carry over allowed
    maxCarryOver: numeric('max_carry_over', {
      precision: 10,
      scale: 4,
    }),

    // Whether this leave type accrues automatically
    isAccrualBased: boolean('is_accrual_based').default(true).notNull(),

    // Whether this leave type is paid
    isPaid: boolean('is_paid').default(true).notNull(),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    codeUq: uniqueIndex('leave_types_code_uq').on(t.code),
    nameIdx: index('leave_types_name_idx').on(t.name),
    deletedAtIdx: index('leave_types_deleted_at_idx').on(t.deletedAt),
  }),
);