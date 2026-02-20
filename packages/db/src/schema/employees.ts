import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

import { departments } from './departments';
import { positions } from './positions';

export const employmentTypeEnum = pgEnum('employment_type', [
  'REGULAR',
  'PROBATIONARY',
  'CONTRACTUAL',
  'CONSULTANT',
  'INTERN',
]);

export const employeeStatusEnum = pgEnum('employee_status', [
  'ACTIVE',
  'PROBATION',
  'RESIGNED',
  'TERMINATED',
  'SUSPENDED',
]);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    employeeNo: varchar('employee_no', { length: 50 }).notNull(),

    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    middleName: varchar('middle_name', { length: 120 }),

    alternateEmail: varchar('alternate_email', { length: 320 }),

    hireDate: date('hire_date').notNull(),

    employmentType: employmentTypeEnum('employment_type')
      .default('REGULAR')
      .notNull(),

    status: employeeStatusEnum('employee_status')
      .default('ACTIVE')
      .notNull(),

    addressLine1: varchar('address_line1', { length: 250 }),
    addressLine2: varchar('address_line2', { length: 250 }),
    city: varchar('city', { length: 120 }),
    province: varchar('province', { length: 120 }),
    postalCode: varchar('postal_code', { length: 20 }),
    countryCode: varchar('country_code', { length: 10 }).default('PH').notNull(),

    departmentId: uuid('department_id')
      .references(() => departments.id, { onDelete: 'set null' }),

    positionId: uuid('position_id')
      .references(() => positions.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeNoUq: uniqueIndex('employees_employee_no_uq').on(t.employeeNo),
    hireDateIdx: index('employees_hire_date_idx').on(t.hireDate),
    departmentIdx: index('employees_department_idx').on(t.departmentId),
    positionIdx: index('employees_position_idx').on(t.positionId),
  }),
);