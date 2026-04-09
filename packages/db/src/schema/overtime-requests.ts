import {
  pgTable,
  uuid,
  timestamp,
  text,
  decimal,
  index,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { overtimeStatusEnum, overtimeTypeEnum } from './enums';

export const overtimeRequests = pgTable(
  'overtime_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    
    employeeId: uuid('employee_id')
      .references(() => employees.id, { onDelete: 'cascade' })
      .notNull(),
    
    date: timestamp('date', { withTimezone: true }).notNull(),
    
    // Requested hours
    hours: decimal('hours', { precision: 4, scale: 2 }).notNull(),
    
    type: overtimeTypeEnum('type').default('REGULAR_OT').notNull(),
    
    status: overtimeStatusEnum('status').default('PENDING').notNull(),
    
    reason: text('reason').notNull(),
    
    // Approval details
    approverId: uuid('approver_id').references(() => employees.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    
    // Audit timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    employeeIdx: index('ot_requests_employee_idx').on(t.employeeId),
    statusIdx: index('ot_requests_status_idx').on(t.status),
    approverIdx: index('ot_requests_approver_idx').on(t.approverId),
    dateIdx: index('ot_requests_date_idx').on(t.date),
  })
);
