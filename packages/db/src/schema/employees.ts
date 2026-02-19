import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    employeeNo: varchar('employee_no', { length: 50 }).notNull(),

    firstName: varchar('first_name', { length: 120 }).notNull(),
    lastName: varchar('last_name', { length: 120 }).notNull(),
    middleName: varchar('middle_name', { length: 120 }),

    email: varchar('email', { length: 320 }).notNull(),
    alternateEmail: varchar('alternate_email', { length: 320 }),

    hireDate: date('hire_date').notNull(),

    addressLine1: varchar('address_line1', { length: 250 }),
    addressLine2: varchar('address_line2', { length: 250 }),
    city: varchar('city', { length: 120 }),
    province: varchar('province', { length: 120 }),
    postalCode: varchar('postal_code', { length: 20 }),
    countryCode: varchar('country_code', { length: 10 }).default('PH').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    employeeNoUq: uniqueIndex('employees_employee_no_uq').on(t.employeeNo),
    emailUq: uniqueIndex('employees_email_uq').on(t.email),
    hireDateIdx: index('employees_hire_date_idx').on(t.hireDate),
  }),
);