import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { jobLevels } from './job-levels';

export const compensationTemplates = pgTable(
    'compensation_templates',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        code: varchar('code', { length: 50 }).notNull(),
        name: varchar('name', { length: 150 }).notNull(),
        description: text('description'),
        
        // A template can be linked to a job level for automatic assignment
        jobLevelId: uuid('job_level_id')
            .references(() => jobLevels.id, { onDelete: 'set null' }),

        deletedAt: timestamp('deleted_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => ({
        codeUq: uniqueIndex('compensation_templates_code_uq').on(t.code).where(sql`deleted_at IS NULL`),
        jobLevelUq: uniqueIndex('compensation_templates_job_level_uq').on(t.jobLevelId).where(sql`deleted_at IS NULL`),
    }),
);

export type CompensationTemplate = typeof compensationTemplates.$inferSelect;
export type NewCompensationTemplate = typeof compensationTemplates.$inferInsert;
