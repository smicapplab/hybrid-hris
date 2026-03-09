import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  pgEnum,
  integer,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { orgUnits } from './org-units';
import { positions } from './positions';
import { users } from './users';
import { employmentTypeEnum } from './employees';
import {
  MANPOWER_REQUEST_TYPES,
  MANPOWER_REQUEST_STATUSES,
  REQUEST_PRIORITIES,
} from '@hybrid-hris/domain';

export const manpowerRequestTypeEnum = pgEnum(
  'manpower_request_type',
  MANPOWER_REQUEST_TYPES,
);

export const manpowerRequestStatusEnum = pgEnum(
  'manpower_request_status',
  MANPOWER_REQUEST_STATUSES,
);

export const requestPriorityEnum = pgEnum(
  'request_priority',
  REQUEST_PRIORITIES,
);

export const manpowerRequests = pgTable(
  'manpower_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    
    orgUnitId: uuid('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'restrict' }),
    
    positionId: uuid('position_id')
      .references(() => positions.id, { onDelete: 'set null' }),
    
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    requestType: manpowerRequestTypeEnum('request_type').notNull(),
    
    quantity: integer('quantity').default(1).notNull(),
    
    employmentType: employmentTypeEnum('employment_type').notNull(),
    
    priority: requestPriorityEnum('priority').default('NORMAL').notNull(),

    jobTitle: varchar('job_title', { length: 200 }).notNull(),
    jobSummary: text('job_summary'),
    jobDescription: text('job_description'),
    responsibilities: text('responsibilities'),
    qualifications: text('qualifications'),

    status: manpowerRequestStatusEnum('status').default('DRAFT').notNull(),
    
    targetHireDate: date('target_hire_date'),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orgUnitIdx: index('manpower_requests_org_unit_idx').on(t.orgUnitId),
    statusIdx: index('manpower_requests_status_idx').on(t.status),
    requestedByIdx: index('manpower_requests_requested_by_idx').on(t.requestedBy),
  }),
);
