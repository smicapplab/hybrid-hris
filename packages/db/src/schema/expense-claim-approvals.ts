import {
    pgTable,
    uuid,
    timestamp,
    varchar,
    pgEnum,
    integer,
    index,
} from 'drizzle-orm/pg-core';
import { expenseClaims } from './expense-claims';
import { users } from './users';
import { ExpenseApprovalStatus } from '@hybrid-hris/domain';

export const expenseApprovalStatusEnum = pgEnum('expense_approval_status', [
    ExpenseApprovalStatus.PENDING,
    ExpenseApprovalStatus.APPROVED,
    ExpenseApprovalStatus.REJECTED,
]);

export const expenseClaimApprovals = pgTable(
    'expense_claim_approvals',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        expenseClaimId: uuid('expense_claim_id')
            .notNull()
            .references(() => expenseClaims.id),
        approverUserId: uuid('approver_user_id')
            .notNull()
            .references(() => users.id),
        
        level: integer('level').notNull(), // 1: Supervisor, 2: Org Unit Head, 3: Finance
        status: expenseApprovalStatusEnum('status').default(ExpenseApprovalStatus.PENDING).notNull(),
        
        actedAt: timestamp('acted_at', { withTimezone: true }),
        remarks: varchar('remarks', { length: 500 }),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        expenseClaimIdx: index('expense_claim_approvals_claim_idx').on(t.expenseClaimId),
        approverIdx: index('expense_claim_approvals_approver_idx').on(t.approverUserId),
    }),
);
