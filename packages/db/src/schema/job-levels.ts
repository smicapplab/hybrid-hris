import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const jobLevels = pgTable(
    'job_levels',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description'),
        
        // Used for hierarchical sorting (e.g., 1 for Junior, 10 for Executive)
        rankOrder: integer('rank_order').notNull(),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('job_levels_code_uq').on(t.code).where(sql`deleted_at IS NULL`),
    }),
);

export type JobLevel = typeof jobLevels.$inferSelect;
export type NewJobLevel = typeof jobLevels.$inferInsert;
