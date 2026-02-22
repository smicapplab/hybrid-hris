import {
    pgTable,
    uuid,
    date,
    timestamp,
    uniqueIndex,
    index,
    check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { employees } from './employees';
import { leavePolicies } from './leave-policies';

export const employeeLeavePolicies = pgTable(
    'employee_leave_policies',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        employeeId: uuid('employee_id')
            .notNull()
            .references(() => employees.id, { onDelete: 'restrict' }),

        policyId: uuid('policy_id')
            .notNull()
            .references(() => leavePolicies.id, { onDelete: 'restrict' }),

        effectiveFrom: date('effective_from').notNull(),
        effectiveTo: date('effective_to'),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        employeeIdx: index('employee_leave_policies_employee_idx').on(t.employeeId),
        policyIdx: index('employee_leave_policies_policy_idx').on(t.policyId),
        deletedAtIdx: index('employee_leave_policies_deleted_at_idx').on(t.deletedAt),
        employeeEffectiveFromUq: uniqueIndex(
            'employee_leave_policies_employee_effective_from_uq',
        ).on(t.employeeId, t.effectiveFrom),
        effectiveDateOrderCheck: check(
            'employee_leave_policies_effective_date_order_check',
            sql`(effective_to IS NULL) OR (effective_to >= effective_from)`,
        ),
        noOverlapPerEmployee: sql`
            CONSTRAINT employee_leave_policies_no_overlap
            EXCLUDE USING gist (
                employee_id WITH =,
                daterange(
                    effective_from,
                    COALESCE(effective_to, 'infinity'::date)
                ) WITH &&
            )
        `,
    }),
);