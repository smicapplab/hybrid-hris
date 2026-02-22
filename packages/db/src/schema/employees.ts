import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { orgUnits } from './org-units';
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

    orgUnitId: uuid('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'restrict' }),

    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'restrict' }),

    managerId: uuid('manager_id'),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeNoUq: uniqueIndex('employees_employee_no_uq').on(t.employeeNo),
    hireDateIdx: index('employees_hire_date_idx').on(t.hireDate),
    statusIdx: index('employees_status_idx').on(t.status),
    deletedAtIdx: index('employees_deleted_at_idx').on(t.deletedAt),
    orgUnitIdx: index('employees_org_unit_idx').on(t.orgUnitId),
    positionIdx: index('employees_position_idx').on(t.positionId),
    orgUnitPositionIdx: index('employees_org_unit_position_idx').on(
      t.orgUnitId,
      t.positionId,
    ),
    managerIdx: index('employees_manager_idx').on(t.managerId),
    managerNotSelfCheck: check(
      'employees_manager_not_self_check',
      sql`manager_id IS NULL OR manager_id <> id`,
    ),
    hireDateNotFutureCheck: check(
      'employees_hire_date_not_future_check',
      sql`hire_date <= CURRENT_DATE`,
    ),
    managerFk: foreignKey({
      columns: [t.managerId],
      foreignColumns: [t.id],
      name: 'employees_manager_fk',
    }).onDelete('set null'),
  }),
);