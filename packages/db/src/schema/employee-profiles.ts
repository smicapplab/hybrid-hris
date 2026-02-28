import {
    pgTable,
    uuid,
    varchar,
    date,
    timestamp,
    index,
    uniqueIndex,
    pgEnum,
} from 'drizzle-orm/pg-core';

import { employees } from './employees';

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']);
export const civilStatusEnum = pgEnum('civil_status', [
    'SINGLE',
    'MARRIED',
    'SEPARATED',
    'WIDOWED',
    'ANNULLED'
]);

export const employeeProfiles = pgTable(
    'employee_profiles',
    {
        // 1:1 with employees
        employeeId: uuid('employee_id')
            .primaryKey()
            .references(() => employees.id, { onDelete: 'cascade' }),

        // Demographics
        birthDate: date('birth_date'),
        gender: genderEnum('gender'),
        civilStatus: civilStatusEnum('civil_status'),

        nationality: varchar('nationality', { length: 80 }),

        // Contact (non-auth)
        personalEmail: varchar('personal_email', { length: 320 }),
        mobileNo: varchar('mobile_no', { length: 30 }),
        landlineNo: varchar('landline_no', { length: 30 }),

        // Emergency Contact
        emergencyContactName: varchar('emergency_contact_name', { length: 160 }),
        emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 60 }),
        emergencyContactMobileNo: varchar('emergency_contact_mobile_no', { length: 30 }),

        // Optional free-form notes (keep short, avoid PII dumps)
        notes: varchar('notes', { length: 500 }),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        personalEmailUq: uniqueIndex('employee_profiles_personal_email_uq').on(t.personalEmail),
        birthDateIdx: index('employee_profiles_birth_date_idx').on(t.birthDate),
        genderIdx: index('employee_profiles_gender_idx').on(t.gender),
    }),
);
