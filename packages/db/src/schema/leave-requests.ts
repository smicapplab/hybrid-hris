import {
  pgTable,
  uuid,
  date,
  numeric,
  timestamp,
  pgEnum,
  index,
  check,
  text,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';
import { leaveTypes } from './leave-types';
import { users } from './users';

export const leaveRequestStatusEnum = pgEnum('leave_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const leaveDayTypeEnum = pgEnum('leave_day_type', [
  'FULL',
  'HALF',
]);

export const leaveRequests = pgTable(
  'leave_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    leaveTypeId: uuid('leave_type_id')
      .notNull()
      .references(() => leaveTypes.id, { onDelete: 'restrict' }),

    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    /** FULL = whole day, HALF = half day (AM departure) */
    startDayType: leaveDayTypeEnum('start_day_type').default('FULL').notNull(),

    /** FULL = whole day, HALF = half day (PM return). Ignored when startDate = endDate. */
    endDayType: leaveDayTypeEnum('end_day_type').default('FULL').notNull(),

    // Total leave units requested (supports partial days via decimals)
    days: numeric('days', { precision: 10, scale: 4 }).notNull(),

    notes: text('notes'),

    status: leaveRequestStatusEnum('status')
      .default('PENDING')
      .notNull(),

    approvedBy: uuid('approved_by')
      .references(() => users.id, { onDelete: 'set null' }),

    approvedAt: timestamp('approved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    employeeIdx: index('leave_requests_employee_idx').on(t.employeeId),
    employeeHistoryIdx: index('leave_requests_employee_history_idx').on(
      t.employeeId,
      t.createdAt,
    ),
    pendingRequestsIdx: index('leave_requests_pending_idx')
      .on(t.startDate) // Sorts pending requests by date automatically
      .where(sql`status = 'PENDING'`),
    leaveTypeIdx: index('leave_requests_leave_type_idx').on(t.leaveTypeId),
    approvedByIdx: index('leave_requests_approved_by_idx').on(t.approvedBy),
    statusIdx: index('leave_requests_status_idx').on(t.status),
    dateOrderCheck: check(
      'leave_requests_date_order_check',
      sql`end_date >= start_date`
    ),
    daysPositiveCheck: check(
      'leave_requests_days_positive_check',
      sql`days > 0`
    ),
  }),
);
