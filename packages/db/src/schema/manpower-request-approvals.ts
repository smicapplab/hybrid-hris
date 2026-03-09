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
import { manpowerRequests } from './manpower-requests';
import { users } from './users';
import { MANPOWER_APPROVAL_STATUSES } from '@hybrid-hris/domain';

export const manpowerApprovalStatusEnum = pgEnum(
    'manpower_approval_status',
    MANPOWER_APPROVAL_STATUSES,
);

export const manpowerRequestApprovals = pgTable(
    'manpower_request_approvals',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        manpowerRequestId: uuid('manpower_request_id')
            .notNull()
            .references(() => manpowerRequests.id, { onDelete: 'cascade' }),

        approverUserId: uuid('approver_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),

        level: integer('level').notNull(),

        status: manpowerApprovalStatusEnum('status')
            .default('PENDING')
            .notNull(),

        actedAt: timestamp('acted_at', { withTimezone: true }),

        remarks: text('remarks'),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        requestIdx: index('manpower_request_approvals_request_idx').on(
            t.manpowerRequestId,
        ),
        approverIdx: index('manpower_request_approvals_approver_idx').on(
            t.approverUserId,
        ),
        requestLevelUq: uniqueIndex(
            'manpower_request_approvals_request_level_uq',
        ).on(t.manpowerRequestId, t.level),

        statusActedAtConsistencyCheck: check(
            'manpower_request_approvals_status_acted_at_consistency_check',
            sql`
                (status = 'PENDING' AND acted_at IS NULL)
                OR
                (status <> 'PENDING' AND acted_at IS NOT NULL)
            `,
        ),
    }),
);
