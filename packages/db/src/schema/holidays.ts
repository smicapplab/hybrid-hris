import {
    pgTable,
    uuid,
    date,
    varchar,
    timestamp,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';
import { holidayTypeEnum } from './enums';

export const holidays = pgTable(
    'holidays',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        date: date('date').notNull(),

        name: varchar('name', { length: 150 }).notNull(),

        type: holidayTypeEnum('type').default('REGULAR').notNull(),

        countryCode: varchar('country_code', { length: 10 })
            .default('PH')
            .notNull(),

        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (t) => ({
        dateCountryUq: uniqueIndex('holidays_date_country_uq').on(
            t.date,
            t.countryCode,
        ),
        countryIdx: index('holidays_country_idx').on(t.countryCode),
        deletedAtIdx: index('holidays_deleted_at_idx').on(t.deletedAt),
    }),
);
