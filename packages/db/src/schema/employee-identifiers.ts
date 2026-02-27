

import {
    pgTable,
    uuid,
    varchar,
    date,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';

import { employees } from './employees';

/**
 * PH-centric government / compliance identifiers.
 *
 * Design:
 * - 1:1 with employees (employeeId is PK)
 * - Keep auth/login email in `users`; optional personalEmail belongs to profile table
 * - Unique constraints are safe because Postgres allows multiple NULLs in UNIQUE indexes
 */
export const employeeIdentifiers = pgTable(
    'employee_identifiers',
    {
        employeeId: uuid('employee_id')
            .primaryKey()
            .references(() => employees.id, { onDelete: 'cascade' }),

        // Philippines government IDs
        tinNo: varchar('tin_no', { length: 32 }),
        sssNo: varchar('sss_no', { length: 32 }),
        philHealthNo: varchar('philhealth_no', { length: 32 }),
        pagIbigNo: varchar('pagibig_no', { length: 32 }),

        // Common additional identifiers
        umidNo: varchar('umid_no', { length: 32 }),

        passportNo: varchar('passport_no', { length: 32 }),
        passportExpiry: date('passport_expiry'),

        driversLicenseNo: varchar('drivers_license_no', { length: 32 }),
        driversLicenseExpiry: date('drivers_license_expiry'),

        // Professional / other (optional)
        prcLicenseNo: varchar('prc_license_no', { length: 32 }),
        prcLicenseExpiry: date('prc_license_expiry'),

        // Company-issued identifiers (optional)
        companyIdNo: varchar('company_id_no', { length: 64 }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdIdx: index('employee_identifiers_employee_id_idx').on(t.employeeId),

        // Uniques
        tinUq: uniqueIndex('employee_identifiers_tin_uq').on(t.tinNo),
        sssNoUq: uniqueIndex('employee_identifiers_sss_no_uq').on(t.sssNo),
        philHealthNoUq: uniqueIndex('employee_identifiers_philhealth_no_uq').on(
            t.philHealthNo,
        ),
        pagIbigNoUq: uniqueIndex('employee_identifiers_pagibig_no_uq').on(t.pagIbigNo),

        umidNoUq: uniqueIndex('employee_identifiers_umid_no_uq').on(t.umidNo),

        passportNoUq: uniqueIndex('employee_identifiers_passport_no_uq').on(t.passportNo),
        driversLicenseNoUq: uniqueIndex(
            'employee_identifiers_drivers_license_no_uq',
        ).on(t.driversLicenseNo),

        prcLicenseNoUq: uniqueIndex('employee_identifiers_prc_license_no_uq').on(
            t.prcLicenseNo,
        ),

        companyIdNoUq: uniqueIndex('employee_identifiers_company_id_no_uq').on(
            t.companyIdNo,
        ),
    }),
);