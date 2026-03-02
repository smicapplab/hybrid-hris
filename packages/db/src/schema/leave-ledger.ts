import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  varchar,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';
import { leaveTypes } from './leave-types';
import { leaveRequests } from './leave-requests';

export const leaveLedgerEntryTypeEnum = pgEnum('leave_ledger_entry_type', [
  'ACCRUAL',
  'CONSUMPTION',
  'ADJUSTMENT',
]);

export const leaveLedger = pgTable(
  'leave_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    leaveTypeId: uuid('leave_type_id')
      .notNull()
      .references(() => leaveTypes.id, { onDelete: 'restrict' }),

    entryType: leaveLedgerEntryTypeEnum('entry_type')
      .notNull(),

    // Positive for accrual/adjustment, negative for consumption
    amount: numeric('amount', { precision: 10, scale: 4 })
      .notNull(),

    // Running balance after this entry (materialized for fast reads)
    balance: numeric('balance', { precision: 12, scale: 4 })
      .notNull(),

    // Deterministic key for accrual idempotency (used only for ACCRUAL entries)
    accrualKey: varchar('accrual_key', { length: 100 }),

    // For accrual period tracking (nullable for adjustments)
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),

    // Reference to leave request when entryType = CONSUMPTION
    referenceLeaveRequestId: uuid('reference_leave_request_id')
      .references(() => leaveRequests.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    employeeIdx: index('leave_ledger_employee_idx').on(t.employeeId),
    leaveTypeIdx: index('leave_ledger_leave_type_idx').on(t.leaveTypeId),

    accrualKeyUnique: uniqueIndex('leave_ledger_accrual_key_uq').on(
      t.employeeId,
      t.leaveTypeId,
      t.accrualKey,
    ),

    accrualKeyRequiredForAccrual: check(
      'leave_ledger_accrual_key_required_check',
      sql`(entry_type <> 'ACCRUAL') OR (accrual_key IS NOT NULL)`,
    ),
    amountSignCheck: check(
      'leave_ledger_amount_sign_check',
      sql`
        (entry_type <> 'ACCRUAL' OR amount > 0)
        AND
        (entry_type <> 'CONSUMPTION' OR amount < 0)
      `,
    ),
    periodDateOrderCheck: check(
      'leave_ledger_period_date_order_check',
      sql`
        (period_end IS NULL OR period_start IS NULL)
        OR
        (period_end >= period_start)
      `,
    ),
  }),
);