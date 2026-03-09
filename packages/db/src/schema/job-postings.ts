import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    pgEnum,
    text,
    numeric,
    index,
} from 'drizzle-orm/pg-core';
import { manpowerRequests } from './manpower-requests';
import { JOB_POSTING_STATUSES } from '@hybrid-hris/domain';
import { employmentTypeEnum } from './employees';

export const jobPostingStatusEnum = pgEnum(
    'job_posting_status',
    JOB_POSTING_STATUSES,
);

export const jobPostings = pgTable(
    'job_postings',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        manpowerRequestId: uuid('manpower_request_id')
            .notNull()
            .references(() => manpowerRequests.id, { onDelete: 'cascade' }),

        title: varchar('title', { length: 200 }).notNull(),
        slug: varchar('slug', { length: 255 }).notNull(),

        employmentType: employmentTypeEnum('employment_type').notNull(),
        location: varchar('location', { length: 200 }),
        remoteType: varchar('remote_type', { length: 50 }), // e.g. REMOTE, HYBRID, ONSITE

        description: text('description').notNull(),
        responsibilities: text('responsibilities'),
        qualifications: text('qualifications'),

        salaryMin: numeric('salary_min', { precision: 12, scale: 2 }),
        salaryMax: numeric('salary_max', { precision: 12, scale: 2 }),
        currency: varchar('currency', { length: 3 }).default('PHP').notNull(),

        status: jobPostingStatusEnum('status').default('DRAFT').notNull(),

        externalSyncStatus: varchar('external_sync_status', { length: 50 }).default('NOT_SYNCED').notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (t) => ({
        requestIdx: index('job_postings_request_idx').on(t.manpowerRequestId),
        slugIdx: index('job_postings_slug_idx').on(t.slug),
        statusIdx: index('job_postings_status_idx').on(t.status),
    }),
);
