import {
    pgTable,
    uuid,
    timestamp,
    integer,
    pgEnum,
    index,
    uniqueIndex,
    check,
    text,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { leaveRequests } from './leave-requests';
import { users } from './users';

export const leaveApprovalStatusEnum = pgEnum('leave_approval_status', [
    'PENDING',
    'APPROVED',
    'REJECTED',
]);

export const leaveRequestApprovals = pgTable(
    'leave_request_approvals',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        leaveRequestId: uuid('leave_request_id')
            .notNull()
            .references(() => leaveRequests.id, { onDelete: 'cascade' }),

        approverUserId: uuid('approver_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),

        level: integer('level').notNull(),

        status: leaveApprovalStatusEnum('status')
            .default('PENDING')
            .notNull(),

        actedAt: timestamp('acted_at', { withTimezone: true }),

        remarks: text('remarks'),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        requestIdx: index('leave_request_approvals_request_idx').on(
            t.leaveRequestId,
        ),
        approverIdx: index('leave_request_approvals_approver_idx').on(
            t.approverUserId,
        ),
        requestLevelUq: uniqueIndex(
            'leave_request_approvals_request_level_uq',
        ).on(t.leaveRequestId, t.level),

        statusActedAtConsistencyCheck: check(
            'leave_request_approvals_status_acted_at_consistency_check',
            sql`
                (status = 'PENDING' AND acted_at IS NULL)
                OR
                (status <> 'PENDING' AND acted_at IS NOT NULL)
            `,
        ),
    }),
);
