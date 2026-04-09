import {
    pgTable,
    uuid,
    timestamp,
    varchar,
    index,
} from 'drizzle-orm/pg-core';
import { expenseClaims } from './expense-claims';
import { users } from './users';

export const expenseReceipts = pgTable(
    'expense_receipts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        expenseClaimId: uuid('expense_claim_id')
            .notNull()
            .references(() => expenseClaims.id),
        fileUrl: varchar('file_url', { length: 500 }).notNull(),
        uploadedBy: uuid('uploaded_by')
            .notNull()
            .references(() => users.id),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        expenseClaimIdx: index('expense_receipts_expense_claim_idx').on(t.expenseClaimId),
        uploadedByIdx: index('expense_receipts_uploaded_by_idx').on(t.uploadedBy),
    }),
);
