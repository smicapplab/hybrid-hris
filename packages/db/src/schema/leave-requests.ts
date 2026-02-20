

import {
  pgTable,
  uuid,
  date,
  numeric,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { leaveTypes } from './leave-types';
import { users } from './users';

export const leaveRequestStatusEnum = pgEnum('leave_request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
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

    // Total leave units requested (supports partial days via decimals)
    days: numeric('days', { precision: 10, scale: 4 }).notNull(),

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
    leaveTypeIdx: index('leave_requests_leave_type_idx').on(t.leaveTypeId),
    statusIdx: index('leave_requests_status_idx').on(t.status),
  }),
);