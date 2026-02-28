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
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '@hybrid-hris/domain';

export const employmentTypeEnum = pgEnum('employment_type', EMPLOYMENT_TYPES);
export const employeeStatusEnum = pgEnum('employee_status', EMPLOYEE_STATUSES);

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

    // IANA timezone override for this employee. Null = inherit from hr_settings.timezone.
    timezone: varchar('timezone', { length: 50 }),

    orgUnitId: uuid('org_unit_id')
      .notNull()
      .references(() => orgUnits.id, { onDelete: 'restrict' }),

    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'restrict' }),

    supervisorId: uuid('supervisor_id'),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeNoUq: uniqueIndex('employees_employee_no_uq').on(t.employeeNo),
    hireDateIdx: index('employees_hire_date_idx').on(t.hireDate),
    lastNameIdx: index('employees_last_name_idx').on(t.lastName),
    statusIdx: index('employees_status_idx').on(t.status),
    deletedAtIdx: index('employees_deleted_at_idx').on(t.deletedAt),
    orgUnitIdx: index('employees_org_unit_idx').on(t.orgUnitId),
    positionIdx: index('employees_position_idx').on(t.positionId),
    orgUnitPositionIdx: index('employees_org_unit_position_idx').on(
      t.orgUnitId,
      t.positionId,
    ),
    supervisorIdx: index('employees_supervisor_idx').on(t.supervisorId),
    supervisorNotSelfCheck: check(
      'employees_supervisor_not_self_check',
      sql`supervisor_id IS NULL OR supervisor_id <> id`,
    ),
    hireDateNotFutureCheck: check(
      'employees_hire_date_not_future_check',
      sql`hire_date <= CURRENT_DATE`,
    ),
    supervisorFk: foreignKey({
      columns: [t.supervisorId],
      foreignColumns: [t.id],
      name: 'employees_supervisor_fk',
    }).onDelete('set null'),
  }),
);