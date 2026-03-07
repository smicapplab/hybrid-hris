import {
    pgTable,
    uuid,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const expenseCategories = pgTable(
    'expense_categories',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        description: varchar('description', { length: 255 }),
        isActive: boolean('is_active').default(true).notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('expense_categories_code_uq').on(t.code),
    }),
);
