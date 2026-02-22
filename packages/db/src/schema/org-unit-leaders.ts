import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    date,
    index,
    foreignKey,
    pgEnum,
    unique,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orgUnits } from './org-units';
import { employees } from './employees';

export const orgUnitLeaderRoleEnum = pgEnum('org_unit_leader_role', [
    'HEAD',
    'CO_HEAD',
    'ACTING_HEAD',
]);

export const orgUnitLeaders = pgTable(
    'org_unit_leaders',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        orgUnitId: uuid('org_unit_id').notNull(),
        employeeId: uuid('employee_id').notNull(),

        // Leadership type (HEAD, CO_HEAD, ACTING_HEAD, etc.)
        role: orgUnitLeaderRoleEnum('role').notNull(),

        // Only one primary leader per org unit (enforced at service layer)
        isPrimary: boolean('is_primary').default(false).notNull(),

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
        orgUnitIdx: index('org_unit_leaders_org_unit_idx').on(t.orgUnitId),
        employeeIdx: index('org_unit_leaders_employee_idx').on(t.employeeId),

        uniqueLeadership: unique('org_unit_leaders_unique').on(
            t.orgUnitId,
            t.employeeId,
            t.role,
            t.effectiveFrom,
        ),

        effectiveDateOrderCheck: check(
            'org_unit_leaders_effective_date_order_check',
            sql`(effective_to IS NULL) OR (effective_to >= effective_from)`
        ),

        orgUnitFk: foreignKey({
            columns: [t.orgUnitId],
            foreignColumns: [orgUnits.id],
            name: 'org_unit_leaders_org_unit_fk',
        }).onDelete('cascade'),

        employeeFk: foreignKey({
            columns: [t.employeeId],
            foreignColumns: [employees.id],
            name: 'org_unit_leaders_employee_fk',
        }).onDelete('cascade'),
    }),
);