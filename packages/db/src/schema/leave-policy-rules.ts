import {
    pgTable,
    uuid,
    numeric,
    boolean,
    timestamp,
    uniqueIndex,
    pgEnum,
    check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import { leavePolicies } from './leave-policies';
import { leaveTypes } from './leave-types';

export const accrualMethodEnum = pgEnum('accrual_method', [
    'MONTHLY',
    'ANNUAL_GRANT',
    'NONE',
]);

export const leavePolicyRules = pgTable(
    'leave_policy_rules',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        policyId: uuid('policy_id')
            .notNull()
            .references(() => leavePolicies.id, { onDelete: 'cascade' }),

        leaveTypeId: uuid('leave_type_id')
            .notNull()
            .references(() => leaveTypes.id, { onDelete: 'restrict' }),

        accrualMethod: accrualMethodEnum('accrual_method').notNull(),

        accrualRatePerMonth: numeric('accrual_rate_per_month', {
            precision: 10,
            scale: 4,
        }),

        annualGrantAmount: numeric('annual_grant_amount', {
            precision: 10,
            scale: 4,
        }),

        maxBalance: numeric('max_balance', {
            precision: 10,
            scale: 4,
        }),

        maxCarryOver: numeric('max_carry_over', {
            precision: 10,
            scale: 4,
        }),

        allowNegativeBalance: boolean('allow_negative_balance')
            .default(false)
            .notNull(),

        isRegularOnly: boolean('is_regular_only').default(false).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        policyLeaveTypeUq: uniqueIndex(
            'leave_policy_rules_policy_leave_type_uq',
        ).on(t.policyId, t.leaveTypeId),

        accrualMethodConsistencyCheck: check(
            'leave_policy_rules_accrual_method_consistency_check',
            sql`
                (accrual_method <> 'MONTHLY' OR accrual_rate_per_month IS NOT NULL)
                AND
                (accrual_method <> 'ANNUAL_GRANT' OR annual_grant_amount IS NOT NULL)
            `,
        ),
    }),
);